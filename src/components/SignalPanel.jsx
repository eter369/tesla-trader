import { useState } from "react";
import { Zap } from "lucide-react";
import { formatChange, numero, numeroConSigno, porcentaje } from "../utils/format";
import { fechaLima, ESTADOS_SENAL } from "../utils/lunar";
import { MIN_CASOS, PERCENTIL_VOLATILIDAD, DIAS_SEGUIMIENTO } from "../utils/senal";

const NOMBRE_ESTADO = {
  "ACUMULAR": "Acumular",
  "ESPERAR": "Esperar",
  "PRECAUCIÓN": "Precaución",
  "TOMAR GANANCIAS": "Tomar ganancias",
};
const verde = "#10b981", rojo = "#ef4444", ambar = "#fbbf24", gris = "#6b7280";

const puntos = (p) => (p === 0 ? "0" : numeroConSigno(p, Number.isInteger(p) ? 0 : 1));
const decimalesMacd = (v) => (Math.abs(v) >= 1 ? 2 : 3);

function zonaRsi(rsi) {
  if (rsi < 30) return "sobreventa";
  if (rsi > 70) return "sobrecompra";
  if (rsi < 45) return "bajo";
  if (rsi > 55) return "alto";
  return "neutral";
}

// Lectura de cada factor y la regla que le da puntos
function filasFactores(senal, analisis, lunarInfo, detailedPhase) {
  const p = Object.fromEntries(senal.aportes.map((a) => [a.id, a.puntos]));
  return [
    {
      id: "luna", nombre: "Fase lunar",
      lectura: `${detailedPhase?.name ?? ""} · ${lunarInfo.name.toLowerCase()} (${lunarInfo.dias})`,
      regla: "Tramo de luna nueva o creciente +1 · de luna llena -1 · menguante -0.5",
    },
    { id: "rsi", nombre: "RSI 14", lectura: `${analisis.rsi} · ${zonaRsi(analisis.rsi)}`, regla: "< 30 +2 · < 45 +0.5 · > 55 -0.5 · > 70 -2" },
    {
      id: "macd", nombre: "MACD 12-26-9",
      lectura: `${numeroConSigno(analisis.macd, decimalesMacd(analisis.macd))} · ${analisis.macd > 0 ? "alcista" : "bajista"}`,
      regla: "Histograma positivo +1 · negativo -1",
    },
    { id: "var24", nombre: "Variación 24 h", lectura: formatChange(analisis.variacion24), regla: "Suma solo si pasa de ±5 %: subida -0.5 · caída +0.5" },
  ].map((f) => ({ ...f, puntos: p[f.id] ?? 0 }));
}

function veredicto({ nEfectivo, p, tasa, base }) {
  if (!nEfectivo || nEfectivo < MIN_CASOS) return { corto: "muestra chica", color: gris, largo: `Menos de ${MIN_CASOS} casos: no alcanza para concluir` };
  const pTexto = p < 0.01 ? "p < 0.01" : `p = ${numero(p, 2)}`;
  if (p < 0.05 && tasa > base) return { corto: "mejor que el azar", color: verde, largo: pTexto };
  return { corto: "≈ azar", color: ambar, largo: `No se distingue del azar (${pTexto})` };
}

const fechaCorta = (ms) => fechaLima(ms, { day: "numeric", month: "short" }).replace(".", "");

function Seguimiento({ seguimiento }) {
  const [plazo, setPlazo] = useState(0);
  const h = seguimiento[plazo];
  const total = veredicto(h.total);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2 gap-2">
        <p className="text-[10px] text-gray-500 font-bold tracking-widest">SEGUIMIENTO DE {DIAS_SEGUIMIENTO} DÍAS</p>
        <div className="flex gap-1" role="group" aria-label="Plazo del seguimiento">
          {seguimiento.map((s, i) => (
            <button
              key={s.horas}
              type="button"
              onClick={() => setPlazo(i)}
              aria-pressed={plazo === i}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors ${
                plazo === i ? "bg-amber-400/15 text-amber-400 border border-amber-400/30" : "text-gray-500 border border-gray-800/40 hover:text-gray-300"
              }`}
            >
              {s.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {/* Titular: todas las señales con dirección, contra el azar */}
      <div className="rounded-lg p-2.5 border border-gray-800/40 bg-gray-900/40 text-xs mb-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-gray-400">
            Acierto <b className="text-gray-100 tabular-nums">{porcentaje(h.total.tasa)}</b> · azar <span className="tabular-nums">{porcentaje(h.total.base)}</span>
          </span>
          <span className="font-bold text-[11px] text-right" style={{ color: total.color }}>{total.corto}</span>
        </div>
        <p className="text-[10px] text-gray-500 mt-0.5">
          {h.total.n} señales con dirección{h.horas > 24 ? ` (muestra efectiva ${h.total.nEfectivo})` : ""} · {total.largo}
        </p>
      </div>

      {/* El titular de arriba queda siempre a la vista; el detalle por estado se despliega */}
      <details className="group">
        <summary className="cursor-pointer text-[10px] text-gray-400 hover:text-gray-200 select-none py-1">
          Detalle por estado y cómo se mide
        </summary>
      <table className="w-full text-[11px] mt-1">
        <caption className="sr-only">Aciertos de cada estado de la señal a {h.etiqueta}, comparados con el azar</caption>
        <thead>
          <tr className="text-[9px] text-gray-500 tracking-wider">
            <th scope="col" className="text-left font-bold pb-1">ESTADO</th>
            <th scope="col" className="text-right font-bold pb-1">CASOS</th>
            <th scope="col" className="text-right font-bold pb-1">ACIERTO</th>
            <th scope="col" className="text-right font-bold pb-1 pl-2">AZAR</th>
            <th scope="col" className="text-right font-bold pb-1 pl-1">RESULTADO</th>
          </tr>
        </thead>
        <tbody>
          {h.filas.map((f) => {
            const v = f.dir ? veredicto(f) : { corto: "sin dirección", color: gris, largo: "Esperar no apuesta a subida ni bajada" };
            return (
              <tr key={f.estado} className="border-t border-gray-800/30">
                <th scope="row" className="text-left font-semibold py-1.5 whitespace-nowrap" style={{ color: ESTADOS_SENAL[f.estado].color }}>
                  {NOMBRE_ESTADO[f.estado]}
                </th>
                <td className="text-right tabular-nums text-gray-300">{f.n}</td>
                <td className="text-right tabular-nums text-gray-300">{f.dir ? porcentaje(f.tasa) : "—"}</td>
                <td className="text-right tabular-nums text-gray-500 pl-2">{f.dir ? porcentaje(f.base) : "—"}</td>
                <td className="text-right font-bold pl-1 text-[10px]" style={{ color: v.color }} title={v.largo}>{v.corto}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="text-[9px] text-gray-600 mt-2 leading-relaxed">
        Un caso por día, a medianoche de Lima{h.desde ? ` (${fechaCorta(h.desde)} – ${fechaCorta(h.hasta)})` : ""}. Acierto: el precio
        subió {h.etiqueta} después de «Acumular» o bajó después de «Precaución» o «Tomar ganancias». Azar: % de esos mismos días en
        que el precio se movió en esa dirección. p: probabilidad de acertar igual o más por puro azar (prueba binomial). Con menos
        de {MIN_CASOS} casos no se saca conclusión.
        {h.horas > 24 && " Los plazos de 7 días se solapan entre sí, por eso la prueba usa la muestra efectiva (casos ÷ 7)."}
      </p>
      </details>
    </div>
  );
}

export default function SignalPanel({ senal, analisis, lunarInfo, detailedPhase, simbolo, error }) {
  if (!senal || !analisis) {
    return (
      <div className="card rounded-2xl p-5">
        <h3 className="text-xs font-bold text-gray-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
          <Zap size={14} className="text-amber-400" /> Señal Tesla 369
        </h3>
        <div className="skeleton h-28 rounded-xl mb-4" />
        <p className="text-xs text-gray-500" role="status">{error || "Calculando la señal con velas de 1 h de Binance…"}</p>
      </div>
    );
  }

  const factores = filasFactores(senal, analisis, lunarInfo, detailedPhase);
  const volAlta = analisis.umbralAtr != null && analisis.atr > analisis.umbralAtr;

  return (
    <div className="card rounded-2xl p-5">
      <h3 className="text-xs font-bold text-gray-400 mb-1 flex items-center gap-2 uppercase tracking-wider">
        <Zap size={14} className="text-amber-400" /> Señal Tesla 369
      </h3>
      <p className="text-[10px] text-gray-500 mb-4">
        {simbolo} · velas de 1 h de Binance · vela de las {fechaLima(analisis.tiempo, { hour: "2-digit", minute: "2-digit", hour12: false })} (Lima)
      </p>

      {/* Estado actual */}
      <div
        className="text-center p-4 rounded-xl mb-4 relative overflow-hidden"
        style={{ backgroundColor: senal.color + "10", border: `2px solid ${senal.color}30` }}
      >
        <div className="text-4xl mb-1" aria-hidden="true">{senal.icon}</div>
        <div className="text-2xl font-black" style={{ color: senal.color }}>{senal.action}</div>
        <p className="text-gray-400 text-xs mt-1.5">{senal.desc}</p>
      </div>

      {/* Por qué está en este estado */}
      <p className="text-[10px] text-gray-500 font-bold tracking-widest mb-2">POR QUÉ: PUNTOS DE CADA FACTOR</p>
      <div className="space-y-1.5">
        {factores.map((f) => (
          <div key={f.id} className="flex items-center gap-2 text-xs bg-gray-900/40 rounded-lg px-2.5 py-2 border border-gray-800/30" title={f.regla}>
            <span className="text-gray-400 flex-1 min-w-0">
              {f.nombre}
              <span className="block text-[10px] text-gray-500">{f.lectura}</span>
            </span>
            <span
              className="font-black tabular-nums w-10 text-right"
              style={{ color: f.puntos > 0 ? verde : f.puntos < 0 ? rojo : gris }}
            >
              {puntos(f.puntos)}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between text-xs px-2.5 pt-1">
          <span className="text-gray-300 font-bold">Puntaje total</span>
          <span className="font-black tabular-nums" style={{ color: senal.color }}>{puntos(senal.score)} → {NOMBRE_ESTADO[senal.action]}</span>
        </div>
        <p className="text-[9px] text-gray-600 px-2.5">
          Umbrales: 2 o más, Acumular · desde 0.5, Esperar · desde -1, Precaución · menos de -1, Tomar ganancias.
        </p>
      </div>

      {/* Volatilidad: se informa, no suma puntos */}
      <div className="mt-3 rounded-lg px-2.5 py-2 border border-gray-800/30 bg-gray-900/40 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-gray-400">Volatilidad (ATR 14, 1 h)</span>
          <span className="font-bold tabular-nums" style={{ color: volAlta ? rojo : verde }}>
            {numero(analisis.atr, 2)} % · {volAlta ? "alta" : "normal"}
          </span>
        </div>
        <p className="text-[10px] text-gray-500 mt-0.5">
          Umbral {numero(analisis.umbralAtr, 2)} % (percentil {PERCENTIL_VOLATILIDAD} de los últimos {DIAS_SEGUIMIENTO} días). Informativa: no suma al puntaje.
        </p>
      </div>

      <Seguimiento seguimiento={analisis.seguimiento} />

      <div className="mt-4 p-3 rounded-xl bg-amber-900/10 border border-amber-800/20">
        <p className="text-[11px] text-amber-400/70 text-center leading-relaxed">
          No operes solo con la Luna. Úsala como reloj emocional junto con los indicadores técnicos.
        </p>
      </div>
    </div>
  );
}
