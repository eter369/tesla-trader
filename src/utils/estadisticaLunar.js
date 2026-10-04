// ─── Estadística lunar de BTC ───
// Cada día de Lima desde 2017 (velas diarias de Binance) se asigna a la fase
// que la señal usa ese día (al mediodía de Lima) y se compara su rendimiento
// con el de todos los días. Es correlación histórica, no causa.
import { estadoLunar, getLunarPhaseInfo, SYNODIC_MONTH } from "./lunar.js";

export const FASES_SENAL = ["new_moon", "waxing", "full_moon", "waning"];
// Límites de las cuatro fases de la señal, en fracción de lunación (ver getLunarPhaseInfo)
const LIMITES = { new_moon: [-0.0625, 0.0625], waxing: [0.0625, 0.3125], full_moon: [0.3125, 0.5625], waning: [0.5625, 0.9375] };
export const diasDeFase = (id) => LIMITES[id].map((f) => f * SYNODIC_MONTH);

function resumen(rets) {
  const n = rets.length;
  const media = rets.reduce((s, r) => s + r, 0) / n;
  const varianza = rets.reduce((s, r) => s + (r - media) ** 2, 0) / (n - 1);
  return { n, media, varianza, verdes: rets.filter((r) => r > 0).length / n };
}

// velas: [apertura, open, high, low, close, volumen]; la última (abierta) se descarta
export function estadisticaPorFase(velas) {
  const dias = velas.slice(0, -1).map((v) => ({
    ret: (v[4] / v[1] - 1) * 100,
    fase: getLunarPhaseInfo(estadoLunar(new Date(v[0] + 12 * 36e5)).fase),
  }));
  const todos = resumen(dias.map((d) => d.ret));
  const filas = FASES_SENAL.map((id) => {
    const enFase = dias.filter((d) => d.fase.nameEn === id);
    const resto = dias.filter((d) => d.fase.nameEn !== id);
    const g = resumen(enFase.map((d) => d.ret));
    const r = resumen(resto.map((d) => d.ret));
    // t de Welch: ¿el rendimiento medio de la fase se separa del de los demás días?
    const t = (g.media - r.media) / Math.sqrt(g.varianza / g.n + r.varianza / r.n);
    return { id, nombre: enFase[0]?.fase.name, icono: enFase[0]?.fase.icon, ...g, t };
  });
  return { todos, filas, desde: velas[0][0], hasta: velas[velas.length - 2][0] };
}
