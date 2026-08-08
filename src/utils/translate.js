// Traducción de titulares al español.
//
// Las fuentes en inglés cubren noticias que las españolas tardan horas en
// replicar (o no replican). En vez de descartarlas, traducimos el titular al
// vuelo y así el panel queda íntegramente en español sin perder cobertura.
//
// Todo se cachea en localStorage: un titular se traduce una sola vez, aunque
// siga en el TOP durante días.

const CACHE_KEY = "tesla369_translations";
const CACHE_MAX_ENTRIES = 600;
const TIMEOUT_MS = 8000;
const MAX_CONCURRENT = 4;

let memoryCache = null;

function loadCache() {
  if (memoryCache) return memoryCache;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    memoryCache = raw ? JSON.parse(raw) : {};
  } catch {
    memoryCache = {};
  }
  return memoryCache;
}

function persistCache() {
  if (!memoryCache) return;
  try {
    const entries = Object.entries(memoryCache);
    // Poda simple: al pasarse del tope, conservamos las últimas entradas.
    const trimmed = entries.length > CACHE_MAX_ENTRIES
      ? Object.fromEntries(entries.slice(-CACHE_MAX_ENTRIES))
      : memoryCache;
    memoryCache = trimmed;
    localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
  } catch {
    /* cuota llena — seguimos con la caché en memoria */
  }
}

export function getCachedTranslation(text) {
  return loadCache()[text] || null;
}

/* ─────────────────── Proveedores ─────────────────── */

// Endpoint público de Google Translate. Sin clave y con CORS abierto; es el que
// mejor conserva la jerga cripto ("ETF", tickers, cifras).
async function translateGoogle(text, signal) {
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=" +
    encodeURIComponent(text);
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  // Forma: [[[traducción, original, ...], ...], ...]
  const out = (data?.[0] || []).map((chunk) => chunk?.[0] || "").join("").trim();
  if (!out) throw new Error("Respuesta vacía");
  return out;
}

async function translateMyMemory(text, signal) {
  const url =
    "https://api.mymemory.translated.net/get?langpair=en|es&q=" + encodeURIComponent(text);
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const out = data?.responseData?.translatedText?.trim();
  if (!out || /^(MYMEMORY WARNING|QUERY LENGTH LIMIT)/i.test(out)) throw new Error("Sin traducción");
  return out;
}

const PROVIDERS = [translateGoogle, translateMyMemory];

async function translateOne(text) {
  for (const provider of PROVIDERS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      return await provider(text, controller.signal);
    } catch {
      /* probamos el siguiente proveedor */
    } finally {
      clearTimeout(timeout);
    }
  }
  return null;
}

/**
 * Traduce los textos que aún no estén cacheados y devuelve el mapa completo
 * { textoOriginal: textoEnEspañol }. Los fallos se omiten: el llamador debe
 * caer al título original cuando falte una clave.
 */
export async function translateBatch(texts) {
  const cache = loadCache();
  const pending = [...new Set(texts)].filter((t) => t && !cache[t]);

  if (pending.length) {
    let cursor = 0;
    const runners = Array.from({ length: Math.min(MAX_CONCURRENT, pending.length) }, async () => {
      while (cursor < pending.length) {
        const text = pending[cursor++];
        const translated = await translateOne(text);
        // Guardamos incluso si el traductor devolvió el mismo texto: significa
        // que ya estaba en español o que no hay nada que cambiar.
        if (translated) cache[text] = translated;
      }
    });
    await Promise.all(runners);
    persistCache();
  }

  const result = {};
  for (const t of texts) if (cache[t]) result[t] = cache[t];
  return result;
}
