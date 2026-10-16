import { ArrowUpRight, ShieldAlert } from 'lucide-react';
import { riskInfo } from './RiskBadge';

/**
 * @param {object} zone — ZoneRisque.properties (quartier, niveau_risque, score_risque_moyen)
 * @param {object} prediction — PredictionIA correspondante (confiance, niveau_eau_predit_cm), optionnelle
 * @param {() => void} onExploreMap
 * @param {string} className
 */
export default function GaugeRisk({ zone, prediction, onExploreMap, className = '' }) {
  if (!zone) {
    return (
      <div className={`rounded-3xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-[#071322] p-5 shadow-xs flex items-center justify-center text-xs text-navy-400 ${className}`}>
        Aucune zone à risque enregistrée pour l’instant.
      </div>
    );
  }

  const { label, hex } = riskInfo(zone.niveau_risque);
  const scorePercent = Math.round(Number(zone.score_risque_moyen ?? 0) * 100);
  const circumference = 440;
  const strokeDashoffset = circumference - (circumference * scorePercent) / 100;

  return (
    <div className={`rounded-3xl border border-navy-100 dark:border-navy-800 bg-white dark:bg-[#071322] p-5 shadow-xs transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[1.025] hover:-translate-y-1.5 hover:shadow-2xl hover:border-navy-300 dark:hover:border-navy-600 will-change-transform flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red/15 text-[#CC131A] dark:text-red-400 flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={16} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black uppercase tracking-wider text-navy-900 dark:text-white truncate">
              Risque Inondation
            </h3>
            <p className="text-[11px] text-navy-500 dark:text-navy-400 truncate">
              {zone.quartier || 'Thiaroye'}
            </p>
          </div>
        </div>
        <span
          className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide text-white flex-shrink-0 shadow-xs"
          style={{ backgroundColor: hex }}
        >
          {label}
        </span>
      </div>

      <div className="relative flex items-center justify-center my-2">
        <svg className="w-44 h-44 -rotate-90">
          <circle cx="88" cy="88" r="70" stroke="currentColor" className="text-navy-50 dark:text-navy-800" strokeWidth="12" fill="transparent" />
          <circle
            cx="88"
            cy="88"
            r="70"
            stroke={hex}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center text-center">
          <span className="text-4xl font-extrabold text-navy dark:text-navy-50">{scorePercent}%</span>
          <span className="text-[11px] text-navy-400 mt-1">Score de risque</span>
        </div>
      </div>

      {prediction && (
        <div className="flex items-center justify-between text-xs pt-3 border-t border-navy-50 dark:border-navy-800 mb-3">
          <span className="text-navy-600 dark:text-navy-200">Prédiction IA (LSTM)</span>
          <span className="font-bold text-navy dark:text-navy-50">
            {prediction.niveau_eau_predit_cm != null ? `${prediction.niveau_eau_predit_cm} cm` : 'Historique insuffisant'}
          </span>
        </div>
      )}

      {onExploreMap && (
        <button
          onClick={onExploreMap}
          className="mt-3.5 w-full py-2.5 px-3 rounded-2xl bg-navy-50 hover:bg-red-50 dark:bg-navy-900/50 dark:hover:bg-red-950/30 text-navy-800 hover:text-[#CC131A] dark:text-navy-100 dark:hover:text-red-400 border border-navy-100 dark:border-navy-800 text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <span>Voir la carte des zones</span>
          <ArrowUpRight size={14} />
        </button>
      )}
    </div>
  );
}
