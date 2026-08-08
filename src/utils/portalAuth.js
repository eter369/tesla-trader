// Acceso al Portal Místico / Biblioteca Cósmica.
//
// NOTA: esto es una puerta cosmética del lado del cliente. Las credenciales
// viajan en el bundle, así que no protege nada sensible — solo evita que un
// visitante casual entre a la Biblioteca. Para seguridad real hace falta un
// backend que valide y sirva el contenido.

const USER = "eter369";
const PASS = "369369";

// La clave se pide SIEMPRE: no se guarda nada en sessionStorage ni en
// localStorage, así que recargar o volver a entrar vuelve a preguntar.
//
// El pase de abajo existe solo para no preguntar dos veces seguidas en el
// mismo trayecto: el orbe valida y navega a /biblioteca/, donde el guardia de
// ruta volvería a preguntar de inmediato. Vive en memoria, dura unos segundos
// y muere al recargar la página.
const HANDOFF_MS = 15000;
let unlockedAt = 0;

export function checkCredentials(user, pass) {
  return String(user).trim() === USER && String(pass) === PASS;
}

export function unlockPortal() {
  unlockedAt = Date.now();
}

// True solo durante la navegación inmediata posterior a validar la clave.
export function hasFreshUnlock() {
  return unlockedAt > 0 && Date.now() - unlockedAt < HANDOFF_MS;
}

export function lockPortal() {
  unlockedAt = 0;
}
