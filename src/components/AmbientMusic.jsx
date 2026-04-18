import { useRef, useState, useEffect } from "react";

export default function AmbientMusic() {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Fade in on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Autoplay on first user interaction (browsers block autoplay with sound)
  useEffect(() => {
    function handleInteraction() {
      if (!hasInteracted && videoRef.current) {
        videoRef.current.play().then(() => {
          setPlaying(true);
          setHasInteracted(true);
        }).catch(() => {});
      }
    }

    document.addEventListener("click", handleInteraction, { once: true });
    document.addEventListener("touchstart", handleInteraction, { once: true });
    document.addEventListener("keydown", handleInteraction, { once: true });

    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
    };
  }, [hasInteracted]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      videoRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setMuted(videoRef.current.muted);
  };

  return (
    <>
      {/* Video card in page */}
      <div
        ref={containerRef}
        className="card rounded-2xl overflow-hidden mt-4 relative group"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.8s ease",
        }}
      >
        {/* Header strip */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="flex items-end gap-[2px] h-3">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-[2px] rounded-full"
                  style={{
                    background: playing && !muted ? "linear-gradient(to top, #a855f7, #6366f1)" : "#4b5563",
                    height: playing && !muted ? `${6 + i * 2}px` : "3px",
                    animation: playing && !muted ? `musicBar 0.${4 + i}s ease-in-out infinite alternate` : "none",
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold"
                  style={{ color: playing && !muted ? "#c4b5fd" : "rgba(168,85,247,0.7)" }}>
              Música Ambiental
            </span>
          </div>
          <span className="text-[9px] tracking-[0.16em] uppercase text-gray-500">
            {playing ? (muted ? "MUTED" : "PLAYING") : "PAUSED"}
          </span>
        </div>

        <div className="relative">
          <div
            className="h-px"
            style={{ background: "linear-gradient(90deg, transparent, #a855f740, #6366f130, transparent)" }}
          />
          <video
            ref={videoRef}
            loop
            playsInline
            preload="auto"
            className="w-full block"
            style={{ aspectRatio: "16 / 9", objectFit: "cover" }}
          >
            <source src="/ambient-music.mp4" type="video/mp4" />
          </video>

          {/* Center play overlay — always visible on mobile, hover on desktop */}
          <div className="absolute inset-0 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <button
              onClick={togglePlay}
              className="w-14 h-14 sm:w-12 sm:h-12 rounded-full flex items-center justify-center pointer-events-auto active:scale-95 transition-transform"
              style={{
                background: "rgba(10,5,30,0.55)",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(192,132,252,0.35)",
                boxShadow: "0 6px 24px rgba(168,85,247,0.35)",
              }}
              aria-label={playing ? "Pausar" : "Reproducir"}
            >
              {playing ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 2 }}>
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>
          </div>

          {/* Mute toggle — always visible on mobile */}
          <button
            onClick={toggleMute}
            className="absolute top-3 right-3 w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-10 active:scale-95"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.12)" }}
            aria-label={muted ? "Activar sonido" : "Silenciar"}
          >
            {muted ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>

          {/* Bottom gradient for legibility */}
          <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(5,5,16,0.55), transparent)" }} />
        </div>
      </div>

      {/* Floating mini control — bottom (right on desktop, centered on mobile) */}
      <div
        className="fixed z-50 flex items-center gap-1.5 rounded-full px-3 py-2 shadow-lg backdrop-blur-md transition-all duration-300
                   bottom-4 right-4 sm:bottom-5 sm:right-5
                   max-sm:left-1/2 max-sm:right-auto max-sm:-translate-x-1/2"
        style={{
          background: "rgba(10, 10, 25, 0.78)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: playing && !muted ? "0 0 20px rgba(168,85,247,0.18), 0 4px 16px rgba(0,0,0,0.5)" : "0 4px 12px rgba(0,0,0,0.5)",
        }}
      >
        {/* Visualizer bars */}
        <div className="flex items-end gap-[2px] h-3.5 mr-1">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="w-[3px] rounded-full transition-all duration-300"
              style={{
                background: playing && !muted
                  ? "linear-gradient(to top, #a855f7, #6366f1)"
                  : "#4b5563",
                height: playing && !muted ? `${8 + Math.random() * 6}px` : "4px",
                animation: playing && !muted ? `musicBar 0.${4 + i}s ease-in-out infinite alternate` : "none",
              }}
            />
          ))}
        </div>

        <button
          onClick={togglePlay}
          className="w-8 h-8 sm:w-7 sm:h-7 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
          title={playing ? "Pausar" : "Reproducir"}
          aria-label={playing ? "Pausar" : "Reproducir"}
        >
          {playing ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>

        <button
          onClick={toggleMute}
          className="w-8 h-8 sm:w-7 sm:h-7 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
          title={muted ? "Activar sonido" : "Silenciar"}
          aria-label={muted ? "Activar sonido" : "Silenciar"}
        >
          {muted ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
        </button>

        <span className="text-[9px] text-gray-400 font-mono tracking-wider ml-1 hidden sm:inline">
          {playing ? (muted ? "MUTED" : "♪ PLAYING") : "PAUSED"}
        </span>
      </div>
    </>
  );
}
