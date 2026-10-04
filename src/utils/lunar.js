// ─── Motor lunar ───
// Un solo motor para todo el sitio. Las fases principales (luna nueva, cuarto
// creciente, luna llena, cuarto menguante) se calculan con el algoritmo de
// Jean Meeus, "Astronomical Algorithms" (2.ª ed., cap. 49), con todas sus
// correcciones periódicas; la iluminación, con la fórmula del cap. 48. Sirve
// para cualquier año y se valida contra las tablas del Observatorio Naval de
// EE. UU. (scripts/verificar-lunas.mjs). Las fechas se muestran en hora de
// Lima (UTC−5, sin horario de verano).

export const SYNODIC_MONTH = 29.530588861; // días (lunación media)
export const ZONA_LIMA = "America/Lima";
const DIA_MS = 86400000;
const RAD = Math.PI / 180;
const sen = (g) => Math.sin(g * RAD);
const cos = (g) => Math.cos(g * RAD);

// ΔT (TT − UT) en segundos: polinomios de Espenak y Meeus (NASA, 2006)
function deltaT(anio) {
  const t = anio - 2000;
  if (anio >= 2005 && anio < 2050) return 62.92 + 0.32217 * t + 0.005589 * t * t;
  if (anio >= 1986 && anio < 2005) {
    return 63.86 + 0.3345 * t - 0.060374 * t ** 2 + 0.0017275 * t ** 3 + 0.000651814 * t ** 4 + 0.00002373599 * t ** 5;
  }
  const u = (anio - 1820) / 100;
  return -20 + 32 * u * u;
}
const jdAMs = (jd) => (jd - 2440587.5) * DIA_MS;
const msAJd = (ms) => ms / DIA_MS + 2440587.5;

// Instante (ms, UT) de la fase `tipo` en la lunación k (k entero = luna nueva de esa lunación)
const FRACCION = { nueva: 0, cuartoCreciente: 0.25, llena: 0.5, cuartoMenguante: 0.75 };
export function instanteFase(k, tipo) {
  k = Math.floor(k) + FRACCION[tipo];
  const T = k / 1236.85;
  let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T ** 2 - 0.00000015 * T ** 3 + 0.00000000073 * T ** 4;
  const E = 1 - 0.002516 * T - 0.0000074 * T ** 2;
  const M = 2.5534 + 29.1053567 * k - 0.0000014 * T ** 2 - 0.00000011 * T ** 3;
  const Mp = 201.5643 + 385.81693528 * k + 0.0107582 * T ** 2 + 0.00001238 * T ** 3 - 0.000000058 * T ** 4;
  const F = 160.7108 + 390.67050284 * k - 0.0016118 * T ** 2 - 0.00000227 * T ** 3 + 0.000000011 * T ** 4;
  const Om = 124.7746 - 1.56375588 * k + 0.0020672 * T ** 2 + 0.00000215 * T ** 3;

  let c;
  if (tipo === "nueva" || tipo === "llena") {
    const n = tipo === "nueva";
    c = (n ? -0.4072 : -0.40614) * sen(Mp)
      + (n ? 0.17241 : 0.17302) * E * sen(M)
      + (n ? 0.01608 : 0.01614) * sen(2 * Mp)
      + (n ? 0.01039 : 0.01043) * sen(2 * F)
      + (n ? 0.00739 : 0.00734) * E * sen(Mp - M)
      - (n ? 0.00514 : 0.00515) * E * sen(Mp + M)
      + (n ? 0.00208 : 0.00209) * E * E * sen(2 * M)
      - 0.00111 * sen(Mp - 2 * F)
      - 0.00057 * sen(Mp + 2 * F)
      + 0.00056 * E * sen(2 * Mp + M)
      - 0.00042 * sen(3 * Mp)
      + 0.00042 * E * sen(M + 2 * F)
      + 0.00038 * E * sen(M - 2 * F)
      - 0.00024 * E * sen(2 * Mp - M)
      - 0.00017 * sen(Om)
      - 0.00007 * sen(Mp + 2 * M)
      + 0.00004 * sen(2 * Mp - 2 * F)
      + 0.00004 * sen(3 * M)
      + 0.00003 * sen(Mp + M - 2 * F)
      + 0.00003 * sen(2 * Mp + 2 * F)
      - 0.00003 * sen(Mp + M + 2 * F)
      + 0.00003 * sen(Mp - M + 2 * F)
      - 0.00002 * sen(Mp - M - 2 * F)
      - 0.00002 * sen(3 * Mp + M)
      + 0.00002 * sen(4 * Mp);
  } else {
    c = -0.62801 * sen(Mp)
      + 0.17172 * E * sen(M)
      - 0.01183 * E * sen(Mp + M)
      + 0.00862 * sen(2 * Mp)
      + 0.00804 * sen(2 * F)
      + 0.00454 * E * sen(Mp - M)
      + 0.00204 * E * E * sen(2 * M)
      - 0.0018 * sen(Mp - 2 * F)
      - 0.0007 * sen(Mp + 2 * F)
      - 0.0004 * sen(3 * Mp)
      - 0.00034 * E * sen(2 * Mp - M)
      + 0.00032 * E * sen(M + 2 * F)
      + 0.00032 * E * sen(M - 2 * F)
      - 0.00028 * E * E * sen(Mp + 2 * M)
      + 0.00027 * E * sen(2 * Mp + M)
      - 0.00017 * sen(Om)
      - 0.00005 * sen(Mp - M - 2 * F)
      + 0.00004 * sen(2 * Mp + 2 * F)
      - 0.00004 * sen(Mp + M + 2 * F)
      + 0.00004 * sen(Mp - 2 * M)
      + 0.00003 * sen(Mp + M - 2 * F)
      + 0.00003 * sen(3 * M)
      + 0.00002 * sen(2 * Mp - 2 * F)
      + 0.00002 * sen(Mp - M + 2 * F)
      - 0.00002 * sen(3 * Mp + M);
    const W = 0.00306 - 0.00038 * E * cos(M) + 0.00026 * cos(Mp) - 0.00002 * cos(Mp - M) + 0.00002 * cos(Mp + M) + 0.00002 * cos(2 * F);
    c += tipo === "cuartoCreciente" ? W : -W;
  }
  // correcciones planetarias comunes a todas las fases
  const A = [
    299.77 + 0.107408 * k - 0.009173 * T * T, 251.88 + 0.016321 * k, 251.83 + 26.651886 * k,
    349.42 + 36.412478 * k, 84.66 + 18.206239 * k, 141.74 + 53.303771 * k, 207.14 + 2.453732 * k,
    154.84 + 7.30686 * k, 34.52 + 27.261239 * k, 207.19 + 0.121824 * k, 291.34 + 1.844379 * k,
    161.72 + 24.198154 * k, 239.56 + 25.513099 * k, 331.55 + 3.592518 * k,
  ];
  const AC = [0.000325, 0.000165, 0.000164, 0.000126, 0.00011, 0.000062, 0.00006, 0.000056, 0.000047, 0.000042, 0.00004, 0.000037, 0.000035, 0.000023];
  jde += c + A.reduce((s, a, i) => s + AC[i] * sen(a), 0);
  const anio = 2000 + k / 12.3685;
  return jdAMs(jde - deltaT(anio) / 86400);
}

// lunación cuyo índice k queda cerca de un instante
const kCercano = (ms) => Math.floor((msAJd(ms) - 2451550.09766) / SYNODIC_MONTH);

// Lunas nuevas que encierran el instante: { previa, siguiente, k }
function lunacion(ms) {
  let k = kCercano(ms);
  let previa = instanteFase(k, "nueva");
  if (previa > ms) { k -= 1; previa = instanteFase(k, "nueva"); }
  let siguiente = instanteFase(k + 1, "nueva");
  if (siguiente <= ms) { k += 1; previa = siguiente; siguiente = instanteFase(k + 1, "nueva"); }
  return { previa, siguiente, k };
}

// Todas las fases principales entre dos instantes, en orden
export const ICONO_FASE = { nueva: "🌑", cuartoCreciente: "🌓", llena: "🌕", cuartoMenguante: "🌗" };
export const NOMBRE_FASE = { nueva: "Luna Nueva", cuartoCreciente: "Cuarto Creciente", llena: "Luna Llena", cuartoMenguante: "Cuarto Menguante" };
export function eventosLunares(desdeMs, hastaMs) {
  const out = [];
  for (let k = kCercano(desdeMs) - 1; k <= kCercano(hastaMs) + 1; k++) {
    for (const tipo of ["nueva", "cuartoCreciente", "llena", "cuartoMenguante"]) {
      const t = instanteFase(k, tipo);
      if (t >= desdeMs && t <= hastaMs) out.push({ tipo, time: t, nombre: NOMBRE_FASE[tipo], icono: ICONO_FASE[tipo] });
    }
  }
  return out.sort((a, b) => a.time - b.time);
}

// Fracción iluminada (0..1), Meeus cap. 48 (método de menor precisión, ±1 %)
export function iluminacion(ms) {
  const T = (msAJd(ms) - 2451545) / 36525;
  const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + T ** 3 / 545868 - T ** 4 / 113065000;
  const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + T ** 3 / 24490000;
  const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T + T ** 3 / 69699 - T ** 4 / 14712000;
  const i = 180 - D - 6.289 * sen(Mp) + 2.1 * sen(M) - 1.274 * sen(2 * D - Mp) - 0.658 * sen(2 * D) - 0.214 * sen(2 * Mp) - 0.11 * sen(D);
  return (1 + cos(i)) / 2;
}

// Estado de la Luna en un instante: fracción del ciclo según la lunación real
export function estadoLunar(fecha = new Date()) {
  const ms = fecha.getTime();
  const { previa, siguiente } = lunacion(ms);
  const duracion = (siguiente - previa) / DIA_MS;
  const edad = (ms - previa) / DIA_MS;
  return {
    fase: edad / duracion, // 0 = nueva, 0.5 = llena (por tiempo real, no media)
    edad, // días desde la última luna nueva
    duracion, // días de esta lunación (29.27 a 29.83)
    iluminacion: iluminacion(ms), // 0..1
    lunaNuevaPrevia: previa,
    lunaNuevaSiguiente: siguiente,
  };
}

// ─── Compatibilidad con los componentes ───
export function getMoonPhase(date = new Date()) {
  return estadoLunar(date).fase;
}
export function getLunarAge(phase, lunationDays = SYNODIC_MONTH) {
  return phase * lunationDays;
}

export function getDetailedPhaseName(phase) {
  const p = ((phase % 1) + 1) % 1;
  if (p < 0.03 || p >= 0.97) return { name: "Luna Nueva", icon: "🌑" };
  if (p < 0.22) return { name: "Luna Creciente", icon: "🌒" };
  if (p < 0.28) return { name: "Cuarto Creciente", icon: "🌓" };
  if (p < 0.47) return { name: "Gibosa Creciente", icon: "🌔" };
  if (p < 0.53) return { name: "Luna Llena", icon: "🌕" };
  if (p < 0.72) return { name: "Gibosa Menguante", icon: "🌖" };
  if (p < 0.78) return { name: "Cuarto Menguante", icon: "🌗" };
  return { name: "Luna Menguante", icon: "🌘" };
}

// Próxima fase principal (nueva, cuarto creciente, llena o cuarto menguante)
export function getNextMajorPhase(fromDate = new Date()) {
  const desde = fromDate.getTime();
  const ev = eventosLunares(desde + 1000, desde + 9 * DIA_MS)[0];
  const dias = (ev.time - desde) / DIA_MS;
  return { date: new Date(ev.time), tipo: ev.tipo, phase: { name: ev.nombre, icon: ev.icono }, daysFromNow: dias, hoursFromNow: dias * 24 };
}
function proxima(tipo, fromDate) {
  const desde = fromDate.getTime();
  return new Date(eventosLunares(desde + 1000, desde + 32 * DIA_MS).find((e) => e.tipo === tipo).time);
}
export const getNextNewMoon = (fromDate = new Date()) => proxima("nueva", fromDate);
export const getNextFullMoon = (fromDate = new Date()) => proxima("llena", fromDate);

// ─── Hora de Lima ───
const fmtCache = new Map();
export function fechaLima(ms, opciones) {
  const clave = JSON.stringify(opciones);
  let f = fmtCache.get(clave);
  if (!f) { f = new Intl.DateTimeFormat("es-PE", { timeZone: ZONA_LIMA, ...opciones }); fmtCache.set(clave, f); }
  return f.format(new Date(ms));
}
// "2026-10-10" en el calendario de Lima
export function diaLima(ms) {
  return fechaLima(ms, { year: "numeric", month: "2-digit", day: "2-digit" }).split("/").reverse().join("-");
}
// Días de calendario (en Lima) entre hoy y una fecha: 0 = hoy, 1 = mañana
export function diasCalendarioLima(ms, ahora = Date.now()) {
  const a = Date.parse(diaLima(ahora) + "T00:00:00Z"), b = Date.parse(diaLima(ms) + "T00:00:00Z");
  return Math.round((b - a) / DIA_MS);
}

// ─── Lunas llenas del año con su nombre tradicional ───
// Nombres del hemisferio norte (los que usa el almanaque): por mes, la segunda
// luna llena de un mismo mes es la "Luna Azul", y la más cercana al equinoccio
// de septiembre es la "Luna de la Cosecha"; la siguiente, la "del Cazador".
const LLENAS_POR_MES = [
  { nombre: "Luna del Lobo", emoji: "🐺" }, { nombre: "Luna de Nieve", emoji: "❄️" },
  { nombre: "Luna del Gusano", emoji: "🪱" }, { nombre: "Luna Rosa", emoji: "🌸" },
  { nombre: "Luna de las Flores", emoji: "🌺" }, { nombre: "Luna de Fresa", emoji: "🍓" },
  { nombre: "Luna del Ciervo", emoji: "🦌" }, { nombre: "Luna del Esturión", emoji: "🐟" },
  { nombre: "Luna del Maíz", emoji: "🌽" }, { nombre: "Luna del Cazador", emoji: "🏹" },
  { nombre: "Luna del Castor", emoji: "🦫" }, { nombre: "Luna Fría", emoji: "🥶" },
];
export function calendarioAnual(anio) {
  // margen de días para no perder lunas del 1 de enero o del 31 de diciembre en Lima
  const ev = eventosLunares(Date.UTC(anio, 0, 1) - 2 * DIA_MS, Date.UTC(anio + 1, 0, 1) + 2 * DIA_MS)
    .filter((e) => (e.tipo === "nueva" || e.tipo === "llena") && diaLima(e.time).startsWith(String(anio)));
  const llenas = ev.filter((e) => e.tipo === "llena");
  const equinoccio = Date.UTC(anio, 8, 22, 12);
  const cosecha = llenas.reduce((a, e) => (Math.abs(e.time - equinoccio) < Math.abs(a.time - equinoccio) ? e : a), llenas[0]);
  const porMes = {};
  return ev.map((e) => {
    if (e.tipo === "nueva") return { ...e, nombreTradicional: "Luna Nueva", emoji: "🌑" };
    const mes = Number(diaLima(e.time).slice(5, 7)) - 1;
    porMes[mes] = (porMes[mes] || 0) + 1;
    let t = LLENAS_POR_MES[mes];
    if (e === cosecha) t = { nombre: "Luna de la Cosecha", emoji: "🌾" };
    else if (cosecha && e.time > cosecha.time && e.time - cosecha.time < 31 * DIA_MS) t = { nombre: "Luna del Cazador", emoji: "🏹" };
    else if (porMes[mes] === 2) t = { nombre: "Luna Azul", emoji: "🔵" };
    return { ...e, nombreTradicional: t.nombre, emoji: t.emoji };
  });
}

// ─── Fases para el modelo (4 fases macro) ───
// Tramos de la lunación que usa la señal (en días de una lunación media):
// nueva ±1.8 · creciente 1.8–9.2 · llena 9.2–16.6 · menguante 16.6–27.7
export function getLunarPhaseInfo(phase) {
  if (phase < 0.0625 || phase >= 0.9375) {
    return {
      name: "Tramo de luna nueva", nameEn: "new_moon", icon: "🌑", dias: "±1.8 días de la luna nueva",
      archetype: "Intención Seminal", signal: "Acumulación Silenciosa",
      action: "ACUMULAR", color: "#6366f1", bgColor: "from-indigo-900/40 to-indigo-800/20",
      description: "Baja claridad emocional. Ideal para sembrar intenciones y posiciones.",
      influence: "Acumulación Silenciosa", emotionalArchetype: "Intención Seminal",
      tradingBias: "bullish", emoji: "🌱", percentage: 0,
    };
  } else if (phase < 0.3125) {
    return {
      name: "Tramo creciente", nameEn: "waxing", icon: "🌓", dias: "días 1.8 a 9.2 de la lunación",
      archetype: "Impulso y Confianza", signal: "Expansión de Intención",
      action: "ESPERAR", color: "#22d3ee", bgColor: "from-cyan-900/40 to-cyan-800/20",
      description: "Aumenta la confianza y el volumen. Primeras subidas. Expansión de intención.",
      influence: "Expansión de Intención", emotionalArchetype: "Impulso y Confianza",
      tradingBias: "bullish", emoji: "🚀", percentage: 25,
    };
  } else if (phase < 0.5625) {
    return {
      name: "Tramo de luna llena", nameEn: "full_moon", icon: "🌕", dias: "días 9.2 a 16.6 de la lunación",
      archetype: "Clímax (Pánico o Euforia)", signal: "Liberación Emocional",
      action: "PRECAUCIÓN", color: "#f59e0b", bgColor: "from-amber-900/40 to-amber-800/20",
      description: "Clímax de euforia o pánico. Alta volatilidad. El momento de la verdad.",
      influence: "Liberación Emocional", emotionalArchetype: "Clímax (Pánico o Euforia)",
      tradingBias: "volatile", emoji: "⚡", percentage: 50,
    };
  }
  return {
    name: "Tramo menguante", nameEn: "waning", icon: "🌗", dias: "días 16.6 a 27.7 de la lunación",
    archetype: "Agotamiento y Tensión", signal: "Consolidación de Posiciones",
    action: "TOMAR GANANCIAS", color: "#ef4444", bgColor: "from-red-900/40 to-red-800/20",
    description: "Agotamiento de tendencia. Consolidación de ganancias. Búsqueda de un suelo emocional.",
    influence: "Consolidación de Posiciones", emotionalArchetype: "Agotamiento y Tensión",
    tradingBias: "bearish", emoji: "⚖️", percentage: 75,
  };
}

// Iluminación aproximada a partir de la fracción del ciclo (solo para dibujar la luna)
export function getMoonIllumination(phase) {
  return Math.round(((1 - Math.cos(phase * 2 * Math.PI)) / 2) * 100);
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

// ─── Señal Tesla 369 ───
// Puntaje: fase lunar + RSI + histograma MACD + variación de 24 h. Devuelve el
// aporte de cada factor para que la tarjeta muestre por qué está en ese estado.
export const ESTADOS_SENAL = {
  "ACUMULAR": { color: "#10b981", icon: "🟢", dir: 1 },
  "ESPERAR": { color: "#22d3ee", icon: "🔵", dir: 0 },
  "PRECAUCIÓN": { color: "#f59e0b", icon: "🟡", dir: -1 },
  "TOMAR GANANCIAS": { color: "#ef4444", icon: "🔴", dir: -1 },
};
export function puntajeSenal(lunarInfo, rsi, macdHist, priceChange) {
  const aportes = [];
  let lun = 0;
  if (lunarInfo.nameEn === "new_moon" || lunarInfo.nameEn === "waxing") lun = 1;
  else if (lunarInfo.nameEn === "full_moon") lun = -1;
  else if (lunarInfo.nameEn === "waning") lun = -0.5;
  aportes.push({ id: "luna", puntos: lun });
  let r = 0;
  if (rsi < 30) r = 2;
  else if (rsi > 70) r = -2;
  else if (rsi < 45) r = 0.5;
  else if (rsi > 55) r = -0.5;
  aportes.push({ id: "rsi", puntos: r });
  aportes.push({ id: "macd", puntos: macdHist > 0 ? 1 : -1 });
  aportes.push({ id: "var24", puntos: priceChange > 5 ? -0.5 : priceChange < -5 ? 0.5 : 0 });
  return { score: aportes.reduce((s, a) => s + a.puntos, 0), aportes };
}
export function estadoDePuntaje(score) {
  if (score >= 2) return "ACUMULAR";
  if (score >= 0.5) return "ESPERAR";
  if (score >= -1) return "PRECAUCIÓN";
  return "TOMAR GANANCIAS";
}
const DESC_SENAL = {
  "ACUMULAR": "Fase lunar favorable e indicadores alcistas",
  "ESPERAR": "Señales mixtas: mantener la posición",
  "PRECAUCIÓN": "Puntaje neutro o algo negativo: proteger el capital",
  "TOMAR GANANCIAS": "Factores en contra: asegurar beneficios",
};
export function generateSignal(lunarInfo, rsi, macdHist, priceChange) {
  const { score, aportes } = puntajeSenal(lunarInfo, rsi, macdHist, priceChange);
  const action = estadoDePuntaje(score);
  return { action, ...ESTADOS_SENAL[action], desc: DESC_SENAL[action], score, aportes };
}

export const LUNAR_PHASES = [
  { id: "new_moon", icon: "🌑", name: "Tramo de luna nueva", dias: "±1.8 días", influence: "Acumulación Silenciosa", archetype: "Intención Seminal" },
  { id: "waxing", icon: "🌓", name: "Tramo creciente", dias: "días 1.8–9.2", influence: "Expansión de Intención", archetype: "Impulso y Confianza" },
  { id: "full_moon", icon: "🌕", name: "Tramo de luna llena", dias: "días 9.2–16.6", influence: "Liberación Emocional", archetype: "Clímax (Pánico o Euforia)" },
  { id: "waning", icon: "🌗", name: "Tramo menguante", dias: "días 16.6–27.7", influence: "Consolidación de Posiciones", archetype: "Agotamiento y Tensión" },
];

export const QUOTES = [
  "El mercado es un océano de emociones; la Luna es la marea que las gobierna.",
  "No sigas ciegamente, interpreta la marea. Tesla 369 lee las estrellas y los gráficos por igual.",
  "En la oscuridad de la Luna Nueva se siembran las fortunas que florecerán bajo la Luna Llena.",
  "El ciclo lunar te recuerda: todo máximo tiene su corrección, todo mínimo tiene su rebote.",
  "La paciencia del trader lunar es como la luna: silenciosa, constante e inevitable.",
  "Quien entiende los ciclos no teme las caídas, pues sabe que toda noche oscura precede al amanecer.",
  "El sentimiento del mercado es el reflejo de la Luna en el agua: real en su efecto, ilusorio en su forma.",
  "La Luna no mueve los mercados: revela lo que los traders ya sienten pero no pueden ver.",
  "Cada fase lunar es un espejo: muestra tu codicia o tu miedo. Operar es conocerte a ti mismo.",
  "La verdadera ventaja no está en la Luna, sino en la disciplina de quien la observa.",
];
