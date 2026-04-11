import { useState, useEffect, useMemo } from "react";
import { TrendingUp, TrendingDown, Zap, Clock, ExternalLink } from "lucide-react";

const PERIODS = [
  { key: "7d", label: "7D", days: 7 },
  { key: "30d", label: "30D", days: 30 },
  { key: "90d", label: "90D", days: 90 },
  { key: "1y", label: "1Y", days: 365 },
  { key: "all", label: "ALL", days: 9999 },
];

function IndexChart({ data, color, width = 340, height = 100 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 4;
  const stepX = (width - pad * 2) / (data.length - 1);
  const toY = (v) => height - pad - ((v - min) / range) * (height - pad * 2);

  const points = data.map((v, i) => `${pad + i * stepX},${toY(v)}`).join(" ");
  const areaPoints = `${pad},${height - pad} ${points} ${pad + (data.length - 1) * stepX},${height - pad}`;

  // Y-axis labels
  const yLabels = [max, (max + min) / 2, min];

  // X-axis: show ~5 date markers
  const step = Math.floor(data.length / 4);
  const xIndices = [0, step, step * 2, step * 3, data.length - 1].filter(i => i < data.length);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height + 16}`} className="block">
      <defs>
        <linearGradient id="cmc100-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="60%" stopColor={color} stopOpacity="0.08" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yLabels.map((v, i) => (
        <g key={i}>
          <line x1={pad} y1={toY(v)} x2={width - pad} y2={toY(v)}
            stroke="#ffffff06" strokeWidth="0.5" strokeDasharray="3,3" />
          <text x={width - 2} y={toY(v) - 3} textAnchor="end"
            fill="#6b728066" fontSize="7" fontFamily="monospace">
            {v >= 1000 ? Math.round(v).toLocaleString() : v.toFixed(1)}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <polygon points={areaPoints} fill="url(#cmc100-area)" />

      {/* Line */}
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />

      {/* Current value dot */}
      <circle cx={pad + (data.length - 1) * stepX} cy={toY(data[data.length - 1])}
        r="3" fill={color} stroke="#0a0a1a" strokeWidth="1.5" />
    </svg>
  );
}

function PerformanceRow({ label, value, highlight }) {
  if (value === null || value === undefined) return null;
  const up = value >= 0;
  return (
    <div className={`flex items-center justify-between py-1.5 border-b border-gray-800/10 last:border-0 ${highlight ? "bg-white/[0.02]" : ""}`}>
      <span className="text-[10px] text-gray-500 font-mono">{label}</span>
      <div className="flex items-center gap-1">
        {up ? <TrendingUp size={9} className="text-emerald-400" /> : <TrendingDown size={9} className="text-red-400" />}
        <span className="text-[11px] font-black tabular-nums" style={{ color: up ? "#10b981" : "#ef4444" }}>
          {up ? "+" : ""}{value.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

export default function CMC100Index() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState(null);
  const [period, setPeriod] = useState("30d");
  const [historical, setHistorical] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    const cmcKey = localStorage.getItem("cmc-api-key");

    // Try CMC100 latest + historical
    if (cmcKey) {
      try {
        const [latestRes, histRes] = await Promise.all([
          fetch("https://pro-api.coinmarketcap.com/v3/index/cmc100-latest", {
            headers: { "X-CMC_PRO_API_KEY": cmcKey, Accept: "application/json" },
          }),
          fetch("https://pro-api.coinmarketcap.com/v3/index/cmc100-historical?count=365&interval=daily", {
            headers: { "X-CMC_PRO_API_KEY": cmcKey, Accept: "application/json" },
          }),
        ]);

        if (latestRes.ok) {
          const json = await latestRes.json();
          const d = json?.data;
          if (d) {
            const usd = d.quote?.USD || {};
            setData({
              name: d.name || "CMC Crypto 100",
              symbol: d.symbol || "CMC100",
              price: usd.price || 0,
              change1h: usd.percent_change_1h ?? null,
              change24h: usd.percent_change_24h ?? null,
              change7d: usd.percent_change_7d ?? null,
              change30d: usd.percent_change_30d ?? null,
              change90d: usd.percent_change_90d ?? null,
              lastUpdated: d.last_updated,
            });
            setSource("CoinMarketCap");
          }
        }

        if (histRes.ok) {
          const hJson = await histRes.json();
          if (hJson?.data?.quotes?.length > 0) {
            setHistorical(hJson.data.quotes.map(q => ({
              date: q.timestamp,
              price: q.quote?.USD?.price || 0,
            })));
          }
        }

        setLoading(false);
        if (data) return;
      } catch {}
    }

    // Fallback: CoinGecko total market cap chart + top coins
    try {
      const [chartRes, coinsRes] = await Promise.all([
        fetch("https://api.coingecko.com/api/v3/global/market_cap_chart?vs_currency=usd&days=365"),
        fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=true&price_change_percentage=1h,24h,7d,30d"),
      ]);

      let chartData = null;
      if (chartRes.ok) {
        const cj = await chartRes.json();
        if (cj?.market_cap_chart?.market_cap) {
          chartData = cj.market_cap_chart.market_cap.map(([ts, val]) => ({
            date: new Date(ts).toISOString(),
            price: val / 1e10, // Normalize to index-like scale
          }));
        }
      }

      if (coinsRes.ok) {
        const coins = await coinsRes.json();
        if (coins?.length > 0) {
          const totalMcap = coins.reduce((s, c) => s + (c.market_cap || 0), 0);
          let w1h = 0, w24h = 0, w7d = 0, w30d = 0;
          const sparklineAgg = [];

          coins.forEach(c => {
            const weight = (c.market_cap || 0) / totalMcap;
            w1h += (c.price_change_percentage_1h_in_currency || 0) * weight;
            w24h += (c.price_change_percentage_24h || 0) * weight;
            w7d += (c.price_change_percentage_7d_in_currency || 0) * weight;
            w30d += (c.price_change_percentage_30d_in_currency || 0) * weight;

            if (c.sparkline_in_7d?.price) {
              const sp = c.sparkline_in_7d.price;
              for (let i = 0; i < sp.length; i++) {
                sparklineAgg[i] = (sparklineAgg[i] || 0) + sp[i] * weight;
              }
            }
          });

          const firstVal = sparklineAgg[0] || 1;
          const indexSparkline = sparklineAgg.map(v => (v / firstVal) * 1000);
          const currentPrice = indexSparkline[indexSparkline.length - 1] || 1000;

          // Build historical from sparkline (7d hourly) + chart data
          let hist = null;
          if (chartData) {
            hist = chartData;
          } else {
            // Use 7d sparkline as historical
            const now = Date.now();
            const hourMs = 3600000;
            hist = indexSparkline.map((v, i) => ({
              date: new Date(now - (indexSparkline.length - 1 - i) * hourMs).toISOString(),
              price: v,
            }));
          }

          setData({
            name: "CMC 100",
            symbol: "CMC100",
            price: currentPrice,
            change1h: w1h,
            change24h: w24h,
            change7d: w7d,
            change30d: w30d,
            change90d: null,
            topCoins: coins
              .filter(c => ["btc","eth","usdt","bnb","sol"].includes(c.id || c.symbol?.toLowerCase()))
              .slice(0, 5)
              .map(c => ({
                symbol: c.symbol?.toUpperCase(),
                name: c.name,
                price: c.current_price,
                change24h: c.price_change_percentage_24h,
                weight: ((c.market_cap || 0) / totalMcap * 100),
              })),
            lastUpdated: new Date().toISOString(),
          });
          setHistorical(hist);
          setSource("CoinGecko");
          setLoading(false);
          return;
        }
      }
    } catch {}

    setLoading(false);
  }

  // Filter historical data by selected period
  const chartData = useMemo(() => {
    if (!historical?.length) return null;
    const days = PERIODS.find(p => p.key === period)?.days || 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const filtered = days >= 9999 ? historical : historical.filter(h => new Date(h.date).getTime() >= cutoff);
    if (filtered.length < 2) return historical.map(h => h.price);
    // Downsample to max ~120 points for smooth rendering
    const maxPts = 120;
    if (filtered.length <= maxPts) return filtered.map(h => h.price);
    const step = filtered.length / maxPts;
    return Array.from({ length: maxPts }, (_, i) => filtered[Math.floor(i * step)]?.price).filter(Boolean);
  }, [historical, period]);

  const change24h = data?.change24h ?? 0;
  const up = change24h >= 0;
  const lineColor = up ? "#10b981" : "#ef4444";

  const COIN_COLORS = { BTC: "#f7931a", ETH: "#627eea", USDT: "#26a17b", BNB: "#f0b90b", SOL: "#9945ff", XRP: "#00aae4", USDC: "#2775ca", ADA: "#0033ad", DOGE: "#c2a633", AVAX: "#e84142" };

  return (
    <div className="card rounded-2xl overflow-hidden mt-4">
      <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, #3b82f640, #8b5cf630, transparent)" }} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#3b82f615" }}>
              <Zap size={13} className="text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-gray-200 tracking-tight">CMC 100</h3>
                <a href="https://coinmarketcap.com/charts/cmc100/" target="_blank" rel="noopener noreferrer"
                  className="text-gray-700 hover:text-blue-400 transition-colors">
                  <ExternalLink size={9} />
                </a>
              </div>
              <span className="text-[8px] text-gray-600 font-mono">Crypto Market Index</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {source && <span className="text-[8px] text-gray-600 font-mono">{source}</span>}
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 py-4">
            <div className="skeleton h-8 w-2/3 rounded" />
            <div className="skeleton h-20 w-full rounded" />
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-3/4 rounded" />
          </div>
        ) : data ? (
          <>
            {/* Price + 24h Badge */}
            <div className="flex items-end justify-between mt-2 mb-1">
              <div className="text-[28px] font-black tabular-nums text-gray-100 leading-none">
                {data.price >= 100
                  ? data.price.toLocaleString("en-US", { maximumFractionDigits: 0 })
                  : data.price.toFixed(2)}
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg" style={{ background: `${lineColor}12` }}>
                {up ? <TrendingUp size={13} style={{ color: lineColor }} /> : <TrendingDown size={13} style={{ color: lineColor }} />}
                <span className="text-sm font-black tabular-nums" style={{ color: lineColor }}>
                  {up ? "+" : ""}{change24h.toFixed(2)}%
                </span>
                <span className="text-[9px] text-gray-600 ml-0.5">24h</span>
              </div>
            </div>

            {/* Period selector */}
            <div className="flex gap-1 my-3">
              {PERIODS.map(p => (
                <button key={p.key} onClick={() => setPeriod(p.key)}
                  className="flex-1 text-[9px] font-black py-1 rounded-md transition-all tracking-wider"
                  style={{
                    background: period === p.key ? "#3b82f620" : "transparent",
                    color: period === p.key ? "#60a5fa" : "#6b7280",
                    border: period === p.key ? "1px solid #3b82f630" : "1px solid transparent",
                  }}>
                  {p.label}
                </button>
              ))}
            </div>

            {/* Chart */}
            {chartData && (
              <div className="rounded-xl overflow-hidden mb-3" style={{ background: "#0d0d2008" }}>
                <IndexChart data={chartData} color="#3b82f6" height={90} />
              </div>
            )}

            {/* Performance Table */}
            <div className="rounded-xl p-2.5 mb-2" style={{ background: "#ffffff03", border: "1px solid #ffffff06" }}>
              <div className="text-[8px] font-black tracking-[3px] text-gray-600 mb-1.5">PERFORMANCE</div>
              <PerformanceRow label="1 Hora" value={data.change1h} />
              <PerformanceRow label="24 Horas" value={data.change24h} highlight />
              <PerformanceRow label="7 Días" value={data.change7d} />
              <PerformanceRow label="30 Días" value={data.change30d} highlight />
              {data.change90d !== null && <PerformanceRow label="90 Días" value={data.change90d} />}
            </div>

            {/* Top Components */}
            {data.topCoins && (
              <div className="rounded-xl p-2.5" style={{ background: "#ffffff03", border: "1px solid #ffffff06" }}>
                <div className="text-[8px] font-black tracking-[3px] text-gray-600 mb-1.5">TOP COMPONENTES</div>
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
                      </div>
                      {c.weight && (
                        <div className="flex items-center gap-1 mr-2">
                          <div className="h-1 rounded-full bg-gray-800 w-10 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(c.weight, 100)}%`, background: coinColor }} />
                          </div>
                          <span className="text-[8px] text-gray-600 tabular-nums">{c.weight.toFixed(1)}%</span>
                        </div>
                      )}
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

            {/* Footer */}
            <div className="flex items-center justify-between mt-3">
              <a href="https://coinmarketcap.com/charts/cmc100/" target="_blank" rel="noopener noreferrer"
                className="text-[8px] text-blue-500/50 hover:text-blue-400 transition-colors font-mono flex items-center gap-1">
                coinmarketcap.com/charts/cmc100 <ExternalLink size={7} />
              </a>
              {data.lastUpdated && (
                <div className="flex items-center gap-1">
                  <Clock size={8} className="text-gray-700" />
                  <span className="text-[8px] text-gray-700 font-mono">
                    {new Date(data.lastUpdated).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              )}
            </div>
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
