// Un solo formato de números para todo el sitio: es-PE (miles con coma,
// decimales con punto, como en "$85,180.50"), espacio antes de "%" y
// abreviaturas en español: M = millones, mil M = miles de millones,
// bill. = billones (10¹²).
const cache = new Map();
function nf(min, max, signo = "auto") {
  const clave = `${min}-${max}-${signo}`;
  if (!cache.has(clave)) {
    cache.set(clave, new Intl.NumberFormat("es-PE", { minimumFractionDigits: min, maximumFractionDigits: max, signDisplay: signo }));
  }
  return cache.get(clave);
}

const vacio = (v) => v == null || Number.isNaN(v);

export const numero = (v, decimales = 0) => (vacio(v) ? "—" : nf(decimales, decimales).format(v));

// Con signo siempre (+30.21 / -4.10)
export const numeroConSigno = (v, decimales = 0) => (vacio(v) ? "—" : nf(decimales, decimales, "exceptZero").format(v));

export function formatPrice(p) {
  if (vacio(p)) return "—";
  if (p >= 1000) return "$" + nf(0, 0).format(p);
  if (p >= 1) return "$" + nf(2, 2).format(p);
  return "$" + nf(4, 4).format(p);
}

export function formatPricePrecise(p) {
  if (vacio(p)) return "—";
  if (p >= 1) return "$" + nf(2, 2).format(p);
  return "$" + nf(6, 6).format(p);
}

export function formatVolume(v) {
  if (vacio(v)) return "—";
  if (v >= 1e12) return "$" + nf(2, 2).format(v / 1e12) + " bill.";
  if (v >= 1e9) return "$" + nf(1, 1).format(v / 1e9) + " mil M";
  if (v >= 1e6) return "$" + nf(1, 1).format(v / 1e6) + " M";
  if (v >= 1e3) return "$" + nf(1, 1).format(v / 1e3) + " mil";
  return "$" + nf(0, 0).format(v);
}

// "+1.23 %" (con signo)
export const formatChange = (cambio, decimales = 2) => (vacio(cambio) ? "—" : numeroConSigno(cambio, decimales) + " %");

// 0.523 → "52 %"
export const porcentaje = (fraccion, decimales = 0) => (vacio(fraccion) ? "—" : nf(decimales, decimales).format(fraccion * 100) + " %");

export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
