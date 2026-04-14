import { useRef, useState, useEffect } from "react";

export default function AmbientMusic() {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Autoplay on first user interaction (browsers block autoplay with sound)
  useEffect(() => {
    function handleInteraction() {
      if (!hasInteracted && audioRef.current) {
        audioRef.current.play().then(() => {
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
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !audioRef.current.muted;
    setMuted(audioRef.current.muted);
  };

  return (
    <>
      <audio ref={audioRef} loop preload="auto" src="/ambient-music.mp4" />

      {/* Floating music control — bottom right */}
      <div
        className="fixed bottom-5 right-5 z-50 flex items-center gap-1.5 rounded-full px-3 py-2 shadow-lg backdrop-blur-md transition-all duration-300 group"
        style={{
          background: "rgba(10, 10, 25, 0.75)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: playing ? "0 0 20px rgba(168,85,247,0.15)" : "0 4px 12px rgba(0,0,0,0.4)",
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

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          title={playing ? "Pausar" : "Reproducir"}
        >
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>

        {/* Mute/Unmute */}
        <button
          onClick={toggleMute}
          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          title={muted ? "Activar sonido" : "Silenciar"}
        >
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

        {/* Label */}
        <span className="text-[9px] text-gray-400 font-mono tracking-wider ml-1 hidden sm:inline">
          {playing ? (muted ? "MUTED" : "♪ PLAYING") : "PAUSED"}
        </span>
      </div>
    </>
  );
}
