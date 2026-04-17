import AnimatedMoon from "./AnimatedMoon";
import MysticPortal from "./MysticPortal";
import { getMoonIllumination } from "../utils/lunar";

// Orb sits centered over the 170px moon at ~65% diameter → 110px
const MOON_SIZE = 170;
const ORB_SIZE = 110;

export default function MoonPhaseCard({ moonPhase, lunarInfo, nextPhaseDate }) {
  const illumination = getMoonIllumination(moonPhase);
  return (
    <div className="card rounded-2xl p-6 flex flex-col items-center animate-pulse-glow">
      {/* Relative stage for moon gauge + centered Mystic Portal orb */}
      <div
        className="relative"
        style={{ width: MOON_SIZE, height: MOON_SIZE }}
      >
        {/* z-0: background / gauge ring (AnimatedMoon SVG includes the % text) */}
        <div className="absolute inset-0 animate-float" style={{ zIndex: 0 }}>
          <AnimatedMoon phase={moonPhase} size={MOON_SIZE} />
        </div>

        {/* z-10: Mystic Portal orb — absolutely centered, 65% of gauge diameter,
            purple glow (pulse), slow spin, translucent so the % peeks through */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
          style={{
            width: ORB_SIZE,
            height: ORB_SIZE,
            zIndex: 10,
            opacity: 0.88,
            animation: "portalGlowPulse 4s ease-in-out infinite",
          }}
        >
          <div
            className="w-full h-full"
            style={{ animation: "portalSpin 60s linear infinite" }}
          >
            <MysticPortal compact displaySize={ORB_SIZE} />
          </div>
        </div>

        {/* z-20: percentage label — centered, kept visible above the orb */}
        <div
          className="absolute text-center pointer-events-none select-none"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 20,
            textShadow: "0 0 10px rgba(0,0,0,0.9), 0 0 18px rgba(0,0,0,0.7)",
          }}
        >
          <div
            className="font-black leading-none tabular-nums"
            style={{ fontSize: 26, color: "#fde68a" }}
          >
            {illumination}%
          </div>
          <div
            className="font-bold tracking-[0.15em] mt-0.5"
            style={{ fontSize: 9, color: "#f59e0b", opacity: 0.85 }}
          >
            ILUMINACION
          </div>
        </div>
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
