import { Star, Rocket, Activity, Eye, Shield } from "lucide-react";

export default function MasterSecret() {
  return (
    <div className="card rounded-2xl p-5 mb-5">
      <h3 className="text-sm font-black gold-text mb-4 flex items-center gap-2">
        <Star size={16} className="text-amber-400" /> EL SECRETO DE TESLA 369
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
          {[
            { icon: Rocket, color: "text-amber-400", text: <>No operan solo con la Luna. Ella es su <span className="text-amber-400 font-bold">reloj emocional</span>.</> },
            { icon: Activity, color: "text-cyan-400", text: "Operan la interseccion con indicadores tecnicos (MACD, RSI) + sentimiento social." },
            { icon: Eye, color: "text-purple-400", text: "No sigas ciegamente, interpreta la marea." },
            { icon: Shield, color: "text-emerald-400", text: "La gestion de riesgo siempre prevalece sobre cualquier senal esoterica." },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <p key={i} className="flex items-start gap-2.5">
                <Icon size={16} className={`${item.color} mt-0.5 flex-shrink-0`} />
                <span>{item.text}</span>
              </p>
            );
          })}
        </div>
        <div className="p-5 rounded-xl bg-gradient-to-br from-amber-900/10 to-amber-800/5 border border-amber-700/20">
          <p className="text-[10px] text-amber-400/50 font-black tracking-[0.2em] mb-2">LA LEY DEL ESPEJO LUNAR</p>
          <p className="text-sm text-gray-300 leading-relaxed">
            La Luna rige el inconsciente colectivo de los mercados. La intensidad de la energia lunar amplifica la proyeccion emocional de los traders.
          </p>
          <div className="flex gap-3 mt-4">
            <div className="flex-1 p-3 rounded-lg bg-red-900/10 border border-red-800/20 text-center">
              <p className="text-red-400 text-xs font-black">EUFORIA</p>
              <p className="text-gray-500 text-[11px]">= Sobrecompra</p>
            </div>
            <div className="flex-1 p-3 rounded-lg bg-emerald-900/10 border border-emerald-800/20 text-center">
              <p className="text-emerald-400 text-xs font-black">PANICO</p>
              <p className="text-gray-500 text-[11px]">= Sobreventa</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
