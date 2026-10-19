import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, CircleMarker, Circle, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Camera,
  MapPin,
  LocateFixed,
  CheckCircle2,
  Loader2,
  Clock,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  Pencil,
  Eye,
  Trash2,
  RefreshCw,
  Plus,
  AlertCircle,
  Waves,
  AlertTriangle,
  ShieldAlert,
  Droplets,
  AlertOctagon,
  Satellite,
  Layers,
  Send,
  ShieldCheck,
  Activity,
  PhoneCall,
  Compass,
  Info,
  WifiOff,
} from 'lucide-react';
import CitizenShell from '../shared/CitizenShell';
import { createSignalement } from '../../api/endpoints/signalements';
import { flattenApiErrors } from '../../shared/utils/apiErrors';
import { useGeolocation } from '../../shared/hooks/useGeolocation';
import { useNotifications } from '../../shared/contexts/NotificationContext';
import { useAuth } from '../../auth/AuthContext';
import { getPublicAvatar } from '../../shared/utils/avatarResolver';
import { sanitizePublicAuthor } from '../../shared/utils/sanitizer';
import { compressImageClient } from '../../shared/utils/imageCompressor';
import { sauvegarderSignalementHorsLigne, useOfflineSignalements } from '../../shared/utils/offlineSignalementsQueue';

const CATEGORIES = [
  {
    value: 'inondation',
    label: 'Inondation',
    sublabel: 'Ruelle ou concession',
    icon: Waves,
  },
  {
    value: 'egouts',
    label: 'Égouts',
    sublabel: 'Caniveau ou reflux',
    icon: AlertTriangle,
  },
  {
    value: 'autre',
    label: 'Autre',
    sublabel: 'Obstacle ou dégradation',
    icon: ShieldAlert,
  },
];

// Configurations dynamiques adaptées à chaque type d'incident (critères d'état & suggestions rapides 1-clic)
const CONFIG_CATEGORIES = {
  inondation: {
    critereTitre: "Niveau d'eau approximatif (optionnel)",
    parentLabel: 'Hauteur d\'eau',
    criteres: [
      { id: 'faible', label: 'Chevilles', approx: '~15 cm', icon: Droplets, color: 'border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40' },
      { id: 'moyen', label: 'Genoux', approx: '~40 cm', icon: Waves, color: 'border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/40' },
      { id: 'critique', label: 'Infranchissable', approx: '> 70 cm', icon: AlertOctagon, color: 'border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 bg-rose-50/70 dark:bg-rose-950/40' },
    ],
    placeholder: 'Ex : Eau stagnante devant l’école primaire, environ 30 cm.',
    suggestions: [
      'Eau stagnante devant concession, passage piéton bloqué',
      'Ruelle inondée rendant l’accès aux habitations impossible',
      'Montée des eaux subite menaçant les maisons riveraines',
      'Caniveau de drainage débordant sous la pluie',
    ],
  },
  egouts: {
    critereTitre: "État du débordement ou de la bouche d'égout (optionnel)",
    parentLabel: 'État assainissement',
    criteres: [
      { id: 'fuite', label: 'Suintement / Fuite', approx: 'Écoulement localisé', icon: Droplets, color: 'border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40' },
      { id: 'refoulement', label: 'Refoulement continu', approx: 'Eaux usées sur chaussée', icon: Waves, color: 'border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/40' },
      { id: 'danger_bouche', label: 'Plaque ouverte / Cassée', approx: 'Risque de chute grave', icon: AlertTriangle, color: 'border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 bg-rose-50/70 dark:bg-rose-950/40' },
    ],
    placeholder: 'Ex : Reflux d’eaux usées et mauvaises odeurs persistantes rue 12.',
    suggestions: [
      'Reflux d’eaux usées insalubres à proximité des habitations',
      'Plaque d\'égout descellée ou manquante, risque d\'accident',
      'Bouche d\'égout bouchée par des déchets solides',
      'Écoulement nauséabond stagnant devant la devanture',
    ],
  },
  autre: {
    critereTitre: "Niveau d'urgence / gravité (optionnel)",
    parentLabel: 'Niveau d\'urgence',
    criteres: [
      { id: 'modere', label: 'Gêne modérée', approx: 'Circulation ralentie', icon: Info, color: 'border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40' },
      { id: 'bloquant', label: 'Dégradation forte', approx: 'Voie coupée ou bloquée', icon: AlertTriangle, color: 'border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/40' },
      { id: 'critique', label: 'Danger critique', approx: 'Risque effondrement / électrique', icon: AlertOctagon, color: 'border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 bg-rose-50/70 dark:bg-rose-950/40' },
    ],
    placeholder: 'Ex : Câble électrique tombé à terre ou affaissement de voirie.',
    suggestions: [
      'Dépôt d\'encombrants ou gravats bloquant l\'écoulement',
      'Fissure ou menace d\'effondrement d\'un mur de clôture',
      'Poteau ou câble électrique menaçant à ras du sol',
      'Affaissement dangereux de la chaussée après la pluie',
    ],
  },
};

const NIVEAUX_EAU = CONFIG_CATEGORIES.inondation.criteres;
const SUGGESTIONS_RAPIDES = CONFIG_CATEGORIES.inondation.suggestions;

// Dictionnaire dynamique des consignes d'urgence et réflexes citoyens de Thiaroye (défilement automatique 5s)
const CONSIGNES_URGENCE_THIAROYE = [
  {
    id: 'eaux',
    badge: "Consignes d'urgence Thiaroye",
    badgeColor: 'bg-red-600/30 text-red-300 border-red-500/40',
    titre: 'En cas de montée subite des eaux :',
    description: "Coupez immédiatement les compteurs électriques au sol. Ne laissez jamais les enfants s'approcher des caniveaux à ciel ouvert. En cas de péril imminent, contactez immédiatement les secours.",
    icon: Info,
  },
  {
    id: 'egouts',
    badge: 'Hygiène & Sécurité sanitaire',
    badgeColor: 'bg-amber-600/30 text-amber-300 border-amber-500/40',
    titre: 'En présence d’eaux usées ou refoulement d’égout :',
    description: 'Évitez tout contact direct pieds nus avec les eaux de débordement pour prévenir les infections. Portez des bottes étanches et désinfectez les abords des habitations.',
    icon: ShieldAlert,
  },
  {
    id: 'solidarite',
    badge: 'Solidarité & Entraide locale',
    badgeColor: 'bg-blue-600/30 text-blue-300 border-blue-500/40',
    titre: 'Protection des personnes vulnérables :',
    description: 'Vérifiez l’état de vos voisins âgés, personnes à mobilité réduite ou femmes enceintes. Aidez-les à rejoindre un étage supérieur ou le lieu sûr le plus proche.',
    icon: ShieldCheck,
  },
  {
    id: 'canaux',
    badge: 'Prévention des crues',
    badgeColor: 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40',
    titre: 'Évacuation des eaux et canaux de drainage :',
    description: 'Ne jetez jamais d’ordures ou de déchets solides dans les caniveaux. Un simple débris peut bloquer l’écoulement et inonder l’ensemble de la ruelle.',
    icon: Activity,
  },
];

// Raccourcis des quartiers majeurs de Thiaroye-sur-Mer avec rayon maximal autorisé (en mètres)
const QUARTIERS_THIAROYE = [
  { nom: 'Cuvette Ouest', lat: 14.7485, lon: -17.3875, rayonMetres: 350 },
  { nom: 'Ndakhane', lat: 14.7450, lon: -17.3810, rayonMetres: 400 },
  { nom: 'Thiaroye Plage', lat: 14.7390, lon: -17.3840, rayonMetres: 450 },
  { nom: 'Thiaroye Gare', lat: 14.7540, lon: -17.3770, rayonMetres: 400 },
  { nom: 'Tally Diallo', lat: 14.7510, lon: -17.3910, rayonMetres: 350 },
];

// Distance en mètres (formule Haversine)
function getDistanceMetres(coord1, coord2) {
  if (!coord1 || !coord2) return 0;
  const R = 6371e3;
  const lat1 = (coord1.lat * Math.PI) / 180;
  const lat2 = (coord2.lat * Math.PI) / 180;
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLon = ((coord2.lon - coord1.lon) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Bride strictement la position cible au périmètre du secteur sélectionné
function briderPositionAuSecteur(targetCoords, centerCoords, rayonMaxMetres) {
  if (!targetCoords || !centerCoords || !rayonMaxMetres) return targetCoords;
  const distance = getDistanceMetres(targetCoords, centerCoords);
  if (distance <= rayonMaxMetres) {
    return targetCoords;
  }
  const ratio = rayonMaxMetres / distance;
  return {
    lat: centerCoords.lat + (targetCoords.lat - centerCoords.lat) * ratio,
    lon: centerCoords.lon + (targetCoords.lon - centerCoords.lon) * ratio,
  };
}

// Centre de repli (Thiaroye-sur-Mer)
const THIAROYE_CENTER = { lat: 14.75, lon: -17.38 };

// Limites géographiques strictes de Thiaroye-sur-Mer et de ses abords immédiats (Pikine / Yeumbeul)
const THIAROYE_BOUNDS = [
  [14.718, -17.435], // Sud-Ouest maritime (baie de Hann / estran immédiat)
  [14.785, -17.345], // Nord-Est terrestre (Guinaw Rail / Yeumbeul / Tally Diallo)
];

// Icône personnalisée de repère d'incident avec micro-onde radar pulsante (aucun émoji)
const customReportPinIcon = L.divIcon({
  className: 'custom-report-pin-marker',
  html: `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: auto;">
      <div style="position: absolute; bottom: 0; width: 26px; height: 10px; border-radius: 50%; background: rgba(239, 68, 68, 0.45); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; pointer-events: none;"></div>
      <div style="width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #EF4444, #BE123C); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(190, 18, 60, 0.5); border: 2.5px solid #ffffff; transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>
      <div style="width: 10px; height: 10px; background: #BE123C; transform: rotate(45deg) translateY(-6px); border-bottom: 2px solid #ffffff; border-right: 2px solid #ffffff;"></div>
      <div style="width: 14px; height: 4px; background: rgba(0,0,0,0.3); border-radius: 50%; margin-top: -3px; filter: blur(1px);"></div>
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

// Contrôleur de recentrage fluide Leaflet & ajustement dynamique de la taille
function MapViewController({ coords, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (coords?.lat && coords?.lon && typeof map?.flyTo === 'function') {
      if (typeof map.invalidateSize === 'function') {
        map.invalidateSize();
      }
      map.flyTo([coords.lat, coords.lon], zoom || 16, {
        animate: true,
        duration: 1.4,
        easeLinearity: 0.25,
      });
    }
  }, [coords?.lat, coords?.lon, zoom, map]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof map?.invalidateSize === 'function') {
        map.invalidateSize();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

// Gestionnaire de clic direct sur la carte pour déplacer le repère (bridé au secteur ou désactivé si GPS)
function MapClickHandler({ onSelectCoords, activeSecteur, isGpsLocked }) {
  useMapEvents({
    click(e) {
      if (isGpsLocked) {
        return;
      }
      if (e?.latlng && activeSecteur) {
        const clamped = briderPositionAuSecteur(
          { lat: e.latlng.lat, lon: e.latlng.lng },
          { lat: activeSecteur.lat, lon: activeSecteur.lon },
          activeSecteur.rayonMetres
        );
        onSelectCoords(clamped);
      }
    },
  });
  return null;
}

export default function SignalerPageBody() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  let authData = null;
  try {
    authData = useAuth();
  } catch {
    authData = null;
  }
  const user = authData?.user;
  const username = authData?.username;
  const nomCitoyen = user?.prenom ? `${user.prenom} ${user.nom || ''}`.trim() : (username || 'Citoyen');
  const { addNotification } = useNotifications();
  const { position, status: geoStatus, error: geoError, locate } = useGeolocation();

  // Position sélectionnée manuellement (clic sur carte ou pastille quartier)
  const [manualPosition, setManualPosition] = useState(null);
  // Quartier/secteur actif qui délimite la zone autorisée
  const [activeSecteur, setActiveSecteur] = useState(null);
  // Verrouillage de la position GPS réelle
  const [isGpsLocked, setIsGpsLocked] = useState(false);
  // Vue Satellite par défaut (avec toponymie rues & quartiers)
  const [baseMap, setBaseMap] = useState('satellite'); // 'satellite' | 'plan'

  // Étape courante du parcours : 1 = Localisation, 2 = Informations, 3 = Récapitulatif
  const [currentStep, setCurrentStep] = useState(1);
  const [descriptionError, setDescriptionError] = useState(null);

  const mapContainerRef = useRef(null);

  const scrollToSection = () => {
    if (typeof window !== 'undefined') {
      const el = document.getElementById('section-nouveau-signalement');
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const goToStep = (stepNumber) => {
    setDescriptionError(null);
    setCurrentStep(stepNumber);
    scrollToSection();
  };

  // Fait défiler la page pour que la carte soit confortablement visible à l'écran si elle est masquée
  const ensureMapVisible = () => {
    if (typeof window !== 'undefined' && mapContainerRef.current) {
      if (typeof mapContainerRef.current.getBoundingClientRect === 'function') {
        const rect = mapContainerRef.current.getBoundingClientRect();
        const headerOffset = 80;
        if (rect.top < headerOffset || rect.top > window.innerHeight - 180) {
          if (typeof mapContainerRef.current.scrollIntoView === 'function') {
            mapContainerRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }
        }
      } else if (typeof mapContainerRef.current.scrollIntoView === 'function') {
        mapContainerRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  };

  useEffect(() => {
    if (position) {
      ensureMapVisible();
    }
  }, [position]);

  const [categorie, setCategorie] = useState('inondation');
  const [niveauEau, setNiveauEau] = useState(null);
  const [description, setDescription] = useState('');
  // Liste ordonnée de photos (jusqu'à 3): [{ id, file, previewUrl, name, sizeKb }]
  const [photos, setPhotos] = useState([]);
  const [photoError, setPhotoError] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const replaceInputRefs = useRef({});

  const [submitted, setSubmitted] = useState(false);
  const [submittedOffline, setSubmittedOffline] = useState(false);
  const { pendingCount } = useOfflineSignalements(createSignalement);
  // Checklist : choix du citoyen de partager ou non sur l'espace communautaire public
  const [partagerCommunaute, setPartagerCommunaute] = useState(true);

  // Photo principale pour compatibilité directe
  const primaryPhoto = photos[0]?.file ?? null;

  // Coordonnées actives (priorité au repère manuel, puis GPS, puis centre par défaut)
  const activeCoords = manualPosition || position || THIAROYE_CENTER;
  const currentCategoryConfig = CONFIG_CATEGORIES[categorie] || CONFIG_CATEGORIES.inondation;

  // Défilement automatique des consignes d'urgence (5 secondes, pause au survol de la souris)
  const [consigneIndex, setConsigneIndex] = useState(0);
  const [isConsignePaused, setIsConsignePaused] = useState(false);

  useEffect(() => {
    if (isConsignePaused) return;
    const interval = setInterval(() => {
      setConsigneIndex((prev) => (prev + 1) % CONSIGNES_URGENCE_THIAROYE.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isConsignePaused]);

  const activeConsigne = CONSIGNES_URGENCE_THIAROYE[consigneIndex] || CONSIGNES_URGENCE_THIAROYE[0];
  const ActiveConsigneIcon = activeConsigne.icon;

  const handleAddPhotos = async (e) => {
    const fileList = Array.from(e.target.files || []);
    if (!fileList.length) return;
    setPhotoError(null);

    const availableSlots = 3 - photos.length;
    if (availableSlots <= 0) {
      setPhotoError('Vous avez atteint la limite de 3 photos par signalement.');
      return;
    }

    if (fileList.length > availableSlots) {
      setPhotoError(`Seules les ${availableSlots} première(s) photo(s) ont été ajoutées (limite de 3 photos).`);
    }

    const filesToProcess = fileList.slice(0, availableSlots);
    setIsCompressing(true);

    try {
      const newItems = await Promise.all(
        filesToProcess.map(async (file) => {
          const compressed = await compressImageClient(file);
          const previewUrl = URL.createObjectURL(compressed);
          return {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            file: compressed,
            previewUrl,
            name: file.name,
            sizeKb: Math.round(compressed.size / 1024),
          };
        })
      );
      setPhotos((prev) => [...prev, ...newItems]);
    } catch {
      setPhotoError("Une erreur est survenue lors de l'optimisation des photos.");
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (idToRemove) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === idToRemove);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((p) => p.id !== idToRemove);
    });
    setPhotoError(null);
  };

  const handleReplacePhoto = async (idToReplace, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    setIsCompressing(true);

    try {
      const compressed = await compressImageClient(file);
      const newPreviewUrl = URL.createObjectURL(compressed);

      setPhotos((prev) =>
        prev.map((item) => {
          if (item.id === idToReplace) {
            if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
            return {
              ...item,
              file: compressed,
              previewUrl: newPreviewUrl,
              name: file.name,
              sizeKb: Math.round(compressed.size / 1024),
            };
          }
          return item;
        })
      );
    } catch {
      setPhotoError("Impossible d'optimiser la nouvelle photo.");
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const mutation = useMutation({
    mutationFn: () => {
      const finalDescription = niveauEau
        ? `${description.trim()} (${currentCategoryConfig.parentLabel} : ${niveauEau.label} - ${niveauEau.approx})`
        : description;

      return createSignalement({
        description: finalDescription,
        categorie,
        longitude: activeCoords.lon,
        latitude: activeCoords.lat,
        photo: primaryPhoto,
        photos: photos.map((p) => p.file),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['signalements'] });

      try {
        const myPostIds = JSON.parse(localStorage.getItem('mbeund_mi_my_post_ids') || '{}');
        if (data?.id) {
          myPostIds[data.id] = true;
          myPostIds[`backend-sig-${data.id}`] = true;
          myPostIds[`post-sig-${data.id}`] = true;
          myPostIds[`my-sig-${data.id}`] = true;
        }
        localStorage.setItem('mbeund_mi_my_post_ids', JSON.stringify(myPostIds));
      } catch {}

      if (partagerCommunaute) {
        try {
          const authorAvatar = getPublicAvatar(user);
          const rawPosts = localStorage.getItem('mbeund_mi_community_posts_v1');
          const posts = rawPosts ? JSON.parse(rawPosts) : [];

          const newPostId = `post-sig-${data?.id || Date.now()}`;
          const newPost = {
            id: newPostId,
            rawBackendId: data?.id,
            signalementId: data?.id,
            isUserPost: true,
            isBackendSignalement: true,
            typePost: 'signalement',
            badgeFiltre: 'Signalement terrain',
            authorName: sanitizePublicAuthor(nomCitoyen),
            authorRole: 'Sentinelle citoyenne',
            authorAvatar,
            timestamp: 'À l’instant',
            isoDate: new Date().toISOString(),
            zone: activeSecteur ? activeSecteur.nom : 'Thiaroye-sur-Mer',
            categorie,
            gravite: categorie === 'inondation' ? 'critique' : 'moyen',
            content: description,
            photoUrl: photos[0]?.previewUrl || null,
            photosCount: photos.length,
            likesCount: 0,
            userHasLiked: false,
            commentsCount: 0,
            badge: 'Observation citoyenne validée',
            comments: [],
          };

          posts.unshift(newPost);
          localStorage.setItem('mbeund_mi_community_posts_v1', JSON.stringify(posts));

          // Enregistrement également dans mbeund_mi_user_community_posts pour Mon espace personnel
          const userPosts = JSON.parse(localStorage.getItem('mbeund_mi_user_community_posts') || '[]');
          userPosts.unshift({
            ...newPost,
            author: {
              name: sanitizePublicAuthor(nomCitoyen, 'Citoyen'),
              avatar: authorAvatar,
              quartier: activeSecteur ? activeSecteur.nom : 'Thiaroye-sur-Mer',
              role: 'Résident',
            },
            date: 'À l’instant',
            dureeType: 'Post durable',
            titre: categorie || 'Observation terrain',
            texte: description,
            image: photos[0]?.previewUrl || null,
            statut: 'en_cours',
            statutLabel: 'Signalement actif · Traitement requis',
            baseLikes: 1,
            baseViews: 1,
          });
          localStorage.setItem('mbeund_mi_user_community_posts', JSON.stringify(userPosts));

          try {
            window.dispatchEvent(
              new CustomEvent('mbeund_mi_new_community_post', { detail: newPost })
            );
          } catch {}
        } catch {
          // Erreur silencieuse
        }
      } else {
        try {
          const privates = JSON.parse(localStorage.getItem('mbeund_mi_private_signalement_ids') || '{}');
          if (data?.id) {
            privates[data.id] = true;
            privates[`backend-sig-${data.id}`] = true;
            privates[`post-sig-${data.id}`] = true;
            privates[`my-sig-${data.id}`] = true;
          }
          localStorage.setItem('mbeund_mi_private_signalement_ids', JSON.stringify(privates));
        } catch {}
      }

      addNotification({
        type: 'signalement',
        data: {
          titre: 'Signalement envoyé aux autorités',
          message: 'Votre observation a bien été enregistrée et transmise à la cellule de veille.',
        },
      });

      setSubmitted(true);
    },
    onError: async (error) => {
      const isReseau = !navigator.onLine || error.message === 'Network Error' || error.code === 'ECONNABORTED';
      if (isReseau) {
        await sauvegarderSignalementHorsLigne({
          description: niveauEau ? `${description.trim()} (${currentCategoryConfig.parentLabel} : ${niveauEau.label})` : description,
          categorie,
          longitude: activeCoords.lon,
          latitude: activeCoords.lat,
          photos: photos.map((p) => p.file),
        });
        addNotification({
          type: 'signalement',
          data: {
            titre: 'Signalement sauvegardé hors-ligne',
            message: 'Vous êtes hors-ligne. Votre signalement sera transmis dès le rétablissement de la connexion.',
          },
        });
        setSubmittedOffline(true);
      }
    },
  });

  const handleValidateFormStep = (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!description.trim()) {
      setDescriptionError('Veuillez fournir une brève description de l’incident pour guider l’intervention.');
      return;
    }
    setDescriptionError(null);
    goToStep(3);
  };

  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!description.trim()) {
      setDescriptionError('Veuillez fournir une brève description de l’incident.');
      goToStep(2);
      return;
    }
    if (!navigator.onLine) {
      await sauvegarderSignalementHorsLigne({
        description: niveauEau ? `${description.trim()} (${currentCategoryConfig.parentLabel} : ${niveauEau.label})` : description,
        categorie,
        longitude: activeCoords.lon,
        latitude: activeCoords.lat,
        photos: photos.map((p) => p.file),
      });
      addNotification({
        type: 'signalement',
        data: {
          titre: 'Signalement sauvegardé hors-ligne',
          message: 'Enregistré sur votre appareil. Envoi automatique dès le retour du réseau.',
        },
      });
      setSubmittedOffline(true);
      return;
    }
    mutation.reset();
    mutation.mutate();
  };

  if (submittedOffline) {
    return (
      <div className="min-h-screen bg-navy-50 dark:bg-navy-950 text-navy dark:text-navy-50 flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <WifiOff size={36} />
        </div>
        <h1 className="text-xl font-extrabold">Signalement sauvegardé en local</h1>
        <p className="text-sm text-navy-600 dark:text-navy-200 max-w-sm">
          Vous êtes actuellement hors-ligne ou le réseau est saturé. Votre observation ({categorie}) a été mise en file d&apos;attente sur votre appareil et sera <strong>automatiquement envoyée dès que le réseau sera rétabli</strong>.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
          <button
            onClick={() => navigate('/citoyen/accueil')}
            className="bg-[#0B2545] hover:bg-[#154275] text-white font-bold text-sm px-6 py-3 rounded-md transition shadow-sm cursor-pointer"
          >
            Retour à l’accueil
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-navy-50 dark:bg-navy-950 text-navy dark:text-navy-50 flex flex-col items-center justify-center px-6 text-center gap-4">
        <CheckCircle2 size={56} className="text-risk-vert" />
        <h1 className="text-xl font-extrabold">Signalement envoyé</h1>
        <p className="text-sm text-navy-600 dark:text-navy-200 max-w-sm">
          {partagerCommunaute
            ? "Merci pour votre contribution ! Votre signalement a été transmis à la cellule de crise et partagé avec les riverains sur l'espace Communauté."
            : "Merci pour votre contribution. Votre signalement a été transmis en toute confidentialité aux autorités uniquement (aucun affichage public sur la communauté)."}
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
          {partagerCommunaute && (
            <button
              onClick={() => navigate('/citoyen/communaute')}
              className="bg-[#0B2545] hover:bg-[#154275] text-white font-bold text-sm px-6 py-3 rounded-md transition shadow-sm cursor-pointer"
            >
              Voir dans la Communauté
            </button>
          )}
          <button
            onClick={() => navigate('/citoyen/accueil')}
            className="bg-red hover:bg-red-700 text-white font-bold text-sm px-6 py-3 rounded-md transition shadow-sm cursor-pointer"
          >
            Retour à l’accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <CitizenShell>
      {/* 1. Bannière de sensibilisation et engagement communautaire Mbeund-Mi (100% conforme à la base) */}
      <div className="w-full relative overflow-hidden rounded-2xl sm:rounded-3xl border border-navy-100 dark:border-navy-800 shadow-md group">
        <div className="relative h-56 sm:h-72 md:h-80 lg:h-96 w-full overflow-hidden bg-navy-950">
          <img
            src="/images/sensibilisation-mbeund-mi.jpg"
            alt="Ambassadrices Mbeund-Mi - Sensibilisation et prévention des inondations dans une ruelle de Thiaroye-sur-Mer"
            className="w-full h-full object-cover object-[center_18%] transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/25 to-transparent pointer-events-none" />

          {/* Boutons d'action rapides positionnés en haut à droite de la bannière */}
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 flex flex-wrap items-center justify-end gap-2 sm:gap-2.5 max-w-[85%] sm:max-w-none">
            <button
              type="button"
              onClick={() => {
                const formEl = document.getElementById('section-nouveau-signalement');
                if (formEl) {
                  formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#CC131A] hover:bg-red-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg hover:shadow-xl transition-all active:scale-95 cursor-pointer backdrop-blur-xs"
            >
              <span>Commencer le signalement</span>
              <ArrowDown size={14} />
            </button>

            <button
              type="button"
              onClick={() => navigate('/citoyen/carte')}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/30 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <MapPin size={14} className="text-yellow-300" />
              <span>Voir la carte</span>
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white flex flex-col justify-end pointer-events-none">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-[11px] sm:text-xs font-bold mb-2 self-start shadow-xs pointer-events-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Sentinelles Mbeund-Mi · Thiaroye-sur-Mer</span>
            </div>
            <h2 className="text-base sm:text-xl md:text-2xl font-black tracking-tight text-white drop-shadow-sm">
              Ensemble, prévenons les inondations
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl leading-relaxed opacity-95">
              Rejoignez l’action communautaire Mbeund-Mi : signalez chaque point d’eau critique pour alerter vos voisins et guider les secours en temps réel.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Barre d'en-tête du formulaire et accès Historique */}
      <div id="section-nouveau-signalement" className="w-full flex flex-col gap-4 scroll-mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-navy-100 dark:border-navy-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-navy-900 dark:text-white flex items-center gap-2">
              <span>Nouveau signalement</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/50 text-[#CC131A] dark:text-red-400 text-[11px] font-black tracking-normal">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CC131A] animate-pulse" />
                Cellule d'alerte
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-navy-600 dark:text-navy-300 mt-0.5">
              Décrivez ce que vous observez — une autorité le validera avant publication.
            </p>
          </div>

          <div className="flex items-center flex-shrink-0">
            <button
              type="button"
              onClick={() => navigate('/citoyen/mes-signalements')}
              className="group px-4 py-2 rounded-xl bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-700 hover:border-[#CC131A] hover:bg-[#CC131A] text-navy-800 dark:text-white hover:text-white text-xs font-black flex items-center gap-2 transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer active:scale-95"
            >
              <Clock size={15} className="text-[#CC131A] group-hover:text-white transition-colors" />
              <span>Historique</span>
            </button>
          </div>
        </div>

        {pendingCount > 0 && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-xs font-semibold">
            <WifiOff size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              {pendingCount} signalement(s) sauvegardé(s) hors-ligne sur votre appareil — synchronisation automatique dès le retour du réseau.
            </span>
          </div>
        )}

        {/* Indicateur de progression 3 étapes (Localisation ➔ Informations ➔ Récapitulatif) */}
        <div className="w-full bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 rounded-2xl p-2.5 sm:p-3.5 shadow-xs">
          <div className="grid grid-cols-3 gap-2 sm:gap-3" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={3}>
            {/* Étape 1 */}
            <div
              className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-xl transition text-left select-none ${
                currentStep === 1
                  ? 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 shadow-2xs'
                  : currentStep > 1
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30'
                  : 'opacity-70 border border-transparent'
              }`}
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 transition-colors ${
                  currentStep > 1
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : currentStep === 1
                    ? 'bg-[#CC131A] text-white shadow-xs'
                    : 'bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-300'
                }`}
              >
                {currentStep > 1 ? <CheckCircle2 size={15} /> : '1'}
              </div>
              <div className="min-w-0">
                <span className="block text-[9px] sm:text-[10px] font-bold text-navy-400 uppercase tracking-wider">
                  Étape 1
                </span>
                <span
                  className={`block text-xs sm:text-sm font-extrabold truncate ${
                    currentStep === 1
                      ? 'text-[#CC131A] dark:text-red-400'
                      : currentStep > 1
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-navy-800 dark:text-navy-100'
                  }`}
                >
                  Localisation
                </span>
              </div>
            </div>

            {/* Étape 2 */}
            <div
              className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-xl transition text-left select-none ${
                currentStep === 2
                  ? 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 shadow-2xs'
                  : currentStep > 2
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30'
                  : 'opacity-70 border border-transparent'
              }`}
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 transition-colors ${
                  currentStep > 2
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : currentStep === 2
                    ? 'bg-[#CC131A] text-white shadow-xs'
                    : 'bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-300'
                }`}
              >
                {currentStep > 2 ? <CheckCircle2 size={15} /> : '2'}
              </div>
              <div className="min-w-0">
                <span className="block text-[9px] sm:text-[10px] font-bold text-navy-400 uppercase tracking-wider">
                  Étape 2
                </span>
                <span
                  className={`block text-xs sm:text-sm font-extrabold truncate ${
                    currentStep === 2
                      ? 'text-[#CC131A] dark:text-red-400'
                      : currentStep > 2
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-navy-800 dark:text-navy-100'
                  }`}
                >
                  Informations
                </span>
              </div>
            </div>

            {/* Étape 3 */}
            <div
              className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-xl transition text-left select-none ${
                currentStep === 3
                  ? 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 shadow-2xs'
                  : 'opacity-70 border border-transparent'
              }`}
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 transition-colors ${
                  currentStep === 3
                    ? 'bg-[#CC131A] text-white shadow-xs'
                    : 'bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-300'
                }`}
              >
                3
              </div>
              <div className="min-w-0">
                <span className="block text-[9px] sm:text-[10px] font-bold text-navy-400 uppercase tracking-wider">
                  Étape 3
                </span>
                <span
                  className={`block text-xs sm:text-sm font-extrabold truncate ${
                    currentStep === 3 ? 'text-[#CC131A] dark:text-red-400' : 'text-navy-800 dark:text-navy-100'
                  }`}
                >
                  Récapitulatif
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ÉTAPE 1 : CARTE AVEC CONTRÔLES OVERLAY + PANNEAU À DROITE */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <div className="w-full flex flex-col lg:flex-row gap-3.5 items-stretch">
            {/* CONTENEUR CARTE (À GAUCHE, PREND L'ESPACE MAJEUR) */}
            <div
              ref={mapContainerRef}
              className="flex-1 min-w-0 relative z-0 isolate rounded-2xl overflow-hidden border-[1.5px] border-navy-200 dark:border-navy-800 shadow-md h-[320px] sm:h-[440px] lg:h-[540px] min-h-[300px] sm:min-h-[420px] lg:min-h-[540px] bg-slate-900"
            >
              <MapContainer
                center={[activeCoords.lat, activeCoords.lon]}
                zoom={manualPosition ? 16 : position ? 16 : 14.5}
                minZoom={13}
                maxZoom={19}
                maxBounds={THIAROYE_BOUNDS}
                maxBoundsViscosity={0.85}
                dragging={true}
                scrollWheelZoom={true}
                touchZoom={true}
                zoomControl={false}
                style={{ width: '100%', height: '100%', minHeight: '300px', backgroundColor: '#0e1c2e' }}
              >
                {baseMap === 'satellite' ? (
                  <>
                    <TileLayer
                      attribution='&copy; <a href="https://www.esri.com/">Esri World Imagery</a>'
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                      maxZoom={19}
                    />
                    {/* Couche hybride transparente Esri affichant les noms réels des rues et quartiers sur le satellite */}
                    <TileLayer
                      attribution='&copy; <a href="https://www.esri.com/">Esri Places &amp; Streets</a>'
                      url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                      maxZoom={19}
                    />
                  </>
                ) : (
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                )}

                {/* Contrôleur de déplacement fluide vers la position sélectionnée */}
                <MapViewController coords={activeCoords} zoom={manualPosition ? 16 : position ? 16 : 14.5} />

                {/* Périmètre visuel du secteur actif */}
                {activeSecteur && (
                  <Circle
                    center={[activeSecteur.lat, activeSecteur.lon]}
                    radius={activeSecteur.rayonMetres}
                    pathOptions={{
                      color: '#BE123C',
                      dashArray: '6, 6',
                      fillColor: '#EF4444',
                      fillOpacity: 0.12,
                      weight: 2,
                    }}
                  />
                )}

                {/* Permet de cliquer sur la carte pour poser le repère */}
                <MapClickHandler
                  onSelectCoords={setManualPosition}
                  activeSecteur={activeSecteur}
                  isGpsLocked={isGpsLocked && Boolean(position)}
                />

                {/* Halo d'exactitude sous le repère */}
                <CircleMarker
                  center={[activeCoords.lat, activeCoords.lon]}
                  radius={14}
                  pathOptions={{
                    color: '#BE123C',
                    weight: 2,
                    fillColor: '#EF4444',
                    fillOpacity: 0.35,
                  }}
                />

                {/* Repère rouge vectoriel déplaçable */}
                <Marker
                  position={[activeCoords.lat, activeCoords.lon]}
                  draggable={true}
                  eventHandlers={{
                    dragend(e) {
                      const marker = e.target;
                      const pos = marker?.getLatLng ? marker.getLatLng() : null;
                      if (pos) {
                        const draggedCoords = { lat: pos.lat, lon: pos.lng };
                        if (activeSecteur) {
                          const clamped = briderPositionAuSecteur(
                            draggedCoords,
                            { lat: activeSecteur.lat, lon: activeSecteur.lon },
                            activeSecteur.rayonMetres
                          );
                          setManualPosition(clamped);
                          setIsGpsLocked(false);
                          ensureMapVisible();
                        } else if (position) {
                          const clamped = briderPositionAuSecteur(
                            draggedCoords,
                            { lat: position.lat, lon: position.lon },
                            150
                          );
                          setManualPosition(clamped);
                          setIsGpsLocked(false);
                          ensureMapVisible();
                        } else {
                          const clamped = briderPositionAuSecteur(
                            draggedCoords,
                            THIAROYE_CENTER,
                            400
                          );
                          setManualPosition(clamped);
                          setIsGpsLocked(false);
                          ensureMapVisible();
                        }
                      }
                    },
                  }}
                  icon={customReportPinIcon}
                />
              </MapContainer>

              {/* CONTRÔLES FLOTTANTS SUR LA CARTE (EN HAUT À DROITE) */}
              <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-2 flex-wrap justify-end">
                {/* Bascule Satellite / Plan */}
                <div className="inline-flex items-center p-0.5 rounded-xl bg-navy-950/85 backdrop-blur-md border border-white/20 text-[11px] font-bold shadow-md shrink-0">
                  <button
                    type="button"
                    onClick={() => setBaseMap('plan')}
                    className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                      baseMap === 'plan'
                        ? 'bg-white text-navy-950 shadow-xs'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <Layers size={11} />
                    <span>Plan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBaseMap('satellite')}
                    className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                      baseMap === 'satellite'
                        ? 'bg-white text-navy-950 shadow-xs'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <Satellite size={11} className={baseMap === 'satellite' ? 'text-red-600' : ''} />
                    <span>Satellite</span>
                  </button>
                </div>

                {/* Bouton Me Localiser flottant sur la carte */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveSecteur(null);
                    setManualPosition(null);
                    setIsGpsLocked(true);
                    ensureMapVisible();
                    locate();
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border shadow-md backdrop-blur-md whitespace-nowrap shrink-0 active:scale-95 ${
                    isGpsLocked && position
                      ? 'bg-emerald-600/90 hover:bg-emerald-600 text-white border-emerald-400/50'
                      : 'bg-navy-950/85 hover:bg-navy-900 text-white border-white/20'
                  }`}
                >
                  {geoStatus === 'loading' ? (
                    <Loader2 size={13} className="animate-spin text-red-400" />
                  ) : isGpsLocked && position ? (
                    <CheckCircle2 size={13} className="text-emerald-300" />
                  ) : (
                    <LocateFixed size={13} className="text-red-400" />
                  )}
                  <span>Me localiser</span>
                </button>
              </div>

              {/* Pastille flottante de consigne en haut à gauche */}
              {isGpsLocked && position ? (
                <div className="absolute top-2.5 left-2.5 z-20 px-2.5 py-1.5 rounded-xl bg-emerald-950/90 text-emerald-200 backdrop-blur-md border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1.5 shadow-md pointer-events-none">
                  <CheckCircle2 size={11} className="text-emerald-400" />
                  <span>GPS réel vérifié (ajustement 150m)</span>
                </div>
              ) : activeSecteur ? (
                <div className="absolute top-2.5 left-2.5 z-20 px-2.5 py-1.5 rounded-xl bg-navy-950/90 text-white backdrop-blur-md border border-white/20 text-[10px] font-bold flex items-center gap-1.5 shadow-md pointer-events-none">
                  <MapPin size={11} className="text-red-400" />
                  <span>Secteur {activeSecteur.nom} ({activeSecteur.rayonMetres}m)</span>
                </div>
              ) : (
                <div className="absolute top-2.5 left-2.5 z-20 px-2.5 py-1.5 rounded-xl bg-black/75 text-white backdrop-blur-md border border-white/20 text-[10px] font-bold flex items-center gap-1.5 shadow-md pointer-events-none">
                  <MapPin size={11} className="text-red-400" />
                  <span>Glissez le repère rouge pour cibler</span>
                </div>
              )}
            </div>

            {/* PANNEAU LATÉRAL À DROITE : RACCOURCIS QUARTIERS, POSITION & BOUTON VALIDER */}
            <aside
              aria-label="Contrôle de position"
              className="w-full lg:w-80 xl:w-96 flex flex-col justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 shadow-xs shrink-0"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-navy-100 dark:border-navy-800">
                  <span className="text-xs font-black uppercase tracking-wider text-navy-400">
                    1. Choisissez la position de l'incident
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/40 text-[#CC131A] dark:text-red-400 font-bold">
                    Étape 1/3
                  </span>
                </div>

                {/* Fiche dynamique de la position retenue */}
                <div className="p-3 rounded-xl bg-navy-50/70 dark:bg-navy-900/50 border border-navy-200/60 dark:border-navy-700/60 space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-navy-400 flex items-center gap-1">
                      <div
                        className={`w-2 h-2 rounded-full animate-pulse ${
                          isGpsLocked && position ? 'bg-emerald-500' : activeSecteur ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                      />
                      <span>Emplacement ciblé</span>
                    </span>

                    {(manualPosition || activeSecteur) && (
                      <button
                        type="button"
                        onClick={() => {
                          setManualPosition(null);
                          setActiveSecteur(null);
                          setIsGpsLocked(false);
                        }}
                        className="text-[10px] font-bold text-[#CC131A] dark:text-red-400 hover:underline cursor-pointer"
                      >
                        Réinitialiser
                      </button>
                    )}
                  </div>

                  <p className="font-extrabold text-navy-900 dark:text-white text-xs sm:text-sm truncate">
                    {activeSecteur
                      ? `Secteur ${activeSecteur.nom}`
                      : manualPosition
                      ? 'Position manuelle ajustée'
                      : position
                      ? 'Position GPS réelle vérifiée'
                      : 'Position par défaut (Thiaroye-sur-Mer)'}
                  </p>

                  <p className="text-[11px] text-navy-500 dark:text-navy-400 font-mono">
                    {activeCoords.lat.toFixed(5)}, {activeCoords.lon.toFixed(5)}
                  </p>

                  <span className="text-[10px] text-navy-400 block pt-0.5">
                    {activeSecteur
                      ? `Déplacement restreint au périmètre du quartier (${activeSecteur.rayonMetres}m max)`
                      : manualPosition
                      ? 'Repère posé manuellement sur la carte'
                      : position
                      ? (isGpsLocked ? 'Position GPS confirmée' : 'Signal GPS précis')
                      : 'Secteur central de Thiaroye'}
                  </span>
                </div>

                {/* Raccourcis de sélection rapide par quartier */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-navy-400 flex items-center gap-1 mb-2">
                    <Compass size={12} className="text-[#CC131A]" />
                    <span>Accès rapide par quartier :</span>
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-1.5">
                    {QUARTIERS_THIAROYE.map((q) => {
                      const isActive = activeSecteur?.nom === q.nom;
                      return (
                        <button
                          key={q.nom}
                          type="button"
                          onClick={() => {
                            setActiveSecteur(q);
                            setManualPosition({ lat: q.lat, lon: q.lon });
                            setIsGpsLocked(false);
                            ensureMapVisible();
                          }}
                          className={`p-2 rounded-xl text-left font-bold text-xs transition-all duration-150 cursor-pointer border active:scale-95 ${
                            isActive
                              ? 'bg-[#CC131A] text-white border-[#CC131A] shadow-xs'
                              : 'bg-white dark:bg-navy-900/60 border-navy-200/80 dark:border-navy-800 text-navy-800 dark:text-navy-200 hover:border-[#CC131A] hover:text-[#CC131A] dark:hover:text-red-400'
                          }`}
                        >
                          <span className="block truncate">{q.nom}</span>
                          <span className={`block text-[9px] mt-0.5 ${isActive ? 'text-white/80' : 'text-navy-400'}`}>
                            Rayon {q.rayonMetres}m
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* BOUTON D'ACTION PRINCIPAL DÉPLACÉ DANS LE PANNEAU DE DROITE */}
              <div className="pt-3 border-t border-navy-100 dark:border-navy-800 space-y-1.5">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-[#CC131A] hover:from-red-700 hover:to-[#b01016] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:shadow-red-600/25 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                >
                  <span>Valider la position & Continuer</span>
                  <ArrowRight size={15} />
                </button>
                <p className="text-[10px] text-center text-navy-400">
                  Étape suivante : description, alerte et photos.
                </p>
              </div>
            </aside>
          </div>
        )}

        {/* ========================================================= */}
        {/* ÉTAPE 2 : FORMULAIRE PLEINE LARGEUR                       */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <form onSubmit={handleValidateFormStep} className="w-full flex flex-col gap-4">
            {/* Rappel synthétique de la position validée à l'étape 1 */}
            <div className="p-3 rounded-xl bg-navy-50 dark:bg-navy-900/40 border border-navy-200/80 dark:border-navy-800 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin size={14} className="text-[#CC131A] shrink-0" />
                <span className="truncate text-navy-700 dark:text-slate-300">
                  Position sélectionnée :{' '}
                  <strong className="text-navy-900 dark:text-white">
                    {activeSecteur
                      ? `Secteur ${activeSecteur.nom}`
                      : manualPosition
                      ? `Position manuelle (${activeCoords.lat.toFixed(4)}, ${activeCoords.lon.toFixed(4)})`
                      : position
                      ? `GPS réel (${activeCoords.lat.toFixed(4)}, ${activeCoords.lon.toFixed(4)})`
                      : 'Thiaroye-sur-Mer (Centre)'}
                  </strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="text-[11px] font-bold text-[#CC131A] dark:text-red-400 hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <Pencil size={11} />
                <span>Modifier la position</span>
              </button>
            </div>

            {/* CARTE 1 : Catégorie d'aléa & Hauteur d'eau */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 shadow-xs space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="block text-xs font-bold uppercase tracking-wider text-navy-800 dark:text-navy-200">
                    Catégorie
                  </span>
                  <span className="text-[10px] text-navy-400 font-medium">Type d'incident</span>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {CATEGORIES.map((c) => {
                    const Icon = c.icon;
                    const isSelected = categorie === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => {
                          if (categorie !== c.value) {
                            setCategorie(c.value);
                            setNiveauEau(null);
                          }
                        }}
                        className={`group text-xs font-bold py-3.5 px-2 rounded-xl border-[1.5px] transition-all duration-200 flex flex-col items-center justify-center gap-1.5 cursor-pointer transform active:scale-95 ${
                          isSelected
                            ? 'bg-navy dark:bg-navy-800 text-white border-navy dark:border-navy-700 shadow-md ring-2 ring-red-500/30 scale-[1.02]'
                            : 'border-navy-200 dark:border-navy-800 bg-navy-50/40 dark:bg-navy-900/40 text-navy-800 dark:text-navy-200 hover:border-navy-400 hover:bg-white dark:hover:bg-navy-900 hover:-translate-y-0.5 hover:shadow-xs'
                        }`}
                      >
                        <Icon size={18} className={`transition-transform duration-200 ${isSelected ? 'text-red-400 scale-110' : 'text-navy-500 dark:text-navy-400 group-hover:scale-110'}`} />
                        <span className="leading-tight text-xs sm:text-sm">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sélecteur de critère d'état secondaire adapté dynamiquement au type d'incident */}
              <div className="pt-2 border-t border-navy-100 dark:border-navy-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-navy-700 dark:text-navy-300 flex items-center gap-1.5">
                    <Activity size={13} className="text-[#CC131A]" />
                    <span>{currentCategoryConfig.critereTitre}</span>
                  </span>
                  {niveauEau && (
                    <button
                      type="button"
                      onClick={() => setNiveauEau(null)}
                      className="text-[10px] font-semibold text-navy-400 hover:text-red-500 cursor-pointer transition-colors"
                    >
                      Effacer
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {currentCategoryConfig.criteres.map((niv) => {
                    const NivIcon = niv.icon;
                    const isNivActive = niveauEau?.id === niv.id;
                    return (
                      <button
                        key={niv.id}
                        type="button"
                        onClick={() => setNiveauEau(isNivActive ? null : niv)}
                        className={`group py-2.5 px-2 rounded-xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center gap-0.5 active:scale-95 hover:-translate-y-0.5 ${
                          isNivActive
                            ? 'bg-[#0B2545] text-white border-[#0B2545] shadow-sm ring-2 ring-blue-500/30 scale-[1.02]'
                            : `${niv.color} hover:shadow-xs`
                        }`}
                      >
                        <div className="flex items-center gap-1 text-[11px] font-bold">
                          <NivIcon size={12} className="transition-transform duration-200 group-hover:scale-110" />
                          <span>{niv.label}</span>
                        </div>
                        <span className={`text-[9px] font-medium ${isNivActive ? 'text-slate-300' : 'opacity-80'}`}>
                          {niv.approx}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* CARTE 2 : Description & Suggestions 1-clic adaptées */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="description-input" className="block text-xs font-bold uppercase tracking-wider text-navy-800 dark:text-navy-200">
                  Description
                </label>
                <span className="text-[10px] text-navy-400 font-medium">
                  {description.length} caractères
                </span>
              </div>

              <textarea
                id="description-input"
                rows={3}
                required
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (descriptionError) setDescriptionError(null);
                }}
                placeholder={currentCategoryConfig.placeholder}
                className="w-full px-3.5 py-2.5 rounded-xl border-[1.5px] border-navy-200 dark:border-navy-800 bg-navy-50/30 dark:bg-navy-950/50 text-sm placeholder:text-navy-400 focus:outline-none focus:border-[#CC131A] dark:focus:border-[#CC131A] resize-none transition"
              />

              {descriptionError && (
                <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                  <AlertCircle size={13} />
                  <span>{descriptionError}</span>
                </p>
              )}

              {/* Suggestions express pour remplir en 1 clic */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy-400 block mb-1.5">
                  Suggestions rapides en 1 clic :
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentCategoryConfig.suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setDescription(sug);
                        if (descriptionError) setDescriptionError(null);
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-navy-50 dark:bg-navy-900/60 hover:bg-navy-100 dark:hover:bg-navy-800 text-navy-700 dark:text-navy-300 border border-navy-200/60 dark:border-navy-700/60 transition cursor-pointer active:scale-95"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* CARTE 3 : Photos (jusqu'à 3 photos) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="block text-xs font-bold uppercase tracking-wider text-navy-800 dark:text-navy-200">
                  Photo (optionnelle)
                </span>
                <span className="text-[10px] text-navy-400 font-bold">
                  {photos.length}/3 photos
                </span>
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {photos.map((item, idx) => (
                    <div
                      key={item.id}
                      className="relative group rounded-xl overflow-hidden border border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-900/60 p-1.5 flex flex-col gap-1.5"
                    >
                      <div className="relative h-28 w-full rounded-lg overflow-hidden bg-navy-950">
                        <img
                          src={item.previewUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold">
                          #{idx + 1}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] text-navy-600 dark:text-navy-300 truncate max-w-[100px]" title={item.name}>
                          {item.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title="Remplacer cette photo"
                            onClick={() => replaceInputRefs.current[item.id]?.click()}
                            className="p-1 rounded text-navy-500 hover:text-navy-900 dark:hover:text-white hover:bg-navy-100 dark:hover:bg-navy-800 transition cursor-pointer"
                          >
                            <RefreshCw size={12} />
                          </button>
                          <input
                            ref={(el) => (replaceInputRefs.current[item.id] = el)}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleReplacePhoto(item.id, e)}
                          />
                          <button
                            type="button"
                            title="Supprimer cette photo"
                            onClick={() => handleRemovePhoto(item.id)}
                            className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {photos.length < 3 && (
                <div>
                  <label
                    htmlFor="photo-file-input"
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-navy-200 dark:border-navy-700 hover:border-[#CC131A] dark:hover:border-[#CC131A] rounded-xl cursor-pointer transition bg-navy-50/40 dark:bg-navy-900/30 text-center group"
                  >
                    <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/40 text-[#CC131A] flex items-center justify-center mb-1.5 transition-transform group-hover:scale-110">
                      <Camera size={18} />
                    </div>
                    <span className="text-xs font-bold text-navy-800 dark:text-navy-200">
                      Ajouter une photo ({3 - photos.length} restante{3 - photos.length > 1 ? 's' : ''})
                    </span>
                    <span className="text-[10px] text-navy-400 mt-0.5">
                      Prise de vue mobile ou fichier · Optimisation automatique
                    </span>
                  </label>
                  <input
                    id="photo-file-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAddPhotos}
                    className="hidden"
                  />
                </div>
              )}

              {isCompressing && (
                <p className="flex items-center gap-1.5 text-[11px] text-navy-500 dark:text-navy-300">
                  <Loader2 size={12} className="animate-spin text-[#CC131A]" />
                  <span>Optimisation des images pour réseau mobile…</span>
                </p>
              )}

              {photoError && (
                <p className="flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400 font-medium">
                  <AlertCircle size={12} />
                  <span>{photoError}</span>
                </p>
              )}
            </div>

            {/* CARTE 4 : Choix de diffusion */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 shadow-xs">
              <label
                htmlFor="partager-communaute-checkbox"
                className="flex items-start gap-3 p-3 rounded-xl bg-navy-50/60 dark:bg-navy-900/50 border border-navy-200/70 dark:border-navy-700/70 cursor-pointer select-none text-xs text-navy-800 dark:text-slate-200"
              >
                <input
                  type="checkbox"
                  id="partager-communaute-checkbox"
                  checked={partagerCommunaute}
                  onChange={(e) => setPartagerCommunaute(e.target.checked)}
                  className="w-4 h-4 rounded text-[#CC131A] focus:ring-[#CC131A] cursor-pointer flex-shrink-0 mt-0.5"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-navy-900 dark:text-white">
                    Partager également sur l'Espace Communauté
                  </span>
                  <span className="text-[11px] text-navy-500 dark:text-navy-400 mt-0.5">
                    {partagerCommunaute
                      ? 'Visible par les riverains sur le fil public pour organiser la solidarité locale.'
                      : 'Transmis en toute confidentialité aux autorités uniquement (aucun affichage public).'}
                  </span>
                </div>
              </label>
            </div>

            {/* Barre de navigation de l'étape 2 */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 hover:border-navy-400 text-navy-800 dark:text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
              >
                <ArrowLeft size={15} />
                <span>Retour à la carte</span>
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-[#CC131A] hover:from-red-700 hover:to-[#b01016] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <span>Vérifier mon signalement</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* ÉTAPE 3 : RÉCAPITULATIF GÉNÉRAL (DEUX CONTENEURS)         */}
        {/* ========================================================= */}
        {currentStep === 3 && (
          <div className="w-full flex flex-col gap-4">
            {/* Barre d'action supérieure avec bouton Modifier */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-navy-900 dark:text-white flex items-center gap-2">
                  <Eye size={18} className="text-[#CC131A]" />
                  <span>3. Récapitulatif général de votre signalement</span>
                </h3>
                <p className="text-xs text-navy-500 dark:text-navy-400 mt-0.5">
                  Vérifiez vos informations ci-dessous avant confirmation et envoi.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="px-3 py-1.5 rounded-lg bg-navy-50 hover:bg-navy-100 dark:bg-navy-900 dark:hover:bg-navy-800 text-navy-700 dark:text-navy-200 text-xs font-bold border border-navy-200 dark:border-navy-700 flex items-center gap-1.5 cursor-pointer transition"
                >
                  <MapPin size={12} className="text-[#CC131A]" />
                  <span>Modifier la position</span>
                </button>
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="px-3 py-1.5 rounded-lg bg-navy-50 hover:bg-navy-100 dark:bg-navy-900 dark:hover:bg-navy-800 text-navy-700 dark:text-navy-200 text-xs font-bold border border-navy-200 dark:border-navy-700 flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Pencil size={12} />
                  <span>Modifier le formulaire</span>
                </button>
              </div>
            </div>

            {/* GRILLE DES DEUX CONTENEURS (Gauche: Synthèse, Droite: Carte verrouillée) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-stretch">
              {/* CONTENEUR 1 (GAUCHE) : Fiche de synthèse en lecture seule */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-navy-100 dark:border-navy-800">
                    <span className="text-xs font-black uppercase tracking-wider text-navy-400">
                      Détails de l'observation
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                      Prêt à envoyer
                    </span>
                  </div>

                  {/* Localisation */}
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-navy-400 mb-1">
                      Localisation retenue
                    </span>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-navy-50/70 dark:bg-navy-900/50 border border-navy-200/60 dark:border-navy-700/60">
                      <MapPin size={16} className="text-[#CC131A] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-navy-900 dark:text-white truncate">
                          {activeSecteur ? `Secteur ${activeSecteur.nom}` : 'Thiaroye-sur-Mer'}
                        </p>
                        <p className="text-[10px] text-navy-500 dark:text-navy-400">
                          Lat: {activeCoords.lat.toFixed(5)} · Lon: {activeCoords.lon.toFixed(5)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Catégorie & Niveau d'eau */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-navy-50/70 dark:bg-navy-900/50 border border-navy-200/60 dark:border-navy-700/60">
                      <span className="block text-[10px] font-bold uppercase text-navy-400 mb-0.5">
                        Catégorie
                      </span>
                      <p className="text-xs font-black text-navy-900 dark:text-white capitalize">
                        {CATEGORIES.find((c) => c.value === categorie)?.label || categorie}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-navy-50/70 dark:bg-navy-900/50 border border-navy-200/60 dark:border-navy-700/60">
                      <span className="block text-[10px] font-bold uppercase text-navy-400 mb-0.5">
                        {currentCategoryConfig.parentLabel}
                      </span>
                      <p className="text-xs font-black text-navy-900 dark:text-white">
                        {niveauEau ? `${niveauEau.label} (${niveauEau.approx})` : 'Non précisé'}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-navy-400 mb-1">
                      Description de l'incident
                    </span>
                    <div className="p-3 rounded-xl bg-navy-50/50 dark:bg-navy-950/50 border border-navy-200/60 dark:border-navy-800 text-xs text-navy-800 dark:text-navy-100 leading-relaxed max-h-36 overflow-y-auto">
                      {description || <span className="italic text-navy-400">Aucune description</span>}
                    </div>
                  </div>

                  {/* Photos */}
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-navy-400 mb-1.5">
                      Photos ({photos.length}/3)
                    </span>
                    {photos.length > 0 ? (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {photos.map((item, idx) => (
                          <div
                            key={item.id}
                            className="relative w-20 h-16 rounded-lg overflow-hidden border border-navy-200 dark:border-navy-700 bg-navy-900 shrink-0"
                          >
                            <img
                              src={item.previewUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0.5 left-0.5 px-1 rounded bg-black/70 text-white text-[8px] font-bold">
                              #{idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-navy-400 italic">
                        Aucune photo jointe.
                      </p>
                    )}
                  </div>

                  {/* Diffusion */}
                  <div className="pt-2 border-t border-navy-100 dark:border-navy-800/80">
                    <span className="text-[11px] font-semibold text-navy-600 dark:text-navy-300 flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-emerald-500" />
                      <span>
                        {partagerCommunaute
                          ? "Visible par les riverains sur l'Espace Communauté et la Cellule d'alerte."
                          : "Transmis en toute confidentialité aux autorités uniquement."}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* CONTENEUR 2 (DROITE) : Carte récapitulative verrouillée avec toponymie */}
              <div className="rounded-2xl overflow-hidden border-[1.5px] border-navy-200 dark:border-navy-800 shadow-md bg-slate-900 flex flex-col min-h-[380px] lg:h-full relative isolate z-0">
                {/* En-tête épuré de la carte de récapitulatif */}
                <div className="p-3 bg-white dark:bg-[#071322] border-b border-navy-100 dark:border-navy-800 flex items-center justify-between text-xs shrink-0">
                  <span className="font-bold text-navy-800 dark:text-navy-200 flex items-center gap-1.5">
                    <MapPin size={13} className="text-[#CC131A]" />
                    <span>Emplacement validé</span>
                  </span>
                  <span className="text-[10px] text-navy-400 font-medium">
                    {baseMap === 'satellite' ? 'Vue Satellite + Voirie' : 'Vue Plan'}
                  </span>
                </div>

                <div className="relative flex-1 w-full min-h-[320px]">
                  <MapContainer
                    center={[activeCoords.lat, activeCoords.lon]}
                    zoom={16}
                    minZoom={13}
                    maxZoom={19}
                    maxBounds={THIAROYE_BOUNDS}
                    maxBoundsViscosity={0.85}
                    dragging={true}
                    scrollWheelZoom={false}
                    touchZoom={true}
                    zoomControl={false}
                    style={{ width: '100%', height: '100%', minHeight: '320px', backgroundColor: '#0e1c2e' }}
                  >
                    {baseMap === 'satellite' ? (
                      <>
                        <TileLayer
                          attribution='&copy; <a href="https://www.esri.com/">Esri World Imagery</a>'
                          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                          maxZoom={19}
                        />
                        <TileLayer
                          attribution='&copy; <a href="https://www.esri.com/">Esri Places &amp; Streets</a>'
                          url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                          maxZoom={19}
                        />
                      </>
                    ) : (
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                    )}

                    <MapViewController coords={activeCoords} zoom={16} />

                    {/* Halo d'exactitude */}
                    <CircleMarker
                      center={[activeCoords.lat, activeCoords.lon]}
                      radius={14}
                      pathOptions={{
                        color: '#BE123C',
                        weight: 2,
                        fillColor: '#EF4444',
                        fillOpacity: 0.35,
                      }}
                    />

                    {/* Repère d'incident verrouillé */}
                    <Marker
                      position={[activeCoords.lat, activeCoords.lon]}
                      draggable={false}
                      icon={customReportPinIcon}
                    />
                  </MapContainer>

                  {/* Pastille de repère confirmé */}
                  <div className="absolute top-2.5 left-2.5 z-20 px-2.5 py-1 rounded-lg bg-black/75 text-white backdrop-blur-md border border-white/20 text-[10px] font-bold flex items-center gap-1.5 shadow-sm pointer-events-none">
                    <CheckCircle2 size={11} className="text-emerald-400" />
                    <span>Point d'intervention validé</span>
                  </div>
                </div>
              </div>
            </div>

            {mutation.isError && (
              <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red/15 text-red-900 dark:text-red-200 text-xs space-y-1">
                {flattenApiErrors(mutation.error).map((msg, i) => (
                  <p key={i}>{msg}</p>
                ))}
              </div>
            )}

            {/* Barre de soumission finale */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 hover:border-navy-400 text-navy-800 dark:text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
              >
                <ArrowLeft size={15} />
                <span>Modifier le formulaire</span>
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={mutation.isPending}
                className="group w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-[#CC131A] hover:from-red-700 hover:to-[#b01016] text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg hover:shadow-red-600/25 transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-60"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Envoi en cours…</span>
                  </>
                ) : (
                  <>
                    <Send size={16} className="transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                    <span>Envoyer le signalement</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Section Infographie de Transparence : Cycle de vie d'un signalement */}
      <div className="w-full pt-6 pb-2">
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-4 rounded-full bg-[#CC131A]" />
              <div>
                <h3 className="text-sm sm:text-base font-black text-navy-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>Le cycle de vie de votre signalement</span>
                  <span className="px-2 py-0.5 rounded-full bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-200 text-[10px] font-black">
                    Transparence
                  </span>
                </h3>
                <p className="text-xs text-navy-500 dark:text-navy-400 font-medium">
                  Comment les autorités et les services techniques traitent votre observation
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Étape 1 */}
            <div className="group p-3.5 rounded-2xl bg-navy-50/50 dark:bg-navy-900/40 border border-navy-100 dark:border-navy-800 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-blue-200 dark:hover:border-navy-700">
              <div>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs mb-2.5 transition-transform duration-200 group-hover:scale-110">
                  1
                </div>
                <h4 className="text-xs font-black text-navy-900 dark:text-white flex items-center gap-1.5">
                  <Send size={13} className="text-blue-500 transition-transform duration-200 group-hover:translate-x-0.5" />
                  <span>Émission citoyenne</span>
                </h4>
                <p className="text-[11px] text-navy-600 dark:text-navy-300 mt-1 leading-relaxed">
                  Votre observation est horodatée, géolocalisée et transmise en temps réel au serveur central.
                </p>
              </div>
            </div>

            {/* Étape 2 */}
            <div className="group p-3.5 rounded-2xl bg-navy-50/50 dark:bg-navy-900/40 border border-navy-100 dark:border-navy-800 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-amber-200 dark:border-navy-700">
              <div>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-xs mb-2.5 transition-transform duration-200 group-hover:scale-110">
                  2
                </div>
                <h4 className="text-xs font-black text-navy-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-amber-500 transition-transform duration-200 group-hover:scale-110" />
                  <span>Analyse & Priorisation</span>
                </h4>
                <p className="text-[11px] text-navy-600 dark:text-navy-300 mt-1 leading-relaxed">
                  La cellule de crise de Thiaroye vérifie la sévérité, la zone à risque et valide l'intervention.
                </p>
              </div>
            </div>

            {/* Étape 3 */}
            <div className="group p-3.5 rounded-2xl bg-navy-50/50 dark:bg-navy-900/40 border border-navy-100 dark:border-navy-800 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-red-200 dark:hover:border-navy-700">
              <div>
                <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center font-black text-xs mb-2.5 transition-transform duration-200 group-hover:scale-110">
                  3
                </div>
                <h4 className="text-xs font-black text-navy-900 dark:text-white flex items-center gap-1.5">
                  <Activity size={13} className="text-red-500 transition-transform duration-200 group-hover:scale-110" />
                  <span>Déploiement terrain</span>
                </h4>
                <p className="text-[11px] text-navy-600 dark:text-navy-300 mt-1 leading-relaxed">
                  Activation des motopompes de pompage, curage des caniveaux ou dispatch des sapeurs-pompiers.
                </p>
              </div>
            </div>

            {/* Étape 4 */}
            <div className="group p-3.5 rounded-2xl bg-navy-50/50 dark:bg-navy-900/40 border border-navy-100 dark:border-navy-800 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-emerald-200 dark:hover:border-navy-700">
              <div>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs mb-2.5 transition-transform duration-200 group-hover:scale-110">
                  4
                </div>
                <h4 className="text-xs font-black text-navy-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-500 transition-transform duration-200 group-hover:scale-110" />
                  <span>Résolution & Clôture</span>
                </h4>
                <p className="text-[11px] text-navy-600 dark:text-navy-300 mt-1 leading-relaxed">
                  L'incident est marqué comme résolu et une notification push informe les riverains du quartier.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Encart de réflexes d'urgence et numéros d'assistance (Carrousel automatique 5s avec pause au survol) */}
      <div className="w-full pt-1 pb-4">
        <div
          onMouseEnter={() => setIsConsignePaused(true)}
          onMouseLeave={() => setIsConsignePaused(false)}
          onTouchStart={() => setIsConsignePaused(true)}
          onTouchEnd={() => setIsConsignePaused(false)}
          className="relative p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-navy-900 via-[#0B2545] to-slate-900 text-white border border-navy-700 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
        >
          <div className="space-y-1.5 flex-1 min-w-0 min-h-[92px] sm:min-h-[82px] flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase transition-colors ${activeConsigne.badgeColor}`}>
                <ActiveConsigneIcon size={11} />
                <span>{activeConsigne.badge}</span>
              </span>
              {isConsignePaused && (
                <span className="text-[10px] text-slate-400 font-medium italic animate-pulse">
                  (en pause)
                </span>
              )}
            </div>

            <h4 className="text-sm font-extrabold text-white transition-opacity duration-300">
              {activeConsigne.titre}
            </h4>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed transition-opacity duration-300">
              {activeConsigne.description}
            </p>

            {/* Indicateurs de progression (pastilles cliquables pour changer manuellement) */}
            <div className="flex items-center gap-1.5 pt-1">
              {CONSIGNES_URGENCE_THIAROYE.map((c, idx) => (
                <button
                  key={c.id}
                  type="button"
                  aria-label={`Consigne ${idx + 1} : ${c.badge}`}
                  onClick={() => setConsigneIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    consigneIndex === idx
                      ? 'w-5 bg-red-500 shadow-xs'
                      : 'w-1.5 bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="tel:18"
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs flex items-center gap-2 shadow-sm transition active:scale-95"
            >
              <PhoneCall size={14} />
              <span>Sapeurs-Pompiers (18)</span>
            </a>
            <a
              href="tel:1515"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xs flex items-center gap-2 border border-white/20 transition active:scale-95"
            >
              <span>SAMU (1515)</span>
            </a>
          </div>
        </div>
      </div>
    </CitizenShell>
  );
}
