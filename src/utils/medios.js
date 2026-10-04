// Cuándo conviene no cargar videos decorativos: si la persona pidió menos
// movimiento, si activó el ahorro de datos o si la pantalla es de celular.
export function prefiereMenosMovimiento() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function ahorroDeDatos() {
  try {
    return Boolean(navigator.connection?.saveData);
  } catch {
    return false;
  }
}

export const pantallaChica = () => typeof window !== "undefined" && window.innerWidth < 768;

// Videos de fondo y adornos: fuera en estos casos
export const sinVideosDecorativos = () => prefiereMenosMovimiento() || ahorroDeDatos() || pantallaChica();
