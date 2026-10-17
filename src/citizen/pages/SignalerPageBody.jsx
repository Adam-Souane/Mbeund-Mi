import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Camera,
  MapPin,
  LocateFixed,
  CheckCircle2,
  Loader2,
  Clock,
  ArrowDown,
  Trash2,
  RefreshCw,
  Plus,
  AlertCircle,
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

const CATEGORIES = [
  { value: 'inondation', label: 'Inondation' },
  { value: 'egouts', label: 'Égouts' },
  { value: 'autre', label: 'Autre' },
];

// Même centre que le geofencing backend (SignalementCitoyenSerializer) —
// sert de position de repli tant que la géolocalisation n'a pas répondu.
const THIAROYE_CENTER = { lat: 14.75, lon: -17.38 };

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

  const [categorie, setCategorie] = useState('inondation');
  const [description, setDescription] = useState('');
  // Liste ordonnée de photos (jusqu'à 3): [{ id, file, previewUrl, name, sizeKb }]
  const [photos, setPhotos] = useState([]);
  const [photoError, setPhotoError] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const replaceInputRefs = useRef({});

  const [submitted, setSubmitted] = useState(false);
  // Checklist : choix du citoyen de partager ou non sur l'espace communautaire public
  const [partagerCommunaute, setPartagerCommunaute] = useState(true);

  // Photo principale pour compatibilité directe
  const primaryPhoto = photos[0]?.file ?? null;

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
          return {
            id: Math.random().toString(36).substring(2, 9),
            file: compressed,
            previewUrl: URL.createObjectURL(compressed),
            name: file.name,
            sizeKb: Math.round(compressed.size / 1024),
          };
        })
      );
      setPhotos((prev) => [...prev, ...newItems]);
    } catch {
      setPhotoError("Impossible d'optimiser une ou plusieurs images.");
    } finally {
      setIsCompressing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemovePhoto = (idToRemove) => {
    setPhotos((prev) => {
      const item = prev.find((p) => p.id === idToRemove);
      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((p) => p.id !== idToRemove);
    });
    setPhotoError(null);
  };

  const handleReplacePhoto = async (idToReplace, newFile) => {
    if (!newFile) return;
    setIsCompressing(true);
    setPhotoError(null);
    try {
      const compressed = await compressImageClient(newFile);
      setPhotos((prev) =>
        prev.map((p) => {
          if (p.id === idToReplace) {
            if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
            return {
              id: p.id,
              file: compressed,
              previewUrl: URL.createObjectURL(compressed),
              name: newFile.name,
              sizeKb: Math.round(compressed.size / 1024),
            };
          }
          return p;
        })
      );
    } catch {
      setPhotoError("Échec du remplacement de la photo.");
    } finally {
      setIsCompressing(false);
    }
  };

  const mutation = useMutation({
    mutationFn: () =>
      createSignalement({
        description,
        categorie,
        longitude: (position ?? THIAROYE_CENTER).lon,
        latitude: (position ?? THIAROYE_CENTER).lat,
        photo: primaryPhoto,
        photos: photos.map((p) => p.file),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['signalements'] });
      queryClient.invalidateQueries({ queryKey: ['mes-signalements'] });

      const rawId = data?.id ?? data?.properties?.id ?? Date.now();

      if (!partagerCommunaute) {
        // Le citoyen a choisi de NE PAS publier sur la communauté : diffusion restreinte à l'autorité uniquement
        try {
          const privates = JSON.parse(localStorage.getItem('mbeund_mi_private_signalement_ids') || '{}');
          privates[rawId] = true;
          if (description.trim()) {
            privates[description.trim()] = true;
          }
          localStorage.setItem('mbeund_mi_private_signalement_ids', JSON.stringify(privates));
        } catch {}
      } else {
        // Le citoyen a coché le partage : le signalement est également diffusé sur le fil d'entraide communautaire
        try {
          const cleanAuthor = sanitizePublicAuthor(nomCitoyen, 'Citoyen');
          const authorAvatar = getPublicAvatar({ name: cleanAuthor, id: `shared-sig-${rawId}`, context: description });
          const sharedPost = {
            id: `shared-sig-${rawId}`,
            rawBackendId: rawId,
            isUserPost: true,
            isBackendSignalement: true,
            typePost: 'signalement',
            badgeFiltre: 'Signalement terrain',
            author: {
              name: cleanAuthor,
              avatar: authorAvatar,
              quartier: 'Thiaroye-sur-Mer',
              role: 'Résident',
            },
            date: 'Posté à l’instant',
            dureeType: 'Post durable (actif)',
            categorie: categorie === 'inondation' ? 'Inondation' : categorie === 'egouts' ? 'Égouts bouchés' : 'Signalement terrain',
            titre: categorie === 'inondation' ? 'Eau stagnante' : 'Signalement terrain',
            texte: description,
            image: photos[0]?.previewUrl ?? null,
            images: photos.map((p) => p.previewUrl),
            statut: 'en_cours',
            statutLabel: 'Signalement actif · Traitement requis',
            baseLikes: 1,
            baseViews: 1,
            comments: [],
          };
          const existing = JSON.parse(localStorage.getItem('mbeund_mi_user_community_posts') || '[]');
          localStorage.setItem('mbeund_mi_user_community_posts', JSON.stringify([sharedPost, ...existing]));

          const myPostIds = JSON.parse(localStorage.getItem('mbeund_mi_my_post_ids') || '{}');
          myPostIds[`shared-sig-${rawId}`] = true;
          myPostIds[`backend-sig-${rawId}`] = true;
          myPostIds[rawId] = true;
          localStorage.setItem('mbeund_mi_my_post_ids', JSON.stringify(myPostIds));
        } catch {}
      }

      addNotification({
        type: 'signalement',
        data: {
          titre: partagerCommunaute
            ? 'Signalement transmis aux autorités & partagé'
            : 'Signalement confidentiel transmis aux autorités',
          message: partagerCommunaute
            ? `Votre observation (${categorie}) a été transmise aux autorités et partagée sur le fil d'entraide communautaire.`
            : `Votre observation (${categorie}) a été transmise en toute confidentialité aux autorités uniquement.`,
        },
      });
      setSubmitted(true);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.reset();
    mutation.mutate();
  };

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

  const point = position ?? THIAROYE_CENTER;

  return (
    <CitizenShell>
      {/* Bannière de sensibilisation et engagement communautaire Mbeund-Mi */}
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

      {/* Barre de titre et d'actions rapides (Historique & Carte) */}
      <div id="section-nouveau-signalement" className="w-full flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:items-stretch scroll-mt-6">
        <div className="lg:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-navy-100 dark:border-navy-800">
          <div>
            <h1 className="text-xl font-extrabold text-navy-900 dark:text-white">Nouveau signalement</h1>
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 lg:h-full">
          <div>
            <span className="block text-xs font-semibold mb-1.5">Catégorie</span>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategorie(c.value)}
                  className={`text-xs font-bold py-2.5 rounded-md border-[1.5px] transition-colors ${
                    categorie === c.value
                      ? 'bg-navy dark:bg-navy-800 text-white border-navy dark:border-navy-800'
                      : 'border-navy-200 dark:border-navy-800 text-navy dark:text-navy-50'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block lg:flex-1 lg:flex lg:flex-col lg:min-h-0">
            <span className="block text-xs font-semibold mb-1.5">Description</span>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex : Eau stagnante devant l’école primaire, environ 30 cm."
              className="w-full px-3.5 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm placeholder:text-navy-400 focus:outline-none focus:border-navy dark:focus:border-navy-50 lg:flex-1 lg:resize-none"
            />
          </label>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="block text-xs font-semibold">
                Photo (optionnelle)
              </span>
              <span className="text-[11px] font-bold text-navy-500 dark:text-navy-300">
                {photos.length}/3 photos
              </span>
            </div>

            {/* Aperçus des photos déjà ajoutées (jusqu'à 3) */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2.5">
                {photos.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative group rounded-xl overflow-hidden border border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-900 flex flex-col shadow-xs"
                  >
                    <div className="relative aspect-4/3 w-full bg-slate-100 dark:bg-navy-950 overflow-hidden">
                      <img
                        src={item.previewUrl}
                        alt={`Aperçu ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = '/images/ruelle-thiaroye.jpg';
                        }}
                      />
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold backdrop-blur-xs">
                        {index === 0 ? 'Principale' : `#${index + 1}`}
                      </span>

                      {/* Bouton supprimer individuel */}
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(item.id)}
                        title="Supprimer cette photo"
                        className="absolute top-1 right-1 p-1 rounded-full bg-red-600/85 hover:bg-red-700 text-white shadow-xs cursor-pointer transition active:scale-90"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <div className="p-1.5 flex items-center justify-between gap-1 text-[10px] bg-white dark:bg-navy-800">
                      <span className="truncate text-navy-700 dark:text-navy-200 font-medium" title={item.name}>
                        {item.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => replaceInputRefs.current[item.id]?.click()}
                        title="Remplacer cette photo"
                        className="text-navy-500 hover:text-[#CC131A] dark:hover:text-red-400 p-0.5 cursor-pointer flex-shrink-0"
                      >
                        <RefreshCw size={11} />
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={(el) => (replaceInputRefs.current[item.id] = el)}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleReplacePhoto(item.id, f);
                          e.target.value = '';
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Zone d'ajout de photos si moins de 3 */}
            {photos.length < 3 && (
              <label className="flex items-center gap-3 p-3 rounded-xl border-[1.5px] border-dashed border-navy-200 dark:border-navy-700 hover:border-[#CC131A] dark:hover:border-[#CC131A] bg-white dark:bg-navy-900 cursor-pointer transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-navy-50 dark:bg-navy-800 group-hover:bg-red-50 dark:group-hover:bg-red-950/40 flex items-center justify-center flex-shrink-0 text-navy-700 dark:text-navy-200 group-hover:text-[#CC131A] transition-colors">
                  {photos.length === 0 ? <Camera size={16} /> : <Plus size={16} />}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-navy-800 dark:text-navy-100 group-hover:text-[#CC131A] transition-colors truncate">
                    {photos.length === 0 ? 'Ajouter une photo' : `Ajouter une autre photo (${photos.length}/3)`}
                  </span>
                  <span className="text-[10px] text-navy-400">
                    JPG, PNG · Compression automatique · Max 3 photos
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  className="hidden"
                  onChange={handleAddPhotos}
                />
              </label>
            )}

            {isCompressing && (
              <p className="flex items-center gap-1.5 text-[11px] text-navy-500 dark:text-navy-300 mt-1.5">
                <Loader2 size={12} className="animate-spin text-[#CC131A]" />
                Optimisation des images pour réseau mobile…
              </p>
            )}

            {photoError && (
              <p className="flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400 mt-1.5 font-medium">
                <AlertCircle size={12} />
                {photoError}
              </p>
            )}
          </div>

          {/* Choix de diffusion dans la communauté (carré simple avec phrase descriptive) */}
          <label
            htmlFor="partager-communaute-checkbox"
            className="flex items-center gap-2.5 py-1 cursor-pointer select-none text-xs text-navy-800 dark:text-slate-200"
          >
            <input
              type="checkbox"
              id="partager-communaute-checkbox"
              checked={partagerCommunaute}
              onChange={(e) => setPartagerCommunaute(e.target.checked)}
              className="w-4 h-4 rounded text-[#CC131A] focus:ring-[#CC131A] cursor-pointer flex-shrink-0"
            />
            <span>
              {partagerCommunaute
                ? "Partager également sur l'Espace Communauté (visible par les riverains sur le fil public)"
                : "Partager également ce signalement sur l'Espace Communauté"}
            </span>
          </label>

          {mutation.isError && (
            <div className="px-3 py-2.5 rounded-md bg-red-50 dark:bg-red/15 text-red-900 dark:text-red-200 text-xs space-y-1">
              {flattenApiErrors(mutation.error).map((msg, i) => (
                <p key={i}>{msg}</p>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-red text-white font-bold text-sm py-3 rounded-md disabled:opacity-60 cursor-pointer shadow-md hover:bg-red-700 transition"
          >
            {mutation.isPending ? 'Envoi en cours…' : 'Envoyer le signalement'}
          </button>
        </form>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="block text-xs font-semibold">Position</span>
            <button
              type="button"
              onClick={locate}
              className="flex items-center gap-1.5 text-xs font-bold text-red"
            >
              {geoStatus === 'loading' ? <Loader2 size={13} className="animate-spin" /> : <LocateFixed size={13} />}
              Me localiser
            </button>
          </div>

          <div className="rounded-md overflow-hidden border-[1.5px] border-navy-200 dark:border-navy-800 h-[180px] lg:h-[460px]">
            <MapContainer
              center={[point.lat, point.lon]}
              zoom={position ? 16 : 13}
              dragging={false}
              scrollWheelZoom={false}
              zoomControl={false}
              style={{ width: '100%', height: '100%' }}
              key={`${point.lat}-${point.lon}`}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <CircleMarker
                center={[point.lat, point.lon]}
                radius={9}
                pathOptions={{ color: '#fff', weight: 2, fillColor: '#C0182A', fillOpacity: 1 }}
              />
            </MapContainer>
          </div>

          {position ? (
            <p className="flex items-center gap-1.5 text-[11px] text-navy-400 mt-1">
              <MapPin size={11} />
              Position détectée ({position.lat.toFixed(4)}, {position.lon.toFixed(4)})
            </p>
          ) : (
            <p className="text-[11px] text-navy-400 mt-1">
              {geoStatus === 'error' ? geoError : 'Position par défaut (Thiaroye-sur-Mer) — localisez-vous pour plus de précision.'}
            </p>
          )}
        </div>
      </div>
    </CitizenShell>
  );
}
