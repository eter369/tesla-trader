import { useState, useEffect, useMemo, useCallback } from "react";
import { Newspaper, Clock, Star, RefreshCw, ExternalLink } from "lucide-react";

const IMPACT = {
  bullish: { color: "#10b981", arrow: "↑" },
  bearish: { color: "#ef4444", arrow: "↓" },
  neutral: { color: "#a78bfa", arrow: "→" },
};

const COIN_COLORS = {
  BTC: "#f7931a", ETH: "#627eea", SOL: "#9945ff", BNB: "#f0b90b",
  XRP: "#00aae4", ADA: "#0033ad", DOGE: "#c2a633", DOT: "#e6007a",
  AVAX: "#e84142", LINK: "#2a5ada", MATIC: "#8247e5", UNI: "#ff007a",
};

const COIN_KEYWORDS = {
  BTC: ["bitcoin", "btc", "satoshi"],
  ETH: ["ethereum", "eth", "vitalik"],
  SOL: ["solana", "sol"],
  BNB: ["binance", "bnb"],
  XRP: ["ripple", "xrp"],
  ADA: ["cardano", "ada"],
  DOGE: ["dogecoin", "doge"],
  AVAX: ["avalanche", "avax"],
  LINK: ["chainlink", "link"],
  DOT: ["polkadot"],
};

const BULLISH_WORDS = ["surge", "rally", "soar", "bull", "gain", "record", "high", "pump", "breakout", "approval", "adopt", "launch", "partner", "milestone", "growth", "profit", "boom", "etf approved", "institutional", "sube", "alza", "récord", "all-time", "ath"];
const BEARISH_WORDS = ["crash", "drop", "plunge", "bear", "fall", "hack", "exploit", "ban", "lawsuit", "sec charges", "fraud", "scam", "dump", "selloff", "baja", "caída", "liquidat", "bankrupt", "collapse"];

// Keywords that indicate HIGH IMPACT for crypto trading
const HIGH_IMPACT_WORDS = [
  // Regulation & policy
  "etf", "sec", "regulation", "regulat", "congress", "senate", "bill", "law", "legal", "ban",
  "stablecoin", "cbdc", "fed", "federal reserve", "treasury", "executive order", "framework",
  // Institutional & adoption
  "institutional", "blackrock", "fidelity", "jpmorgan", "goldman", "morgan stanley", "bank",
  "custody", "wall street", "pension", "sovereign", "adoption", "mainstream",
  // Major market events
  "halving", "etf approv", "etf reject", "listing", "delist", "liquidat", "billion",
  "million", "record", "all-time", "ath", "crash", "rally", "surge", "plunge",
  // Security & hacks
  "hack", "exploit", "breach", "stolen", "vulnerability", "attack",
  // Major projects
  "bitcoin", "ethereum", "solana", "merge", "upgrade", "fork", "layer 2", "l2",
  // Macro
  "inflation", "interest rate", "rate cut", "recession", "tariff", "trade war",
  "china", "trump", "biden",
];

// Filter out non-crypto noise
const NOISE_WORDS = [
  "horoscope", "zodiac", "celebrity gossip", "movie review", "sports score",
  "weather forecast", "recipe", "fashion", "beauty tips",
];

function calcImpactScore(title) {
  const lower = title.toLowerCase();
  let score = 0;

  // High impact keyword matches (core trading relevance)
  for (const word of HIGH_IMPACT_WORDS) {
    if (lower.includes(word)) score += 3;
  }

  // Coin mentions boost relevance
  for (const keywords of Object.values(COIN_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) score += 2;
  }

  // Sentiment words = market-moving
  for (const w of BULLISH_WORDS) { if (lower.includes(w)) score += 1; }
  for (const w of BEARISH_WORDS) { if (lower.includes(w)) score += 1; }

  // Numbers with $ or % indicate market data
  if (/\$[\d,.]+[bmtk]/i.test(lower) || /\d+%/.test(lower)) score += 2;

  // Noise penalty
  for (const w of NOISE_WORDS) { if (lower.includes(w)) score -= 10; }

  return score;
}

// RSS feeds from top crypto news sources
const RSS_FEEDS = [
  { url: "https://cointelegraph.com/rss", source: "CoinTelegraph", priority: 1 },
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", source: "CoinDesk", priority: 1 },
  { url: "https://decrypt.co/feed", source: "Decrypt", priority: 2 },
  { url: "https://bitcoinmagazine.com/.rss/full/", source: "Bitcoin Magazine", priority: 2 },
];

const SOURCE_COLORS = {
  CoinTelegraph: "#1a1a2e",
  CoinDesk: "#0a2540",
  Decrypt: "#1e293b",
  "Bitcoin Magazine": "#f7931a",
  CryptoPanic: "#3b82f6",
};

function formatTimeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "ahora";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

function getWeekRange() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${start.getDate()} ${months[start.getMonth()]} - ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

function detectCoins(title) {
  const lower = title.toLowerCase();
  const found = [];
  for (const [symbol, keywords] of Object.entries(COIN_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) found.push(symbol);
  }
  return found;
}

function detectSentiment(title) {
  const lower = title.toLowerCase();
  const bull = BULLISH_WORDS.filter(w => lower.includes(w)).length;
  const bear = BEARISH_WORDS.filter(w => lower.includes(w)).length;
  if (bull > bear) return "bullish";
  if (bear > bull) return "bearish";
  return "neutral";
}

function PriceTicker({ livePrices, marketData }) {
  const tickers = useMemo(() => {
    const map = { bitcoin: "BTC", ethereum: "ETH", solana: "SOL" };
    const colors = { bitcoin: "#f7931a", ethereum: "#627eea", solana: "#9945ff" };
    return Object.entries(map).map(([id, symbol]) => {
      const live = livePrices?.[id];
      const market = marketData?.[id];
      const price = live?.price ?? market?.current_price ?? 0;
      const change = live?.change24h ?? market?.price_change_percentage_24h ?? 0;
      const up = change >= 0;
      return { symbol, price, change, up, color: colors[id] };
    });
  }, [livePrices, marketData]);

  const formatPrice = (p) => {
    if (p >= 1000) return "$" + p.toLocaleString("en-US", { maximumFractionDigits: 0 });
    if (p >= 1) return "$" + p.toFixed(2);
    return "$" + p.toFixed(4);
  };

  return (
    <div className="grid grid-cols-3 gap-1.5 mb-3">
      {tickers.map((t) => (
        <div key={t.symbol} className="rounded-lg p-2 text-center"
          style={{ background: `linear-gradient(135deg, ${t.color}08, ${t.color}04)`, border: `1px solid ${t.color}15` }}>
          <div className="text-[10px] font-bold text-gray-400 tracking-wider">{t.symbol}</div>
          <div className="text-xs font-black text-gray-200 tabular-nums mt-0.5">{formatPrice(t.price)}</div>
          <div className="text-[10px] font-bold tabular-nums mt-0.5" style={{ color: t.up ? "#10b981" : "#ef4444" }}>
            {t.up ? "↑" : "↓"} {t.up ? "+" : ""}{t.change.toFixed(1)}%
          </div>
        </div>
      ))}
    </div>
  );
}

function NewsRow({ d, isTop, delay }) {
  const impact = IMPACT[d.i] || IMPACT.neutral;
  return (
    <a href={d.url} target="_blank" rel="noopener noreferrer"
      className="group relative block py-2.5 border-b border-gray-800/20 last:border-0 animate-slide-in cursor-pointer"
      style={{ animationDelay: `${delay}s` }}>
      <div className="flex items-start gap-2.5">
        <div className="mt-1 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-black"
          style={{ background: `${impact.color}15`, color: impact.color }}>
          {impact.arrow}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            {isTop && (
              <span className="text-[8px] font-black tracking-widest text-amber-400 bg-amber-400/10 px-1.5 py-px rounded flex items-center gap-0.5">
                <Star size={7} fill="currentColor" /> TOP
              </span>
            )}
            {d.source && (
              <span className="text-[7px] font-bold tracking-wider px-1.5 py-px rounded"
                style={{ color: "#9ca3af", background: "#ffffff06" }}>
                {d.source}
              </span>
            )}
            <span className="text-[9px] text-gray-700 font-mono ml-auto">{d.ago}</span>
          </div>
          <h4 className="text-[11px] font-bold text-gray-200 leading-snug mb-1 group-hover:text-amber-300/90 transition-colors">
            {d.t}
          </h4>
          <div className="flex items-center gap-1 flex-wrap">
            {d.coins?.slice(0, 3).map((c) => (
              <span key={c} className="text-[7px] font-bold px-1.5 py-px rounded"
                style={{ color: COIN_COLORS[c] || "#9ca3af", background: (COIN_COLORS[c] || "#9ca3af") + "12" }}>
                {c}
              </span>
            ))}
            <span className="text-[8px] text-gray-700 font-mono ml-auto">
              {d.date}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

async function fetchRSS(feed) {
  const res = await fetch(
    `https://api.allorigins.win/raw?url=${encodeURIComponent(feed.url)}`
  );
  if (!res.ok) throw new Error("RSS fetch failed");
  const xml = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const items = doc.querySelectorAll("item");
  if (!items.length) throw new Error("No items");

  const articles = [];
  items.forEach((item, idx) => {
    if (idx >= 20) return;
    const title = item.querySelector("title")?.textContent?.trim() || "";
    const link = item.querySelector("link")?.textContent?.trim() || "";
    const pubDate = item.querySelector("pubDate")?.textContent?.trim() || "";
    if (!title) return;
    const score = calcImpactScore(title);
    // Skip articles with negative score (noise)
    if (score < 0) return;
    articles.push({
      t: title,
      i: detectSentiment(title),
      coins: detectCoins(title),
      date: formatDate(pubDate),
      time: formatTime(pubDate),
      ago: formatTimeAgo(pubDate),
      url: link,
      source: feed.source,
      priority: feed.priority,
      ts: new Date(pubDate).getTime(),
      score,
    });
  });
  return articles;
}

async function fetchCryptoNews() {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

  let allArticles = [];

  // Fetch from RSS feeds in parallel
  const results = await Promise.allSettled(RSS_FEEDS.map(f => fetchRSS(f)));
  for (const result of results) {
    if (result.status === "fulfilled") {
      allArticles.push(...result.value);
    }
  }

  // Fallback: CryptoPanic
  if (allArticles.length === 0) {
    try {
      const res = await fetch(
        "https://cryptopanic.com/api/free/v1/posts/?auth_token=free&public=true&kind=news&filter=important&regions=en"
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.results?.length) {
          allArticles = data.results.map(item => {
            const coins = (item.currencies || []).map(c => c.code).filter(Boolean);
            const votes = item.votes || {};
            const pos = (votes.positive || 0) + (votes.important || 0);
            const neg = (votes.negative || 0) + (votes.toxic || 0);
            return {
              t: item.title || "",
              i: pos > neg + 1 ? "bullish" : neg > pos + 1 ? "bearish" : "neutral",
              coins,
              date: formatDate(item.published_at || item.created_at),
              time: formatTime(item.published_at || item.created_at),
              ago: formatTimeAgo(item.published_at || item.created_at),
              url: item.url,
              source: "CryptoPanic",
              priority: 1,
              ts: new Date(item.published_at || item.created_at).getTime(),
            };
          });
        }
      }
    } catch {}
  }

  // Last fallback: CoinGecko trending
  if (allArticles.length === 0) {
    try {
      const res = await fetch("https://api.coingecko.com/api/v3/search/trending");
      if (res.ok) {
        const data = await res.json();
        if (data?.coins?.length > 0) {
          allArticles = data.coins.slice(0, 8).map(c => {
            const coin = c.item;
            const change = coin.data?.price_change_percentage_24h?.usd || 0;
            return {
              t: `${coin.name} (${coin.symbol}) trending — ${change >= 0 ? "+" : ""}${change.toFixed(1)}% en 24h`,
              i: change > 2 ? "bullish" : change < -2 ? "bearish" : "neutral",
              coins: [coin.symbol?.toUpperCase()],
              date: formatDate(new Date().toISOString()),
              time: formatTime(new Date().toISOString()),
              ago: "ahora",
              source: "CoinGecko",
              priority: 3,
              ts: now,
            };
          });
        }
      }
    } catch {}
  }

  if (allArticles.length === 0) return null;

  // Deduplicate by title similarity
  const seen = new Set();
  allArticles = allArticles.filter(a => {
    const key = a.t.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Filter to last 7 days and only crypto-relevant (score > 0)
  const weekArticles = allArticles.filter(a => a.ts >= oneWeekAgo && (a.score || 0) >= 0);
  const todayArticles = weekArticles.filter(a => a.ts >= oneDayAgo);

  // TOP NOTICIAS DE LA SEMANA: highest impact score across ALL 7 days
  const weeklyTop = [...weekArticles]
    .sort((a, b) => (b.score || 0) - (a.score || 0) || (b.ts - a.ts))
    .slice(0, 6);

  // NOTICIAS DE HOY: today's news not already in weekly, sorted by impact then recency
  const weeklyUrls = new Set(weeklyTop.map(a => a.url));
  const dailyNews = todayArticles
    .filter(a => !weeklyUrls.has(a.url))
    .sort((a, b) => (b.score || 0) - (a.score || 0) || (b.ts - a.ts))
    .slice(0, 5);

  // Determine primary source
  const sources = new Set(allArticles.map(a => a.source));
  const sourceStr = [...sources].slice(0, 3).join(" · ");

  return {
    top: weeklyTop,
    other: dailyNews,
    week: getWeekRange(),
    source: sourceStr,
    lastUpdate: new Date().toISOString(),
  };
}

export default function CryptoNews({ livePrices, marketData }) {
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadNews = useCallback(async () => {
    setLoading(true);
    const data = await fetchCryptoNews();
    if (data) setNews(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNews();
    const interval = setInterval(loadNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadNews]);

  const updated = new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="card rounded-2xl overflow-hidden flex flex-col h-full">
      <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, #7c3aed40, #a855f730, transparent)" }} />

      <div className="p-4 flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Newspaper size={14} className="text-purple-400" />
            <h3 className="text-sm font-black text-gray-200 tracking-tight">Crypto Weekly</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadNews} className="p-1 rounded hover:bg-white/5 transition-colors text-gray-600 hover:text-gray-400" title="Actualizar noticias">
              <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
            </button>
            <span className="text-[9px] text-gray-600 font-mono flex items-center gap-1">
              <Clock size={9} /> {updated}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* Week range + sources */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] text-gray-600 font-mono tracking-wider">{news?.week || "---"}</span>
          {news?.source && (
            <span className="text-[7px] text-gray-700 font-mono truncate ml-2 max-w-[160px]">{news.source}</span>
          )}
        </div>

        {/* Live Price Ticker */}
        <PriceTicker livePrices={livePrices} marketData={marketData} />

        <div className="h-px mb-3" style={{ background: "linear-gradient(90deg, #7c3aed15, #ffffff08, transparent)" }} />

        {/* News Feed */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {loading && !news ? (
            <div className="space-y-4 py-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className="skeleton w-5 h-5 rounded flex-shrink-0" style={{ animationDelay: `${i * 0.15}s` }} />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-2 w-1/3" />
                    <div className="skeleton h-3 w-full" />
                    <div className="skeleton h-2 w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : news ? (
            <>
              {news.top.length > 0 && (
                <>
                  <div className="text-[8px] font-black tracking-[3px] text-amber-400/50 mb-1">TOP NOTICIAS DE LA SEMANA</div>
                  {news.top.map((d, i) => (
                    <NewsRow key={`top-${i}`} d={d} isTop delay={i * 0.05} />
                  ))}
                </>
              )}

              {news.other.length > 0 && (
                <>
                  <div className="h-px my-2" style={{ background: "linear-gradient(90deg, transparent, #7c3aed15, transparent)" }} />
                  <div className="text-[8px] font-black tracking-[3px] text-purple-400/40 mb-1">NOTICIAS DE HOY</div>
                  {news.other.map((d, i) => (
                    <NewsRow key={`other-${i}`} d={d} isTop={false} delay={(i + 3) * 0.05} />
                  ))}
                </>
              )}
            </>
          ) : (
            <div className="text-center py-6 text-gray-600 text-xs">Sin noticias disponibles</div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-auto border-t border-gray-800/20 text-center">
          <span className="text-[8px] text-gray-700 font-mono tracking-[2px]">
            CRYPTO WEEKLY · {new Date().toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }).toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
