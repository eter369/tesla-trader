import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Newspaper, Clock, Star, RefreshCw } from "lucide-react";
import {
  fetchCryptoNews,
  buildSections,
  readCache,
  formatTimeAgo,
  formatDate,
  impactLevel,
  COIN_COLORS,
  REFRESH_MS,
} from "../utils/cryptoNews";
import { translateBatch, getCachedTranslation } from "../utils/translate";

const IMPACT = {
  bullish: { color: "#10b981", arrow: "↑" },
  bearish: { color: "#ef4444", arrow: "↓" },
  neutral: { color: "#a78bfa", arrow: "→" },
};

function PriceTicker({ livePrices, marketData }) {
  const tickers = useMemo(() => {
    const map = { bitcoin: "BTC", ethereum: "ETH", solana: "SOL" };
    const colors = { bitcoin: "#f7931a", ethereum: "#627eea", solana: "#9945ff" };
    return Object.entries(map).map(([id, symbol]) => {
      const live = livePrices?.[id];
      const market = marketData?.[id];
      const price = live?.price ?? market?.current_price ?? 0;
      const change = live?.change24h ?? market?.price_change_percentage_24h ?? 0;
      const up = change >= 0;
      return { symbol, price, change, up, color: colors[id] };
    });
  }, [livePrices, marketData]);

  const formatPrice = (p) => {
    if (p >= 1000) return "$" + p.toLocaleString("en-US", { maximumFractionDigits: 0 });
    if (p >= 1) return "$" + p.toFixed(2);
    return "$" + p.toFixed(4);
  };

  return (
    <div className="grid grid-cols-3 gap-1.5 mb-3">
      {tickers.map((t) => (
        <div key={t.symbol} className="rounded-lg p-2 text-center"
          style={{ background: `linear-gradient(135deg, ${t.color}08, ${t.color}04)`, border: `1px solid ${t.color}15` }}>
          <div className="text-[10px] font-bold text-gray-400 tracking-wider">{t.symbol}</div>
          <div className="text-xs font-black text-gray-200 tabular-nums mt-0.5">{formatPrice(t.price)}</div>
          <div className="text-[10px] font-bold tabular-nums mt-0.5" style={{ color: t.up ? "#10b981" : "#ef4444" }}>
            {t.up ? "↑" : "↓"} {t.up ? "+" : ""}{t.change.toFixed(1)}%
          </div>
        </div>
      ))}
    </div>
  );
}

// Barras de impacto: hacen verificable de un vistazo que la lista está
// ordenada por importancia y no por fecha.
function ImpactBars({ level }) {
  return (
    <span className="flex items-end gap-px flex-shrink-0" title={`Impacto ${level.label}`}>
      {[3, 5, 7].map((h, i) => (
        <span key={h} className="w-[2px] rounded-sm"
          style={{
            height: h,
            background: i < level.bars ? level.color : "#ffffff14",
          }} />
      ))}
    </span>
  );
}

function NewsRow({ d, rank, isTop, delay }) {
  const impact = IMPACT[d.i] || IMPACT.neutral;
  const level = impactLevel(d.score || 0);
  // Los titulares en inglés se muestran traducidos; el original queda en el
  // tooltip para poder contrastarlo.
  const title = d.display || d.t;
  const isTranslated = title !== d.t;

  return (
    <a href={d.url} target="_blank" rel="noopener noreferrer"
      className="group relative block py-2.5 border-b border-gray-800/20 last:border-0 animate-slide-in cursor-pointer"
      style={{ animationDelay: `${delay}s` }}>
      <div className="flex items-start gap-2.5">
        <div className="mt-1 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-black"
          style={{ background: `${impact.color}15`, color: impact.color }}>
          {impact.arrow}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="text-[8px] font-black text-gray-700 font-mono tabular-nums">
              {String(rank).padStart(2, "0")}
            </span>
            <ImpactBars level={level} />
            {isTop && (
              <span className="text-[8px] font-black tracking-widest text-amber-400 bg-amber-400/10 px-1.5 py-px rounded flex items-center gap-0.5">
                <Star size={7} fill="currentColor" /> TOP
              </span>
            )}
            {d.source && (
              <span className="text-[7px] font-bold tracking-wider px-1.5 py-px rounded"
                style={{ color: "#9ca3af", background: "#ffffff06" }}>
                {d.source}
              </span>
            )}
            <span className="text-[9px] text-gray-700 font-mono ml-auto">{formatTimeAgo(d.ts)}</span>
          </div>
          <h4 className="text-[11px] font-bold text-gray-200 leading-snug mb-1 group-hover:text-amber-300/90 transition-colors"
            title={isTranslated ? `Original: ${d.t}` : undefined}>
            {title}
          </h4>
          <div className="flex items-center gap-1 flex-wrap">
            {d.coins?.slice(0, 3).map((c) => (
              <span key={c} className="text-[7px] font-bold px-1.5 py-px rounded"
                style={{ color: COIN_COLORS[c] || "#9ca3af", background: (COIN_COLORS[c] || "#9ca3af") + "12" }}>
                {c}
              </span>
            ))}
            <span className="text-[8px] text-gray-700 font-mono ml-auto">{formatDate(d.ts)}</span>
          </div>
        </div>
      </div>
    </a>
  );
}

export default function CryptoNews({ livePrices, marketData }) {
  // Arrancamos con lo que haya en caché: la tarjeta se pinta al instante y el
  // fetch de red solo la actualiza.
  const [articles, setArticles] = useState(() => readCache()?.articles || null);
  const [fetchedAt, setFetchedAt] = useState(() => readCache()?.fetchedAt || null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  // Reloj que avanza cada minuto: mantiene ciertos los "hace 2h" y el corte
  // semana/hoy sin volver a pedir datos.
  const [now, setNow] = useState(() => Date.now());

  // { títuloOriginal: títuloEnEspañol } para las fuentes en inglés.
  const [translations, setTranslations] = useState({});

  const inFlight = useRef(false);

  const loadNews = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      const result = await fetchCryptoNews();
      if (result?.articles?.length) {
        setArticles(result.articles);
        setFetchedAt(result.fetchedAt);
        setFailed(result.stale);
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  // Carga inicial + refresco periódico
  useEffect(() => {
    loadNews();
    const interval = setInterval(loadNews, REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadNews]);

  // Reloj de 1 minuto: mantiene vivos los "hace X" y detecta el cambio de día.
  useEffect(() => {
    let lastDay = new Date().getDate();
    const id = setInterval(() => {
      setNow(Date.now());
      const today = new Date().getDate();
      if (today !== lastDay) {
        // Cruzamos la medianoche: "NOTICIAS DE HOY" debe repoblarse.
        lastDay = today;
        loadNews();
      }
    }, 60 * 1000);
    return () => clearInterval(id);
  }, [loadNews]);

  // Al volver a la pestaña, refrescamos si los datos ya están viejos. Sin esto
  // un portátil que estuvo suspendido mostraba noticias de días atrás.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!fetchedAt || Date.now() - fetchedAt > REFRESH_MS) loadNews();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", loadNews);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", loadNews);
    };
  }, [fetchedAt, loadNews]);

  const news = useMemo(() => buildSections(articles, now), [articles, now]);

  // Traduce los titulares en inglés que estén a la vista. Solo los visibles
  // (~11), no los 160 descargados, y una vez cada uno gracias a la caché.
  useEffect(() => {
    if (!news) return;
    const pending = [...news.top, ...news.other]
      .filter((a) => a.lang !== "es" && !a.es && !translations[a.t] && !getCachedTranslation(a.t))
      .map((a) => a.t);
    if (!pending.length) return;

    let cancelled = false;
    translateBatch(pending).then((map) => {
      if (!cancelled && Object.keys(map).length) {
        setTranslations((prev) => ({ ...prev, ...map }));
      }
    });
    return () => { cancelled = true; };
    // `translations` queda fuera de las deps a propósito: se actualiza dentro
    // del propio efecto e incluirlo lo re-dispararía en bucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [news]);

  // Sustituye cada titular por su versión en español cuando exista. `a.es` es
  // la traducción que ya viene hecha en el JSON pre-generado.
  const localized = useMemo(() => {
    if (!news) return null;
    const toEs = (a) => ({
      ...a,
      display: a.es || translations[a.t] || getCachedTranslation(a.t) || a.t,
    });
    return { ...news, top: news.top.map(toEs), other: news.other.map(toEs) };
  }, [news, translations]);

  const updated = fetchedAt
    ? new Date(fetchedAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
    : "—";
  const isStale = fetchedAt ? now - fetchedAt > REFRESH_MS * 2 : true;

  return (
    <div className="card rounded-2xl overflow-hidden flex flex-col h-full">
      <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, #7c3aed40, #a855f730, transparent)" }} />

      <div className="p-4 flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Newspaper size={14} className="text-purple-400" />
            <h3 className="text-sm font-black text-gray-200 tracking-tight">Crypto Weekly</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadNews} disabled={loading}
              className="p-1 rounded hover:bg-white/5 transition-colors text-gray-600 hover:text-gray-400 disabled:opacity-50"
              title="Actualizar noticias">
              <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
            </button>
            <span className="text-[9px] text-gray-600 font-mono flex items-center gap-1" title="Última actualización">
              <Clock size={9} /> {updated}
            </span>
            <div className={`w-1.5 h-1.5 rounded-full ${isStale ? "bg-amber-500" : "bg-emerald-400 animate-pulse"}`}
              title={isStale ? "Datos sin refrescar" : "Al día"} />
          </div>
        </div>

        {/* Week range + sources */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] text-gray-600 font-mono tracking-wider">{news?.week || "---"}</span>
          {news?.source && (
            <span className="text-[7px] text-gray-700 font-mono truncate ml-2 max-w-[160px]" title={`${news.sourceCount} fuentes`}>
              {news.source}
            </span>
          )}
        </div>

        <PriceTicker livePrices={livePrices} marketData={marketData} />

        <div className="h-px mb-3" style={{ background: "linear-gradient(90deg, #7c3aed15, #ffffff08, transparent)" }} />

        {/* News Feed */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {loading && !news ? (
            <div className="space-y-4 py-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className="skeleton w-5 h-5 rounded flex-shrink-0" style={{ animationDelay: `${i * 0.15}s` }} />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-2 w-1/3" />
                    <div className="skeleton h-3 w-full" />
                    <div className="skeleton h-2 w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : localized ? (
            <>
              {localized.top.length > 0 && (
                <>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-[8px] font-black tracking-[3px] text-amber-400/50">TOP NOTICIAS DE LA SEMANA</span>
                    <span className="text-[7px] text-gray-700 font-mono">POR IMPACTO</span>
                  </div>
                  {localized.top.map((d, i) => (
                    <NewsRow key={d.url || `top-${i}`} d={d} rank={i + 1} isTop delay={i * 0.05} />
                  ))}
                </>
              )}

              {localized.other.length > 0 && (
                <>
                  <div className="h-px my-2" style={{ background: "linear-gradient(90deg, transparent, #7c3aed15, transparent)" }} />
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-[8px] font-black tracking-[3px] text-purple-400/40">NOTICIAS DE HOY</span>
                    <span className="text-[7px] text-gray-700 font-mono">POR IMPACTO</span>
                  </div>
                  {localized.other.map((d, i) => (
                    <NewsRow key={d.url || `other-${i}`} d={d} rank={i + 1} isTop={false} delay={(i + 3) * 0.05} />
                  ))}
                </>
              )}
            </>
          ) : (
            <div className="text-center py-6 text-gray-600 text-xs">
              {loading ? "Buscando noticias…" : "Sin noticias disponibles"}
              {failed && !loading && (
                <button onClick={loadNews} className="block mx-auto mt-2 text-[10px] text-purple-400/70 hover:text-purple-300 underline">
                  Reintentar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-auto border-t border-gray-800/20 text-center">
          <span className="text-[8px] text-gray-700 font-mono tracking-[2px]">
            CRYPTO WEEKLY · {new Date().toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }).toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
