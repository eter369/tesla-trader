import { useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { calendarioAnual, diaLima, diasCalendarioLima, fechaLima } from "../utils/lunar";

// Lunas nuevas y llenas del año, calculadas con el motor lunar (Meeus) en hora
// de Lima. Ya no hay tablas escritas a mano: sirve para cualquier año.
const horaLima = (ms) => fechaLima(ms, { hour: "2-digit", minute: "2-digit", hour12: false });
const fechaCorta = (ms) => fechaLima(ms, { day: "numeric", month: "short" }).replace(".", "");

function LunarEventCard({ event, ahora }) {
  const isFull = event.tipo === "llena";
  const daysUntil = diasCalendarioLima(event.time, ahora);
  const isPast = daysUntil < 0;
  const isToday = daysUntil === 0;
  const isSoon = daysUntil > 0 && daysUntil <= 7;

  return (
    <div
      className={`relative rounded-xl p-3.5 border transition-all duration-300 group ${
        isPast
          ? "bg-gray-900/30 border-gray-800/30 opacity-50"
          : isToday
          ? "bg-amber-400/10 border-amber-400/40 shadow-lg shadow-amber-900/20 scale-[1.02]"
          : isSoon
          ? "bg-indigo-500/8 border-indigo-400/30 shadow-md shadow-indigo-900/10"
          : "bg-gray-900/40 border-gray-700/20 hover:border-gray-600/40 hover:bg-gray-800/30"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl" aria-hidden="true">{event.emoji}</span>
        <span
          className={`text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full ${
            isFull
              ? "bg-amber-400/15 text-amber-400 border border-amber-400/25"
              : "bg-indigo-400/15 text-indigo-400 border border-indigo-400/25"
          }`}
        >
          {isFull ? "LLENA" : "NUEVA"}
        </span>
      </div>

      <h4 className={`font-bold text-sm leading-tight ${isPast ? "text-gray-500" : "text-gray-200"}`}>
        {event.nombreTradicional}
      </h4>
      <p className="text-gray-500 text-xs mt-0.5 tabular-nums">
        {fechaCorta(event.time)} · {horaLima(event.time)}
      </p>

      {!isPast && (
        <p className={`text-[10px] font-bold mt-1.5 ${isToday ? "text-amber-400" : isSoon ? "text-indigo-400" : "text-gray-600"}`}>
          {isToday ? "HOY" : daysUntil === 1 ? "mañana" : `en ${daysUntil} días`}
        </p>
      )}

      {!isPast && (
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 50%, ${isFull ? "rgba(251,191,36,0.06)" : "rgba(99,102,241,0.06)"}, transparent 70%)` }}
        />
      )}
    </div>
  );
}

export default function LunarCalendarAnual() {
  // instante de montaje: basta para un calendario (se renueva al recargar)
  const [ahora] = useState(() => Date.now());
  const anioActual = Number(diaLima(ahora).slice(0, 4));
  const [anio, setAnio] = useState(anioActual);
  const eventos = useMemo(() => calendarioAnual(anio), [anio]);
  const proximo = useMemo(
    () => calendarioAnual(anioActual).concat(calendarioAnual(anioActual + 1)).find((e) => e.time >= ahora),
    [anioActual, ahora],
  );
  const filas = useMemo(() => {
    const out = [];
    for (let i = 0; i < eventos.length; i += 4) out.push(eventos.slice(i, i + 4));
    return out;
  }, [eventos]);

  return (
    <div className="card rounded-2xl p-5 mb-5 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h3 className="text-sm font-black flex items-center gap-2">
            <Calendar size={16} className="text-indigo-400" />
            <span className="gold-text">Calendario lunar {anio}</span>
            <span className="flex items-center gap-1 ml-1">
              <button type="button" onClick={() => setAnio(anio - 1)} disabled={anio <= anioActual - 1}
                className="p-1 rounded-md text-gray-500 hover:text-gray-200 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Año anterior"><ChevronLeft size={14} /></button>
              <button type="button" onClick={() => setAnio(anio + 1)} disabled={anio >= anioActual + 1}
                className="p-1 rounded-md text-gray-500 hover:text-gray-200 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Año siguiente"><ChevronRight size={14} /></button>
            </span>
          </h3>
          {proximo && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Próxima:</span>
              <span className="text-amber-400 font-bold">{proximo.emoji} {proximo.nombreTradicional}</span>
              <span className="text-gray-500 tabular-nums">
                {fechaCorta(proximo.time)}, {horaLima(proximo.time)} ({diasCalendarioLima(proximo.time, ahora) === 0 ? "hoy" : `en ${diasCalendarioLima(proximo.time, ahora)} días`})
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {filas.map((fila, i) => (
            <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {fila.map((e) => <LunarEventCard key={e.time} event={e} ahora={ahora} />)}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 mt-4 pt-3 border-t border-gray-800/30 text-[10px] text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400/60" />Luna llena</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-400/60" />Luna nueva</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-600/60" />Pasada</span>
          <span>Fechas y horas de Lima · nombres tradicionales del hemisferio norte</span>
        </div>
      </div>
    </div>
  );
}
