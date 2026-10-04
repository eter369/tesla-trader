import { useEffect, useMemo, useState } from "react";
import { velasConCache } from "../utils/binance";
import { estadisticaPorFase, diasDeFase } from "../utils/estadisticaLunar";
import { fechaLima } from "../utils/lunar";
import { formatChange, numero, numeroConSigno, porcentaje } from "../utils/format";

const INICIO_BINANCE = Date.UTC(2017, 7, 1); // BTC/USDT cotiza en Binance desde agosto de 2017

function rangoDias(id) {
  const [a, b] = diasDeFase(id);
  return a < 0 ? `±${numero(b, 1)} días de la luna nueva` : `días ${numero(a, 1)} a ${numero(b, 1)} de la lunación`;
}

// Rendimiento diario de BTC según la fase lunar que usa la señal, desde 2017
export default function EstadisticaLunar() {
  const [velas, setVelas] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let vivo = true;
    velasConCache("BTCUSDT", "1d", INICIO_BINANCE)
      .then((v) => vivo && setVelas(v))
      .catch((e) => vivo && setError(e.message));
    return () => {
      vivo = false;
    };
  }, []);

  const est = useMemo(() => (velas && velas.length > 60 ? estadisticaPorFase(velas) : null), [velas]);

  if (!est) {
    return (
      <p className="text-xs text-gray-500 py-4" role="status">
        {error || "Descargando los días de BTC desde 2017 (solo la primera vez; luego quedan guardados en este navegador)…"}
      </p>
    );
  }

  const fecha = (ms) => fechaLima(ms, { day: "numeric", month: "short", year: "numeric" }).replace(".", "");

  return (
    <div className="mt-6">
      <h4 className="text-xs font-bold text-gray-300 mb-1">¿Qué dicen los datos? BTC por tramo lunar</h4>
      <p className="text-[10px] text-gray-500 mb-3">
        {numero(est.todos.n)} días de Binance (BTC/USDT), del {fecha(est.desde)} al {fecha(est.hasta)}, cortados a medianoche de Lima.
        Cada día se asigna al tramo lunar que usa la señal a mediodía.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[520px]">
          <caption className="sr-only">Rendimiento diario medio y porcentaje de días alcistas de BTC en cada tramo lunar, frente a todos los días</caption>
          <thead>
            <tr className="border-b border-gray-700/40 text-[10px] text-gray-500 tracking-wider">
              <th scope="col" className="text-left py-2 px-2 font-bold">TRAMO DE LA SEÑAL</th>
              <th scope="col" className="text-right py-2 px-2 font-bold">DÍAS</th>
              <th scope="col" className="text-right py-2 px-2 font-bold">REND. MEDIO</th>
              <th scope="col" className="text-right py-2 px-2 font-bold">DÍAS ALCISTAS</th>
              <th scope="col" className="text-right py-2 px-2 font-bold">¿SE DISTINGUE?</th>
            </tr>
          </thead>
          <tbody>
            {est.filas.map((f) => {
              const distinto = Math.abs(f.t) >= 2;
              return (
                <tr key={f.id} className="border-b border-gray-800/20">
                  <th scope="row" className="text-left py-2 px-2 font-normal">
                    <span className="font-bold text-gray-200">{f.icono} {f.nombre}</span>
                    <span className="block text-[10px] text-gray-500">{rangoDias(f.id)}</span>
                  </th>
                  <td className="text-right px-2 tabular-nums text-gray-300">{numero(f.n)}</td>
                  <td className="text-right px-2 tabular-nums" style={{ color: f.media >= 0 ? "#10b981" : "#ef4444" }}>{formatChange(f.media, 2)}</td>
                  <td className="text-right px-2 tabular-nums text-gray-300">{porcentaje(f.verdes, 1)}</td>
                  <td className="text-right px-2 text-[11px] font-bold" style={{ color: distinto ? "#10b981" : "#f59e0b" }} title={`t de Welch = ${numeroConSigno(f.t, 2)}`}>
                    {distinto ? "sí" : "no, ruido"} <span className="font-normal text-gray-500">(t {numeroConSigno(f.t, 1)})</span>
                  </td>
                </tr>
              );
            })}
            <tr className="text-gray-400">
              <th scope="row" className="text-left py-2 px-2 font-bold">Todos los días</th>
              <td className="text-right px-2 tabular-nums">{numero(est.todos.n)}</td>
              <td className="text-right px-2 tabular-nums">{formatChange(est.todos.media, 2)}</td>
              <td className="text-right px-2 tabular-nums">{porcentaje(est.todos.verdes, 1)}</td>
              <td className="text-right px-2 text-[10px] text-gray-500">referencia</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-gray-500 mt-3 leading-relaxed">
        Rendimiento medio: variación de apertura a cierre de cada día. «¿Se distingue?» compara el rendimiento de los días de ese
        tramo con el de los demás días (t de Welch): solo con |t| de 2 o más la diferencia sería difícil de atribuir al azar.
      </p>
      <p className="text-[10px] text-amber-400/70 mt-2 leading-relaxed">
        Aviso: es una estadística del pasado, no una predicción. Una correlación con la Luna no prueba que la Luna mueva el
        precio, y lo que pasó desde 2017 no garantiza lo que pasará. No es asesoría financiera.
      </p>
    </div>
  );
}
