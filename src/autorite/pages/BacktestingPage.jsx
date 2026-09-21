import { Calendar, Cloud, Target, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import AutoriteShell from '../desktop/AutoriteShell';
import { useTheme } from '../../theme/ThemeContext';
import { useBacktesting } from '../../shared/hooks/useBacktesting';
import { riskInfo } from '../../shared/components/RiskBadge';

export default function BacktestingPage() {
  const { darkMode } = useTheme();
  const { data, loading, error } = useBacktesting();

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
            <p className="text-navy-600 dark:text-navy-200">Exécution du backtesting...</p>
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

  if (!data || !data.statistiques) {
    return (
      <AutoriteShell>
        <div className="text-center text-navy-600 dark:text-navy-200">
          {data?.message || 'Aucune donnée disponible'}
        </div>
      </AutoriteShell>
    );
  }

  const stats = data.statistiques;
  const episodes = data.episodes || [];

  // Préparer les données pour le graphique de détection
  const tauxDetection = stats.taux_detection_percent || 0;
  const tauxNonDetection = 100 - tauxDetection;

  const detectionChartData = [
    { name: 'Détectés', value: stats.nombre_episodes_detectes || 0, fill: '#10B981' },
    { name: 'Manqués', value: (stats.nombre_episodes_total || 0) - (stats.nombre_episodes_detectes || 0), fill: '#EF6234' },
  ];

  // Préparer les données pour la distribution des risques
  const risquesDistribution = stats.risques_predits_distribution || {};
  const riskChartData = [
    { risque: 'Vert', count: risquesDistribution.vert || 0, fill: '#10B981' },
    { risque: 'Jaune', count: risquesDistribution.jaune || 0, fill: '#F59E0B' },
    { risque: 'Orange', count: risquesDistribution.orange || 0, fill: '#EF6234' },
    { risque: 'Rouge', count: risquesDistribution.rouge || 0, fill: '#DC2626' },
  ];

  // Trier les épisodes par date
  const episodesTries = [...episodes]
    .filter((e) => !e.erreur)
    .sort((a, b) => new Date(b.date_debut) - new Date(a.date_debut));

  const formatDate = (isoString) => {
    try {
      return new Date(isoString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const getRiskBadgeColor = (risque) => {
    const colors = {
      vert: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700',
      jaune: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700',
      orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-700',
      rouge: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-700',
    };
    return colors[risque] || colors.vert;
  };

  return (
    <AutoriteShell>
      <div>
        <h1 className="text-3xl font-extrabold">Backtesting du Modèle</h1>
        <p className="text-base text-navy-600 dark:text-navy-200 mt-0.5">
          Analyse rétrospective : le modèle aurait-il prédit les inondations historiques ?
        </p>
      </div>

      {/* Métriques clés */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`rounded-xl p-5 border ${darkMode ? 'bg-navy-800 border-navy-700' : 'bg-white border-navy-50'}`}>
          <p className={`text-xs font-medium ${textMuted}`}>Taux de détection</p>
          <p className={`text-4xl font-bold mt-2 ${tauxDetection >= 70 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
            {tauxDetection.toFixed(1)}%
          </p>
          <p className={`text-xs mt-2 ${textMuted}`}>
            {stats.nombre_episodes_detectes}/{stats.nombre_episodes_total} inondations détectées
          </p>
        </div>

        <div className={`rounded-xl p-5 border ${darkMode ? 'bg-navy-800 border-navy-700' : 'bg-white border-navy-50'}`}>
          <p className={`text-xs font-medium ${textMuted}`}>Épisodes d'inondation</p>
          <p className="text-4xl font-bold text-navy-900 dark:text-white mt-2">
            {stats.nombre_episodes_total}
          </p>
          <p className={`text-xs mt-2 ${textMuted}`}>historiques analysés (2010-2024)</p>
        </div>

        <div className={`rounded-xl p-5 border ${darkMode ? 'bg-navy-800 border-navy-700' : 'bg-white border-navy-50'}`}>
          <p className={`text-xs font-medium ${textMuted}`}>Pluie moyenne pré-inondation</p>
          <p className="text-4xl font-bold text-navy-900 dark:text-white mt-2">
            {episodes.length > 0
              ? (
                  episodes.filter((e) => !e.erreur).reduce((sum, e) => sum + (e.pluie_cumulee_72h_mm || 0), 0) /
                  episodes.filter((e) => !e.erreur).length
                ).toFixed(0)
              : '—'}
            <span className="text-lg">mm</span>
          </p>
          <p className={`text-xs mt-2 ${textMuted}`}>cumulée sur 72h</p>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Détection */}
        <div className={`rounded-xl p-5 border ${darkMode ? 'bg-navy-800 border-navy-700' : 'bg-white border-navy-50'}`}>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <Target size={15} />
            Résultats de détection
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={detectionChartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="name" stroke={axisColor} fontSize={11} />
                <YAxis stroke={axisColor} fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" name="Nombre" radius={[4, 4, 0, 0]}>
                  {detectionChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution des risques prédits */}
        <div className={`rounded-xl p-5 border ${darkMode ? 'bg-navy-800 border-navy-700' : 'bg-white border-navy-50'}`}>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <Cloud size={15} />
            Distribution des risques prédits
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskChartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="risque" stroke={axisColor} fontSize={11} />
                <YAxis stroke={axisColor} fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Épisodes">
                  {riskChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tableau détaillé */}
      <div className={`rounded-xl border ${darkMode ? 'bg-navy-800 border-navy-700' : 'bg-white border-navy-50'}`}>
        <div className="p-5 border-b border-navy-200 dark:border-navy-700">
          <h3 className="text-base font-bold flex items-center gap-2">
            <Calendar size={15} />
            Détail par épisode d'inondation
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${darkMode ? 'bg-navy-900' : 'bg-navy-50'}`}>
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-navy-600 dark:text-navy-300">Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-navy-600 dark:text-navy-300">Pluie 72h</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-navy-600 dark:text-navy-300">Niveau est.</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-navy-600 dark:text-navy-300">Risque prédit</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-navy-600 dark:text-navy-300">Confiance</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-navy-600 dark:text-navy-300">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-200 dark:divide-navy-700">
              {episodesTries.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center px-5 py-6 text-navy-500 dark:text-navy-400">
                    Aucun épisode d'inondation enregistré
                  </td>
                </tr>
              ) : (
                episodesTries.map((episode) => (
                  <tr key={episode.id} className={darkMode ? 'hover:bg-navy-700/50' : 'hover:bg-navy-50'}>
                    <td className="px-5 py-3 text-sm text-navy-900 dark:text-white">
                      {formatDate(episode.date_debut)}
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-navy-900 dark:text-white">
                      {episode.pluie_cumulee_72h_mm}mm
                    </td>
                    <td className="px-5 py-3 text-sm text-navy-600 dark:text-navy-300">
                      {episode.niveau_estime_cm}cm
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded text-xs font-semibold ${getRiskBadgeColor(episode.risque_predit)}`}>
                        {episode.risque_predit.charAt(0).toUpperCase() + episode.risque_predit.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-navy-600 dark:text-navy-300">
                      {episode.confiance}%
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {episode.detecte ? (
                          <>
                            <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                            <span className="text-sm font-semibold text-green-600 dark:text-green-400">Détecté</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={16} className="text-red-600 dark:text-red-400" />
                            <span className="text-sm font-semibold text-red-600 dark:text-red-400">Manqué</span>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interprétation */}
      <div className={`rounded-xl p-5 border ${darkMode ? 'bg-navy-800 border-navy-700' : 'bg-white border-navy-50'}`}>
        <div className="flex items-start gap-3">
          <CheckCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" size={20} />
          <div>
            <h3 className="font-bold text-navy-900 dark:text-white mb-2">Interprétation</h3>
            <ul className={`text-sm space-y-2 ${textMuted}`}>
              <li>
                <strong>Taux de détection :</strong> Pourcentage d'inondations historiques que le modèle aurait correctement prédites
                (risque ≥ jaune) en se basant sur les pluies observées dans les 72h précédentes.
              </li>
              <li>
                <strong>Pluie 72h :</strong> Cumul des précipitations observées dans les 3 jours avant chaque inondation (données Open-Meteo réelles).
              </li>
              <li>
                <strong>Risque prédit :</strong> Classification du modèle (Vert/Jaune/Orange/Rouge) basée sur la pluie et niveau d'eau estimé.
              </li>
              <li>
                <strong>Verdict :</strong> "Détecté" si risque ≥ Jaune (alerte lancée), "Manqué" si prédiction trop optimiste (Vert).
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Métadonnées */}
      <div className={`rounded-xl p-4 text-xs ${textMuted}`}>
        <p>
          Backtesting exécuté sur {stats.nombre_episodes_total} épisodes historiques. Données: Open-Meteo (pluies 2010-2024),
          Base de données locale (inondations observées). Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}.
        </p>
      </div>
    </AutoriteShell>
  );
}
