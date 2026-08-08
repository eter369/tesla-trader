// Pre-genera public/news.json con las noticias ya descargadas, puntuadas y
// traducidas al español.
//
// Por qué existe: el sitio se publica en GitHub Pages, que es hosting estático
// puro — no hay servidor donde montar un proxy. Descargar los RSS desde el
// navegador choca con CORS, y los proxies públicos gratuitos están caídos o
// rate-limitados casi siempre. Aquí, en cambio, el fetch lo hace Node dentro de
// GitHub Actions: sin CORS, sin proxies y sin límites de terceros.
//
// La web carga el JSON desde su propio dominio: instantáneo y fiable. Un
// workflow programado vuelve a ejecutar esto a diario (.github/workflows).
//
// Uso: node scripts/fetch-news.mjs

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { RSS_FEEDS } from "../src/utils/feeds.js";
import {
  calcImpactScore,
  detectCoins,
  detectSentiment,
  safeDate,
} from "../src/utils/newsScoring.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_FILE = join(ROOT, "public", "news.json");

const FETCH_TIMEOUT_MS = 20000;
const MAX_CONCURRENT = 4;
const KEEP_DAYS = 7;
const MAX_ITEMS_PER_FEED = 20;
// Solo se traduce lo que puede acabar a la vista; traducir 160 titulares
// gastaría cuota de balde.
const TRANSLATE_TOP = 30;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36";

/* ─────────────────── Utilidades ─────────────────── */

async function withLimit(items, limit, worker) {
  const results = [];
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      try {
        results.push(await worker(item));
      } catch (err) {
        console.warn(`  ✗ ${item?.id ?? item}: ${err.message}`);
      }
    }
  });
  await Promise.all(runners);
  return results;
}

async function fetchText(url, headers = {}) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml, */*", ...headers },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/* ─────────────────── Parseo de RSS/Atom ─────────────────── */

// Parser mínimo a base de expresiones regulares: en Node no hay DOMParser y no
// merece la pena arrastrar una dependencia para leer title/link/pubDate de un
// puñado de feeds bien formados.

function decodeEntities(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8216;|&lsquo;/g, "‘")
    .replace(/&#8220;|&ldquo;/g, "“")
    .replace(/&#8221;|&rdquo;/g, "”")
    .replace(/&#8212;|&mdash;/g, "—")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function firstTag(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decodeEntities(m[1]) : "";
}

function extractLink(block) {
  const plain = firstTag(block, "link");
  if (plain && /^https?:/i.test(plain)) return plain;
  // Atom: <link rel="alternate" href="..."/>
  const hrefs = [...block.matchAll(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?>/gi)];
  const alt = hrefs.find((m) => !/rel=["'](self|hub)["']/i.test(m[0]));
  return (alt || hrefs[0])?.[1] || "";
}

function parseFeed(xml, feed) {
  const blocks = [...xml.matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)].map((m) => m[0]);
  if (!blocks.length) throw new Error("sin artículos");

  const articles = [];
  for (const block of blocks.slice(0, MAX_ITEMS_PER_FEED)) {
    const title = firstTag(block, "title");
    if (!title) continue;

    const score = calcImpactScore(title);
    if (score < 0) continue; // ruido no cripto

    const rawDate =
      firstTag(block, "pubDate") || firstTag(block, "published") || firstTag(block, "updated");
    const parsed = safeDate(rawDate);

    articles.push({
      t: title,
      i: detectSentiment(title),
      coins: detectCoins(title),
      url: extractLink(block),
      source: feed.source,
      lang: feed.lang,
      priority: feed.priority,
      ts: parsed ? parsed.getTime() : Date.now(),
      score,
    });
  }
  return articles;
}

/* ─────────────────── Traducción ─────────────────── */

// Endpoint público de Google Translate: sin clave y con buena conservación de
// la jerga cripto. Si falla, el titular se queda en su idioma original y el
// navegador reintenta por su cuenta.
async function translateToSpanish(text) {
  try {
    const url =
      "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=" +
      encodeURIComponent(text);
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const out = (data?.[0] || []).map((c) => c?.[0] || "").join("").trim();
    return out || null;
  } catch {
    return null;
  }
}

/* ─────────────────── Principal ─────────────────── */

async function main() {
  console.log(`Descargando ${RSS_FEEDS.length} feeds…`);

  const batches = await withLimit(RSS_FEEDS, MAX_CONCURRENT, async (feed) => {
    const xml = await fetchText(feed.url);
    const articles = parseFeed(xml, feed);
    console.log(`  ✓ ${feed.id}: ${articles.length}`);
    return articles;
  });

  const all = batches.flat();
  if (!all.length) {
    // Sin artículos no se sobrescribe el JSON: es preferible publicar noticias
    // de ayer que una tarjeta vacía.
    console.error("Ningún feed respondió. Se conserva el news.json anterior.");
    process.exit(1);
  }

  // Deduplicar por titular normalizado y descartar lo viejo o con fecha futura.
  const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
  const horizon = Date.now() + 60 * 60 * 1000;
  const seen = new Set();
  const articles = all
    .filter((a) => {
      const key = a.t.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
      if (seen.has(key) || a.ts < cutoff || a.ts > horizon) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.score - a.score || b.ts - a.ts);

  // Traducir los mejores titulares en inglés; el resto se queda como está.
  const pending = articles.filter((a) => a.lang !== "es").slice(0, TRANSLATE_TOP);
  console.log(`Traduciendo ${pending.length} titulares…`);
  await withLimit(pending, MAX_CONCURRENT, async (article) => {
    const es = await translateToSpanish(article.t);
    if (es) article.es = es;
  });

  const translated = articles.filter((a) => a.es).length;
  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    articles,
  };

  await mkdir(dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify(payload), "utf8");

  console.log(
    `\nnews.json: ${articles.length} noticias · ${translated} traducidas · ` +
      `${new Set(articles.map((a) => a.source)).size} fuentes`
  );
}

main().catch((err) => {
  console.error("Fallo al generar las noticias:", err);
  process.exit(1);
});
