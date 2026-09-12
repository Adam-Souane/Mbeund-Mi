import AutoriteShell from '../desktop/AutoriteShell';
import InteractiveMap from '../../shared/components/map/InteractiveMap';
import { useZones } from '../../shared/hooks/useZones';
import { useInondations } from '../../shared/hooks/useInondations';
import { useCapteurs } from '../../shared/hooks/useCapteurs';
import { useSegments } from '../../shared/hooks/useSegments';
import { useSignalementsApercu } from '../../shared/hooks/useSignalements';

export default function CarteInteractivePage() {
  const { data: zonesData, isLoading } = useZones();
  const { data: inondationsData } = useInondations();
  const { data: capteursData } = useCapteurs();
  const { data: segmentsData } = useSegments();
  const { data: signalementsData } = useSignalementsApercu();

  const signalementsFeatures = signalementsData?.results?.features ?? [];

  return (
    <AutoriteShell>
      <div>
        <h1 className="text-2xl font-extrabold">Carte interactive (SIG)</h1>
        <p className="text-sm text-navy-600 dark:text-navy-200 mt-0.5">
          Thiaroye-sur-Mer · Zones, capteurs, drainage, inondations et signalements
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-navy-400">Chargement de la carte…</p>
      ) : (
        <InteractiveMap
          data={{
            zones: zonesData,
            inondations: inondationsData,
            segments: segmentsData,
            capteurs: capteursData,
            signalements: signalementsFeatures,
          }}
          height={640}
        />
      )}
    </AutoriteShell>
  );
}
