import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Search, Download, UploadCloud, Lock, Unlock, Shuffle, Sparkles,
  Trash2, ScrollText, KeyRound, Eye, EyeOff,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   BIBLIOTHECA HERMETICA — La biblioteca gnóstica de Alejandría
   Subir = sellar · Descargar = descifrar · Leer = iniciarse
═══════════════════════════════════════════════════════════════ */

/* ─── Cámaras planetarias ─────────────────────────────────── */
const CHAMBERS = [
  { id: "all",      name: "Todos los Códices",   symbol: "✦", color: "#c084fc", glow: "168,85,247",  desc: "El archivo completo" },
  { id: "solar",    name: "Cámara Solar",         symbol: "☉", color: "#fbbf24", glow: "251,191,36",  desc: "Trading · Ciclos · Oro" },
  { id: "lunar",    name: "Cámara Lunar",         symbol: "☽", color: "#dbeafe", glow: "219,234,254", desc: "Astrología · Sentimiento" },
  { id: "mercurio", name: "Cámara de Mercurio",   symbol: "☿", color: "#22d3ee", glow: "34,211,238",  desc: "Código · Comunicación" },
  { id: "venus",    name: "Cámara de Venus",      symbol: "♀", color: "#f472b6", glow: "244,114,182", desc: "Arte · 432Hz · Belleza" },
  { id: "marte",    name: "Cámara de Marte",      symbol: "♂", color: "#ef4444", glow: "239,68,68",   desc: "Estrategia · Voluntad" },
  { id: "jupiter",  name: "Cámara de Júpiter",    symbol: "♃", color: "#a78bfa", glow: "167,139,250", desc: "Filosofía · Abundancia" },
  { id: "saturno",  name: "Cámara de Saturno",    symbol: "♄", color: "#9ca3af", glow: "156,163,175", desc: "Disciplina · Tiempo · Karma" },
  { id: "sancta",   name: "Sancta Sanctorum",     symbol: "✶", color: "#fde68a", glow: "253,230,138", desc: "Solo iniciados" },
];

const CHAMBER_BY_ID = Object.fromEntries(CHAMBERS.map((c) => [c.id, c]));

/* ─── Sello lunar (cuándo se selló el manuscrito) ─────────── */
const PHASES = ["Luna Nueva", "Creciente", "Cuarto Creciente", "Gibosa Creciente", "Luna Llena", "Gibosa Menguante", "Cuarto Menguante", "Menguante"];
const SIGNS  = ["Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo", "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis"];
function lunarSeal(date = new Date()) {
  const synodic = 2551442.876;
  const ref = new Date(2000, 0, 6, 18, 14, 0).getTime() / 1000;
  const t = (date.getTime() / 1000 - ref) / synodic;
  const phase = ((t % 1) + 1) % 1;
  const ph = PHASES[Math.floor(phase * 8) % 8];
  const sign = SIGNS[Math.floor(((date.getTime() / 86400000) + date.getUTCMonth() * 2.5) % 12)];
  return `${ph} · ${sign}`;
}

/* ─── Hash & PRNG seeded por hash ─────────────────────────── */
function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return h.toString(36).replace("-", "x");
}
function makeRng(seedStr) {
  let s = 0;
  for (let i = 0; i < seedStr.length; i++) s = ((s << 5) - s + seedStr.charCodeAt(i)) | 0;
  s = Math.abs(s) || 1;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

/* ─── Sigilo generativo (canvas) ──────────────────────────── */
function Sigil({ seed, color = "#c084fc", size = 84 }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const rng = makeRng(seed || "void");
    const cx = size / 2, cy = size / 2;
    const r = size * 0.42;

    // Outer rings
    ctx.strokeStyle = color + "55";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = color + "30";
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.84, 0, Math.PI * 2); ctx.stroke();

    // Polygon vertices
    const n = 5 + Math.floor(rng() * 4); // 5..8
    const rotOffset = rng() * Math.PI * 2;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2 + rotOffset;
      pts.push({ x: cx + Math.cos(a) * r * 0.82, y: cy + Math.sin(a) * r * 0.82 });
    }

    // Internal connections (pseudo-pentagram pattern)
    ctx.strokeStyle = color + "cc";
    ctx.lineWidth = 0.9;
    const drawn = new Set();
    for (let i = 0; i < n; i++) {
      const skip = 1 + Math.floor(rng() * Math.max(1, n - 2));
      const j = (i + skip) % n;
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (drawn.has(key)) continue;
      drawn.add(key);
      ctx.beginPath();
      ctx.moveTo(pts[i].x, pts[i].y);
      ctx.lineTo(pts[j].x, pts[j].y);
      ctx.stroke();
    }

    // Vertex marks
    ctx.fillStyle = color;
    pts.forEach((p) => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2); ctx.fill();
    });

    // Tiny inner sigil — square or triangle
    const inner = Math.floor(rng() * 3);
    ctx.strokeStyle = color + "88";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    if (inner === 0) {
      ctx.moveTo(cx, cy - 5);
      ctx.lineTo(cx + 4, cy + 4);
      ctx.lineTo(cx - 4, cy + 4);
      ctx.closePath();
    } else if (inner === 1) {
      ctx.rect(cx - 4, cy - 4, 8, 8);
    } else {
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    }
    ctx.stroke();

    // Center dot
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(cx, cy, 1.4, 0, Math.PI * 2); ctx.fill();
  }, [seed, color, size]);
  return <canvas ref={ref} style={{ display: "block" }} aria-hidden="true" />;
}

/* ─── IndexedDB (persistir blobs grandes) ─────────────────── */
const DB_NAME = "bibliotheca-hermetica";
const STORE = "blobs";

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("no-idb"));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbPut(key, blob) {
  const db = await openDb();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, key);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}
async function dbGet(key) {
  const db = await openDb();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readonly");
    const r = tx.objectStore(STORE).get(key);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function dbDelete(key) {
  const db = await openDb();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

/* ─── Cifrado AES-GCM con frase-llave ─────────────────────── */
async function deriveKey(passphrase, salt) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 120_000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}
async function encryptBlob(blob, passphrase) {
  const data = await blob.arrayBuffer();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  const out = new Uint8Array(salt.length + iv.length + ct.byteLength);
  out.set(salt, 0);
  out.set(iv, salt.length);
  out.set(new Uint8Array(ct), salt.length + iv.length);
  return new Blob([out]);
}
async function decryptBlob(blob, passphrase) {
  const buf = new Uint8Array(await blob.arrayBuffer());
  const salt = buf.slice(0, 16);
  const iv = buf.slice(16, 28);
  const ct = buf.slice(28);
  const key = await deriveKey(passphrase, salt);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new Blob([plain]);
}

/* ─── Helpers ─────────────────────────────────────────────── */
function formatSize(b) {
  if (b == null) return "—";
  if (b < 1024) return b + " B";
  if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
  if (b < 1073741824) return (b / 1048576).toFixed(1) + " MB";
  return (b / 1073741824).toFixed(2) + " GB";
}
function getExt(name) {
  const m = /\.([a-z0-9]+)$/i.exec(name || "");
  return m ? m[1].toLowerCase() : "";
}
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/* ─── Seeds (códices iniciales) ───────────────────────────── */
const SEED = [
  { id: "seed-1", title: "Tratado de los Ciclos Lunares en Bitcoin", chamber: "lunar",    scribe: "Hermes_369",   size: 2_456_000,  mime: "application/pdf", ext: "pdf",  sealedAt: Date.now() - 86400000 * 3,  moonSeal: lunarSeal(new Date(Date.now() - 86400000 * 3)),  encrypted: false, keyHint: "", studyCount: 47, sigilSeed: "trat-luna-369" },
  { id: "seed-2", title: "Códice de Tesla — 3, 6, 9",                chamber: "solar",    scribe: "Custodio",     size: 1_180_000,  mime: "application/epub+zip", ext: "epub", sealedAt: Date.now() - 86400000 * 9,  moonSeal: lunarSeal(new Date(Date.now() - 86400000 * 9)),  encrypted: true,  keyHint: "el ciclo retorna",      studyCount: 23, sigilSeed: "tesla-codice-369" },
  { id: "seed-3", title: "Frecuencias 432 Hz · Sintonización Áurea", chamber: "venus",    scribe: "Lyra_Aetherea", size: 8_640_000, mime: "audio/mpeg",      ext: "mp3",  sealedAt: Date.now() - 86400000 * 1,  moonSeal: lunarSeal(new Date(Date.now() - 86400000 * 1)),  encrypted: false, keyHint: "", studyCount: 86, sigilSeed: "venus-432-aurea" },
  { id: "seed-4", title: "Estrategias de Marte — Risk Management",   chamber: "marte",    scribe: "Ares_Praxis",   size: 3_200_000, mime: "application/pdf", ext: "pdf",  sealedAt: Date.now() - 86400000 * 14, moonSeal: lunarSeal(new Date(Date.now() - 86400000 * 14)), encrypted: false, keyHint: "", studyCount: 19, sigilSeed: "marte-risk-praxis" },
  { id: "seed-5", title: "Glosario Hermético del Trader",            chamber: "mercurio", scribe: "Trismegisto",   size: 980_000,   mime: "application/pdf", ext: "pdf",  sealedAt: Date.now() - 86400000 * 21, moonSeal: lunarSeal(new Date(Date.now() - 86400000 * 21)), encrypted: false, keyHint: "", studyCount: 142, sigilSeed: "mercurio-glosario" },
  { id: "seed-6", title: "Saturno Retrógrado · Lecturas",             chamber: "saturno",  scribe: "Cronos_Negro",  size: 4_500_000, mime: "application/pdf", ext: "pdf",  sealedAt: Date.now() - 86400000 * 6,  moonSeal: lunarSeal(new Date(Date.now() - 86400000 * 6)),  encrypted: true,  keyHint: "as above so below",     studyCount: 11, sigilSeed: "saturno-retro-lectura" },
];

/* ═══════════════════════════════════════════════════════════════
   Sub-componentes
═══════════════════════════════════════════════════════════════ */

function ChamberTab({ chamber, active, count, onSelect }) {
  const isActive = active === chamber.id;
  return (
    <button
      className="bh-chamber-tab"
      onClick={() => onSelect(chamber.id)}
      data-active={isActive}
      style={{
        "--bh-c": chamber.color,
        "--bh-glow": chamber.glow,
      }}
      title={chamber.desc}
    >
      <span className="bh-chamber-symbol" aria-hidden="true">{chamber.symbol}</span>
      <span className="bh-chamber-meta">
        <span className="bh-chamber-name">{chamber.name}</span>
        <span className="bh-chamber-count">{count} {count === 1 ? "manuscrito" : "manuscritos"}</span>
      </span>
    </button>
  );
}

function ManuscriptCard({ ms, onDownload, onRemove, isAdmin }) {
  const chamber = CHAMBER_BY_ID[ms.chamber] || CHAMBER_BY_ID.all;
  return (
    <article
      className="bh-card"
      style={{
        "--bh-c": chamber.color,
        "--bh-glow": chamber.glow,
      }}
    >
      <div className="bh-card-halo" aria-hidden="true" />

      <header className="bh-card-head">
        <div className="bh-sigil-wrap">
          <Sigil seed={ms.sigilSeed} color={chamber.color} size={84} />
          {ms.encrypted && (
            <span className="bh-sealed" title="Manuscrito sellado">
              <Lock size={11} strokeWidth={2.2} />
            </span>
          )}
        </div>
        <div className="bh-meta">
          <span className="bh-chamber-pill">
            <span aria-hidden="true">{chamber.symbol}</span>
            {chamber.name.replace("Cámara de ", "").replace("Cámara ", "")}
          </span>
          <h3 className="bh-title" title={ms.title}>{ms.title}</h3>
          <p className="bh-scribe">
            Escriba: <span>☽ {ms.scribe || "Anónimo"}</span>
          </p>
        </div>
      </header>

      <dl className="bh-stats">
        <div><dt>Sellado</dt><dd>{ms.moonSeal}</dd></div>
        <div><dt>Tamaño</dt><dd>{formatSize(ms.size)} · {(ms.ext || "?").toUpperCase()}</dd></div>
        <div><dt>Estudiantes</dt><dd>{ms.studyCount ?? 0}</dd></div>
      </dl>

      {ms.encrypted && ms.keyHint && (
        <div className="bh-hint">
          <KeyRound size={11} strokeWidth={2} />
          <span>Pista: <em>«{ms.keyHint}»</em></span>
        </div>
      )}

      <div className="bh-actions">
        <button
          className="bh-btn-primary"
          onClick={() => onDownload(ms)}
          title={ms.encrypted ? "Descifrar y descargar" : "Descargar"}
        >
          {ms.encrypted ? <Unlock size={13} strokeWidth={2.1} /> : <Download size={13} strokeWidth={2.1} />}
          <span>{ms.encrypted ? "Descifrar" : "Descargar"}</span>
        </button>
        {isAdmin && !ms.id?.startsWith("seed-") && (
          <button className="bh-btn-ghost" onClick={() => onRemove(ms)} title="Eliminar manuscrito">
            <Trash2 size={13} strokeWidth={2} />
          </button>
        )}
      </div>
    </article>
  );
}

function UploadAltar({ chamber, onAdd }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [encrypt, setEncrypt] = useState(false);
  const [pass, setPass] = useState("");
  const [hint, setHint] = useState("");
  const [scribe, setScribe] = useState(() => localStorage.getItem("bh-scribe") || "");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pendingFiles, setPendingFiles] = useState(null);

  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setPendingFiles(Array.from(fileList));
  };

  const seal = async () => {
    if (!pendingFiles) return;
    if (encrypt && !pass) { window.alert("Introduce una frase-llave para sellar."); return; }
    setBusy(true);
    try {
      localStorage.setItem("bh-scribe", scribe || "");
      const items = [];
      for (const f of pendingFiles) {
        let blob = f;
        if (encrypt && pass) blob = await encryptBlob(f, pass);
        const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const blobKey = `blob_${id}`;
        await dbPut(blobKey, blob);
        items.push({
          id,
          title: f.name.replace(/\.[a-z0-9]+$/i, ""),
          chamber: chamber === "all" ? "solar" : chamber,
          scribe: scribe || "Anónimo",
          size: f.size,
          mime: f.type || "application/octet-stream",
          ext: getExt(f.name),
          sealedAt: Date.now(),
          moonSeal: lunarSeal(),
          encrypted: !!encrypt,
          keyHint: encrypt ? hint : "",
          studyCount: 0,
          sigilSeed: hashString(`${f.name}_${f.size}_${Date.now()}`),
          blobKey,
          originalName: f.name,
        });
      }
      onAdd(items);
      setPendingFiles(null);
      setPass(""); setHint(""); setEncrypt(false);
    } catch (e) {
      console.error(e);
      window.alert("Error al sellar el manuscrito.");
    } finally {
      setBusy(false);
    }
  };

  if (pendingFiles) {
    return (
      <div className="bh-altar bh-altar-confirm">
        <div className="bh-altar-confirm-head">
          <Sparkles size={14} />
          <span>Sellar {pendingFiles.length} {pendingFiles.length === 1 ? "manuscrito" : "manuscritos"}</span>
        </div>
        <div className="bh-altar-files">
          {pendingFiles.map((f, i) => (
            <div key={i} className="bh-altar-file">
              <span>{f.name}</span><em>{formatSize(f.size)}</em>
            </div>
          ))}
        </div>
        <div className="bh-altar-row">
          <label>Escriba</label>
          <input
            value={scribe}
            onChange={(e) => setScribe(e.target.value)}
            placeholder="Tu nombre iniciático"
            className="bh-input"
          />
        </div>
        <label className="bh-altar-toggle">
          <input type="checkbox" checked={encrypt} onChange={(e) => setEncrypt(e.target.checked)} />
          <span><Lock size={11} /> Sellar con frase-llave (AES-GCM)</span>
        </label>
        {encrypt && (
          <>
            <div className="bh-altar-row">
              <label>Frase-llave</label>
              <div className="bh-pass-wrap">
                <input
                  type={showPass ? "text" : "password"}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="el ciclo retorna"
                  className="bh-input"
                />
                <button type="button" className="bh-pass-eye" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>
            </div>
            <div className="bh-altar-row">
              <label>Pista (opcional)</label>
              <input
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="lo que rima con luna..."
                className="bh-input"
              />
            </div>
          </>
        )}
        <div className="bh-altar-actions">
          <button className="bh-btn-ghost" onClick={() => setPendingFiles(null)} disabled={busy}>Cancelar</button>
          <button className="bh-btn-primary" onClick={seal} disabled={busy}>
            <Sparkles size={13} />
            <span>{busy ? "Sellando…" : (encrypt ? "Sellar y cifrar" : "Sellar")}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bh-altar${drag ? " bh-drag" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
    >
      <UploadCloud size={26} strokeWidth={1.4} />
      <div className="bh-altar-title">Depositar manuscrito en el altar</div>
      <div className="bh-altar-sub">Arrastra archivos o haz clic · PDF · EPUB · MP3 · MP4 · ZIP</div>
      <div className="bh-altar-mini">El acto de subir es un acto de sellado</div>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}

function DecryptDialog({ open, ms, onClose, onConfirm }) {
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);
  useEffect(() => { if (open) { setPass(""); setError(""); setShowPass(false); } }, [open]);
  if (!open || !ms) return null;
  const submit = async () => {
    setBusy(true); setError("");
    try { await onConfirm(pass); } catch (e) { setError("Frase incorrecta. El sello permanece."); }
    finally { setBusy(false); }
  };
  return (
    <div className="bh-dialog-backdrop" onClick={onClose}>
      <div className="bh-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="bh-dialog-head">
          <Lock size={14} />
          <span>Manuscrito sellado</span>
        </div>
        <h4 className="bh-dialog-title">{ms.title}</h4>
        {ms.keyHint && (
          <div className="bh-hint" style={{ margin: "0 0 12px" }}>
            <KeyRound size={11} />
            <span>Pista: <em>«{ms.keyHint}»</em></span>
          </div>
        )}
        <div className="bh-pass-wrap" style={{ marginBottom: 8 }}>
          <input
            autoFocus
            type={showPass ? "text" : "password"}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="Frase-llave"
            className="bh-input"
          />
          <button type="button" className="bh-pass-eye" onClick={() => setShowPass(!showPass)}>
            {showPass ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        </div>
        {error && <div className="bh-error">{error}</div>}
        <div className="bh-altar-actions">
          <button className="bh-btn-ghost" onClick={onClose} disabled={busy}>Cancelar</button>
          <button className="bh-btn-primary" onClick={submit} disabled={busy || !pass}>
            <Unlock size={13} />
            <span>{busy ? "Descifrando…" : "Descifrar"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT PRINCIPAL
═══════════════════════════════════════════════════════════════ */

const STORAGE_KEY = "bh-manuscripts-v1";

export default function BibliothecaHermetica({ admin = true }) {
  const [chamber, setChamber] = useState("all");
  const [query, setQuery] = useState("");
  const [manuscripts, setManuscripts] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return SEED;
  });
  const [decryptTarget, setDecryptTarget] = useState(null);
  const [sortilege, setSortilege] = useState(null);

  // Persist
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(manuscripts)); } catch {}
  }, [manuscripts]);

  const counts = useMemo(() => {
    const out = { all: manuscripts.length };
    for (const c of CHAMBERS) if (c.id !== "all") out[c.id] = 0;
    for (const m of manuscripts) if (out[m.chamber] != null) out[m.chamber]++;
    return out;
  }, [manuscripts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return manuscripts.filter((m) => {
      if (chamber !== "all" && m.chamber !== chamber) return false;
      if (!q) return true;
      return (m.title + " " + (m.scribe || "") + " " + (m.ext || "")).toLowerCase().includes(q);
    });
  }, [manuscripts, chamber, query]);

  const handleAdd = useCallback((items) => {
    setManuscripts((prev) => [...items, ...prev]);
  }, []);

  const handleRemove = useCallback(async (ms) => {
    if (!window.confirm(`¿Eliminar el manuscrito "${ms.title}"?`)) return;
    if (ms.blobKey) await dbDelete(ms.blobKey).catch(() => {});
    setManuscripts((prev) => prev.filter((x) => x.id !== ms.id));
  }, []);

  const incrementStudy = (id) => {
    setManuscripts((prev) => prev.map((m) => m.id === id ? { ...m, studyCount: (m.studyCount || 0) + 1 } : m));
  };

  const handleDownload = useCallback(async (ms) => {
    if (ms.encrypted) {
      setDecryptTarget(ms);
      return;
    }
    if (!ms.blobKey) {
      // Demo seed without real blob
      window.alert(`Códice de demostración: "${ms.title}"\nAún no hay un blob real depositado.`);
      return;
    }
    const blob = await dbGet(ms.blobKey);
    if (!blob) { window.alert("El manuscrito ha desaparecido del éter."); return; }
    downloadBlob(blob, ms.originalName || `${ms.title}.${ms.ext || "bin"}`);
    incrementStudy(ms.id);
  }, []);

  const confirmDecrypt = useCallback(async (passphrase) => {
    if (!decryptTarget) return;
    if (!decryptTarget.blobKey) { window.alert("Códice de demostración — sin blob cifrado real."); setDecryptTarget(null); return; }
    const blob = await dbGet(decryptTarget.blobKey);
    if (!blob) throw new Error("missing");
    const plain = await decryptBlob(blob, passphrase);
    downloadBlob(plain, decryptTarget.originalName || `${decryptTarget.title}.${decryptTarget.ext || "bin"}`);
    incrementStudy(decryptTarget.id);
    setDecryptTarget(null);
  }, [decryptTarget]);

  const castSortilege = () => {
    const pool = filtered.length ? filtered : manuscripts;
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setSortilege(pick.id);
    setQuery(""); setChamber(pick.chamber);
    setTimeout(() => setSortilege(null), 2400);
  };

  const totalStudies = useMemo(() => manuscripts.reduce((acc, m) => acc + (m.studyCount || 0), 0), [manuscripts]);
  const grade = useMemo(() => {
    if (totalStudies < 6) return { name: "Neófito", pct: totalStudies / 6 };
    if (totalStudies < 26) return { name: "Aprendiz", pct: (totalStudies - 6) / 20 };
    if (totalStudies < 101) return { name: "Adepto", pct: (totalStudies - 26) / 75 };
    if (totalStudies < 501) return { name: "Maestro", pct: (totalStudies - 101) / 400 };
    return { name: "Hierofante", pct: 1 };
  }, [totalStudies]);

  const activeChamber = CHAMBER_BY_ID[chamber] || CHAMBERS[0];

  return (
    <>
      <style>{STYLES}</style>
      <section className="bh-root" aria-label="Bibliotheca Hermetica">
        {/* ── Cabecera ────────────────────────── */}
        <header className="bh-header">
          <div className="bh-header-inner">
            <div className="bh-eyebrow">
              <span className="bh-orna">✦</span>
              <span>Bibliotheca Hermetica</span>
              <span className="bh-orna">✦</span>
            </div>
            <h2 className="bh-h">El Códice de Alejandría</h2>
            <p className="bh-sub">
              <em>"El conocimiento no se da, se descifra."</em>
            </p>
          </div>
          <div className="bh-grade">
            <div className="bh-grade-ring" style={{ "--p": grade.pct }}>
              <span className="bh-grade-symbol">☥</span>
            </div>
            <div className="bh-grade-meta">
              <span className="bh-grade-name">{grade.name}</span>
              <span className="bh-grade-count">{totalStudies} estudio{totalStudies === 1 ? "" : "s"}</span>
            </div>
          </div>
        </header>

        {/* ── Cámaras ─────────────────────────── */}
        <div className="bh-chambers">
          {CHAMBERS.map((c) => (
            <ChamberTab key={c.id} chamber={c} active={chamber} count={counts[c.id] ?? 0} onSelect={setChamber} />
          ))}
        </div>

        {/* ── Búsqueda + Sortilegio ───────────── */}
        <div className="bh-search-bar">
          <label className="bh-search">
            <Search size={14} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Buscar en ${activeChamber.name}…`}
            />
          </label>
          <button className="bh-sortilege" onClick={castSortilege} title="Que el cosmos elija">
            <Shuffle size={13} />
            <span>Sortilegio</span>
          </button>
        </div>

        {/* ── Cámara activa info ──────────────── */}
        <div className="bh-chamber-banner" style={{ "--bh-c": activeChamber.color, "--bh-glow": activeChamber.glow }}>
          <span className="bh-chamber-banner-symbol">{activeChamber.symbol}</span>
          <div>
            <div className="bh-chamber-banner-name">{activeChamber.name}</div>
            <div className="bh-chamber-banner-desc">{activeChamber.desc}</div>
          </div>
          <div className="bh-chamber-banner-count">{filtered.length}</div>
        </div>

        {/* ── Grid de manuscritos ─────────────── */}
        {filtered.length === 0 ? (
          <div className="bh-empty">
            <ScrollText size={36} strokeWidth={1.2} />
            <p>{query ? "Ningún manuscrito coincide con tu búsqueda." : "Esta cámara aguarda sus primeros códices."}</p>
          </div>
        ) : (
          <div className="bh-grid">
            {filtered.map((ms) => (
              <div key={ms.id} className={`bh-cell${sortilege === ms.id ? " bh-pick" : ""}`}>
                <ManuscriptCard ms={ms} onDownload={handleDownload} onRemove={handleRemove} isAdmin={admin} />
              </div>
            ))}
          </div>
        )}

        {/* ── Altar de subida ─────────────────── */}
        {admin && (
          <div className="bh-altar-wrap">
            <UploadAltar chamber={chamber} onAdd={handleAdd} />
          </div>
        )}

        <footer className="bh-footer">
          <span>✦ Sellos de Salomón generados por hash · AES-GCM con PBKDF2 · Almacenamiento local en IndexedDB</span>
        </footer>
      </section>

      <DecryptDialog
        open={!!decryptTarget}
        ms={decryptTarget}
        onClose={() => setDecryptTarget(null)}
        onConfirm={confirmDecrypt}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════ */

const STYLES = `
.bh-root{
  --bh-ink:#f5f5f7;
  --bh-ink-2:rgba(245,245,247,0.62);
  --bh-ink-3:rgba(245,245,247,0.42);
  --bh-edge:rgba(255,255,255,0.06);
  --bh-violet:#c084fc;
  position:relative;
  width:100%;
  border-radius:24px;
  background:
    radial-gradient(ellipse 80% 50% at 50% 0%, rgba(168,85,247,0.10) 0%, transparent 60%),
    rgba(8,4,22,0.72);
  border:1px solid rgba(168,85,247,0.14);
  backdrop-filter:blur(28px) saturate(160%);
  -webkit-backdrop-filter:blur(28px) saturate(160%);
  padding:32px 28px 26px;
  color:var(--bh-ink);
  font-family:-apple-system,"SF Pro Display","Inter",system-ui,sans-serif;
  letter-spacing:-0.011em;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.06),
    0 40px 100px -30px rgba(88,28,135,0.5);
}

/* HEADER */
.bh-header{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;flex-wrap:wrap;margin-bottom:22px}
.bh-header-inner{flex:1;min-width:0}
.bh-eyebrow{
  display:flex;align-items:center;gap:10px;
  font-size:11px;letter-spacing:0.32em;text-transform:uppercase;
  color:var(--bh-ink-2);font-weight:500;font-family:"Cinzel",serif;
}
.bh-orna{color:var(--bh-violet);text-shadow:0 0 12px rgba(192,132,252,0.6);font-size:13px}
.bh-h{
  font-family:"Cinzel",serif;
  font-size:30px;font-weight:600;letter-spacing:-0.012em;line-height:1.05;
  margin-top:8px;color:#f3e8ff;
  text-shadow:0 0 30px rgba(168,85,247,0.25);
}
.bh-sub{font-size:13px;color:var(--bh-ink-2);margin-top:6px;font-style:italic}
.bh-sub em{color:#d8b4fe}

/* GRADE RING */
.bh-grade{display:flex;align-items:center;gap:14px}
.bh-grade-ring{
  width:64px;height:64px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  background:
    conic-gradient(rgba(192,132,252,0.85) calc(var(--p) * 360deg), rgba(255,255,255,0.06) 0);
  position:relative;
  box-shadow:0 0 24px rgba(168,85,247,0.25);
}
.bh-grade-ring::after{
  content:"";position:absolute;inset:5px;border-radius:50%;
  background:rgba(8,4,22,0.96);
  border:0.5px solid rgba(216,180,254,0.18);
}
.bh-grade-symbol{position:relative;font-size:22px;color:#d8b4fe;text-shadow:0 0 10px rgba(192,132,252,0.7)}
.bh-grade-meta{display:flex;flex-direction:column}
.bh-grade-name{font-size:13px;font-weight:600;letter-spacing:0.06em;color:var(--bh-ink);text-transform:uppercase;font-family:"Cinzel",serif}
.bh-grade-count{font-size:11px;color:var(--bh-ink-3);margin-top:2px}

/* CHAMBERS */
.bh-chambers{
  display:flex;gap:8px;overflow-x:auto;padding:4px 2px 12px;
  scrollbar-width:thin;scrollbar-color:rgba(192,132,252,0.25) transparent;
  margin-bottom:14px;
}
.bh-chambers::-webkit-scrollbar{height:6px}
.bh-chambers::-webkit-scrollbar-thumb{background:rgba(192,132,252,0.18);border-radius:99px}
.bh-chamber-tab{
  flex:0 0 auto;
  display:flex;align-items:center;gap:10px;
  padding:9px 14px;border-radius:12px;
  background:rgba(255,255,255,0.025);
  border:0.5px solid var(--bh-edge);
  color:var(--bh-ink-2);
  cursor:pointer;
  transition:background 0.2s, border-color 0.2s, color 0.2s, transform 0.2s;
  font:inherit;
}
.bh-chamber-tab:hover{background:rgba(255,255,255,0.05);transform:translateY(-1px)}
.bh-chamber-tab[data-active="true"]{
  background:rgba(var(--bh-glow),0.10);
  border-color:rgba(var(--bh-glow),0.45);
  color:var(--bh-c);
  box-shadow:0 0 18px rgba(var(--bh-glow),0.18), inset 0 0 0 0.5px rgba(var(--bh-glow),0.25);
}
.bh-chamber-symbol{
  font-size:18px;line-height:1;color:var(--bh-c);
  text-shadow:0 0 8px rgba(var(--bh-glow),0.6);
}
.bh-chamber-meta{display:flex;flex-direction:column;line-height:1.15;text-align:left}
.bh-chamber-name{font-size:12px;font-weight:600;letter-spacing:0.04em}
.bh-chamber-count{font-size:10px;color:var(--bh-ink-3);margin-top:1px;letter-spacing:0.02em}

/* SEARCH BAR */
.bh-search-bar{display:flex;gap:10px;margin-bottom:14px}
.bh-search{
  flex:1;display:flex;align-items:center;gap:10px;
  background:rgba(255,255,255,0.04);
  border:1px solid transparent;border-radius:12px;
  padding:10px 14px;
  transition:border-color 0.25s, background 0.25s, box-shadow 0.25s;
}
.bh-search:focus-within{
  border-color:rgba(192,132,252,0.4);
  background:rgba(255,255,255,0.06);
  box-shadow:0 0 0 3px rgba(192,132,252,0.10), 0 0 16px rgba(192,132,252,0.12);
}
.bh-search svg{color:var(--bh-ink-3);flex-shrink:0}
.bh-search input{flex:1;background:transparent;border:none;outline:none;color:var(--bh-ink);font:inherit;font-size:13px}
.bh-search input::placeholder{color:var(--bh-ink-3)}
.bh-sortilege{
  display:flex;align-items:center;gap:7px;
  padding:10px 14px;border-radius:12px;
  background:linear-gradient(135deg, rgba(192,132,252,0.18), rgba(99,102,241,0.12));
  border:1px solid rgba(192,132,252,0.32);
  color:#e9d5ff;cursor:pointer;font:inherit;font-size:12px;font-weight:600;letter-spacing:0.04em;
  transition:transform 0.2s, box-shadow 0.2s;
}
.bh-sortilege:hover{transform:translateY(-1px);box-shadow:0 6px 22px rgba(168,85,247,0.3)}
.bh-sortilege:active{transform:translateY(0)}

/* CHAMBER BANNER */
.bh-chamber-banner{
  display:flex;align-items:center;gap:14px;
  padding:14px 18px;border-radius:14px;
  background:linear-gradient(135deg, rgba(var(--bh-glow),0.10), rgba(var(--bh-glow),0.02));
  border:0.5px solid rgba(var(--bh-glow),0.22);
  margin-bottom:18px;
}
.bh-chamber-banner-symbol{font-size:30px;color:var(--bh-c);text-shadow:0 0 18px rgba(var(--bh-glow),0.7);line-height:1}
.bh-chamber-banner-name{font-family:"Cinzel",serif;font-size:15px;font-weight:600;color:var(--bh-c);letter-spacing:0.04em}
.bh-chamber-banner-desc{font-size:11px;color:var(--bh-ink-2);margin-top:2px;letter-spacing:0.02em}
.bh-chamber-banner-count{
  margin-left:auto;
  font-family:"Cinzel",serif;font-size:22px;color:var(--bh-c);
  text-shadow:0 0 12px rgba(var(--bh-glow),0.5);
}

/* GRID */
.bh-grid{
  display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));
  gap:16px;margin-bottom:24px;
}
.bh-cell{animation:bhItemIn 0.5s cubic-bezier(0.16,1,0.3,1) both}
.bh-cell:nth-child(2){animation-delay:60ms}
.bh-cell:nth-child(3){animation-delay:120ms}
.bh-cell:nth-child(4){animation-delay:180ms}
.bh-cell:nth-child(5){animation-delay:240ms}
.bh-cell:nth-child(6){animation-delay:300ms}
@keyframes bhItemIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.bh-pick{animation:bhPick 2s cubic-bezier(0.16,1,0.3,1)}
@keyframes bhPick{
  0%{transform:scale(1)}
  20%{transform:scale(1.04);filter:drop-shadow(0 0 24px rgba(192,132,252,0.7))}
  100%{transform:scale(1);filter:none}
}

/* CARD */
.bh-card{
  position:relative;
  display:flex;flex-direction:column;
  padding:18px;
  border-radius:16px;
  background:linear-gradient(180deg, rgba(20,12,40,0.85) 0%, rgba(8,4,22,0.85) 100%);
  border:0.5px solid rgba(var(--bh-glow),0.18);
  overflow:hidden;
  transition:transform 0.3s cubic-bezier(0.16,1,0.3,1), border-color 0.3s, box-shadow 0.3s;
}
.bh-card:hover{
  transform:translateY(-3px);
  border-color:rgba(var(--bh-glow),0.4);
  box-shadow:0 18px 40px -12px rgba(var(--bh-glow),0.32), 0 0 0 0.5px rgba(var(--bh-glow),0.3);
}
.bh-card-halo{
  position:absolute;inset:-30px -30px auto -30px;height:120px;
  background:radial-gradient(ellipse at center top, rgba(var(--bh-glow),0.16) 0%, transparent 60%);
  filter:blur(20px);pointer-events:none;
  opacity:0.6;transition:opacity 0.3s;
}
.bh-card:hover .bh-card-halo{opacity:1}

.bh-card-head{display:flex;gap:14px;align-items:flex-start;margin-bottom:14px;position:relative;z-index:1}
.bh-sigil-wrap{position:relative;flex-shrink:0;width:84px;height:84px}
.bh-sealed{
  position:absolute;bottom:-2px;right:-2px;
  width:20px;height:20px;border-radius:50%;
  background:rgba(8,4,22,0.95);
  border:1px solid rgba(var(--bh-glow),0.5);
  display:flex;align-items:center;justify-content:center;
  color:var(--bh-c);
  box-shadow:0 0 10px rgba(var(--bh-glow),0.5);
}
.bh-meta{flex:1;min-width:0}
.bh-chamber-pill{
  display:inline-flex;align-items:center;gap:5px;
  font-size:9.5px;letter-spacing:0.18em;text-transform:uppercase;font-weight:600;
  color:var(--bh-c);
  padding:3px 8px;border-radius:99px;
  background:rgba(var(--bh-glow),0.10);
  border:0.5px solid rgba(var(--bh-glow),0.25);
  margin-bottom:6px;
}
.bh-title{
  font-family:"Cinzel",serif;
  font-size:14.5px;font-weight:600;line-height:1.25;color:var(--bh-ink);
  letter-spacing:-0.005em;
  margin:0 0 4px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
}
.bh-scribe{font-size:11px;color:var(--bh-ink-2);margin:0;letter-spacing:0.01em}
.bh-scribe span{color:#d8b4fe}

.bh-stats{
  display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;
  margin:0 0 12px;padding:10px 0 0;
  border-top:0.5px solid var(--bh-edge);
  position:relative;z-index:1;
}
.bh-stats > div{display:flex;flex-direction:column}
.bh-stats dt{font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:var(--bh-ink-3);font-weight:500;margin-bottom:3px}
.bh-stats dd{font-size:11.5px;color:var(--bh-ink);margin:0;font-weight:500;letter-spacing:-0.005em}

.bh-hint{
  display:flex;align-items:center;gap:6px;
  font-size:10.5px;color:var(--bh-ink-2);
  padding:7px 10px;border-radius:8px;
  background:rgba(192,132,252,0.06);
  border:0.5px dashed rgba(192,132,252,0.25);
  margin-bottom:10px;
  position:relative;z-index:1;
}
.bh-hint em{color:#d8b4fe;font-style:italic;letter-spacing:0.02em}

.bh-actions{display:flex;gap:8px;position:relative;z-index:1}
.bh-btn-primary{
  flex:1;
  display:flex;align-items:center;justify-content:center;gap:6px;
  padding:9px 12px;border-radius:9px;
  background:linear-gradient(135deg, rgba(var(--bh-glow),0.22), rgba(var(--bh-glow),0.10));
  border:0.5px solid rgba(var(--bh-glow),0.45);
  color:var(--bh-c);
  font:inherit;font-size:12px;font-weight:600;letter-spacing:0.04em;
  cursor:pointer;
  transition:transform 0.2s, box-shadow 0.2s, background 0.2s;
}
.bh-btn-primary:hover{
  transform:translateY(-1px);
  background:linear-gradient(135deg, rgba(var(--bh-glow),0.32), rgba(var(--bh-glow),0.16));
  box-shadow:0 6px 18px rgba(var(--bh-glow),0.32);
}
.bh-btn-primary:active{transform:translateY(0)}
.bh-btn-primary:disabled{opacity:0.5;cursor:wait}
.bh-btn-ghost{
  display:flex;align-items:center;justify-content:center;
  width:34px;
  border-radius:9px;
  background:transparent;
  border:0.5px solid rgba(255,255,255,0.08);
  color:var(--bh-ink-2);cursor:pointer;
  transition:background 0.2s, color 0.2s, border-color 0.2s;
}
.bh-btn-ghost:hover{background:rgba(239,68,68,0.10);color:#fca5a5;border-color:rgba(239,68,68,0.35)}

/* ALTAR */
.bh-altar-wrap{margin-top:8px;margin-bottom:18px}
.bh-altar{
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;
  padding:26px;
  border:1px dashed rgba(192,132,252,0.32);
  background:linear-gradient(180deg, rgba(192,132,252,0.05) 0%, rgba(99,102,241,0.03) 100%);
  border-radius:16px;
  color:var(--bh-ink-2);text-align:center;cursor:pointer;
  transition:background 0.25s, border-color 0.25s;
}
.bh-altar:hover,.bh-altar.bh-drag{background:rgba(192,132,252,0.10);border-color:rgba(192,132,252,0.55);color:var(--bh-ink)}
.bh-altar svg{color:var(--bh-violet)}
.bh-altar-title{font-family:"Cinzel",serif;font-size:14px;font-weight:600;letter-spacing:0.04em;color:#e9d5ff;margin-top:4px}
.bh-altar-sub{font-size:11.5px;color:var(--bh-ink-3)}
.bh-altar-mini{font-size:10.5px;color:var(--bh-ink-3);font-style:italic;margin-top:6px;letter-spacing:0.02em}

.bh-altar-confirm{cursor:default;align-items:stretch;gap:14px;text-align:left}
.bh-altar-confirm-head{display:flex;align-items:center;gap:8px;font-family:"Cinzel",serif;font-size:13px;font-weight:600;color:#e9d5ff;letter-spacing:0.06em}
.bh-altar-files{display:flex;flex-direction:column;gap:6px;max-height:140px;overflow-y:auto}
.bh-altar-file{display:flex;justify-content:space-between;font-size:11.5px;padding:6px 10px;background:rgba(255,255,255,0.03);border-radius:7px;color:var(--bh-ink)}
.bh-altar-file em{color:var(--bh-ink-3);font-style:normal}
.bh-altar-row{display:flex;flex-direction:column;gap:6px}
.bh-altar-row label{font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:var(--bh-ink-3);font-weight:500}
.bh-input{
  background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
  border-radius:9px;padding:9px 12px;
  color:var(--bh-ink);font:inherit;font-size:12.5px;outline:none;
  transition:border-color 0.2s, background 0.2s, box-shadow 0.2s;
}
.bh-input:focus{border-color:rgba(192,132,252,0.5);background:rgba(255,255,255,0.06);box-shadow:0 0 0 3px rgba(192,132,252,0.1)}
.bh-altar-toggle{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--bh-ink-2);cursor:pointer;letter-spacing:0.01em}
.bh-altar-toggle input{accent-color:var(--bh-violet)}
.bh-altar-toggle span{display:flex;align-items:center;gap:6px}
.bh-pass-wrap{position:relative;display:flex;align-items:center}
.bh-pass-wrap .bh-input{flex:1;padding-right:32px}
.bh-pass-eye{position:absolute;right:8px;background:transparent;border:none;color:var(--bh-ink-3);cursor:pointer;padding:4px;display:flex}
.bh-pass-eye:hover{color:var(--bh-ink)}
.bh-altar-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:6px}

/* DIALOG */
.bh-dialog-backdrop{
  position:fixed;inset:0;z-index:200;
  display:flex;align-items:center;justify-content:center;padding:24px;
  background:rgba(5,2,18,0.78);backdrop-filter:blur(10px);
  animation:bhFade 0.25s ease;
}
@keyframes bhFade{from{opacity:0}to{opacity:1}}
.bh-dialog{
  width:100%;max-width:420px;
  padding:24px;border-radius:18px;
  background:linear-gradient(180deg, rgba(22,12,42,0.96), rgba(8,4,22,0.96));
  border:1px solid rgba(192,132,252,0.28);
  box-shadow:0 30px 80px -20px rgba(168,85,247,0.4);
  animation:bhPop 0.3s cubic-bezier(0.16,1,0.3,1);
}
@keyframes bhPop{from{opacity:0;transform:translateY(8px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
.bh-dialog-head{display:flex;align-items:center;gap:8px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:var(--bh-violet);font-weight:600;margin-bottom:10px;font-family:"Cinzel",serif}
.bh-dialog-title{font-family:"Cinzel",serif;font-size:18px;font-weight:600;color:#f3e8ff;margin:0 0 14px;letter-spacing:-0.005em;line-height:1.25}
.bh-error{font-size:11.5px;color:#fca5a5;background:rgba(239,68,68,0.08);border:0.5px solid rgba(239,68,68,0.25);padding:8px 10px;border-radius:8px;margin-bottom:10px}

/* EMPTY */
.bh-empty{
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;
  padding:60px 24px;color:var(--bh-ink-2);text-align:center;
}
.bh-empty svg{color:var(--bh-ink-3);opacity:0.6}
.bh-empty p{font-size:13px;max-width:320px;margin:0;line-height:1.5}

/* FOOTER */
.bh-footer{
  margin-top:8px;padding-top:14px;
  border-top:0.5px solid var(--bh-edge);
  font-size:10.5px;color:var(--bh-ink-3);letter-spacing:0.04em;text-align:center;
}

/* RESPONSIVE */
@media (max-width:760px){
  .bh-root{padding:22px 16px 18px;border-radius:18px}
  .bh-h{font-size:22px}
  .bh-grade{align-self:stretch;justify-content:flex-start}
  .bh-grid{grid-template-columns:1fr;gap:12px}
  .bh-search-bar{flex-direction:column}
  .bh-sortilege{justify-content:center}
  .bh-chamber-banner-count{font-size:18px}
}
@media (prefers-reduced-motion: reduce){
  .bh-root *,.bh-root *::before,.bh-root *::after{
    animation-duration:0.01ms!important;transition-duration:0.01ms!important;
  }
}
`;
