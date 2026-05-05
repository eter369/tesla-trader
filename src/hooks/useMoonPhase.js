import { useState, useEffect, useMemo } from "react";
import {
  getMoonPhase,
  getLunarPhaseInfo,
  getMoonIllumination,
  getDetailedPhaseName,
  getNextMajorPhase,
  getNextNewMoon,
  getNextFullMoon,
  getLunarAge,
  SYNODIC_MONTH,
} from "../utils/lunar";

export function useMoonPhase() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const moonPhase = getMoonPhase(currentTime);
  const lunarInfo = getLunarPhaseInfo(moonPhase);
  const illumination = getMoonIllumination(moonPhase);
  const detailedPhase = getDetailedPhaseName(moonPhase);
  const lunarAge = getLunarAge(moonPhase);
  const nextMajorPhase = getNextMajorPhase(currentTime);
  const nextNewMoon = useMemo(() => getNextNewMoon(currentTime), [currentTime.toDateString()]);
  const nextFullMoon = useMemo(() => getNextFullMoon(currentTime), [currentTime.toDateString()]);

  const nextPhaseDate = useMemo(() => {
    for (let i = 1; i <= 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const p = getMoonPhase(d);
      const info = getLunarPhaseInfo(p);
      if (info.name !== lunarInfo.name) {
        return { date: d, phase: info };
      }
    }
    return null;
  }, [lunarInfo.name]);

  const lunarCalendar = useMemo(() => {
    const days = [];
    for (let i = -1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const p = getMoonPhase(d);
      const info = getLunarPhaseInfo(p);
      const illum = getMoonIllumination(p);
      days.push({
        date: new Date(d),
        dayLabel: i === 0 ? "Hoy" : i === 1 ? "Mañana" : d.toLocaleDateString("es-ES", { weekday: "short" }),
        dateLabel: d.toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
        phase: info,
        illumination: illum,
        isToday: i === 0,
      });
    }
    return days;
  }, [currentTime.toDateString()]);

  return {
    currentTime,
    moonPhase,
    lunarInfo,
    illumination,
    nextPhaseDate,
    lunarCalendar,
    detailedPhase,
    lunarAge,
    synodicMonth: SYNODIC_MONTH,
    nextMajorPhase,
    nextNewMoon,
    nextFullMoon,
  };
}
