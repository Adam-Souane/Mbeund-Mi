import { useState } from 'react';
import { Download, FileText, FileJson, Loader2 } from 'lucide-react';
import AutoriteShell from '../desktop/AutoriteShell';

const EXPORT_TYPES = [
  {
    id: 'alertes',
    label: 'Alertes',
    description: 'Historique de toutes les alertes émises',
    icon: '🚨',
  },
  {
    id: 'signalements',
    label: 'Signalements Citoyens',
    description: 'Tous les signalements d\'inondation reçus',
    icon: '📱',
  },
  {
    id: 'zones',
    label: 'Zones à Risque',
    description: 'Zones de Thiaroye avec niveaux de risque',
    icon: '🗺️',
  },
  {
    id: 'predictions',
    label: 'Prédictions IA',
    description: 'Dernières prédictions du modèle IA',
    icon: '🤖',
  },
  {
    id: 'refuges',
    label: 'Points de Refuge',
    description: 'Écoles, mosquées, centres d\'accueil',
    icon: '🏫',
  },
  {
    id: 'episodes',
    label: 'Épisodes d\'Inondation',
    description: 'Historique des inondations (test + réelles)',
    icon: '💧',
  },
];

export default function ExportPage() {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const handleExport = async (type, format) => {
    setLoading(`${type}-${format}`);
    setError(null);

    try {
      const url = `/api/export/${format}/${type}/`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Erreur lors du téléchargement (${response.status})`);
      }

      // Déterminer le type de contenu et l'extension
      const contentType = response.headers.get('content-type');
      let extension = format;
      if (format === 'pdf') {
        extension = 'pdf';
      } else if (format === 'csv') {
        extension = 'csv';
      }

      // Créer un blob et télécharger
      const blob = await response.blob();
      const filename = response.headers
        .get('content-disposition')
        ?.split('filename="')[1]
        ?.split('"')[0] || `export_${type}.${extension}`;

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      setError(`Erreur: ${err.message}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <AutoriteShell>
      <div>
        <h1 className="text-3xl font-extrabold">Exports & Rapports</h1>
        <p className="text-base text-navy-600 dark:text-navy-200 mt-0.5">
          Téléchargez les données et rapports au format CSV ou PDF
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red/15 text-red-900 dark:text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXPORT_TYPES.map((type) => (
          <div
            key={type.id}
            className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5 flex flex-col gap-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-3xl mb-2">{type.icon}</div>
                <h3 className="text-lg font-bold text-navy dark:text-navy-50">
                  {type.label}
                </h3>
                <p className="text-sm text-navy-600 dark:text-navy-300 mt-1">
                  {type.description}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-navy-50 dark:border-navy-800">
              <button
                onClick={() => handleExport(type.id, 'csv')}
                disabled={loading === `${type.id}-csv`}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-navy-50 dark:bg-navy-800 text-navy dark:text-navy-200 hover:bg-navy-100 dark:hover:bg-navy-700 transition-colors disabled:opacity-60 text-sm font-semibold"
                title="Télécharger en CSV (Excel compatible)"
              >
                {loading === `${type.id}-csv` ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <FileJson size={16} />
                )}
                CSV
              </button>

              <button
                onClick={() => handleExport(type.id, 'pdf')}
                disabled={loading === `${type.id}-pdf`}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red text-white hover:bg-red-700 transition-colors disabled:opacity-60 text-sm font-semibold"
                title="Télécharger en PDF (avec logo et mise en forme)"
              >
                {loading === `${type.id}-pdf` ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <FileText size={16} />
                )}
                PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
        <div className="flex gap-3">
          <Download size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-blue-900 dark:text-blue-200">
              Astuces d'utilisation
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-300 mt-2 space-y-1">
              <li>• <strong>CSV :</strong> Format tabulaire, compatible Excel, Google Sheets, etc.</li>
              <li>• <strong>PDF :</strong> Rapports formatés avec logo Mbeund-Mi et charte graphique</li>
              <li>• Les exports incluent les données actuelles de la base de données</li>
              <li>• Vous pouvez exporter autant de fois que nécessaire</li>
            </ul>
          </div>
        </div>
      </div>
    </AutoriteShell>
  );
}
