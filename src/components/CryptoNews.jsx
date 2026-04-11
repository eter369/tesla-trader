import { useState, useEffect, useMemo, useCallback } from "react";
import { Newspaper, Clock, TrendingUp, TrendingDown, Minus, Star, RefreshCw } from "lucide-react";

const IMPACT = {
  bullish: { color: "#10b981", arrow: "↑" },
  bearish: { color: "#ef4444", arrow: "↓" },
  neutral: { color: "#a78bfa", arrow: "→" },
};

const COIN_COLORS = {
  BTC: "#f7931a", ETH: "#627eea", SOL: "#9945ff", BNB: "#f0b90b",
  XRP: "#00aae4", ADA: "#0033ad", DOGE: "#c2a633", DOT: "#e6007a",
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
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

function getWeekRange() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${start.getDate()} ${months[start.getMonth()]} - ${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()}`;
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
    <div className="group relative py-3 border-b border-gray-800/20 last:border-0 animate-slide-in"
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
            <span className="text-[9px] text-gray-600 font-mono">
              {d.date} · {d.time}
            </span>
            <span className="text-[9px] text-gray-700 font-mono ml-auto">{d.ago}</span>
          </div>
          <h4 className="text-[12px] font-bold text-gray-200 leading-snug mb-1 group-hover:text-amber-300/90 transition-colors">
            {d.t}
          </h4>
          {d.coins && d.coins.length > 0 && (
            <div className="flex gap-1 mt-1">
              {d.coins.slice(0, 3).map((c) => (
                <span key={c} className="text-[8px] font-bold px-1.5 py-px rounded"
                  style={{ color: COIN_COLORS[c] || "#9ca3af", background: (COIN_COLORS[c] || "#9ca3af") + "12" }}>
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function parseArticle(item) {
  const coins = (item.currencies || []).map(c => c.code).filter(Boolean);
  const votes = item.votes || {};
  const positive = (votes.positive || 0) + (votes.important || 0);
  const negative = (votes.negative || 0) + (votes.toxic || 0);
  let impact = "neutral";
  if (positive > negative + 1) impact = "bullish";
  else if (negative > positive + 1) impact = "bearish";

  return {
    t: item.title || "",
    i: impact,
    coins,
    date: formatDate(item.published_at || item.created_at),
    time: formatTime(item.published_at || item.created_at),
    ago: formatTimeAgo(item.published_at || item.created_at),
    url: item.url,
    ts: new Date(item.published_at || item.created_at).getTime(),
  };
}

async function fetchFromCryptoPanic(filter) {
  const res = await fetch(
    `https://cryptopanic.com/api/free/v1/posts/?auth_token=free&public=true&kind=news&filter=${filter}&regions=en`
  );
  if (!res.ok) throw new Error("API error");
  const data = await res.json();
  if (!data?.results?.length) throw new Error("No results");
  return data.results.map(parseArticle);
}

async function fetchCryptoNews() {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  let weeklyTop = [];
  let dailyNews = [];
  let source = null;

  // Fetch important news (weekly top stories)
  try {
    weeklyTop = await fetchFromCryptoPanic("important");
    source = "CryptoPanic";
  } catch {
    try {
      weeklyTop = await fetchFromCryptoPanic("hot");
      source = "CryptoPanic";
    } catch {}
  }

  // Fetch rising/recent news (today's news)
  try {
    const rising = await fetchFromCryptoPanic("rising");
    dailyNews = rising.filter(a => a.ts >= oneDayAgo);
    if (!source) source = "CryptoPanic";
  } catch {}

  // If we got weekly but no daily, split by date
  if (weeklyTop.length > 0 && dailyNews.length === 0) {
    dailyNews = weeklyTop.filter(a => a.ts >= oneDayAgo);
    weeklyTop = weeklyTop.filter(a => a.ts < oneDayAgo);
    // If all are from today, keep top 3 as weekly highlights
    if (weeklyTop.length === 0) {
      weeklyTop = dailyNews.slice(0, 3);
      dailyNews = dailyNews.slice(3);
    }
  }

  // Remove duplicates from daily that already appear in weekly
  const weeklyTitles = new Set(weeklyTop.map(a => a.t));
  dailyNews = dailyNews.filter(a => !weeklyTitles.has(a.t));

  // Fallback: CoinGecko trending
  if (weeklyTop.length === 0 && dailyNews.length === 0) {
    try {
      const res = await fetch("https://api.coingecko.com/api/v3/search/trending");
      if (res.ok) {
        const data = await res.json();
        if (data?.coins?.length > 0) {
          const trending = data.coins.slice(0, 6).map((c) => {
            const coin = c.item;
            const change = coin.data?.price_change_percentage_24h?.usd || 0;
            return {
              t: `${coin.name} (${coin.symbol}) trending — ${change >= 0 ? "+" : ""}${change.toFixed(1)}% en 24h`,
              i: change > 2 ? "bullish" : change < -2 ? "bearish" : "neutral",
              coins: [coin.symbol?.toUpperCase()],
              date: formatDate(new Date().toISOString()),
              time: formatTime(new Date().toISOString()),
              ago: "ahora",
              ts: now,
            };
          });
          weeklyTop = trending.slice(0, 3);
          dailyNews = trending.slice(3);
          source = "CoinGecko Trending";
        }
      }
    } catch {}
  }

  if (weeklyTop.length === 0 && dailyNews.length === 0) return null;

  return {
    top: weeklyTop.slice(0, 5),
    other: dailyNews.slice(0, 5),
    week: getWeekRange(),
    source,
    lastUpdate: new Date().toISOString(),
  };
}

export default function CryptoNews({ livePrices, marketData }) {
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const loadNews = useCallback(async () => {
    setLoading(true);
    const data = await fetchCryptoNews();
    if (data) {
      setNews(data);
      setLastRefresh(new Date());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNews();
    // Refresh every 5 minutes
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

        {/* Week range + source */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] text-gray-600 font-mono tracking-wider">{news?.week || "---"}</span>
          {news?.source && (
            <span className="text-[8px] text-gray-700 font-mono">{news.source}</span>
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
              <div className="text-[8px] font-black tracking-[3px] text-amber-400/50 mb-1">TOP NOTICIAS DE LA SEMANA</div>
              {news.top.map((d, i) => (
                <NewsRow key={`top-${i}`} d={d} isTop delay={i * 0.06} />
              ))}

              {news.other.length > 0 && (
                <>
                  <div className="h-px my-2" style={{ background: "linear-gradient(90deg, transparent, #7c3aed15, transparent)" }} />
                  <div className="text-[8px] font-black tracking-[3px] text-purple-400/40 mb-1">NOTICIAS DE HOY</div>
                  {news.other.map((d, i) => (
                    <NewsRow key={`other-${i}`} d={d} isTop={false} delay={(i + 3) * 0.06} />
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
