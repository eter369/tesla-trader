import { useRef, useEffect, useState } from "react";
import Hls from "hls.js";
import { sinVideosDecorativos } from "../utils/medios";

const HLS_URL = "https://stream.mux.com/NcU3HlHeF7CUL86azTTzpy3Tlb00d6iF3BmCdFslMJYM.m3u8";

export default function BackgroundVideo() {
  const videoRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [conVideo] = useState(() => !sinVideosDecorativos());

  useEffect(() => {
    const video = videoRef.current;
    if (!conVideo || !video) return;
    const alCambiarVisibilidad = () => {
      if (document.hidden) video.pause();
      else video.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", alCambiarVisibilidad);

    let hls;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 10,
        maxMaxBufferLength: 30,
      });
      hls.loadSource(HLS_URL);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
        setLoaded(true);
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      video.src = HLS_URL;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch(() => {});
        setLoaded(true);
      });
    }

    return () => {
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      if (hls) {
        hls.destroy();
      }
    };
  }, [conVideo]);

  return (
    <div
      className="fixed inset-0 z-0 transition-opacity duration-[2000ms]"
      style={{ opacity: loaded || !conVideo ? 1 : 0 }}
      aria-hidden="true"
    >
      {conVideo ? (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "saturate(0.6) brightness(0.35)" }}
        />
      ) : (
        // Sin video: el mismo tono violeta cósmico con un degradado quieto
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 20%, rgba(88,28,135,0.45), transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(30,27,75,0.6), transparent 65%)" }} />
      )}

      {/* Dark overlay layers for depth */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(180deg, rgba(5,5,16,0.82) 0%, rgba(5,5,16,0.65) 40%, rgba(5,5,16,0.75) 70%, rgba(5,5,16,0.92) 100%)",
      }} />

      {/* Radial vignette */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at 50% 30%, transparent 20%, rgba(5,5,16,0.5) 70%, rgba(5,5,16,0.85) 100%)",
      }} />

      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundSize: "128px 128px",
      }} />
    </div>
  );
}
