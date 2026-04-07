import { useState, useEffect, useRef, useMemo } from "react";

// ─── Icons ───
function ChevronDown({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRight({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlayIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="23" stroke="white" strokeWidth="1.5" strokeOpacity="0.3" />
      <path d="M19 15L34 24L19 33V15Z" fill="white" fillOpacity="0.9" />
    </svg>
  );
}

// ─── Waitlist Button (dark) ───
function WaitlistButtonDark() {
  return (
    <div className="group relative inline-flex">
      <div className="relative rounded-full" style={{ padding: "0.6px" }}>
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] opacity-60 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)", filter: "blur(1px)" }}
        />
        <div className="rounded-full" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 100%)", padding: "1px" }}>
          <div
            className="rounded-full flex items-center justify-center cursor-pointer group-hover:bg-white/[0.06] transition-all duration-300"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)", padding: "11px 29px" }}
          >
            <span className="text-white text-sm font-medium tracking-wide">Join Waitlist</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Waitlist Button (light CTA) ───
function WaitlistButtonLight() {
  return (
    <div className="group relative inline-flex">
      <div className="relative rounded-full" style={{ padding: "0.6px" }}>
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] opacity-50 group-hover:opacity-90 transition-opacity duration-500"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)", filter: "blur(2px)" }}
        />
        <div className="absolute inset-0 rounded-full overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)" }} />
        </div>
        <div className="rounded-full" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.80) 100%)", padding: "1px" }}>
          <div className="rounded-full flex items-center justify-center gap-2.5 cursor-pointer transition-all duration-300"
            style={{ background: "linear-gradient(180deg, #ffffff 0%, #e8e8e8 100%)", padding: "13px 36px", boxShadow: "0 0 30px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,1)" }}>
            <span className="text-black text-sm font-semibold tracking-wide">Join Waitlist</span>
            <ArrowRight size={15} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Particles ───
function Particles() {
  const particles = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: Math.random() * 2 + 0.5, duration: 15 + Math.random() * 25,
    delay: Math.random() * 10, opacity: Math.random() * 0.3 + 0.05,
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2]">
      {particles.map(p => (
        <div key={p.id} className="absolute rounded-full bg-white"
          style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%`, opacity: p.opacity,
            animation: `heroFloat ${p.duration}s ease-in-out ${p.delay}s infinite` }} />
      ))}
    </div>
  );
}

// ─── Centered Video Showcase ───
function VideoShowcase({ scrollY }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.2 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Parallax factor for the video container
  const parallax = Math.max(0, (scrollY - 400) * 0.08);

  return (
    <div
      ref={containerRef}
      className="relative w-full flex flex-col items-center"
      style={{ padding: "0 24px 140px" }}
    >
      {/* Section label */}
      <div
        className="flex flex-col items-center gap-5 mb-16"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div
          className="inline-flex items-center gap-2 rounded-full"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "6px 16px",
            backdropFilter: "blur(10px)",
          }}
        >
          <span className="rounded-full" style={{ width: 4, height: 4, background: "rgba(120,200,255,0.8)", boxShadow: "0 0 8px rgba(120,200,255,0.4)" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            See it in action
          </span>
        </div>

        <h2
          style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 500,
            lineHeight: 1.2,
            letterSpacing: "-0.03em",
            textAlign: "center",
            background: "linear-gradient(144.5deg, #ffffff 20%, rgba(255,255,255,0.4) 80%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Built for the next era
        </h2>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.35)", maxWidth: 480, textAlign: "center", lineHeight: 1.7 }}>
          Experience the performance that sets EOS apart. Real infrastructure, real speed, no compromises.
        </p>
      </div>

      {/* Video Frame */}
      <div
        className="relative w-full group cursor-pointer"
        style={{
          maxWidth: 960,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? `translateY(${-parallax}px)` : "translateY(60px)",
          transition: "opacity 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s, transform 1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s",
        }}
        onClick={() => {
          if (videoRef.current) {
            if (videoRef.current.paused) { videoRef.current.play(); setIsPlaying(true); }
            else { videoRef.current.pause(); setIsPlaying(false); }
          }
        }}
      >
        {/* Ambient glow behind video */}
        <div
          className="absolute -inset-[2px] rounded-[22px] opacity-40 group-hover:opacity-60 transition-opacity duration-700 blur-xl"
          style={{
            background: "linear-gradient(135deg, rgba(100,140,255,0.15), rgba(200,100,255,0.1), rgba(100,200,255,0.12))",
            backgroundSize: "200% 200%",
            animation: "gradientMove 8s ease infinite",
          }}
        />

        {/* Outer glass border */}
        <div
          className="relative rounded-[20px] overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))",
            padding: 1,
          }}
        >
          {/* Top light streak */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 h-[1px] z-10 opacity-50"
            style={{
              width: "60%",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
              filter: "blur(0.5px)",
            }}
          />

          {/* Inner container */}
          <div className="relative rounded-[19px] overflow-hidden" style={{ background: "#000" }}>
            {/* Video */}
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              className="w-full block"
              style={{
                aspectRatio: "16/9",
                objectFit: "cover",
              }}
            >
              <source
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_024928_1efd0b0d-6c02-45a8-8847-1030900c4f63.mp4"
                type="video/mp4"
              />
            </video>

            {/* Subtle inner vignette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                boxShadow: "inset 0 0 80px rgba(0,0,0,0.3)",
                borderRadius: 19,
              }}
            />

            {/* Play/Pause overlay — shows on hover when paused */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
              style={{ opacity: !isPlaying ? 0.8 : 0 }}
            >
              <div style={{ filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.5))" }}>
                <PlayIcon size={64} />
              </div>
            </div>

            {/* Bottom gradient inside video */}
            <div
              className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)" }}
            />
          </div>
        </div>

        {/* Reflection below video */}
        <div
          className="absolute -bottom-8 left-[10%] right-[10%] h-16 rounded-full opacity-20"
          style={{
            background: "radial-gradient(ellipse, rgba(100,140,255,0.2), transparent 70%)",
            filter: "blur(20px)",
          }}
        />
      </div>

      {/* Stats row below video */}
      <div
        className="flex items-center justify-center gap-8 md:gap-16 mt-16 flex-wrap"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s",
        }}
      >
        {[
          { value: "10,000+", label: "Transactions/sec" },
          { value: "<0.5s", label: "Finality" },
          { value: "99.99%", label: "Uptime" },
          { value: "$0.001", label: "Avg tx cost" },
        ].map((stat, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <span style={{ fontSize: "clamp(20px, 2.5vw, 28px)", fontWeight: 600, color: "rgba(255,255,255,0.85)", letterSpacing: "-0.02em" }}>
              {stat.value}
            </span>
            <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function LandingHero() {
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = ["Get Started", "Developers", "Features", "Resources"];
  const navbarBg = scrollY > 50 ? "rgba(0,0,0,0.6)" : "transparent";
  const navbarBlur = scrollY > 50 ? "blur(20px)" : "none";
  const navbarBorder = scrollY > 50 ? "rgba(255,255,255,0.06)" : "transparent";

  return (
    <div className="relative w-full" style={{ background: "#000" }}>
      <style>{`
        @import url('https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap');
        .hero-root { font-family: 'General Sans', 'Inter', system-ui, sans-serif; }
        @keyframes heroFloat {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.05; }
          25% { transform: translate(10px, -20px) scale(1.2); opacity: 0.2; }
          50% { transform: translate(-5px, -40px) scale(0.8); opacity: 0.3; }
          75% { transform: translate(15px, -20px) scale(1.1); opacity: 0.15; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulseOrb {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.1); }
        }
        @keyframes scrollDown {
          0% { transform: translateY(0); opacity: 0.6; }
          50% { transform: translateY(8px); opacity: 0.2; }
          100% { transform: translateY(0); opacity: 0.6; }
        }
        .animate-fadeUp { animation: fadeUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fadeIn { animation: fadeIn 0.6s ease forwards; }
        .hero-heading {
          background: linear-gradient(144.5deg, #ffffff 28%, rgba(255,255,255,0.35) 75%, rgba(0,0,0,0) 115%);
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
        }
        .nav-link-hover { position: relative; }
        .nav-link-hover::after {
          content: ''; position: absolute; bottom: -2px; left: 50%; width: 0; height: 1px;
          background: rgba(255,255,255,0.4); transition: all 0.3s ease; transform: translateX(-50%);
        }
        .nav-link-hover:hover::after { width: 100%; }
        html { scroll-behavior: smooth; }
        body::-webkit-scrollbar { width: 0; }
      `}</style>

      {/* ═══════════════════════════════════════ */}
      {/* SECTION 1: HERO with background video   */}
      {/* ═══════════════════════════════════════ */}
      <div className="relative min-h-screen overflow-hidden">
        {/* Background Video */}
        <video autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={{ transform: `scale(${1 + scrollY * 0.0002})` }}>
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4" type="video/mp4" />
        </video>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50 z-[1]" />

        {/* Ambient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2]">
          <div className="absolute rounded-full"
            style={{ width: 600, height: 600, top: "-10%", left: "50%", transform: "translateX(-50%)",
              background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)", animation: "pulseOrb 8s ease-in-out infinite" }} />
          <div className="absolute rounded-full"
            style={{ width: 400, height: 400, bottom: "5%", right: "-5%",
              background: "radial-gradient(circle, rgba(120,120,255,0.03) 0%, transparent 70%)", animation: "pulseOrb 12s ease-in-out 4s infinite" }} />
        </div>

        <Particles />

        {/* Content */}
        <div className="relative z-10 hero-root min-h-screen flex flex-col">
          {/* Navbar */}
          <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
            style={{ backgroundColor: navbarBg, backdropFilter: navbarBlur, WebkitBackdropFilter: navbarBlur, borderBottom: `1px solid ${navbarBorder}` }}>
            <div className="flex items-center justify-between w-full" style={{ padding: "20px 32px", maxWidth: 1440, margin: "0 auto" }}>
              <div className="flex items-center gap-10">
                <svg width="187" height="25" viewBox="0 0 187 25" fill="none" className="opacity-90">
                  <text x="0" y="19" fill="white" fontSize="18" fontWeight="600" fontFamily="General Sans, sans-serif" letterSpacing="3">LOGOIPSUM</text>
                </svg>
                <div className="hidden md:flex items-center" style={{ gap: 30 }}>
                  {navLinks.map(link => (
                    <a key={link} href="#" className="nav-link-hover flex items-center text-white/80 hover:text-white transition-colors duration-300"
                      style={{ fontSize: 14, fontWeight: 500, gap: 6 }}>
                      {link}<ChevronDown size={12} />
                    </a>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <WaitlistButtonDark />
                <button className="md:hidden flex flex-col gap-1.5 p-2" onClick={() => setMobileMenu(!mobileMenu)}>
                  <span className={`block w-5 h-[1.5px] bg-white transition-all duration-300 ${mobileMenu ? "rotate-45 translate-y-[4.5px]" : ""}`} />
                  <span className={`block w-5 h-[1.5px] bg-white transition-all duration-300 ${mobileMenu ? "opacity-0" : ""}`} />
                  <span className={`block w-5 h-[1.5px] bg-white transition-all duration-300 ${mobileMenu ? "-rotate-45 -translate-y-[4.5px]" : ""}`} />
                </button>
              </div>
            </div>
            {mobileMenu && (
              <div className="md:hidden animate-fadeIn" style={{ padding: "16px 32px 24px", background: "rgba(0,0,0,0.9)", backdropFilter: "blur(30px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {navLinks.map(link => (
                  <a key={link} href="#" className="flex items-center justify-between text-white/70 hover:text-white transition-colors"
                    style={{ padding: "14px 0", fontSize: 15, fontWeight: 500, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {link}<ChevronDown size={14} />
                  </a>
                ))}
              </div>
            )}
          </nav>

          {/* Hero text */}
          <div className="flex-1 flex flex-col items-center justify-center text-center"
            style={{ paddingTop: "clamp(200px, 22vw, 280px)", paddingBottom: 102, paddingLeft: 24, paddingRight: 24 }}>
            {/* Badge */}
            <div className="animate-fadeUp inline-flex items-center gap-2 rounded-full mb-10"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", padding: "8px 20px", borderRadius: 20, animationDelay: "0.1s", opacity: 0, backdropFilter: "blur(10px)" }}>
              <span className="rounded-full animate-pulse" style={{ width: 5, height: 5, background: "#fff", boxShadow: "0 0 8px rgba(255,255,255,0.5)" }} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                <span className="text-white/50">Early access available from</span>
                <span className="text-white font-semibold"> May 1, 2026</span>
              </span>
            </div>

            {/* Heading */}
            <h1 className="animate-fadeUp hero-heading"
              style={{ maxWidth: 680, fontSize: "clamp(36px, 5.5vw, 64px)", fontWeight: 500, lineHeight: 1.15, letterSpacing: "-0.03em", animationDelay: "0.25s", opacity: 0 }}>
              Web3 at the Speed<br />of Experience
            </h1>

            {/* Subtitle */}
            <p className="animate-fadeUp"
              style={{ maxWidth: 600, marginTop: 28, fontSize: "clamp(14px, 1.5vw, 16px)", fontWeight: 400, lineHeight: 1.7, color: "rgba(255,255,255,0.50)", letterSpacing: "0.01em", animationDelay: "0.4s", opacity: 0 }}>
              Powering seamless experiences and real-time connections, EOS is the base for creators who move with purpose, leveraging resilience, speed, and scale to shape the future.
            </p>

            {/* CTA */}
            <div className="animate-fadeUp" style={{ marginTop: 48, animationDelay: "0.55s", opacity: 0 }}>
              <WaitlistButtonLight />
            </div>

            {/* Social proof */}
            <div className="animate-fadeUp flex flex-col items-center gap-4" style={{ marginTop: 72, animationDelay: "0.7s", opacity: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.25)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                Trusted by builders worldwide
              </span>
              <div className="flex items-center gap-8">
                {["Chainlink", "Polygon", "Aave", "Uniswap"].map(name => (
                  <span key={name} className="text-white/15 hover:text-white/30 transition-colors duration-500 cursor-default"
                    style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.05em" }}>{name}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10">
            <span style={{ fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Scroll</span>
            <svg width="16" height="24" viewBox="0 0 16 24" fill="none" style={{ animation: "scrollDown 2s ease infinite" }}>
              <path d="M8 4V20M8 20L2 14M8 20L14 14" stroke="white" strokeWidth="1.2" strokeOpacity="0.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-[3]"
            style={{ background: "linear-gradient(to top, #000000, transparent)" }} />
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* SECTION 2: CENTERED VIDEO SHOWCASE      */}
      {/* ═══════════════════════════════════════ */}
      <div className="relative hero-root" style={{ background: "#000", paddingTop: 120 }}>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }} />

        <VideoShowcase scrollY={scrollY} />
      </div>
    </div>
  );
}
