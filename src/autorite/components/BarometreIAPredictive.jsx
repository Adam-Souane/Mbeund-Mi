import { TrendingUp, AlertCircle, Save, Phone, Clock } from 'lucide-react';

/**
 * Baromètre IA prédictive pour estimer le risque d'inondation
 * basé sur les données météo actuelles.
 *
 * Règles IA:
 * - Précipitations: chaque 10mm augmente le risque de 25%
 * - Vitesse vent: chaque 10km/h augmente le risque de 10%
 * - Température: < 5°C réduit le risque de 20% (neige), > 30°C augmente légèrement
 */

function calculateRiskScore(previsions) {
  if (!previsions || previsions.length === 0) return 0;

  // Moyenne des données disponibles
  let totalPrecipitation = 0;
  let totalVent = 0;
  let avgTemp = 0;
  let count = 0;

  previsions.forEach((p) => {
    if (p.precipitation != null) totalPrecipitation += p.precipitation;
    if (p.vitesse_vent != null) totalVent += p.vitesse_vent;
    if (p.temperature != null) avgTemp += p.temperature;
    count++;
  });

  const avgPrecipitation = totalPrecipitation / (previsions.length || 1);
  const avgWindSpeed = totalVent / (previsions.length || 1);
  const avgTemperature = avgTemp / (count || 1);

  // Calcul du score de risque (0-100)
  let riskScore = 20; // Base risque

  // Précipitations (la plus importante)
  if (avgPrecipitation > 0) {
    riskScore += (avgPrecipitation / 10) * 25;
  }

  // Vitesse du vent
  if (avgWindSpeed > 0) {
    riskScore += (avgWindSpeed / 10) * 10;
  }

  // Température (considérations spéciales)
  if (avgTemperature < 5) {
    riskScore -= 20; // Froid = potentiellement neige, moins d'inondation
  } else if (avgTemperature > 30) {
    riskScore += 5; // Chaud + pluie = plus d'évaporation mais peut augmenter phénomènes extrêmes
  }

  return Math.min(100, Math.max(0, riskScore));
};

function getRiskLevel(score) {
  if (score < 25) return { level: 'vert', label: 'FAIBLE', color: 'bg-risk-vert text-white' };
  if (score < 50) return { level: 'jaune', label: 'MODÉRÉ', color: 'bg-risk-jaune text-navy-900' };
  if (score < 75) return { level: 'orange', label: 'ÉLEVÉ', color: 'bg-risk-orange text-white' };
  return { level: 'rouge', label: 'CRITIQUE', color: 'bg-red text-white' };
}

export default function BarometreIAPredictive({ previsions }) {
  const riskScore = calculateRiskScore(previsions);
  const riskInfo = getRiskLevel(riskScore);

  const predictions = [
    {
      metric: 'Précipitations',
      value: previsions?.length > 0 ? (previsions.reduce((sum, p) => sum + (p.precipitation || 0), 0) / previsions.length).toFixed(1) + ' mm' : '—',
      impact: 'Très influent',
    },
    {
      metric: 'Vitesse du vent',
      value: previsions?.length > 0 ? (previsions.reduce((sum, p) => sum + (p.vitesse_vent || 0), 0) / previsions.length).toFixed(1) + ' km/h' : '—',
      impact: 'Modéré',
    },
    {
      metric: 'Température',
      value: previsions?.length > 0 ? (previsions.reduce((sum, p) => sum + (p.temperature || 0), 0) / previsions.length).toFixed(1) + '°C' : '—',
      impact: 'Faible',
    },
  ];

  return (
    <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp size={16} className="text-risk-orange" />
        <h3 className="text-base font-bold">Baromètre IA prédictive</h3>
      </div>
      <p className="text-xs text-navy-600 dark:text-navy-200">
        Prédiction intelligente du niveau de risque d'inondation basée sur la météo actuelle.
      </p>

      {/* Score principal */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-extrabold">{Math.round(riskScore)}</span>
            <span className="text-sm font-semibold text-navy-400">/100</span>
          </div>
          <div className="w-full bg-navy-100 dark:bg-navy-800 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all ${riskInfo.color}`}
              style={{ width: `${riskScore}%` }}
            />
          </div>
        </div>

        <div className={`flex-shrink-0 px-4 py-3 rounded-lg ${riskInfo.color} text-center`}>
          <div className="text-2xl font-extrabold">{riskInfo.label}</div>
        </div>
      </div>

      {/* Détails des paramètres */}
      <div className="grid sm:grid-cols-3 gap-3 pt-3 border-t border-navy-100 dark:border-navy-800">
        {predictions.map((pred, idx) => (
          <div key={idx} className="text-center">
            <p className="text-xs font-semibold text-navy-400 mb-1">{pred.metric}</p>
            <p className="text-sm font-bold">{pred.value}</p>
            <p className="text-[11px] text-navy-500 mt-1">Impact: {pred.impact}</p>
          </div>
        ))}
      </div>

      {/* Recommandation */}
      <div className={`flex items-start gap-2.5 p-3 rounded-lg ${
        riskScore >= 75 ? 'bg-red/15' :
        riskScore >= 50 ? 'bg-risk-orange/15' :
        riskScore >= 25 ? 'bg-risk-jaune/15' :
        'bg-risk-vert/15'
      }`}>
        <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
        <p className="text-xs font-semibold">
          {riskScore >= 75 && "Risque critique : Préparez les mesures d'évacuation d'urgence"}
          {riskScore >= 50 && riskScore < 75 && "Risque élevé : Augmentez la vigilance et la préparation"}
          {riskScore >= 25 && riskScore < 50 && "Risque modéré : Maintenez une alerte active"}
          {riskScore < 25 && "Risque faible : Situation sous contrôle, continuez la surveillance"}
        </p>
      </div>
    </div>
  );
}
