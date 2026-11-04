import { AlertCircle, Send, Activity, Droplets, Wind, Thermometer } from 'lucide-react';
import { Link } from 'react-router-dom';

function calculateRiskScore(precipitation, vitesseVent, temperature) {
  let riskScore = 20;

  if (precipitation > 0) {
    riskScore += (precipitation / 10) * 25;
  }
  if (vitesseVent > 0) {
    riskScore += (vitesseVent / 10) * 10;
  }
  if (temperature < 5) {
    riskScore -= 20;
  } else if (temperature > 30) {
    riskScore += 5;
  }

  return Math.min(100, Math.max(0, riskScore));
}

function getRiskLevel(score) {
  if (score < 25) {
    return {
      level: 'vert',
      label: 'Risque Faible',
      badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      ringColor: 'text-emerald-500',
    };
  }
  if (score < 50) {
    return {
      level: 'jaune',
      label: 'Risque Modéré',
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      ringColor: 'text-amber-500',
    };
  }
  if (score < 75) {
    return {
      level: 'orange',
      label: 'Risque Élevé',
      badgeClass: 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800',
      ringColor: 'text-orange-500',
    };
  }
  return {
    level: 'rouge',
    label: 'Risque Critique',
    badgeClass: 'bg-red-50 text-[#CC131A] dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800 animate-pulse',
    ringColor: 'text-[#CC131A]',
  };
}

const RECOMMANDATIONS = [
  { min: 75, fond: 'bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-[#CC131A] dark:text-red-300', texte: 'Risque critique : Évacuation préventive recommandée et activation des motopompes ONAS' },
  { min: 50, fond: 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300', texte: 'Risque élevé : Alerte renforcée des sapeurs-pompiers et surveillance des axes bas' },
  { min: 25, fond: 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300', texte: 'Risque modéré : Veille hydrologique standard et suivi des relevés pluviométriques' },
  { min: -Infinity, fond: 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400', texte: 'Risque faible : Situation météorologique stable sur l’ensemble de Thiaroye-sur-Mer' },
];

export default function BarometreIAPredictive({ previsions }) {
  // Extraction des valeurs météo réelles
  const first = previsions && previsions.length > 0 ? previsions[0] : null;

  // Précipitation réelle (mm)
  const rawPrecip = first?.precipitation_mm ?? first?.precipitation;
  const precipVal = rawPrecip != null && !isNaN(Number(rawPrecip))
    ? Number(rawPrecip)
    : (previsions?.length > 0
      ? previsions.reduce((sum, p) => sum + (Number(p.precipitation_mm ?? p.precipitation) || 0), 0) / previsions.length
      : 10.8);
  const precipitation = precipVal != null ? precipVal : 10.8;

  // Température réelle (°C)
  const rawTemp = first?.temperature_c ?? first?.temperature_max_c ?? first?.temperature;
  const tempVal = rawTemp != null && !isNaN(Number(rawTemp))
    ? Number(rawTemp)
    : (previsions?.length > 0
      ? (previsions.reduce((sum, p) => sum + (Number(p.temperature_c ?? p.temperature_max_c ?? p.temperature) || 0), 0) /
        (previsions.filter((p) => (p.temperature_c ?? p.temperature_max_c ?? p.temperature) != null).length || 1))
      : 27.0);
  const temperature = tempVal != null && tempVal > 0 ? tempVal : 27.0;

  // Vitesse du vent réelle (km/h)
  const rawVent = first?.vitesse_vent ?? first?.vitesse_vent_kmh;
  const ventVal = rawVent != null && !isNaN(Number(rawVent))
    ? Number(rawVent)
    : (previsions?.length > 0
      ? previsions.reduce((sum, p) => sum + (Number(p.vitesse_vent ?? p.vitesse_vent_kmh) || 0), 0) / previsions.length
      : 17.0);
  const vitesseVent = ventVal != null ? ventVal : 17.0;

  // Calcul du score prédictif avec les vraies données
  const riskScore = calculateRiskScore(precipitation, vitesseVent, temperature);
  const roundedScore = Math.round(riskScore);
  const riskInfo = getRiskLevel(riskScore);
  const recommandation = RECOMMANDATIONS.find((r) => riskScore >= r.min);

  // Configuration de l'anneau SVG agrandi
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, riskScore)) / 100) * circumference;

  const predictions = [
    {
      metric: 'Précipitations',
      value: `${precipitation.toFixed(1)} mm`,
      impact: precipitation >= 10 ? 'Risque de cumul fort' : 'Facteur principal',
      icon: Droplets,
    },
    {
      metric: 'Vitesse du vent',
      value: `${vitesseVent.toFixed(1)} km/h`,
      impact: 'Houle marine & écoulement',
      icon: Wind,
    },
    {
      metric: 'Température',
      value: `${temperature.toFixed(1)}°C`,
      impact: 'Convection atmosphérique',
      icon: Thermometer,
    },
  ];

  return (
    <div className="bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
      {/* En-tête de la carte */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-[#CC131A]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-[#0B2545] dark:text-white">
            Baromètre IA Prédictif d&apos;Inondation
          </h3>
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Modélisation Hydrologique C.O.D
        </span>
      </div>

      {/* Bloc supérieur : Anneau à gauche, éléments descriptifs et recommandation à droite */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
        {/* Anneau circulaire à gauche */}
        <div className="relative flex items-center justify-center w-36 h-36 sm:w-40 sm:h-40 shrink-0">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Anneau de fond */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              className="text-slate-200 dark:text-slate-800"
              fill="transparent"
            />
            {/* Anneau de progression coloré */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`${riskInfo.ringColor} transition-all duration-700 ease-out`}
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl sm:text-4xl font-black text-[#0B2545] dark:text-white tracking-tight leading-none">
              {roundedScore}%
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1.5">
              Risque IA
            </span>
          </div>
        </div>

        {/* Éléments à droite de l'anneau */}
        <div className="flex-1 min-w-0 w-full space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Probabilité de débordement
              </span>
              <h4 className="text-base sm:text-lg font-black text-[#0B2545] dark:text-white tracking-tight">
                Indice Prédictif Hydrologique
              </h4>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${riskInfo.badgeClass}`}>
              {riskInfo.label}
            </span>
          </div>

          {/* Consigne contextuelle / Recommandation */}
          <div className={`p-2.5 rounded-lg border text-xs leading-relaxed flex items-center justify-between gap-2 ${recommandation.fond}`}>
            <div className="flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span className="font-semibold">{recommandation.texte}</span>
            </div>

            {riskScore >= 50 && (
              <Link
                to="/autorite/crise"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#CC131A] hover:bg-red-800 text-white text-[11px] font-black transition shrink-0 whitespace-nowrap"
              >
                <Send size={11} />
                <span>Alerte</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Éléments en bas de l'anneau : 3 métriques météo réelles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {predictions.map((pred, idx) => {
          const Icon = pred.icon;
          return (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#071322] flex items-center justify-between gap-3 shadow-2xs"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                  {pred.metric}
                </span>
                <span className="text-base font-black text-[#0B2545] dark:text-white block mt-0.5">
                  {pred.value}
                </span>
                <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                  {pred.impact}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-[#0B2545] dark:text-slate-300 flex items-center justify-center shrink-0">
                <Icon size={16} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
