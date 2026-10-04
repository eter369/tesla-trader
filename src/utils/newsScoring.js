// Clasificación y formato de noticias: puntuación de impacto, detección de
// monedas y sentimiento, y utilidades de fecha.
//
// Este módulo es deliberadamente puro — sin DOM, sin red, sin import.meta —
// porque lo comparten el navegador y el script de Node que pre-genera las
// noticias en CI (scripts/fetch-news.mjs). Cualquier cosa que dependa del
// navegador va en cryptoNews.js.

/* ─────────────────── Clasificación ─────────────────── */

export const COIN_COLORS = {
  BTC: "#f7931a", ETH: "#627eea", SOL: "#9945ff", BNB: "#f0b90b",
  XRP: "#00aae4", ADA: "#0033ad", DOGE: "#c2a633", DOT: "#e6007a",
  AVAX: "#e84142", LINK: "#2a5ada", MATIC: "#8247e5", UNI: "#ff007a",
};

const COIN_KEYWORDS = {
  BTC: ["bitcoin", "btc", "satoshi"],
  ETH: ["ethereum", "eth", "vitalik"],
  SOL: ["solana", "sol"],
  BNB: ["binance", "bnb"],
  XRP: ["ripple", "xrp"],
  ADA: ["cardano", "ada"],
  DOGE: ["dogecoin", "doge"],
  AVAX: ["avalanche", "avax"],
  LINK: ["chainlink", "link"],
  DOT: ["polkadot"],
};

const BULLISH_WORDS = [
  "surge", "rally", "soar", "bull", "gain", "record", "high", "pump", "breakout", "approval",
  "adopt", "launch", "partner", "milestone", "growth", "profit", "boom", "etf approved", "institutional",
  "all-time", "ath", "jump", "climb", "rise",
  "sube", "suben", "alza", "récord", "máximo", "alcista", "aprobación", "adopción", "ganancia",
  "repunte", "impulso", "supera", "superan", "despega", "lanzamiento", "alianza", "crecimiento",
  "beneficio", "avanza", "escala", "dispara", "remonta", "gana",
];

const BEARISH_WORDS = [
  "crash", "drop", "plunge", "bear", "fall", "hack", "exploit", "ban", "lawsuit", "sec charges",
  "fraud", "scam", "dump", "selloff", "liquidat", "bankrupt", "collapse", "slump", "sink",
  "baja", "caída", "cae", "caen", "desplome", "desploma", "bajista", "fraude", "estafa", "demanda",
  "prohibición", "quiebra", "liquidación", "colapso", "pierde", "pierden", "retrocede", "mínimo",
  "hackeo", "hackean", "hunde", "derrumba", "robo", "roban",
];

// El impacto se puntúa por TEMA, no por palabra: cada tema suma su peso una
// sola vez aunque coincidan varios de sus términos. La versión anterior sumaba
// +3 por cada palabra encontrada, así que un titular en inglés ganaba siempre
// — no por importar más, sino porque las listas inglesas eran más largas.
// Cada tema lleva sus sinónimos en ambos idiomas para que puntúen igual.
const IMPACT_TOPICS = [
  { weight: 10, terms: ["etf approv", "etf reject", "halving", "aprobación de etf", "rechazo de etf"] },
  { weight: 8,  terms: ["etf", "etfs"] },
  { weight: 8,  terms: ["sec", "cftc", "regulation", "regulat", "congress", "senate", "bill", "law", "legal",
                        "executive order", "framework", "regulación", "regulador", "congreso", "senado",
                        "ley", "legisl", "prohib", "aprobación", "normativa"] },
  { weight: 7,  terms: ["hack", "exploit", "breach", "stolen", "vulnerability", "attack", "theft",
                        "hackeo", "hackean", "robo", "roban", "vulnerabilidad", "ataque", "brecha", "sustraído"] },
  { weight: 7,  terms: ["blackrock", "fidelity", "jpmorgan", "goldman", "morgan stanley", "microstrategy",
                        "institutional", "custody", "wall street", "pension", "sovereign",
                        "institucional", "custodia", "fondo soberano"] },
  { weight: 6,  terms: ["fed", "federal reserve", "treasury", "inflation", "interest rate", "rate cut",
                        "recession", "tariff", "trade war", "reserva federal", "tesoro", "inflación",
                        "tasa de interés", "tipos de interés", "recesión", "aranceles", "guerra comercial"] },
  { weight: 6,  terms: ["stablecoin", "cbdc", "usdt", "usdc", "tether", "moneda estable"] },
  { weight: 5,  terms: ["crash", "plunge", "collapse", "selloff", "liquidat", "bankrupt",
                        "desplome", "colapso", "quiebra", "liquidación", "derrumbe"] },
  { weight: 5,  terms: ["all-time high", "ath", "record", "rally", "surge", "máximo histórico",
                        "récord", "repunte", "dispara"] },
  { weight: 4,  terms: ["billion", "trillion", "billones", "miles de millones", "mil millones"] },
  { weight: 3,  terms: ["million", "millones"] },
  { weight: 3,  terms: ["adoption", "mainstream", "listing", "delist", "adopción", "cotización"] },
  { weight: 3,  terms: ["merge", "upgrade", "fork", "layer 2", "l2", "actualización", "bifurcación"] },
  { weight: 3,  terms: ["trump", "biden", "china", "casa blanca", "white house"] },
  { weight: 2,  terms: ["bank", "banco", "banca"] },
];

const NOISE_WORDS = [
  "horoscope", "zodiac", "celebrity gossip", "movie review", "sports score",
  "weather forecast", "recipe", "fashion", "beauty tips",
  "horóscopo", "zodiaco", "receta", "moda", "farándula",
];

// "$1.2B", "1.500 millones de dólares", "mil millones de euros"
const BIG_FIGURE = /(\$\s?[\d.,]+\s?(b|bn|m|k)\b)|([\d.,]+\s?(mil\s+)?(millones|billones)\b)|(mil\s+millones)/i;
// Cualquier importe con moneda: "$65.000", "63.000 dólares", "1.200 usd"
const MONEY_FIGURE = /(\$\s?[\d.,]{3,})|([\d.,]{3,}\s?(dólares|dolares|usd|euros))/i;

// Puntaje de importancia, independiente del idioma del titular.
export function calcImpactScore(title) {
  const lower = title.toLowerCase();
  let score = 0;

  for (const topic of IMPACT_TOPICS) {
    if (topic.terms.some((t) => lower.includes(t))) score += topic.weight;
  }

  // Mencionar una moneda concreta añade relevancia, una vez por moneda.
  for (const keywords of Object.values(COIN_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) score += 2;
  }

  // Dirección del mercado: una vez cada lado, no una por palabra.
  if (BULLISH_WORDS.some((w) => lower.includes(w))) score += 2;
  if (BEARISH_WORDS.some((w) => lower.includes(w))) score += 2;

  // Cifras concretas = noticia con dato duro, no opinión. Hay que reconocer
  // ambas convenciones: "$1.2B" y "1.500 millones de dólares". Con el patrón
  // anterior (solo con símbolo $) los titulares en español perdían este punto
  // sistemáticamente.
  if (BIG_FIGURE.test(lower)) score += 3;
  else if (/\d+\s?%/.test(lower)) score += 2;
  else if (MONEY_FIGURE.test(lower)) score += 2;

  for (const w of NOISE_WORDS) if (lower.includes(w)) score -= 20;
  return score;
}

// Nivel mostrado en la tarjeta para que el orden sea verificable de un vistazo.
export function impactLevel(score) {
  if (score >= 22) return { label: "CRÍTICO", color: "#ef4444", bars: 3 };
  if (score >= 12) return { label: "ALTO", color: "#f59e0b", bars: 2 };
  return { label: "MEDIO", color: "#6b7280", bars: 1 };
}

export function detectCoins(title) {
  const lower = title.toLowerCase();
  const found = [];
  for (const [symbol, keywords] of Object.entries(COIN_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) found.push(symbol);
  }
  return found;
}

export function detectSentiment(title) {
  const lower = title.toLowerCase();
  const bull = BULLISH_WORDS.filter((w) => lower.includes(w)).length;
  const bear = BEARISH_WORDS.filter((w) => lower.includes(w)).length;
  if (bull > bear) return "bullish";
  if (bear > bull) return "bearish";
  return "neutral";
}

/* ─────────────────── Fechas ─────────────────── */

const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// "2026-08-08 19:02:29" — sin zona horaria. Varios feeds (Investing ES) lo
// emiten así queriendo decir UTC, pero new Date() lo lee como hora local: en
// UTC-5 las noticias aparecían 5 horas en el futuro.
const NAIVE_DATETIME = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/;

export function safeDate(value) {
  if (!value) return null;
  if (typeof value === "string") {
    const m = value.trim().match(NAIVE_DATETIME);
    if (m) {
      const ms = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
      return isNaN(ms) ? null : new Date(ms);
    }
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

// Se calcula en cada render, no al descargar, para que "hace 2h" no se congele.
export function formatTimeAgo(ts) {
  if (!ts) return "—";
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "ahora";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} d`;
}

// Día, mes y año en hora de Lima (sirve igual en el navegador y en Node)
const FORMATO_LIMA = new Intl.DateTimeFormat("en-US", { timeZone: "America/Lima", year: "numeric", month: "numeric", day: "numeric" });
function partesLima(ms) {
  const p = Object.fromEntries(FORMATO_LIMA.formatToParts(ms).map((x) => [x.type, x.value]));
  return { dia: +p.day, mes: +p.month - 1, anio: +p.year };
}

export function formatDate(ts) {
  const d = safeDate(ts);
  if (!d) return "—";
  const { dia, mes } = partesLima(d.getTime());
  return `${dia} ${MONTHS[mes]}`;
}

export function getWeekRange() {
  const ahora = Date.now();
  const a = partesLima(ahora - 6 * 864e5), b = partesLima(ahora);
  return `${a.dia} ${MONTHS[a.mes]} - ${b.dia} ${MONTHS[b.mes]} ${b.anio}`;
}
