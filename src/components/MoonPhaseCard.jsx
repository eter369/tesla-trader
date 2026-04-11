import AnimatedMoon from "./AnimatedMoon";

export default function MoonPhaseCard({ moonPhase, lunarInfo, nextPhaseDate }) {
  return (
    <div className="card rounded-2xl p-6 flex flex-col items-center animate-pulse-glow">
      <div className="animate-float">
        <AnimatedMoon phase={moonPhase} size={170} />
      </div>

      <h2 className="text-2xl font-black mt-4 gold-text tracking-tight">{lunarInfo.name}</h2>
      <p className="text-amber-400/60 text-sm font-medium">{lunarInfo.archetype}</p>

      <div
        className="mt-3 px-4 py-2 rounded-full text-xs font-bold tracking-wide"
        style={{
          backgroundColor: lunarInfo.color + "18",
          color: lunarInfo.color,
          border: `1px solid ${lunarInfo.color}35`,
          boxShadow: `0 0 20px ${lunarInfo.color}10`,
        }}
      >
        {lunarInfo.emoji} {lunarInfo.signal}
      </div>

      <p className="text-gray-400 text-xs mt-4 text-center leading-relaxed max-w-[260px]">
        {lunarInfo.description}
      </p>

      {nextPhaseDate && (
        <div className="mt-4 pt-3 border-t border-gray-800/50 w-full text-center">
          <p className="text-gray-500 text-xs">
            Proxima fase:{" "}
            <span className="text-amber-400 font-semibold">{nextPhaseDate.phase.name}</span>
          </p>
          <p className="text-gray-600 text-xs mt-0.5">
            {nextPhaseDate.phase.icon}{" "}
            {nextPhaseDate.date.toLocaleDateString("es-ES", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
      )}
    </div>
  );
}
