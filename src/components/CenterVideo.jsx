import { useRef, useEffect, useState } from "react";

export default function CenterVideo() {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.1 }
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
      className="card rounded-2xl overflow-hidden mt-4 relative group"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 0.8s ease",
      }}
    >
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="w-full block"
          style={{ aspectRatio: "16 / 9", objectFit: "cover" }}
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_024928_1efd0b0d-6c02-45a8-8847-1030900c4f63.mp4"
            type="video/mp4"
          />
        </video>

        {/* Mute toggle — always visible on touch / mobile, hover-fade on desktop */}
        <button
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
