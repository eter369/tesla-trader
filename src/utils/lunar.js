// ─── Lunar Phase Engine ───

export function getMoonPhase(date = new Date()) {
  // Reference: known new moon — January 29, 2025 at 12:36 UTC
  const refNewMoon = Date.UTC(2025, 0, 29, 12, 36, 0);
  const synodicMonth = 29.53058867; // average synodic month in days
  const diffDays = (date.getTime() - refNewMoon) / 86400000;
  const phase = (diffDays / synodicMonth) % 1;
  return phase < 0 ? phase + 1 : phase;
}

export function getLunarPhaseInfo(phase) {
  if (phase < 0.0625 || phase >= 0.9375) {
    return {
      name: "Luna Nueva", nameEn: "new_moon", icon: "🌑",
      archetype: "Intención Seminal", signal: "Acumulación Silenciosa",
      action: "ACUMULAR", color: "#6366f1", bgColor: "from-indigo-900/40 to-indigo-800/20",
      description: "Baja claridad emocional. Ideal para sembrar intenciones y posiciones.",
      influence: "Acumulación Silenciosa", emotionalArchetype: "Intención Seminal",
      tradingBias: "bullish", emoji: "🌱", percentage: 0
    };
  } else if (phase < 0.3125) {
    return {
      name: "Cuarto Creciente", nameEn: "waxing", icon: "🌓",
      archetype: "Impulso y Confianza", signal: "Expansión de Intención",
      action: "ESPERAR", color: "#22d3ee", bgColor: "from-cyan-900/40 to-cyan-800/20",
      description: "Aumenta confianza y volumen. Primeras subidas. Expansión de intención.",
      influence: "Expansión de Intención", emotionalArchetype: "Impulso y Confianza",
      tradingBias: "bullish", emoji: "🚀", percentage: 25
    };
  } else if (phase < 0.5625) {
    return {
      name: "Luna Llena", nameEn: "full_moon", icon: "🌕",
      archetype: "Clímax (Pánico o Euforia)", signal: "Liberación Emocional",
      action: "PRECAUCIÓN", color: "#f59e0b", bgColor: "from-amber-900/40 to-amber-800/20",
      description: "Clímax de euforia o pánico. Alta volatilidad. El momento de la verdad.",
      influence: "Liberación Emocional", emotionalArchetype: "Clímax (Pánico o Euforia)",
      tradingBias: "volatile", emoji: "⚡", percentage: 50
    };
  } else {
    return {
      name: "Cuarto Menguante", nameEn: "waning", icon: "🌗",
      archetype: "Agotamiento y Tensión", signal: "Consolidación de Posiciones",
      action: "TOMAR GANANCIAS", color: "#ef4444", bgColor: "from-red-900/40 to-red-800/20",
      description: "Agotamiento de tendencia. Consolidación de ganancias. Búsqueda de un suelo emocional.",
      influence: "Consolidación de Posiciones", emotionalArchetype: "Agotamiento y Tensión",
      tradingBias: "bearish", emoji: "⚖️", percentage: 75
    };
  }
}

export function getMoonIllumination(phase) {
  return Math.round((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100);
}

export function calculateLunarSentiment(phase, rsiValue, volumeChange) {
  const lunarInfo = getLunarPhaseInfo(phase);
  let lunarScore = 50;
  if (lunarInfo.nameEn === "new_moon") lunarScore = 70;
  else if (lunarInfo.nameEn === "waxing") lunarScore = 65;
  else if (lunarInfo.nameEn === "full_moon") lunarScore = 40;
  else lunarScore = 35;

  const rsiScore = rsiValue > 70 ? 20 : rsiValue < 30 ? 80 : 50;
  const volScore = volumeChange > 20 ? 60 : volumeChange < -20 ? 40 : 50;

  const sentiment = Math.round(lunarScore * 0.4 + rsiScore * 0.35 + volScore * 0.25);
  let label = "NEUTRAL";
  let color = "#f59e0b";
  if (sentiment >= 70) { label = "EUFORIA → SOBRECOMPRA"; color = "#ef4444"; }
  else if (sentiment >= 60) { label = "OPTIMISMO"; color = "#22d3ee"; }
  else if (sentiment <= 30) { label = "PÁNICO → SOBREVENTA"; color = "#10b981"; }
  else if (sentiment <= 40) { label = "MIEDO"; color = "#f97316"; }

  return { score: sentiment, label, color };
}

export function generateSignal(lunarInfo, rsi, macdHist, priceChange) {
  let score = 0;
  if (lunarInfo.nameEn === "new_moon" || lunarInfo.nameEn === "waxing") score += 1;
  if (lunarInfo.nameEn === "full_moon") score -= 1;
  if (lunarInfo.nameEn === "waning") score -= 0.5;
  if (rsi < 30) score += 2;
  else if (rsi > 70) score -= 2;
  else if (rsi < 45) score += 0.5;
  else if (rsi > 55) score -= 0.5;
  if (macdHist > 0) score += 1; else score -= 1;
  if (priceChange > 5) score -= 0.5;
  if (priceChange < -5) score += 0.5;

  if (score >= 2) return { action: "ACUMULAR", color: "#10b981", icon: "🟢", desc: "Fase lunar favorable + indicadores alcistas" };
  if (score >= 0.5) return { action: "ESPERAR", color: "#22d3ee", icon: "🔵", desc: "Señales mixtas, mantener posición" };
  if (score >= -1) return { action: "PRECAUCIÓN", color: "#f59e0b", icon: "🟡", desc: "Volatilidad alta, proteger capital" };
  return { action: "TOMAR GANANCIAS", color: "#ef4444", icon: "🔴", desc: "Fase de agotamiento, asegurar beneficios" };
}

export const LUNAR_PHASES = [
  { icon: "🌑", name: "Luna Nueva", influence: "Acumulación Silenciosa", archetype: "Intención Seminal" },
  { icon: "🌓", name: "Cuarto Creciente", influence: "Expansión de Intención", archetype: "Impulso y Confianza" },
  { icon: "🌕", name: "Luna Llena", influence: "Liberación Emocional", archetype: "Clímax (Pánico o Euforia)" },
  { icon: "🌗", name: "Cuarto Menguante", influence: "Consolidación de Posiciones", archetype: "Agotamiento y Tensión" }
];

export const QUOTES = [
  "El mercado es un océano de emociones, la Luna es la marea que las gobierna.",
  "No sigas ciegamente, interpreta la marea. Tesla 369 lee las estrellas y los gráficos por igual.",
  "En la oscuridad de la Luna Nueva se siembran las fortunas que florecerán bajo la Luna Llena.",
  "El ciclo lunar te recuerda: todo máximo tiene su corrección, todo mínimo tiene su rebote.",
  "La paciencia del trader lunar es como la luna: silenciosa, constante, e inevitable.",
  "Quien entiende los ciclos no teme las caídas, pues sabe que toda noche oscura precede al amanecer.",
  "El sentimiento del mercado es el reflejo de la Luna en el agua: real en su efecto, ilusorio en su forma.",
  "La Luna no mueve los mercados — revela lo que los traders ya sienten pero no pueden ver.",
  "Cada fase lunar es un espejo: muestra tu codicia o tu miedo. Operar es conocerte a ti mismo.",
  "El verdadero edge no está en la Luna, sino en la disciplina de quien la observa."
];
