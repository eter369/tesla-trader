import { useState, useMemo, useEffect } from "react";
import { useMoonPhase } from "./hooks/useMoonPhase";
import { useWebSocket } from "./hooks/useWebSocket";
import { useCryptoData } from "./hooks/useCryptoData";
import { calculateRSI, calculateMACD, calculateBollingerBands } from "./utils/indicators";
import { calculateLunarSentiment, generateSignal } from "./utils/lunar";
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
import LunarCalendar2026 from "./components/LunarCalendar2026";
import CryptoNews from "./components/CryptoNews";
import GlobalMetrics from "./components/GlobalMetrics";
import BackgroundVideo from "./components/BackgroundVideo";
import CenterVideo from "./components/CenterVideo";
import Footer from "./components/Footer";
import AmbientMusic from "./components/AmbientMusic";
import MysticPortal from "./components/MysticPortal";

const CRYPTO_META = {
  bitcoin: { symbol: "BTC", name: "Bitcoin", color: "#f7931a", icon: "B" },
  ethereum: { symbol: "ETH", name: "Ethereum", color: "#627eea", icon: "E" },
  solana: { symbol: "SOL", name: "Solana", color: "#9945ff", icon: "S" },
};

// Starfield background
function Starfield() {
  const stars = useMemo(() =>
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      width: Math.random() * 2 + 0.5,
      left: Math.random() * 100,
      top: Math.random() * 100,
      opacity: Math.random() * 0.4 + 0.05,
      duration: 2 + Math.random() * 5,
      delay: Math.random() * 4,
    }))
  , []);

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
        <div className="text-xl font-bold gold-text mb-2">Conectando con los ciclos lunares...</div>
        <div className="text-sm text-gray-500">Cargando datos del mercado crypto</div>
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

export default function App() {
  const { currentTime, moonPhase, lunarInfo, illumination, nextPhaseDate, lunarCalendar } = useMoonPhase();
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

  const { marketData, priceHistory, loading, error, refetch } = useCryptoData(timeRange);

  // Compute indicators at the App level to avoid setState-during-render
  const indicators = useMemo(() => {
    const hist = priceHistory[selectedCrypto];
    if (!hist?.prices) return null;
    const prices = hist.prices.map(p => p[1]);
    const rsi = calculateRSI(prices);
    const macd = calculateMACD(prices);
    const bollinger = calculateBollingerBands(prices);
    const currentRSI = rsi.length > 0 ? rsi[rsi.length - 1].value : 50;
    const currentMACD = macd.length > 0 ? macd[macd.length - 1] : { macd: 0, signal: 0, histogram: 0 };

    const coin = marketData[selectedCrypto];
    const priceChange = coin?.price_change_percentage_24h || 0;
    const volChange = coin ? ((coin.total_volume / (coin.market_cap * 0.02)) - 1) * 100 : 0;

    const sentiment = calculateLunarSentiment(moonPhase, currentRSI, volChange);
    const signal = generateSignal(lunarInfo, currentRSI, currentMACD.histogram, priceChange);

    return { rsi, macd, bollinger, currentRSI, currentMACD, sentiment, signal, prices };
  }, [priceHistory, selectedCrypto, marketData, moonPhase, lunarInfo]);

  // Persist preferences
  useEffect(() => {
    try { localStorage.setItem("lunar-selected-crypto", selectedCrypto); } catch {}
  }, [selectedCrypto]);

  useEffect(() => {
    try { localStorage.setItem("lunar-time-range", timeRange.toString()); } catch {}
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
      } catch {}
      return null;
    }

    function saveCache(data) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
      } catch {}
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
      const cmcKey = localStorage.getItem("cmc-api-key");

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
        } catch {}
      }

      try {
        const res = await fetch("https://api.alternative.me/fng/?limit=30");
        const json = await res.json();
        if (json?.data?.length > 0) {
          const result = parseAlternative(json);
          setFearGreed(result);
          saveCache(result);
        }
      } catch {}
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

  const coin = marketData[selectedCrypto];
  const priceChange24h = livePrices[selectedCrypto]?.change24h ?? coin?.price_change_percentage_24h ?? 0;

  if (loading && Object.keys(marketData).length === 0) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen relative" style={{ background: "#050510" }}>
      <BackgroundVideo />
      <Starfield />

      {/* Portal Místico — orbe circular fijo arriba al centro */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-30">
        <MysticPortal compact displaySize={90} />
      </div>

      <div className="relative z-10 w-full max-w-[1800px] mx-auto px-3 sm:px-4 py-4">
        <Header
          currentTime={currentTime}
          connected={connected}
          error={error}
          onRefresh={refetch}
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
                nextPhaseDate={nextPhaseDate}
              />
              <SentimentIndex
                sentiment={indicators?.sentiment}
                lunarInfo={lunarInfo}
                currentRSI={indicators?.currentRSI ?? 50}
                currentMACD={indicators?.currentMACD ?? { histogram: 0 }}
                fearGreed={fearGreed}
              />
              <SignalPanel
                signal={indicators?.signal}
                lunarInfo={lunarInfo}
                currentRSI={indicators?.currentRSI ?? 50}
                currentMACD={indicators?.currentMACD ?? { histogram: 0 }}
                priceChange24h={priceChange24h}
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
              marketData={marketData}
              lunarInfo={lunarInfo}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              timeRange={timeRange}
              setTimeRange={setTimeRange}
              indicators={indicators}
              livePrice={livePrices[selectedCrypto]?.price}
            />

            {/* Global Markets - visible on all screens (hidden on xl where sidebar shows it) */}
            <div className="xl:hidden">
              <GlobalMetrics />
            </div>

            {/* Lunar Calendar 2026 */}
            <LunarCalendar2026 />

            {/* Master Secret */}
            <MasterSecret />
          </div>

          {/* ─── Right: News Sidebar ─── */}
          <div className="hidden xl:block">
            <div className="sticky top-4 overflow-y-auto scrollbar-hide" style={{ maxHeight: "calc(100vh - 2rem)" }}>
              <CryptoNews livePrices={livePrices} marketData={marketData} />
              <CenterVideo />
              <AmbientMusic />
              <GlobalMetrics />
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
