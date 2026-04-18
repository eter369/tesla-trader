import { useCallback } from "react";
import AnimatedMoon from "./AnimatedMoon";
import MysticPortal from "./MysticPortal";

export default function MoonPhaseCard({ moonPhase, lunarInfo, nextPhaseDate }) {
  // Navigate to dedicated Bibliotheca page (clean URL, full-page experience).
  // Uses history.pushState + popstate so SPA routing works without a hard reload.
  const goToBiblioteca = useCallback(() => {
    const target = "/biblioteca/";
    if (window.location.pathname !== target) {
      window.history.pushState({}, "", target);
      window.dispatchEvent(new PopStateEvent("popstate"));
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <div className="card rounded-2xl p-6 flex flex-col items-center animate-pulse-glow">
      {/* Portal Místico — encima de la luna, con halo + rayos giratorios */}
      <div className="relative mb-2" style={{ width: 110, height: 110 }}>
        {/* Rayos de luz giratorios */}
        <div
          className="absolute top-1/2 left-1/2 pointer-events-none"
          style={{
            width: 220,
            height: 220,
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgba(139,92,246,0.35) 12deg, transparent 30deg, transparent 90deg, rgba(34,211,238,0.28) 102deg, transparent 120deg, transparent 180deg, rgba(245,166,35,0.25) 192deg, transparent 210deg, transparent 270deg, rgba(192,132,252,0.3) 282deg, transparent 300deg, transparent 360deg)",
            WebkitMaskImage:
              "radial-gradient(circle, rgba(0,0,0,0.9) 35%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0) 75%)",
            maskImage:
              "radial-gradient(circle, rgba(0,0,0,0.9) 35%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0) 75%)",
            filter: "blur(2px)",
            animation: "portalRaysSpin 18s linear infinite",
            transformOrigin: "center",
            transform: "translate(-50%, -50%)",
            zIndex: 0,
            mixBlendMode: "screen",
          }}
        />
        {/* Halo radial púrpura pulsando */}
        <div
          className="absolute top-1/2 left-1/2 pointer-events-none"
          style={{
            width: 190,
            height: 190,
            background:
              "radial-gradient(circle, rgba(139,92,246,0.55) 0%, rgba(139,92,246,0.25) 30%, rgba(139,92,246,0) 65%)",
            animation: "portalBackHalo 3.5s ease-in-out infinite",
            transformOrigin: "center",
            transform: "translate(-50%, -50%)",
            zIndex: 1,
            mixBlendMode: "screen",
            filter: "blur(4px)",
          }}
        />
        {/* El orbe — navega a /biblioteca/ */}
        <div
          className="absolute inset-0"
          style={{ zIndex: 2, animation: "portalGlowPulse 4s ease-in-out infinite" }}
        >
          <MysticPortal compact displaySize={110} onEnter={goToBiblioteca} />
        </div>
      </div>

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
