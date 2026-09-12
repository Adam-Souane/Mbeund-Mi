import { ArrowUpRight } from 'lucide-react';
import { riskInfo } from './RiskBadge';

/**
 * @param {object} zone — ZoneRisque.properties (quartier, niveau_risque, score_risque_moyen)
 * @param {object} prediction — PredictionIA correspondante (confiance, niveau_eau_predit_cm), optionnelle
 * @param {() => void} onExploreMap
 */
export default function GaugeRisk({ zone, prediction, onExploreMap }) {
  if (!zone) {
    return (
      <div className="rounded-xl border border-navy-50 dark:border-navy-800 bg-white dark:bg-navy p-6 flex items-center justify-center text-sm text-navy-400">
        Aucune zone à risque enregistrée pour l’instant.
      </div>
    );
  }

  const { label, hex } = riskInfo(zone.niveau_risque);
  const scorePercent = Math.round(Number(zone.score_risque_moyen ?? 0) * 100);
  const circumference = 440;
  const strokeDashoffset = circumference - (circumference * scorePercent) / 100;

  return (
    <div className="rounded-xl border border-navy-50 dark:border-navy-800 bg-white dark:bg-navy p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="min-w-0">
          <h3 className="text-xs font-bold uppercase tracking-wider text-navy-400">Zone la plus exposée</h3>
          <p className="text-sm font-semibold text-navy dark:text-navy-50 truncate">{zone.quartier}</p>
        </div>
        <span
          className="px-2.5 py-1 rounded-pill text-[10px] font-bold uppercase tracking-wide text-white flex-shrink-0"
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
          className="w-full flex items-center justify-center gap-2 bg-red text-white font-bold text-xs py-3 rounded-md hover:bg-red-700 transition-colors"
        >
          <span>Voir la carte des zones</span>
          <ArrowUpRight size={15} />
        </button>
      )}
    </div>
  );
}
