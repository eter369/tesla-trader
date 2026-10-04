import { Eye, TrendingUp, TrendingDown, Settings } from "lucide-react";
import { useState } from "react";
import { formatChange, numeroConSigno } from "../utils/format";
import { fechaLima } from "../utils/lunar";

// Las fuentes devuelven la clasificación en inglés
const CLASIFICACION = {
  "extreme fear": "Miedo extremo",
  "fear": "Miedo",
  "neutral": "Neutral",
  "greed": "Codicia",
  "extreme greed": "Codicia extrema",
};
const clasificacion = (c) => CLASIFICACION[String(c || "").toLowerCase()] || c;

function FearGreedSparkline({ history, height = 50 }) {
  if (!history || history.length < 2) return null;
  const values = history.map(h => h.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 280;

  const points = values.map((v, i) =>
    `${(i / (values.length - 1)) * w},${height - ((v - min) / range) * (height - 8) - 4}`
  ).join(" ");
  const areaPoints = points + ` ${w},${height} 0,${height}`;

  const latestValue = values[values.length - 1];
  const prevValue = values[values.length - 2];
  const trend = latestValue - prevValue;
  const color = latestValue >= 55 ? "#10b981" : latestValue >= 45 ? "#fbbf24" : latestValue >= 25 ? "#f97316" : "#ef4444";

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-gray-500">Últimos {history.length} días</span>
        <span className="flex items-center gap-1 text-[10px]" style={{ color }} title="Cambio frente al día anterior">
          {trend > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {numeroConSigno(trend)}
        </span>
      </div>
      <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="fngGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x="0" y={0} width={w} height={height * 0.25} fill="#ef444408" />
        <rect x="0" y={height * 0.75} width={w} height={height * 0.25} fill="#10b98108" />
        <polygon points={areaPoints} fill="url(#fngGrad)" />
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        <circle cx={w} cy={height - ((latestValue - min) / range) * (height - 8) - 4} r="3" fill={color} stroke="#0a0a1a" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

function getFearGreedColor(value) {
  if (value >= 75) return "#ef4444";
  if (value >= 55) return "#f59e0b";
  if (value >= 45) return "#fbbf24";
  if (value >= 25) return "#f97316";
  return "#10b981";
}

function getFearGreedEmoji(value) {
  if (value >= 75) return "🤑";
  if (value >= 55) return "😀";
  if (value >= 45) return "😐";
  if (value >= 25) return "😰";
  return "😱";
}

function leerClave() {
  try {
    return localStorage.getItem("cmc-api-key") || "";
  } catch {
    return "";
  }
}

export default function SentimentIndex({ sentiment, lunarInfo, detailedPhase, analisis, fearGreed }) {
  const [showApiInput, setShowApiInput] = useState(false);
  const [apiKey, setApiKey] = useState(leerClave);

  const saveApiKey = () => {
    if (!apiKey.trim()) return;
    try {
      localStorage.setItem("cmc-api-key", apiKey.trim());
      window.location.reload();
    } catch {
      // sin almacenamiento no se puede guardar la clave
    }
  };

  if (!sentiment || !analisis) {
    return (
      <div className="card rounded-2xl p-5">
        <h3 className="text-xs font-bold text-gray-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
          <Eye size={14} className="text-amber-400" /> Índice de Sentimiento Lunar
        </h3>
        <div className="skeleton h-24 rounded-xl" />
      </div>
    );
  }

  const ultimoFng = fearGreed?.history?.[fearGreed.history.length - 1]?.date;

  return (
    <div className="card rounded-2xl p-5">
      <h3 className="text-xs font-bold text-gray-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
        <Eye size={14} className="text-amber-400" /> Índice de Sentimiento Lunar
      </h3>

      <div className="text-center mb-5">
        <div className="text-6xl font-black tabular-nums" style={{ color: sentiment.color }}>
          {sentiment.score}
        </div>
        <div className="text-sm font-bold mt-1 tracking-wide" style={{ color: sentiment.color }}>
          {sentiment.label}
        </div>
      </div>

      <div className="relative w-full h-2.5 rounded-full bg-gray-800/80 overflow-hidden mb-1" aria-hidden="true">
        <div className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(90deg, #10b981, #22d3ee 30%, #f59e0b 60%, #ef4444)" }} />
        <div className="absolute top-0 right-0 h-full bg-gray-900/80 rounded-r-full transition-all duration-1000" style={{ width: `${100 - sentiment.score}%` }} />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-lg transition-all duration-1000"
          style={{ left: `calc(${sentiment.score}% - 6px)`, backgroundColor: sentiment.color }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-500 mb-2">
        <span>Pánico</span><span>Miedo</span><span>Neutral</span><span>Optimismo</span><span>Euforia</span>
      </div>
      <p className="text-[10px] text-gray-500 mb-4 text-center">
        40 % fase lunar + 35 % RSI 14 + 25 % volumen (velas de 1 h)
      </p>

      {/* Índice de Miedo y Codicia */}
      <div className="mb-4 p-3 rounded-xl bg-gray-900/50 border border-gray-800/50">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400 font-semibold flex items-center gap-1.5 flex-wrap">
            Miedo y Codicia
            {fearGreed?.source && (
              <span className="text-[9px] text-gray-500 font-normal">
                ({fearGreed.source}{ultimoFng ? `, ${fechaLima(Date.parse(ultimoFng), { day: "numeric", month: "short" }).replace(".", "")}` : ""})
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => setShowApiInput(!showApiInput)}
            className="p-1 rounded hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-300"
            title="Usar mi clave API de CoinMarketCap"
            aria-label="Configurar clave API de CoinMarketCap"
            aria-expanded={showApiInput}
          >
            <Settings size={12} />
          </button>
        </div>

        {fearGreed ? (
          <>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-3xl" aria-hidden="true">{getFearGreedEmoji(fearGreed.value)}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black tabular-nums" style={{ color: getFearGreedColor(fearGreed.value) }}>
                    {fearGreed.value}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: getFearGreedColor(fearGreed.value) }}>
                    {clasificacion(fearGreed.classification)}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-gray-800 mt-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${fearGreed.value}%`, background: "linear-gradient(90deg, #10b981, #fbbf24 50%, #ef4444)" }}
                  />
                </div>
              </div>
            </div>
            <FearGreedSparkline history={fearGreed.history} />
          </>
        ) : (
          <div className="text-center py-3">
            <span className="text-gray-500 text-xs">Cargando datos…</span>
          </div>
        )}

        {showApiInput && (
          <div className="mt-3 pt-3 border-t border-gray-800/50">
            <label htmlFor="clave-cmc" className="block text-[10px] text-gray-500 mb-2">
              Clave API de CoinMarketCap (opcional; se guarda solo en este navegador):
            </label>
            <div className="flex gap-2">
              <input
                id="clave-cmc"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Tu clave API…"
                autoComplete="off"
                className="flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-amber-400/50"
              />
              <button
                type="button"
                onClick={saveApiKey}
                className="px-3 py-1.5 rounded bg-amber-400/15 text-amber-400 text-xs font-bold hover:bg-amber-400/25 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Datos que entran al índice */}
      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center p-2 rounded-lg bg-gray-900/30">
          <span className="text-gray-400">Fase lunar</span>
          <span className="text-amber-400 font-semibold text-right" title={`${lunarInfo.name}: ${lunarInfo.dias}`}>{detailedPhase?.icon} {detailedPhase?.name}</span>
        </div>
        <div className="flex justify-between items-center p-2 rounded-lg bg-gray-900/30">
          <span className="text-gray-400">RSI 14 (1 h)</span>
          <span className="font-semibold tabular-nums" style={{ color: analisis.rsi > 70 ? "#ef4444" : analisis.rsi < 30 ? "#10b981" : "#fbbf24" }}>
            {analisis.rsi}
          </span>
        </div>
        <div className="flex justify-between items-center p-2 rounded-lg bg-gray-900/30" title="Suma de las últimas 24 velas de 1 h frente al promedio diario de los 7 días anteriores">
          <span className="text-gray-400">Volumen 24 h vs. media 7 días</span>
          <span className="font-semibold tabular-nums" style={{ color: analisis.volumenVs7d >= 0 ? "#10b981" : "#ef4444" }}>
            {formatChange(analisis.volumenVs7d, 0)}
          </span>
        </div>
        <div className="flex justify-between items-center p-2 rounded-lg bg-gray-900/30">
          <span className="text-gray-400">MACD (1 h)</span>
          <span className="font-semibold tabular-nums" style={{ color: analisis.macd > 0 ? "#10b981" : "#ef4444" }}>
            {analisis.macd > 0 ? "Alcista" : "Bajista"} ({numeroConSigno(analisis.macd, Math.abs(analisis.macd) >= 1 ? 2 : 3)})
          </span>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-800/20 border border-gray-800/30">
        <p className="text-xs text-gray-400 leading-relaxed">
          <span className="text-amber-400 font-bold">Ley del Espejo:</span>{" "}
          {sentiment.score >= 70
            ? "Alta euforia. El mercado puede estar sobrecomprado; los ciclos lunares sugieren cautela."
            : sentiment.score <= 30
            ? "Pánico extremo. Posible sobreventa; los ciclos lunares sugieren una oportunidad de acumulación."
            : "Sentimiento equilibrado. Conviene mirar los indicadores técnicos para confirmar la dirección."}
        </p>
      </div>
    </div>
  );
}
