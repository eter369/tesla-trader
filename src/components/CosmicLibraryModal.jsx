import { useEffect, useRef, useState, useCallback } from "react";

const STYLES = `
.cl-root{
  --cl-ink:#e9d5ff;
  --cl-muted:#8b7fa8;
  --cl-lilac:#c084fc;
  --cl-ring-1: 0 0 0 0.5px rgba(216,180,254,0.12);
  --cl-ring-2: 0 0 0 1px rgba(168,85,247,0.18);
  --cl-shadow-ambient: 0 40px 120px -30px rgba(88,28,135,0.55);
  --cl-shadow-contact: 0 2px 6px rgba(0,0,0,0.6);
  --cl-shadow-lift: 0 80px 160px -40px rgba(168,85,247,0.35);
  position:fixed;inset:0;z-index:80;
  display:flex;align-items:center;justify-content:center;
  padding:60px 24px;
  color:var(--cl-ink);
  font-family:"Inter","SF Pro Display","Segoe UI",system-ui,sans-serif;
  background:
    radial-gradient(ellipse 120% 80% at 50% -20%, rgba(88,28,135,0.55) 0%, transparent 55%),
    radial-gradient(ellipse 100% 70% at 50% 120%, rgba(34,211,238,0.08) 0%, transparent 60%),
    rgba(5,2,24,0.92);
  backdrop-filter:blur(18px);
  -webkit-backdrop-filter:blur(18px);
  animation:clFadeIn 0.45s ease forwards;
  overflow-y:auto;
}
@keyframes clFadeIn{from{opacity:0}to{opacity:1}}

.cl-ambient{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.cl-ambient::before,.cl-ambient::after{
  content:"";position:absolute;inset:0;
  background-image:
    radial-gradient(1px 1px at 20% 30%, rgba(216,180,254,0.6), transparent 50%),
    radial-gradient(1px 1px at 75% 55%, rgba(255,255,255,0.5), transparent 50%),
    radial-gradient(1px 1px at 40% 80%, rgba(216,180,254,0.4), transparent 50%),
    radial-gradient(1.5px 1.5px at 90% 15%, rgba(255,255,255,0.7), transparent 50%),
    radial-gradient(1px 1px at 10% 60%, rgba(216,180,254,0.5), transparent 50%),
    radial-gradient(1px 1px at 65% 90%, rgba(255,255,255,0.4), transparent 50%);
  animation:clAmbientTwinkle 8s ease-in-out infinite alternate;
}
.cl-ambient::after{
  background-image:
    radial-gradient(1px 1px at 30% 10%, rgba(168,132,252,0.7), transparent 50%),
    radial-gradient(1px 1px at 80% 70%, rgba(255,255,255,0.5), transparent 50%),
    radial-gradient(1px 1px at 50% 45%, rgba(216,180,254,0.5), transparent 50%);
  animation-duration:12s;opacity:0.7;
}
@keyframes clAmbientTwinkle{from{opacity:0.5}to{opacity:1}}

.cl-stage{
  position:relative;z-index:1;
  width:100%;max-width:1120px;
  display:flex;flex-direction:column;align-items:center;
}

.cl-close{
  position:absolute;top:-6px;right:-6px;z-index:10;
  width:40px;height:40px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  background:rgba(10,5,30,0.7);
  border:1px solid rgba(216,180,254,0.2);
  color:var(--cl-ink);
  cursor:pointer;
  transition:background 0.25s ease, transform 0.25s ease;
}
.cl-close:hover{background:rgba(168,85,247,0.25);transform:scale(1.06)}

.cl-ornament{
  display:flex;align-items:center;justify-content:center;gap:28px;
  margin-bottom:48px;
  opacity:0;transform:translateY(8px);
  animation:clRevealUp 1.1s cubic-bezier(0.16,1,0.3,1) 0.1s forwards;
}
.cl-ornament .line{
  width:clamp(80px,16vw,180px);height:1px;
  background:linear-gradient(90deg,transparent,rgba(216,180,254,0.35) 50%,transparent);
}
.cl-ornament .sym{font-size:12px;color:var(--cl-lilac);text-shadow:0 0 20px rgba(192,132,252,0.6);opacity:0.8}
.cl-ornament .label{
  font-family:"Cinzel",serif;
  font-size:13px;font-weight:500;letter-spacing:0.42em;
  color:var(--cl-ink);text-transform:uppercase;white-space:nowrap;
}
@keyframes clRevealUp{to{opacity:1;transform:translateY(0)}}

.cl-card{
  position:relative;width:100%;aspect-ratio:16/9;
  border-radius:28px;overflow:hidden;
  opacity:0;transform:translateY(24px) scale(0.985);
  animation:clRevealCard 1.4s cubic-bezier(0.16,1,0.3,1) 0.25s forwards;
  box-shadow:
    var(--cl-shadow-contact),
    var(--cl-shadow-ambient),
    var(--cl-shadow-lift),
    var(--cl-ring-1),
    var(--cl-ring-2);
  transition:transform 0.7s cubic-bezier(0.16,1,0.3,1), box-shadow 0.7s cubic-bezier(0.16,1,0.3,1);
}
@keyframes clRevealCard{to{opacity:1;transform:translateY(0) scale(1)}}

.cl-card:hover{
  transform:translateY(-4px) scale(1.003);
  box-shadow:
    var(--cl-shadow-contact),
    0 50px 140px -30px rgba(88,28,135,0.7),
    0 100px 180px -40px rgba(168,85,247,0.5),
    0 0 0 0.5px rgba(216,180,254,0.18),
    0 0 0 1px rgba(168,85,247,0.28);
}

.cl-halo{
  position:absolute;inset:-60px;border-radius:inherit;z-index:-1;
  background:radial-gradient(ellipse at 50% 50%, rgba(168,85,247,0.28) 0%, transparent 60%);
  filter:blur(60px);opacity:0.9;
  animation:clHaloBreath 8s ease-in-out infinite;pointer-events:none;
}
@keyframes clHaloBreath{
  0%,100%{opacity:0.7;transform:scale(1)}
  50%{opacity:1;transform:scale(1.04)}
}

.cl-inner{
  position:absolute;inset:0;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.20) 0%, transparent 55%),
    radial-gradient(ellipse at 50% 100%, rgba(34,211,238,0.06) 0%, transparent 55%),
    linear-gradient(180deg, #0a0518 0%, #060212 100%);
}

.cl-card::before{
  content:"";position:absolute;inset:-2px;z-index:0;border-radius:inherit;
  background:conic-gradient(from 180deg at 50% 50%,
    transparent 0deg,
    rgba(192,132,252,0.18) 60deg,
    transparent 120deg,
    transparent 240deg,
    rgba(168,85,247,0.14) 300deg,
    transparent 360deg);
  animation:clConicSlow 18s linear infinite;opacity:0.8;pointer-events:none;
}
@keyframes clConicSlow{to{transform:rotate(360deg)}}

.cl-card::after{
  content:"";position:absolute;inset:0;z-index:3;border-radius:inherit;
  background:linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 30%);pointer-events:none;
}

.cl-grain{
  position:absolute;inset:0;z-index:2;border-radius:inherit;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.7 0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>");
  opacity:0.05;mix-blend-mode:overlay;pointer-events:none;
}

.cl-ui{
  position:absolute;inset:0;z-index:4;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;
  cursor:pointer;border:none;background:transparent;color:inherit;font:inherit;padding:0;
}

.cl-play{
  position:relative;width:92px;height:92px;border-radius:50%;
  background:linear-gradient(180deg, #c084fc 0%, #a855f7 50%, #7e22ce 100%);
  display:flex;align-items:center;justify-content:center;
  transition:transform 0.55s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.55s cubic-bezier(0.34,1.56,0.64,1);
  box-shadow:
    0 1px 1px rgba(255,255,255,0.3) inset,
    0 -10px 20px rgba(88,28,135,0.4) inset,
    0 10px 30px rgba(168,85,247,0.5),
    0 30px 60px -15px rgba(168,85,247,0.45),
    0 0 0 0.5px rgba(216,180,254,0.3);
}
.cl-play::before{
  content:"";position:absolute;inset:-1px;border-radius:50%;
  background:conic-gradient(from 0deg,
    rgba(216,180,254,0) 0deg,
    rgba(216,180,254,0.4) 90deg,
    rgba(216,180,254,0) 180deg,
    rgba(216,180,254,0.3) 270deg,
    rgba(216,180,254,0) 360deg);
  -webkit-mask:linear-gradient(#000,#000) content-box, linear-gradient(#000,#000);
  -webkit-mask-composite:xor;mask-composite:exclude;padding:1px;
  animation:clPlayRing 6s linear infinite;opacity:0;transition:opacity 0.4s ease;
}
.cl-play::after{
  content:"";position:absolute;inset:-30px;border-radius:50%;
  background:radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 65%);
  filter:blur(14px);opacity:0.7;
  animation:clPlayHalo 4s ease-in-out infinite;z-index:-1;
}
@keyframes clPlayRing{to{transform:rotate(360deg)}}
@keyframes clPlayHalo{
  0%,100%{opacity:0.55;transform:scale(0.95)}
  50%{opacity:0.9;transform:scale(1.08)}
}
.cl-play .tri{
  width:0;height:0;margin-left:6px;
  border-left:24px solid white;
  border-top:15px solid transparent;
  border-bottom:15px solid transparent;
  filter:drop-shadow(0 2px 3px rgba(0,0,0,0.25));
}
.cl-ui:hover .cl-play{
  transform:scale(1.06);
  box-shadow:
    0 1px 1px rgba(255,255,255,0.4) inset,
    0 -10px 20px rgba(88,28,135,0.4) inset,
    0 14px 38px rgba(168,85,247,0.65),
    0 40px 80px -15px rgba(168,85,247,0.55),
    0 0 0 0.5px rgba(216,180,254,0.45);
}
.cl-ui:hover .cl-play::before{opacity:1}
.cl-ui:active .cl-play{transform:scale(0.97);transition-duration:0.15s}

.cl-caption{display:flex;flex-direction:column;align-items:center;gap:10px;opacity:0.9;transition:opacity 0.4s ease}
.cl-ui:hover .cl-caption{opacity:1}
.cl-caption .title{
  font-family:"Cinzel",serif;
  font-size:12px;font-weight:500;letter-spacing:0.38em;color:var(--cl-ink);text-transform:uppercase;
}
.cl-caption .meta{
  display:flex;align-items:center;gap:10px;font-size:11px;font-weight:400;
  letter-spacing:0.2em;color:var(--cl-muted);text-transform:uppercase;
}
.cl-caption .meta .dot{width:3px;height:3px;border-radius:50%;background:var(--cl-muted);opacity:0.6}

.cl-chrome{
  position:absolute;top:18px;left:18px;z-index:5;display:flex;align-items:center;gap:8px;
  font-size:10px;letter-spacing:0.25em;color:var(--cl-muted);text-transform:uppercase;opacity:0.75;
}
.cl-chrome .live{
  width:6px;height:6px;border-radius:50%;background:#c084fc;
  box-shadow:0 0 10px rgba(192,132,252,0.8);animation:clLivePulse 2s ease-in-out infinite;
}
@keyframes clLivePulse{
  0%,100%{opacity:0.5;transform:scale(1)}
  50%{opacity:1;transform:scale(1.2)}
}
.cl-chrome-right{
  position:absolute;top:18px;right:18px;z-index:5;display:flex;align-items:center;gap:6px;
  font-size:10px;letter-spacing:0.22em;color:var(--cl-muted);opacity:0.65;
}
.cl-chrome-right .dots{display:flex;gap:4px}
.cl-chrome-right .dots span{width:4px;height:4px;border-radius:50%;background:currentColor;opacity:0.5}

.cl-sigil{
  position:absolute;bottom:22px;right:22px;z-index:5;
  font-size:11px;letter-spacing:0.25em;color:var(--cl-muted);opacity:0.55;
  display:flex;align-items:center;gap:8px;
}
.cl-sigil::before{
  content:"";width:24px;height:1px;
  background:linear-gradient(90deg,transparent,rgba(216,180,254,0.3));
}

.cl-card.cl-playing .cl-ui{display:none}
.cl-card iframe,.cl-card video{
  position:absolute;inset:0;width:100%;height:100%;border:none;border-radius:inherit;z-index:4;
}

@media (prefers-reduced-motion: reduce){
  .cl-root *,.cl-root *::before,.cl-root *::after{
    animation-duration:0.01ms!important;animation-iteration-count:1!important;transition-duration:0.01ms!important;
  }
  .cl-halo{animation:none;opacity:0.7}
}
`;

function embedUrl(url) {
  const yt = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
  if (yt) return { type: "iframe", src: `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0` };
  const vim = url.match(/vimeo\.com\/(\d+)/);
  if (vim) return { type: "iframe", src: `https://player.vimeo.com/video/${vim[1]}?autoplay=1` };
  return { type: "video", src: url };
}

export default function CosmicLibraryModal({ open, onClose }) {
  const cardRef = useRef(null);
  const [media, setMedia] = useState(null); // {type,src}

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Reset media when modal closes
  useEffect(() => { if (!open) setMedia(null); }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Parallax tilt on card
  useEffect(() => {
    if (!open) return;
    const card = cardRef.current;
    if (!card) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const onMove = (e) => {
      const r = card.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `translateY(-4px) scale(1.003) perspective(1400px) rotateX(${-ny * 1.2}deg) rotateY(${nx * 1.2}deg)`;
    };
    const onLeave = () => { card.style.transform = ""; };
    card.addEventListener("mousemove", onMove);
    card.addEventListener("mouseleave", onLeave);
    return () => {
      card.removeEventListener("mousemove", onMove);
      card.removeEventListener("mouseleave", onLeave);
    };
  }, [open]);

  const handlePlayClick = useCallback(() => {
    const url = window.prompt("Pega la URL del video (YouTube, Vimeo o .mp4):");
    if (!url) return;
    setMedia(embedUrl(url.trim()));
  }, []);

  const handleBackdropClick = (e) => {
    // Close only when clicking the outer backdrop (not the card/stage)
    if (e.target === e.currentTarget) onClose?.();
  };

  if (!open) return null;

  return (
    <>
      <style>{STYLES}</style>
      <div className="cl-root" role="dialog" aria-modal="true" onClick={handleBackdropClick}>
        <div className="cl-ambient" aria-hidden="true" />

        <div className="cl-stage">
          <button className="cl-close" onClick={onClose} aria-label="Cerrar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="cl-ornament" aria-hidden="true">
            <span className="line" />
            <span className="sym">✦</span>
            <span className="label">Transmisión Principal</span>
            <span className="sym">✦</span>
            <span className="line" />
          </div>

          <div ref={cardRef} className={`cl-card${media ? " cl-playing" : ""}`}>
            <div className="cl-halo" aria-hidden="true" />
            <div className="cl-inner" aria-hidden="true" />
            <div className="cl-grain" aria-hidden="true" />

            <div className="cl-chrome" aria-hidden="true">
              <span className="live" />
              <span>CH · 01</span>
            </div>
            <div className="cl-chrome-right" aria-hidden="true">
              <span>16:9</span>
              <span className="dots"><span /><span /><span /></span>
            </div>

            {!media && (
              <button className="cl-ui" onClick={handlePlayClick} aria-label="Reproducir transmisión principal">
                <span className="cl-play" aria-hidden="true"><span className="tri" /></span>
                <span className="cl-caption">
                  <span className="title">Insertar URL del Video</span>
                  <span className="meta">
                    <span>YouTube</span><span className="dot" />
                    <span>Vimeo</span><span className="dot" />
                    <span>MP4</span>
                  </span>
                </span>
              </button>
            )}

            {media?.type === "iframe" && (
              <iframe
                src={media.src}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title="Transmisión principal"
              />
            )}
            {media?.type === "video" && (
              <video src={media.src} controls autoPlay />
            )}

            <div className="cl-sigil" aria-hidden="true">☽ Biblioteca Cósmica</div>
          </div>
        </div>
      </div>
    </>
  );
}
