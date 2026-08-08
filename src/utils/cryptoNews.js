// Obtención, puntuación y caché de noticias cripto.
//
// De dónde salen las noticias, en orden:
//   1. /news.json — pre-generado en CI por scripts/fetch-news.mjs y servido
//      desde nuestro propio dominio. Es la vía normal en producción: sin CORS,
//      una sola petición y ya traducido. Se refresca a diario.
//   2. /rss/<id> — el proxy del dev server de Vite (ver vite.config.js). En
//      desarrollo da noticias al minuto sin esperar al workflow.
//   3. Proxies CORS públicos — último recurso. Van caídos o rate-limitados casi
//      siempre, de ahí que exista el paso 1.
// Las peticiones a feeds van con concurrencia limitada: disparar los 11 a la vez
// contra un proxy gratuito garantiza un rate limit y que no llegue ni una.

import { RSS_FEEDS } from "./feeds";

export { RSS_FEEDS };

const CACHE_KEY = "tesla369_news_cache";
// Subir al cambiar la forma del artículo o el cálculo de `score`: mezclar
// puntajes de dos algoritmos distintos rompe el orden por importancia.
const CACHE_VERSION = 5;

// Tras esto los datos en caché se consideran viejos y se refresca.
export const REFRESH_MS = 30 * 60 * 1000; // 30 min
// Aunque el fetch falle, seguimos mostrando la caché hasta 3 días.
const CACHE_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;

const FETCH_TIMEOUT_MS = 15000;
const MAX_CONCURRENT = 3;

const IS_DEV = typeof import.meta !== "undefined" && import.meta.env?.DEV;

// Proxies CORS para producción, en orden de preferencia. Se prueban en cascada
// porque estos servicios gratuitos caen o rate-limitan a menudo.
const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://proxy.cors.sh/${url}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

/* ─────────── Clasificación y fechas (módulo puro, compartido con CI) ─────────── */

import {
  calcImpactScore,
  detectCoins,
  detectSentiment,
  safeDate,
  getWeekRange,
} from "./newsScoring";

// Re-exportadas para que los componentes importen todo desde un único sitio.
export {
  COIN_COLORS,
  impactLevel,
  safeDate,
  formatTimeAgo,
  formatDate,
  getWeekRange,
} from "./newsScoring";


/* ─────────────────── Red ─────────────────── */

async function fetchText(url, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!text || text.length < 200) throw new Error("Respuesta vacía");
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchFeedXml(feed) {
  // Desarrollo: el proxy de Vite sirve el feed sin CORS.
  if (IS_DEV) {
    try {
      return await fetchText(`/rss/${feed.id}`);
    } catch {
      // Si el proxy falla (feed caído), seguimos con los proxies públicos.
    }
  }
  let lastErr = null;
  for (const proxyFn of CORS_PROXIES) {
    try {
      return await fetchText(proxyFn(feed.url));
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("Todos los proxies fallaron");
}

function parseFeed(xml, feed) {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  if (doc.querySelector("parsererror")) throw new Error("XML inválido");
  const items = doc.querySelectorAll("item, entry");
  if (!items.length) throw new Error("Sin artículos");

  const articles = [];
  items.forEach((item, idx) => {
    if (idx >= 20) return;
    const title = item.querySelector("title")?.textContent?.trim() || "";
    if (!title) return;

    // RSS usa <link>texto</link>; Atom usa <link href="..."/>
    let link = item.querySelector("link")?.textContent?.trim() || "";
    if (!link) link = item.querySelector("link[href]")?.getAttribute("href") || "";

    const pubDate =
      item.querySelector("pubDate")?.textContent?.trim() ||
      item.querySelector("published")?.textContent?.trim() ||
      item.querySelector("updated")?.textContent?.trim() ||
      "";

    const score = calcImpactScore(title);
    if (score < 0) return;

    const parsed = safeDate(pubDate);
    articles.push({
      t: title,
      i: detectSentiment(title),
      coins: detectCoins(title),
      url: link,
      source: feed.source,
      lang: feed.lang,
      priority: feed.priority,
      ts: parsed ? parsed.getTime() : Date.now(),
      score,
    });
  });
  return articles;
}

// Ejecuta las tareas con un tope de concurrencia. Los proxies gratuitos
// rate-limitan en cuanto ven una ráfaga, así que vamos de a pocos.
async function mapWithLimit(items, limit, worker) {
  const results = [];
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      try {
        results.push(await worker(items[index]));
      } catch {
        /* un feed caído no debe tumbar al resto */
      }
    }
  });
  await Promise.all(runners);
  return results;
}

/* ─────────────────── Caché ─────────────────── */

export function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== CACHE_VERSION || !Array.isArray(parsed.articles)) return null;
    if (Date.now() - parsed.fetchedAt > CACHE_MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(articles) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ version: CACHE_VERSION, fetchedAt: Date.now(), articles })
    );
  } catch {
    /* cuota llena o storage bloqueado — no es crítico */
  }
}

/* ─────────────────── API pública ─────────────────── */

const TOP_COUNT = 6;
const TODAY_COUNT = 5;

// Agrupa un conjunto plano de artículos en las secciones que pinta la tarjeta.
// `now` se recibe en lugar de leer el reloj aquí dentro: el componente lo
// avanza cada minuto para que "hoy" siga significando hoy aunque la pestaña
// lleve horas abierta.
export function buildSections(articles, now = Date.now()) {
  if (!articles?.length) return null;

  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const seen = new Set();
  const unique = articles.filter((a) => {
    const key = a.t.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Descartamos noticias con fecha futura: algunos feeds traen timestamps rotos
  // y se colaban arriba del ranking por recencia.
  const weekArticles = unique.filter((a) => a.ts >= oneWeekAgo && a.ts <= now + 60 * 60 * 1000);
  if (!weekArticles.length) return null;

  // Orden estricto por importancia. A igual impacto manda la más reciente, y
  // como último desempate la fuente que rompe antes las noticias.
  const byImpact = (a, b) =>
    (b.score || 0) - (a.score || 0) ||
    b.ts - a.ts ||
    (a.priority || 9) - (b.priority || 9);

  const top = [...weekArticles].sort(byImpact).slice(0, TOP_COUNT);
  const topUrls = new Set(top.map((a) => a.url));
  const other = weekArticles
    .filter((a) => a.ts >= oneDayAgo && !topUrls.has(a.url))
    .sort(byImpact)
    .slice(0, TODAY_COUNT);

  // Las fuentes que se muestran son las de las noticias visibles, no las de
  // todo lo descargado.
  const visibleSources = [...new Set([...top, ...other].map((a) => a.source))];

  return {
    top,
    other,
    week: getWeekRange(),
    source: visibleSources.slice(0, 3).join(" · "),
    sourceCount: visibleSources.length,
  };
}

// Noticias pre-generadas en CI y servidas desde nuestro propio dominio. Una
// sola petición, sin CORS y con los titulares ya traducidos.
async function fetchPrebuiltNews() {
  // El sello de tiempo evita que un CDN sirva el JSON de ayer.
  const res = await fetch(`/news.json?v=${Math.floor(Date.now() / 60000)}`, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data?.articles) || !data.articles.length) throw new Error("JSON vacío");
  return data.articles;
}

/**
 * Devuelve el array plano de artículos, fusionado con la caché previa (así una
 * fuente caída no borra su historial). Devuelve null si no se pudo obtener nada
 * y tampoco hay caché.
 */
export async function fetchCryptoNews() {
  let fresh = [];

  // 1) El JSON pre-generado: rápido y fiable, es la vía normal en producción.
  try {
    fresh = await fetchPrebuiltNews();
  } catch {
    /* aún no generado o servidor sin él — probamos con los feeds en vivo */
  }

  // 2) Feeds en vivo. En desarrollo dan noticias al minuto sin esperar al
  //    workflow; en producción es el plan B si el JSON no está disponible.
  if (!fresh.length) {
    const batches = await mapWithLimit(RSS_FEEDS, MAX_CONCURRENT, async (feed) => {
      const xml = await fetchFeedXml(feed);
      return parseFeed(xml, feed);
    });
    fresh = batches.flat();
  }

  const cached = readCache();

  if (!fresh.length) {
    if (cached?.articles?.length) {
      return { articles: cached.articles, fetchedAt: cached.fetchedAt, stale: true };
    }
    return null;
  }

  // Fusionamos con la caché por URL para conservar noticias de la semana que ya
  // salieron del feed (los RSS solo exponen los últimos ~20 items).
  const byUrl = new Map();
  for (const a of cached?.articles || []) if (a.url) byUrl.set(a.url, a);
  for (const a of fresh) if (a.url) byUrl.set(a.url, a);

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const merged = [...byUrl.values()].filter((a) => a.ts >= weekAgo);

  writeCache(merged);
  return { articles: merged, fetchedAt: Date.now(), stale: false };
}
