import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Camera, MapPin, LocateFixed, CheckCircle2, Loader2 } from 'lucide-react';
import CitizenShell from '../shared/CitizenShell';
import { createSignalement } from '../../api/endpoints/signalements';
import { flattenApiErrors } from '../../shared/utils/apiErrors';

const CATEGORIES = [
  { value: 'inondation', label: 'Inondation' },
  { value: 'egouts', label: 'Égouts' },
  { value: 'autre', label: 'Autre' },
];

// Même centre que le geofencing backend (SignalementCitoyenSerializer) —
// sert de position de repli tant que la géolocalisation n'a pas répondu.
const THIAROYE_CENTER = { lat: 14.75, lon: -17.38 };

function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState(null);

  const locate = () => {
    if (!navigator.geolocation) {
      setStatus('error');
      setError("Ce navigateur ne permet pas la géolocalisation.");
      return;
    }
    setStatus('loading');
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setStatus('success');
      },
      () => {
        setStatus('error');
        setError("Position refusée ou indisponible — activez la géolocalisation puis réessayez.");
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  return { position, status, error, locate };
}

export default function SignalerPageBody() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { position, status: geoStatus, error: geoError, locate } = useGeolocation();

  const [categorie, setCategorie] = useState('inondation');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      createSignalement({
        description,
        categorie,
        longitude: (position ?? THIAROYE_CENTER).lon,
        latitude: (position ?? THIAROYE_CENTER).lat,
        photo,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signalements'] });
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
        <p className="text-sm text-navy-600 dark:text-navy-200 max-w-xs">
          Merci pour votre contribution. Une autorité va l’examiner et le valider prochainement.
        </p>
        <button
          onClick={() => navigate('/citoyen/accueil')}
          className="mt-2 bg-red text-white font-bold text-sm px-6 py-3 rounded-md"
        >
          Retour à l’accueil
        </button>
      </div>
    );
  }

  const point = position ?? THIAROYE_CENTER;

  return (
    <CitizenShell>
      <div className="max-w-lg lg:max-w-2xl w-full mx-auto flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-extrabold">Nouveau signalement</h1>
          <p className="text-sm text-navy-600 dark:text-navy-200 mt-0.5">
            Décrivez ce que vous observez — une autorité le validera avant publication.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

          <label className="block">
            <span className="block text-xs font-semibold mb-1.5">Description</span>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex : Eau stagnante devant l’école primaire, environ 30 cm."
              className="w-full px-3.5 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm placeholder:text-navy-400 focus:outline-none focus:border-navy dark:focus:border-navy-50"
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
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

            <div className="rounded-md overflow-hidden border-[1.5px] border-navy-200 dark:border-navy-800" style={{ height: 180 }}>
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
              <p className="flex items-center gap-1.5 text-[11px] text-navy-400 mt-1.5">
                <MapPin size={11} />
                Position détectée ({position.lat.toFixed(4)}, {position.lon.toFixed(4)})
              </p>
            ) : (
              <p className="text-[11px] text-navy-400 mt-1.5">
                {geoStatus === 'error' ? geoError : 'Position par défaut (Thiaroye-sur-Mer) — localisez-vous pour plus de précision.'}
              </p>
            )}
          </div>

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
            className="w-full bg-red text-white font-bold text-sm py-3 rounded-md disabled:opacity-60"
          >
            {mutation.isPending ? 'Envoi en cours…' : 'Envoyer le signalement'}
          </button>
        </form>
      </div>
    </CitizenShell>
  );
}
