import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  Clock,
  CheckCircle2,
  ChevronRight,
  X,
  MapPin,
  AlertTriangle,
  Droplets,
  Calendar,
  Eye,
} from 'lucide-react';
import { useMySignalements } from '../../shared/hooks/useMySignalements';
import { useAuth } from '../../auth/AuthContext';

// Signalements réalistes avec photos authentiques du contexte de Thiaroye-sur-Mer
const DEFAULT_SIGNALEMENTS = [
  {
    id: 'demo-sig-1',
    categorie: 'Égouts & Caniveau',
    categorie_display: 'Égouts & Caniveau',
    quartier: 'Ndakhane (Thiaroye)',
    rue: 'Zone basse / Cuvette Ruelle 4',
    description: 'Caniveau bouché par le sable transporté par le ruissellement. Début de refoulement vers deux concessions.',
    photo: '/images/caniveau-thiaroye.jpg',
    niveau_eau_display: 'Modéré',
    date_creation: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    valide: false,
    statutLabel: 'En examen par les services municipaux',
  },
  {
    id: 'demo-sig-2',
    categorie: 'Inondation de ruelle',
    categorie_display: 'Inondation de ruelle',
    quartier: 'Thiaroye Gare (Rue 10)',
    rue: 'Rue 10 Marché',
    description: 'Forte accumulation d’eau pluviale. Passerelle de parpaings disposée pour sécuriser le passage piéton.',
    photo: '/images/ruelle-thiaroye.jpg',
    niveau_eau_display: 'Élevé',
    date_creation: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
    valide: true,
    statutLabel: 'Validé · Pris en charge par l’équipe d’intervention',
  },
  {
    id: 'demo-sig-3',
    categorie: 'Pompage d’urgence',
    categorie_display: 'Pompage d’urgence',
    quartier: 'Thiaroye Plage',
    rue: 'Secteur Débarcadère',
    categorie_label: 'Pompage actif',
    description: 'Grande marre d’eau pluviale évacuée par motopompe ONAS. Voie dégagée et circulation rétablie.',
    photo: '/images/pompage-thiaroye.jpg',
    niveau_eau_display: 'Faible',
    date_creation: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
    valide: true,
    statutLabel: 'Validé · Drainage communautaire terminé',
  },
];

const FALLBACK_PHOTOS = [
  '/images/caniveau-thiaroye.jpg',
  '/images/ruelle-thiaroye.jpg',
  '/images/pompage-thiaroye.jpg',
  '/images/solidarite-thiaroye.jpg',
  '/images/bassin-thiaroye.jpg',
];

export default function MesSignalementsWidget({ className = '' }) {
  const { user } = useAuth();
  const { data, isLoading } = useMySignalements();
  const [showHistoriqueModal, setShowHistoriqueModal] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [filterType, setFilterType] = useState('tous'); // 'tous' | 'valides' | 'attente'

  // Liste des signalements du citoyen (format paginé Django ou tableau direct)
  const apiSignalements = data?.results ?? (Array.isArray(data) ? data : []);

  // Si l'API retourne des signalements, on les enrichit avec une photo de fallback au besoin
  // Sinon, on affiche les signalements réalistes de démonstration de Thiaroye
  const allSignalements = apiSignalements.length > 0
    ? apiSignalements.map((s, idx) => ({
        ...s,
        photo: s.photo || FALLBACK_PHOTOS[idx % FALLBACK_PHOTOS.length],
        quartier: s.quartier || 'Thiaroye-sur-Mer',
        statutLabel: s.valide ? 'Validé par les autorités' : 'En examen par les services municipaux',
      }))
    : DEFAULT_SIGNALEMENTS;

  const recents = allSignalements.slice(0, 3);

  // Filtrage pour la modale d'historique
  const filteredModalList = allSignalements.filter((item) => {
    if (filterType === 'valides') return item.valide;
    if (filterType === 'attente') return !item.valide;
    return true;
  });

  return (
    <div className={`bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 rounded-3xl p-5 shadow-xs transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[1.025] hover:-translate-y-1.5 hover:shadow-2xl hover:border-navy-300 dark:hover:border-navy-600 will-change-transform flex flex-col justify-between ${className}`}>
      <div>
        {/* ── EN-TÊTE AVEC BOUTON "VOIR MES SIGNALEMENTS" À DROITE (OPTION B) ── */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red/15 text-[#CC131A] dark:text-red-400 flex items-center justify-center flex-shrink-0">
              <Clock size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-navy-900 dark:text-white">
                Mes signalements
              </h3>
              <span className="text-[11px] text-navy-500 dark:text-navy-400">
                Suivi direct de vos alertes
              </span>
            </div>
          </div>

          {/* Lien "Voir mes signalements" redirigeant vers la page d'historique complète */}
          <Link
            to="/citoyen/mes-signalements"
            className="text-xs font-bold text-[#CC131A] dark:text-red-400 hover:underline flex items-center gap-0.5 cursor-pointer py-1 px-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition"
            title="Consulter l'historique complet de mes signalements"
          >
            <span>Voir mes signalements</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* ── LISTE DES 3 SIGNALEMENTS AVEC PHOTOS RÉALISTES DE THIAROYE ── */}
        {isLoading && apiSignalements.length === 0 ? (
          <div className="py-8 text-center text-xs text-navy-400 animate-pulse">
            Chargement de vos signalements…
          </div>
        ) : (
          <div className="space-y-2.5">
            {recents.map((sig, idx) => {
              const dateStr = sig.date_creation
                ? new Date(sig.date_creation).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Récemment';

              const photoUrl = sig.photo || FALLBACK_PHOTOS[idx % FALLBACK_PHOTOS.length];

              return (
                <div
                  key={sig.id || `sig-${idx}`}
                  onClick={() => setSelectedDetail(sig)}
                  className="flex items-center gap-3 p-2.5 rounded-2xl bg-navy-50/50 dark:bg-white/5 border border-navy-100/80 dark:border-navy-800 hover:border-red-200 dark:hover:border-red-900/60 transition-all duration-200 cursor-pointer group"
                  title="Cliquer pour voir les détails de ce signalement"
                >
                  {/* Photo réaliste sur le conteneur à gauche */}
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden flex-shrink-0 border border-navy-200/80 dark:border-navy-700 shadow-xs">
                    <img
                      src={photoUrl}
                      alt={sig.description || 'Signalement'}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#071322] bg-emerald-500" />
                  </div>

                  {/* Contenu textuel à côté */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-black text-navy-900 dark:text-white truncate group-hover:text-[#CC131A] transition-colors">
                        {sig.categorie_display || sig.categorie || 'Inondation'}
                      </span>

                      {/* Badge de statut */}
                      {sig.valide ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full flex-shrink-0">
                          <CheckCircle2 size={11} />
                          <span>Validé</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full flex-shrink-0">
                          <Clock size={11} />
                          <span>En examen</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-navy-600 dark:text-navy-300 line-clamp-1 leading-snug">
                      {sig.description || 'Signalement transmis par vos soins.'}
                    </p>

                    <div className="flex items-center gap-2 mt-1 text-[10px] text-navy-400 dark:text-navy-400 font-medium truncate">
                      <span className="truncate">{sig.quartier || 'Thiaroye'}</span>
                      <span>·</span>
                      <span className="flex-shrink-0">{dateStr}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── BOUTON D'ACTION INFÉRIEUR : CRÉER UN NOUVEAU SIGNALEMENT ── */}
      <Link
        to="/citoyen/signaler"
        className="mt-3.5 w-full py-2.5 px-3 rounded-2xl bg-navy-50 hover:bg-red-50 dark:bg-navy-900/50 dark:hover:bg-red-950/30 text-navy-800 hover:text-[#CC131A] dark:text-navy-100 dark:hover:text-red-400 border border-navy-100 dark:border-navy-800 text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer"
      >
        <Camera size={14} className="text-[#CC131A]" />
        <span>+ Signaler une inondation</span>
      </Link>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ── MODALE 1 : HISTORIQUE COMPLET DE MES SIGNALEMENTS (Au clic bouton) ── */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {showHistoriqueModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowHistoriqueModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white dark:bg-[#071322] rounded-3xl overflow-hidden shadow-2xl border border-navy-100 dark:border-navy-800 flex flex-col max-h-[88vh]"
          >
            {/* Header de la modale */}
            <div className="p-4 sm:p-5 border-b border-navy-100 dark:border-navy-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red/15 text-[#CC131A] flex items-center justify-center">
                  <Clock size={18} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-navy-900 dark:text-white">
                    Historique de mes signalements
                  </h3>
                  <p className="text-xs text-navy-500 dark:text-navy-400">
                    {allSignalements.length} alerte{allSignalements.length > 1 ? 's' : ''} transmise{allSignalements.length > 1 ? 's' : ''} depuis votre compte
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowHistoriqueModal(false)}
                className="w-8 h-8 rounded-full bg-navy-100 dark:bg-navy-800 hover:bg-navy-200 dark:hover:bg-navy-700 text-navy-600 dark:text-navy-200 flex items-center justify-center transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Onglets de filtrage */}
            <div className="px-5 pt-3 flex items-center gap-2 border-b border-navy-100/60 dark:border-navy-800/60">
              <button
                type="button"
                onClick={() => setFilterType('tous')}
                className={`pb-2.5 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
                  filterType === 'tous'
                    ? 'border-[#CC131A] text-[#CC131A]'
                    : 'border-transparent text-navy-500 hover:text-navy-800 dark:text-navy-400'
                }`}
              >
                Tous ({allSignalements.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('valides')}
                className={`pb-2.5 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
                  filterType === 'valides'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-navy-500 hover:text-navy-800 dark:text-navy-400'
                }`}
              >
                Validés ({allSignalements.filter((s) => s.valide).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('attente')}
                className={`pb-2.5 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
                  filterType === 'attente'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-navy-500 hover:text-navy-800 dark:text-navy-400'
                }`}
              >
                En examen ({allSignalements.filter((s) => !s.valide).length})
              </button>
            </div>

            {/* Corps de la modale : Liste complète avec photos */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5">
              {filteredModalList.map((sig, idx) => {
                const dateFull = sig.date_creation
                  ? new Date(sig.date_creation).toLocaleString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Récemment';

                const photoUrl = sig.photo || FALLBACK_PHOTOS[idx % FALLBACK_PHOTOS.length];

                return (
                  <div
                    key={sig.id || `modal-sig-${idx}`}
                    className="p-3.5 rounded-2xl bg-navy-50/50 dark:bg-white/5 border border-navy-100 dark:border-navy-800 flex flex-col sm:flex-row gap-3.5 items-start"
                  >
                    {/* Grande photo du signalement */}
                    <img
                      src={photoUrl}
                      alt={sig.categorie}
                      className="w-full sm:w-28 sm:h-28 h-40 rounded-xl object-cover border border-navy-200 dark:border-navy-700 flex-shrink-0"
                    />

                    {/* Détails complets */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-sm font-black text-navy-900 dark:text-white">
                          {sig.categorie_display || sig.categorie || 'Inondation'}
                        </span>
                        {sig.valide ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 size={12} />
                            Validé par les autorités
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full">
                            <Clock size={12} />
                            En cours de traitement
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-navy-700 dark:text-navy-200 leading-relaxed">
                        {sig.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-navy-500 dark:text-navy-400 pt-1">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-[#CC131A]" />
                          {sig.quartier}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {dateFull}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer de la modale */}
            <div className="p-4 border-t border-navy-100 dark:border-navy-800 bg-navy-50/40 dark:bg-black/20 flex items-center justify-between">
              <Link
                to="/citoyen/signaler"
                onClick={() => setShowHistoriqueModal(false)}
                className="px-4 py-2 rounded-xl bg-[#CC131A] hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <Camera size={14} />
                <span>Nouveau signalement</span>
              </Link>
              <button
                type="button"
                onClick={() => setShowHistoriqueModal(false)}
                className="px-4 py-2 rounded-xl bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-200 text-xs font-bold hover:bg-navy-200 dark:hover:bg-navy-700 transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ── MODALE 2 : FICHE DE DÉTAIL D'UN SIGNALEMENT (Au clic sur une carte) ── */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {selectedDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedDetail(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-[#071322] rounded-3xl overflow-hidden shadow-2xl border border-navy-100 dark:border-navy-800 flex flex-col"
          >
            {/* Image d'en-tête */}
            <div className="relative h-48 w-full overflow-hidden">
              <img
                src={selectedDetail.photo || FALLBACK_PHOTOS[0]}
                alt={selectedDetail.categorie}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Contenu */}
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-base font-black text-navy-900 dark:text-white">
                  {selectedDetail.categorie_display || selectedDetail.categorie}
                </span>
                {selectedDetail.valide ? (
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 size={12} />
                    Validé
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full">
                    <Clock size={12} />
                    En examen
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-navy-700 dark:text-navy-200 leading-relaxed">
                {selectedDetail.description}
              </p>

              <div className="space-y-1.5 pt-2 border-t border-navy-100 dark:border-navy-800 text-xs text-navy-600 dark:text-navy-300">
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-[#CC131A]" />
                  <span>{selectedDetail.quartier}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  <span>
                    Transmis le{' '}
                    {new Date(selectedDetail.date_creation).toLocaleString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="w-full mt-2 py-2.5 rounded-xl bg-navy-900 dark:bg-white text-white dark:text-navy-900 text-xs font-bold hover:opacity-90 transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
