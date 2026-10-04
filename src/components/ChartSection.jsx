import { useMemo, useState } from "react";
import {
  ComposedChart, Area, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Cell,
} from "recharts";
import { DollarSign, Activity, BarChart3, Shield, Moon } from "lucide-react";
import { LUNAR_PHASES, eventosLunares, fechaLima, diaLima } from "../utils/lunar";
import { calculateRSI, calculateMACD, calculateBollingerBands } from "../utils/indicators";
import { MS_INTERVALO } from "../utils/binance";
import { velasDeRango } from "../hooks/useCryptoData";
import { formatPricePrecise, formatVolume, numero } from "../utils/format";
import EstadisticaLunar from "./EstadisticaLunar";

const TABS = [
  { id: "overview", label: "Precio", icon: DollarSign },
  { id: "rsi", label: "RSI", icon: Activity },
  { id: "macd", label: "MACD", icon: BarChart3 },
  { id: "bollinger", label: "Bollinger", icon: Shield },
  { id: "table", label: "Tabla lunar", icon: Moon },
];

const TIME_RANGES = [
  { days: 1, label: "1D", nombre: "1 día" },
  { days: 7, label: "7D", nombre: "7 días" },
  { days: 30, label: "30D", nombre: "30 días" },
  { days: 90, label: "90D", nombre: "90 días" },
];

// Aporte de cada fase al puntaje de la señal (mismo orden que LUNAR_PHASES)
const APORTE_LUNAR = ["+1", "+1", "-1", "-0.5"];

const EJE = { fontSize: 10, fill: "#6b7280" };
const DIA = 864e5;

function etiquetaTiempo(t, paso, largo = false) {
  if (paso >= DIA) return fechaLima(t, { day: "numeric", month: "short", ...(largo ? { weekday: "short", year: "numeric" } : {}) }).replace(/\./g, "");
  if (!largo) return fechaLima(t, { hour: "2-digit", minute: "2-digit", hour12: false });
  return fechaLima(t, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).replace(/\./g, "");
}

const precioEje = (v) => numero(v, v >= 1000 ? 0 : 2);

// Vela japonesa dibujada sobre la barra de rango [mínimo, máximo]
function Vela({ x, y, width, height, payload }) {
  if (x == null || !payload) return null;
  const { o, h, l, c } = payload;
  const sube = c >= o;
  const color = sube ? "#10b981" : "#ef4444";
  const escala = h > l ? height / (h - l) : 0;
  const yDe = (v) => y + (h - v) * escala;
  const centro = x + width / 2;
  const ancho = Math.max(1, width * 0.75);
  return (
    <g>
      <line x1={centro} x2={centro} y1={y} y2={y + height} stroke={color} strokeWidth={1} />
      <rect x={centro - ancho / 2} y={yDe(Math.max(o, c))} width={ancho} height={Math.max(1, Math.abs(yDe(o) - yDe(c)))} fill={color} />
    </g>
  );
}

function Globo({ active, payload, label, paso, filas }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-gray-900/95 border border-gray-700/50 rounded-lg p-2.5 text-xs backdrop-blur-sm shadow-xl">
      <p className="text-gray-400 mb-1">{etiquetaTiempo(label, paso, true)} (Lima)</p>
      {filas(d).map(([nombre, valor, color]) => (
        <p key={nombre} className="font-semibold tabular-nums" style={{ color: color || "#e5e7eb" }}>
          {nombre}: {valor}
        </p>
      ))}
    </div>
  );
}

function leerModo() {
  try {
    return localStorage.getItem("t369-modo-grafico") || "velas";
  } catch {
    return "velas";
  }
}

export default function ChartSection({
  priceHistory, selectedCrypto, cryptoMeta, lunarInfo,
  activeTab, setActiveTab, timeRange, setTimeRange, livePrice,
}) {
  const hist = priceHistory[selectedCrypto];
  const [modo, setModo] = useState(leerModo);
  const paso = MS_INTERVALO[hist?.interval] || 36e5;
  const { etiqueta } = velasDeRango(timeRange);

  const cambiarModo = (m) => {
    setModo(m);
    try { localStorage.setItem("t369-modo-grafico", m); } catch { /* sin almacenamiento */ }
  };

  // Velas del rango; la última se actualiza con el precio en vivo
  const datos = useMemo(() => {
    if (!hist?.velas) return [];
    const d = hist.velas.map(([t, o, h, l, c, v]) => ({ t, o, h, l, c, v, rango: [l, h] }));
    if (livePrice && d.length) {
      const u = d[d.length - 1];
      const h = Math.max(u.h, livePrice), l = Math.min(u.l, livePrice);
      d[d.length - 1] = { ...u, c: livePrice, h, l, rango: [l, h] };
    }
    return d;
  }, [hist, livePrice]);

  // Lunas nuevas y llenas dentro del rango, ancladas a la vela que las contiene
  const lunas = useMemo(() => {
    const v = hist?.velas;
    if (!v || v.length < 2) return [];
    const p = MS_INTERVALO[hist.interval];
    return eventosLunares(v[0][0], v[v.length - 1][0] + p)
      .filter((e) => e.tipo === "nueva" || e.tipo === "llena")
      .map((e) => {
        const vela = v.findLast((x) => x[0] <= e.time);
        return vela && { t: vela[0], icono: e.icono, nombre: e.nombre, tiempo: e.time };
      })
      .filter(Boolean);
  }, [hist]);

  // Indicadores sobre las mismas velas del gráfico
  const ind = useMemo(() => {
    if (!hist?.velas) return { rsi: [], macd: [], bb: [] };
    const cierres = hist.velas.map((v) => v[4]);
    const ts = hist.velas.map((v) => v[0]);
    const macd = calculateMACD(cierres);
    const desfase = cierres.length - macd.length;
    return {
      rsi: calculateRSI(cierres).map((r) => ({ t: ts[r.index], rsi: r.value })),
      macd: macd.map((m, i) => ({ t: ts[i + desfase], macd: m.macd, senal: m.signal, histograma: m.histogram })),
      bb: calculateBollingerBands(cierres).map((b) => ({ t: ts[b.index], superior: b.upper, media: b.middle, inferior: b.lower, precio: b.price })),
    };
  }, [hist]);

  const meta = cryptoMeta[selectedCrypto];
  const titleMap = {
    overview: "Precio",
    rsi: "RSI 14 (índice de fuerza relativa)",
    macd: "MACD 12-26-9 (convergencia y divergencia de medias)",
    bollinger: "Bandas de Bollinger (20, 2)",
    table: "Tabla de influencia lunar",
  };
  // En rangos de varios días, una marca por día (la primera vela de cada día de Lima)
  const marcasDia = useMemo(() => {
    const v = hist?.velas;
    if (!v || timeRange <= 1) return undefined;
    return v.filter((x, i) => i === 0 || diaLima(x[0]) !== diaLima(v[i - 1][0])).map((x) => x[0]);
  }, [hist, timeRange]);
  const ejeX = (
    <XAxis dataKey="t" tick={EJE} ticks={marcasDia} tickFormatter={(t) => etiquetaTiempo(t, timeRange <= 1 ? paso : Math.max(paso, DIA))} minTickGap={28} />
  );
  const lineasLunares = lunas.map((l) => (
    <ReferenceLine
      key={l.tiempo}
      x={l.t}
      stroke={l.icono === "🌕" ? "#fbbf24" : "#818cf8"}
      strokeDasharray="4 4"
      strokeOpacity={0.7}
      label={{ value: l.icono, position: "insideTop", fontSize: 14 }}
    />
  ));

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide" role="tablist" aria-label="Vistas del gráfico">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-amber-400/15 text-amber-400 border border-amber-400/30 shadow-lg shadow-amber-900/10"
                    : "bg-gray-800/30 text-gray-400 border border-gray-800/20 hover:text-gray-200 hover:bg-gray-800/50"
                }`}
              >
                <Icon size={13} aria-hidden="true" /> {tab.label}
              </button>
            );
          })}
        </div>
        {activeTab !== "table" && (
          <div className="flex gap-1 ml-auto" role="group" aria-label="Rango del gráfico">
            {TIME_RANGES.map(tr => (
              <button
                key={tr.days}
                type="button"
                onClick={() => setTimeRange(tr.days)}
                aria-pressed={timeRange === tr.days}
                aria-label={tr.nombre}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  timeRange === tr.days
                    ? "bg-amber-400/15 text-amber-400 border border-amber-400/30"
                    : "bg-gray-800/30 text-gray-500 border border-transparent hover:text-gray-300"
                }`}
              >
                {tr.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="card rounded-2xl p-4 sm:p-5 mb-5">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-300">
              <span style={{ color: meta?.color }}>{meta?.symbol}</span> — {titleMap[activeTab]}
            </h3>
            {activeTab !== "table" && (
              <p className="text-[10px] text-gray-500 mt-0.5">Velas de {etiqueta} · Binance · hora de Lima</p>
            )}
          </div>
          {activeTab === "overview" && (
            <div className="flex items-center gap-2">
              {livePrice && (
                <span className="flex items-center gap-1.5 text-xs mr-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400/80 font-semibold tabular-nums">{formatPricePrecise(livePrice)}</span>
                  <span className="text-gray-500">EN VIVO</span>
                </span>
              )}
              <div className="flex rounded-lg border border-gray-800/50 overflow-hidden" role="group" aria-label="Tipo de gráfico">
                {[["velas", "Velas"], ["linea", "Línea"]].map(([id, nombre]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => cambiarModo(id)}
                    aria-pressed={modo === id}
                    className={`px-2.5 py-1 text-[11px] font-bold transition-colors ${modo === id ? "bg-amber-400/15 text-amber-400" : "text-gray-500 hover:text-gray-300"}`}
                  >
                    {nombre}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {activeTab === "overview" && (
          <>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={datos} barCategoryGap="15%" margin={{ top: 18, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={meta?.color || "#fbbf24"} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={meta?.color || "#fbbf24"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.5} />
                {ejeX}
                <YAxis tick={EJE} domain={["auto", "auto"]} tickFormatter={precioEje} width={62} />
                <Tooltip
                  content={
                    <Globo
                      paso={paso}
                      filas={(d) =>
                        modo === "velas"
                          ? [
                              ["Apertura", formatPricePrecise(d.o)],
                              ["Máximo", formatPricePrecise(d.h), "#10b981"],
                              ["Mínimo", formatPricePrecise(d.l), "#ef4444"],
                              ["Cierre", formatPricePrecise(d.c), d.c >= d.o ? "#10b981" : "#ef4444"],
                              ["Volumen", formatVolume(d.v), "#9ca3af"],
                            ]
                          : [["Cierre", formatPricePrecise(d.c), meta?.color], ["Volumen", formatVolume(d.v), "#9ca3af"]]
                      }
                    />
                  }
                />
                {lineasLunares}
                {modo === "velas" ? (
                  <Bar dataKey="rango" shape={<Vela />} isAnimationActive={false} />
                ) : (
                  <Area type="monotone" dataKey="c" stroke={meta?.color || "#fbbf24"} fill="url(#priceGrad)" strokeWidth={2} dot={false} isAnimationActive={false} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-gray-500 mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <span><span className="text-indigo-300">┊</span> 🌑 luna nueva</span>
              <span><span className="text-amber-300">┊</span> 🌕 luna llena</span>
              {lunas.length > 0 && (
                <span>
                  {lunas.map((l) => `${l.icono} ${etiquetaTiempo(l.tiempo, 36e5, true)}`).join(" · ")}
                </span>
              )}
            </p>
          </>
        )}

        {activeTab === "rsi" && (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={ind.rsi} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.5} />
              {ejeX}
              <YAxis domain={[0, 100]} tick={EJE} width={36} />
              <Tooltip content={<Globo paso={paso} filas={(d) => [["RSI", d.rsi, "#fbbf24"]]} />} />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="5 5" label={{ value: "Sobrecompra 70", fill: "#ef4444", fontSize: 10, position: "insideTopRight" }} />
              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="5 5" label={{ value: "Sobreventa 30", fill: "#10b981", fontSize: 10, position: "insideBottomRight" }} />
              <ReferenceLine y={50} stroke="#4b5563" strokeDasharray="3 3" strokeOpacity={0.5} />
              <defs>
                <linearGradient id="rsiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="rsi" fill="url(#rsiGrad)" stroke="none" isAnimationActive={false} />
              <Line type="monotone" dataKey="rsi" stroke="#fbbf24" strokeWidth={2} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {activeTab === "macd" && (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={ind.macd} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.5} />
              {ejeX}
              <YAxis tick={EJE} width={52} tickFormatter={(v) => numero(v, Math.abs(v) >= 10 ? 0 : 2)} />
              <Tooltip
                content={
                  <Globo
                    paso={paso}
                    filas={(d) => [["MACD", numero(d.macd, 2), "#22d3ee"], ["Señal", numero(d.senal, 2), "#f97316"], ["Histograma", numero(d.histograma, 2), d.histograma >= 0 ? "#10b981" : "#ef4444"]]}
                  />
                }
              />
              <ReferenceLine y={0} stroke="#374151" />
              <Bar dataKey="histograma" isAnimationActive={false}>
                {ind.macd.map((m) => (
                  <Cell key={m.t} fill={m.histograma >= 0 ? "#10b98180" : "#ef444480"} />
                ))}
              </Bar>
              <Line type="monotone" dataKey="macd" stroke="#22d3ee" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="senal" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {activeTab === "bollinger" && (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={ind.bb} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.5} />
              {ejeX}
              <YAxis tick={EJE} domain={["auto", "auto"]} tickFormatter={precioEje} width={62} />
              <Tooltip
                content={
                  <Globo
                    paso={paso}
                    filas={(d) => [
                      ["Banda superior", formatPricePrecise(d.superior), "#ef4444"],
                      ["Media 20", formatPricePrecise(d.media), "#fbbf24"],
                      ["Banda inferior", formatPricePrecise(d.inferior), "#10b981"],
                      ["Cierre", formatPricePrecise(d.precio), "#22d3ee"],
                    ]}
                  />
                }
              />
              <Line type="monotone" dataKey="superior" stroke="#ef444490" strokeWidth={1} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="media" stroke="#fbbf24" strokeWidth={1} dot={false} strokeDasharray="5 5" isAnimationActive={false} />
              <Line type="monotone" dataKey="inferior" stroke="#10b98190" strokeWidth={1} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="precio" stroke="#22d3ee" strokeWidth={2.5} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {activeTab === "table" && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="border-b border-gray-700/40">
                    {["TRAMO DE LA LUNACIÓN", "INFLUENCIA ESOTÉRICA", "ARQUETIPO EMOCIONAL", "APORTE A LA SEÑAL"].map(h => (
                      <th key={h} scope="col" className="text-left py-3 px-4 text-[10px] text-gray-500 font-bold tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {LUNAR_PHASES.map((lp, i) => {
                    const isActive = lp.id === lunarInfo.nameEn;
                    const aporte = APORTE_LUNAR[i];
                    return (
                      <tr key={lp.name} className={`border-b border-gray-800/20 transition-colors ${isActive ? "bg-amber-400/5" : "hover:bg-gray-800/20"}`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xl" aria-hidden="true">{lp.icon}</span>
                            <span className={`font-bold text-sm ${isActive ? "text-amber-400" : "text-gray-300"}`}>
                              {lp.name}
                              <span className="block text-[10px] font-normal text-gray-500">{lp.dias}</span>
                            </span>
                            {isActive && <span className="text-[9px] bg-amber-400/15 text-amber-400 px-2 py-0.5 rounded-full font-bold tracking-wider">ACTIVA</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-300 text-sm">{lp.influence}</td>
                        <td className="py-3 px-4 text-gray-300 text-sm">{lp.archetype}</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold tabular-nums ${aporte.startsWith("+") ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"}`}>
                            {aporte} {aporte === "+1" || aporte === "-1" ? "punto" : "puntos"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <EstadisticaLunar />
          </>
        )}
      </div>
    </>
  );
}
