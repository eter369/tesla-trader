import { useCallback, useMemo } from "react";
import AnimatedMoon from "./AnimatedMoon";
import MysticPortal from "./MysticPortal";

// Phase-driven background gradients for the card. Each phase gets its own
// ambient color so the card visually "breathes" with the lunar cycle.
function getPhaseTheme(phase) {
  const p = ((phase % 1) + 1) % 1;
  if (p < 0.0625 || p >= 0.9375) {
    return {
      glow: "rgba(99,102,241,0.18)",
      ring: "rgba(99,102,241,0.22)",
      gradient: "radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.16) 0%, transparent 55%), linear-gradient(180deg, rgba(15,15,35,0.85) 0%, rgba(8,8,20,0.92) 100%)",
    };
  }
  if (p < 0.3125) {
    return {
      glow: "rgba(34,211,238,0.18)",
      ring: "rgba(34,211,238,0.22)",
      gradient: "radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.14) 0%, transparent 55%), linear-gradient(180deg, rgba(8,18,30,0.85) 0%, rgba(8,8,20,0.92) 100%)",
    };
  }
  if (p < 0.5625) {
    return {
      glow: "rgba(251,191,36,0.22)",
      ring: "rgba(251,191,36,0.30)",
      gradient: "radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.16) 0%, transparent 55%), linear-gradient(180deg, rgba(30,20,8,0.85) 0%, rgba(15,10,5,0.92) 100%)",
    };
  }
  return {
    glow: "rgba(239,68,68,0.16)",
    ring: "rgba(168,85,247,0.25)",
    gradient: "radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.13) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(168,85,247,0.10) 0%, transparent 50%), linear-gradient(180deg, rgba(20,8,20,0.85) 0%, rgba(8,5,15,0.92) 100%)",
  };
}

// Map signal action → bias intensity (0..1) and color for the ring gauge
function getBiasMeta(signal, lunarInfo) {
  const fallback = { value: 0.5, color: lunarInfo?.color || "#a78bfa", label: "NEUTRAL" };
  if (!signal) return fallback;
  const map = {
    "ACUMULAR":         { value: 0.92, color: "#10b981", label: "BULLISH FUERTE" },
    "ESPERAR":          { value: 0.55, color: "#22d3ee", label: "MIXTO" },
    "PRECAUCIÓN":       { value: 0.40, color: "#f59e0b", label: "CAUTELA" },
    "TOMAR GANANCIAS":  { value: 0.18, color: "#ef4444", label: "BEARISH" },
  };
  return map[signal.action] || fallback;
}

function formatCountdown(days) {
  if (days < 0) return "ahora";
  const totalHours = Math.round(days * 24);
  if (totalHours < 1) return "<1h";
  if (totalHours < 24) return `${totalHours}h`;
  const d = Math.floor(totalHours / 24);
  const h = totalHours % 24;
  if (h === 0) return `${d}d`;
  return `${d}d ${h}h`;
}

// Cycle timeline: 5 anchor positions (new → 1Q → full → 3Q → new)
const TIMELINE_ANCHORS = [
  { fraction: 0,    icon: "🌑", label: "Nueva" },
  { fraction: 0.25, icon: "🌓", label: "1ºC" },
  { fraction: 0.5,  icon: "🌕", label: "Llena" },
  { fraction: 0.75, icon: "🌗", label: "1ºM" },
  { fraction: 1,    icon: "🌑", label: "Nueva" },
];

function CycleTimeline({ phase, accentColor }) {
  const pct = (((phase % 1) + 1) % 1) * 100;
  return (
    <div className="w-full mt-4 px-1">
      <div className="relative h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        {/* Filled portion = elapsed cycle */}
        <div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${accentColor}40, ${accentColor})`,
            transition: "width 0.6s ease",
            boxShadow: `0 0 8px ${accentColor}80`,
          }}
        />
        {/* Current position dot */}
        <div
          className="absolute top-1/2 w-2.5 h-2.5 rounded-full"
          style={{
            left: `${pct}%`,
            transform: "translate(-50%, -50%)",
            background: accentColor,
            boxShadow: `0 0 12px ${accentColor}, 0 0 4px ${accentColor}`,
            border: "1.5px solid #0a0a14",
          }}
        />
        {/* Anchor markers */}
        {TIMELINE_ANCHORS.slice(0, 4).map((a) => (
          <div
            key={a.fraction}
            className="absolute top-1/2 w-px h-2"
            style={{
              left: `${a.fraction * 100}%`,
              transform: "translate(-50%, -50%)",
              background: "rgba(255,255,255,0.18)",
            }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1.5 text-[9px] text-gray-500 tracking-wider">
        {TIMELINE_ANCHORS.map((a, i) => (
          <span key={i} className="flex flex-col items-center" style={{ minWidth: 0 }}>
            <span className="text-[11px] leading-none">{a.icon}</span>
            <span className="mt-0.5 opacity-60">{a.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// SVG ring gauge that wraps around the moon. The arc length encodes
// trading bias intensity; the color encodes direction (green/amber/red).
function BiasRing({ size, value, color }) {
  const stroke = 3;
  const r = size / 2 - stroke / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const arcLen = circumference * value;
  // Start at top (-90°) and sweep clockwise
  return (
    <svg
      width={size}
      height={size}
      className="absolute top-1/2 left-1/2 pointer-events-none"
      style={{
        transform: "translate(-50%, -50%) rotate(-90deg)",
        zIndex: 0,
        filter: `drop-shadow(0 0 8px ${color}80)`,
      }}
    >
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      {/* Filled arc */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${arcLen} ${circumference - arcLen}`}
        style={{ transition: "stroke-dasharray 0.8s ease, stroke 0.6s ease" }}
      />
    </svg>
  );
}

export default function MoonPhaseCard({
  moonPhase,
  lunarInfo,
  nextPhaseDate,
  detailedPhase,
  lunarAge,
  synodicMonth,
  nextMajorPhase,
  signal,
}) {
  // Navigate to dedicated Bibliotheca page (clean URL, full-page experience).
  const goToBiblioteca = useCallback(() => {
    const target = "/biblioteca/";
    if (window.location.pathname !== target) {
      window.history.pushState({}, "", target);
      window.dispatchEvent(new PopStateEvent("popstate"));
      window.scrollTo(0, 0);
    }
  }, []);

  const theme = useMemo(() => getPhaseTheme(moonPhase), [moonPhase]);
  const bias = useMemo(() => getBiasMeta(signal, lunarInfo), [signal, lunarInfo]);

  // Display name prefers the more precise 8-phase astronomical label
  const displayName = detailedPhase?.name || lunarInfo.name;

  // Lunar age display
  const ageDays = lunarAge ?? 0;
  const cyclePct = ((moonPhase % 1) * 100).toFixed(0);

  // Countdown to next major phase (1Q / Full / 3Q / New)
  const countdown = nextMajorPhase ? formatCountdown(nextMajorPhase.daysFromNow) : null;

  return (
    <div
      className="rounded-2xl p-6 flex flex-col items-center animate-pulse-glow relative overflow-hidden"
      style={{
        background: theme.gradient,
        border: `1px solid ${theme.ring}`,
        boxShadow: `0 0 30px ${theme.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
        transition: "background 1.2s ease, border-color 1.2s ease, box-shadow 1.2s ease",
      }}
    >
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

      {/* Moon + bias ring gauge */}
      <div className="relative animate-float" style={{ width: 200, height: 200 }}>
        <BiasRing size={200} value={bias.value} color={bias.color} />
        <div className="absolute top-1/2 left-1/2" style={{ transform: "translate(-50%, -50%)" }}>
          <AnimatedMoon phase={moonPhase} size={170} />
        </div>
      </div>

      {/* Bias label under the ring */}
      <div className="text-[9px] tracking-[0.25em] mt-1 font-bold uppercase" style={{ color: bias.color, opacity: 0.85 }}>
        ◌ Sesgo: {bias.label}
      </div>

      {/* 8-phase astronomical name (more precise than 4-phase) */}
      <h2 className="text-2xl font-black mt-3 gold-text tracking-tight text-center leading-tight">
        {displayName}
      </h2>
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

      {/* Lunar age + countdown row */}
      <div className="mt-4 grid grid-cols-2 gap-2 w-full">
        <div className="rounded-lg px-3 py-2 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="text-[9px] tracking-[0.18em] uppercase text-gray-500 font-semibold">Edad lunar</div>
          <div className="text-sm font-black text-amber-300 tabular-nums mt-0.5">
            {ageDays.toFixed(1)}<span className="text-gray-600 text-[10px] font-normal"> / {synodicMonth?.toFixed(1) || "29.5"}d</span>
          </div>
          <div className="text-[8px] text-gray-600 mt-0.5 tabular-nums">{cyclePct}% del ciclo</div>
        </div>
        {nextMajorPhase && (
          <div className="rounded-lg px-3 py-2 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="text-[9px] tracking-[0.18em] uppercase text-gray-500 font-semibold">Próxima fase</div>
            <div className="text-sm font-black text-amber-300 tabular-nums mt-0.5 leading-none">
              {countdown}
            </div>
            <div className="text-[8px] text-gray-600 mt-0.5 truncate">
              {nextMajorPhase.phase.icon} {nextMajorPhase.phase.name}
            </div>
          </div>
        )}
      </div>

      <p className="text-gray-400 text-xs mt-4 text-center leading-relaxed max-w-[260px]">
        {lunarInfo.description}
      </p>

      {/* Cycle timeline */}
      <CycleTimeline phase={moonPhase} accentColor={lunarInfo.color} />

      {nextPhaseDate && (
        <div className="mt-3 pt-3 border-t border-gray-800/50 w-full text-center">
          <p className="text-gray-600 text-[10px] tracking-wider">
            {nextPhaseDate.phase.icon}{" "}
            {nextPhaseDate.date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
      )}
    </div>
  );
}
