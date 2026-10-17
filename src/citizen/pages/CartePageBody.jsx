import { useMemo, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Navigation,
  Loader2,
  X,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Layers,
  Maximize2,
  Minimize2,
  Clock,
  CornerUpRight,
  CornerUpLeft,
  ArrowRight,
  Flag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import CitizenShell from '../shared/CitizenShell';
import InteractiveMap from '../../shared/components/map/InteractiveMap';
import RiskBadge from '../../shared/components/RiskBadge';
import { useZones } from '../../shared/hooks/useZones';
import { useSegments } from '../../shared/hooks/useSegments';
import { useInondations } from '../../shared/hooks/useInondations';
import { useSignalementsApercu } from '../../shared/hooks/useSignalements';
import { useRefuges } from '../../shared/hooks/useRefuges';
import { useGeolocation } from '../../shared/hooks/useGeolocation';
import { useItineraireSecurise } from '../../shared/hooks/useItineraireSecurise';
import ItineraireNavigationOverlay from '../components/ItineraireNavigationOverlay';
import { flattenApiErrors } from '../../shared/utils/apiErrors';
import { COMMUNAUTE_POSTS } from '../../shared/data/riverainsData';
import { sanitizePublicAuthor, sanitizePublicText } from '../../shared/utils/sanitizer';
import { useAuth } from '../../auth/AuthContext';
import { getUserCustomAvatar } from '../../shared/utils/avatarResolver';

// Référentiel SIG de coordonnées pour tout Thiaroye-sur-Mer (100% sur la terre ferme habitée)
const THIAROYE_QUARTIERS_COORDS = {
  'cuvette ouest': [14.7470, -17.4045],
  cuvette: [14.7470, -17.4045],
  ndakhane: [14.7450, -17.3820],
  plage: [14.7438, -17.3910],
  gare: [14.7570, -17.3752],
  thiaroye: [14.7485, -17.3850],
  fass: [14.7520, -17.3792],
  'sam sam': [14.7550, -17.3715],
  'tally diallo': [14.7495, -17.3745],
  darou: [14.7525, -17.3840],
  baghdad: [14.7490, -17.3815],
  'guinaw rail': [14.7610, -17.3685],
  minam: [14.7555, -17.3780],
};

// Classification temporelle des signalements
function getSignalementTimeBucket(item) {
  const dateStr =
    item.properties?.date_creation ||
    item.date_creation ||
    item.properties?.date ||
    item.date;

  if (!dateStr) return 'aujourdhui';

  if (
    typeof dateStr === 'string' &&
    (dateStr.includes('instant') ||
      dateStr.includes('Aujourd') ||
      dateStr.includes('h') ||
      dateStr.includes('min'))
  ) {
    return 'aujourdhui';
  }

  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) return 'aujourdhui';

  const now = new Date();
  const isSameDay =
    dateObj.getDate() === now.getDate() &&
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getFullYear() === now.getFullYear();

  if (isSameDay) return 'aujourdhui';

  const diffHours = (now.getTime() - dateObj.getTime()) / (1000 * 3600);
  if (diffHours <= 24) return 'aujourdhui';
  if (diffHours <= 24 * 7) return 'semaine';
  if (diffHours <= 24 * 30) return 'mois';
  return 'anciens';
}

export default function CartePageBody() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSignalementId = searchParams.get('signalementId');
  const selectedQuartier = searchParams.get('quartier');

  // Détection sécurisée du citoyen connecté et de son avatar personnalisé
  let authData = { username: '', user: null };
  try {
    authData = useAuth();
  } catch {}
  const { username = '', user = null } = authData || {};
  const nomCitoyen = user?.prenom ? `${user.prenom} ${user.nom || ''}`.trim() : (username || '');

  const [currentUserCustomAvatar, setCurrentUserCustomAvatar] = useState(() => getUserCustomAvatar(username));

  useEffect(() => {
    const handleAvatarUpdated = () => {
      setCurrentUserCustomAvatar(getUserCustomAvatar(username));
    };
    window.addEventListener('mbeund_mi_avatar_updated', handleAvatarUpdated);
    return () => window.removeEventListener('mbeund_mi_avatar_updated', handleAvatarUpdated);
  }, [username]);

  // État local du signalement actif pour interaction immédiate au clic
  const [activeSignalementId, setActiveSignalementId] = useState(urlSignalementId || null);

  // Filtre temporel : 'aujourdhui' par défaut comme demandé par l'utilisateur
  const [timeFilter, setTimeFilter] = useState('aujourdhui');
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Fermer le plein écran à l'appui sur Échap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMapFullscreen) {
        setIsMapFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMapFullscreen]);

  const mapSectionRef = useRef(null);
  const bottomSectionRef = useRef(null);

  const scrollToBottom = () => {
    if (bottomSectionRef.current) {
      bottomSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToMapIfMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // État des couches actives affichées sur la carte
  const [layersVisibility, setLayersVisibility] = useState({
    zones: true,
    signalements: true,
    segments: true,
    refuges: true,
  });

  const handleToggleLayer = (key) => {
    setLayersVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
    scrollToMapIfMobile();
  };

  const { data: zonesData, isLoading } = useZones();
  const { data: segmentsData } = useSegments();
  const { data: inondationsData } = useInondations();
  const { data: signalementsData } = useSignalementsApercu();
  const { data: refugesData } = useRefuges();
  const { status: geoStatus } = useGeolocation();
  const itineraire = useItineraireSecurise();

  // 1. Fusion complète de tous les signalements réels et citoyens de Thiaroye
  const allSignalements = useMemo(() => {
    let myPostIds = {};
    try {
      myPostIds = JSON.parse(localStorage.getItem('mbeund_mi_my_post_ids') || '{}');
    } catch {}

    const checkIsMine = (id, rawBackendId, isUserPost, authorName) => {
      const sid = String(id ?? '');
      const sraw = String(rawBackendId ?? '');
      if (sid && myPostIds[sid]) return true;
      if (sraw && myPostIds[sraw]) return true;
      if (isUserPost) return true;
      if (sid.startsWith('user-') || sid.startsWith('shared-sig-')) return true;
      if (nomCitoyen && authorName && authorName.toLowerCase() === nomCitoyen.toLowerCase()) return true;
      return false;
    };

    const rawList = [...(signalementsData?.results?.features ?? [])];
    const list = rawList.map((f) => {
      const fid = f.id ?? f.properties?.id;
      const rawId = f.properties?.rawBackendId;
      const authorName = f.properties?.citoyen_nom || f.properties?.author?.name || '';
      const isMine = checkIsMine(fid, rawId, f.properties?.isUserPost, authorName);
      if (!isMine) return f;
      return {
        ...f,
        properties: {
          ...f.properties,
          isCurrentUser: true,
          currentUserAvatar: currentUserCustomAvatar,
        },
      };
    });

    const existingIds = new Set(list.map((f) => String(f.id ?? f.properties?.id)));

    let userPosts = [];
    try {
      userPosts = JSON.parse(localStorage.getItem('mbeund_mi_user_community_posts') || '[]');
    } catch {}

    const communitySources = [...userPosts, ...COMMUNAUTE_POSTS];
    communitySources.forEach((post, idx) => {
      if (!post || existingIds.has(String(post.id))) return;
      if (post.rawBackendId && existingIds.has(String(post.rawBackendId))) return;

      const q = (post.author?.quartier || post.quartier || '').toLowerCase();
      let coords = [14.747, -17.385];
      for (const [key, val] of Object.entries(THIAROYE_QUARTIERS_COORDS)) {
        if (q.includes(key)) {
          coords = val;
          break;
        }
      }
      // Dispersion fine des avatars dans les ruelles du quartier (strictement vers le nord/est/ouest, jamais vers l'océan au sud)
      const offsetLat = Math.abs((((idx * 7) % 7) - 3) * 0.0004);
      const offsetLon = (((idx * 13) % 9) - 4) * 0.0005;

      const safeLat = Math.max(14.7432, coords[0] + offsetLat);
      const safeLon = coords[1] + offsetLon;

      const authorName = post.author?.name || post.auteur || '';
      const isMine = checkIsMine(post.id, post.rawBackendId, post.isUserPost, authorName);

      list.push({
        id: post.id,
        date_creation: post.date_creation || post.date || new Date().toISOString(),
        geometry: {
          type: 'Point',
          coordinates: [safeLon, safeLat],
        },
        properties: {
          id: post.id,
          rawBackendId: post.rawBackendId,
          categorie: post.categorie || 'Inondation',
          description: sanitizePublicText(post.texte || post.description || 'Montée des eaux signalée par un habitant.'),
          photo: post.image || post.photo,
          valide: post.statut === 'resolu',
          statut: post.statut || 'en_cours',
          citoyen_nom: sanitizePublicAuthor(authorName, 'Sentinelle Citoyenne'),
          citoyen_prenom: '',
          citoyen_quartier: post.author?.quartier || post.quartier || 'Thiaroye-sur-Mer',
          rue: post.rue || null,
          date_creation: post.date_creation || post.date || new Date().toISOString(),
          isSharedOnCommunity: true,
          isCurrentUser: isMine,
          currentUserAvatar: isMine ? (currentUserCustomAvatar || post.author?.avatar) : null,
        },
      });
    });

    return list;
  }, [signalementsData, nomCitoyen, currentUserCustomAvatar]);

  // Position sentinelle en direct du citoyen connecté au cœur de Thiaroye-sur-Mer ("Vous êtes ici")
  const currentUserLocation = useMemo(() => {
    return {
      lat: 14.7485,
      lon: -17.3850,
      name: nomCitoyen || username || 'Sentinelle Citoyenne',
      avatar: currentUserCustomAvatar,
      quartier: 'Thiaroye-sur-Mer',
    };
  }, [nomCitoyen, username, currentUserCustomAvatar]);

  // 2. Filtrage dynamique selon la période choisie et le mot-clé de recherche
  const filteredSignalements = useMemo(() => {
    return allSignalements.filter((item) => {
      const bucket = getSignalementTimeBucket(item);

      // Condition temporelle
      let matchesTime = false;
      if (timeFilter === 'tous') {
        matchesTime = true;
      } else if (timeFilter === 'aujourdhui') {
        matchesTime = bucket === 'aujourdhui';
      } else if (timeFilter === 'semaine') {
        matchesTime = bucket === 'aujourdhui' || bucket === 'semaine';
      } else if (timeFilter === 'mois') {
        matchesTime = bucket === 'aujourdhui' || bucket === 'semaine' || bucket === 'mois';
      } else if (timeFilter === 'anciens') {
        matchesTime = bucket === 'anciens';
      }

      return matchesTime;
    });
  }, [allSignalements, timeFilter]);

  const handleItineraire = () => {
    let startLat = 14.7385;
    let startLon = -17.3920;

    // Si un signalement est sélectionné, on démarre directement depuis ses coordonnées précises
    if (activeSignalementId) {
      const activeItem = allSignalements.find(
        (s) => String(s.id ?? s.properties?.id) === String(activeSignalementId)
      );
      if (activeItem?.geometry?.coordinates) {
        startLon = activeItem.geometry.coordinates[0];
        startLat = activeItem.geometry.coordinates[1];
      }
    }

    const triggerRoute = (lat, lon) => {
      setIsNavigating(false);
      setCurrentStepIndex(0);
      itineraire.mutate({ lat, lon });
    };

    if (!navigator.geolocation) {
      triggerRoute(startLat, startLon);
      return;
    }

    let responded = false;
    const timer = setTimeout(() => {
      if (!responded) {
        responded = true;
        triggerRoute(startLat, startLon);
      }
    }, 2500);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!responded) {
          responded = true;
          clearTimeout(timer);
          triggerRoute(pos.coords.latitude, pos.coords.longitude);
        }
      },
      () => {
        if (!responded) {
          responded = true;
          clearTimeout(timer);
          triggerRoute(startLat, startLon);
        }
      },
      { enableHighAccuracy: true, timeout: 3000 }
    );
  };

  const handleCloseItineraire = () => {
    itineraire.reset();
    setIsNavigating(false);
    setCurrentStepIndex(0);
  };

  return (
    <CitizenShell>
      <div className="w-full flex flex-col gap-4 sm:gap-5 pb-8">
        {/* Bandeau d'en-tête bleu nuit au format Communauté */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B2545] via-[#103565] to-slate-900 text-white p-4 sm:p-5 md:px-6 md:py-5 shadow-lg border border-blue-900/40 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 relative z-10">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight">
                  Carte des risques · Thiaroye
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  En direct
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 line-clamp-2 sm:line-clamp-1">
                Fil d’actualité citoyen, signalements géolocalisés et entraide solidaire entre voisins
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              {itineraire.data ? (
                <button
                  type="button"
                  onClick={handleCloseItineraire}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-black border border-white/20 transition active:scale-95 cursor-pointer w-full sm:w-auto"
                >
                  <X size={16} />
                  <span>Fermer l’itinéraire</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleItineraire}
                  disabled={itineraire.isPending}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#CC131A] hover:bg-red-700 text-white text-xs sm:text-sm font-black shadow-md transition active:scale-95 disabled:opacity-60 cursor-pointer w-full sm:w-auto"
                >
                  {itineraire.isPending ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
                  <span>Itinéraire vers un lieu sûr</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {itineraire.isError && (
          <div className="flex items-start gap-2 px-3.5 py-2 rounded-lg bg-red-50 dark:bg-red/15 text-red-900 dark:text-red-200 text-xs flex-shrink-0">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{flattenApiErrors(itineraire.error)[0]}</span>
          </div>
        )}

        {geoStatus === 'error' && !itineraire.data && !itineraire.isError && (
          <p className="text-xs text-navy-400 flex-shrink-0">
            Localisez-vous pour calculer un itinéraire — la géolocalisation a été refusée ou est indisponible.
          </p>
        )}

        <div className="w-full flex flex-col gap-3">
          {/* ========================================================= */}
          {/* CARTE + BANDEAU LATÉRAL ÉTROIT DE FILTRES TEMPORELS À DROITE */}
          {/* ========================================================= */}
          <div className="w-full flex flex-col lg:flex-row gap-2.5 items-start">
            {/* CARTE INTERACTIVE (Prend l'écrasante majorité de la largeur) */}
            <div
              ref={mapSectionRef}
              className="flex-1 min-w-0 h-[620px] lg:h-[720px] relative rounded-2xl overflow-hidden shadow-sm border border-navy-100 dark:border-navy-800 isolate z-10 scroll-mt-4"
            >
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-navy-900">
                  <p className="text-sm text-navy-400 flex items-center gap-2 font-semibold">
                    <Loader2 size={16} className="animate-spin text-[#CC131A]" />
                    Chargement de la carte de Thiaroye-sur-Mer…
                  </p>
                </div>
              ) : (
                <>
                  <InteractiveMap
                    data={{
                      zones: zonesData,
                      segments: segmentsData,
                      inondations: inondationsData,
                      signalements: filteredSignalements,
                      refuges: refugesData,
                    }}
                    userLocation={currentUserLocation}
                    visibleLayers={layersVisibility}
                    onToggleLayer={handleToggleLayer}
                    onToggleFullscreen={() => setIsMapFullscreen((prev) => !prev)}
                    isFullscreen={isMapFullscreen}
                    route={itineraire.data?.route}
                    itineraireInstructions={itineraire.data?.instructions}
                    isNavigating={isNavigating}
                    currentStepIndex={currentStepIndex}
                    height="100%"
                    selectedSignalementId={activeSignalementId || urlSignalementId}
                    selectedQuartier={selectedQuartier}
                    onCalculateRouteFromPoint={({ lat, lon }) => {
                      setIsNavigating(false);
                      setCurrentStepIndex(0);
                      itineraire.mutate({ lat, lon });
                    }}
                  />

                  {/* OVERLAY INTERACTIF SUR LA MAP : APERÇU ITINÉRAIRE + BOUTON « SUIVRE » + GUIDAGE PAS-À-PAS */}
                  <ItineraireNavigationOverlay
                    itineraireData={itineraire.data}
                    isNavigating={isNavigating}
                    onStartNavigation={() => {
                      setIsNavigating(true);
                      setCurrentStepIndex(0);
                    }}
                    onClose={handleCloseItineraire}
                    currentStepIndex={currentStepIndex}
                    onPrevStep={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                    onNextStep={() => {
                      const total = itineraire.data?.instructions?.length || 0;
                      setCurrentStepIndex((prev) => Math.min(total - 1, prev + 1));
                    }}
                  />
                </>
              )}
            </div>

            {/* BANDE ÉTROITE À DROITE : Filtres temporels épurés sans texte lourd */}
            <aside
              aria-label="Filtres temporels"
              className="w-full lg:w-28 xl:w-32 flex lg:flex-col justify-between sm:justify-start gap-1.5 p-2 bg-white dark:bg-navy-900 rounded-2xl border border-navy-100 dark:border-navy-800 shadow-2xs shrink-0 self-start h-fit overflow-x-auto lg:overflow-x-visible"
            >
              <div className="hidden lg:flex items-center gap-1.5 px-1 py-1 text-[11px] font-bold text-navy-400 dark:text-navy-300 select-none">
                <Clock size={12} className="text-[#CC131A] shrink-0" />
                <span>Période</span>
              </div>

              <div className="flex lg:flex-col gap-1.5 flex-1 w-full">
                {[
                  { id: 'aujourdhui', label: "Aujourd'hui" },
                  { id: 'semaine', label: '7 jours' },
                  { id: 'mois', label: '30 jours' },
                  { id: 'anciens', label: 'Anciens' },
                  { id: 'tous', label: 'Tous' },
                ].map((tab) => {
                  const isActive = timeFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setTimeFilter(tab.id)}
                      className={`w-full text-center px-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                        isActive
                          ? 'bg-navy-950 dark:bg-white text-white dark:text-navy-950 shadow-xs'
                          : 'bg-slate-50 dark:bg-navy-950/70 text-slate-600 dark:text-slate-400 hover:text-navy-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Compteur d'observations discret */}
              <div className="hidden lg:flex items-center justify-center p-1.5 mt-auto bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 text-center leading-tight">
                  {filteredSignalements.length} obs.
                </span>
              </div>

              {/* Bouton de scroll rapide pour franchir la carte sans la toucher */}
              <button
                type="button"
                onClick={scrollToBottom}
                className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-navy-800 dark:text-navy-200 transition-all border border-navy-100 dark:border-navy-700 shadow-2xs cursor-pointer active:scale-95 group shrink-0"
                title="Défiler vers le bas de la page sans toucher la carte"
                aria-label="Défiler vers le bas de la page"
              >
                <ChevronDown size={13} className="text-[#CC131A] transition-transform group-hover:translate-y-0.5" />
                <span className="whitespace-nowrap">Bas de page</span>
              </button>
            </aside>
          </div>

          {/* Ancre de bas de page et bouton de remontée fluide vers la carte */}
          <div ref={bottomSectionRef} className="w-full flex items-center justify-between pt-2 pb-1 text-xs text-slate-500 dark:text-slate-400">
            <span>Territoire sous surveillance · Thiaroye-sur-Mer</span>
            <button
              type="button"
              onClick={() => mapSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-navy-900 border border-navy-100 dark:border-navy-800 text-navy-700 dark:text-navy-300 hover:text-[#CC131A] dark:hover:text-[#CC131A] shadow-2xs transition-all cursor-pointer active:scale-95"
              title="Remonter vers la carte"
            >
              <ChevronUp size={13} className="text-[#CC131A]" />
              <span>Remonter à la carte</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MODALE PLEIN ÉCRAN IMMERSIF AVEC BOUTON DE FERMETURE X */}
        {/* ========================================================= */}
        {isMapFullscreen && (
          <div className="fixed inset-0 z-[9999] bg-navy-950/95 backdrop-blur-md p-3 sm:p-4 flex flex-col gap-3 animate-in fade-in duration-200">
            {/* Header du mode plein écran */}
            <div className="flex items-center justify-between gap-3 bg-white/10 text-white px-4 py-2.5 rounded-2xl border border-white/15 backdrop-blur-md flex-shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
                  <Layers size={16} className="text-[#CC131A]" />
                  <span>Carte Grand Format · Thiaroye-sur-Mer</span>
                </h2>
                <span className="text-xs text-slate-300 hidden md:inline">
                  ({filteredSignalements.length} signalements affichés)
                </span>
              </div>

              {/* Bouton pour fermer le plein écran */}
              <button
                type="button"
                onClick={() => setIsMapFullscreen(false)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#CC131A] hover:bg-red-700 text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
                title="Quitter le plein écran (Échap)"
              >
                <Minimize2 size={14} />
                <span>Quitter le plein écran</span>
                <span className="text-[10px] opacity-80 border border-white/30 rounded px-1 hidden sm:inline">Échap</span>
              </button>
            </div>

            {/* Carte en plein écran */}
            <div className="flex-1 w-full h-full relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl isolate z-10">
              <InteractiveMap
                data={{
                  zones: zonesData,
                  segments: segmentsData,
                  inondations: inondationsData,
                  signalements: filteredSignalements,
                  refuges: refugesData,
                }}
                userLocation={currentUserLocation}
                visibleLayers={layersVisibility}
                onToggleLayer={handleToggleLayer}
                onToggleFullscreen={() => setIsMapFullscreen(false)}
                isFullscreen={true}
                route={itineraire.data?.route}
                itineraireInstructions={itineraire.data?.instructions}
                isNavigating={isNavigating}
                currentStepIndex={currentStepIndex}
                height="100%"
                selectedSignalementId={activeSignalementId || urlSignalementId}
                selectedQuartier={selectedQuartier}
                onCalculateRouteFromPoint={({ lat, lon }) => {
                  setIsNavigating(false);
                  setCurrentStepIndex(0);
                  itineraire.mutate({ lat, lon });
                }}
              />

              <ItineraireNavigationOverlay
                itineraireData={itineraire.data}
                isNavigating={isNavigating}
                onStartNavigation={() => {
                  setIsNavigating(true);
                  setCurrentStepIndex(0);
                }}
                onClose={handleCloseItineraire}
                currentStepIndex={currentStepIndex}
                onPrevStep={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                onNextStep={() => {
                  const total = itineraire.data?.instructions?.length || 0;
                  setCurrentStepIndex((prev) => Math.min(total - 1, prev + 1));
                }}
              />
            </div>
          </div>
        )}
      </div>
    </CitizenShell>
  );
}
