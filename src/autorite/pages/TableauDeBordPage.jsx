import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  Droplet,
  Send,
  Flame,
  ThumbsUp,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Radio,
  Building2,
  Wrench,
  Check,
  TrendingUp,
  Activity,
  Layers,
  ArrowRight,
  Compass,
  Clock,
  Wifi,
  AlertTriangle,
  Eye,
  X,
} from 'lucide-react';
import AutoriteShell from '../desktop/AutoriteShell';
import GaugeRisk from '../../shared/components/GaugeRisk';
import RiskBadge from '../../shared/components/RiskBadge';
import { useZones } from '../../shared/hooks/useZones';
import { usePredictions } from '../../shared/hooks/usePredictions';
import { useAlertesRecentes } from '../../shared/hooks/useAlertes';
import { useSignalementsApercu, useValiderSignalement } from '../../shared/hooks/useSignalements';
import { getPostsWithLiveVotes } from '../../shared/data/riverainsData';
import { useAuth } from '../../auth/AuthContext';

function useSafeAuth() {
  try {
    return useAuth();
  } catch {
    return { role: 'admin', service: 'cod' };
  }
}

const SERVICES_INTERVENTION = [
  { id: 'bnsp', label: 'Sapeurs-Pompiers (BNSP)', short: 'BNSP (18)', icon: Flame },
  { id: 'onas', label: 'ONAS (Pompage & Curage)', short: 'ONAS Pompage', icon: Wrench },
  { id: 'mairie', label: 'Cellule Municipale (Logistique)', short: 'Mairie Thiaroye', icon: Building2 },
];

const VUES_COMMANDEMENT = [
  { id: 'all', label: 'C.O.D Unifié', badge: 'Poste Global' },
  { id: 'bnsp', label: 'BNSP Pompiers', badge: 'Sauvetage & Évacuation' },
  { id: 'onas', label: 'ONAS Hydraulique', badge: 'Pompage & Réseau' },
  { id: 'mairie', label: 'Cellule Municipale', badge: 'Logistique & Relais' },
];

const SIGNALEMENT_PHOTOS = [
  '/images/ruelle-thiaroye.jpg',
  '/images/caniveau-thiaroye.jpg',
  '/images/pompage-thiaroye.jpg',
  '/images/curage-caniveau-sable-thiaroye.jpg',
];

const FALLBACK_SECTEURS = [
  { id: 'sec-1', quartier: 'Thiaroye Gare', niveau_risque: 'rouge', score_risque_moyen: 0.85, coords: '14.747° N · 17.384° W', altitude: '+1.6m (Cuvette basse)', sonde: 'TH-01 · 24 cm' },
  { id: 'sec-2', quartier: 'Ndakhane Cuvette', niveau_risque: 'orange', score_risque_moyen: 0.68, coords: '14.752° N · 17.379° W', altitude: '+1.8m (Point bas)', sonde: 'TH-02 · 18 cm' },
  { id: 'sec-3', quartier: 'Thiaroye Plage', niveau_risque: 'jaune', score_risque_moyen: 0.42, coords: '14.739° N · 17.388° W', altitude: '+2.4m (Littoral)', sonde: 'TH-03 · 11 cm' },
  { id: 'sec-4', quartier: 'Thiaroye Minam', niveau_risque: 'vert', score_risque_moyen: 0.22, coords: '14.756° N · 17.381° W', altitude: '+3.9m (Bassin tampon)', sonde: 'TH-04 · 6 cm' },
];

const NIVEAU_RANK = { vert: 0, jaune: 1, orange: 2, rouge: 3 };

function normalizeScorePercent(rawScore) {
  const num = Number(rawScore ?? 0);
  if (num <= 1 && num > 0) return Math.round(num * 100);
  return Math.min(100, Math.round(num));
}

function normalizeZoneForGauge(zone) {
  if (!zone) return null;
  const raw = Number(zone.score_risque_moyen ?? 0);
  return {
    ...zone,
    score_risque_moyen: raw > 1 ? raw / 100 : raw,
  };
}

function pickMostAtRiskZone(features) {
  if (!features?.length) return null;
  return [...features]
    .map((f) => ({ id: f.id, ...f.properties }))
    .sort((a, b) => {
      const rankDiff = (NIVEAU_RANK[b.niveau_risque] ?? 0) - (NIVEAU_RANK[a.niveau_risque] ?? 0);
      if (rankDiff !== 0) return rankDiff;
      return normalizeScorePercent(b.score_risque_moyen) - normalizeScorePercent(a.score_risque_moyen);
    })[0];
}

function getSectorBarColor(isRouge, isOrange) {
  if (isRouge) return 'bg-[#CC131A]';
  if (isOrange) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function classifyReportService(item) {
  const text = `${item.categorie || ''} ${item.titre || ''} ${item.description || ''}`.toLowerCase();
  if (
    text.includes('caniveau') ||
    text.includes('égout') ||
    text.includes('egout') ||
    text.includes('pomp') ||
    text.includes('bassin') ||
    text.includes('drain') ||
    text.includes('refoul')
  ) {
    return 'onas';
  }
  if (
    text.includes('piéton') ||
    text.includes('pieton') ||
    text.includes('parpaing') ||
    text.includes('passerelle') ||
    text.includes('prévention') ||
    text.includes('prevention') ||
    text.includes('set-setal') ||
    text.includes('curage communautaire') ||
    text.includes('sac')
  ) {
    return 'mairie';
  }
  return 'bnsp';
}

function getSectorActionLabel(isRouge, isOrange, commandView) {
  if (commandView === 'bnsp') {
    if (isRouge) return 'Sauvetage & Évacuation BNSP';
    if (isOrange) return 'Reconnaissance véhicule VSR';
    return 'Accès secours dégagé';
  }
  if (commandView === 'onas') {
    if (isRouge) return 'Motopompe P1 grand débit';
    if (isOrange) return 'Hydrocurage canal requis';
    return 'Écoulement gravitaire normal';
  }
  if (commandView === 'mairie') {
    if (isRouge) return 'Ouverture École Refuge';
    if (isOrange) return 'Distribution sacs de sable';
    return 'Veille Relais de Quartier';
  }
  if (isRouge) return 'Pompage prioritaire';
  if (isOrange) return 'Surveillance canal';
  return 'Écoulement fluide';
}

function KpiTelemetryCard({ icon: Icon, label, value, trend, caption, progressPct, isCritical = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-navy-300 dark:hover:border-navy-600 transition-all duration-200 flex flex-col justify-between ${
        onClick ? 'cursor-pointer active:scale-[0.99]' : ''
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-navy-500 dark:text-navy-400 truncate">
            {label}
          </span>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center border bg-navy-50 dark:bg-navy-900 text-[#0B2545] dark:text-navy-100 border-navy-100 dark:border-navy-800 flex-shrink-0">
            <Icon size={16} />
          </div>
        </div>

        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl font-black text-navy-900 dark:text-white tracking-tight">
            {value}
          </span>
          {trend && (
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-navy-50 dark:bg-navy-800 text-navy-700 dark:text-navy-300 flex items-center gap-0.5">
              <TrendingUp size={11} />
              {trend}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3">
        {progressPct != null && (
          <div className="w-full h-1.5 rounded-full bg-navy-100 dark:bg-navy-800 overflow-hidden mb-1.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCritical ? 'bg-[#CC131A]' : 'bg-[#0B2545] dark:bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(8, progressPct))}%` }}
            />
          </div>
        )}
        {caption && (
          <p className="text-xs font-medium text-navy-500 dark:text-navy-400 truncate">
            {caption}
          </p>
        )}
      </div>
    </div>
  );
}

export default function TableauDeBordPage() {
  const navigate = useNavigate();
  const validerMutation = useValiderSignalement();
  const { role, service: authService } = useSafeAuth();
  const isIntermediateAuthority = role === 'autorite' && ['bnsp', 'onas', 'mairie'].includes(authService);

  // Horloge temps réel du Poste de Commandement C.O.D
  const [nowTime, setNowTime] = useState(() =>
    new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    }, 30_000);
    return () => clearInterval(timer);
  }, []);

  // Vue opérationnelle : s'ouvre directement sur le corps assigné si c'est une autorité intermédiaire, ou C.O.D Unifié pour l'Admin Général
  const [commandView, setCommandView] = useState(() =>
    isIntermediateAuthority ? authService : 'all'
  );

  const [selectedService, setSelectedService] = useState(() => {
    if (isIntermediateAuthority) return authService;
    try {
      return localStorage.getItem('mbeund_mi_assigned_service') || 'bnsp';
    } catch {
      return 'bnsp';
    }
  });

  const [deployedReports, setDeployedReports] = useState(() => {
    try {
      const saved = localStorage.getItem('mbeund_mi_deployed_reports_map');
      if (saved) return JSON.parse(saved);
      return {};
    } catch {
      return {};
    }
  });

  // Modale d'inspection photo HD d'un signalement terrain
  const [inspectedSignalement, setInspectedSignalement] = useState(null);

  const { data: zonesData } = useZones();
  const { data: predictions } = usePredictions();
  const { data: alertesData } = useAlertesRecentes();
  const { data: signalementsData } = useSignalementsApercu();

  const apiZones = zonesData?.features?.map((f, idx) => ({
    id: f.id,
    coords: FALLBACK_SECTEURS[idx % FALLBACK_SECTEURS.length].coords,
    altitude: FALLBACK_SECTEURS[idx % FALLBACK_SECTEURS.length].altitude,
    sonde: FALLBACK_SECTEURS[idx % FALLBACK_SECTEURS.length].sonde,
    ...f.properties,
  })) ?? [];

  const zones = apiZones.length > 0 ? apiZones : FALLBACK_SECTEURS;
  const topZone = pickMostAtRiskZone(zonesData?.features) || zones[0];

  // Secteur sélectionné dans la matrice pour inspecter sa jauge IA et son radar satellite en direct
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const focusedZone = useMemo(() => {
    if (selectedZoneId != null) {
      const found = zones.find((z) => String(z.id) === String(selectedZoneId));
      if (found) return found;
    }
    return topZone;
  }, [zones, selectedZoneId, topZone]);

  const zonePrediction = useMemo(() => {
    if (!predictions?.length) return null;
    return predictions.find((p) => String(p.zone?.id) === String(focusedZone?.id)) || predictions[0];
  }, [predictions, focusedZone]);

  const zonesARisqueEleve = zones.filter(
    (z) => z.niveau_risque === 'orange' || z.niveau_risque === 'rouge'
  ).length;

  const recentAlertes = alertesData?.results?.slice(0, 3) ?? [];
  const totalAlertesEnvoyees = alertesData?.count ?? recentAlertes.length;

  const signalementsFeatures = signalementsData?.results?.features ?? [];
  const signalementsEnAttente = signalementsFeatures.filter((f) => !f.properties.valide);
  const signalementsValidesCount = signalementsFeatures.filter((f) => f.properties.valide).length;

  const sortedPosts = useMemo(() => {
    return [...getPostsWithLiveVotes()].sort((a, b) => b.totalVotes - a.totalVotes);
  }, []);

  // Fusion intelligente : Priorité aux vrais signalements API non déployés, sinon priorité aux urgences riveraines
  const allPriorityCandidates = useMemo(() => {
    const apiItems = signalementsEnAttente.map((f, idx) => {
      const item = {
        id: `api-${f.id}`,
        rawApiId: f.id,
        isApi: true,
        quartier: f.properties.quartier || focusedZone?.quartier || 'Thiaroye Gare',
        rue: `Observation #${f.id} · Terrain`,
        categorie: f.properties.categorie || 'Inondation',
        titre: f.properties.categorie
          ? `Signalement · ${String(f.properties.categorie).toUpperCase()}`
          : 'Signalement citoyen prioritaire',
        description: f.properties.description || 'Observation transmise en direct par un riverain.',
        photo: f.properties.photo || SIGNALEMENT_PHOTOS[idx % SIGNALEMENT_PHOTOS.length],
        totalVotes: f.properties.confirmations ?? 12,
        sourceLabel: 'Signalement Citoyen Direct',
      };
      return { ...item, assignedCorps: classifyReportService(item) };
    });

    const communityItems = sortedPosts.map((p) => ({
      ...p,
      isApi: false,
      sourceLabel: 'Veille Riveraine',
      assignedCorps: classifyReportService(p),
    }));

    return [...apiItems, ...communityItems];
  }, [signalementsEnAttente, sortedPosts, focusedZone]);

  // Compteurs réels par corps d'intervention pour afficher le badge dynamique sur les boutons Focus Opérationnel
  const corpsCounts = useMemo(() => {
    return {
      all: allPriorityCandidates.length,
      bnsp: allPriorityCandidates.filter((c) => c.assignedCorps === 'bnsp').length,
      onas: allPriorityCandidates.filter((c) => c.assignedCorps === 'onas').length,
      mairie: allPriorityCandidates.filter((c) => c.assignedCorps === 'mairie').length,
    };
  }, [allPriorityCandidates]);

  // Filtrage réel de la console de priorité selon le Focus Opérationnel choisi
  const priorityCandidates = useMemo(() => {
    if (commandView === 'all') return allPriorityCandidates;
    return allPriorityCandidates.filter((c) => c.assignedCorps === commandView);
  }, [allPriorityCandidates, commandView]);

  // Filtrage réel de la file des signalements citoyens en bas de page selon le Focus Opérationnel
  const filteredSignalementsEnAttente = useMemo(() => {
    if (commandView === 'all') return signalementsEnAttente;
    return signalementsEnAttente.filter((f) => {
      const corps = classifyReportService({
        categorie: f.properties.categorie,
        description: f.properties.description,
      });
      return corps === commandView;
    });
  }, [signalementsEnAttente, commandView]);

  // Filtrage réel des missions déployées selon le Focus Opérationnel
  const filteredDeployedEntries = useMemo(() => {
    const entries = Object.entries(deployedReports);
    if (commandView === 'all') return entries;
    return entries.filter(([, dep]) => dep.serviceId === commandView);
  }, [deployedReports, commandView]);

  // Tri dynamique des secteurs selon le Focus Opérationnel
  const displayedZones = useMemo(() => {
    const list = [...zones];
    if (commandView === 'bnsp') {
      return list.sort((a, b) => (NIVEAU_RANK[b.niveau_risque] ?? 0) - (NIVEAU_RANK[a.niveau_risque] ?? 0));
    }
    if (commandView === 'onas') {
      return list.sort((a, b) => normalizeScorePercent(b.score_risque_moyen) - normalizeScorePercent(a.score_risque_moyen));
    }
    if (commandView === 'mairie') {
      return list.sort((a, b) => String(a.quartier).localeCompare(String(b.quartier)));
    }
    return list;
  }, [zones, commandView]);

  const currentPriorityPost = useMemo(() => {
    return priorityCandidates.find((p) => !deployedReports[p.id]) || null;
  }, [priorityCandidates, deployedReports]);

  const priorityIndex = useMemo(() => {
    if (!currentPriorityPost) return priorityCandidates.length;
    return priorityCandidates.findIndex((p) => p.id === currentPriorityPost.id) + 1;
  }, [priorityCandidates, currentPriorityPost]);

  const activeServiceObj =
    SERVICES_INTERVENTION.find((s) => s.id === selectedService) || SERVICES_INTERVENTION[0];
  const deployedCount = Object.keys(deployedReports).length;

  const handleDepecherIntervention = () => {
    if (!currentPriorityPost) return;

    // Si c'est un vrai signalement du backend, on le certifie aussi côté API !
    if (currentPriorityPost.isApi && currentPriorityPost.rawApiId != null) {
      validerMutation.mutate({ id: currentPriorityPost.rawApiId, valide: true });
    }

    const nextMap = {
      ...deployedReports,
      [currentPriorityPost.id]: {
        serviceId: selectedService,
        serviceLabel: activeServiceObj.label,
        quartier: currentPriorityPost.quartier,
        titre: currentPriorityPost.titre,
        heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      },
    };
    setDeployedReports(nextMap);
    try {
      localStorage.setItem('mbeund_mi_deployed_reports_map', JSON.stringify(nextMap));
      localStorage.setItem('mbeund_mi_top_report_status', 'intervenu');
      localStorage.setItem('mbeund_mi_assigned_service', selectedService);
    } catch {}
  };

  const handleCertifierEtDepecher = (feature, idx) => {
    validerMutation.mutate({ id: feature.id, valide: true });
    const reportKey = `api-${feature.id}`;
    const nextMap = {
      ...deployedReports,
      [reportKey]: {
        serviceId: selectedService,
        serviceLabel: activeServiceObj.label,
        quartier: feature.properties.quartier || focusedZone?.quartier || 'Thiaroye-sur-Mer',
        titre: feature.properties.description || `Signalement #${feature.id}`,
        heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      },
    };
    setDeployedReports(nextMap);
    try {
      localStorage.setItem('mbeund_mi_deployed_reports_map', JSON.stringify(nextMap));
      localStorage.setItem('mbeund_mi_top_report_status', 'intervenu');
    } catch {}
  };

  const handleResetDeployments = () => {
    setDeployedReports({});
    try {
      localStorage.removeItem('mbeund_mi_deployed_reports_map');
      localStorage.removeItem('mbeund_mi_top_report_status');
    } catch {}
  };

  const handleSelectCommandView = (viewId) => {
    setCommandView(viewId);
    if (viewId !== 'all') {
      setSelectedService(viewId);
      try {
        localStorage.setItem('mbeund_mi_assigned_service', viewId);
      } catch {}
    }
  };

  const niveauEauPred = zonePrediction?.niveau_eau_predit_cm ?? 25;
  const confiancePred = zonePrediction?.confiance != null ? Math.round(zonePrediction.confiance) : 90;

  return (
    <AutoriteShell>
      <div className="space-y-6">
        {/* ── 1. EN-TÊTE DE COMMANDEMENT STRATÉGIQUE (C.O.D) & SÉLECTEUR D'UNITÉ ── */}
        <div className="bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-navy-900 dark:text-white tracking-tight">
                  Tableau de bord
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-navy-50 dark:bg-navy-900 text-navy-700 dark:text-navy-200 border border-navy-200 dark:border-navy-800">
                  <Radio size={12} className="text-[#0B2545] dark:text-blue-400" />
                  C.O.D Actif
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-navy-50/70 dark:bg-navy-900/70 text-navy-600 dark:text-navy-300 border border-navy-100 dark:border-navy-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Flux Citoyen & IoT Synchronisé · {nowTime}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-navy-600 dark:text-navy-300 mt-1 truncate">
                Poste de Commandement · Thiaroye-sur-Mer · Supervision temps réel (Mairie · Sapeurs-Pompiers · ONAS)
              </p>
            </div>

            <div className="flex items-center gap-2 flex-nowrap flex-shrink-0 self-start lg:self-center">
              {zonesARisqueEleve > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-navy-50 dark:bg-navy-900 text-navy-800 dark:text-navy-100 border border-navy-200 dark:border-navy-800 text-xs font-bold whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-[#CC131A] flex-shrink-0" />
                  <span>Vigilance Renforcée ({zonesARisqueEleve} zone{zonesARisqueEleve > 1 ? 's' : ''})</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-navy-50 dark:bg-navy-900 text-navy-700 dark:text-navy-200 border border-navy-200 dark:border-navy-800 text-xs font-bold whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span>Veille Municipale</span>
                </span>
              )}

              <Link
                to="/autorite/carte"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-navy-900 hover:bg-navy-50 dark:hover:bg-navy-800 text-navy-800 dark:text-white border border-navy-200 dark:border-navy-700 font-bold text-xs shadow-2xs transition whitespace-nowrap cursor-pointer"
              >
                <Compass size={14} className="text-navy-600 dark:text-navy-300 flex-shrink-0" />
                <span>Carte SIG</span>
              </Link>

              <Link
                to="/autorite/crise"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#CC131A] hover:bg-red-700 text-white font-extrabold text-xs shadow-sm transition whitespace-nowrap cursor-pointer active:scale-95"
              >
                <Send size={14} className="flex-shrink-0" />
                <span>Diffuser Alerte</span>
              </Link>
            </div>
          </div>

          {/* Barre de commutation rapide de vue par corps d'intervention (filtre réellement tous les blocs) */}
          <div className="pt-3 border-t border-navy-100 dark:border-navy-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-navy-500 dark:text-navy-400 whitespace-nowrap flex-shrink-0">
              <Layers size={14} className="text-[#0B2545] dark:text-navy-300 flex-shrink-0" />
              <span>Focus Opérationnel :</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {VUES_COMMANDEMENT.map((vue) => {
                const isActive = commandView === vue.id;
                const countForCorps = corpsCounts[vue.id] ?? 0;
                return (
                  <button
                    key={vue.id}
                    type="button"
                    onClick={() => handleSelectCommandView(vue.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-[#0B2545] dark:bg-white text-white dark:text-[#0B2545] shadow-xs'
                        : 'bg-navy-50 dark:bg-navy-900 text-navy-600 dark:text-navy-300 hover:bg-navy-100 dark:hover:bg-navy-800 border border-navy-100 dark:border-navy-800'
                    }`}
                  >
                    <span>{vue.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                        isActive
                          ? 'bg-white/20 dark:bg-navy-900/15 text-white dark:text-[#0B2545]'
                          : 'bg-navy-100 dark:bg-navy-800 text-navy-500 dark:text-navy-400'
                      }`}
                    >
                      {vue.badge} · {countForCorps}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 2. BANDEAU DE TÉLÉMÉTRIE D'IMPACT (4 KPIS C.O.D SOBRES & INSTITUTIONNELS) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiTelemetryCard
            icon={Droplet}
            label="Niveau max prévu (IA)"
            value={`${niveauEauPred} cm`}
            trend="↗ Hausse"
            isCritical={niveauEauPred >= 25}
            progressPct={Math.min(100, Math.round((niveauEauPred / 40) * 100))}
            caption={
              zonePrediction
                ? `Modèle IA fiable à ${confiancePred}% (${focusedZone?.quartier || 'Thiaroye'})`
                : 'Seuil critique fixé à 30 cm'
            }
            onClick={() => navigate('/autorite/previsions')}
          />
          <KpiTelemetryCard
            icon={ShieldAlert}
            label="Secteurs sous surveillance"
            value={`${zonesARisqueEleve} / ${zones.length}`}
            progressPct={Math.round((zonesARisqueEleve / Math.max(1, zones.length)) * 100)}
            caption={focusedZone ? `Focus actif : ${focusedZone.quartier}` : 'Situation sous contrôle'}
            onClick={() => navigate('/autorite/carte')}
          />
          <KpiTelemetryCard
            icon={Flame}
            label="Secours mobilisés"
            value={`${filteredDeployedEntries.length + (commandView === 'all' ? 2 : 1)} unités`}
            progressPct={Math.min(100, (filteredDeployedEntries.length + 2) * 22)}
            caption={
              filteredDeployedEntries.length > 0
                ? `${filteredDeployedEntries.length} mission(s) (${commandView === 'all' ? 'Tous corps' : activeServiceObj.short})`
                : `Prêt : ${activeServiceObj.short}`
            }
          />
          <KpiTelemetryCard
            icon={Activity}
            label="Signalements citoyens"
            value={`${filteredSignalementsEnAttente.length} en attente`}
            progressPct={
              signalementsFeatures.length > 0
                ? Math.round((signalementsValidesCount / signalementsFeatures.length) * 100)
                : 40
            }
            caption={
              commandView === 'all'
                ? `${totalAlertesEnvoyees} consigne(s) diffusée(s) · ${signalementsValidesCount} certifié(s)`
                : `Filtré pour ${activeServiceObj.short} (${signalementsEnAttente.length} total)`
            }
            onClick={() => navigate('/autorite/signalements')}
          />
        </div>

        {/* ── 3. GRILLE DE COMMANDEMENT RANGÉE PAR NIVEAUX ÉQUILIBRÉS ── */}

        {/* NIVEAU 1 : MATRICE INTERACTIVE DES SECTEURS (GAUCHE) & CONSOLE D'INTERVENTION CITOYENNE (DROITE) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* MATRICE INTERACTIVE EN DIRECT DES SECTEURS DE THIAROYE */}
          <div className="lg:col-span-7 bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-navy-100 dark:border-navy-800">
                <div>
                  <div className="flex items-center gap-2">
                    <Layers size={18} className="text-[#0B2545] dark:text-blue-400" />
                    <h2 className="text-base font-extrabold text-navy-900 dark:text-white">
                      Matrice de vulnérabilité par secteur
                    </h2>
                  </div>
                  <p className="text-[11px] text-navy-500 dark:text-navy-400 mt-0.5">
                    Cliquez sur un secteur pour inspecter sa télémétrie IA et son radar ci-dessous
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/autorite/carte')}
                  className="text-xs font-bold text-navy-600 dark:text-navy-300 hover:text-[#CC131A] dark:hover:text-red-400 flex items-center gap-1 cursor-pointer"
                >
                  <span>Vue SIG complète</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {displayedZones.slice(0, 4).map((z) => {
                  const score = normalizeScorePercent(z.score_risque_moyen ?? 50);
                  const isRouge = z.niveau_risque === 'rouge';
                  const isOrange = z.niveau_risque === 'orange';
                  const isSelected = String(focusedZone?.id) === String(z.id);

                  return (
                    <div
                      key={z.id}
                      onClick={() => setSelectedZoneId(z.id)}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-navy-50/90 dark:bg-navy-900 border-[#0B2545] dark:border-blue-500 shadow-xs'
                          : 'bg-white dark:bg-[#071322] border-navy-100 dark:border-navy-800/80 hover:border-navy-300 dark:hover:border-navy-700'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-navy-900 dark:text-white truncate">
                            {z.quartier}
                          </span>
                          <RiskBadge niveau={z.niveau_risque} />
                          {isSelected && (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-200">
                              Ciblé
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="w-28 sm:w-44 bg-navy-100 dark:bg-navy-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${getSectorBarColor(isRouge, isOrange)}`}
                              style={{ width: `${Math.min(100, score)}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-extrabold text-navy-600 dark:text-navy-300">
                            Score : {score}%
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end flex-shrink-0">
                        <span className="text-xs font-extrabold text-navy-800 dark:text-navy-100">
                          {getSectorActionLabel(isRouge, isOrange, commandView)}
                        </span>
                        <span className="text-[10px] text-navy-500 dark:text-navy-400 font-semibold mt-0.5">
                          {z.sonde || (isRouge ? 'Motopompe P1 active' : 'Sonde hydro normale')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pied de matrice : Action directe sur le secteur sélectionné */}
            <div className="mt-4 pt-3 border-t border-navy-100 dark:border-navy-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-navy-600 dark:text-navy-300">
                Secteur sélectionné :{' '}
                <strong className="text-navy-900 dark:text-white">{focusedZone?.quartier || 'Thiaroye Gare'}</strong>
              </span>
              <div className="flex items-center gap-3">
                <Link
                  to="/autorite/registre"
                  className="font-bold text-navy-700 dark:text-navy-200 hover:underline flex items-center gap-1"
                >
                  <span>Foyers vulnérables</span>
                </Link>
                <Link
                  to="/autorite/crise"
                  className="font-extrabold text-[#CC131A] dark:text-red-400 hover:underline flex items-center gap-1"
                >
                  <span>Alerter ce secteur →</span>
                </Link>
              </div>
            </div>
          </div>

          {/* CONSOLE D'INTERVENTION CITOYENNE : SOBRE, INSTITUTIONNELLE & SANS FOND COLORÉ */}
          <div className="lg:col-span-5 flex flex-col">
            {currentPriorityPost ? (
              <div className="h-full flex flex-col justify-between relative overflow-hidden bg-white dark:bg-[#071322] border border-navy-200 dark:border-navy-800 border-t-4 border-t-[#CC131A] rounded-2xl p-4 sm:p-5 shadow-xs">
                <div>
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-navy-100 dark:border-navy-800">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-navy-50 dark:bg-navy-900 text-[#CC131A] border border-navy-100 dark:border-navy-800">
                        <Flame size={15} />
                      </span>
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-navy-900 dark:text-white block">
                          Priorité Citoyenne N°{priorityIndex}
                        </span>
                        <span className="text-[10px] font-bold text-navy-500 dark:text-navy-400">
                          {currentPriorityPost.sourceLabel}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-navy-50 dark:bg-navy-900 border border-navy-100 dark:border-navy-800 text-xs font-bold text-navy-700 dark:text-navy-200">
                      <ThumbsUp size={12} className="text-navy-500 dark:text-navy-400" />
                      <span>{currentPriorityPost.totalVotes} confirmations</span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2.5">
                    <div className="flex gap-3">
                      <img
                        src={currentPriorityPost.photo}
                        alt={currentPriorityPost.titre}
                        onClick={() => setInspectedSignalement(currentPriorityPost)}
                        className="w-20 h-20 rounded-xl object-cover border border-navy-200 dark:border-navy-700 shadow-2xs flex-shrink-0 cursor-pointer hover:opacity-90 transition"
                        title="Cliquer pour agrandir la photo du terrain"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 text-xs text-navy-500 dark:text-navy-400 truncate">
                          <MapPin size={12} className="text-navy-500 flex-shrink-0" />
                          <span className="font-bold text-navy-800 dark:text-navy-100">
                            {currentPriorityPost.quartier}
                          </span>
                          <span>·</span>
                          <span className="truncate">{currentPriorityPost.rue}</span>
                        </div>
                        <h3 className="text-sm font-black text-navy-900 dark:text-white leading-tight mt-0.5 line-clamp-1">
                          {currentPriorityPost.titre}
                        </h3>
                        <p className="text-xs text-navy-600 dark:text-navy-300 mt-1 line-clamp-2 leading-relaxed">
                          {currentPriorityPost.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-navy-100 dark:border-navy-800 space-y-2.5 mt-3">
                  <div>
                    <label
                      htmlFor="corps-intervention-select"
                      className="block text-[10px] font-black uppercase tracking-wider text-navy-500 dark:text-navy-400 mb-1"
                    >
                      Corps d&apos;intervention à déployer
                    </label>
                    <select
                      id="corps-intervention-select"
                      value={selectedService}
                      onChange={(e) => {
                        const newService = e.target.value;
                        setSelectedService(newService);
                        try {
                          localStorage.setItem('mbeund_mi_assigned_service', newService);
                        } catch {}
                      }}
                      className="w-full text-xs font-bold rounded-xl border border-navy-200 dark:border-navy-700 bg-navy-50/50 dark:bg-navy-900 px-3 py-2 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B2545] cursor-pointer"
                    >
                      {SERVICES_INTERVENTION.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleDepecherIntervention}
                      className="w-full px-3 py-2 rounded-xl text-xs font-black bg-[#CC131A] hover:bg-red-700 text-white transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Flame size={14} />
                      <span>Dépêcher Secours</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate('/autorite/carte')}
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-navy-900 border border-navy-200 dark:border-navy-700 hover:bg-navy-50 dark:hover:bg-navy-800 text-navy-800 dark:text-white transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <MapPin size={13} className="text-navy-600 dark:text-navy-300" />
                      <span>Voir carte</span>
                    </button>
                  </div>

                  {filteredDeployedEntries.length > 0 && (
                    <div className="pt-2 flex items-center justify-between text-[11px] text-navy-500 dark:text-navy-400 border-t border-navy-100 dark:border-navy-800">
                      <span className="flex items-center gap-1 text-navy-700 dark:text-navy-200 font-bold">
                        <ShieldCheck size={13} className="text-emerald-600" />
                        {filteredDeployedEntries.length} mission(s) déployée(s)
                      </span>
                      <button
                        type="button"
                        onClick={handleResetDeployments}
                        className="text-[10px] text-navy-400 hover:text-navy-700 underline cursor-pointer"
                      >
                        Réinitialiser
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-between bg-white dark:bg-[#071322] border border-navy-200 dark:border-navy-800 rounded-2xl p-5 shadow-xs">
                <div>
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-navy-100 dark:border-navy-800">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-navy-50 dark:bg-navy-900 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-navy-100 dark:border-navy-800">
                        <ShieldCheck size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-navy-900 dark:text-white">
                          Urgences citoyennes couvertes
                        </h3>
                        <p className="text-[11px] text-navy-500 dark:text-navy-400">
                          {filteredDeployedEntries.length} intervention(s) en cours sur le terrain
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-navy-50 dark:bg-navy-900 text-navy-700 dark:text-navy-200 border border-navy-200 dark:border-navy-800">
                      100% Déployé
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-2 max-h-44 overflow-y-auto">
                    {filteredDeployedEntries.map(([postId, dep]) => (
                      <div
                        key={postId}
                        className="p-2.5 rounded-xl border border-navy-100 dark:border-navy-800 bg-navy-50/50 dark:bg-navy-800/40 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-navy-900 dark:text-white truncate block">
                            {dep.quartier}
                          </span>
                          <span className="text-[11px] text-navy-500 dark:text-navy-400">
                            {dep.serviceLabel.split(' ')[0]} · Déployé à {dep.heure}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-200">
                          En cours ✓
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-navy-50 dark:border-navy-800 flex items-center justify-between gap-2 mt-3">
                  <button
                    type="button"
                    onClick={handleResetDeployments}
                    className="text-xs font-bold text-navy-500 hover:text-[#CC131A] dark:hover:text-red-400 underline cursor-pointer"
                  >
                    Rappeler les équipes
                  </button>
                  <Link
                    to="/autorite/signalements"
                    className="text-xs font-bold text-navy-800 dark:text-navy-100 hover:text-[#CC131A] dark:hover:text-red-400 flex items-center gap-1"
                  >
                    <span>Toutes les observations →</span>
                  </Link>
                </div>
                <label htmlFor="corps-intervention-select" className="sr-only">
                  Corps d&apos;intervention
                </label>
              </div>
            )}
          </div>
        </div>

        {/* NIVEAU 2 : MODÈLE PRÉDICTIF HYDROLOGIQUE & SATELLITE DYNAMIQUE (GAUCHE) & DERNIÈRES ALERTES DIFFUSÉES (DROITE) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* HYDRO-BAROMÈTRE IA & VUE SATELLITE SYNCHRONISÉE AU SECTEUR SÉLECTIONNÉ */}
          <div className="lg:col-span-7 bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-navy-100 dark:border-navy-800">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-[#0B2545] dark:text-navy-200" />
                <h2 className="text-base font-extrabold text-navy-900 dark:text-white">
                  Modèle prédictif hydrologique
                </h2>
              </div>
              <span className="text-xs font-bold text-navy-500 dark:text-navy-400">
                Secteur analysé : <strong className="text-navy-900 dark:text-white">{focusedZone?.quartier || 'Thiaroye Gare'}</strong>
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch flex-1">
              {/* Jauge hydro-météo normalisée pour toujours afficher le bon pourcentage */}
              <div className="flex flex-col justify-center">
                <GaugeRisk
                  zone={normalizeZoneForGauge(focusedZone)}
                  prediction={zonePrediction}
                  onExploreMap={() => navigate('/autorite/carte')}
                />
              </div>

              {/* Vignette cartographique satellite live synchronisée au secteur */}
              <div className="relative rounded-3xl overflow-hidden border border-navy-200 dark:border-navy-700 shadow-sm group flex flex-col justify-between p-4 min-h-[280px]">
                <img
                  src="/images/hero-littoral-thiaroye.jpg"
                  alt="Vue satellite Thiaroye"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/60 to-navy-950/20" />

                {/* Badge en-tête satellite */}
                <div className="relative z-10 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 text-white backdrop-blur-xs border border-white/20">
                    <Compass size={12} className="text-white/80 animate-spin" style={{ animationDuration: '12s' }} />
                    <span>SIG Satellite</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-black/70 text-white border border-white/20 backdrop-blur-xs">
                    {focusedZone?.niveau_risque === 'rouge'
                      ? 'Cuvette Critique'
                      : focusedZone?.niveau_risque === 'orange'
                      ? 'Vigilance Active'
                      : 'Zone Stable'}
                  </span>
                </div>

                {/* Réticule radar centré */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-24 h-24 rounded-full border border-white/30 animate-ping" />
                  <div
                    className="w-16 h-16 rounded-full border border-dashed border-white/60 animate-spin"
                    style={{ animationDuration: '8s' }}
                  />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#CC131A] border-2 border-white shadow-lg" />
                </div>

                {/* Télémétrie altimétrique dynamique & bouton d'exploration */}
                <div className="relative z-10 bg-black/80 backdrop-blur-md rounded-xl p-3 border border-white/10 text-white mt-auto">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold truncate text-white">
                      {focusedZone?.quartier || 'Cuvette Ouest'}
                    </span>
                    <span className="text-[10px] text-slate-300 font-mono font-bold">
                      {focusedZone?.coords || '14.758° N · 17.384° W'}
                    </span>
                  </div>
                  <p className="text-[11px] text-navy-200 mt-1 leading-snug">
                    {focusedZone?.altitude || 'Alt. +1.8m · Dépression basse sensible aux crues'} · {focusedZone?.sonde || 'Sonde TH-01'}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/autorite/carte')}
                    className="mt-2.5 w-full py-1.5 px-3 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-white text-[11px] font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <MapPin size={12} />
                    <span>Ouvrir sur la carte SIG</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* DERNIÈRES ALERTES DIFFUSÉES AUX CITOYENS */}
          <div className="lg:col-span-5 bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-navy-100 dark:border-navy-800">
                <div>
                  <h2 className="text-base font-extrabold text-navy-900 dark:text-white">
                    Dernières alertes diffusées
                  </h2>
                  <p className="text-[11px] text-navy-500 dark:text-navy-400">
                    Diffusion WebSocket temps réel vers l&apos;accueil Citoyen
                  </p>
                </div>
                <Link to="/autorite/crise" className="text-xs font-bold text-navy-600 dark:text-navy-300 hover:text-[#CC131A] hover:underline">
                  Gérer crises
                </Link>
              </div>

              <div className="mt-4">
                {recentAlertes.length === 0 ? (
                  <p className="text-xs text-navy-400 py-6 text-center">Aucune alerte récente.</p>
                ) : (
                  <div className="space-y-3">
                    {recentAlertes.map((a) => (
                      <div
                        key={a.id}
                        className="p-3 rounded-xl bg-navy-50/50 dark:bg-navy-900/50 border border-navy-100 dark:border-navy-800/80 flex items-start gap-2.5"
                      >
                        <RiskBadge niveau={a.niveau} className="mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black text-navy-900 dark:text-white truncate">
                              {a.zone?.quartier || 'Thiaroye-sur-Mer'}
                            </span>
                            <span className="text-[10px] font-semibold text-navy-500 dark:text-navy-400 flex items-center gap-0.5 flex-shrink-0">
                              <CheckCircle2 size={10} />
                              Diffusé
                            </span>
                          </div>
                          <p className="text-xs text-navy-600 dark:text-navy-300 line-clamp-2 mt-0.5 leading-snug">
                            {a.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-navy-100 dark:border-navy-800 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-navy-400">
                Canal SMS / Web / Push actif
              </span>
              <Link
                to="/autorite/crise"
                className="text-xs font-bold text-navy-700 dark:text-navy-200 hover:text-[#CC131A] dark:hover:text-red-400 inline-flex items-center gap-1"
              >
                <span>Centre de diffusion</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* NIVEAU 3 : FILE DE VALIDATION & DÉPÊCHEMENT DES SIGNALEMENTS CITOYENS (CONNECTÉ À L'API & FILTRÉ PAR CORPS) */}
        <div className="bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-navy-100 dark:border-navy-800 gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Activity size={18} className="text-[#0B2545] dark:text-navy-200" />
                <h2 className="text-base font-extrabold text-navy-900 dark:text-white">
                  Signalements citoyens à valider
                </h2>
                {commandView !== 'all' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-200">
                    Filtre : {activeServiceObj.short}
                  </span>
                )}
              </div>
              <p className="text-xs text-navy-500 dark:text-navy-400 mt-0.5">
                {filteredSignalementsEnAttente.length} observation(s) transmise(s) par les riverains en attente de certification officielle
              </p>
            </div>
            <div className="flex items-center gap-3 self-start sm:self-center">
              {commandView !== 'all' && (
                <button
                  type="button"
                  onClick={() => handleSelectCommandView('all')}
                  className="text-xs font-bold text-navy-600 dark:text-navy-300 hover:underline cursor-pointer"
                >
                  Réinitialiser filtre ({signalementsEnAttente.length})
                </button>
              )}
              <Link
                to="/autorite/signalements"
                className="text-xs font-bold text-navy-600 dark:text-navy-300 hover:text-[#CC131A] dark:hover:text-red-400 flex items-center gap-1"
              >
                <span>Gérer tous les signalements</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          <div className="mt-4">
            {filteredSignalementsEnAttente.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 size={28} className="mx-auto text-navy-400 mb-1.5" />
                <p className="text-sm font-bold text-navy-700 dark:text-navy-200">
                  {commandView === 'all'
                    ? 'Tous les signalements citoyens ont été modérés'
                    : `Aucun signalement en attente pour ${activeServiceObj.short}`}
                </p>
                <p className="text-xs text-navy-400 mt-0.5">
                  Aucune observation en attente sur ce canal · Synchronisation citoyenne à jour
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredSignalementsEnAttente.slice(0, 3).map((f, idx) => {
                  const photoUrl = f.properties.photo || SIGNALEMENT_PHOTOS[idx % SIGNALEMENT_PHOTOS.length];
                  const isVerifiedCitizen = Boolean(
                    f.properties.citoyen_prenom || f.properties.citoyen_nom || f.properties.citoyen_telephone
                  );
                  return (
                    <div
                      key={f.id}
                      className="p-3.5 border border-navy-100 dark:border-navy-800 rounded-xl flex flex-col justify-between gap-3 bg-navy-50/30 dark:bg-navy-900/50 hover:border-navy-300 dark:hover:border-navy-700 transition shadow-2xs"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          onClick={() =>
                            setInspectedSignalement({
                              titre: f.properties.categorie || 'Observation citoyenne',
                              description: f.properties.description,
                              quartier: f.properties.quartier || focusedZone?.quartier || 'Thiaroye-sur-Mer',
                              photo: photoUrl,
                            })
                          }
                          className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-navy-200 dark:border-navy-700 shadow-2xs cursor-pointer group"
                          title="Inspecter la photo"
                        >
                          <img
                            src={photoUrl}
                            alt={f.properties.description}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5 flex-wrap">
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-200 truncate">
                              {f.properties.categorie}
                            </span>
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                isVerifiedCitizen
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                              }`}
                            >
                              {isVerifiedCitizen ? 'Vérifié OTP ✓' : 'Anonyme · IA'}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-navy-900 dark:text-white line-clamp-2 mt-1 leading-snug">
                            {f.properties.description}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-navy-100 dark:border-navy-800 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-navy-500 dark:text-navy-400 truncate">
                          Unité : {activeServiceObj.short}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCertifierEtDepecher(f, idx)}
                            disabled={validerMutation.isPending}
                            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition cursor-pointer"
                            title="Valider et notifier le citoyen"
                          >
                            <Check size={13} />
                            <span>Valider</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── MODALE D'INSPECTION PHOTO TERRAIN HD ── */}
        {inspectedSignalement && (
          <div
            onClick={() => setInspectedSignalement(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="relative h-56 w-full">
                <img
                  src={inspectedSignalement.photo}
                  alt={inspectedSignalement.titre}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setInspectedSignalement(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#CC131A]">
                  <MapPin size={13} />
                  <span>{inspectedSignalement.quartier}</span>
                </div>
                <h3 className="text-base font-black text-navy-900 dark:text-white">
                  {inspectedSignalement.titre}
                </h3>
                <p className="text-xs text-navy-600 dark:text-navy-300 leading-relaxed">
                  {inspectedSignalement.description}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AutoriteShell>
  );
}

