import { useEffect } from 'react';
import {
  Printer,
  X,
  ShieldAlert,
  Droplet,
  Users,
  Compass,
  CheckCircle2,
  Clock,
  MapPin,
  Flame,
  FileText,
} from 'lucide-react';

export default function FicheSituationModal({ isOpen, onClose }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/80 backdrop-blur-md transition-opacity"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sitrep-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-white dark:bg-[#071322] rounded-3xl overflow-hidden shadow-2xl border border-navy-100 dark:border-navy-800 text-navy-900 dark:text-white flex flex-col max-h-[92vh] my-auto animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header modale avec actions */}
        <div className="p-4 sm:p-5 border-b border-navy-100 dark:border-navy-800 flex items-center justify-between flex-shrink-0 bg-slate-100/70 dark:bg-navy-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-navy-900 dark:bg-white text-white dark:text-navy-950 flex items-center justify-center flex-shrink-0 shadow-md">
              <FileText size={20} />
            </div>
            <div>
              <h3 id="sitrep-modal-title" className="text-base sm:text-lg font-black text-navy-900 dark:text-white">
                Fiche de Situation de Crise (SITREP)
              </h3>
              <p className="text-xs text-navy-500 dark:text-navy-400">
                Bulletin officiel d'état-major · Mbeund-Mi Thiaroye
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              title="Imprimer ou enregistrer en PDF la fiche officielle"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Imprimer / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-200 flex items-center justify-center hover:bg-navy-200 dark:hover:bg-navy-700 active:scale-95 transition cursor-pointer flex-shrink-0"
              aria-label="Fermer la fiche de situation"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Corps de la Fiche de Situation (Style document officiel imprimable) */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm bg-white dark:bg-[#071322]">
          {/* En-tête administratif officiel */}
          <div className="border-b-2 border-navy-900 dark:border-white/20 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-navy-500 dark:text-navy-400 block">
                RÉPUBLIQUE DU SÉNÉGAL
              </span>
              <strong className="text-sm sm:text-base font-extrabold text-navy-950 dark:text-white">
                RÉGION DE DAKAR · DÉPARTEMENT DE PIKINE
              </strong>
              <p className="text-xs text-navy-600 dark:text-navy-300">
                COMMUNE DE THIAROYE-SUR-MER · POSTE DE COMMANDEMENT FIXE
              </p>
            </div>
            <div className="text-right sm:border-l sm:border-navy-200 sm:dark:border-navy-800 sm:pl-4">
              <span className="text-[10px] font-mono text-navy-400 block">DOC N° SITREP-{Date.now().toString().slice(-6)}</span>
              <span className="font-extrabold text-navy-900 dark:text-white">{currentDate} à {currentTime}</span>
            </div>
          </div>

          {/* Niveau de vigilance & Statut ORSEC */}
          <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border-2 border-orange-500/40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <ShieldAlert size={26} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-800 dark:text-orange-300">
                  Plan Communal de Sauvegarde (ORSEC)
                </span>
                <h4 className="text-base sm:text-lg font-black text-orange-950 dark:text-orange-100">
                  PHASE 2 : ALERTE ORANGE RENFORCÉE
                </h4>
                <p className="text-xs text-orange-900/80 dark:text-orange-200">
                  Risque de submersion pluviale et maritime combinée. Coordination active Mairie & BNSP.
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-orange-500 text-white px-3 py-1 rounded-full uppercase shrink-0">
              Actif
            </span>
          </div>

          {/* Tableaux des indicateurs opérationnels consolidés */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-navy-50/70 dark:bg-navy-900/40 border border-navy-100 dark:border-navy-800 space-y-1">
              <div className="flex items-center gap-1.5 text-navy-500 dark:text-navy-400 text-xs font-bold">
                <Droplet size={14} className="text-blue-500" />
                <span>Zones Sous Surveillance</span>
              </div>
              <p className="text-xl font-black text-navy-900 dark:text-white">3 Secteurs</p>
              <span className="text-[10px] text-navy-500 dark:text-navy-400">Cuvette Ouest, Fass, Ndakhane</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-navy-50/70 dark:bg-navy-900/40 border border-navy-100 dark:border-navy-800 space-y-1">
              <div className="flex items-center gap-1.5 text-navy-500 dark:text-navy-400 text-xs font-bold">
                <Flame size={14} className="text-red-500" />
                <span>Motopompes ONAS</span>
              </div>
              <p className="text-xl font-black text-navy-900 dark:text-white">4 Actives</p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Rejet marin : 1200 m³/h</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-navy-50/70 dark:bg-navy-900/40 border border-navy-100 dark:border-navy-800 space-y-1">
              <div className="flex items-center gap-1.5 text-navy-500 dark:text-navy-400 text-xs font-bold">
                <Users size={14} className="text-emerald-500" />
                <span>Refuges d'Accueil</span>
              </div>
              <p className="text-xl font-black text-navy-900 dark:text-white">65 Hébergés</p>
              <span className="text-[10px] text-navy-500 dark:text-navy-400">Capacité CEM Gare : 250 lits</span>
            </div>
          </div>

          {/* Synthèse des signalements citoyens du jour */}
          <div className="space-y-2">
            <h5 className="font-black uppercase tracking-wider text-navy-900 dark:text-white text-xs flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-500" />
              État d'Avancement des Interventions Terrain
            </h5>
            <div className="border border-navy-100 dark:border-navy-800 rounded-2xl overflow-hidden text-xs">
              <div className="grid grid-cols-4 bg-navy-50 dark:bg-navy-900/60 p-2.5 font-bold text-navy-600 dark:text-navy-300">
                <span>Quartier</span>
                <span>Type Risque</span>
                <span>Moyens Engagés</span>
                <span className="text-right">Statut</span>
              </div>
              <div className="divide-y divide-navy-100 dark:divide-navy-800">
                <div className="grid grid-cols-4 p-2.5 items-center">
                  <span className="font-bold">Cuvette Ouest</span>
                  <span>Eau aux genoux (38 cm)</span>
                  <span>2 Motopompes ONAS</span>
                  <span className="text-right text-amber-600 font-bold">En pompage</span>
                </div>
                <div className="grid grid-cols-4 p-2.5 items-center">
                  <span className="font-bold">Rue 12 Fass</span>
                  <span>Caniveau obstrué</span>
                  <span>Équipe curage voirie</span>
                  <span className="text-right text-emerald-600 font-bold">Sécurisé</span>
                </div>
                <div className="grid grid-cols-4 p-2.5 items-center">
                  <span className="font-bold">Thiaroye Plage</span>
                  <span>Surcote marée haute</span>
                  <span>Détachement BNSP (18)</span>
                  <span className="text-right text-blue-600 font-bold">Veille active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Directives émises par le commandement */}
          <div className="p-4 rounded-2xl bg-navy-50/60 dark:bg-white/5 border border-navy-100 dark:border-navy-800 space-y-2">
            <h5 className="font-black uppercase tracking-wider text-navy-900 dark:text-white text-xs">
              Consignes Opérationnelles en Vigueur
            </h5>
            <ul className="space-y-1.5 text-xs text-navy-700 dark:text-navy-300 list-disc list-inside">
              <li>Maintien de la permanence téléphonique au standard de crise communal (<strong>18</strong> et <strong>+221 33 834 00 00</strong>).</li>
              <li>Surveillance horaire du capteur IoT marégraphe du Débarcadère lors de la marée montante.</li>
              <li>Distribution des kits de première nécessité aux résidents accueillis au CEM Thiaroye Gare.</li>
            </ul>
          </div>
        </div>

        {/* Footer avec signature officielle */}
        <div className="p-4 border-t border-navy-100 dark:border-navy-800 bg-slate-50 dark:bg-navy-950 flex items-center justify-between text-xs text-navy-500 dark:text-navy-400 flex-shrink-0">
          <span>Généré automatiquement par le Système Mbeund-Mi · Certifié conforme</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-navy-900 dark:bg-white text-white dark:text-navy-900 font-bold transition active:scale-95 cursor-pointer shadow-xs"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

