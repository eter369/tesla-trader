import { useState, useEffect, useMemo } from "react";
import {
  estadoLunar,
  eventosLunares,
  getLunarPhaseInfo,
  getDetailedPhaseName,
  getNextMajorPhase,
  getNextNewMoon,
  getNextFullMoon,
  fechaLima,
  diaLima,
} from "../utils/lunar";

// Mediodía de Lima (17:00 UT) del día de calendario `n` días desde hoy
function mediodiaLima(n, ahora) {
  const [a, m, d] = diaLima(ahora).split("-").map(Number);
  return Date.UTC(a, m - 1, d + n, 17, 0, 0);
}

export function useMoonPhase() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // la Luna se recalcula una vez por minuto: el reloj de la cabecera sigue al segundo
  const minuto = Math.floor(currentTime.getTime() / 60000);
  const lunar = useMemo(() => {
    const ahora = new Date(minuto * 60000);
    const estado = estadoLunar(ahora);
    return {
      moonPhase: estado.fase,
      lunarInfo: getLunarPhaseInfo(estado.fase),
      illumination: Math.round(estado.iluminacion * 100),
      detailedPhase: getDetailedPhaseName(estado.fase),
      lunarAge: estado.edad,
      synodicMonth: estado.duracion,
      nextMajorPhase: getNextMajorPhase(ahora),
      nextNewMoon: getNextNewMoon(ahora),
      nextFullMoon: getNextFullMoon(ahora),
    };
  }, [minuto]);

  // Calendario de ayer a 7 días, por días de Lima: la iluminación es la del
  // mediodía y, si ese día hay una fase principal, el día lleva su icono y su hora.
  const diaHoy = diaLima(currentTime.getTime());
  const lunarCalendar = useMemo(() => {
    const ahora = Date.parse(diaHoy + "T17:00:00Z");
    const eventos = eventosLunares(mediodiaLima(-2, ahora), mediodiaLima(9, ahora));
    const days = [];
    for (let i = -1; i <= 7; i++) {
      const mediodia = mediodiaLima(i, ahora);
      const dia = diaLima(mediodia);
      const estado = estadoLunar(new Date(mediodia));
      const evento = eventos.find((e) => diaLima(e.time) === dia) || null;
      const info = getLunarPhaseInfo(estado.fase);
      days.push({
        date: new Date(mediodia),
        dayLabel: i === 0 ? "Hoy" : i === 1 ? "Mañana" : fechaLima(mediodia, { weekday: "short" }).replace(".", ""),
        dateLabel: fechaLima(mediodia, { day: "numeric", month: "short" }).replace(".", ""),
        phase: evento ? { ...info, icon: evento.icono, name: evento.nombre } : { ...info, icon: getDetailedPhaseName(estado.fase).icon },
        evento: evento ? { nombre: evento.nombre, hora: fechaLima(evento.time, { hour: "2-digit", minute: "2-digit", hour12: false }) } : null,
        illumination: Math.round(estado.iluminacion * 100),
        isToday: i === 0,
      });
    }
    return days;
  }, [diaHoy]);

  return { currentTime, ...lunar, lunarCalendar };
}
