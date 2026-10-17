import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Camera, MapPin, LocateFixed, CheckCircle2, Loader2 } from 'lucide-react';
import CitizenShell from '../shared/CitizenShell';
import { createSignalement } from '../../api/endpoints/signalements';
import { flattenApiErrors } from '../../shared/utils/apiErrors';
import { useGeolocation } from '../../shared/hooks/useGeolocation';
import { useNotifications } from '../../shared/contexts/NotificationContext';

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
  const { addNotification } = useNotifications();
  const { position, status: geoStatus, error: geoError, locate } = useGeolocation();

  const [categorie, setCategorie] = useState('inondation');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  // Checklist : choix du citoyen de partager ou non sur l'espace communautaire public
  const [partagerCommunaute, setPartagerCommunaute] = useState(true);

  const mutation = useMutation({
    mutationFn: () =>
      createSignalement({
        description,
        categorie,
        longitude: (position ?? THIAROYE_CENTER).lon,
        latitude: (position ?? THIAROYE_CENTER).lat,
        photo,
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
          const sharedPost = {
            id: `shared-sig-${rawId}`,
            isBackendSignalement: true,
            typePost: 'signalement',
            badgeFiltre: 'Signalement terrain',
            author: {
              name: 'Sentinelle Citoyenne',
              avatar: '/images/avatar-modou.jpg',
              quartier: 'Thiaroye-sur-Mer',
              role: 'Signalement Terrain',
            },
            date: 'Posté à l’instant',
            dureeType: 'Post durable (actif)',
            categorie: categorie === 'inondation' ? 'Inondation' : categorie === 'egouts' ? 'Égouts bouchés' : 'Signalement terrain',
            titre: categorie === 'inondation' ? 'Eau stagnante' : 'Signalement terrain',
            texte: description,
            image: photo ? URL.createObjectURL(photo) : null,
            statut: 'en_cours',
            statutLabel: 'Signalement actif · Traitement requis',
            baseLikes: 1,
            baseViews: 1,
            comments: [],
          };
          const existing = JSON.parse(localStorage.getItem('mbeund_mi_user_community_posts') || '[]');
          localStorage.setItem('mbeund_mi_user_community_posts', JSON.stringify([sharedPost, ...existing]));
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
      {/* Desktop : formulaire à gauche, aperçu carte plus grand à droite,
          sur toute la largeur disponible (comme la page Carte) — plus de
          colonne plafonnée qui laissait un vide de chaque côté. Mobile :
          empilement classique. */}
      <div className="w-full flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:items-stretch">
        <div className="lg:col-span-2">
          <h1 className="text-xl font-extrabold">Nouveau signalement</h1>
          <p className="text-sm text-navy-600 dark:text-navy-200 mt-0.5">
            Décrivez ce que vous observez — une autorité le validera avant publication.
          </p>
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
            <span className="block text-xs font-semibold mb-1.5">Photo (optionnelle)</span>
            <label className="flex items-center gap-3 p-3 rounded-md border-[1.5px] border-dashed border-navy-200 dark:border-navy-800 cursor-pointer">
              <div className="w-9 h-9 rounded-lg bg-navy-50 dark:bg-navy-800 flex items-center justify-center flex-shrink-0">
                <Camera size={16} />
              </div>
              <span className="text-xs text-navy-600 dark:text-navy-200 truncate">
                {photo ? photo.name : 'Ajouter une photo'}
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              />
            </label>
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
