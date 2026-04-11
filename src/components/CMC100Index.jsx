import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, BarChart3, Zap, Clock } from "lucide-react";

function MiniSparkline({ data, color, width = 120, height = 32 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data.map((v, i) => `${i * stepX},${height - ((v - min) / range) * (height - 4) - 2}`).join(" ");
  return (
    <svg width={width} height={height} className="block">
      <defs>
        <linearGradient id="cmc100-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill="url(#cmc100-grad)"
      />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChangeTag({ label, value }) {
  if (value === null || value === undefined) return null;
  const up = value >= 0;
  return (
    <div className="flex flex-col items-center px-2 py-1.5 rounded-lg" style={{ background: up ? "#10b98108" : "#ef444408" }}>
      <span className="text-[8px] text-gray-600 font-mono tracking-wider">{label}</span>
      <span className="text-[11px] font-black tabular-nums" style={{ color: up ? "#10b981" : "#ef4444" }}>
        {up ? "+" : ""}{value.toFixed(2)}%
      </span>
    </div>
  );
}

export default function CMC100Index() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    const cmcKey = localStorage.getItem("cmc-api-key");

    // Try CMC100 API
    if (cmcKey) {
      try {
        const res = await fetch("https://pro-api.coinmarketcap.com/v3/index/cmc100-latest", {
          headers: { "X-CMC_PRO_API_KEY": cmcKey, Accept: "application/json" },
        });
        if (res.ok) {
          const json = await res.json();
          const d = json?.data;
          if (d) {
            const usd = d.quote?.USD || {};
            setData({
              name: d.name || "CMC 100",
              symbol: d.symbol || "CMC100",
              price: usd.price || 0,
              change1h: usd.percent_change_1h ?? null,
              change24h: usd.percent_change_24h ?? null,
              change7d: usd.percent_change_7d ?? null,
              change30d: usd.percent_change_30d ?? null,
              lastUpdated: d.last_updated,
            });
            setSource("CoinMarketCap");
            setLoading(false);
            return;
          }
        }
      } catch {}
    }

    // Fallback: simulate index from CoinGecko top coins market data
    try {
      const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true&price_change_percentage=1h,24h,7d,30d");
      if (res.ok) {
        const coins = await res.json();
        if (coins?.length > 0) {
          const totalMcap = coins.reduce((s, c) => s + (c.market_cap || 0), 0);
          let wChange24h = 0, wChange7d = 0, wChange1h = 0, wChange30d = 0;
          const sparklineAgg = [];

          coins.forEach(c => {
            const weight = (c.market_cap || 0) / totalMcap;
            wChange1h += (c.price_change_percentage_1h_in_currency || 0) * weight;
            wChange24h += (c.price_change_percentage_24h || 0) * weight;
            wChange7d += (c.price_change_percentage_7d_in_currency || 0) * weight;
            wChange30d += (c.price_change_percentage_30d_in_currency || 0) * weight;

            if (c.sparkline_in_7d?.price) {
              const sp = c.sparkline_in_7d.price;
              for (let i = 0; i < sp.length; i++) {
                sparklineAgg[i] = (sparklineAgg[i] || 0) + sp[i] * weight;
              }
            }
          });

          // Normalize sparkline to index-like values (base 1000)
          const firstVal = sparklineAgg[0] || 1;
          const indexSparkline = sparklineAgg.map(v => (v / firstVal) * 1000);

          setData({
            name: "Crypto Top 20 Index",
            symbol: "TOP20",
            price: indexSparkline[indexSparkline.length - 1] || 1000,
            change1h: wChange1h,
            change24h: wChange24h,
            change7d: wChange7d,
            change30d: wChange30d,
            sparkline: indexSparkline,
            topCoins: coins.slice(0, 5).map(c => ({
              symbol: c.symbol?.toUpperCase(),
              name: c.name,
              price: c.current_price,
              change24h: c.price_change_percentage_24h,
              mcap: c.market_cap,
              image: c.image,
            })),
            lastUpdated: new Date().toISOString(),
          });
          setSource("CoinGecko");
          setLoading(false);
          return;
        }
      }
    } catch {}

    setLoading(false);
  }

  const COIN_COLORS = { BTC: "#f7931a", ETH: "#627eea", USDT: "#26a17b", BNB: "#f0b90b", SOL: "#9945ff", XRP: "#00aae4", USDC: "#2775ca", ADA: "#0033ad", DOGE: "#c2a633", AVAX: "#e84142" };

  const change24h = data?.change24h ?? 0;
  const up = change24h >= 0;
  const lineColor = up ? "#10b981" : "#ef4444";

  return (
    <div className="card rounded-2xl overflow-hidden mt-4">
      <div className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${up ? "#10b98140" : "#ef444440"}, ${up ? "#22d3ee30" : "#f59e0b30"}, transparent)` }} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${lineColor}15` }}>
              <Zap size={12} style={{ color: lineColor }} />
            </div>
            <div>
              <h3 className="text-xs font-black text-gray-200 tracking-tight">{data?.name || "Crypto Index"}</h3>
              <span className="text-[8px] text-gray-600 font-mono">{data?.symbol || "---"}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {source && <span className="text-[8px] text-gray-600 font-mono">{source}</span>}
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: lineColor }} />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 py-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-4 rounded" style={{ width: `${80 - i * 15}%`, animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        ) : data ? (
          <>
            {/* Index Value + 24h change */}
            <div className="flex items-end justify-between mb-3">
              <div>
                <div className="text-2xl font-black tabular-nums text-gray-100">
                  {data.price >= 100 ? data.price.toLocaleString("en-US", { maximumFractionDigits: 0 }) : data.price.toFixed(2)}
                </div>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: `${lineColor}12` }}>
                {up ? <TrendingUp size={12} style={{ color: lineColor }} /> : <TrendingDown size={12} style={{ color: lineColor }} />}
                <span className="text-sm font-black tabular-nums" style={{ color: lineColor }}>
                  {up ? "+" : ""}{change24h.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Sparkline */}
            {data.sparkline && (
              <div className="mb-3 rounded-lg overflow-hidden" style={{ background: `${lineColor}06` }}>
                <MiniSparkline data={data.sparkline.filter((_, i) => i % 3 === 0)} color={lineColor} width={340} height={48} />
              </div>
            )}

            {/* Period changes */}
            <div className="grid grid-cols-4 gap-1 mb-3">
              <ChangeTag label="1H" value={data.change1h} />
              <ChangeTag label="24H" value={data.change24h} />
              <ChangeTag label="7D" value={data.change7d} />
              <ChangeTag label="30D" value={data.change30d} />
            </div>

            {/* Top Coins (fallback only) */}
            {data.topCoins && (
              <div className="border-t border-gray-800/20 pt-2 mt-1">
                <div className="text-[8px] font-black tracking-[2px] text-gray-600 mb-2">TOP COMPONENTES</div>
                {data.topCoins.map((c) => {
                  const coinUp = (c.change24h || 0) >= 0;
                  const coinColor = COIN_COLORS[c.symbol] || "#9ca3af";
                  return (
                    <div key={c.symbol} className="flex items-center gap-2 py-1.5 border-b border-gray-800/10 last:border-0">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black flex-shrink-0"
                        style={{ background: `${coinColor}15`, color: coinColor }}>
                        {c.symbol?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-gray-300">{c.symbol}</span>
                        <span className="text-[9px] text-gray-600 ml-1">{c.name}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-[10px] font-bold text-gray-300 tabular-nums">
                          ${c.price >= 1 ? c.price.toLocaleString("en-US", { maximumFractionDigits: 0 }) : c.price?.toFixed(4)}
                        </div>
                        <div className="text-[9px] font-bold tabular-nums" style={{ color: coinUp ? "#10b981" : "#ef4444" }}>
                          {coinUp ? "+" : ""}{(c.change24h || 0).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Last updated */}
            {data.lastUpdated && (
              <div className="flex items-center justify-end gap-1 mt-2">
                <Clock size={8} className="text-gray-700" />
                <span className="text-[8px] text-gray-700 font-mono">
                  {new Date(data.lastUpdated).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <span className="text-gray-600 text-xs">Sin datos disponibles</span>
          </div>
        )}
      </div>
    </div>
  );
}
