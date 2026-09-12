import CitizenShell from '../shared/CitizenShell';
import InteractiveMap from '../../shared/components/map/InteractiveMap';
import { useZones } from '../../shared/hooks/useZones';
import { useInondations } from '../../shared/hooks/useInondations';
import { useSignalementsApercu } from '../../shared/hooks/useSignalements';

export default function CartePageBody() {
  const { data: zonesData, isLoading } = useZones();
  const { data: inondationsData } = useInondations();
  const { data: signalementsData } = useSignalementsApercu();

  const signalementsFeatures = signalementsData?.results?.features ?? [];

  return (
    <CitizenShell>
      <div>
        <h1 className="text-xl font-extrabold">Carte des risques</h1>
        <p className="text-sm text-navy-600 dark:text-navy-200 mt-0.5">
          Thiaroye-sur-Mer · Zones à risque, inondations passées et signalements
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-navy-400">Chargement de la carte…</p>
      ) : (
        <InteractiveMap
          data={{ zones: zonesData, inondations: inondationsData, signalements: signalementsFeatures }}
          height={560}
        />
      )}
    </CitizenShell>
  );
}
