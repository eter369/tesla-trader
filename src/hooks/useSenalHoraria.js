import { useEffect, useMemo, useState } from "react";
import { velasConCache } from "../utils/binance";
import { analizarVelas, DIAS_SEGUIMIENTO } from "../utils/senal";
import { generateSignal } from "../utils/lunar";

const DIA = 864e5;
// 90 días de seguimiento + 10 de margen para que RSI y MACD arranquen asentados
const DIAS_VELAS = DIAS_SEGUIMIENTO + 10;

// Señal Tesla 369 del par elegido, siempre sobre velas de 1 h (se actualiza cada minuto)
export function useSenalHoraria(symbol, lunarInfo) {
  const [datos, setDatos] = useState({ symbol: null, velas: null, error: null });

  useEffect(() => {
    let vivo = true;
    const cargar = async () => {
      try {
        const velas = await velasConCache(symbol, "1h", Date.now() - DIAS_VELAS * DIA);
        if (vivo) setDatos({ symbol, velas, error: null });
      } catch (e) {
        if (vivo) setDatos((d) => (d.symbol === symbol ? { ...d, error: e.message } : { symbol, velas: null, error: e.message }));
      }
    };
    cargar();
    const id = setInterval(cargar, 60000);
    return () => {
      vivo = false;
      clearInterval(id);
    };
  }, [symbol]);

  const velas = datos.symbol === symbol ? datos.velas : null;
  const analisis = useMemo(() => (velas && velas.length > 200 ? analizarVelas(velas) : null), [velas]);
  const senal = useMemo(
    () => (analisis && lunarInfo ? generateSignal(lunarInfo, analisis.rsi, analisis.macd, analisis.variacion24) : null),
    [analisis, lunarInfo],
  );

  return { senal, analisis, error: datos.symbol === symbol ? datos.error : null };
}
