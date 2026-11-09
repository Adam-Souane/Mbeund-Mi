import { useState } from 'react';
import {
  Download,
  FileText,
  FileJson,
  Loader2,
  AlertTriangle,
  MessageSquare,
  Map,
  Zap,
  Home,
  Cloud,
} from 'lucide-react';
import AutoriteShell from '../desktop/AutoriteShell';
import client from '../../api/client';

const EXPORT_TYPES = [
  {
    id: 'alertes',
    label: 'Alertes',
    description: 'Historique de toutes les alertes émises par le C.O.D',
    icon: AlertTriangle,
    iconColor: 'text-[#CC131A]',
    badgeBg: 'bg-red-50 dark:bg-red-950/50 text-[#CC131A] border-red-200 dark:border-red-900',
    details: 'Zone, niveau de risque, canaux de diffusion, horodatage, statut',
    csvSupported: true,
    pdfSupported: true,
  },
  {
    id: 'signalements',
    label: 'Signalements Citoyens',
    description: 'Tous les signalements d\'inondation reçus et modérés',
    icon: MessageSquare,
    iconColor: 'text-blue-600',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900',
    details: 'Coordonnées GPS, hauteur d’eau, niveau d’urgence, statut de validation',
    csvSupported: true,
    pdfSupported: true,
  },
  {
    id: 'zones',
    label: 'Zones à Risque',
    description: 'Zones de Thiaroye avec niveaux de risque SIG',
    icon: Map,
    iconColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
    details: 'Quartiers de Thiaroye, score moyen, seuils d’alerte jaune/orange/rouge',
    csvSupported: true,
    pdfSupported: false,
  },
  {
    id: 'predictions',
    label: 'Prédictions IA',
    description: 'Dernières prédictions du modèle IA hydrologique',
    icon: Zap,
    iconColor: 'text-amber-600',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900',
    details: 'Hauteurs d’eau estimées, indice de confiance hydrologique, horizon temporel',
    csvSupported: true,
    pdfSupported: false,
  },
  {
    id: 'refuges',
    label: 'Points de Refuge',
    description: 'Écoles, mosquées, centres d\'accueil et refuges d’urgence',
    icon: Home,
    iconColor: 'text-teal-600',
    badgeBg: 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-900',
    details: 'Capacités d’accueil, contacts des responsables de zone, élévation',
    csvSupported: true,
    pdfSupported: false,
  },
  {
    id: 'episodes',
    label: 'Épisodes d\'Inondation',
    description: 'Historique certifié des inondations et crues observées',
    icon: Cloud,
    iconColor: 'text-[#0B2545] dark:text-blue-400',
    badgeBg: 'bg-slate-100 dark:bg-slate-800 text-[#0B2545] dark:text-slate-200 border-slate-200 dark:border-slate-700',
    details: 'Dates de survenue, durée des épisodes, sévérité maximale constatée',
    csvSupported: true,
    pdfSupported: false,
  },
];

export default function ExportPage() {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleExport = async (type, format) => {
    setLoading(`${type}-${format}`);
    setError(null);
    setSuccess(null);

    try {
      const url = `/export/${format}/${type}/`;
      const response = await client.get(url, {
        responseType: 'blob',
      });

      // Créer un blob et télécharger
      const blob = response.data;
      const filename =
        response.headers?.['content-disposition']
          ?.split('filename="')[1]
          ?.split('"')[0] || `export_${type}.${format}`;

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      setSuccess(`Export ${type.toUpperCase()} (${format.toUpperCase()}) téléchargé.`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(`Erreur: ${err.message}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <AutoriteShell>
      <div className="space-y-6">
        {/* ── 1. EN-TÊTE ÉPURÉ DE LA PAGE ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[#0B2545] dark:text-slate-300">
                <Download size={13} className="text-[#CC131A]" />
                Centre de Données C.O.D · Thiaroye-sur-Mer
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B2545] dark:text-white tracking-tight mt-0.5">
              Exports &amp; Rapports
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Téléchargez les données et rapports au format CSV ou PDF
            </p>
          </div>

          <div className="flex items-center flex-nowrap gap-2 shrink-0">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#071322] border border-slate-200 dark:border-slate-800 text-xs font-bold text-[#0B2545] dark:text-slate-200 shadow-2xs whitespace-nowrap">
              <Zap size={14} className="text-emerald-600" />
              Base Active &amp; Conforme
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#0B2545] dark:text-slate-200 text-xs font-bold whitespace-nowrap">
              <Download size={13} />
              <span>Prêt à l'export</span>
            </span>
          </div>
        </div>

        {/* ── 2. LES 4 COMPTEURS EXÉCUTIFS ALIGNÉS AU MILLIMÈTRE (80/15/5) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1 : Jeux de Données */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#071322] border border-slate-200/80 dark:border-slate-800 border-t-2 border-t-blue-500 shadow-2xs min-h-[142px] flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Jeux de Données
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                <Download size={15} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-[#0B2545] dark:text-white leading-none">
                  6
                </span>
                <span className="text-xs font-bold text-slate-400">registres</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 mt-1.5">
                ● Données communales prêtes
              </p>
            </div>
          </div>

          {/* KPI 2 : Formats Validés */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#071322] border border-slate-200/80 dark:border-slate-800 border-t-2 border-t-amber-500 shadow-2xs min-h-[142px] flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Formats Disponibles
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                <FileJson size={15} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-[#0B2545] dark:text-white leading-none">
                  2
                </span>
                <span className="text-xs font-bold text-slate-400">standards</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 mt-1.5">
                ● CSV (Excel) &amp; PDF Officiel
              </p>
            </div>
          </div>

          {/* KPI 3 : Couverture SIG */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#071322] border border-slate-200/80 dark:border-slate-800 border-t-2 border-t-emerald-500 shadow-2xs min-h-[142px] flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Couverture SIG
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <Map size={15} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-[#0B2545] dark:text-white leading-none">
                  100%
                </span>
                <span className="text-xs font-bold text-slate-400">territoire</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mt-1.5">
                ● Commune de Thiaroye-sur-Mer
              </p>
            </div>
          </div>

          {/* KPI 4 : Synchronisation Base */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#071322] border border-slate-200/80 dark:border-slate-800 border-t-2 border-t-red-500 shadow-2xs min-h-[142px] flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Synchronisation
              </span>
              <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/60 text-[#CC131A] dark:text-red-400 flex items-center justify-center">
                <Zap size={15} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-[#0B2545] dark:text-white leading-none">
                  Directe
                </span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-wider text-[#CC131A] dark:text-red-400 mt-1.5">
                ● Données extraites en temps réel
              </p>
            </div>
          </div>
        </div>

        {/* ── Bannières de notifications (Succès / Erreur) ── */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-[#CC131A] dark:text-red-300 text-xs font-bold flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <Download size={15} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* ── 3. GRILLE DES 6 CARTES D'EXPORTATION ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {EXPORT_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <div
                key={type.id}
                className="bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <Icon size={20} className={type.iconColor} />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {type.csvSupported && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          CSV
                        </span>
                      )}
                      {type.pdfSupported && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950 text-[#CC131A] dark:text-red-300">
                          PDF
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-[#0B2545] dark:text-white tracking-tight">
                      {type.label}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {type.description}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                    <span className="font-bold block text-[10px] uppercase text-slate-400 mb-0.5">
                      Données incluses :
                    </span>
                    {type.details}
                  </div>
                </div>

                {/* Boutons d'export (CSV premier pour compatibilité des tests) */}
                <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {type.csvSupported && (
                    <button
                      type="button"
                      onClick={() => handleExport(type.id, 'csv')}
                      disabled={loading === `${type.id}-csv`}
                      className={`${
                        type.pdfSupported ? 'flex-1' : 'w-full'
                      } flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#0B2545] dark:text-slate-200 transition text-xs font-black disabled:opacity-60 cursor-pointer active:scale-95`}
                      title="Télécharger en CSV (Excel compatible)"
                    >
                      {loading === `${type.id}-csv` ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <FileJson size={14} />
                      )}
                      <span>CSV</span>
                    </button>
                  )}

                  {type.pdfSupported && (
                    <button
                      type="button"
                      onClick={() => handleExport(type.id, 'pdf')}
                      disabled={loading === `${type.id}-pdf`}
                      className={`${
                        type.csvSupported ? 'flex-1' : 'w-full'
                      } flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#CC131A] hover:bg-red-800 text-white transition text-xs font-black disabled:opacity-60 cursor-pointer shadow-2xs active:scale-95`}
                      title="Télécharger en PDF (avec logo et mise en forme)"
                    >
                      {loading === `${type.id}-pdf` ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <FileText size={14} />
                      )}
                      <span>PDF</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 4. NOTICE MÉTHODOLOGIQUE ET RÉGLEMENTAIRE ── */}
        <div className="bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Download size={16} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#0B2545] dark:text-white">
                Astuces d’utilisation
              </h4>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-1 leading-relaxed">
                <li>
                  • <strong className="text-slate-700 dark:text-slate-200">CSV :</strong> Format tabulaire, compatible Excel, Google Sheets, etc.
                </li>
                <li>
                  • <strong className="text-slate-700 dark:text-slate-200">PDF :</strong> Rapports formatés avec logo Mbeund-Mi et charte graphique
                </li>
                <li>
                  • Les exports incluent les données actuelles de la base de données
                </li>
                <li>
                  • Vous pouvez exporter autant de fois que nécessaire
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AutoriteShell>
  );
}
