export function formatPrice(p) {
  if (!p && p !== 0) return "$0";
  if (p >= 1000) return "$" + p.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (p >= 1) return "$" + p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return "$" + p.toFixed(4);
}

export function formatPricePrecise(p) {
  if (!p && p !== 0) return "$0.00";
  if (p >= 1000) return "$" + p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 1) return "$" + p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return "$" + p.toFixed(6);
}

export function formatVolume(v) {
  if (!v) return "$0";
  if (v >= 1e12) return "$" + (v / 1e12).toFixed(2) + "T";
  if (v >= 1e9) return "$" + (v / 1e9).toFixed(2) + "B";
  if (v >= 1e6) return "$" + (v / 1e6).toFixed(1) + "M";
  if (v >= 1e3) return "$" + (v / 1e3).toFixed(1) + "K";
  return "$" + v.toLocaleString();
}

export function formatChange(change) {
  if (change === null || change === undefined) return "0.00%";
  const sign = change >= 0 ? "+" : "";
  return sign + change.toFixed(2) + "%";
}

export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
