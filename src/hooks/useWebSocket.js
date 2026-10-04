import { useState, useEffect } from "react";

const BINANCE_WS = "wss://stream.binance.com:9443/ws";

const SYMBOL_MAP = {
  bitcoin: "btcusdt",
  ethereum: "ethusdt",
  solana: "solusdt",
};
const POR_SIMBOLO = Object.fromEntries(Object.entries(SYMBOL_MAP).map(([id, s]) => [s, id]));

// Precios en vivo por WebSocket de Binance. Los mensajes llegan varias veces
// por segundo; se juntan y la pantalla se actualiza una vez por segundo para
// no recalcular todo el tablero con cada tick.
export function useWebSocket() {
  const [livePrices, setLivePrices] = useState({});
  const [connected, setConnected] = useState(false);
  const [tickDirection, setTickDirection] = useState({});

  useEffect(() => {
    let ws = null;
    let reintento = null;
    let cerrado = false;
    let pendientes = {};
    const previos = {};

    const conectar = () => {
      if (cerrado) return;
      try {
        const streams = Object.values(SYMBOL_MAP).map((s) => `${s}@ticker`).join("/");
        ws = new WebSocket(`${BINANCE_WS}/${streams}`);
        ws.onopen = () => setConnected(true);
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.e !== "24hrTicker") return;
            const id = POR_SIMBOLO[data.s.toLowerCase()];
            if (!id) return;
            const price = parseFloat(data.c);
            pendientes[id] = {
              price,
              change24h: parseFloat(data.P),
              high24h: parseFloat(data.h),
              low24h: parseFloat(data.l),
              volume: parseFloat(data.v) * price,
              quoteVolume: parseFloat(data.q),
              trades: parseInt(data.n),
              lastUpdate: Date.now(),
            };
          } catch {
            // mensaje ilegible: se ignora
          }
        };
        ws.onclose = () => {
          setConnected(false);
          ws = null;
          if (!cerrado) reintento = setTimeout(conectar, 3000);
        };
        ws.onerror = () => {
          try { ws?.close(); } catch { /* ya estaba cerrado */ }
        };
      } catch {
        reintento = setTimeout(conectar, 5000);
      }
    };

    // Una actualización por segundo con lo que llegó
    const volcar = setInterval(() => {
      const ids = Object.keys(pendientes);
      if (!ids.length) return;
      const lote = pendientes;
      pendientes = {};
      const direccion = {};
      for (const id of ids) {
        const antes = previos[id];
        if (antes && antes !== lote[id].price) direccion[id] = lote[id].price > antes ? "up" : "down";
        previos[id] = lote[id].price;
      }
      setLivePrices((prev) => ({ ...prev, ...lote }));
      if (Object.keys(direccion).length) {
        setTickDirection((prev) => ({ ...prev, ...direccion }));
        setTimeout(() => {
          setTickDirection((prev) => {
            const limpio = { ...prev };
            for (const id of Object.keys(direccion)) limpio[id] = null;
            return limpio;
          });
        }, 600);
      }
    }, 1000);

    conectar();
    return () => {
      cerrado = true;
      clearTimeout(reintento);
      clearInterval(volcar);
      try { ws?.close(); } catch { /* ya estaba cerrado */ }
    };
  }, []);

  return { livePrices, connected, tickDirection };
}
