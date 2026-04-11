import { Calendar } from "lucide-react";

export default function LunarCalendar({ lunarCalendar }) {
  if (!lunarCalendar || lunarCalendar.length === 0) return null;

  return (
    <div className="card rounded-2xl p-4 mb-5">
      <h3 className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
        <Calendar size={14} className="text-amber-400" /> Calendario Lunar — Proximos 7 Dias
      </h3>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {lunarCalendar.map((day, i) => (
          <div
            key={i}
            className={`flex-shrink-0 flex flex-col items-center p-3 rounded-xl min-w-[72px] transition-all ${
              day.isToday
                ? "bg-amber-400/10 border border-amber-400/30 shadow-lg shadow-amber-900/10"
                : "bg-gray-900/30 border border-gray-800/30"
            }`}
          >
            <span className={`text-[10px] font-bold uppercase tracking-wider ${day.isToday ? "text-amber-400" : "text-gray-500"}`}>
              {day.dayLabel}
            </span>
            <span className="text-2xl my-1">{day.phase.icon}</span>
            <span className="text-[10px] text-gray-400 font-medium">{day.dateLabel}</span>
            <span className={`text-[9px] mt-1 font-semibold ${day.isToday ? "text-amber-400/80" : "text-gray-600"}`}>
              {day.illumination}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
