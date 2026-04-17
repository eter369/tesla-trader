import { useRef, useEffect, useCallback } from "react";

const CONFIG = {
  SEED: 42,
  size: 240,
  particles: {
    count: 320,
    trailFade: 0.10,
    speedBase: 0.55,
    speedMax: 2.4,
    sizeMin: 0.5,
    sizeMax: 1.8,
    colors: ["#c084fc","#22d3ee","#ffce6a","#e8ecf9"]
  },
  flow: {
    noiseScale: 0.0055,
    timeScale: 0.00012,
    rotateSpeed: 0.04,
    strength: 1.3,
    absorbRadius: 0.9,
    absorbStrength: 2.2,
    mouseAttract: 1.4,
    mouseRadius: 90
  },
  core: {
    radius: 62,
    buffer: 96,
    fbmScale: 3.1,
    octaves: 5,
    warp: 1.4,
    baseSpeed: 0.00020,
    hoverSpeedBoost: 1.8
  },
  stars: {
    layers: [
      { count: 40, speed: 0.015, size: 0.7, twinkle: 1.0 },
      { count: 20, speed: 0.035, size: 1.0, twinkle: 0.7 },
      { count: 8,  speed: 0.075, size: 1.4, twinkle: 0.4 }
    ],
    shootEveryMin: 4000,
    shootEveryMax: 8000
  },
  runes: {
    symbols: ["☽","☉","♄","♆","✦","✧","☥"],
    innerRadius: 82,
    outerRadius: 104,
    innerSpeed: 0.25,
    outerSpeed: -0.18,
    glowPulseSpeed: 2.2
  },
  palette: {
    p1:"#1a0b4d", p2:"#6b21a8", p3:"#c084fc",
    cyan:"#22d3ee", gold:"#f5a623", goldLight:"#ffce6a",
    white:"#e8ecf9", muted:"#8a93b2", bg:"#0a0a1f"
  }
};

function mulberry32(seed){
  let s = seed >>> 0;
  return function(){
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildNoise(seed){
  const rand = mulberry32(seed);
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i=0;i<256;i++) p[i] = i;
  for (let i=255;i>0;i--){
    const j = Math.floor(rand()*(i+1));
    const tmp = p[i]; p[i]=p[j]; p[j]=tmp;
  }
  for (let i=0;i<512;i++) perm[i] = p[i & 255];
  function fade(t){ return t*t*t*(t*(t*6-15)+10); }
  function lerp(a,b,t){ return a + (b-a)*t; }
  function grad(h,x,y){
    const g = h & 7;
    const u = g<4 ? x : y;
    const v = g<4 ? y : x;
    return ((g&1)? -u : u) + ((g&2)? -2*v : 2*v);
  }
  return function noise2D(x,y){
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y);
    const A = perm[X] + Y, B = perm[X+1] + Y;
    const n = lerp(
      lerp(grad(perm[A],   x,   y  ), grad(perm[B],   x-1, y  ), u),
      lerp(grad(perm[A+1], x,   y-1), grad(perm[B+1], x-1, y-1), u),
      v
    );
    return Math.max(-1, Math.min(1, n * 0.7));
  };
}

export default function MysticPortal({ onEnter, displaySize = 240, compact = false }) {
  const bgRef = useRef(null);
  const fxRef = useRef(null);
  const cardRef = useRef(null);
  const stateRef = useRef({ mx: 0, my: 0, mouseIn: false, shock: null, flash: 0 });

  const handleActivate = useCallback(() => {
    if (stateRef.current.shock) return;
    stateRef.current.shock = { t0: performance.now(), duration: 1200, onEnter };
    stateRef.current.flash = 1;
  }, [onEnter]);

  useEffect(() => {
    const bgC = bgRef.current;
    const fxC = fxRef.current;
    if (!bgC || !fxC) return;

    const bg = bgC.getContext("2d");
    const fx = fxC.getContext("2d");

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const LOGICAL = CONFIG.size;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const CX = LOGICAL/2, CY = LOGICAL/2;
    const R  = CONFIG.core.radius;

    stateRef.current.mx = CX;
    stateRef.current.my = CY;

    function sizeCanvas(c, ctx){
      c.width  = LOGICAL * DPR;
      c.height = LOGICAL * DPR;
      c.style.width  = displaySize + "px";
      c.style.height = displaySize + "px";
      ctx.setTransform(DPR,0,0,DPR,0,0);
    }
    sizeCanvas(bgC, bg);
    sizeCanvas(fxC, fx);

    const noise = buildNoise(CONFIG.SEED);
    function fbm(x,y,octaves){
      let total = 0, amp = 1, freq = 1, norm = 0;
      for (let i=0;i<octaves;i++){
        total += noise(x*freq, y*freq) * amp;
        norm  += amp;
        amp   *= 0.5;
        freq  *= 2.02;
      }
      return total / norm;
    }
    function fbmWarped(x,y,t,octaves,warp){
      const qx = fbm(x + 0.1 + t,       y + 0.3,            octaves);
      const qy = fbm(x + 5.2,           y + 1.3 + t,        octaves);
      const rx = fbm(x + warp*qx + 1.7, y + warp*qy + 9.2,  octaves);
      const ry = fbm(x + warp*qx + 8.3, y + warp*qy + 2.8,  octaves);
      return fbm(x + warp*rx, y + warp*ry, octaves);
    }

    const rand = mulberry32(CONFIG.SEED + 7);
    const starLayers = CONFIG.stars.layers.map((cfg)=>{
      const arr = [];
      for (let i=0;i<cfg.count;i++){
        arr.push({
          x: rand()*LOGICAL,
          y: rand()*LOGICAL,
          r: cfg.size * (0.6 + rand()*0.8),
          phase: rand()*Math.PI*2,
          twinkleAmp: cfg.twinkle
        });
      }
      return { cfg, arr };
    });

    let shootingStar = null;
    let nextShootAt  = performance.now() + 2000;

    function spawnShootingStar(){
      const angle = rand()*Math.PI*2;
      const dist  = LOGICAL*0.7;
      shootingStar = {
        x: CX + Math.cos(angle)*dist,
        y: CY + Math.sin(angle)*dist,
        vx: -Math.cos(angle) * 220,
        vy: -Math.sin(angle) * 220,
        life: 1.2,
        maxLife: 1.2
      };
    }

    function drawStars(dt, mx, my, t){
      const px = (mx - CX) / CX;
      const py = (my - CY) / CY;
      for (const L of starLayers){
        const ox = -px * 18 * L.cfg.speed * 60;
        const oy = -py * 18 * L.cfg.speed * 60;
        for (const s of L.arr){
          const tw = 0.5 + 0.5*Math.sin(t*2 + s.phase) * s.twinkleAmp;
          bg.globalAlpha = 0.35 + tw*0.55;
          bg.fillStyle = "#ffffff";
          bg.beginPath();
          bg.arc(((s.x+ox)%LOGICAL+LOGICAL)%LOGICAL, ((s.y+oy)%LOGICAL+LOGICAL)%LOGICAL, s.r, 0, Math.PI*2);
          bg.fill();
        }
      }
      bg.globalAlpha = 1;

      if (!shootingStar && performance.now() > nextShootAt && !reducedMotion){
        spawnShootingStar();
        nextShootAt = performance.now() + CONFIG.stars.shootEveryMin + rand()*(CONFIG.stars.shootEveryMax-CONFIG.stars.shootEveryMin);
      }
      if (shootingStar){
        const s = shootingStar;
        s.x += s.vx*dt; s.y += s.vy*dt; s.life -= dt;
        const a = Math.max(0, s.life/s.maxLife);
        const grad = bg.createLinearGradient(s.x, s.y, s.x - s.vx*0.15, s.y - s.vy*0.15);
        grad.addColorStop(0, `rgba(255,255,255,${a})`);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        bg.strokeStyle = grad;
        bg.lineWidth = 1.6;
        bg.beginPath();
        bg.moveTo(s.x, s.y);
        bg.lineTo(s.x - s.vx*0.15, s.y - s.vy*0.15);
        bg.stroke();
        if (s.life <= 0) shootingStar = null;
      }
    }

    const coreBuf = document.createElement("canvas");
    coreBuf.width = coreBuf.height = CONFIG.core.buffer;
    const coreCtx = coreBuf.getContext("2d");
    const coreImg = coreCtx.createImageData(CONFIG.core.buffer, CONFIG.core.buffer);

    function hexToRgb(h){
      const n = parseInt(h.slice(1),16);
      return [(n>>16)&255, (n>>8)&255, n&255];
    }
    const PAL = [
      hexToRgb(CONFIG.palette.p1),
      hexToRgb(CONFIG.palette.p2),
      hexToRgb(CONFIG.palette.p3),
      [255,255,255]
    ];
    const STOPS = [0, 0.4, 0.75, 1];
    function paletteLookup(v){
      v = Math.max(0, Math.min(1, v));
      for (let i=0;i<STOPS.length-1;i++){
        if (v <= STOPS[i+1]){
          const t = (v-STOPS[i])/(STOPS[i+1]-STOPS[i]);
          const a = PAL[i], b = PAL[i+1];
          return [
            a[0] + (b[0]-a[0])*t | 0,
            a[1] + (b[1]-a[1])*t | 0,
            a[2] + (b[2]-a[2])*t | 0
          ];
        }
      }
      return PAL[PAL.length-1];
    }

    function renderCoreBuffer(t){
      const N = CONFIG.core.buffer;
      const data = coreImg.data;
      const S = CONFIG.core.fbmScale / N;
      const O = CONFIG.core.octaves;
      const W = CONFIG.core.warp;
      const cx = N/2, cy = N/2, rMax = N/2;
      for (let y=0;y<N;y++){
        for (let x=0;x<N;x++){
          const dx = x-cx, dy = y-cy;
          const d  = Math.sqrt(dx*dx+dy*dy)/rMax;
          const i  = (y*N + x)*4;
          if (d > 1){ data[i+3] = 0; continue; }
          const n = fbmWarped(x*S, y*S, t, O, W) * 0.5 + 0.5;
          const v = Math.pow(n, 1.15) * (1 - Math.pow(d, 2.2)*0.7) + (1-d)*0.15;
          const [r,g,b] = paletteLookup(Math.max(0, Math.min(1, v)));
          const a = Math.pow(1 - d, 0.8) * 255;
          data[i]   = r;
          data[i+1] = g;
          data[i+2] = b;
          data[i+3] = a;
        }
      }
      coreCtx.putImageData(coreImg, 0, 0);
    }

    function drawCore(hover){
      const glow = bg.createRadialGradient(CX, CY, R*0.4, CX, CY, R*1.8);
      glow.addColorStop(0, "rgba(139,92,246,0.55)");
      glow.addColorStop(1, "rgba(139,92,246,0)");
      bg.fillStyle = glow;
      bg.beginPath(); bg.arc(CX, CY, R*1.8, 0, Math.PI*2); bg.fill();

      bg.save();
      bg.beginPath();
      bg.arc(CX, CY, R, 0, Math.PI*2);
      bg.clip();

      if (hover){
        bg.globalCompositeOperation = "screen";
        bg.globalAlpha = 0.9;
        bg.drawImage(coreBuf, CX-R+2, CY-R, R*2, R*2);
        bg.drawImage(coreBuf, CX-R,   CY-R, R*2, R*2);
        bg.drawImage(coreBuf, CX-R-2, CY-R, R*2, R*2);
        bg.globalCompositeOperation = "source-over";
        bg.globalAlpha = 1;
      } else {
        bg.drawImage(coreBuf, CX-R, CY-R, R*2, R*2);
      }

      const hi = bg.createRadialGradient(CX-R*0.25, CY-R*0.3, 0, CX, CY, R);
      hi.addColorStop(0, "rgba(255,255,255,0.25)");
      hi.addColorStop(0.5, "rgba(255,255,255,0)");
      bg.fillStyle = hi;
      bg.fillRect(CX-R, CY-R, R*2, R*2);
      bg.restore();

      bg.strokeStyle = "rgba(192,132,252,0.35)";
      bg.lineWidth = 1;
      bg.beginPath(); bg.arc(CX, CY, R+1.5, 0, Math.PI*2); bg.stroke();
    }

    const runes = [];
    {
      const syms = CONFIG.runes.symbols;
      for (let i=0;i<syms.length;i++){
        runes.push({
          sym: syms[i],
          ring: i%2 === 0 ? "inner" : "outer",
          baseAngle: (i/syms.length)*Math.PI*2 + rand()*0.2
        });
      }
    }

    function drawRunes(t, which){
      for (const r of runes){
        const radius = r.ring === "inner" ? CONFIG.runes.innerRadius : CONFIG.runes.outerRadius;
        const speed  = r.ring === "inner" ? CONFIG.runes.innerSpeed  : CONFIG.runes.outerSpeed;
        const angle  = r.baseAngle + t*speed;
        const z      = Math.sin(angle);
        if (which === "back"  && z >= 0) continue;
        if (which === "front" && z <  0) continue;

        const x = CX + Math.cos(angle) * radius;
        const y = CY + Math.sin(angle) * radius * 0.42;
        const depth = (z + 1) / 2;
        const scale = 0.6 + 0.55 * depth;
        const alpha = 0.25 + 0.75 * depth;
        const pulse = 0.7 + 0.3*Math.sin(t*CONFIG.runes.glowPulseSpeed + r.baseAngle*3);

        const ctx = which === "back" ? bg : fx;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;
        ctx.shadowColor = CONFIG.palette.gold;
        ctx.shadowBlur = 14 * pulse;
        ctx.fillStyle = CONFIG.palette.goldLight;
        ctx.font = "14px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(r.sym, 0, 0);
        ctx.restore();
      }
    }

    const particles = [];
    function spawnParticle(p){
      const a = rand()*Math.PI*2;
      const d = R*1.3 + rand()*(LOGICAL*0.35);
      p.x = CX + Math.cos(a)*d;
      p.y = CY + Math.sin(a)*d;
      p.px = p.x; p.py = p.y;
      p.vx = 0; p.vy = 0;
      p.life = 0.6 + rand()*1.2;
      p.maxLife = p.life;
      p.size = CONFIG.particles.sizeMin + rand()*(CONFIG.particles.sizeMax-CONFIG.particles.sizeMin);
      p.color = CONFIG.particles.colors[(rand()*CONFIG.particles.colors.length)|0];
      return p;
    }
    if (!reducedMotion){
      for (let i=0;i<CONFIG.particles.count;i++) particles.push(spawnParticle({}));
    }

    function stepParticles(dt, t, mx, my, mouseIn, shockActive){
      const S = CONFIG.flow.noiseScale;
      const rot = t*CONFIG.flow.rotateSpeed;
      const rotC = Math.cos(rot), rotS = Math.sin(rot);
      const absorbR = R * (1 + CONFIG.flow.absorbRadius);

      for (const p of particles){
        p.px = p.x; p.py = p.y;
        const nx = (p.x-CX)*rotC - (p.y-CY)*rotS + CX;
        const ny = (p.x-CX)*rotS + (p.y-CY)*rotC + CY;
        const ang = noise(nx*S, ny*S + t*CONFIG.flow.timeScale*1e3) * Math.PI * 2;
        let fxd = Math.cos(ang) * CONFIG.flow.strength;
        let fyd = Math.sin(ang) * CONFIG.flow.strength;

        const dxC = CX - p.x, dyC = CY - p.y;
        const dC  = Math.sqrt(dxC*dxC + dyC*dyC) + 0.001;
        if (dC < absorbR){
          const k = (1 - dC/absorbR) * CONFIG.flow.absorbStrength;
          fxd += (dxC/dC) * k;
          fyd += (dyC/dC) * k;
        }

        if (mouseIn){
          const dxM = mx - p.x, dyM = my - p.y;
          const dM  = Math.sqrt(dxM*dxM + dyM*dyM);
          if (dM < CONFIG.flow.mouseRadius){
            const k = (1 - dM/CONFIG.flow.mouseRadius) * CONFIG.flow.mouseAttract;
            fxd += (dxM/(dM+0.001)) * k;
            fyd += (dyM/(dM+0.001)) * k;
          }
        }

        if (shockActive){
          const k = 6;
          fxd -= (dxC/dC) * k;
          fyd -= (dyC/dC) * k;
        }

        p.vx = (p.vx + fxd*dt*60) * 0.94;
        p.vy = (p.vy + fyd*dt*60) * 0.94;
        const sp = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
        const maxS = CONFIG.particles.speedMax * (shockActive ? 3 : 1);
        if (sp > maxS){ p.vx *= maxS/sp; p.vy *= maxS/sp; }

        p.x += p.vx;
        p.y += p.vy;
        p.life -= dt;

        if (p.life <= 0 || p.x<-10 || p.x>LOGICAL+10 || p.y<-10 || p.y>LOGICAL+10 || dC < R*0.35){
          spawnParticle(p);
        }
      }
    }

    function drawParticles(){
      fx.lineCap = "round";
      for (const p of particles){
        const a = Math.min(1, p.life / p.maxLife);
        fx.globalAlpha = 0.55 * a;
        fx.strokeStyle = p.color;
        fx.lineWidth = p.size;
        fx.beginPath();
        fx.moveTo(p.px, p.py);
        fx.lineTo(p.x, p.y);
        fx.stroke();
      }
      fx.globalAlpha = 1;
    }

    function drawShock(now){
      const st = stateRef.current;
      if (!st.shock) return false;
      const e = (now - st.shock.t0) / st.shock.duration;
      if (e >= 1){
        const cb = st.shock.onEnter;
        st.shock = null;
        if (cb) cb();
        return false;
      }
      for (let i=0;i<2;i++){
        const delay = i*0.15;
        const le = Math.max(0, e - delay);
        if (le <= 0) continue;
        const eaE = 1 - Math.pow(1-Math.min(1,le/0.85), 3);
        const radius = R + eaE * (LOGICAL*0.7);
        const alpha  = (1-le) * 0.8;
        fx.strokeStyle = `rgba(192,132,252,${alpha})`;
        fx.lineWidth = 2.5 * (1-le) + 0.5;
        fx.beginPath();
        fx.arc(CX, CY, radius, 0, Math.PI*2);
        fx.stroke();
      }
      return e < 0.5;
    }

    function drawFlash(){
      const st = stateRef.current;
      if (st.flash <= 0) return;
      fx.globalAlpha = st.flash;
      fx.fillStyle = "#ffffff";
      fx.fillRect(0,0,LOGICAL,LOGICAL);
      fx.globalAlpha = 1;
    }

    let last = performance.now();
    let coreT = 0;
    let raf;

    function frame(now){
      let dt = (now - last) / 1000;
      if (dt > 0.05) dt = 0.05;
      last = now;
      const t = now / 1000;
      const st = stateRef.current;

      bg.fillStyle = CONFIG.palette.bg;
      bg.fillRect(0,0,LOGICAL,LOGICAL);

      drawStars(dt, st.mx, st.my, t);

      const coreSpeed = CONFIG.core.baseSpeed * (st.mouseIn ? CONFIG.core.hoverSpeedBoost : 1);
      coreT += (reducedMotion ? 0 : dt * 1000 * coreSpeed);
      renderCoreBuffer(coreT);

      drawRunes(t, "back");
      drawCore(st.mouseIn);

      fx.globalCompositeOperation = "destination-out";
      fx.fillStyle = `rgba(0,0,0,${CONFIG.particles.trailFade})`;
      fx.fillRect(0,0,LOGICAL,LOGICAL);
      fx.globalCompositeOperation = "source-over";

      if (!reducedMotion){
        const shockActive = !!st.shock && ((now-st.shock.t0)/st.shock.duration < 0.5);
        stepParticles(dt, t, st.mx, st.my, st.mouseIn, shockActive);
        drawParticles();
      }

      drawRunes(t, "front");
      drawShock(now);
      drawFlash();
      st.flash = Math.max(0, st.flash - dt*2.5);

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame((t)=>{ last = t; frame(t); });

    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const handleMouseEnter = () => { stateRef.current.mouseIn = true; };
  const handleMouseLeave = () => {
    stateRef.current.mouseIn = false;
    stateRef.current.mx = CONFIG.size/2;
    stateRef.current.my = CONFIG.size/2;
  };
  const handleMouseMove = (e) => {
    const r = fxRef.current?.getBoundingClientRect();
    if (!r || !r.width || !r.height) return;
    stateRef.current.mx = (e.clientX - r.left) * (CONFIG.size / r.width);
    stateRef.current.my = (e.clientY - r.top)  * (CONFIG.size / r.height);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " "){
      e.preventDefault();
      handleActivate();
    }
  };

  if (compact) {
    return (
      <div
        ref={cardRef}
        role="button"
        tabIndex={0}
        aria-label="Entrar a la biblioteca cósmica"
        onClick={handleActivate}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        title="Portal Místico"
        className="relative cursor-pointer select-none outline-none rounded-full overflow-hidden"
        style={{
          width: displaySize,
          height: displaySize,
          boxShadow: "0 0 18px rgba(168,85,247,.45), inset 0 0 0 1px rgba(168,85,247,.3)",
        }}
      >
        <canvas ref={bgRef} className="absolute inset-0 block" />
        <canvas ref={fxRef} className="absolute inset-0 block" />
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ boxShadow: "inset 0 0 14px 6px rgba(5,5,16,0.7)" }}
        />
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      aria-label="Entrar a la biblioteca cósmica"
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      className="hidden lg:flex flex-col items-center text-center cursor-pointer transition-all duration-300 select-none outline-none rounded-2xl"
      style={{
        width: 280,
        padding: "18px 16px 16px",
        background: "linear-gradient(180deg,rgba(20,26,51,.85),rgba(11,15,36,.95))",
        border: "1px solid rgba(139,92,246,.22)",
        boxShadow: "0 10px 40px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.04)",
      }}
    >
      <div className="flex items-center gap-2 text-[10px] tracking-[2px] uppercase mb-2 self-start" style={{ color: "#8a93b2" }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#f5a623", boxShadow: "0 0 10px #f5a623" }} />
        Portal Místico
      </div>
      <div className="relative" style={{ width: displaySize, height: displaySize }}>
        <canvas ref={bgRef} className="absolute inset-0 block" />
        <canvas ref={fxRef} className="absolute inset-0 block" />
      </div>
      <div className="font-bold tracking-[2px] text-sm mt-1" style={{ color: "#ffce6a", textShadow: "0 0 18px rgba(245,166,35,.4)" }}>
        ENTRAR
      </div>
      <div className="text-[10px] tracking-[2px] mt-1" style={{ color: "#8a93b2" }}>
        BIBLIOTECA CÓSMICA
      </div>
    </div>
  );
}
