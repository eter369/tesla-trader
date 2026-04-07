import { useState, useEffect, useMemo } from "react";
import { Newspaper, Clock, TrendingUp, TrendingDown, Minus, Star, RefreshCw } from "lucide-react";

const NEWS_DATA = {
  top: [
    {
      t: "BTC sube a $69,120 por posible alto al fuego EE.UU.-Iran",
      s: "Propuesta de cese al fuego de 45 dias y reapertura del Estrecho de Ormuz desata rally risk-on con +$270M en liquidaciones de shorts.",
      i: "bullish",
      coins: ["BTC", "ETH"],
      date: "6 Abr 2026",
      time: "11:38",
    },
    {
      t: "Morgan Stanley aprobado para ETF spot de Bitcoin",
      s: "Aprobacion regulatoria conecta ~16,000 asesores financieros con $6.2T en activos al mercado cripto.",
      i: "bullish",
      coins: ["BTC"],
      date: "4 Abr 2026",
      time: "09:15",
    },
    {
      t: "Bitmine acumula 4.8M ETH — mayor tesoreria del mundo",
      s: "Holdings valorados en $10.2B; uplisting a NYSE efectivo el 9 de abril. Apuntan al 5% del supply total de ETH.",
      i: "bullish",
      coins: ["ETH"],
      date: "6 Abr 2026",
      time: "08:00",
    },
  ],
  other: [
    {
      t: "Coinbase obtiene aprobacion OCC para trust nacional",
      s: "Custodia regulada a nivel federal consolida a Coinbase como el mayor custodio institucional cripto en EE.UU.",
      i: "bullish",
      coins: ["COIN"],
      date: "3 Abr 2026",
      time: "14:22",
    },
    {
      t: "Polygon lanza upgrade Guiliano el 8 de abril",
      s: "Mejoras de velocidad y protocolo en una de las redes L2 de mayor crecimiento.",
      i: "neutral",
      coins: ["POL"],
      date: "5 Abr 2026",
      time: "10:45",
    },
    {
      t: "CLARITY Act: markup esperado en Senado a mediados de abril",
      s: "El Comite Bancario del Senado prepara regulacion cripto clave que podria definir el marco legal para activos digitales.",
      i: "neutral",
      coins: ["CRYPTO"],
      date: "2 Abr 2026",
      time: "16:30",
    },
  ],
  week: "31 Mar - 6 Abr 2026",
};

const IMPACT = {
  bullish: { color: "#10b981", arrow: "↑", icon: TrendingUp, label: "Alcista" },
  bearish: { color: "#ef4444", arrow: "↓", icon: TrendingDown, label: "Bajista" },
  neutral: { color: "#a78bfa", arrow: "→", icon: Minus, label: "Neutral" },
};

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
        <div
          key={t.symbol}
          className="rounded-lg p-2 text-center"
          style={{
            background: `linear-gradient(135deg, ${t.color}08, ${t.color}04)`,
            border: `1px solid ${t.color}15`,
          }}
        >
          <div className="text-[10px] font-bold text-gray-400 tracking-wider">{t.symbol}</div>
          <div className="text-xs font-black text-gray-200 tabular-nums mt-0.5">
            {formatPrice(t.price)}
          </div>
          <div
            className="text-[10px] font-bold tabular-nums mt-0.5"
            style={{ color: t.up ? "#10b981" : "#ef4444" }}
          >
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
    <div
      className="group relative py-3 border-b border-gray-800/20 last:border-0 animate-slide-in"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-start gap-2.5">
        {/* Impact indicator */}
        <div
          className="mt-1 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-black"
          style={{ background: `${impact.color}15`, color: impact.color }}
        >
          {impact.arrow}
        </div>

        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            {isTop && (
              <span className="text-[8px] font-black tracking-widest text-amber-400 bg-amber-400/10 px-1.5 py-px rounded flex items-center gap-0.5">
                <Star size={7} fill="currentColor" /> TOP
              </span>
            )}
            <span className="text-[9px] text-gray-600 font-mono">
              {d.date} · {d.time}h
            </span>
            <div className="flex gap-1 ml-auto">
              {d.coins.slice(0, 2).map((c) => (
                <span
                  key={c}
                  className="text-[8px] font-bold text-gray-500 bg-gray-800/50 px-1.5 py-px rounded"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Title */}
          <h4 className="text-[12px] font-bold text-gray-200 leading-snug mb-1 group-hover:text-amber-300/90 transition-colors">
            {d.t}
          </h4>

          {/* Summary */}
          <p className="text-[10.5px] text-gray-500 leading-relaxed">{d.s}</p>
        </div>
      </div>
    </div>
  );
}

export default function CryptoNews({ livePrices, marketData }) {
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNews(NEWS_DATA);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const updated = new Date().toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="card rounded-2xl overflow-hidden flex flex-col h-full">
      {/* Top accent line */}
      <div
        className="h-px"
        style={{
          background: "linear-gradient(90deg, transparent, #7c3aed40, #a855f730, transparent)",
        }}
      />

      <div className="p-4 flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Newspaper size={14} className="text-purple-400" />
            <h3 className="text-sm font-black text-gray-200 tracking-tight">Crypto Weekly</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-600 font-mono flex items-center gap-1">
              <Clock size={9} /> {updated}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* Week range */}
        <div className="text-[9px] text-gray-600 font-mono tracking-wider mb-3">
          {news?.week || "---"}
        </div>

        {/* Live Price Ticker */}
        <PriceTicker livePrices={livePrices} marketData={marketData} />

        {/* Separator */}
        <div
          className="h-px mb-3"
          style={{
            background: "linear-gradient(90deg, #7c3aed15, #ffffff08, transparent)",
          }}
        />

        {/* News Feed */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {loading ? (
            <div className="space-y-4 py-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-2.5">
                  <div
                    className="skeleton w-5 h-5 rounded flex-shrink-0"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
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
              {/* Section: Top */}
              <div className="text-[8px] font-black tracking-[3px] text-amber-400/50 mb-1">
                TOP NOTICIAS
              </div>
              {news.top.map((d, i) => (
                <NewsRow key={`top-${i}`} d={d} isTop delay={i * 0.06} />
              ))}

              {/* Separator */}
              <div
                className="h-px my-2"
                style={{
                  background: "linear-gradient(90deg, transparent, #7c3aed15, transparent)",
                }}
              />

              {/* Section: Other */}
              <div className="text-[8px] font-black tracking-[3px] text-purple-400/40 mb-1">
                TAMBIEN ESTA SEMANA
              </div>
              {news.other.map((d, i) => (
                <NewsRow key={`other-${i}`} d={d} isTop={false} delay={(i + 3) * 0.06} />
              ))}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-auto border-t border-gray-800/20 text-center">
          <span className="text-[8px] text-gray-700 font-mono tracking-[2px]">
            CRYPTO WEEKLY · 6 ABR 2026
          </span>
        </div>
      </div>
    </div>
  );
}
