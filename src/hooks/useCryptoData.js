import { useState, useEffect, useCallback, useRef } from "react";

// Binance symbols + approximate circulating supply for market cap calculation
const CRYPTOS = {
  bitcoin:  { symbol: "BTCUSDT",  supply: 19_850_000 },
  ethereum: { symbol: "ETHUSDT",  supply: 120_300_000 },
  solana:   { symbol: "SOLUSDT",  supply: 440_000_000 },
};

const CRYPTO_IDS = Object.keys(CRYPTOS);

// Map timeRange (days) to Binance kline interval + limit
function getKlineParams(days) {
  if (days <= 1)  return { interval: "5m",  limit: 288 };  // 5min × 288 = 24h
  if (days <= 7)  return { interval: "1h",  limit: 168 };  // 1h × 168 = 7d
  if (days <= 30) return { interval: "4h",  limit: 180 };  // 4h × 180 = 30d
  return              { interval: "1d",  limit: days };     // 1d × N
}

export function useCryptoData(timeRange = 7) {
  const [marketData, setMarketData] = useState({});
  const [priceHistory, setPriceHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const hasDataRef = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      if (!hasDataRef.current) setError(null);

      const { interval, limit } = getKlineParams(timeRange);

      // Fetch all tickers + klines in parallel from Binance
      const tickerPromises = CRYPTO_IDS.map(id =>
        fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${CRYPTOS[id].symbol}`)
      );
      const klinePromises = CRYPTO_IDS.map(id =>
        fetch(`https://api.binance.com/api/v3/klines?symbol=${CRYPTOS[id].symbol}&interval=${interval}&limit=${limit}`)
      );

      const responses = await Promise.all([...tickerPromises, ...klinePromises]);

      // Check for errors
      for (const res of responses) {
        if (!res.ok) {
          if (res.status === 429) throw new Error("Binance rate limit. Reintentando...");
          if (res.status === 418) throw new Error("Binance IP ban temporal. Espera unos minutos.");
          throw new Error(`Binance API error: ${res.status}`);
        }
      }

      // Parse tickers (first half of responses)
      const tickers = await Promise.all(responses.slice(0, CRYPTO_IDS.length).map(r => r.json()));
      // Parse klines (second half)
      const klines = await Promise.all(responses.slice(CRYPTO_IDS.length).map(r => r.json()));

      // Build marketData (same shape components expect)
      const newMarketData = {};
      tickers.forEach((ticker, i) => {
        const id = CRYPTO_IDS[i];
        const price = parseFloat(ticker.lastPrice);
        const klineData = klines[i] || [];

        // Extract last 24 close prices for sparkline
        const sparklinePrices = klineData.slice(-24).map(k => parseFloat(k[4]));

        newMarketData[id] = {
          id,
          current_price: price,
          price_change_percentage_24h: parseFloat(ticker.priceChangePercent),
          price_change_percentage_1h_in_currency: null,
          price_change_percentage_7d_in_currency: null,
          total_volume: parseFloat(ticker.quoteVolume),
          market_cap: Math.round(price * CRYPTOS[id].supply),
          high_24h: parseFloat(ticker.highPrice),
          low_24h: parseFloat(ticker.lowPrice),
          price_change_24h: parseFloat(ticker.priceChange),
          sparkline_in_7d: { price: sparklinePrices },
        };
      });
      setMarketData(newMarketData);
      hasDataRef.current = true;

      // Build priceHistory (same shape ChartSection expects)
      const newPriceHistory = {};
      klines.forEach((klineData, i) => {
        const id = CRYPTO_IDS[i];
        // Kline format: [openTime, open, high, low, close, volume, closeTime, quoteVolume, ...]
        newPriceHistory[id] = {
          prices: klineData.map(k => [k[0], parseFloat(k[4])]),         // [timestamp, close]
          total_volumes: klineData.map(k => [k[0], parseFloat(k[7])]),  // [timestamp, quoteVolume]
        };
      });
      setPriceHistory(newPriceHistory);

      setLoading(false);
      setError(null);
      setLastFetch(new Date());
    } catch (err) {
      if (!hasDataRef.current) {
        setError(err.message);
      }
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
    // Binance REST is generous — refresh every 30s
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { marketData, priceHistory, loading, error, lastFetch, refetch: fetchData };
}
