// ─── Velas de Binance con caché local ───
// Cada vela es [apertura (ms), open, high, low, close, volumen en USDT].
// El historial se guarda en localStorage y en cada visita solo se pide lo que
// falta desde la última vela guardada, así el sitio no repite descargas grandes
// ni se acerca a los límites de Binance (1.000 velas por pedido). Las velas
// se cortan en hora de Lima (timeZone=-5): la diaria va de medianoche a
// medianoche de Lima y la de 6 h empieza a las 00, 06, 12 y 18 h.

const API = "https://api.binance.com/api/v3/klines";
export const MS_INTERVALO = {
  "15m": 9e5, "1h": 36e5, "2h": 72e5, "6h": 216e5, "1d": 864e5,
};

const ZONA = "-5";

async function pedir(symbol, interval, startTime, limit = 1000) {
  const url = `${API}?symbol=${symbol}&interval=${interval}&limit=${limit}&timeZone=${ZONA}` + (startTime ? `&startTime=${startTime}` : "");
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 429 || res.status === 418) throw new Error("Binance pidió esperar: reintento en un minuto");
    throw new Error(`Binance respondió ${res.status}`);
  }
  const filas = await res.json();
  return filas.map((k) => [k[0], +k[1], +k[2], +k[3], +k[4], +k[7]]);
}

// Últimas `limit` velas (sin caché): para el gráfico, que cambia de rango
export const velasRecientes = (symbol, interval, limit) => pedir(symbol, interval, null, limit);

function leerCache(clave) {
  try {
    const raw = localStorage.getItem(clave);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function guardarCache(clave, velas) {
  try {
    localStorage.setItem(clave, JSON.stringify(velas));
  } catch {
    // sin espacio o en modo privado: se vuelve a descargar la próxima vez
  }
}

// Velas desde `desdeMs` hasta ahora, usando la caché. La última vela puede
// estar abierta: se reemplaza en cada actualización. Dos pedidos simultáneos
// del mismo par comparten la descarga.
const enCurso = new Map();
export function velasConCache(symbol, interval, desdeMs) {
  const clave = `t369-velas-${symbol}-${interval}-lima`;
  if (!enCurso.has(clave)) {
    enCurso.set(clave, descargar(clave, symbol, interval, desdeMs).finally(() => enCurso.delete(clave)));
  }
  return enCurso.get(clave);
}

async function descargar(clave, symbol, interval, desdeMs) {
  const paso = MS_INTERVALO[interval];
  let velas = leerCache(clave) || [];
  if (!velas.length || velas[0][0] > desdeMs + paso) velas = [];

  let inicio = velas.length ? velas[velas.length - 1][0] : desdeMs;
  for (let vueltas = 0; vueltas < 20; vueltas++) {
    const lote = await pedir(symbol, interval, inicio);
    if (!lote.length) break;
    // la primera del lote reemplaza a la última guardada (estaba abierta)
    while (velas.length && velas[velas.length - 1][0] >= lote[0][0]) velas.pop();
    velas.push(...lote);
    if (lote.length < 1000) break;
    inicio = lote[lote.length - 1][0] + paso;
  }
  const corte = velas.findIndex((v) => v[0] >= desdeMs - paso);
  if (corte > 0) velas = velas.slice(corte);
  guardarCache(clave, velas);
  return velas;
}
