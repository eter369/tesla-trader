import { useState, useMemo, useEffect } from "react";
import { useMoonPhase } from "./hooks/useMoonPhase";
import { useWebSocket } from "./hooks/useWebSocket";
import { useCryptoData, SIMBOLO_BINANCE } from "./hooks/useCryptoData";
import { useSenalHoraria } from "./hooks/useSenalHoraria";
import { calculateLunarSentiment } from "./utils/lunar";
import Header from "./components/Header";
import QuoteBanner from "./components/QuoteBanner";
import MoonPhaseCard from "./components/MoonPhaseCard";
import SentimentIndex from "./components/SentimentIndex";
import SignalPanel from "./components/SignalPanel";
import CryptoCards from "./components/CryptoCards";
import LunarCalendar from "./components/LunarCalendar";
import PortfolioSimulator from "./components/PortfolioSimulator";
import ChartSection from "./components/ChartSection";
import MasterSecret from "./components/MasterSecret";
import LunarCalendarAnual from "./components/LunarCalendarAnual";
import CryptoNews from "./components/CryptoNews";
import GlobalMetrics from "./components/GlobalMetrics";
import BackgroundVideo from "./components/BackgroundVideo";
import CenterVideo from "./components/CenterVideo";
import Footer from "./components/Footer";
import AmbientMusic from "./components/AmbientMusic";
import BibliotecaPage from "./components/BibliotecaPage";
import PortalLogin from "./components/PortalLogin";
import { hasFreshUnlock } from "./utils/portalAuth";

const CRYPTO_META = {
  bitcoin: { symbol: "BTC", name: "Bitcoin", color: "#f7931a", icon: "B" },
  ethereum: { symbol: "ETH", name: "Ethereum", color: "#627eea", icon: "E" },
  solana: { symbol: "SOL", name: "Solana", color: "#9945ff", icon: "S" },
};

// JS-detected breakpoint so AmbientMusic / CenterVideo render in exactly one
// place (mobile or desktop sidebar) — prevents duplicate <video> instances
// where pausing one wouldn't stop the other.
function useIsXl() {
  const [isXl, setIsXl] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 1280px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const handler = (e) => setIsXl(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isXl;
}

// Cielo de estrellas: posiciones pseudoaleatorias fijas (el mismo cielo en cada visita)
function azar(semilla) {
  let s = semilla;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}
const ESTRELLAS = (() => {
  const r = azar(369);
  return Array.from({ length: 80 }, (_, i) => ({
    id: i,
    width: r() * 2 + 0.5,
    left: r() * 100,
    top: r() * 100,
    opacity: r() * 0.4 + 0.05,
    duration: 2 + r() * 5,
    delay: r() * 4,
  }));
})();

function Starfield() {
  const stars = ESTRELLAS;

  return (
    <div className="starfield">
      {stars.map(s => (
        <div
          key={s.id}
          className="star"
          style={{
            width: s.width,
            height: s.width,
            left: `${s.left}%`,
            top: `${s.top}%`,
            opacity: s.opacity,
            animation: `twinkle ${s.duration}s ease-in-out infinite`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="min-h-screen app-bg flex items-center justify-center">
      <div className="text-center">
        <div className="text-7xl mb-6 animate-float">🌙</div>
        <div className="text-xl font-bold gold-text mb-2" role="status">Conectando con los ciclos lunares…</div>
        <div className="text-sm text-gray-500">Cargando datos del mercado cripto</div>
        <div className="flex gap-2 justify-center mt-6">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-amber-400/50 animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// URL-based routing: when pathname matches /biblioteca, render the dedicated
// page instead of the dashboard. Listens to popstate so back/forward works.
function usePathname() {
  const [path, setPath] = useState(() =>
    typeof window !== "undefined" ? window.location.pathname : "/"
  );
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return path;
}

function isBibliotecaPath(p) {
  return /^\/biblioteca\/?$/i.test(p || "");
}

// Entrar por URL directa a /biblioteca/ no debe saltarse el portal: pedimos la
// clave y volvemos al dashboard si el visitante cierra la puerta. La única
// excepción es venir de validarla hace un instante en el orbe — si no,
// preguntaría dos veces seguidas en el mismo trayecto.
function BibliotecaGate() {
  const [unlocked, setUnlocked] = useState(hasFreshUnlock);

  const goHome = () => {
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  if (unlocked) return <BibliotecaPage />;
  return <PortalLogin open onClose={goHome} onSuccess={() => setUnlocked(true)} />;
}

export default function App() {
  const pathname = usePathname();
  if (isBibliotecaPath(pathname)) {
    return <BibliotecaGate />;
  }
  return <Dashboard />;
}

function Dashboard() {
  const {
    currentTime,
    moonPhase,
    lunarInfo,
    illumination,
    lunarCalendar,
    detailedPhase,
    lunarAge,
    synodicMonth,
    nextMajorPhase,
    nextNewMoon,
    nextFullMoon,
  } = useMoonPhase();
  const { livePrices, connected, tickDirection } = useWebSocket();

  const [selectedCrypto, setSelectedCrypto] = useState(() => {
    try { return localStorage.getItem("lunar-selected-crypto") || "bitcoin"; }
    catch { return "bitcoin"; }
  });
  const [timeRange, setTimeRange] = useState(() => {
    try { return parseInt(localStorage.getItem("lunar-time-range")) || 7; }
    catch { return 7; }
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [fearGreed, setFearGreed] = useState(null);
  const isXl = useIsXl();

  const { marketData, priceHistory, loading, error, lastFetch, refetch } = useCryptoData(timeRange);

  // La señal y el sentimiento usan siempre velas de 1 h, sin importar el rango del gráfico
  const { senal, analisis, error: errorSenal } = useSenalHoraria(SIMBOLO_BINANCE[selectedCrypto], lunarInfo);
  const sentiment = useMemo(
    () => (analisis ? calculateLunarSentiment(moonPhase, analisis.rsi, analisis.volumenVs7d) : null),
    [analisis, moonPhase],
  );

  // Último dato recibido: el WebSocket si está vivo; si no, la última consulta REST
  const ultimoDato = Math.max(lastFetch || 0, ...Object.values(livePrices).map((p) => p.lastUpdate || 0)) || null;

  // Persist preferences
  useEffect(() => {
    try { localStorage.setItem("lunar-selected-crypto", selectedCrypto); } catch { /* sin almacenamiento */ }
  }, [selectedCrypto]);

  useEffect(() => {
    try { localStorage.setItem("lunar-time-range", timeRange.toString()); } catch { /* sin almacenamiento */ }
  }, [timeRange]);

  // Fetch Fear & Greed from CoinMarketCap + Alternative.me fallback (daily refresh + cache)
  useEffect(() => {
    const CACHE_KEY = "fng-cache";
    const ONE_DAY = 24 * 60 * 60 * 1000;

    function loadCache() {
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const cached = JSON.parse(raw);
        if (Date.now() - cached.ts < ONE_DAY) return cached.data;
      } catch { /* caché ilegible */ }
      return null;
    }

    function saveCache(data) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
      } catch { /* sin almacenamiento */ }
    }

    function parseCMC(d) {
      const latest = d.data[0];
      const history = d.data.map(item => ({
        value: Math.round(item.value),
        date: item.timestamp,
        classification: item.value_classification,
      })).reverse();
      return {
        value: Math.round(latest.value),
        classification: latest.value_classification,
        history,
        source: "CoinMarketCap",
      };
    }

    function parseAlternative(d) {
      const latest = d.data[0];
      const history = d.data.map(item => ({
        value: parseInt(item.value),
        date: new Date(parseInt(item.timestamp) * 1000).toISOString(),
        classification: item.value_classification,
      })).reverse();
      return {
        value: parseInt(latest.value),
        classification: latest.value_classification,
        history,
        source: "Alternative.me",
      };
    }

    async function fetchFearGreed() {
      let cmcKey = null;
      try { cmcKey = localStorage.getItem("cmc-api-key"); } catch { /* sin almacenamiento */ }

      if (cmcKey) {
        try {
          const res = await fetch("https://pro-api.coinmarketcap.com/v3/fear-and-greed/historical?limit=30", {
            headers: { "X-CMC_PRO_API_KEY": cmcKey, Accept: "application/json" },
          });
          if (!res.ok) throw new Error("CMC error");
          const json = await res.json();
          if (json?.data?.length > 0) {
            const result = parseCMC(json);
            setFearGreed(result);
            saveCache(result);
            return;
          }
        } catch { /* se usa Alternative.me */ }
      }

      try {
        const res = await fetch("https://api.alternative.me/fng/?limit=30");
        const json = await res.json();
        if (json?.data?.length > 0) {
          const result = parseAlternative(json);
          setFearGreed(result);
          saveCache(result);
        }
      } catch { /* queda el último valor guardado */ }
    }

    // Load cache immediately, then fetch fresh if stale
    const cached = loadCache();
    if (cached) {
      setFearGreed(cached);
    }
    fetchFearGreed();

    // Re-check every hour; fetchFearGreed uses cache-aware logic
    const interval = setInterval(fetchFearGreed, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading && Object.keys(marketData).length === 0) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen relative" style={{ background: "#050510" }}>
      <BackgroundVideo />
      <Starfield />


      <div className="relative z-10 w-full max-w-[1800px] mx-auto px-3 sm:px-4 py-4">
        <Header
          currentTime={currentTime}
          connected={connected}
          error={error}
          onRefresh={refetch}
          ultimoDato={ultimoDato}
        />

        <QuoteBanner />

        {/* Two-column layout: Main + News Sidebar */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
          {/* ─── Left: Main Dashboard ─── */}
          <div className="min-w-0">
            {/* Top Section: Moon + Sentiment + Signal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
              <MoonPhaseCard
                moonPhase={moonPhase}
                lunarInfo={lunarInfo}
                illumination={illumination}
                detailedPhase={detailedPhase}
                lunarAge={lunarAge}
                synodicMonth={synodicMonth}
                nextMajorPhase={nextMajorPhase}
                nextNewMoon={nextNewMoon}
                nextFullMoon={nextFullMoon}
                signal={senal}
              />
              <SentimentIndex
                sentiment={sentiment}
                lunarInfo={lunarInfo}
                detailedPhase={detailedPhase}
                analisis={analisis}
                fearGreed={fearGreed}
              />
              <SignalPanel
                senal={senal}
                analisis={analisis}
                lunarInfo={lunarInfo}
                detailedPhase={detailedPhase}
                simbolo={CRYPTO_META[selectedCrypto]?.symbol}
                error={errorSenal}
              />
            </div>

            {/* Lunar Calendar */}
            <LunarCalendar lunarCalendar={lunarCalendar} />

            {/* Crypto Cards */}
            <CryptoCards
              marketData={marketData}
              livePrices={livePrices}
              tickDirection={tickDirection}
              selectedCrypto={selectedCrypto}
              onSelect={setSelectedCrypto}
              rango={timeRange === 1 ? "último día" : `últimos ${timeRange} días`}
            />

            {/* Portfolio Simulator */}
            <PortfolioSimulator
              livePrices={livePrices}
              marketData={marketData}
            />

            {/* Charts */}
            <ChartSection
              priceHistory={priceHistory}
              selectedCrypto={selectedCrypto}
              cryptoMeta={CRYPTO_META}
              lunarInfo={lunarInfo}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              timeRange={timeRange}
              setTimeRange={setTimeRange}
              livePrice={livePrices[selectedCrypto]?.price}
            />

            {/* Mercado global: aquí en pantallas medianas y chicas; en xl va en la barra lateral (una sola instancia) */}
            {!isXl && <GlobalMetrics />}

            {/* Mobile-only: Visión Cósmica + Música Ambiental (sidebar items, surfaced for mobile).
                Rendered conditionally via JS so only ONE instance of each <video> exists in the DOM. */}
            {!isXl && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CenterVideo />
                <AmbientMusic />
              </div>
            )}

            {/* Calendario lunar del año, calculado con el motor lunar */}
            <LunarCalendarAnual />

            {/* Master Secret */}
            <MasterSecret />
          </div>

          {/* ─── Right: News Sidebar ─── */}
          {isXl && (
            <div>
              <div className="sticky top-4 overflow-y-auto scrollbar-hide" style={{ maxHeight: "calc(100vh - 2rem)" }}>
                <CryptoNews livePrices={livePrices} marketData={marketData} />
                <CenterVideo />
                <AmbientMusic />
                <GlobalMetrics />
              </div>
            </div>
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
}
