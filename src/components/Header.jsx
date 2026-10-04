import { useRef, useEffect, useState } from "react";
import { Clock, Wifi, WifiOff, RefreshCw } from "lucide-react";
import Hls from "hls.js";
import { fechaLima } from "../utils/lunar";
import { sinVideosDecorativos } from "../utils/medios";

const ORBE_HLS = "https://stream.mux.com/blULaJm2RMbAmsrwxLrBdgEx9yI1do2yM89vHTkdA6I.m3u8";

// Orbe decorativo junto al título. Con menos movimiento, ahorro de datos o en
// celular se dibuja quieto con CSS y no se descarga ningún video.
function MiniHlsOrb() {
  const videoRef = useRef(null);
  const [conVideo] = useState(() => !sinVideosDecorativos());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!conVideo || !video) return;
    let hls;
    const listo = () => { video.play().catch(() => {}); setLoaded(true); };
    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, maxBufferLength: 6 });
      hls.loadSource(ORBE_HLS);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, listo);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = ORBE_HLS;
      video.addEventListener("loadedmetadata", listo, { once: true });
    }
    return () => { if (hls) hls.destroy(); };
  }, [conVideo]);

  if (!conVideo) {
    return (
      <div
        className="rounded-full flex-shrink-0"
        style={{ width: 32, height: 32, background: "radial-gradient(circle at 35% 35%, #fde68a, #a855f7 45%, #1e1b4b 75%)", boxShadow: "0 0 14px rgba(168,85,247,0.45)" }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-full transition-opacity duration-1000 flex-shrink-0"
      style={{ width: 32, height: 32, opacity: loaded ? 1 : 0 }}
      aria-hidden="true"
    >
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        className="absolute w-[200%] h-[200%] object-cover"
        style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", mixBlendMode: "screen" }}
      />
      <div className="absolute inset-0 rounded-full pointer-events-none" style={{ boxShadow: "inset 0 0 8px 4px rgba(5,5,16,0.9)" }} />
    </div>
  );
}

const hora = (ms) => fechaLima(ms, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

export default function Header({ currentTime, connected, error, onRefresh, ultimoDato }) {
  return (
    <header className="text-center mb-6 relative">
      <div className="flex justify-end items-center gap-2 mb-3 sm:mb-0 sm:absolute sm:top-0 sm:right-0">
        <button
          type="button"
          onClick={onRefresh}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          title="Actualizar datos"
          aria-label="Actualizar datos"
        >
          <RefreshCw size={14} className="text-gray-400" />
        </button>
        <div
          role="status"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${connected ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}
          title={connected ? "Precios en tiempo real (WebSocket de Binance)" : "Reconectando con Binance; los precios se actualizan cada minuto"}
        >
          {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
          {connected ? "EN VIVO" : "SIN TIEMPO REAL"}
          {ultimoDato && <span className="text-gray-400 font-mono tabular-nums">· {hora(ultimoDato)}</span>}
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 mb-2">
        <MiniHlsOrb />
        <h1 className="text-3xl md:text-4xl font-black tracking-tight gold-text">
          ORÁCULO LUNAR CRIPTO
        </h1>
        <MiniHlsOrb />
      </div>

      <p className="text-gray-500 text-xs tracking-[0.2em] uppercase">
        Arquetipos lunares &times; análisis técnico &times; sentimiento del mercado
      </p>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5 font-mono tabular-nums">
          <Clock size={12} className="text-amber-400/60" />
          {hora(currentTime.getTime())}
          <span className="font-sans text-gray-600">hora de Lima</span>
        </span>
        <span className="w-px h-3 bg-gray-700 hidden sm:block" />
        <span>{fechaLima(currentTime.getTime(), { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
      </div>

      {error && (
        <div role="alert" className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          {error}
        </div>
      )}
    </header>
  );
}
