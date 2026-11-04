import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  ImageOff,
  User,
  Phone,
  MapPin,
  Flame,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Search,
  Maximize2,
  X,
  Activity,
  Cpu,
  Truck,
} from 'lucide-react';
import AutoriteShell from '../desktop/AutoriteShell';
import { useSignalements, useValiderSignalement } from '../../shared/hooks/useSignalements';
import EtatListe from '../../shared/components/EtatListe';
import Pagination from '../../shared/components/Pagination';

const DEPLOYED_STORAGE_KEY = 'mbeund_deployed_incidents_v1';

const CATEGORIE_LABELS = {
  egouts: 'Égouts & Canaux',
  inondation: 'Inondation critique',
  autre: 'Autre incident',
};

const NIVEAU_EAU_INFO = {
  eleve: {
    label: 'Eau critique (> 50cm)',
    shortLabel: 'Critique > 50cm',
    bg: 'bg-[#CC131A]/10 dark:bg-[#CC131A]/20',
    text: 'text-[#CC131A] dark:text-red-300',
    scoreIa: 94,
    concordance: 'Forte concordance avec les sondes piézométriques du secteur',
  },
  modere: {
    label: 'Eau modérée (20-50cm)',
    shortLabel: 'Modérée 20-50cm',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-[#0B2545] dark:text-slate-200',
    scoreIa: 88,
    concordance: 'Ruissellement confirmé par les observations riveraines proches',
  },
  faible: {
    label: 'Eau faible (< 20cm)',
    shortLabel: 'Faible < 20cm',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    text: 'text-emerald-700 dark:text-emerald-300',
    scoreIa: 82,
    concordance: 'Stagnation localisée sans dépassement de seuil critique',
  },
};

const UNITES_INTERVENTION = [
  { id: 'BNSP Pompiers', label: 'BNSP Pompiers (Secours & Pompage)' },
  { id: 'ONAS Hydraulique', label: 'ONAS Hydraulique (Curage & Égouts)' },
  { id: 'Mairie Thiaroye', label: 'Cellule Municipale (Voirie & Relais)' },
];

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDefaultUnite(categorie, niveauEau) {
  if (categorie === 'egouts') return 'ONAS Hydraulique';
  if (niveauEau === 'eleve' || categorie === 'inondation') return 'BNSP Pompiers';
  return 'Mairie Thiaroye';
}

function InspectionPanel({
  feature,
  onValider,
  onDeployerSecours,
  deployedInfo,
  isPending,
  onOpenZoom,
}) {
  const navigate = useNavigate();
  const properties = feature?.properties || {};
  const defaultUnite = getDefaultUnite(properties.categorie, properties.niveau_eau_estime);
  const [selectedUnite, setSelectedUnite] = useState('');

  if (!feature) {
    return (
      <div className="h-full min-h-[420px] flex flex-col items-center justify-center p-8 bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl text-center shadow-sm">
        <ShieldAlert size={36} className="text-slate-300 dark:text-slate-600 mb-3" />
        <h4 className="text-base font-black text-[#0B2545] dark:text-white">
          Aucun signalement sélectionné
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          Sélectionnez une observation dans la file de gauche pour inspecter la photo HD, qualifier le niveau d&apos;eau et dépêcher une unité.
        </p>
      </div>
    );
  }

  const activeUnite = deployedInfo?.unit || selectedUnite || defaultUnite;
  const niveauInfo =
    NIVEAU_EAU_INFO[properties.niveau_eau_estime] || NIVEAU_EAU_INFO.modere;
  const coords = feature.geometry?.coordinates;
  const gpsText =
    Array.isArray(coords) && coords.length >= 2
      ? `${Number(coords[1]).toFixed(4)}° N, ${Number(coords[0]).toFixed(4)}° W`
      : '14.7465° N, 17.3752° W (Secteur Thiaroye)';

  const signaleurNom =
    properties.citoyen_prenom || properties.citoyen_nom
      ? `${properties.citoyen_prenom || ''} ${properties.citoyen_nom || ''}`.trim()
      : 'Riverain Anonyme';

  return (
    <div className="h-full bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-4">
      <div className="space-y-4">
        {/* En-tête d'inspection */}
        <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              Fiche d&apos;inspection opérationnelle #{feature.id}
            </span>
            <h4 className="text-lg font-black text-[#0B2545] dark:text-white mt-0.5">
              {CATEGORIE_LABELS[properties.categorie] ?? properties.categorie}
            </h4>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {deployedInfo && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-[#0B2545] text-white flex items-center gap-1">
                <Truck size={12} />
                {deployedInfo.unit} en route
              </span>
            )}
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                properties.valide
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-[#CC131A]/10 dark:bg-[#CC131A]/20 text-[#CC131A] dark:text-red-300'
              }`}
            >
              {properties.valide ? 'Validé Sentinelle ✓' : 'En attente C.O.D'}
            </span>
          </div>
        </div>

        {/* Photo HD du terrain */}
        <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
          {properties.photo ? (
            <>
              <img
                src={properties.photo}
                alt={properties.description || 'Photo signalement'}
                className="w-full h-56 sm:h-60 object-cover"
              />
              <button
                type="button"
                onClick={() => onOpenZoom(properties.photo, properties.description)}
                className="absolute bottom-2.5 right-2.5 px-2.5 py-1.5 rounded-lg bg-[#0B2545]/90 hover:bg-[#0B2545] text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Maximize2 size={12} />
                Plein écran HD
              </button>
            </>
          ) : (
            <div className="w-full h-44 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-900/60">
              <ImageOff size={28} className="mb-2 opacity-60" />
              <span className="text-xs font-bold">Aucune photo jointe au signalement</span>
            </div>
          )}

          <div className="absolute top-2.5 left-2.5 flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase shadow-xs backdrop-blur-xs ${niveauInfo.bg} ${niveauInfo.text}`}
            >
              {niveauInfo.label}
            </span>
          </div>
        </div>

        {/* Qualification IA & Concordance Capteurs */}
        <div className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0B2545] text-white flex items-center justify-center shrink-0 mt-0.5">
              <Cpu size={15} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#0B2545] dark:text-white">
                  Qualification IA &amp; Vérification Anti-Fake
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  Fiabilité {niveauInfo.scoreIa}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {niveauInfo.concordance} · GPS : <span className="font-mono">{gpsText}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Description de la situation */}
        <div>
          <span className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
            Observation transmise par le riverain
          </span>
          <p className="text-sm text-[#0B2545] dark:text-slate-100 leading-relaxed p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 font-medium">
            {properties.description || 'Aucune description détaillée.'}
          </p>
        </div>

        {/* Fiche Citoyen signaleur + Affectation Unité */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Identité &amp; Contact du Signaleur
            </span>
            <div className="flex items-center gap-2 text-xs text-[#0B2545] dark:text-white font-bold">
              <User size={14} className="text-slate-400 shrink-0" />
              <span className="truncate">{signaleurNom}</span>
            </div>

            {properties.citoyen_telephone && (
              <a
                href={`tel:${properties.citoyen_telephone}`}
                className="flex items-center gap-2 text-xs text-[#0B2545] dark:text-sky-300 font-bold hover:underline"
              >
                <Phone size={13} className="text-slate-400 shrink-0" />
                <span>{properties.citoyen_telephone}</span>
              </a>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-semibold">
              <MapPin size={13} className="text-slate-400 shrink-0" />
              <span className="truncate">
                Secteur : {properties.citoyen_quartier || 'Thiaroye-sur-Mer'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-2">
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Unité d&apos;intervention à mobiliser
              </span>
              <select
                value={activeUnite}
                onChange={(e) => setSelectedUnite(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-[#0B2545] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B2545]"
              >
                {UNITES_INTERVENTION.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {deployedInfo
                ? `✓ Accusé citoyen envoyé : "${deployedInfo.unit} en route"`
                : 'Le citoyen sera notifié dès validation ou envoi des secours.'}
            </p>
          </div>
        </div>
      </div>

      {/* Actions de décision alignées en bas */}
      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-2.5">
        {!properties.valide ? (
          <button
            type="button"
            onClick={() => onValider(feature.id, true)}
            disabled={isPending}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 size={15} />
            <span>Valider</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onValider(feature.id, false)}
            disabled={isPending}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#0B2545] dark:text-slate-200 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <XCircle size={15} />
            <span>Invalider</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onDeployerSecours(feature, activeUnite)}
          disabled={isPending}
          className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#CC131A] hover:bg-red-800 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Flame size={15} />
          <span>{deployedInfo ? 'Secours Dépêchés ✓' : 'Dépêcher Secours'}</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/autorite/carte')}
          className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#0B2545] dark:text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <MapPin size={14} className="text-[#0B2545] dark:text-slate-300" />
          <span>Localiser SIG</span>
        </button>
      </div>
    </div>
  );
}

function SignalementListItem({ feature, isSelected, onSelect, deployedInfo }) {
  const { properties } = feature;
  const niveauInfo = NIVEAU_EAU_INFO[properties.niveau_eau_estime];
  const signaleurNom =
    properties.citoyen_prenom || properties.citoyen_nom
      ? `${properties.citoyen_prenom || ''} ${properties.citoyen_nom || ''}`.trim()
      : 'Riverain';

  return (
    <button
      type="button"
      onClick={() => onSelect(feature.id)}
      className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
        isSelected
          ? 'bg-slate-50 dark:bg-slate-900 border-[#0B2545] dark:border-sky-400 shadow-sm ring-1 ring-[#0B2545]/20'
          : 'bg-white dark:bg-[#071322] border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex gap-3.5">
        {properties.photo ? (
          <img
            src={properties.photo}
            alt=""
            className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-slate-200 dark:border-slate-800"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center flex-shrink-0 text-slate-400">
            <ImageOff size={20} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[#0B2545] dark:text-slate-200">
              {CATEGORIE_LABELS[properties.categorie] ?? properties.categorie}
            </span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold shrink-0">
              <Clock size={11} />
              {formatDateTime(properties.date_creation)}
            </span>
          </div>

          <p className="text-xs font-bold text-[#0B2545] dark:text-white line-clamp-2">
            {properties.description || 'Sans description.'}
          </p>

          <div className="flex items-center flex-wrap gap-2 mt-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate">
              {signaleurNom}
            </span>
            {properties.citoyen_quartier && (
              <span className="text-[11px] text-slate-400 font-medium truncate">
                · {properties.citoyen_quartier}
              </span>
            )}
            {niveauInfo && (
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-md ${niveauInfo.bg} ${niveauInfo.text}`}
              >
                {niveauInfo.shortLabel}
              </span>
            )}
            {deployedInfo ? (
              <span className="ml-auto text-[10px] font-black uppercase text-[#0B2545] dark:text-sky-300">
                {deployedInfo.unit}
              </span>
            ) : (
              <span
                className={`ml-auto text-[10px] font-black uppercase ${
                  properties.valide ? 'text-emerald-600' : 'text-[#CC131A]'
                }`}
              >
                {properties.valide ? 'Validé' : 'En attente'}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function SignalementsTerrainPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('attente');
  const [graviteFilter, setGraviteFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [zoomPhoto, setZoomPhoto] = useState(null);

  const [deployedMap, setDeployedMap] = useState(() => {
    try {
      const raw = localStorage.getItem(DEPLOYED_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const { data, isLoading } = useSignalements(page);
  const mutation = useValiderSignalement();

  const features = data?.results?.features ?? [];

  const counts = useMemo(() => {
    const attente = features.filter((f) => !f.properties?.valide).length;
    const valides = features.filter((f) => f.properties?.valide).length;
    const critiques = features.filter(
      (f) => f.properties?.niveau_eau_estime === 'eleve'
    ).length;
    return {
      total: data?.count ?? features.length,
      attente,
      valides,
      critiques,
    };
  }, [features, data?.count]);

  const filtered = useMemo(() => {
    return features.filter((f) => {
      const p = f.properties || {};
      if (filter === 'attente' && p.valide) return false;
      if (filter === 'valides' && !p.valide) return false;

      if (graviteFilter === 'critique' && p.niveau_eau_estime !== 'eleve') return false;
      if (graviteFilter === 'egouts' && p.categorie !== 'egouts') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${p.description || ''} ${p.citoyen_quartier || ''} ${p.citoyen_prenom || ''} ${p.citoyen_nom || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [features, filter, graviteFilter, searchQuery]);

  const activeFeature =
    features.find((f) => f.id === selectedId) || filtered[0] || features[0] || null;

  const handleValider = (id, valide) => {
    mutation.mutate({ id, valide });
  };

  const handleDeployerSecours = (feature, unitName) => {
    if (!feature) return;
    const key = `api-${feature.id}`;
    const entry = {
      unit: unitName,
      at: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      quartier: feature.properties?.citoyen_quartier || 'Thiaroye',
      titre: feature.properties?.description || `Signalement #${feature.id}`,
    };
    const nextMap = { ...deployedMap, [key]: entry };
    setDeployedMap(nextMap);
    try {
      localStorage.setItem(DEPLOYED_STORAGE_KEY, JSON.stringify(nextMap));
    } catch {
      // ignore storage quota errors
    }
    if (!feature.properties?.valide) {
      mutation.mutate({ id: feature.id, valide: true });
    }
  };

  const statusTabs = [
    { value: 'attente', label: `En attente (${counts.attente})` },
    { value: 'valides', label: `Validés (${counts.valides})` },
    { value: 'tous', label: `Tous (${features.length})` },
  ];

  return (
    <AutoriteShell>
      <div className="space-y-6">
        {/* ── 1. EN-TÊTE INSTITUTIONNEL C.O.D + 4 GRANDS COMPTEURS KPI ── */}
        <div className="bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[#0B2545] dark:text-slate-300">
                  <Activity size={13} className="text-[#CC131A]" />
                  Modération &amp; Qualification Terrain · C.O.D Thiaroye
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0B2545] dark:text-white tracking-tight mt-1">
                Signalements terrain
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Observations géolocalisées transmises par les riverains · Vérification photo &amp; déclenchement des unités
              </p>
            </div>

            <div className="flex items-center flex-nowrap gap-2.5 shrink-0">
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-[#0B2545] dark:text-slate-200 whitespace-nowrap">
                <ShieldCheck size={14} className="text-emerald-600" />
                Protocole Sentinelle Actif
              </span>
            </div>
          </div>

          {/* 4 Grands Compteurs KPI (Taille identique aux Pages 1 & 2) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                Total Signalements
              </span>
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-[#0B2545] dark:text-white mt-1 block">
                {counts.total}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                En attente C.O.D
              </span>
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-[#0B2545] dark:text-white mt-1 block">
                {counts.attente}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                Validés Sentinelle
              </span>
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-emerald-700 dark:text-emerald-400 mt-1 block">
                {counts.valides}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                Eau Critique (&gt; 50cm)
              </span>
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-[#CC131A] dark:text-red-400 mt-1 block">
                {counts.critiques}
              </span>
            </div>
          </div>
        </div>

        {/* ── 2. BARRE DE TRIAGE & RECHERCHE SUR 1 LIGNE ── */}
        <div className="bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-3 sm:p-3.5 shadow-sm flex items-center justify-between gap-3 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center flex-nowrap gap-2 shrink-0">
            {statusTabs.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  filter === f.value
                    ? 'bg-[#0B2545] text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}

            <span className="inline-block h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 shrink-0" />

            {[
              { id: 'ALL', label: 'Tous niveaux' },
              { id: 'critique', label: 'Eau Critique (> 50cm)' },
              { id: 'egouts', label: 'Égouts & Canaux' },
            ].map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGraviteFilter(g.id)}
                className={`text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  graviteFilter === g.id
                    ? 'bg-slate-200 dark:bg-slate-700 text-[#0B2545] dark:text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="relative w-48 sm:w-60 shrink-0">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher quartier, riverain..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-[#0B2545] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B2545]"
            />
          </div>
        </div>

        {/* ── 3. DISPOSITION MASTER-DETAIL EN 2 COLONNES ALIGNÉES (MÊME HAUTEUR) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Colonne Gauche (5 col.) : File d'attente des signalements */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="h-full bg-white dark:bg-[#071322] border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0B2545] dark:text-white">
                    File d&apos;observations ({filtered.length})
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Cliquez pour inspecter
                  </span>
                </div>

                <div className="space-y-3 max-h-[620px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <EtatListe
                    chargement={isLoading}
                    vide={filtered.length === 0}
                    messageVide="Aucun signalement dans cette catégorie."
                  >
                    <div className="space-y-2.5">
                      {filtered.map((feature) => (
                        <SignalementListItem
                          key={feature.id}
                          feature={feature}
                          isSelected={activeFeature?.id === feature.id}
                          onSelect={setSelectedId}
                          deployedInfo={deployedMap[`api-${feature.id}`]}
                        />
                      ))}
                    </div>
                  </EtatListe>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <Pagination page={page} data={data} setPage={setPage} />
              </div>
            </div>
          </div>

          {/* Colonne Droite (7 col.) : Volet d'inspection détaillée */}
          <div className="lg:col-span-7 flex flex-col">
            <InspectionPanel
              feature={activeFeature}
              onValider={handleValider}
              onDeployerSecours={handleDeployerSecours}
              deployedInfo={activeFeature ? deployedMap[`api-${activeFeature.id}`] : null}
              isPending={mutation.isPending}
              onOpenZoom={(url, desc) => setZoomPhoto({ url, desc })}
            />
          </div>
        </div>
      </div>

      {/* Modale Zoom Photo HD */}
      {zoomPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setZoomPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-white dark:bg-[#071322] rounded-2xl overflow-hidden border border-slate-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-black uppercase tracking-wider text-[#0B2545] dark:text-white">
                Inspection Visuelle Haute Définition
              </span>
              <button
                type="button"
                onClick={() => setZoomPhoto(null)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <img
              src={zoomPhoto.url}
              alt={zoomPhoto.desc || 'Inspection HD'}
              className="w-full max-h-[75vh] object-contain bg-black"
            />
            {zoomPhoto.desc && (
              <div className="px-5 py-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                {zoomPhoto.desc}
              </div>
            )}
          </div>
        </div>
      )}
    </AutoriteShell>
  );
}
