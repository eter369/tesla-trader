import { useState, useEffect } from "react";
import { QUOTES } from "../utils/lunar";

export default function QuoteBanner() {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex(i => (i + 1) % QUOTES.length);
        setFading(false);
      }, 400);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="card rounded-xl p-4 mb-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5" />
      <p
        className={`text-amber-300/80 italic text-sm leading-relaxed relative z-10 transition-all duration-400 ${fading ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}
      >
        &ldquo;{QUOTES[index]}&rdquo;
      </p>
      <p className="text-amber-600/40 text-xs mt-2 relative z-10">
        &mdash; Tesla 369
      </p>
      <div className="flex justify-center gap-1 mt-2">
        {QUOTES.map((_, i) => (
          <div
            key={i}
            className={`w-1 h-1 rounded-full transition-all duration-300 ${i === index ? "bg-amber-400 w-3" : "bg-gray-700"}`}
          />
        ))}
      </div>
    </div>
  );
}
