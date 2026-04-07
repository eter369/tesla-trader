import { useState, useMemo } from "react";
import { Wallet, Plus, X } from "lucide-react";
import { formatPrice, formatChange } from "../utils/format";

const CRYPTOS = {
  bitcoin: { symbol: "BTC", color: "#f7931a", icon: "₿" },
  ethereum: { symbol: "ETH", color: "#627eea", icon: "Ξ" },
  solana: { symbol: "SOL", color: "#9945ff", icon: "◎" },
};

export default function PortfolioSimulator({ livePrices, marketData }) {
  const [holdings, setHoldings] = useState(() => {
    try {
      const saved = localStorage.getItem("lunar-portfolio");
      return saved ? JSON.parse(saved) : { bitcoin: 0, ethereum: 0, solana: 0 };
    } catch {
      return { bitcoin: 0, ethereum: 0, solana: 0 };
    }
  });
  const [editing, setEditing] = useState(null);

  const saveHoldings = (h) => {
    setHoldings(h);
    localStorage.setItem("lunar-portfolio", JSON.stringify(h));
  };

  const portfolio = useMemo(() => {
    let total = 0;
    let totalChange = 0;
    const items = Object.entries(CRYPTOS).map(([id, meta]) => {
      const amount = holdings[id] || 0;
      const price = livePrices[id]?.price || marketData[id]?.current_price || 0;
      const change = livePrices[id]?.change24h ?? marketData[id]?.price_change_percentage_24h ?? 0;
      const value = amount * price;
      total += value;
      totalChange += value * (change / 100);
      return { id, ...meta, amount, price, change, value };
    });
    const totalPrevValue = total - totalChange;
    const totalChangePercent = totalPrevValue > 0 ? (totalChange / totalPrevValue) * 100 : 0;
    return { items, total, totalChange, totalChangePercent };
  }, [holdings, livePrices, marketData]);

  const hasHoldings = portfolio.total > 0;

  return (
    <div className="card rounded-2xl p-4 mb-5">
      <h3 className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
        <Wallet size={14} className="text-amber-400" /> Simulador de Portfolio
        {hasHoldings && (
          <span className="ml-auto text-emerald-400/60 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        )}
      </h3>

      {hasHoldings && (
        <div className="text-center mb-4 p-3 rounded-xl bg-gray-900/40 border border-gray-800/30">
          <div className="text-2xl font-black tabular-nums">{formatPrice(portfolio.total)}</div>
          <div className={`text-sm font-bold ${portfolio.totalChangePercent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {formatChange(portfolio.totalChangePercent)} ({portfolio.totalChange >= 0 ? "+" : ""}{formatPrice(Math.abs(portfolio.totalChange))})
          </div>
        </div>
      )}

      <div className="space-y-2">
        {portfolio.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-900/30 border border-gray-800/20">
            <span className="text-lg font-bold" style={{ color: item.color }}>{item.icon}</span>
            <span className="text-xs font-bold text-gray-300 w-8">{item.symbol}</span>

            {editing === item.id ? (
              <input
                type="number"
                step="any"
                min="0"
                autoFocus
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-amber-400/50"
                defaultValue={item.amount || ""}
                placeholder="0.00"
                onBlur={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  saveHoldings({ ...holdings, [item.id]: val });
                  setEditing(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.target.blur();
                }}
              />
            ) : (
              <button
                onClick={() => setEditing(item.id)}
                className="flex-1 text-left text-xs text-gray-400 hover:text-amber-400 transition-colors"
              >
                {item.amount > 0 ? (
                  <span className="text-white font-semibold">{item.amount} {item.symbol}</span>
                ) : (
                  <span className="flex items-center gap-1"><Plus size={10} /> Agregar</span>
                )}
              </button>
            )}

            <div className="text-right text-xs min-w-[80px]">
              {item.amount > 0 ? (
                <>
                  <div className="font-bold text-white">{formatPrice(item.value)}</div>
                  <div className={item.change >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {formatChange(item.change)}
                  </div>
                </>
              ) : (
                <span className="text-gray-600">{formatPrice(item.price)}</span>
              )}
            </div>

            {item.amount > 0 && (
              <button
                onClick={() => saveHoldings({ ...holdings, [item.id]: 0 })}
                className="p-1 rounded hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
