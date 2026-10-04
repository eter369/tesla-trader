// ─── Señal Tesla 369 sobre velas de 1 h ───
// La señal usa siempre velas de 1 h de Binance, sin importar el rango que se
// mire en el gráfico. Aquí se calculan sus indicadores, la volatilidad y el
// seguimiento de los últimos 90 días: qué estado mostraba la señal cada día a
// medianoche de Lima y qué hizo el precio 24 h y 7 días después, comparado
// con lo que habría acertado el azar en esos mismos días. Los plazos de 7 días
// se solapan (cada caso comparte 6 días con el siguiente), así que su prueba
// usa la muestra efectiva: casos × 24 h / 168 h.
import { calculateRSI } from "./indicators.js";
import { estadoLunar, getLunarPhaseInfo, generateSignal, ESTADOS_SENAL } from "./lunar.js";

const HORA = 36e5;
const DIA = 864e5;
export const DIAS_SEGUIMIENTO = 90;
export const MIN_CASOS = 15;
export const PERCENTIL_VOLATILIDAD = 80;
export const HORIZONTES = [
  { horas: 24, etiqueta: "24 h" },
  { horas: 168, etiqueta: "7 días" },
];

// Histograma MACD (12, 26, 9) sin redondear, alineado con las velas
function histogramaMACD(c) {
  const ema = (datos, n) => {
    const k = 2 / (n + 1);
    const out = [datos[0]];
    for (let i = 1; i < datos.length; i++) out.push(datos[i] * k + out[i - 1] * (1 - k));
    return out;
  };
  if (c.length < 35) return new Array(c.length).fill(null);
  const rapida = ema(c, 12), lenta = ema(c, 26);
  const macd = c.map((v, i) => rapida[i] - lenta[i]);
  const senal = ema(macd.slice(25), 9);
  return c.map((_, i) => (i < 33 ? null : macd[i] - senal[i - 25]));
}

// ATR de Wilder (14 velas) como % del precio
function atrPorcentual(velas, n = 14) {
  const out = new Array(velas.length).fill(null);
  let atr = 0;
  for (let i = 1; i < velas.length; i++) {
    const [, , h, l] = velas[i];
    const previo = velas[i - 1][4];
    const tr = Math.max(h - l, Math.abs(h - previo), Math.abs(l - previo));
    atr = i <= n ? atr + tr / n : (atr * (n - 1) + tr) / n;
    if (i >= n) out[i] = (atr / velas[i][4]) * 100;
  }
  return out;
}

function percentil(valores, p) {
  const v = valores.filter((x) => x != null).sort((a, b) => a - b);
  if (!v.length) return null;
  return v[Math.min(v.length - 1, Math.floor((p / 100) * v.length))];
}

// P(X ≥ k) con X ~ Binomial(n, p): probabilidad de acertar tanto o más por azar
export function colaBinomial(k, n, p) {
  if (k <= 0) return 1;
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  let pmf = Math.pow(1 - p, n), cola = 0;
  for (let j = 0; j <= n; j++) {
    if (j >= k) cola += pmf;
    pmf *= ((n - j) / (j + 1)) * (p / (1 - p));
  }
  return Math.min(1, cola);
}

// Φ(z) (Abramowitz y Stegun 7.1.26)
function normal(z) {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

const faseEn = (ms) => getLunarPhaseInfo(estadoLunar(new Date(ms)).fase);

// Todo lo que la señal necesita, a partir de las velas de 1 h (la última puede estar abierta)
export function analizarVelas(velas) {
  const cierres = velas.map((v) => v[4]);
  const rsi = new Array(velas.length).fill(null);
  for (const r of calculateRSI(cierres)) rsi[r.index] = r.value;
  const macd = histogramaMACD(cierres);
  const atr = atrPorcentual(velas);
  const ultimo = velas.length - 1;
  const ahora = velas[ultimo][0] + HORA;
  const indice = new Map(velas.map((v, i) => [v[0], i]));

  // Volatilidad: el umbral es el percentil 80 del ATR de los últimos 90 días
  const desde90 = ahora - DIAS_SEGUIMIENTO * DIA;
  const umbralAtr = percentil(atr.filter((_, i) => velas[i][0] >= desde90 && i < ultimo), PERCENTIL_VOLATILIDAD);

  // Volumen de las últimas 24 velas frente al promedio diario de los 7 días previos
  const sumaVol = (a, b) => velas.slice(Math.max(0, a), b).reduce((s, v) => s + v[5], 0);
  const vol24 = sumaVol(velas.length - 24, velas.length);
  const vol7d = sumaVol(velas.length - 192, velas.length - 24) / 7;

  const variacion24 = (i) => (i >= 24 ? (cierres[i] / cierres[i - 24] - 1) * 100 : 0);

  // Seguimiento: un caso por día, la vela que cierra a medianoche de Lima (05:00 UT)
  const muestras = [];
  for (let i = 0; i < ultimo; i++) {
    const cierre = velas[i][0] + HORA;
    if (cierre < desde90 || new Date(cierre).getUTCHours() !== 5) continue;
    if (rsi[i] == null || macd[i] == null) continue;
    const s = generateSignal(faseEn(cierre), rsi[i], macd[i], variacion24(i));
    muestras.push({ i, cierre, estado: s.action, dir: s.dir });
  }

  const seguimiento = HORIZONTES.map(({ horas, etiqueta }) => {
    const casos = [];
    for (const m of muestras) {
      const j = indice.get(velas[m.i][0] + horas * HORA);
      if (j == null || j >= ultimo) continue; // aún no se cumple el plazo (o falta la vela)
      casos.push({ ...m, ret: (cierres[j] / cierres[m.i] - 1) * 100 });
    }
    const n = casos.length;
    const base = { 1: casos.filter((c) => c.ret > 0).length / (n || 1), "-1": casos.filter((c) => c.ret < 0).length / (n || 1) };
    const acierto = (c) => (c.dir > 0 ? c.ret > 0 : c.ret < 0);
    const efectiva = Math.min(1, 24 / horas);

    const filas = Object.keys(ESTADOS_SENAL).map((estado) => {
      const grupo = casos.filter((c) => c.estado === estado);
      const dir = ESTADOS_SENAL[estado].dir;
      const retMedio = grupo.length ? grupo.reduce((s, c) => s + c.ret, 0) / grupo.length : null;
      if (!dir) return { estado, dir, n: grupo.length, retMedio };
      const aciertos = grupo.filter(acierto).length;
      const p0 = base[dir];
      const tasa = grupo.length ? aciertos / grupo.length : null;
      const nEfectivo = Math.round(grupo.length * efectiva);
      return {
        estado, dir, n: grupo.length, nEfectivo, retMedio, aciertos, tasa, base: p0,
        p: nEfectivo ? colaBinomial(Math.round(tasa * nEfectivo), nEfectivo, p0) : null,
      };
    });

    // Todas las señales con dirección juntas (aproximación normal, con corrección de continuidad)
    const dirigidos = casos.filter((c) => c.dir);
    const aciertos = dirigidos.filter(acierto).length;
    const esperados = dirigidos.reduce((s, c) => s + base[c.dir], 0);
    const varianza = dirigidos.reduce((s, c) => s + base[c.dir] * (1 - base[c.dir]), 0);
    const z = varianza > 0 ? ((aciertos - esperados - 0.5) / Math.sqrt(varianza)) * Math.sqrt(efectiva) : 0;
    const total = {
      n: dirigidos.length, nEfectivo: Math.round(dirigidos.length * efectiva), aciertos, esperados,
      tasa: dirigidos.length ? aciertos / dirigidos.length : null,
      base: dirigidos.length ? esperados / dirigidos.length : null,
      p: dirigidos.length ? 1 - normal(z) : null,
    };
    return { horas, etiqueta, n, filas, total, desde: casos[0]?.cierre ?? null, hasta: casos[n - 1]?.cierre ?? null };
  });

  return {
    precio: cierres[ultimo],
    tiempo: velas[ultimo][0],
    rsi: rsi[ultimo] ?? 50,
    macd: macd[ultimo] ?? 0,
    variacion24: variacion24(ultimo),
    atr: atr[ultimo],
    umbralAtr,
    volumenVs7d: vol7d > 0 ? (vol24 / vol7d - 1) * 100 : 0,
    seguimiento,
  };
}
