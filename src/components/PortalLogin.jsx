import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { checkCredentials, unlockPortal } from "../utils/portalAuth";

const STYLES = `
@keyframes pl-in {
  from { opacity: 0; transform: translateY(14px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes pl-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes pl-shake {
  0%, 100% { transform: translateX(0); }
  15% { transform: translateX(-8px); }
  30% { transform: translateX(7px); }
  45% { transform: translateX(-5px); }
  60% { transform: translateX(4px); }
  80% { transform: translateX(-2px); }
}
@keyframes pl-sigil {
  0%, 100% { opacity: 0.45; transform: rotate(0deg); }
  50%      { opacity: 0.9;  transform: rotate(180deg); }
}
.pl-backdrop {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  background: radial-gradient(ellipse at 50% 40%, rgba(30, 12, 60, 0.75) 0%, rgba(4, 4, 12, 0.92) 60%, rgba(2, 2, 8, 0.97) 100%);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  animation: pl-fade 0.28s ease both;
}
.pl-card {
  position: relative;
  width: 100%; max-width: 380px;
  padding: 34px 28px 26px;
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(22, 16, 46, 0.94) 0%, rgba(10, 10, 26, 0.97) 100%);
  border: 1px solid rgba(168, 85, 247, 0.28);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.7), 0 0 60px rgba(139, 92, 246, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  animation: pl-in 0.38s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.pl-card.pl-error { animation: pl-shake 0.45s ease both; }
.pl-sigil {
  position: absolute; top: 14px; right: 16px;
  font-size: 15px; color: #f5a623;
  text-shadow: 0 0 14px rgba(245, 166, 35, 0.6);
  animation: pl-sigil 7s linear infinite;
  pointer-events: none;
}
.pl-field {
  width: 100%;
  padding: 11px 13px;
  border-radius: 11px;
  background: rgba(6, 8, 20, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.22);
  color: #e8ecf9;
  font-size: 14px;
  letter-spacing: 0.04em;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.pl-field::placeholder { color: #59617f; letter-spacing: 0.08em; }
.pl-field:focus {
  border-color: rgba(245, 166, 35, 0.55);
  box-shadow: 0 0 0 3px rgba(245, 166, 35, 0.12);
}
.pl-submit {
  width: 100%;
  margin-top: 18px;
  padding: 12px;
  border-radius: 11px;
  border: 1px solid rgba(245, 166, 35, 0.45);
  background: linear-gradient(180deg, rgba(245, 166, 35, 0.22), rgba(180, 110, 12, 0.16));
  color: #ffce6a;
  font-weight: 800;
  font-size: 12px;
  letter-spacing: 0.24em;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease;
}
.pl-submit:hover {
  background: linear-gradient(180deg, rgba(245, 166, 35, 0.34), rgba(180, 110, 12, 0.24));
  box-shadow: 0 0 26px rgba(245, 166, 35, 0.22);
}
.pl-submit:active { transform: translateY(1px); }
.pl-close {
  position: absolute; top: 12px; left: 14px;
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: #8a93b2;
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease;
}
.pl-close:hover { color: #e8ecf9; border-color: rgba(255, 255, 255, 0.2); }
@media (prefers-reduced-motion: reduce) {
  .pl-backdrop, .pl-card, .pl-card.pl-error, .pl-sigil { animation: none; }
}
`;

/**
 * Puerta de acceso al Portal Místico. Pide usuario y contraseña antes de
 * dejar entrar a la Biblioteca Cósmica.
 *
 * @param {boolean}  open      Muestra u oculta el modal.
 * @param {Function} onClose   Se llama al cerrar sin autenticarse (null si no se puede cerrar).
 * @param {Function} onSuccess Se llama cuando las credenciales son correctas.
 */
export default function PortalLogin({ open, onClose, onSuccess }) {
  // El diálogo vive en su propio componente para que abrir el portal lo monte
  // de cero: el formulario arranca vacío sin necesidad de resetearlo por efecto.
  if (!open) return null;
  return <PortalLoginDialog onClose={onClose} onSuccess={onSuccess} />;
}

function PortalLoginDialog({ onClose, onSuccess }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const userRef = useRef(null);

  // Foco inicial y tras cada intento fallido — la tarjeta se remonta por su
  // key={attempts}, así que hay que apuntar al nodo nuevo.
  useEffect(() => {
    userRef.current?.focus();
  }, [attempts]);

  // Bloquear scroll del body mientras está abierto
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Escape para cerrar
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (checkCredentials(user, pass)) {
      unlockPortal();
      onSuccess?.();
      return;
    }
    setError("Credenciales incorrectas. El portal permanece sellado.");
    setAttempts((n) => n + 1);
    setPass("");
  }, [user, pass, onSuccess]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  // Se monta en <body> para escapar del overflow/filter de las tarjetas padre.
  return createPortal(
    <>
      <style>{STYLES}</style>
      <div className="pl-backdrop" role="dialog" aria-modal="true" aria-label="Acceso al Portal Místico" onClick={handleBackdropClick}>
        {/* La key cambia en cada intento fallido para reiniciar la animación de shake */}
        <div className={`pl-card${error ? " pl-error" : ""}`} key={attempts}>
          {onClose && (
            <button className="pl-close" onClick={onClose} aria-label="Cerrar" type="button">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          <span className="pl-sigil" aria-hidden="true">✦</span>

          <div className="text-center mb-6">
            <div className="text-[9px] tracking-[0.3em] uppercase text-purple-300/50 font-bold mb-2">
              Portal Místico
            </div>
            <h2 className="text-lg font-black gold-text tracking-wide">BIBLIOTECA CÓSMICA</h2>
            <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
              Solo los iniciados cruzan el umbral.
            </p>
          </div>

          <form onSubmit={handleSubmit} autoComplete="off">
            <label className="block text-[9px] tracking-[0.24em] uppercase text-gray-500 font-bold mb-1.5">
              Usuario
            </label>
            <input
              ref={userRef}
              className="pl-field"
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="tu usuario"
              autoComplete="off"
              spellCheck={false}
            />

            <label className="block text-[9px] tracking-[0.24em] uppercase text-gray-500 font-bold mb-1.5 mt-4">
              Contraseña
            </label>
            <input
              className="pl-field"
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••"
              autoComplete="off"
            />

            <div className="min-h-[18px] mt-2.5" aria-live="polite">
              {error && <p className="text-[11px] text-red-400/90 leading-snug">{error}</p>}
            </div>

            <button className="pl-submit" type="submit">ABRIR EL PORTAL</button>
          </form>
        </div>
      </div>
    </>,
    document.body
  );
}
