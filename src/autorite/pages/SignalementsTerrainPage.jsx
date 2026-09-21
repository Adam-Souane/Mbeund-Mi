import { useState } from 'react';
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, ImageOff, Droplets, Copy, User, Phone, MapPin } from 'lucide-react';
import AutoriteShell from '../desktop/AutoriteShell';
import { useSignalements, useValiderSignalement } from '../../shared/hooks/useSignalements';
import { flattenApiErrors } from '../../shared/utils/apiErrors';

const FILTERS = [
  { value: 'attente', label: 'En attente' },
  { value: 'valides', label: 'Validés' },
  { value: 'tous', label: 'Tous' },
];

const CATEGORIE_LABELS = {
  egouts: 'Égouts',
  inondation: 'Inondation',
  autre: 'Autre',
};

// Analyse heuristique côté serveur (pas un modèle entraîné) sur la photo du
// signalement — voir backend/api/services/vision_service.py.
const NIVEAU_EAU_INFO = {
  eleve: { label: 'Eau élevée', bg: 'bg-red-50 dark:bg-red/15', text: 'text-red' },
  modere: { label: 'Eau modérée', bg: 'bg-risk-orange/15', text: 'text-risk-orange' },
  faible: { label: 'Eau faible', bg: 'bg-risk-vert/15', text: 'text-risk-vert' },
};

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function SignalementCard({ feature }) {
  const { properties } = feature;
  const mutation = useValiderSignalement();

  return (
    <div className="flex gap-3 p-4 border border-navy-50 dark:border-navy-800 rounded-lg">
      {properties.photo ? (
        <img src={properties.photo} alt="" className="w-20 h-20 rounded-md object-cover flex-shrink-0" />
      ) : (
        <div className="w-20 h-20 rounded-md bg-navy-50 dark:bg-navy-800 flex items-center justify-center flex-shrink-0 text-navy-400">
          <ImageOff size={20} />
        </div>
      )}

      <div className="min-w-0 flex-1 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-pill bg-navy-50 dark:bg-navy-800 flex-shrink-0">
            {CATEGORIE_LABELS[properties.categorie] ?? properties.categorie}
          </span>
          <span className="text-xs text-navy-400 flex-shrink-0">{formatDateTime(properties.date_creation)}</span>
        </div>

        {/* Infos du citoyen */}
        {(properties.citoyen_prenom || properties.citoyen_telephone || properties.citoyen_quartier) && (
          <div className="bg-navy-50 dark:bg-navy-800/50 rounded-lg p-2.5 space-y-1">
            <div className="text-xs font-semibold text-navy-600 dark:text-navy-300 mb-1.5">Signaleur</div>
            {(properties.citoyen_prenom || properties.citoyen_nom) && (
              <div className="flex items-center gap-1.5 text-xs text-navy-700 dark:text-navy-200">
                <User size={13} className="flex-shrink-0" />
                <span>{properties.citoyen_prenom} {properties.citoyen_nom}</span>
              </div>
            )}
            {properties.citoyen_telephone && (
              <div className="flex items-center gap-1.5 text-xs text-navy-700 dark:text-navy-200">
                <Phone size={13} className="flex-shrink-0" />
                <span className="font-mono">{properties.citoyen_telephone}</span>
              </div>
            )}
            {properties.citoyen_quartier && (
              <div className="flex items-center gap-1.5 text-xs text-navy-700 dark:text-navy-200">
                <MapPin size={13} className="flex-shrink-0" />
                <span>{properties.citoyen_quartier}</span>
              </div>
            )}
          </div>
        )}

        <p className="text-base text-navy-600 dark:text-navy-200">{properties.description || 'Sans description.'}</p>

        {(NIVEAU_EAU_INFO[properties.niveau_eau_estime] || properties.signalement_similaire) && (
          <div className="flex items-center gap-2 flex-wrap">
            {NIVEAU_EAU_INFO[properties.niveau_eau_estime] && (
              <span
                className={`flex items-center gap-1 text-[11px] font-bold uppercase px-2.5 py-1 rounded-pill ${NIVEAU_EAU_INFO[properties.niveau_eau_estime].bg} ${NIVEAU_EAU_INFO[properties.niveau_eau_estime].text}`}
              >
                <Droplets size={11} />
                {NIVEAU_EAU_INFO[properties.niveau_eau_estime].label}
              </span>
            )}
            {properties.signalement_similaire && (
              <span className="flex items-center gap-1 text-[11px] font-bold uppercase px-2.5 py-1 rounded-pill bg-navy-50 dark:bg-navy-800 text-navy-400">
                <Copy size={11} />
                Doublon possible du #{properties.signalement_similaire}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 mt-1">
          <span
            className={`text-[11px] font-bold uppercase ${
              properties.valide ? 'text-risk-vert' : 'text-navy-400'
            }`}
          >
            {properties.valide ? 'Validé' : 'En attente de validation'}
          </span>

          <div className="flex-1" />

          {!properties.valide ? (
            <button
              onClick={() => mutation.mutate({ id: feature.id, valide: true })}
              disabled={mutation.isPending}
              className="flex items-center gap-1.5 text-sm font-bold text-white bg-risk-vert px-3 py-1.5 rounded-md disabled:opacity-60"
            >
              <CheckCircle2 size={13} />
              Valider
            </button>
          ) : (
            <button
              onClick={() => mutation.mutate({ id: feature.id, valide: false })}
              disabled={mutation.isPending}
              className="flex items-center gap-1.5 text-sm font-bold text-navy-600 dark:text-navy-200 border border-navy-200 dark:border-navy-800 px-3 py-1.5 rounded-md disabled:opacity-60"
            >
              <XCircle size={13} />
              Invalider
            </button>
          )}
        </div>

        {mutation.isError && (
          <p className="text-xs text-red mt-1">{flattenApiErrors(mutation.error)[0]}</p>
        )}
      </div>
    </div>
  );
}

export default function SignalementsTerrainPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('attente');
  const { data, isLoading } = useSignalements(page);

  const features = data?.results?.features ?? [];
  const filtered = features.filter((f) => {
    if (filter === 'attente') return !f.properties.valide;
    if (filter === 'valides') return f.properties.valide;
    return true;
  });

  return (
    <AutoriteShell>
      <div>
        <h1 className="text-3xl font-extrabold">Signalements terrain</h1>
        <p className="text-base text-navy-600 dark:text-navy-200 mt-0.5">
          Observations transmises par les riverains · {data?.count ?? 0} au total
        </p>
      </div>

      <div className="flex items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`text-sm font-bold px-3.5 py-2 rounded-md border-[1.5px] transition-colors ${
              filter === f.value
                ? 'bg-navy dark:bg-navy-800 text-white border-navy dark:border-navy-800'
                : 'border-navy-200 dark:border-navy-800 text-navy dark:text-navy-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5 flex flex-col gap-3">
        {isLoading ? (
          <p className="text-sm text-navy-400">Chargement…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-navy-400">Aucun signalement dans cette catégorie.</p>
        ) : (
          filtered.map((feature) => <SignalementCard key={feature.id} feature={feature} />)
        )}
      </div>

      {(data?.next || data?.previous) && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!data?.previous}
            className="flex items-center gap-1 text-sm font-bold text-navy-600 dark:text-navy-200 disabled:opacity-40"
          >
            <ChevronLeft size={14} />
            Précédent
          </button>
          <span className="text-sm text-navy-400">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!data?.next}
            className="flex items-center gap-1 text-sm font-bold text-navy-600 dark:text-navy-200 disabled:opacity-40"
          >
            Suivant
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </AutoriteShell>
  );
}
