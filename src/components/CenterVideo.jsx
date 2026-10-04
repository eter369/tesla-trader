import { useRef, useEffect, useState } from "react";
import { prefiereMenosMovimiento, ahorroDeDatos } from "../utils/medios";

const VIDEO = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_024928_1efd0b0d-6c02-45a8-8847-1030900c4f63.mp4";

export default function CenterVideo() {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [cargado, setCargado] = useState(false);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [auto] = useState(() => !prefiereMenosMovimiento() && !ahorroDeDatos());

  // Carga el video al acercarse (200 px antes) y lo pausa cuando sale de la vista
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setCargado(true);
      },
      { threshold: 0.1, rootMargin: "200px 0px" }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !cargado) return;
    if (visible && auto) v.play().catch(() => {});
    else if (!visible) v.pause();
  }, [visible, cargado, auto]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  };

  return (
    <div
      ref={containerRef}
      className="card rounded-2xl overflow-hidden mt-4 relative group"
      style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(88,28,135,0.35), rgba(5,5,16,0.9) 70%)" }}
    >
      <div className="relative" style={{ aspectRatio: "16 / 9" }}>
        {cargado && (
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            preload={auto ? "auto" : "metadata"}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            className="w-full h-full block"
            style={{ objectFit: "cover" }}
            aria-label="Visión cósmica (video decorativo, sin sonido al iniciar)"
          >
            <source src={auto ? VIDEO : VIDEO + "#t=0.1"} type="video/mp4" />
          </video>
        )}

        {/* Con menos movimiento o ahorro de datos no arranca solo: se ofrece Reproducir */}
        {cargado && !playing && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-12 h-12 rounded-full flex items-center justify-center active:scale-95"
            style={{ background: "rgba(10,5,30,0.55)", backdropFilter: "blur(14px)", border: "1px solid rgba(192,132,252,0.35)" }}
            aria-label="Reproducir video"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style={{ marginLeft: 2 }} aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          </button>
        )}

        {/* Mute toggle — always visible on touch / mobile, hover-fade on desktop */}
        <button
          type="button"
          onClick={toggleMute}
          className="absolute top-3 right-3 w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center z-10 opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 active:scale-95"
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
  );
}
