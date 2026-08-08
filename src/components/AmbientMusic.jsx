import { useRef, useState, useEffect, useCallback } from "react";

// El modo expandido agranda el vídeo sin sacarlo de su sitio en el árbol de
// React: solo cambian las clases. Moverlo a un portal lo remontaría y la
// reproducción volvería a empezar desde cero.
//
// El único obstáculo era que la tarjeta contenedora tiene backdrop-filter, que
// crea un containing block y anclaría el overlay a la tarjeta en vez de a la
// pantalla; por eso `.am-host--expanded` lo desactiva mientras dura la
// ampliación. Se descartó la API nativa de pantalla completa porque en vistas
// embebidas (como el panel de previsualización) la promesa se queda pendiente
// y nunca llega a abrirse.
const EXPAND_STYLES = `
@keyframes am-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes am-zoom-in { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }

/* Sin backdrop-filter el overlay hijo vuelve a anclarse al viewport.
   El aspect-ratio conserva el hueco de la tarjeta para que no salte el layout. */
.am-host--expanded {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  aspect-ratio: 16 / 9;
}

.am-stage--expanded {
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: max(3vh, 20px) max(3vw, 20px);
  background: radial-gradient(ellipse at 50% 45%, rgba(24, 12, 52, 0.92) 0%, rgba(4, 4, 12, 0.97) 65%);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  animation: am-fade-in 0.28s ease both;
}

/* Escala hasta llenar el hueco sin deformar. Con width:auto se quedaba a su
   tamaño nativo (640x360) y apenas crecía. Se mantiene la proporción 16/9 en el
   propio elemento para que el borde redondeado y la sombra abracen la imagen y
   no una caja mayor con franjas negras. */
.am-stage--expanded video {
  width: 100% !important;
  height: auto !important;
  max-height: 100%;
  aspect-ratio: 16 / 9;
  object-fit: contain !important;
  border-radius: 14px;
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.75), 0 0 70px rgba(139, 92, 246, 0.16);
  animation: am-zoom-in 0.34s cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* Los controles crecen con la escena para seguir siendo cómodos en grande */
.am-stage--expanded .am-play { width: 84px; height: 84px; }
.am-stage--expanded .am-play svg { width: 32px; height: 32px; }
.am-stage--expanded .am-corner-btn { width: 42px; height: 42px; opacity: 1; }
.am-stage--expanded .am-corner-btn svg { width: 17px; height: 17px; }
.am-stage--expanded .am-scrim { display: none; }

@media (prefers-reduced-motion: reduce) {
  .am-stage--expanded, .am-stage--expanded video { animation: none; }
}
`;

export default function AmbientMusic() {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Fade in on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Music only plays when user presses Play — no global auto-play on interaction

  // Sync UI state with the underlying <video> element so controls stay
  // accurate even if playback ends, errors, or is paused by the browser
  // (e.g. mobile autoplay policy, system interruption, focus change).
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);
    const onVolume = () => setMuted(v.muted);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnded);
    v.addEventListener("volumechange", onVolume);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("volumechange", onVolume);
    };
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    // State updates flow from the play/pause event listeners above —
    // we just trigger the action here.
    if (playing) v.pause();
    else v.play().catch(() => {});
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setMuted(videoRef.current.muted);
  };

  const toggleExpand = useCallback(() => setExpanded((e) => !e), []);

  // Escape cierra y el scroll del fondo se bloquea mientras está ampliado.
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e) => { if (e.key === "Escape") setExpanded(false); };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  // Clic en el fondo (fuera del vídeo) cierra la ampliación.
  const handleStageClick = (e) => {
    if (expanded && e.target === stageRef.current) setExpanded(false);
  };

  return (
    <>
      <style>{EXPAND_STYLES}</style>

      {/* Video card in page */}
      <div
        ref={containerRef}
        className={`card rounded-2xl overflow-hidden mt-4 relative group${expanded ? " am-host--expanded" : ""}`}
        style={{
          // Ampliado siempre visible: la tarjeta se atenúa al salir de pantalla
          // y, al ser un ancestro, su opacidad 0 ocultaba también el overlay.
          // Sin transición al ampliar: el fundido de entrada solo tiene sentido
          // al aparecer con el scroll, no al pulsar un botón.
          opacity: expanded || visible ? 1 : 0,
          transition: expanded ? "none" : "opacity 0.8s ease",
        }}
      >
        <div
          ref={stageRef}
          onClick={handleStageClick}
          className={`am-stage relative${expanded ? " am-stage--expanded" : ""}`}
        >
          <video
            ref={videoRef}
            loop
            playsInline
            preload="auto"
            onDoubleClick={toggleExpand}
            className="w-full block"
            style={{ aspectRatio: "16 / 9", objectFit: "cover" }}
          >
            <source src="/ambient-music.mp4" type="video/mp4" />
          </video>

          {/* Center play overlay — always visible on mobile, hover on desktop */}
          <div className="absolute inset-0 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <button
              onClick={togglePlay}
              className="am-play w-14 h-14 sm:w-12 sm:h-12 rounded-full flex items-center justify-center pointer-events-auto active:scale-95 transition-transform"
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

          {/* Expandir / contraer — doble clic en el vídeo hace lo mismo */}
          <button
            onClick={toggleExpand}
            className="am-corner-btn absolute top-3 left-3 w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-10 active:scale-95"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.12)" }}
            title={expanded ? "Salir de pantalla completa" : "Ver más grande"}
            aria-label={expanded ? "Salir de pantalla completa" : "Ver más grande"}
          >
            {expanded ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 14 10 14 10 20" />
                <polyline points="20 10 14 10 14 4" />
                <line x1="14" y1="10" x2="21" y2="3" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            )}
          </button>

          {/* Mute toggle — always visible on mobile */}
          <button
            onClick={toggleMute}
            className="am-corner-btn absolute top-3 right-3 w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-10 active:scale-95"
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
          <div className="am-scrim absolute bottom-0 left-0 right-0 h-12 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(5,5,16,0.55), transparent)" }} />
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

        {/* Expandir desde el control flotante: el vídeo vive en la barra
            lateral y suele quedar fuera de vista al hacer scroll. */}
        <button
          onClick={toggleExpand}
          className="w-8 h-8 sm:w-7 sm:h-7 rounded-full flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
          title={expanded ? "Salir de pantalla completa" : "Ver más grande"}
          aria-label={expanded ? "Salir de pantalla completa" : "Ver más grande"}
        >
          {expanded ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 14 10 14 10 20" />
              <polyline points="20 10 14 10 14 4" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
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
