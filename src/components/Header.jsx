import { useRef, useEffect, useState } from "react";
import { Moon, Clock, Wifi, WifiOff, RefreshCw } from "lucide-react";
import Hls from "hls.js";
import MysticPortal from "./MysticPortal";

function MiniHlsOrb() {
  const videoRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let hls;
    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, maxBufferLength: 6 });
      hls.loadSource("https://stream.mux.com/blULaJm2RMbAmsrwxLrBdgEx9yI1do2yM89vHTkdA6I.m3u8");
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); setLoaded(true); });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = "https://stream.mux.com/blULaJm2RMbAmsrwxLrBdgEx9yI1do2yM89vHTkdA6I.m3u8";
      video.addEventListener("loadedmetadata", () => { video.play().catch(() => {}); setLoaded(true); });
    }
    return () => { if (hls) hls.destroy(); };
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-full transition-opacity duration-1000"
      style={{ width: 32, height: 32, opacity: loaded ? 1 : 0 }}
    >
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        className="absolute w-[200%] h-[200%] object-cover"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          mixBlendMode: "screen",
        }}
      />
      {/* Circular edge fade */}
      <div className="absolute inset-0 rounded-full pointer-events-none"
        style={{ boxShadow: "inset 0 0 8px 4px rgba(5,5,16,0.9)" }} />
    </div>
  );
}

export default function Header({ currentTime, connected, error, onRefresh }) {
  return (
    <header className="text-center mb-6 relative">
      {/* Portal Místico — izquierda, orbe completo visible debajo de la franja del título
          con destello (halo radial + rayos giratorios) emanando detrás */}
      <div
        className="hidden md:block absolute left-4 pointer-events-none"
        style={{ top: "100%", transform: "translateY(-30%)", zIndex: 20 }}
      >
        <div className="relative pointer-events-auto" style={{ width: 110, height: 110 }}>
          {/* Rayos de luz giratorios (detrás, detrás de todo) */}
          <div
            className="absolute top-1/2 left-1/2"
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
            className="absolute top-1/2 left-1/2"
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

          {/* El orbe */}
          <div className="absolute inset-0" style={{ zIndex: 2, animation: "portalGlowPulse 4s ease-in-out infinite" }}>
            <MysticPortal compact displaySize={110} />
          </div>
        </div>
      </div>

      <div className="absolute top-0 right-0 flex items-center gap-2">
        <button onClick={onRefresh} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors" title="Actualizar datos">
          <RefreshCw size={14} className="text-gray-400" />
        </button>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${connected ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
          {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
          {connected ? "LIVE" : "OFFLINE"}
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 mb-2">
        <MiniHlsOrb key="left" />
        <h1 className="text-3xl md:text-4xl font-black tracking-tight gold-text">
          CRYPTO LUNAR ORACLE
        </h1>
        <MiniHlsOrb key="right" />
      </div>

      <p className="text-gray-500 text-xs tracking-[0.2em] uppercase">
        Arquetipos Lunares &times; Analisis Tecnico &times; Sentimiento del Mercado
      </p>

      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5 font-mono">
          <Clock size={12} className="text-amber-400/60" />
          {currentTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
        <span className="w-px h-3 bg-gray-700" />
        <span>{currentTime.toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
      </div>

      {error && (
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          {error}
        </div>
      )}
    </header>
  );
}
