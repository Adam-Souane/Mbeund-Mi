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
  const urlRefugeId = searchParams.get('refugeId');

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

  // État des couches actives affichées sur la carte
  const [layersVisibility, setLayersVisibility] = useState({
    zones: true,
    signalements: true,
    refuges: true,
  });

  const handleToggleLayer = (key) => {
    setLayersVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
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

  // Position physique enregistrée du citoyen (par défaut : Thiaroye-sur-Mer)
  const [userSavedPosition, setUserSavedPosition] = useState({
    lat: 14.7485,
    lon: -17.3850,
    quartier: 'Thiaroye-sur-Mer',
    isSafe: false,
    refugeNom: null,
  });

  // Déclencheur pour zoomer sur la déviation lors d'un clic sur le badge d'évitement
  const [focusAvoidedRoadTrigger, setFocusAvoidedRoadTrigger] = useState(0);

  // Position dynamique en direct ("Vous êtes ici", "Étape X", "Mis à l'abri")
  const currentUserLocation = useMemo(() => {
    const coords = itineraire.data?.route?.coordinates || [];
    const instructions = itineraire.data?.instructions || [];

    // 1. En cours de navigation pas-à-pas : l'avatar avance le long des étapes
    if (isNavigating && coords.length > 0) {
      const totalSteps = instructions.length || 1;
      const ratio = totalSteps > 1 ? currentStepIndex / (totalSteps - 1) : 0;
      const coordIdx = Math.min(
        coords.length - 1,
        Math.max(0, Math.round(ratio * (coords.length - 1)))
      );
      const stepCoord = coords[coordIdx]; // [lon, lat]
      const curStep = instructions[currentStepIndex];

      return {
        lat: stepCoord[1],
        lon: stepCoord[0],
        name: nomCitoyen || username || 'Sentinelle Citoyenne',
        avatar: currentUserCustomAvatar,
        quartier: curStep?.ruelle || `En marche (Étape ${currentStepIndex + 1}/${instructions.length})`,
        isNavigating: true,
        currentStepIndex,
        isSafe: false,
      };
    }

    // 2. Si le citoyen est arrivé en zone de refuge sûre
    if (userSavedPosition.isSafe) {
      return {
        lat: userSavedPosition.lat,
        lon: userSavedPosition.lon,
        name: nomCitoyen || username || 'Sentinelle Citoyenne',
        avatar: currentUserCustomAvatar,
        quartier: userSavedPosition.quartier,
        isSafe: true,
        refugeNom: userSavedPosition.refugeNom,
      };
    }

    // 3. Position par défaut au cœur de Thiaroye-sur-Mer
    return {
      lat: userSavedPosition.lat,
      lon: userSavedPosition.lon,
      name: nomCitoyen || username || 'Sentinelle Citoyenne',
      avatar: currentUserCustomAvatar,
      quartier: userSavedPosition.quartier,
      isSafe: false,
    };
  }, [
    isNavigating,
    currentStepIndex,
    itineraire.data?.route?.coordinates,
    itineraire.data?.instructions,
    userSavedPosition,
    nomCitoyen,
    username,
    currentUserCustomAvatar,
  ]);

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
    // Recentrage visuel immédiat sur la carte interactive
    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

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
      if (mapSectionRef.current) {
        mapSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
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

  // Déclenchement automatique et navigation vers la carte si un refuge ciblé est passé en URL
  useEffect(() => {
    if (urlRefugeId && refugesData) {
      handleItineraire();
    }
  }, [urlRefugeId, refugesData]);

  const handleFinishNavigation = () => {
    const coords = itineraire.data?.route?.coordinates;
    const refugeNom = itineraire.data?.zone_arrivee?.quartier || 'Refuge sécurisé';
    if (coords?.length > 0) {
      const endCoord = coords[coords.length - 1]; // [lon, lat]
      setUserSavedPosition({
        lat: endCoord[1],
        lon: endCoord[0],
        quartier: `Mis à l'abri · ${refugeNom}`,
        isSafe: true,
        refugeNom,
      });
    }
    setIsNavigating(false);
    setCurrentStepIndex(0);
  };

  const handleResetPositionToOrigin = () => {
    setUserSavedPosition({
      lat: 14.7485,
      lon: -17.3850,
      quartier: 'Thiaroye-sur-Mer',
      isSafe: false,
      refugeNom: null,
    });
  };

  const handleCloseItineraire = () => {
    const total = itineraire.data?.instructions?.length || 0;
    if (isNavigating && currentStepIndex >= total - 1) {
      handleFinishNavigation();
      return;
    }
    itineraire.reset();
    setIsNavigating(false);
    setCurrentStepIndex(0);
  };

  return (
    <CitizenShell fullHeight={true}>
      <div className="w-full flex-1 min-h-0 h-full flex flex-col gap-1.5 sm:gap-2">
        {/* En-tête de page compact sur une seule ligne : libère un maximum de surface pour la carte */}
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-navy-100 dark:border-navy-800/80 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-base sm:text-xl font-black text-navy-950 dark:text-white tracking-tight truncate">
              Carte des risques
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              En direct
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {itineraire.data ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsNavigating((prev) => !prev)}
                  className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs ${
                    isNavigating
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-[#2563EB] hover:bg-blue-700 text-white'
                  }`}
                >
                  <Navigation size={13} />
                  <span>{isNavigating ? 'Guidage actif' : 'Démarrer le guidage'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCloseItineraire}
                  className="inline-flex items-center justify-center p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-navy-950 dark:text-white text-xs font-bold border border-slate-200 dark:border-navy-700 transition active:scale-95 cursor-pointer"
                  title="Fermer l’itinéraire"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleItineraire}
                disabled={itineraire.isPending}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-60 cursor-pointer"
                title="Calculer un itinéraire sécurisé contournant les voies inondées"
              >
                {itineraire.isPending ? <Loader2 size={13} className="animate-spin" /> : <Navigation size={13} />}
                <span>Itinéraire sécurisé</span>
              </button>
            )}
          </div>
        </div>

        {/* Bandeau indicateur lorsque le mode déviations/navigation est actif */}
        {itineraire.data && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-100 text-xs animate-in fade-in slide-in-from-top-1 duration-200 flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse shrink-0" />
              <p className="font-bold truncate text-[11px] sm:text-xs">
                <span className="font-extrabold text-[#2563EB] dark:text-blue-300">Déviations :</span>{' '}
                <span className="hidden sm:inline">Voies inondées contournées pour un trajet sécurisé.</span>
                <span className="sm:hidden">Voies inondées évitées</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseItineraire}
              className="text-[11px] font-bold text-blue-700 dark:text-blue-300 hover:underline shrink-0 cursor-pointer"
            >
              Désactiver
            </button>
          </div>
        )}

        {itineraire.isError && (
          <div className="flex items-start gap-2 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red/15 text-red-900 dark:text-red-200 text-xs flex-shrink-0">
            <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
            <span>{flattenApiErrors(itineraire.error)[0]}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* CARTE PLEIN ÉCRAN + FILTRES TEMPORELS PROPRES ET NON SUPERPOSÉS */}
        {/* ========================================================= */}
        <div className="w-full flex-1 min-h-0 flex flex-col lg:flex-row gap-2 items-stretch lg:items-start">
          {/* FILTRES TEMPORELS (order-1 sur mobile au-dessus, order-2 à droite sur desktop) */}
          <aside
            aria-label="Filtres temporels"
            className="order-1 lg:order-2 w-full lg:w-28 xl:w-32 flex lg:flex-col items-center lg:items-stretch justify-start gap-1 sm:gap-1.5 p-1 sm:p-2 bg-white dark:bg-navy-900 rounded-xl border border-navy-100 dark:border-navy-800 shadow-2xs shrink-0 flex-shrink-0"
          >
            <div className="flex items-center gap-1.5 px-1.5 text-[11px] font-bold text-navy-500 dark:text-navy-400 select-none shrink-0">
              <Clock size={12} className="text-[#CC131A] shrink-0" />
              <span className="hidden sm:inline">Période</span>
              <span className="inline-flex sm:hidden px-1.5 py-0.2 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-extrabold text-[10px] border border-emerald-200/50">
                {filteredSignalements.length} obs.
              </span>
            </div>

            <div className="flex lg:flex-col gap-1 sm:gap-1.5 flex-1 min-w-0 overflow-x-auto no-scrollbar py-0.5">
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
                    className={`text-center px-2.5 py-1 lg:py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 shrink-0 ${
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

            {/* Compteur d'observations discret pour desktop */}
            <div className="hidden lg:flex items-center justify-center p-1.5 mt-auto bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 text-center leading-tight">
                {filteredSignalements.length} obs.
              </span>
            </div>
          </aside>

          {/* CARTE INTERACTIVE : Prend TOUTE la hauteur disponible (zéro vide en bas) */}
          <div
            ref={mapSectionRef}
            className="order-2 lg:order-1 w-full flex-1 min-h-[360px] h-full relative rounded-xl sm:rounded-2xl overflow-hidden shadow-sm border border-navy-100 dark:border-navy-800 isolate z-10 scroll-mt-4"
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
                  onResetUserPosition={handleResetPositionToOrigin}
                  focusAvoidedRoadTrigger={focusAvoidedRoadTrigger}
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
                  onFinishNavigation={handleFinishNavigation}
                  onFocusAvoidedRoads={() => setFocusAvoidedRoadTrigger((prev) => prev + 1)}
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
