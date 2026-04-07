import { useMemo } from "react";
import { Calendar } from "lucide-react";

const FULL_MOONS_2026 = [
  { month: "Ene", day: 3, name: "Wolf Moon", emoji: "🐺", nameEs: "Luna del Lobo" },
  { month: "Feb", day: 1, name: "Snow Moon", emoji: "❄️", nameEs: "Luna de Nieve" },
  { month: "Mar", day: 3, name: "Worm Moon", emoji: "🪱", nameEs: "Luna del Gusano" },
  { month: "Abr", day: 1, name: "Pink Moon", emoji: "🌸", nameEs: "Luna Rosa" },
  { month: "May", day: 1, name: "Flower Moon", emoji: "🌺", nameEs: "Luna de las Flores" },
  { month: "May", day: 31, name: "Strawberry Moon", emoji: "🍓", nameEs: "Luna de Fresa" },
  { month: "Jun", day: 30, name: "Buck Moon", emoji: "🦌", nameEs: "Luna del Ciervo" },
  { month: "Jul", day: 29, name: "Sturgeon Moon", emoji: "🐟", nameEs: "Luna del Esturion" },
  { month: "Ago", day: 28, name: "Corn Moon", emoji: "🌽", nameEs: "Luna del Maiz" },
  { month: "Sep", day: 27, name: "Harvest Moon", emoji: "🌾", nameEs: "Luna de Cosecha" },
  { month: "Oct", day: 26, name: "Hunter's Moon", emoji: "🏹", nameEs: "Luna del Cazador" },
  { month: "Nov", day: 25, name: "Beaver Moon", emoji: "🦫", nameEs: "Luna del Castor" },
  { month: "Dic", day: 24, name: "Cold Moon", emoji: "🥶", nameEs: "Luna Fria" },
];

const NEW_MOONS_2026 = [
  { month: "Ene", day: 18 },
  { month: "Feb", day: 17 },
  { month: "Mar", day: 19 },
  { month: "Abr", day: 17 },
  { month: "May", day: 16 },
  { month: "Jun", day: 14 },
  { month: "Jul", day: 14 },
  { month: "Ago", day: 12 },
  { month: "Sep", day: 11 },
  { month: "Oct", day: 10 },
  { month: "Nov", day: 9 },
  { month: "Dic", day: 8 },
];

const MONTH_MAP = {
  Ene: 0, Feb: 1, Mar: 2, Abr: 3, May: 4, Jun: 5,
  Jul: 6, Ago: 7, Sep: 8, Oct: 9, Nov: 10, Dic: 11,
};

function getDaysUntil(month, day) {
  const now = new Date();
  const target = new Date(2026, MONTH_MAP[month], day);
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff;
}

function LunarEventCard({ event, type }) {
  const isFull = type === "full";
  const daysUntil = getDaysUntil(event.month, event.day);
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
      {/* Badge */}
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{isFull ? event.emoji : "🌑"}</span>
        <span
          className={`text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full ${
            isFull
              ? "bg-amber-400/15 text-amber-400 border border-amber-400/25"
              : "bg-indigo-400/15 text-indigo-400 border border-indigo-400/25"
          }`}
        >
          {isFull ? "FULL" : "NEW"}
        </span>
      </div>

      {/* Name */}
      <h4 className={`font-bold text-sm leading-tight ${isPast ? "text-gray-500" : "text-gray-200"}`}>
        {isFull ? event.name : "Luna Nueva"}
      </h4>

      {/* Date */}
      <p className="text-gray-500 text-xs mt-0.5">
        {event.day} {event.month}
      </p>

      {/* Days countdown */}
      {!isPast && (
        <p className={`text-[10px] font-bold mt-1.5 ${
          isToday ? "text-amber-400" : isSoon ? "text-indigo-400" : "text-gray-600"
        }`}>
          {isToday ? "HOY" : `${daysUntil}d`}
        </p>
      )}

      {/* Glow effect on hover */}
      {!isPast && (
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${isFull ? "rgba(251,191,36,0.06)" : "rgba(99,102,241,0.06)"}, transparent 70%)`,
          }}
        />
      )}
    </div>
  );
}

export default function LunarCalendar2026() {
  // Merge and sort all events by date
  const allEvents = useMemo(() => {
    const full = FULL_MOONS_2026.map(e => ({ ...e, type: "full" }));
    const newM = NEW_MOONS_2026.map(e => ({ ...e, type: "new", name: "Luna Nueva", emoji: "🌑" }));
    const all = [...full, ...newM];
    all.sort((a, b) => {
      const dateA = new Date(2026, MONTH_MAP[a.month], a.day);
      const dateB = new Date(2026, MONTH_MAP[b.month], b.day);
      return dateA - dateB;
    });
    return all;
  }, []);

  // Group in pairs (Full + New per month roughly)
  const rows = useMemo(() => {
    const result = [];
    for (let i = 0; i < allEvents.length; i += 4) {
      result.push(allEvents.slice(i, i + 4));
    }
    return result;
  }, [allEvents]);

  // Find next upcoming event
  const nextEvent = useMemo(() => {
    return allEvents.find(e => getDaysUntil(e.month, e.day) >= 0);
  }, [allEvents]);

  return (
    <div className="card rounded-2xl p-5 mb-5 relative overflow-hidden">
      {/* Subtle purple glow background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-black flex items-center gap-2">
            <Calendar size={16} className="text-indigo-400" />
            <span className="gold-text">Lunar Calendar 2026</span>
          </h3>
          {nextEvent && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Proxima:</span>
              <span className="text-amber-400 font-bold">
                {nextEvent.emoji} {nextEvent.type === "full" ? nextEvent.name : "Luna Nueva"}
              </span>
              <span className="text-gray-600">
                {nextEvent.day} {nextEvent.month} ({getDaysUntil(nextEvent.month, nextEvent.day)}d)
              </span>
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="space-y-3">
          {rows.map((row, ri) => (
            <div key={ri} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {row.map((event, ei) => (
                <LunarEventCard key={`${ri}-${ei}`} event={event} type={event.type} />
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-gray-800/30">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <span className="w-2 h-2 rounded-full bg-amber-400/60" />
            Luna Llena (Full Moon)
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <span className="w-2 h-2 rounded-full bg-indigo-400/60" />
            Luna Nueva (New Moon)
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <span className="w-2 h-2 rounded-full bg-gray-600/60" />
            Pasada
          </div>
        </div>
      </div>
    </div>
  );
}
