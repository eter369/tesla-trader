import { getMoonIllumination } from "../utils/lunar";

export default function AnimatedMoon({ phase, size = 180 }) {
  const illumination = getMoonIllumination(phase);
  const r = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;

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
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer glow */}
      <circle cx={cx} cy={cy} r={r + 15} fill="url(#moonGlow)" />

      {/* Moon body - dark side */}
      <circle cx={cx} cy={cy} r={r} fill="#1a1a2e" stroke="#fbbf24" strokeWidth="0.5" strokeOpacity="0.2" />

      {/* Moon body - lit side */}
      <circle cx={cx} cy={cy} r={r} fill="url(#moonSurface)" opacity={illumination / 100} filter="url(#glow)" />

      {/* Craters */}
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
          opacity={0.12 * (illumination / 100)}
        />
      ))}

      {/* Center text */}
      <text x={cx} y={cy + 2} textAnchor="middle" fontSize={size * 0.14} fill="#fde68a" fontWeight="800" opacity="0.95" fontFamily="'Inter', sans-serif">
        {illumination}%
      </text>
      <text x={cx} y={cy + size * 0.1} textAnchor="middle" fontSize={size * 0.055} fill="#fbbf24" opacity="0.6" fontFamily="'Inter', sans-serif" letterSpacing="0.1em">
        ILUMINACION
      </text>
    </svg>
  );
}
