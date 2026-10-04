import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { velasRecientes } from "../utils/binance";

// Pares de Binance. La oferta circulante solo se usa si CoinGecko no responde:
// en ese caso la capitalización se marca como "aprox.".
const CRYPTOS = {
  bitcoin:  { symbol: "BTCUSDT", supply: 19_850_000 },
  ethereum: { symbol: "ETHUSDT", supply: 120_300_000 },
  solana:   { symbol: "SOLUSDT", supply: 440_000_000 },
};
const CRYPTO_IDS = Object.keys(CRYPTOS);
export const SIMBOLO_BINANCE = Object.fromEntries(CRYPTO_IDS.map((id) => [id, CRYPTOS[id].symbol]));

// Rango del gráfico → intervalo de vela de Binance (~100 velas legibles por rango)
export const VELAS_POR_RANGO = {
  1:  { interval: "15m", limit: 96,  etiqueta: "15 min" },
  7:  { interval: "2h",  limit: 84,  etiqueta: "2 h" },
  30: { interval: "6h",  limit: 120, etiqueta: "6 h" },
  90: { interval: "1d",  limit: 90,  etiqueta: "1 día" },
};
export const velasDeRango = (dias) => VELAS_POR_RANGO[dias] || VELAS_POR_RANGO[7];

// Capitalización de mercado de CoinGecko (caché de 5 minutos en el navegador)
const CLAVE_CAP = "t369-capitalizacion";
const CINCO_MIN = 5 * 60 * 1000;
function leerCapitalizacion() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_CAP)) || null;
  } catch {
    return null;
  }
}
async function pedirCapitalizacion() {
  const guardada = leerCapitalizacion();
  if (guardada && Date.now() - guardada.ts < CINCO_MIN) return guardada;
  const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${CRYPTO_IDS.join(",")}&vs_currencies=usd&include_market_cap=true`);
  if (!res.ok) throw new Error(`CoinGecko respondió ${res.status}`);
  const json = await res.json();
  const datos = { ts: Date.now(), caps: Object.fromEntries(CRYPTO_IDS.map((id) => [id, json[id]?.usd_market_cap || null])) };
  try {
    localStorage.setItem(CLAVE_CAP, JSON.stringify(datos));
  } catch {
    // sin almacenamiento: se vuelve a pedir en 5 minutos
  }
  return datos;
}

export function useCryptoData(timeRange = 7) {
  const [mercado, setMercado] = useState({});
  const [priceHistory, setPriceHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [capitalizacion, setCapitalizacion] = useState(leerCapitalizacion);
  const hasDataRef = useRef(false);
  const [vuelta, setVuelta] = useState(0);
  const refetch = useCallback(() => setVuelta((v) => v + 1), []);

  // Precios y velas del rango elegido; se repite cada minuto (el precio en vivo llega por WebSocket)
  useEffect(() => {
    let vivo = true;
    const cargar = async () => {
      try {
        const { interval, limit } = velasDeRango(timeRange);
        const tickers = CRYPTO_IDS.map(async (id) => {
          const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${CRYPTOS[id].symbol}`);
          if (res.status === 429 || res.status === 418) throw new Error("Binance pidió esperar: reintento en un minuto");
          if (!res.ok) throw new Error(`Binance respondió ${res.status}`);
          return res.json();
        });
        const velas = CRYPTO_IDS.map((id) => velasRecientes(CRYPTOS[id].symbol, interval, limit));
        const [t, k] = await Promise.all([Promise.all(tickers), Promise.all(velas)]);
        if (!vivo) return;

        const nuevoMercado = {};
        const nuevoHistorial = {};
        CRYPTO_IDS.forEach((id, i) => {
          const ticker = t[i];
          nuevoMercado[id] = {
            id,
            current_price: parseFloat(ticker.lastPrice),
            price_change_percentage_24h: parseFloat(ticker.priceChangePercent),
            total_volume: parseFloat(ticker.quoteVolume), // volumen de 24 h del par en Binance (USDT)
            high_24h: parseFloat(ticker.highPrice),
            low_24h: parseFloat(ticker.lowPrice),
            price_change_24h: parseFloat(ticker.priceChange),
            sparkline: k[i].map((v) => v[4]),
          };
          nuevoHistorial[id] = {
            interval,
            velas: k[i], // [apertura, open, high, low, close, volumen USDT]
            prices: k[i].map((v) => [v[0], v[4]]),
          };
        });
        setMercado(nuevoMercado);
        setPriceHistory(nuevoHistorial);
        hasDataRef.current = true;
        setLoading(false);
        setError(null);
        setLastFetch(Date.now());
      } catch (err) {
        if (!vivo) return;
        // con datos previos en pantalla se avisa igual, sin borrar lo que hay
        setError(hasDataRef.current ? "Sin respuesta de Binance: se muestran los últimos datos" : err.message);
        setLoading(false);
      }
    };
    cargar();
    const id = setInterval(cargar, 60000);
    return () => {
      vivo = false;
      clearInterval(id);
    };
  }, [timeRange, vuelta]);

  useEffect(() => {
    let vivo = true;
    const cargar = () =>
      pedirCapitalizacion()
        .then((d) => vivo && setCapitalizacion(d))
        .catch(() => {});
    cargar();
    const id = setInterval(cargar, CINCO_MIN);
    return () => {
      vivo = false;
      clearInterval(id);
    };
  }, []);

  // Capitalización: CoinGecko si hay dato; si no, precio × oferta circulante (aprox.)
  const marketData = useMemo(() => {
    const out = {};
    for (const id of Object.keys(mercado)) {
      const real = capitalizacion?.caps?.[id];
      out[id] = {
        ...mercado[id],
        market_cap: real || Math.round(mercado[id].current_price * CRYPTOS[id].supply),
        market_cap_fuente: real ? "CoinGecko" : "aprox.",
      };
    }
    return out;
  }, [mercado, capitalizacion]);

  return { marketData, priceHistory, loading, error, lastFetch, refetch };
}
