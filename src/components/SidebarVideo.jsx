import { useRef, useState, useEffect } from "react";

export default function SidebarVideo() {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.15 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  };

  return (
    <div
      ref={containerRef}
      className="card rounded-2xl overflow-hidden mb-5 relative group"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}
    >
      {/* Top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-px z-20"
        style={{ background: "linear-gradient(90deg, transparent, rgba(251,191,36,0.25), rgba(147,130,255,0.2), transparent)" }}
      />

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] overflow-hidden">
        {/* Video */}
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full block"
            style={{ aspectRatio: "16/10", objectFit: "cover", minHeight: 220 }}
          >
            <source
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_024928_1efd0b0d-6c02-45a8-8847-1030900c4f63.mp4"
              type="video/mp4"
            />
          </video>

          {/* Inner vignette */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ boxShadow: "inset 0 0 80px rgba(0,0,0,0.5)" }} />

          {/* Mute toggle */}
          <button onClick={toggleMute}
            className="absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {muted ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>
        </div>

        {/* Right content panel */}
        <div className="flex flex-col justify-center p-6 md:p-8 relative">
          {/* Subtle ambient bg */}
          <div className="absolute inset-0 pointer-events-none opacity-30"
            style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(147,130,255,0.08), transparent 70%)" }} />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[9px] font-bold text-amber-400/60 tracking-[0.2em] uppercase">Visualizer</span>
            </div>

            <h3 className="text-lg md:text-xl font-bold text-white/90 leading-tight mb-3"
              style={{ letterSpacing: "-0.02em" }}>
              La Energia Cristalina<br />
              <span className="gold-text">del Ciclo Lunar</span>
            </h3>

            <p className="text-xs text-gray-400/70 leading-relaxed mb-5 max-w-sm">
              La estructura molecular de los mercados refleja los patrones emocionales del inconsciente colectivo.
              Cada ciclo es un espejo de la psicologia del trader.
            </p>

            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Fase", value: "Creciente", color: "#22d3ee" },
                { label: "Energia", value: "Expansiva", color: "#10b981" },
                { label: "Ciclo", value: "Dia 7/29", color: "#fbbf24" },
              ].map((s, i) => (
                <div key={i} className="text-center p-2 rounded-lg"
                  style={{ background: `${s.color}08`, border: `1px solid ${s.color}15` }}>
                  <div className="text-[9px] text-gray-500 mb-0.5">{s.label}</div>
                  <div className="text-[11px] font-bold" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
