import { TrendingUp, TrendingDown } from "lucide-react";
import { formatPrice, formatVolume, formatChange } from "../utils/format";

function Sparkline({ data, color, height = 40, width = 120 }) {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) =>
    `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`
  ).join(" ");
  const areaPoints = points + ` ${width},${height} 0,${height}`;

  return (
    <svg width={width} height={height} className="opacity-80">
      <defs>
        <linearGradient id={`sparkGrad-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#sparkGrad-${color.replace("#","")})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

const CRYPTOS = {
  bitcoin: { symbol: "BTC", name: "Bitcoin", color: "#f7931a", icon: "₿" },
  ethereum: { symbol: "ETH", name: "Ethereum", color: "#627eea", icon: "Ξ" },
  solana: { symbol: "SOL", name: "Solana", color: "#9945ff", icon: "◎" },
};

export default function CryptoCards({ marketData, livePrices, tickDirection, selectedCrypto, onSelect }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
      {Object.entries(CRYPTOS).map(([id, meta]) => {
        const coin = marketData[id];
        const live = livePrices[id];
        const tick = tickDirection[id];
        const isSelected = selectedCrypto === id;

        const price = live?.price || coin?.current_price || 0;
        const change = live?.change24h ?? coin?.price_change_percentage_24h ?? 0;
        const volume = live?.quoteVolume || coin?.total_volume || 0;
        const isUp = change >= 0;
        const sparkData = coin?.sparkline_in_7d?.price?.slice(-24) || [];

        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`card rounded-xl p-4 text-left transition-all duration-300 group relative overflow-hidden ${
              isSelected ? "ring-2 ring-opacity-50" : ""
            }`}
            style={isSelected ? {
              borderColor: meta.color + "50",
              boxShadow: `0 0 30px ${meta.color}10`,
              ringColor: meta.color,
            } : {}}
          >
            {/* Tick flash overlay */}
            {tick && (
              <div
                className="absolute inset-0 rounded-xl animate-flash pointer-events-none"
                style={{
                  backgroundColor: tick === "up" ? "#10b981" : "#ef4444",
                  opacity: 0.08,
                }}
              />
            )}

            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: meta.color }} />
            )}

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl font-black" style={{ color: meta.color }}>{meta.icon}</span>
                <div>
                  <div className="font-bold text-sm">{meta.symbol}</div>
                  <div className="text-gray-500 text-xs">{meta.name}</div>
                </div>
              </div>
              <Sparkline data={sparkData} color={isUp ? "#10b981" : "#ef4444"} />
            </div>

            <div className="flex items-end justify-between">
              <div>
                <div className={`text-xl font-black tabular-nums transition-colors duration-300 ${tick === "up" ? "text-emerald-400" : tick === "down" ? "text-red-400" : "text-white"}`}>
                  {formatPrice(price)}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  {isUp
                    ? <TrendingUp size={14} className="text-emerald-400" />
                    : <TrendingDown size={14} className="text-red-400" />
                  }
                  <span className={`text-sm font-bold ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                    {formatChange(change)}
                  </span>
                </div>
              </div>
              <div className="text-right text-[11px] text-gray-500 space-y-0.5">
                <div>Vol: {formatVolume(volume)}</div>
                {coin?.market_cap && <div>MCap: {formatVolume(coin.market_cap)}</div>}
                {live && (
                  <div className="text-emerald-500/60 flex items-center gap-1 justify-end">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export { CRYPTOS };
