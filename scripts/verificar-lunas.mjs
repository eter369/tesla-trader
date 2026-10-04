// Compara el motor lunar (src/utils/lunar.js) con las fases publicadas por el
// Observatorio Naval de EE. UU. para 2026 y 2027. Uso: npm run verificar-lunas
// Falla (código 1) si alguna fase se desvía más de 10 minutos.
import { readFileSync } from "node:fs";
import { eventosLunares } from "../src/utils/lunar.js";

const TOLERANCIA_MIN = 10;
const { fases } = JSON.parse(readFileSync(new URL("./usno-fases-2026-2027.json", import.meta.url), "utf8"));
const TIPO = { "New Moon": "nueva", "First Quarter": "cuartoCreciente", "Full Moon": "llena", "Last Quarter": "cuartoMenguante" };

const calculadas = eventosLunares(Date.UTC(2025, 11, 25), Date.UTC(2028, 0, 7));
let peor = 0, fallos = 0;
for (const f of fases) {
  const [hh, mm] = f.time.split(":").map(Number);
  const oficial = Date.UTC(f.year, f.month - 1, f.day, hh, mm);
  const tipo = TIPO[f.phase];
  const propia = calculadas.filter((e) => e.tipo === tipo)
    .reduce((a, e) => (Math.abs(e.time - oficial) < Math.abs(a.time - oficial) ? e : a));
  const dif = (propia.time - oficial) / 60000; // minutos (el USNO redondea al minuto)
  peor = Math.max(peor, Math.abs(dif));
  if (Math.abs(dif) > TOLERANCIA_MIN) {
    fallos++;
    console.log(`✕ ${f.phase} ${f.year}-${f.month}-${f.day} ${f.time} UT · diferencia ${dif.toFixed(1)} min`);
  }
}
console.log(`${fases.length} fases comparadas · desviación máxima ${peor.toFixed(2)} min · tolerancia ±${TOLERANCIA_MIN} min`);
if (fallos) { console.log(`${fallos} fases fuera de tolerancia`); process.exit(1); }
console.log("✓ el motor lunar coincide con el USNO");
