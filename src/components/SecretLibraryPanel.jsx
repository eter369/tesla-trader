import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Download,
  Check,
  FileText,
  BookOpen,
  Music,
  Video,
  Archive,
  File as FileIcon,
  UploadCloud,
  ScrollText,
} from "lucide-react";

/* ─── Styles ────────────────────────────────────────────── */
const STYLES = `
.sl-panel{
  --sl-ink:#f5f5f7;
  --sl-ink-2:rgba(245,245,247,0.56);
  --sl-ink-3:rgba(245,245,247,0.4);
  --sl-violet:#c084fc;
  --sl-edge:rgba(255,255,255,0.06);
  --sl-bg:rgba(15,10,30,0.55);
  position:relative;
  width:380px;flex:0 0 380px;
  border-radius:24px;overflow:hidden;
  background:var(--sl-bg);
  backdrop-filter:blur(40px) saturate(180%);
  -webkit-backdrop-filter:blur(40px) saturate(180%);
  border:1px solid rgba(168,85,247,0.12);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.05),
    0 30px 80px -20px rgba(88,28,135,0.45),
    0 0 0 0.5px rgba(216,180,254,0.08);
  color:var(--sl-ink);
  font-family:-apple-system,"SF Pro Display","Inter",system-ui,sans-serif;
  letter-spacing:-0.011em;
  display:flex;flex-direction:column;
  align-self:stretch;
}

.sl-glow{
  position:absolute;inset:-40px;z-index:0;pointer-events:none;
  background:radial-gradient(ellipse at 30% 20%, rgba(168,85,247,0.32) 0%, transparent 55%),
             radial-gradient(ellipse at 70% 80%, rgba(192,132,252,0.18) 0%, transparent 55%);
  filter:blur(80px);opacity:0.7;
  animation:slGlowDrift 8s ease-in-out infinite alternate;
}
@keyframes slGlowDrift{
  from{transform:translate(0,0) scale(1)}
  to  {transform:translate(8px,-6px) scale(1.06)}
}

.sl-particles{position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden}
.sl-particle{
  position:absolute;width:3px;height:3px;border-radius:50%;
  background:radial-gradient(circle,rgba(216,180,254,0.9),rgba(192,132,252,0));
  opacity:0.15;
  animation:slFloat var(--d,18s) ease-in-out infinite;
  filter:blur(0.5px);
}
@keyframes slFloat{
  0%,100%{transform:translate(0,0)}
  50%   {transform:translate(var(--mx,12px),var(--my,-18px))}
}

/* Header */
.sl-content{position:relative;z-index:2;display:flex;flex-direction:column;height:100%;min-height:0}
.sl-header{padding:24px 24px 16px}
.sl-eyebrow{
  display:flex;align-items:center;gap:6px;
  font-size:11px;letter-spacing:0.18em;text-transform:uppercase;
  color:var(--sl-ink-3);font-weight:500;margin-bottom:10px;
}
.sl-eyebrow::before{content:"◦";color:var(--sl-violet);font-size:13px}
.sl-title{
  font-size:22px;font-weight:600;letter-spacing:-0.022em;line-height:1.1;
  color:var(--sl-ink);
}
.sl-count{font-size:13px;color:var(--sl-ink-2);margin-top:4px;font-weight:400}

.sl-divider{
  height:0.5px;background:var(--sl-edge);
  margin:0 24px;
}

/* Search */
.sl-search-wrap{padding:12px 24px}
.sl-search{
  position:relative;
  display:flex;align-items:center;
  background:rgba(255,255,255,0.04);
  border:1px solid transparent;
  border-radius:10px;
  padding:8px 12px;
  transition:border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
}
.sl-search:focus-within{
  border-color:rgba(192,132,252,0.4);
  background:rgba(255,255,255,0.06);
  box-shadow:0 0 0 3px rgba(192,132,252,0.08), 0 0 14px rgba(192,132,252,0.12);
}
.sl-search svg{color:var(--sl-ink-3);flex-shrink:0}
.sl-search input{
  flex:1;background:transparent;border:none;outline:none;
  font:inherit;color:var(--sl-ink);
  font-size:13px;padding:0 10px;letter-spacing:-0.005em;
}
.sl-search input::placeholder{color:var(--sl-ink-3)}

/* List */
.sl-list{
  flex:1;min-height:0;overflow-y:auto;
  padding:6px 12px 12px;
  scrollbar-width:thin;
  scrollbar-color:rgba(192,132,252,0.25) transparent;
}
.sl-list::-webkit-scrollbar{width:6px}
.sl-list::-webkit-scrollbar-track{background:transparent}
.sl-list::-webkit-scrollbar-thumb{
  background:rgba(192,132,252,0.18);border-radius:99px;
}
.sl-list::-webkit-scrollbar-thumb:hover{background:rgba(192,132,252,0.32)}

.sl-item{
  position:relative;
  display:flex;align-items:center;gap:14px;
  padding:14px 12px;
  border-radius:12px;
  cursor:default;
  transition:background 0.2s ease;
  opacity:0;transform:translateY(8px);
  animation:slItemIn 0.5s cubic-bezier(0.16,1,0.3,1) forwards;
  overflow:hidden;
}
@keyframes slItemIn{to{opacity:1;transform:translateY(0)}}
.sl-item + .sl-item{
  margin-top:0;
  box-shadow:0 -0.5px 0 rgba(255,255,255,0.04);
}
.sl-item:hover{background:rgba(255,255,255,0.03)}

/* Hover sweep */
.sl-item::after{
  content:"";position:absolute;top:0;left:-30%;width:30%;height:100%;
  background:linear-gradient(90deg,transparent,rgba(192,132,252,0.18),transparent);
  pointer-events:none;opacity:0;transition:opacity 0.25s ease;
}
.sl-item:hover::after{opacity:1;animation:slSweep 0.4s ease forwards}
@keyframes slSweep{from{left:-30%}to{left:130%}}

.sl-icon{
  width:32px;height:32px;border-radius:8px;
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;
  background:var(--sl-icon-bg,rgba(255,255,255,0.04));
  color:var(--sl-icon-color,var(--sl-ink-2));
  border:0.5px solid var(--sl-icon-border,rgba(255,255,255,0.04));
}

.sl-meta{min-width:0;flex:1}
.sl-name{
  font-size:14px;font-weight:500;color:var(--sl-ink);
  letter-spacing:-0.005em;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.sl-sub{
  font-size:12px;color:var(--sl-ink-2);font-weight:400;
  margin-top:2px;letter-spacing:0;
}

.sl-dl{
  width:32px;height:32px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  background:transparent;
  border:1px solid rgba(255,255,255,0.08);
  color:var(--sl-ink-2);
  cursor:pointer;flex-shrink:0;
  transition:background 0.2s ease, color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}
.sl-dl:hover{
  background:rgba(192,132,252,0.18);
  border-color:rgba(192,132,252,0.5);
  color:var(--sl-violet);
  animation:slDlPulse 1.4s ease-in-out infinite;
}
.sl-dl:active{transform:scale(0.94)}
.sl-dl.sl-done{background:rgba(192,132,252,0.2);color:var(--sl-violet);border-color:rgba(192,132,252,0.45)}
@keyframes slDlPulse{
  0%,100%{box-shadow:0 0 0 0 rgba(192,132,252,0.35)}
  50%   {box-shadow:0 0 0 6px rgba(192,132,252,0)}
}

/* Empty state */
.sl-empty{
  flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:40px 24px;color:var(--sl-ink-2);gap:14px;
}
.sl-empty svg{color:var(--sl-ink-3);opacity:0.6}
.sl-empty p{font-size:13px;font-weight:400;letter-spacing:-0.005em;line-height:1.45;max-width:240px}

/* Upload zone */
.sl-upload-wrap{padding:8px 16px 14px}
.sl-upload{
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
  padding:18px;
  border:1px dashed rgba(192,132,252,0.28);
  background:rgba(192,132,252,0.04);
  border-radius:14px;
  color:var(--sl-ink-2);
  text-align:center;
  cursor:pointer;
  transition:background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}
.sl-upload:hover,.sl-upload.sl-drag{
  background:rgba(192,132,252,0.08);border-color:rgba(192,132,252,0.5);color:var(--sl-ink);
}
.sl-upload svg{color:var(--sl-violet);opacity:0.8}
.sl-upload-text{font-size:12.5px;font-weight:500;letter-spacing:-0.005em}
.sl-upload-sub{font-size:11px;color:var(--sl-ink-3);font-weight:400}

/* Footer */
.sl-footer{
  padding:14px 24px 18px;
  display:flex;align-items:center;justify-content:space-between;gap:10px;
  border-top:0.5px solid var(--sl-edge);
}
.sl-tag{font-size:11px;color:var(--sl-ink-2);letter-spacing:0.02em;display:flex;align-items:center;gap:6px}
.sl-tag::before{content:"✦";color:var(--sl-violet);font-size:11px}
.sl-status{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--sl-ink-2);letter-spacing:0.02em}
.sl-dot{
  width:6px;height:6px;border-radius:50%;background:var(--sl-violet);
  box-shadow:0 0 8px rgba(192,132,252,0.7);
  animation:slDotPulse 2s ease-in-out infinite;
}
@keyframes slDotPulse{
  0%,100%{opacity:0.6;transform:scale(1)}
  50%   {opacity:1;transform:scale(1.25)}
}

/* Responsive — stack inside the modal below ~1024px */
@media (max-width:1024px){
  .sl-panel{width:100%;flex:0 0 auto;max-height:55vh}
}
@media (prefers-reduced-motion: reduce){
  .sl-panel *,.sl-panel *::before,.sl-panel *::after{
    animation-duration:0.01ms!important;animation-iteration-count:1!important;transition-duration:0.01ms!important;
  }
}
`;

/* ─── Helpers ───────────────────────────────────────────── */

const ICON_BY_EXT = {
  pdf:  { Comp: FileText,  color: "#ef4444", bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.20)" },
  epub: { Comp: BookOpen,  color: "#a855f7", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.22)" },
  mobi: { Comp: BookOpen,  color: "#a855f7", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.22)" },
  mp3:  { Comp: Music,     color: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.20)" },
  wav:  { Comp: Music,     color: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.20)" },
  m4a:  { Comp: Music,     color: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.20)" },
  mp4:  { Comp: Video,     color: "#3b82f6", bg: "rgba(59,130,246,0.10)", border: "rgba(59,130,246,0.20)" },
  mov:  { Comp: Video,     color: "#3b82f6", bg: "rgba(59,130,246,0.10)", border: "rgba(59,130,246,0.20)" },
  webm: { Comp: Video,     color: "#3b82f6", bg: "rgba(59,130,246,0.10)", border: "rgba(59,130,246,0.20)" },
  zip:  { Comp: Archive,   color: "#9ca3af", bg: "rgba(156,163,175,0.10)", border: "rgba(156,163,175,0.20)" },
  rar:  { Comp: Archive,   color: "#9ca3af", bg: "rgba(156,163,175,0.10)", border: "rgba(156,163,175,0.20)" },
};

function getExt(name) {
  const m = /\.([a-z0-9]+)$/i.exec(name || "");
  return m ? m[1].toLowerCase() : "";
}
function iconConfig(name) {
  return ICON_BY_EXT[getExt(name)] || { Comp: FileIcon, color: "#9ca3af", bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.06)" };
}
function formatSize(bytes) {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}
function relativeTime(ts) {
  const diff = Date.now() - ts;
  const m = Math.round(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `hace ${d} día${d === 1 ? "" : "s"}`;
  const mo = Math.round(d / 30);
  return `hace ${mo} mes${mo === 1 ? "" : "es"}`;
}

/* ─── Sub-components ────────────────────────────────────── */

function LibraryHeader({ count }) {
  return (
    <div className="sl-header">
      <div className="sl-eyebrow">Biblioteca Secreta</div>
      <div className="sl-title">Archivos</div>
      <div className="sl-count">{count} {count === 1 ? "documento" : "documentos"}</div>
    </div>
  );
}

function LibrarySearch({ value, onChange }) {
  return (
    <div className="sl-search-wrap">
      <label className="sl-search">
        <Search size={14} strokeWidth={2} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar en la biblioteca…"
          aria-label="Buscar archivos"
        />
      </label>
    </div>
  );
}

function FileItem({ file, index, onDownload }) {
  const [done, setDone] = useState(false);
  const cfg = iconConfig(file.name);
  const Icon = cfg.Comp;

  const handleClick = () => {
    onDownload(file);
    setDone(true);
    window.setTimeout(() => setDone(false), 1600);
  };

  const ext = getExt(file.name).toUpperCase() || "ARCHIVO";

  return (
    <div
      className="sl-item"
      style={{ animationDelay: `${Math.min(index, 12) * 50}ms` }}
    >
      <div
        className="sl-icon"
        style={{
          "--sl-icon-bg": cfg.bg,
          "--sl-icon-color": cfg.color,
          "--sl-icon-border": cfg.border,
        }}
      >
        <Icon size={16} strokeWidth={1.75} />
      </div>
      <div className="sl-meta">
        <div className="sl-name" title={file.name}>{file.name}</div>
        <div className="sl-sub">{ext} · {formatSize(file.size)} · {relativeTime(file.uploadedAt)}</div>
      </div>
      <button
        className={`sl-dl${done ? " sl-done" : ""}`}
        onClick={handleClick}
        aria-label={`Descargar ${file.name}`}
        title="Descargar"
      >
        {done ? <Check size={14} strokeWidth={2.25} /> : <Download size={14} strokeWidth={2} />}
      </button>
    </div>
  );
}

function UploadZone({ onAdd }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const handleFiles = useCallback((fileList) => {
    if (!fileList || fileList.length === 0) return;
    const items = Array.from(fileList).map((f) => ({
      id: `${Date.now()}_${f.name}_${Math.random().toString(36).slice(2, 8)}`,
      name: f.name,
      size: f.size,
      uploadedAt: Date.now(),
      url: URL.createObjectURL(f),
    }));
    onAdd(items);
  }, [onAdd]);

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="sl-upload-wrap">
      <div
        className={`sl-upload${drag ? " sl-drag" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
      >
        <UploadCloud size={20} strokeWidth={1.5} />
        <div className="sl-upload-text">Arrastra archivos o haz clic</div>
        <div className="sl-upload-sub">PDF · EPUB · MP3 · MP4 · ZIP</div>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
        />
      </div>
    </div>
  );
}

function LibraryFooter() {
  return (
    <div className="sl-footer">
      <span className="sl-tag">Actualizado en tiempo lunar</span>
      <span className="sl-status"><span className="sl-dot" /> Sincronizado</span>
    </div>
  );
}

/* ─── Demo seed ─────────────────────────────────────────── */
const SEED_FILES = [
  { id: "seed-1", name: "Manual Tesla 369 — Cycles.pdf",       size: 2_456_000,  uploadedAt: Date.now() - 1000 * 60 * 60 * 24 * 3 },
  { id: "seed-2", name: "Lunar Trader Codex.epub",              size: 1_180_000,  uploadedAt: Date.now() - 1000 * 60 * 60 * 24 * 7 },
  { id: "seed-3", name: "Frecuencias 432Hz · Meditación.mp3",   size: 8_640_000,  uploadedAt: Date.now() - 1000 * 60 * 60 * 36 },
  { id: "seed-4", name: "Charts Históricos BTC 2017-2025.zip",  size: 18_400_000, uploadedAt: Date.now() - 1000 * 60 * 60 * 24 * 14 },
  { id: "seed-5", name: "Sesión Privada · Cuarto Creciente.mp4",size: 86_200_000, uploadedAt: Date.now() - 1000 * 60 * 60 * 9 },
];

/* ─── Main ──────────────────────────────────────────────── */

export default function SecretLibraryPanel({ admin = true }) {
  const [files, setFiles] = useState(() => {
    try {
      const raw = localStorage.getItem("secret-library-files");
      if (raw) return JSON.parse(raw);
    } catch {}
    return SEED_FILES;
  });
  const [query, setQuery] = useState("");

  // Persist (skip object URLs — they don't survive reload anyway)
  useEffect(() => {
    try {
      const slim = files.map(({ url, ...rest }) => rest);
      localStorage.setItem("secret-library-files", JSON.stringify(slim));
    } catch {}
  }, [files]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => f.name.toLowerCase().includes(q));
  }, [files, query]);

  const handleAdd = useCallback((items) => {
    setFiles((prev) => [...items, ...prev]);
  }, []);

  const handleDownload = useCallback((file) => {
    if (!file.url) {
      // Seed/demo file with no real blob — open a no-op
      window.alert(`Demo: "${file.name}" se descargaría aquí.`);
      return;
    }
    const a = document.createElement("a");
    a.href = file.url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, []);

  const particles = useMemo(
    () => Array.from({ length: 5 }, (_, i) => ({
      id: i,
      top: 10 + Math.random() * 80,
      left: 10 + Math.random() * 80,
      d: 14 + Math.random() * 12,
      mx: (Math.random() * 24 - 12).toFixed(0) + "px",
      my: (Math.random() * 28 - 14).toFixed(0) + "px",
    })),
    []
  );

  return (
    <>
      <style>{STYLES}</style>
      <aside className="sl-panel" aria-label="Biblioteca secreta">
        <div className="sl-glow" aria-hidden="true" />
        <div className="sl-particles" aria-hidden="true">
          {particles.map((p) => (
            <span
              key={p.id}
              className="sl-particle"
              style={{ top: `${p.top}%`, left: `${p.left}%`, "--d": `${p.d}s`, "--mx": p.mx, "--my": p.my }}
            />
          ))}
        </div>

        <div className="sl-content">
          <LibraryHeader count={files.length} />
          <div className="sl-divider" />
          <LibrarySearch value={query} onChange={setQuery} />

          {filtered.length === 0 ? (
            <div className="sl-empty">
              <ScrollText size={28} strokeWidth={1.4} />
              <p>{query ? "Ningún manuscrito coincide con tu búsqueda." : "La biblioteca aguarda sus primeros manuscritos."}</p>
            </div>
          ) : (
            <div className="sl-list">
              {filtered.map((file, i) => (
                <FileItem key={file.id} file={file} index={i} onDownload={handleDownload} />
              ))}
            </div>
          )}

          {admin && <UploadZone onAdd={handleAdd} />}
          <LibraryFooter />
        </div>
      </aside>
    </>
  );
}
