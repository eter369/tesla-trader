import { useState, useEffect, useRef, useCallback } from "react";

const BINANCE_WS = "wss://stream.binance.com:9443/ws";

const SYMBOL_MAP = {
  bitcoin: "btcusdt",
  ethereum: "ethusdt",
  solana: "solusdt",
};

export function useWebSocket() {
  const [livePrices, setLivePrices] = useState({});
  const [connected, setConnected] = useState(false);
  const [tickDirection, setTickDirection] = useState({});
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const prevPricesRef = useRef({});

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const streams = Object.values(SYMBOL_MAP).map(s => `${s}@ticker`).join("/");
    const ws = new WebSocket(`${BINANCE_WS}/${streams}`);

    ws.onopen = () => {
      setConnected(true);
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.e === "24hrTicker") {
          const symbol = data.s.toLowerCase();
          const cryptoId = Object.entries(SYMBOL_MAP).find(([, v]) => v === symbol)?.[0];
          if (!cryptoId) return;

          const price = parseFloat(data.c);
          const prevPrice = prevPricesRef.current[cryptoId];

          if (prevPrice && prevPrice !== price) {
            setTickDirection(prev => ({
              ...prev,
              [cryptoId]: price > prevPrice ? "up" : "down"
            }));
            setTimeout(() => {
              setTickDirection(prev => ({ ...prev, [cryptoId]: null }));
            }, 600);
          }

          prevPricesRef.current[cryptoId] = price;

          setLivePrices(prev => ({
            ...prev,
            [cryptoId]: {
              price,
              change24h: parseFloat(data.P),
              high24h: parseFloat(data.h),
              low24h: parseFloat(data.l),
              volume: parseFloat(data.v) * price,
              quoteVolume: parseFloat(data.q),
              trades: parseInt(data.n),
              lastUpdate: Date.now(),
            }
          }));
        }
      } catch (e) {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      setConnected(false);
      reconnectRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [connect]);

  return { livePrices, connected, tickDirection };
}
