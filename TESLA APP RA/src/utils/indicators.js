// ─── Technical Indicators ───

export function calculateRSI(prices, period = 14) {
  if (!prices || prices.length < period + 1) return [];
  const rsi = [];
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period; i < prices.length; i++) {
    if (i > period) {
      const diff = prices[i] - prices[i - 1];
      avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
      avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
    }
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push({ index: i, value: Math.round(100 - 100 / (1 + rs)) });
  }
  return rsi;
}

function ema(data, period) {
  const k = 2 / (period + 1);
  const result = [data[0]];
  for (let i = 1; i < data.length; i++) {
    result.push(data[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

export function calculateMACD(prices, fast = 12, slow = 26, signal = 9) {
  if (!prices || prices.length < slow + signal) return [];
  const emaFast = ema(prices, fast);
  const emaSlow = ema(prices, slow);
  const macdLine = emaFast.map((v, i) => v - emaSlow[i]).slice(slow - 1);
  const signalLine = ema(macdLine, signal);
  return macdLine.slice(signal - 1).map((v, i) => ({
    index: i,
    macd: Math.round(v * 100) / 100,
    signal: Math.round(signalLine[i + signal - 1] * 100) / 100,
    histogram: Math.round((v - signalLine[i + signal - 1]) * 100) / 100
  }));
}

export function calculateBollingerBands(prices, period = 20, mult = 2) {
  if (!prices || prices.length < period) return [];
  const bands = [];
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const sma = slice.reduce((a, b) => a + b, 0) / period;
    const std = Math.sqrt(slice.reduce((sum, v) => sum + Math.pow(v - sma, 2), 0) / period);
    bands.push({
      index: i,
      upper: Math.round((sma + mult * std) * 100) / 100,
      middle: Math.round(sma * 100) / 100,
      lower: Math.round((sma - mult * std) * 100) / 100,
      price: prices[i]
    });
  }
  return bands;
}
