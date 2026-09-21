import { BarChart3, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell } from 'recharts';
import AutoriteShell from '../desktop/AutoriteShell';
import { useTheme } from '../../theme/ThemeContext';
import { useModelReliability } from '../../shared/hooks/useModelReliability';

const RISK_COLORS = {
  vert: '#10B981',
  jaune: '#F59E0B',
  orange: '#EF6234',
  rouge: '#DC2626',
};

export default function FiabiliteModelePage() {
  const { darkMode } = useTheme();
  const { data, loading, error } = useModelReliability();

  const gridColor = darkMode ? '#2E4460' : '#EBF0F5';
  const axisColor = darkMode ? '#8AA0B8' : '#4A6480';
  const bgCard = darkMode ? '#1B2A40' : '#FFFFFF';
  const textMuted = darkMode ? '#8AA0B8' : '#6B7280';

  const tooltipStyle = {
    backgroundColor: bgCard,
    borderColor: darkMode ? '#2E4460' : '#EBF0F5',
    borderRadius: 8,
    fontSize: 12,
  };

  if (loading) {
    return (
      <AutoriteShell>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-navy-500 mx-auto mb-4"></div>
            <p className="text-navy-600 dark:text-navy-200">Chargement des métriques...</p>
          </div>
        </div>
      </AutoriteShell>
    );
  }

  if (error) {
    return (
      <AutoriteShell>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
            <div>
              <h3 className="font-bold text-red-900 dark:text-red-200">Erreur</h3>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      </AutoriteShell>
    );
  }

  if (!data || !data.metriques) {
    return (
      <AutoriteShell>
        <div className="text-center text-navy-600 dark:text-navy-200">
          Aucune donnée disponible
        </div>
      </AutoriteShell>
    );
  }

  const metriques = data.metriques;
  const matriceConfusion = data.matrice_confusion;
  const calibrationData = data.calibration_curve;

  // Préparer les données pour la courbe de calibration
  const calibrationChartData = calibrationData.avant_calibration.prob_pred.map((pred, i) => ({
    seuil: (i + 1) * 10,
    avant: calibrationData.avant_calibration.prob_true[i],
    apres: calibrationData.apres_calibration.prob_true[i],
    expected: calibrationData.avant_calibration.prob_pred[i],
  }));

  // Préparer les données pour la matrice de confusion
  const matrixChartData = [
    { risque: 'Vert', vert: matriceConfusion.vert.vert, jaune: matriceConfusion.vert.jaune, orange: matriceConfusion.vert.orange, rouge: matriceConfusion.vert.rouge },
    { risque: 'Jaune', vert: matriceConfusion.jaune.vert, jaune: matriceConfusion.jaune.jaune, orange: matriceConfusion.jaune.orange, rouge: matriceConfusion.jaune.rouge },
    { risque: 'Orange', vert: matriceConfusion.orange.vert, jaune: matriceConfusion.orange.jaune, orange: matriceConfusion.orange.orange, rouge: matriceConfusion.orange.rouge },
    { risque: 'Rouge', vert: matriceConfusion.rouge.vert, jaune: matriceConfusion.rouge.jaune, orange: matriceConfusion.rouge.orange, rouge: matriceConfusion.rouge.rouge },
  ];

  const improvementPercent = metriques.brier_improvement_percent;
  const accuracyGain = (metriques.accuracy_apres_percent - metriques.accuracy_avant_percent).toFixed(1);

  return (
    <AutoriteShell>
      <div>
        <h1 className="text-3xl font-extrabold">Fiabilité du Modèle</h1>
        <p className="text-base text-navy-600 dark:text-navy-200 mt-0.5">
          Analyse de la précision et calibration du modèle Random Forest
        </p>
      </div>

      {/* Métriques clés */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`rounded-xl p-5 border ${darkMode ? 'bg-navy-800 border-navy-700' : 'bg-white border-navy-50'}`}>
          <p className={`text-xs font-medium ${textMuted}`}>Accuracy (après calibration)</p>
          <p className="text-2xl font-bold text-navy-900 dark:text-white mt-2">{metriques.accuracy_apres_percent.toFixed(1)}%</p>
          <p className={`text-xs mt-1 ${accuracyGain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {accuracyGain >= 0 ? '+' : ''}{accuracyGain}% vs avant
          </p>
        </div>

        <div className={`rounded-xl p-5 border ${darkMode ? 'bg-navy-800 border-navy-700' : 'bg-white border-navy-50'}`}>
          <p className={`text-xs font-medium ${textMuted}`}>Brier Score (amélioration)</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">{improvementPercent.toFixed(1)}%</p>
          <p className={`text-xs mt-1 ${textMuted}`}>{metriques.brier_score_avant.toFixed(4)} → {metriques.brier_score_apres.toFixed(4)}</p>
        </div>

        <div className={`rounded-xl p-5 border ${darkMode ? 'bg-navy-800 border-navy-700' : 'bg-white border-navy-50'}`}>
          <p className={`text-xs font-medium ${textMuted}`}>Log Loss (après)</p>
          <p className="text-2xl font-bold text-navy-900 dark:text-white mt-2">{metriques.log_loss_apres.toFixed(4)}</p>
          <p className={`text-xs mt-1 ${textMuted}`}>{metriques.log_loss_avant.toFixed(4)} avant</p>
        </div>

        <div className={`rounded-xl p-5 border ${darkMode ? 'bg-navy-800 border-navy-700' : 'bg-white border-navy-50'}`}>
          <p className={`text-xs font-medium ${textMuted}`}>Échantillons de test</p>
          <p className="text-2xl font-bold text-navy-900 dark:text-white mt-2">{data.nombre_echantillons_test}</p>
          <p className={`text-xs mt-1 ${textMuted}`}>jours évalués</p>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Courbe de calibration */}
        <div className={`rounded-xl p-5 border ${darkMode ? 'bg-navy-800 border-navy-700' : 'bg-white border-navy-50'}`}>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={15} />
            Courbe de calibration (Risque Rouge)
          </h3>
          <p className={`text-xs ${textMuted} mb-4`}>Avant vs après calibration. La diagonale grise = parfaite calibration.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={calibrationChartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="seuil" stroke={axisColor} fontSize={11} label={{ value: 'Probabilité prédite (%)', position: 'insideBottomRight', offset: -5 }} />
                <YAxis stroke={axisColor} fontSize={11} label={{ value: 'Prob. réelle (%)', angle: -90, position: 'insideLeft' }} domain={[0, 1]} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => (v * 100).toFixed(1) + '%'} />
                <Legend />
                <Line type="monotone" dataKey="avant" stroke="#EF6234" name="Avant calibration" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="apres" stroke="#10B981" name="Après calibration" dot={{ r: 4 }} />
                <Line type="linear" dataKey="expected" stroke="#CCCCCC" name="Idéal" strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Matrice de confusion */}
        <div className={`rounded-xl p-5 border ${darkMode ? 'bg-navy-800 border-navy-700' : 'bg-white border-navy-50'}`}>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <BarChart3 size={15} />
            Matrice de confusion (Prédictions correctes par classe)
          </h3>
          <div className="h-64 overflow-x-auto">
            <ResponsiveContainer width={400} height={256}>
              <BarChart data={matrixChartData} margin={{ top: 5, right: 10, left: 60, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="risque" stroke={axisColor} fontSize={11} />
                <YAxis stroke={axisColor} fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="vert" name="Vert" fill={RISK_COLORS.vert} />
                <Bar dataKey="jaune" name="Jaune" fill={RISK_COLORS.jaune} />
                <Bar dataKey="orange" name="Orange" fill={RISK_COLORS.orange} />
                <Bar dataKey="rouge" name="Rouge" fill={RISK_COLORS.rouge} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Interprétation */}
      <div className={`rounded-xl p-5 border ${darkMode ? 'bg-navy-800 border-navy-700' : 'bg-white border-navy-50'}`}>
        <div className="flex items-start gap-3">
          <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-1" size={20} />
          <div>
            <h3 className="font-bold text-navy-900 dark:text-white mb-2">Interprétation</h3>
            <ul className={`text-sm space-y-2 ${textMuted}`}>
              <li>
                <strong>Brier Score :</strong> Mesure l'écart moyen entre les probabilités prédites et les vrais labels. Une amélioration de {improvementPercent.toFixed(1)}% confirme que la calibration rend les probabilités plus fiables.
              </li>
              <li>
                <strong>Accuracy :</strong> Le modèle prédit correctement le niveau de risque dans {metriques.accuracy_apres_percent.toFixed(1)}% des cas (après calibration).
              </li>
              <li>
                <strong>Courbe de calibration :</strong> Plus elle s'aligne avec la diagonale grise, plus les probabilités prédites correspondent à la réalité. Le modèle calibré est plus proche de l'idéal.
              </li>
              <li>
                <strong>Matrice de confusion :</strong> Montre quels risques sont bien classés (diagonale) et lesquels sont confondus. Les valeurs élevées en diagonale indiquent une bonne classification.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Métadonnées */}
      <div className={`rounded-xl p-4 text-xs ${textMuted}`}>
        <p>
          Données extraites le {new Date().toLocaleDateString('fr-FR')}. Modèle : Random Forest ({data.nombre_echantillons_test} échantillons de test).
        </p>
      </div>
    </AutoriteShell>
  );
}
