import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Radio,
  Layers,
  Compass,
  Building2,
  Activity,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Navigation,
  Eye,
} from 'lucide-react';
import AutoriteShell from '../desktop/AutoriteShell';
import InteractiveMap from '../../shared/components/map/InteractiveMap';
import { useZones } from '../../shared/hooks/useZones';
import { useInondations } from '../../shared/hooks/useInondations';
import { useCapteurs } from '../../shared/hooks/useCapteurs';
import { useSegments } from '../../shared/hooks/useSegments';
import { useSignalementsApercu } from '../../shared/hooks/useSignalements';
import { useRefuges } from '../../shared/hooks/useRefuges';

const BARRED_ROADS_STORAGE_KEY = 'mbeund_barred_roads_v1';

const DEFAULT_BARRED_ROADS = [
  {
    id: 'road-1',
    nom: 'Axe Marché - Thiaroye Gare',
    quartier: 'Thiaroye Gare',
    niveau: 'Critique',
    inonde: true,
    coordinates: [
      [-17.3820, 14.7555],
      [-17.3805, 14.7570],
      [-17.3790, 14.7590],
    ],
  },
  {
    id: 'road-2',
    nom: 'Rue 10 Cuvette Ouest',
    quartier: 'Cuvette Ouest',
    niveau: 'Élevé',
    inonde: true,
    coordinates: [
      [-17.3910, 14.7430],
      [-17.3890, 14.7445],
      [-17.3870, 14.7460],
    ],
  },
  {
    id: 'road-3',
    nom: 'Route du Débarcadère Plage',
    quartier: 'Thiaroye Plage',
    niveau: 'Surveillance',
    inonde: false,
    coordinates: [
      [-17.3860, 14.7380],
      [-17.3845, 14.7395],
      [-17.3830, 14.7410],
    ],
  },
];

export default function CarteInteractivePage() {
  const { data: zonesData, isLoading } = useZones();
  const { data: inondationsData } = useInondations();
  const { data: capteursData } = useCapteurs();
  const { data: segmentsData } = useSegments();
  const { data: signalementsData } = useSignalementsApercu();
  const { data: refugesData } = useRefuges();

  const [selectedQuartier, setSelectedQuartier] = useState(null);
  const [barredRoads, setBarredRoads] = useState(() => {
    try {
      const saved = localStorage.getItem(BARRED_ROADS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_BARRED_ROADS;
    } catch {
      return DEFAULT_BARRED_ROADS;
    }
  });

  const signalementsFeatures = signalementsData?.results?.features ?? [];
  const zonesFeatures = zonesData?.features ?? [];
  const nbZones = zonesFeatures.length;
  const nbCapteurs = capteursData?.length ?? 0;
  const nbRefuges = refugesData?.length ?? 0;
  const nbSignalements = signalementsFeatures.length;

  const toggleRoadStatus = (id) => {
    setBarredRoads((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, inonde: !r.inonde } : r));
      try {
        localStorage.setItem(BARRED_ROADS_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event('mbeund_barred_roads_changed'));
      } catch {}
      return updated;
    });
  };

  const sectorsSummary = useMemo(() => {
    return zonesFeatures.map((z) => ({
      id: z.id,
      quartier: z.properties?.quartier || `Secteur #${z.id}`,
      niveau: z.properties?.niveau_risque || 'modere',
      score: Math.round(Number(z.properties?.score_risque_moyen ?? 0) * 100),
    }));
  }, [zonesFeatures]);

  return (
    <AutoriteShell>
      <div className="space-y-4">
        {/* ── EN-TÊTE ÉPURÉ DE LA CARTE INTERACTIVE ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[#0B2545] dark:text-slate-300">
                <Activity size={13} className="text-[#CC131A]" />
                Poste de Commandement Cartographique · Thiaroye
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B2545] dark:text-white tracking-tight mt-0.5">
              Carte interactive (SIG)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Supervision hydrographique, capteurs IoT, voirie, périmètres d&apos;exclusion et signalements
            </p>
          </div>

          <div className="flex items-center flex-nowrap gap-2 shrink-0">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#071322] border border-slate-200 dark:border-slate-800 text-xs font-bold text-[#0B2545] dark:text-slate-200 shadow-2xs whitespace-nowrap">
              <Radio size={14} className="text-blue-600 animate-pulse" />
              Télémétrie Live
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold whitespace-nowrap">
              {nbZones} Secteurs · {nbSignalements} Signalements
            </span>
          </div>
        </div>

        {/* ── BARRE DE SÉLECTION RAPIDE DE SECTEUR EN PLEINE LARGEUR EN HAUT ── */}
        <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Centrer :
          </span>
          <button
            type="button"
            onClick={() => setSelectedQuartier(null)}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
              selectedQuartier === null
                ? 'bg-[#0B2545] text-white shadow-xs'
                : 'bg-white dark:bg-[#071322] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            Vue Territoriale Globale
          </button>
          {sectorsSummary.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setSelectedQuartier(sec.quartier)}
              className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                selectedQuartier === sec.quartier
                  ? 'bg-[#0B2545] text-white shadow-xs'
                  : 'bg-white dark:bg-[#071322] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              {sec.quartier}
            </button>
          ))}
        </div>

        {/* ── 2. GRILLE OPÉRATIONNELLE : CARTE SIG (8 COL.) + CONSOLE LATÉRALE (4 COL.) ALIGNÉES ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Colonne Gauche (8 col.) : Carte Interactive avec cadre blanc institutionnel identique à la droite */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="h-full bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm flex flex-col">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Navigation size={16} className="text-[#0B2545] dark:text-slate-200" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0B2545] dark:text-white">
                    Supervision Cartographique &amp; Couches SIG
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {selectedQuartier ? `Focus : ${selectedQuartier}` : 'Vue Territoire'}
                </span>
              </div>

              {/* Conteneur de la Carte Leaflet */}
              <div className="flex-1 w-full min-h-[560px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative bg-slate-900">
                {isLoading ? (
                  <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 gap-3">
                    <Compass size={36} className="animate-spin text-[#CC131A]" />
                    <p className="text-sm font-bold">Chargement des couches géographiques de Thiaroye…</p>
                  </div>
                ) : (
                  <InteractiveMap
                    data={{
                      zones: zonesData,
                      inondations: inondationsData,
                      segments: segmentsData,
                      capteurs: capteursData,
                      signalements: signalementsFeatures,
                      refuges: refugesData,
                    }}
                    selectedQuartier={selectedQuartier}
                    height="100%"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Colonne Droite (4 col.) : Console de Commandement Latérale */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Voies Barrées & Périmètres de Sécurité */}
            <div className="bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-[#CC131A]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0B2545] dark:text-white">
                    Périmètres &amp; Voies Barrées
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Contrôle C.O.D
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fermez un axe inondé pour forcer le recalcul du GPS des riverains et sécuriser les secours.
              </p>

              <div className="space-y-2.5">
                {barredRoads.map((road) => (
                  <div
                    key={road.id}
                    className={`p-3 rounded-xl border transition ${
                      road.inonde
                        ? 'bg-[#CC131A]/5 dark:bg-[#CC131A]/10 border-[#CC131A]/30'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-black text-[#0B2545] dark:text-white block truncate">
                          {road.nom}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          {road.quartier} · Risque {road.niveau}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleRoadStatus(road.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1 shrink-0 ${
                          road.inonde
                            ? 'bg-[#CC131A] text-white hover:bg-red-800'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {road.inonde ? (
                          <>
                            <Lock size={11} /> Barrée
                          </>
                        ) : (
                          <>
                            <Unlock size={11} /> Ouverte
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suivi des Secteurs et Unités */}
            <div className="flex-1 bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={16} className="text-[#0B2545] dark:text-slate-200" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#0B2545] dark:text-white">
                      Vulnérabilité par Secteur
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    Direct IA
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[240px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {sectorsSummary.map((sec) => (
                    <div
                      key={sec.id}
                      className="p-3 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col gap-2"
                    >
                      <div
                        onClick={() => setSelectedQuartier(sec.quartier)}
                        className="flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-[#0B2545] dark:text-white block truncate">
                            {sec.quartier}
                          </span>
                          <span className="text-[10px] text-slate-400 capitalize">
                            Risque {sec.niveau}
                          </span>
                        </div>
                        <span className="text-xs font-black text-[#0B2545] dark:text-slate-200">
                          {sec.score}%
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedQuartier(sec.quartier)}
                          className="text-[10px] font-bold text-[#0B2545] dark:text-slate-300 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <MapPin size={11} className="text-[#CC131A]" />
                          Centrer carte
                        </button>
                        <Link
                          to="/autorite/crise"
                          className="px-2.5 py-1 rounded-lg bg-[#CC131A] hover:bg-red-800 text-white text-[10px] font-bold flex items-center gap-1 transition shadow-2xs"
                        >
                          <AlertTriangle size={10} />
                          Diffuser Alerte
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Coordination Pompiers &amp; ONAS</span>
                <span className="font-bold text-[#0B2545] dark:text-slate-300">C.O.D Actif</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AutoriteShell>
  );
}
