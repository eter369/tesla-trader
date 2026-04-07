import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ComposedChart, CartesianGrid, ReferenceLine, Line, Bar,
} from "recharts";
import { DollarSign, Activity, BarChart3, Shield, Moon } from "lucide-react";
import { LUNAR_PHASES } from "../utils/lunar";

const TABS = [
  { id: "overview", label: "Precio", icon: DollarSign },
  { id: "rsi", label: "RSI", icon: Activity },
  { id: "macd", label: "MACD", icon: BarChart3 },
  { id: "bollinger", label: "Bollinger", icon: Shield },
  { id: "table", label: "Tabla Lunar", icon: Moon },
];

const TIME_RANGES = [
  { days: 1, label: "1D" },
  { days: 7, label: "7D" },
  { days: 30, label: "30D" },
  { days: 90, label: "90D" },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900/95 border border-gray-700/50 rounded-lg p-2.5 text-xs backdrop-blur-sm shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

export default function ChartSection({
  priceHistory, selectedCrypto, cryptoMeta, lunarInfo,
  activeTab, setActiveTab, timeRange, setTimeRange,
  indicators, livePrice,
}) {
  const hist = priceHistory[selectedCrypto];

  const chartData = useMemo(() => {
    if (!hist?.prices) return [];
    const data = hist.prices.map((p, i) => {
      const date = new Date(p[0]);
      return {
        time: timeRange <= 1
          ? date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
          : `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}:00`,
        price: Math.round(p[1] * 100) / 100,
        volume: hist.total_volumes?.[i]?.[1] || 0,
      };
    }).filter((_, i, arr) => i % Math.max(1, Math.floor(arr.length / 100)) === 0);

    // Append live price as the latest point
    if (livePrice && data.length > 0) {
      const now = new Date();
      const timeLabel = timeRange <= 1
        ? now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
        : `${now.getDate()}/${now.getMonth() + 1} ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
      const lastPoint = data[data.length - 1];
      // Update last point or add new one
      if (lastPoint) {
        data[data.length - 1] = {
          ...lastPoint,
          time: timeLabel + " \u25CF",
          price: Math.round(livePrice * 100) / 100,
        };
      }
    }

    return data;
  }, [hist, timeRange, livePrice]);

  const rsiData = useMemo(() => {
    if (!indicators?.rsi) return [];
    return indicators.rsi.slice(-50).map((r, i) => ({ index: i, rsi: r.value }));
  }, [indicators]);

  const macdData = useMemo(() => {
    if (!indicators?.macd) return [];
    return indicators.macd.slice(-50).map((m, i) => ({
      index: i, macd: m.macd, signal: m.signal, histogram: m.histogram,
    }));
  }, [indicators]);

  const bollingerData = useMemo(() => {
    if (!indicators?.bollinger) return [];
    return indicators.bollinger.slice(-50).map((b, i) => ({
      index: i, upper: b.upper, middle: b.middle, lower: b.lower, price: b.price,
    }));
  }, [indicators]);

  const meta = cryptoMeta[selectedCrypto];
  const titleMap = {
    overview: "Precio",
    rsi: "RSI (Relative Strength Index)",
    macd: "MACD (Moving Average Convergence Divergence)",
    bollinger: "Bandas de Bollinger",
    table: "Tabla de Influencia Lunar Avanzada",
  };

  return (
    <>
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-amber-400/15 text-amber-400 border border-amber-400/30 shadow-lg shadow-amber-900/10"
                  : "bg-gray-800/30 text-gray-500 border border-gray-800/20 hover:text-gray-300 hover:bg-gray-800/50"
              }`}
            >
              <Icon size={13} /> {tab.label}
            </button>
          );
        })}
        <div className="flex gap-1 ml-auto">
          {TIME_RANGES.map(tr => (
            <button
              key={tr.days}
              onClick={() => setTimeRange(tr.days)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                timeRange === tr.days
                  ? "bg-amber-400/15 text-amber-400 border border-amber-400/30"
                  : "bg-gray-800/30 text-gray-600 border border-transparent hover:text-gray-400"
              }`}
            >
              {tr.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="card rounded-2xl p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-400">
            <span style={{ color: meta?.color }}>{meta?.symbol}</span> — {titleMap[activeTab]}
          </h3>
          {activeTab === "overview" && livePrice && (
            <div className="flex items-center gap-2 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400/70 font-semibold">
                ${livePrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-gray-600">LIVE</span>
            </div>
          )}
        </div>

        {activeTab === "overview" && (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={meta?.color || "#fbbf24"} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={meta?.color || "#fbbf24"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.5} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#4b5563" }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "#4b5563" }} domain={["auto", "auto"]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="price" stroke={meta?.color || "#fbbf24"} fill="url(#priceGrad)" strokeWidth={2} dot={false} animationDuration={800} />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === "rsi" && (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={rsiData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.5} />
              <XAxis dataKey="index" tick={{ fontSize: 10, fill: "#4b5563" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#4b5563" }} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="5 5" label={{ value: "Sobrecompra 70", fill: "#ef4444", fontSize: 10, position: "right" }} />
              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="5 5" label={{ value: "Sobreventa 30", fill: "#10b981", fontSize: 10, position: "right" }} />
              <ReferenceLine y={50} stroke="#4b5563" strokeDasharray="3 3" strokeOpacity={0.5} />
              <defs>
                <linearGradient id="rsiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="rsi" fill="url(#rsiGrad)" stroke="none" />
              <Line type="monotone" dataKey="rsi" stroke="#fbbf24" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {activeTab === "macd" && (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={macdData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.5} />
              <XAxis dataKey="index" tick={{ fontSize: 10, fill: "#4b5563" }} />
              <YAxis tick={{ fontSize: 10, fill: "#4b5563" }} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#374151" />
              <Bar dataKey="histogram" radius={[2, 2, 0, 0]}>
                {macdData.map((entry, i) => (
                  <rect key={i} fill={entry.histogram >= 0 ? "#10b98180" : "#ef444480"} />
                ))}
              </Bar>
              <Line type="monotone" dataKey="macd" stroke="#22d3ee" strokeWidth={2} dot={false} name="MACD" />
              <Line type="monotone" dataKey="signal" stroke="#f97316" strokeWidth={2} dot={false} name="Signal" />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {activeTab === "bollinger" && (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={bollingerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.5} />
              <XAxis dataKey="index" tick={{ fontSize: 10, fill: "#4b5563" }} />
              <YAxis tick={{ fontSize: 10, fill: "#4b5563" }} domain={["auto", "auto"]} />
              <Tooltip content={<CustomTooltip />} />
              <defs>
                <linearGradient id="bbGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.05} />
                  <stop offset="50%" stopColor="transparent" stopOpacity={0} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="upper" stroke="#ef444460" fill="url(#bbGrad)" strokeWidth={1} dot={false} name="Upper" />
              <Line type="monotone" dataKey="middle" stroke="#fbbf24" strokeWidth={1} dot={false} strokeDasharray="5 5" name="SMA" />
              <Area type="monotone" dataKey="lower" stroke="#10b98160" fill="transparent" strokeWidth={1} dot={false} name="Lower" />
              <Line type="monotone" dataKey="price" stroke="#22d3ee" strokeWidth={2.5} dot={false} name="Precio" />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {activeTab === "table" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/40">
                  {["FASE", "INFLUENCIA ESOTERICA", "ARQUETIPO EMOCIONAL", "SEÑAL"].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] text-gray-500 font-bold tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LUNAR_PHASES.map((lp, i) => {
                  const isActive = lp.name === lunarInfo.name;
                  return (
                    <tr key={i} className={`border-b border-gray-800/20 transition-colors ${isActive ? "bg-amber-400/5" : "hover:bg-gray-800/20"}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{lp.icon}</span>
                          <span className={`font-bold text-sm ${isActive ? "text-amber-400" : "text-gray-300"}`}>{lp.name}</span>
                          {isActive && <span className="text-[9px] bg-amber-400/15 text-amber-400 px-2 py-0.5 rounded-full font-bold tracking-wider">ACTIVA</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300 text-sm">{lp.influence}</td>
                      <td className="py-3 px-4 text-gray-300 text-sm">{lp.archetype}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                          i === 0 ? "bg-emerald-400/10 text-emerald-400" :
                          i === 1 ? "bg-cyan-400/10 text-cyan-400" :
                          i === 2 ? "bg-amber-400/10 text-amber-400" :
                          "bg-red-400/10 text-red-400"
                        }`}>
                          {["ACUMULAR", "ESPERAR", "PRECAUCION", "TOMAR GANANCIAS"][i]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
