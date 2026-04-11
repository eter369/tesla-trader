import { Zap } from "lucide-react";
import { formatChange } from "../utils/format";

export default function SignalPanel({ signal, lunarInfo, currentRSI, currentMACD, priceChange24h }) {
  if (!signal) return null;

  const factors = [
    { label: "Fase Lunar", value: lunarInfo.name, color: lunarInfo.color },
    {
      label: "RSI",
      value: `${currentRSI} ${currentRSI > 70 ? "(Sobrecompra)" : currentRSI < 30 ? "(Sobreventa)" : "(Normal)"}`,
      color: currentRSI > 70 ? "#ef4444" : currentRSI < 30 ? "#10b981" : "#fbbf24"
    },
    {
      label: "MACD Hist.",
      value: currentMACD.histogram,
      color: currentMACD.histogram > 0 ? "#10b981" : "#ef4444"
    },
    {
      label: "Tendencia 24h",
      value: formatChange(priceChange24h),
      color: priceChange24h >= 0 ? "#10b981" : "#ef4444"
    }
  ];

  return (
    <div className="card rounded-2xl p-5">
      <h3 className="text-xs font-bold text-gray-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
        <Zap size={14} className="text-amber-400" /> Señal Tesla 369
      </h3>

      {/* Main Signal */}
      <div
        className="text-center p-5 rounded-xl mb-5 relative overflow-hidden"
        style={{
          backgroundColor: signal.color + "10",
          border: `2px solid ${signal.color}30`,
        }}
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{ background: `radial-gradient(circle at center, ${signal.color}, transparent 70%)` }}
        />
        <div className="text-5xl mb-2 relative z-10">{signal.icon}</div>
        <div className="text-3xl font-black relative z-10" style={{ color: signal.color }}>
          {signal.action}
        </div>
        <p className="text-gray-400 text-xs mt-2 relative z-10">{signal.desc}</p>
      </div>

      {/* Factors */}
      <div className="space-y-2">
        <p className="text-[10px] text-gray-600 font-bold tracking-widest mb-2">FACTORES DE LA SEÑAL</p>
        {factors.map((f, i) => (
          <div key={i} className="flex justify-between items-center text-xs bg-gray-900/40 rounded-lg p-2.5 border border-gray-800/30">
            <span className="text-gray-400">{f.label}</span>
            <span style={{ color: f.color }} className="font-bold">{f.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-xl bg-amber-900/10 border border-amber-800/20">
        <p className="text-[11px] text-amber-400/70 text-center leading-relaxed">
          No operes solo con la Luna. Usala como reloj emocional + indicadores tecnicos.
        </p>
      </div>
    </div>
  );
}
