import { getMoonIllumination } from "../utils/lunar";

/**
 * Build an SVG path for the DARK (shadow) side of the moon.
 *
 * The terminator (boundary between lit and dark) is half of an ellipse
 * passing through the moon's top and bottom points, with a horizontal
 * radius that depends on the phase:
 *   rx = |cos(2π · phase)| · r
 *
 * Combined with the appropriate semicircle of the moon's edge, it
 * yields the actual phase shape (crescent, gibbous, etc.) instead of
 * a flat opacity-reduced disc.
 */
function darkSidePath(cx, cy, r, phase) {
  // Normalize to [0, 1)
  const p = ((phase % 1) + 1) % 1;
  const cosP = Math.cos(p * 2 * Math.PI);
  const k = (1 - cosP) / 2;            // illuminated fraction
  const isWaxing = p < 0.5;            // dark side: LEFT (waxing) or RIGHT (waning)
  const isCrescent = k < 0.5;          // crescent vs. gibbous
  const rx = Math.abs(cosP) * r;       // terminator semi-minor axis

  // SVG arc sweep flags — empirically derived per quadrant of the cycle:
  //   outer arc:  goes via LEFT (sweep=0) for waxing, RIGHT (sweep=1) for waning
  //   terminator: bows RIGHT for waxing-crescent / waning-gibbous (sweep=0),
  //               bows LEFT  for waxing-gibbous  / waning-crescent (sweep=1)
  const outerSweep = isWaxing ? 0 : 1;
  const termSweep = isWaxing === isCrescent ? 0 : 1;

  return (
    `M ${cx} ${cy - r} ` +
    `A ${r} ${r} 0 1 ${outerSweep} ${cx} ${cy + r} ` +
    `A ${rx} ${r} 0 1 ${termSweep} ${cx} ${cy - r} Z`
  );
}

export default function AnimatedMoon({ phase, size = 180 }) {
  const illumination = getMoonIllumination(phase);
  const r = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;
  const shadowD = darkSidePath(cx, cy, r, phase);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-[0_0_30px_rgba(251,191,36,0.15)]">
      <defs>
        <radialGradient id="moonGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.2" />
          <stop offset="60%" stopColor="#fbbf24" stopOpacity="0.05" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moonSurface" cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="40%" stopColor="#fde68a" />
          <stop offset="80%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#92400e" />
        </radialGradient>
        <radialGradient id="moonShadow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="100%" stopColor="#0a0a14" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Clip everything to the moon disc so the shadow path can't bleed outside */}
        <clipPath id="moonClip">
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>

      {/* Outer glow halo */}
      <circle cx={cx} cy={cy} r={r + 15} fill="url(#moonGlow)" />

      <g clipPath="url(#moonClip)">
        {/* Lit surface (full bright disc) */}
        <circle cx={cx} cy={cy} r={r} fill="url(#moonSurface)" filter="url(#glow)" />

        {/* Craters — only on the lit portion (we'll clip with the shadow on top) */}
        {[
          { cx: 0.33, cy: 0.28, r: 0.07 },
          { cx: 0.56, cy: 0.22, r: 0.045 },
          { cx: 0.42, cy: 0.53, r: 0.08 },
          { cx: 0.62, cy: 0.42, r: 0.04 },
          { cx: 0.28, cy: 0.62, r: 0.055 },
          { cx: 0.67, cy: 0.63, r: 0.045 },
          { cx: 0.48, cy: 0.35, r: 0.035 },
        ].map((crater, i) => (
          <circle
            key={i}
            cx={crater.cx * size}
            cy={crater.cy * size}
            r={crater.r * size}
            fill="#92400e"
            opacity={0.18}
          />
        ))}

        {/* Shadow side — actual lunar phase shape */}
        <path d={shadowD} fill="url(#moonShadow)" opacity="0.92" />
      </g>

      {/* Subtle outer ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#fbbf24" strokeWidth="0.5" strokeOpacity="0.25" />

      {/* Center text — illumination % */}
      <text x={cx} y={cy + 2} textAnchor="middle" fontSize={size * 0.14} fill="#fde68a" fontWeight="800" opacity="0.95" fontFamily="'Inter', sans-serif" style={{ paintOrder: "stroke", stroke: "#0a0a14", strokeWidth: 3, strokeLinejoin: "round" }}>
        {illumination}%
      </text>
      <text x={cx} y={cy + size * 0.1} textAnchor="middle" fontSize={size * 0.055} fill="#fbbf24" opacity="0.7" fontFamily="'Inter', sans-serif" letterSpacing="0.1em" style={{ paintOrder: "stroke", stroke: "#0a0a14", strokeWidth: 2, strokeLinejoin: "round" }}>
        ILUMINACION
      </text>
    </svg>
  );
}
