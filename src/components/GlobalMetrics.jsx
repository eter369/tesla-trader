import { useState, useEffect } from "react";
import { Globe, TrendingUp, TrendingDown, BarChart3, Coins, PieChart, Activity } from "lucide-react";
import { formatVolume as formatLargeNumber, formatChange, numero, porcentaje } from "../utils/format";
import { fechaLima } from "../utils/lunar";

function MetricRow({ icon, iconColor, label, value, sub, change }) {
  const Icon = icon;
  return (
    <div className="flex items-center gap-2.5 py-2 border-b border-gray-800/15 last:border-0">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${iconColor}12` }}
      >
        <Icon size={13} style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-gray-500 leading-tight">{label}</div>
        <div className="text-xs font-black text-gray-200 tabular-nums">{value}</div>
      </div>
      {change !== undefined && change !== null && (
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {change >= 0 ? (
            <TrendingUp size={10} className="text-emerald-400" />
          ) : (
            <TrendingDown size={10} className="text-red-400" />
          )}
          <span
            className="text-[10px] font-bold tabular-nums"
            style={{ color: change >= 0 ? "#10b981" : "#ef4444" }}
          >
            {formatChange(change, 1)}
          </span>
        </div>
      )}
      {sub && !change && change !== 0 && (
        <span className="text-[10px] text-gray-500 flex-shrink-0">{sub}</span>
      )}
    </div>
  );
}

function DominanceBar({ btc, eth }) {
  const other = Math.max(0, 100 - btc - eth);
  return (
    <div className="mt-1.5">
      <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-800">
        <div
          className="h-full transition-all duration-1000"
          style={{ width: `${btc}%`, background: "#f7931a" }}
          title={`BTC ${porcentaje(btc / 100, 1)}`}
        />
        <div
          className="h-full transition-all duration-1000"
          style={{ width: `${eth}%`, background: "#627eea" }}
          title={`ETH ${porcentaje(eth / 100, 1)}`}
        />
        <div
          className="h-full transition-all duration-1000"
          style={{ width: `${other}%`, background: "#4b5563" }}
          title={`Otros ${porcentaje(other / 100, 1)}`}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] font-bold" style={{ color: "#f7931a" }}>BTC {porcentaje(btc / 100, 1)}</span>
        <span className="text-[9px] font-bold" style={{ color: "#627eea" }}>ETH {porcentaje(eth / 100, 1)}</span>
        <span className="text-[9px] font-bold text-gray-500">Otros {porcentaje(other / 100, 1)}</span>
      </div>
    </div>
  );
}

async function pedirCMC(apiKey) {
  const res = await fetch("https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest", {
    headers: { "X-CMC_PRO_API_KEY": apiKey, Accept: "application/json" },
  });
  if (!res.ok) throw new Error("CoinMarketCap respondió " + res.status);
  const d = (await res.json())?.data;
  if (!d) throw new Error("CoinMarketCap sin datos");
  const usd = d.quote?.USD;
  return {
    source: "CoinMarketCap",
    metrics: {
      totalMarketCap: usd?.total_market_cap || 0,
      totalVolume24h: usd?.total_volume_24h || 0,
      marketCapChange24h: usd?.total_market_cap_yesterday_percentage_change || 0,
      btcDominance: d.btc_dominance || 0,
      ethDominance: d.eth_dominance || 0,
      activeCryptos: d.active_cryptocurrencies || 0,
      activeExchanges: d.active_exchanges || 0,
      tipoPlataformas: "exchanges",
      defiVolume24h: usd?.defi_volume_24h || 0,
      defiMarketCap: usd?.defi_market_cap || 0,
      stablecoinVolume24h: usd?.stablecoin_volume_24h || 0,
    },
  };
}

async function pedirCoinGecko() {
  const res = await fetch("https://api.coingecko.com/api/v3/global");
  if (!res.ok) throw new Error("CoinGecko respondió " + res.status);
  const d = (await res.json())?.data;
  if (!d) throw new Error("CoinGecko sin datos");
  return {
    source: "CoinGecko",
    metrics: {
      totalMarketCap: d.total_market_cap?.usd || 0,
      totalVolume24h: d.total_volume?.usd || 0,
      marketCapChange24h: d.market_cap_change_percentage_24h_usd || 0,
      btcDominance: d.market_cap_percentage?.btc || 0,
      ethDominance: d.market_cap_percentage?.eth || 0,
      activeCryptos: d.active_cryptocurrencies || 0,
      activeExchanges: d.markets || 0,
      tipoPlataformas: "mercados",
      defiVolume24h: null,
      defiMarketCap: null,
      stablecoinVolume24h: null,
    },
  };
}

// Último dato bueno guardado en el navegador: si la API limita los pedidos se
// muestra ese, con la hora en que se obtuvo.
const CLAVE_GLOBAL = "t369-mercado-global";
const CINCO_MIN = 5 * 60 * 1000;
function leerGuardado() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_GLOBAL)) || null;
  } catch {
    return null;
  }
}

export default function GlobalMetrics() {
  const [guardado] = useState(leerGuardado);
  const [metrics, setMetrics] = useState(guardado?.metrics ?? null);
  const [loading, setLoading] = useState(!guardado);
  const [source, setSource] = useState(guardado?.source ?? null);
  const [actualizado, setActualizado] = useState(guardado?.ts ?? null);

  // CoinMarketCap si la persona guardó su clave; si no (o si falla), CoinGecko. Cada 5 minutos.
  useEffect(() => {
    let vivo = true;
    const cargar = async () => {
      const previo = leerGuardado();
      if (previo && Date.now() - previo.ts < CINCO_MIN) return; // ya se muestra desde la caché
      let clave = null;
      try { clave = localStorage.getItem("cmc-api-key"); } catch { /* sin almacenamiento */ }
      let r = clave ? await pedirCMC(clave).catch(() => null) : null;
      if (!r) r = await pedirCoinGecko().catch(() => null);
      if (!vivo) return;
      if (r) {
        const ts = Date.now();
        setMetrics(r.metrics);
        setSource(r.source);
        setActualizado(ts);
        try { localStorage.setItem(CLAVE_GLOBAL, JSON.stringify({ ...r, ts })); } catch { /* sin almacenamiento */ }
      }
      setLoading(false);
    };
    cargar();
    const id = setInterval(cargar, CINCO_MIN);
    return () => {
      vivo = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="card rounded-2xl overflow-hidden mt-4 mb-5">
      {/* Top accent */}
      <div
        className="h-px"
        style={{ background: "linear-gradient(90deg, transparent, #10b98140, #22d3ee30, transparent)" }}
      />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-emerald-400" />
            <h3 className="text-xs font-black text-gray-200 tracking-tight">Mercado cripto global</h3>
          </div>
          {source && (
            <span className="text-[9px] text-gray-500 font-mono" title="Fuente y hora de Lima de la última consulta">
              {source}{actualizado ? ` · ${fechaLima(actualizado, { hour: "2-digit", minute: "2-digit", hour12: false })}` : ""}
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-3 py-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="skeleton w-7 h-7 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-2 w-1/3" />
                  <div className="skeleton h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : metrics ? (
          <>
            {/* Main metrics */}
            <MetricRow
              icon={BarChart3}
              iconColor="#10b981"
              label="Capitalización total (24 h)"
              value={formatLargeNumber(metrics.totalMarketCap)}
              change={metrics.marketCapChange24h}
            />
            <MetricRow
              icon={Activity}
              iconColor="#22d3ee"
              label={`Volumen global 24 h (${source})`}
              value={formatLargeNumber(metrics.totalVolume24h)}
            />
            <MetricRow
              icon={Coins}
              iconColor="#f59e0b"
              label="Criptomonedas activas"
              value={numero(metrics.activeCryptos)}
              sub={`${numero(metrics.activeExchanges)} ${metrics.tipoPlataformas}`}
            />

            {/* DeFi & Stablecoins (CMC only) */}
            {metrics.defiVolume24h > 0 && (
              <MetricRow
                icon={PieChart}
                iconColor="#a78bfa"
                label="Volumen DeFi 24 h"
                value={formatLargeNumber(metrics.defiVolume24h)}
                sub={`Cap.: ${formatLargeNumber(metrics.defiMarketCap)}`}
              />
            )}
            {metrics.stablecoinVolume24h > 0 && (
              <MetricRow
                icon={Coins}
                iconColor="#6ee7b7"
                label="Volumen de stablecoins 24 h"
                value={formatLargeNumber(metrics.stablecoinVolume24h)}
              />
            )}

            {/* Dominance bar */}
            <div className="mt-3 pt-2 border-t border-gray-800/20">
              <div className="text-[9px] text-gray-500 font-bold tracking-wider mb-1">DOMINANCIA</div>
              <DominanceBar btc={metrics.btcDominance} eth={metrics.ethDominance} />
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <span className="text-gray-600 text-xs">Sin datos disponibles</span>
          </div>
        )}
      </div>
    </div>
  );
}
