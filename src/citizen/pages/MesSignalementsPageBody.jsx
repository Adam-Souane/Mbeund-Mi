import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  X,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Camera,
  Maximize2,
  Filter,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  Droplets,
} from 'lucide-react';
import CitizenShell from '../shared/CitizenShell';
import { useMySignalements } from '../../shared/hooks/useMySignalements';
import { formatCompactDate } from '../../shared/utils/dateFormatter';

// Photos de remplacement authentiques de Thiaroye en cas de défaut de chargement
const FALLBACK_PHOTOS = [
  '/images/caniveau-thiaroye.jpg',
  '/images/ruelle-thiaroye.jpg',
  '/images/pompage-thiaroye.jpg',
  '/images/solidarite-thiaroye.jpg',
  '/images/bassin-thiaroye.jpg',
];

// Signalements témoins réalistes si aucun signalement serveur n'est encore enregistré
const DEFAULT_SIGNALEMENTS = [
  {
    id: 'demo-sig-1',
    categorie: 'Égouts & Caniveau',
    quartier: 'Ndakhane (Thiaroye)',
    rue: 'Zone basse / Cuvette Ruelle 4',
    description: 'Caniveau bouché par le sable et détritus transportés par le ruissellement. Début de refoulement vers deux concessions riveraines nécessitant un curage d’urgence.',
    photo: '/images/caniveau-thiaroye.jpg',
    date_creation: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    valide: false,
    statutCode: 'en_attente',
    statutLabel: 'En attente d’examen municipal',
  },
  {
    id: 'demo-sig-2',
    categorie: 'Inondation',
    quartier: 'Thiaroye Gare',
    rue: 'Rue 10 Marché',
    description: 'Forte accumulation d’eau pluviale rendant la ruelle impraticable pour les piétons et commerces. Des parpaings ont été disposés provisoirement par les riverains.',
    photo: '/images/ruelle-thiaroye.jpg',
    date_creation: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
    valide: true,
    statutCode: 'en_cours',
    statutLabel: 'En cours d’intervention (Équipe déployée)',
  },
  {
    id: 'demo-sig-3',
    categorie: 'Pompage d’urgence',
    quartier: 'Thiaroye Plage',
    rue: 'Secteur Débarcadère',
    description: 'Grande marre d’eau pluviale évacuée par motopompe ONAS. Voie complètement dégagée, risque de refoulement écarté et circulation piétonne rétablie.',
    photo: '/images/pompage-thiaroye.jpg',
    date_creation: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
    valide: true,
    statutCode: 'resolus',
    statutLabel: 'Résolu · Drainage terminé',
  },
];

function determineStatut(s) {
  if (s.statutCode) return s.statutCode;
  if (!s.valide) return 'en_attente';
  if (s.resolu || s.statut === 'resolu' || /terminé|résolu|asséché|sécurisé/i.test(s.statutLabel || '')) {
    return 'resolus';
  }
  return 'en_cours';
}

function getStatutBadge(statut) {
  switch (statut) {
    case 'en_attente':
      return {
        label: 'En attente',
        bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
        icon: Clock,
      };
    case 'en_cours':
      return {
        label: 'En cours',
        bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        dot: 'bg-blue-500',
        icon: Droplets,
      };
    case 'resolus':
      return {
        label: 'Résolu',
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500',
        icon: CheckCircle2,
      };
    default:
      return {
        label: 'Actif',
        bg: 'bg-navy-50 dark:bg-navy-800 text-navy-700 dark:text-navy-200 border-navy-200 dark:border-navy-700',
        dot: 'bg-navy-500',
        icon: ShieldCheck,
      };
  }
}

function getCategorieBadge(cat) {
  const c = String(cat || '').toLowerCase();
  if (c.includes('inondation')) {
    return {
      label: 'Inondation',
      bg: 'bg-red-50 dark:bg-red-950/40 text-[#CC131A] dark:text-red-300 border-red-200 dark:border-red-900',
    };
  }
  if (c.includes('égout') || c.includes('egout') || c.includes('caniveau')) {
    return {
      label: 'Égouts & Caniveau',
      bg: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900',
    };
  }
  return {
    label: cat || 'Signalement terrain',
    bg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-900',
  };
}

export default function MesSignalementsPageBody() {
  const navigate = useNavigate();
  const { data, isLoading } = useMySignalements();

  const [searchParams] = useSearchParams();
  const targetId = searchParams.get('signalementId');
  const [highlightedId, setHighlightedId] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatut, setFilterStatut] = useState('tous'); // 'tous' | 'en_attente' | 'en_cours' | 'resolus'
  const [activePhotoModal, setActivePhotoModal] = useState(null);

  // Normalisation des signalements depuis l'API ou fallback réaliste
  const signalementsList = useMemo(() => {
    const apiResults = data?.results ?? (Array.isArray(data) ? data : []);
    if (apiResults.length > 0) {
      return apiResults.map((s, idx) => {
        const statut = determineStatut(s);
        return {
          id: s.id,
          categorie: s.categorie || 'inondation',
          quartier: s.quartier || 'Thiaroye-sur-Mer',
          rue: s.rue || 'Secteur communal',
          description: s.description || 'Signalement citoyen transmis.',
          photo: s.photo || FALLBACK_PHOTOS[idx % FALLBACK_PHOTOS.length],
          date_creation: s.date_creation || new Date().toISOString(),
          valide: s.valide ?? false,
          statutCode: statut,
          statutLabel:
            statut === 'resolus'
              ? 'Résolu · Intervention terminée'
              : statut === 'en_cours'
                ? 'Pris en charge par la municipalité'
                : 'En attente d’examen',
        };
      });
    }
    return DEFAULT_SIGNALEMENTS;
  }, [data]);

  // Filtrage combiné par statut et par recherche (quartier ou mot-clé)
  const filteredSignalements = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return signalementsList.filter((item) => {
      // Filtre statut
      if (filterStatut !== 'tous' && item.statutCode !== filterStatut) {
        return false;
      }
      // Filtre texte
      if (q) {
        const matchQuartier = (item.quartier || '').toLowerCase().includes(q);
        const matchRue = (item.rue || '').toLowerCase().includes(q);
        const matchDesc = (item.description || '').toLowerCase().includes(q);
        const matchCat = (item.categorie || '').toLowerCase().includes(q);
        if (!matchQuartier && !matchRue && !matchDesc && !matchCat) {
          return false;
        }
      }
      return true;
    });
  }, [signalementsList, filterStatut, searchQuery]);

  // Compteurs pour chaque onglet
  const counts = useMemo(() => {
    return {
      tous: signalementsList.length,
      en_attente: signalementsList.filter((s) => s.statutCode === 'en_attente').length,
      en_cours: signalementsList.filter((s) => s.statutCode === 'en_cours').length,
      resolus: signalementsList.filter((s) => s.statutCode === 'resolus').length,
    };
  }, [signalementsList]);

  // Deep-linking automatique : scrolle et met en évidence le signalement ciblé
  useEffect(() => {
    if (!targetId || !signalementsList?.length) return;
    const targetStr = String(targetId);
    const matched = signalementsList.find((s) => String(s.id) === targetStr);
    if (matched) {
      if (filterStatut !== 'tous' && matched.statutCode !== filterStatut) {
        setFilterStatut('tous');
      }
      setHighlightedId(matched.id);
      const timer = setTimeout(() => {
        const el = document.getElementById(`mes-signalements-${matched.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 250);
      const clearTimer = setTimeout(() => {
        setHighlightedId(null);
      }, 6000);
      return () => {
        clearTimeout(timer);
        clearTimeout(clearTimer);
      };
    }
  }, [targetId, signalementsList]);

  return (
    <CitizenShell>
      <div className="flex flex-col gap-6 w-full pb-8">
        {/* En-tête de la page */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-navy-100 dark:border-navy-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/citoyen/signaler')}
              className="p-2.5 rounded-xl bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-700 hover:border-[#CC131A] text-navy-700 dark:text-navy-200 hover:text-[#CC131A] transition shadow-xs cursor-pointer active:scale-95"
              title="Retour au formulaire de signalement"
              aria-label="Retour au signalement"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-navy-900 dark:text-white tracking-tight">
                  Historique de mes signalements
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#CC131A]/10 text-[#CC131A] border border-[#CC131A]/20">
                  {signalementsList.length}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-navy-600 dark:text-navy-300 mt-0.5">
                Suivez en temps réel l'état d'avancement de vos observations à Thiaroye-sur-Mer.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/citoyen/signaler')}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-[#CC131A] hover:bg-red-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <PlusCircle size={16} />
            <span>Nouveau signalement</span>
          </button>
        </div>

        {/* Barre d'outils : Recherche temps réel & Filtres par statut */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Champ de recherche */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par quartier, rue ou mot-clé…"
              className="w-full pl-10 pr-9 py-2.5 rounded-xl text-xs sm:text-sm bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 focus:border-[#CC131A] dark:focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/30 outline-hidden text-navy-900 dark:text-white placeholder:text-navy-400 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-700 dark:hover:text-white"
                aria-label="Effacer la recherche"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Onglets de filtres par statut */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-navy-50/80 dark:bg-navy-900 border border-navy-100 dark:border-navy-800 overflow-x-auto no-scrollbar">
            {[
              { id: 'tous', label: 'Tous', count: counts.tous },
              { id: 'en_attente', label: 'En attente', count: counts.en_attente },
              { id: 'en_cours', label: 'En cours', count: counts.en_cours },
              { id: 'resolus', label: 'Résolus', count: counts.resolus },
            ].map((tab) => {
              const active = filterStatut === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterStatut(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-white dark:bg-[#0B2545] text-navy-900 dark:text-white shadow-xs border border-navy-200/80 dark:border-navy-700'
                      : 'text-navy-600 dark:text-navy-300 hover:text-navy-900 dark:hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      active
                        ? 'bg-[#CC131A] text-white'
                        : 'bg-navy-200/70 dark:bg-navy-800 text-navy-600 dark:text-navy-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Liste des cartes de signalements */}
        {filteredSignalements.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-navy-50 dark:bg-navy-800 text-navy-400 flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-base font-bold text-navy-900 dark:text-white">
              Aucun signalement trouvé
            </h3>
            <p className="text-xs sm:text-sm text-navy-500 dark:text-navy-400 max-w-sm">
              {searchQuery
                ? `Aucun résultat pour « ${searchQuery} » avec le filtre « ${filterStatut} ».`
                : 'Vous n’avez aucun signalement enregistré dans cette catégorie.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatut('tous');
                }}
                className="text-xs font-bold text-[#CC131A] hover:underline cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {filteredSignalements.map((s) => {
              const statutBadge = getStatutBadge(s.statutCode);
              const StatutIcon = statutBadge.icon;
              const catBadge = getCategorieBadge(s.categorie);

              const isHighlighted = highlightedId === s.id;

              return (
                <article
                  key={s.id}
                  id={`mes-signalements-${s.id}`}
                  className={`rounded-2xl sm:rounded-3xl bg-white dark:bg-[#071322] border overflow-hidden transition-all duration-500 flex flex-col justify-between ${
                    isHighlighted
                      ? 'ring-4 ring-[#CC131A] border-[#CC131A] shadow-2xl scale-[1.015]'
                      : 'border-navy-100 dark:border-navy-800 shadow-xs hover:shadow-xl hover:-translate-y-1'
                  }`}
                >
                  {/* Bandeau d'accentuation si sélectionné */}
                  {isHighlighted && (
                    <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-black px-4 py-2 flex items-center justify-between shadow-sm">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} className="animate-bounce" />
                        <span>Signalement sélectionné</span>
                      </span>
                      <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                        En évidence
                      </span>
                    </div>
                  )}
                  {/* Photo miniature avec bouton zoom et gestion onError */}
                  <div className="relative h-44 sm:h-48 w-full bg-navy-900 overflow-hidden group">
                    <img
                      src={s.photo}
                      alt={`Observation à ${s.quartier}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_PHOTOS[0];
                      }}
                    />

                    {/* Gradient & badges superposés */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent pointer-events-none" />

                    <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-xs backdrop-blur-xs ${catBadge.bg}`}>
                        {catBadge.label}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActivePhotoModal(s.photo)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-md cursor-pointer"
                      title="Agrandir la photo"
                      aria-label="Agrandir la photo"
                    >
                      <Maximize2 size={15} />
                    </button>

                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-[11px] z-10">
                      <span className="flex items-center gap-1 font-bold truncate drop-shadow-sm">
                        <MapPin size={12} className="text-[#CC131A] flex-shrink-0" />
                        <span className="truncate">{s.quartier}</span>
                      </span>
                      <span className="text-slate-200 text-[10px] flex-shrink-0 drop-shadow-sm font-medium">
                        {formatCompactDate(s.date_creation)}
                      </span>
                    </div>
                  </div>

                  {/* Contenu textuel non tronqué */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      {/* Statut officiel */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statutBadge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statutBadge.dot}`} />
                          <StatutIcon size={12} />
                          <span>{statutBadge.label}</span>
                        </span>

                        <span className="text-[11px] text-navy-400 font-medium">
                          {new Date(s.date_creation).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>

                      {/* Rue & localisation */}
                      {s.rue && (
                        <div className="text-xs font-semibold text-navy-500 dark:text-navy-400">
                          {s.rue}
                        </div>
                      )}

                      {/* Description complète SANS coupure */}
                      <p className="text-xs sm:text-sm text-navy-800 dark:text-navy-100 leading-relaxed break-words whitespace-pre-line">
                        {s.description}
                      </p>
                    </div>

                    {/* Pied de carte avec statut détaillé & bouton carte */}
                    <div className="pt-3 border-t border-navy-50 dark:border-navy-800/80 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-navy-500 dark:text-navy-400 italic truncate">
                        {s.statutLabel}
                      </span>

                      <button
                        type="button"
                        onClick={() => navigate(`/citoyen/carte?signalementId=${s.id}&quartier=${encodeURIComponent(s.quartier || '')}`)}
                        className="text-xs font-extrabold text-[#CC131A] hover:underline flex items-center gap-1 flex-shrink-0 cursor-pointer"
                        title="Localiser ce signalement sur la carte interactive"
                      >
                        <span>Carte</span>
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Modale d'agrandissement de photo */}
        {activePhotoModal && (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setActivePhotoModal(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] bg-navy-950 rounded-2xl overflow-hidden shadow-2xl border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setActivePhotoModal(null)}
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition cursor-pointer"
                aria-label="Fermer la vue plein écran"
              >
                <X size={18} />
              </button>
              <img
                src={activePhotoModal}
                alt="Aperçu du signalement"
                className="w-full h-auto max-h-[85vh] object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </CitizenShell>
  );
}
