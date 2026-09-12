import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Logo from '../../shared/components/Logo';
import ThemeToggle from '../../theme/ThemeToggle';
import InteractiveMap from '../../shared/components/map/InteractiveMap';
import { useZones } from '../../shared/hooks/useZones';
import { useInondations } from '../../shared/hooks/useInondations';
import { useSignalementsApercu } from '../../shared/hooks/useSignalements';

export default function CartePageBody() {
  const navigate = useNavigate();
  const { data: zonesData, isLoading } = useZones();
  const { data: inondationsData } = useInondations();
  const { data: signalementsData } = useSignalementsApercu();

  const signalementsFeatures = signalementsData?.results?.features ?? [];

  return (
    <div className="min-h-screen bg-navy-50 dark:bg-navy-950 text-navy dark:text-navy-50">
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-navy">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/citoyen/accueil')} className="p-1">
            <ArrowLeft size={18} />
          </button>
          <Logo size="sm" />
        </div>
        <ThemeToggle />
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 flex flex-col gap-4">
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
            height={520}
          />
        )}
      </div>
    </div>
  );
}
