import { Navigation, Loader2, X, ShieldCheck, AlertTriangle } from 'lucide-react';
import CitizenShell from '../shared/CitizenShell';
import InteractiveMap from '../../shared/components/map/InteractiveMap';
import RiskBadge from '../../shared/components/RiskBadge';
import { useZones } from '../../shared/hooks/useZones';
import { useInondations } from '../../shared/hooks/useInondations';
import { useSignalementsApercu } from '../../shared/hooks/useSignalements';
import { useRefuges } from '../../shared/hooks/useRefuges';
import { useGeolocation } from '../../shared/hooks/useGeolocation';
import { useItineraireSecurise } from '../../shared/hooks/useItineraireSecurise';
import { flattenApiErrors } from '../../shared/utils/apiErrors';

export default function CartePageBody() {
  const { data: zonesData, isLoading } = useZones();
  const { data: inondationsData } = useInondations();
  const { data: signalementsData } = useSignalementsApercu();
  const { data: refugesData } = useRefuges();
  const { status: geoStatus, locate } = useGeolocation();
  const itineraire = useItineraireSecurise();

  const signalementsFeatures = signalementsData?.results?.features ?? [];

  const handleItineraire = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        itineraire.mutate({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        // La géolocalisation a échoué — on retente via le hook pour que le
        // message d'erreur standard s'affiche (permission refusée, etc.).
        locate();
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  return (
    <CitizenShell>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-extrabold">Carte des risques</h1>
          <p className="text-sm text-navy-600 dark:text-navy-200 mt-0.5">
            Thiaroye-sur-Mer · Zones à risque, inondations passées et signalements
          </p>
        </div>

        {itineraire.data ? (
          <button
            onClick={() => itineraire.reset()}
            className="flex items-center gap-1.5 text-xs font-bold text-navy-600 dark:text-navy-200 border-[1.5px] border-navy-200 dark:border-navy-800 rounded-md px-3.5 py-2"
          >
            <X size={14} />
            Fermer l’itinéraire
          </button>
        ) : (
          <button
            onClick={handleItineraire}
            disabled={itineraire.isPending}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-red rounded-md px-3.5 py-2 disabled:opacity-60"
          >
            {itineraire.isPending ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
            Itinéraire vers un lieu sûr
          </button>
        )}
      </div>

      {itineraire.isError && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-md bg-red-50 dark:bg-red/15 text-red-900 dark:text-red-200 text-xs">
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
          <span>{flattenApiErrors(itineraire.error)[0]}</span>
        </div>
      )}

      {geoStatus === 'error' && !itineraire.data && !itineraire.isError && (
        <p className="text-xs text-navy-400">
          Localisez-vous pour calculer un itinéraire — la géolocalisation a été refusée ou est indisponible.
        </p>
      )}

      {itineraire.data && (
        <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={17} />
            </div>
            <div>
              <p className="text-xs text-navy-400">Point sûr le plus proche</p>
              <p className="text-sm font-bold">{itineraire.data.zone_arrivee.quartier}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="block text-navy-400">Distance</span>
              <span className="font-bold">{itineraire.data.distance_km} km</span>
            </div>
            <div>
              <span className="block text-navy-400">Risque du trajet</span>
              <span className="font-bold">{Math.round(itineraire.data.score_risque_moyen_parcours * 100)}%</span>
            </div>
            {itineraire.data.segments_risque_traverses.length > 0 && (
              <div>
                <span className="block text-navy-400">Rues à risque traversées</span>
                <span className="font-bold text-red">{itineraire.data.segments_risque_traverses.length}</span>
              </div>
            )}
          </div>
          <RiskBadge niveau={itineraire.data.zone_arrivee.niveau_risque} className="sm:ml-auto" />
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-navy-400">Chargement de la carte…</p>
      ) : (
        <InteractiveMap
          data={{ zones: zonesData, inondations: inondationsData, signalements: signalementsFeatures, refuges: refugesData }}
          route={itineraire.data?.route}
          height={560}
        />
      )}
    </CitizenShell>
  );
}
