import { useState, useMemo } from 'react';
import { CheckCircle2, XCircle, ImageOff, Droplets, Copy, User, Phone, MapPin, Flame, ThumbsUp } from 'lucide-react';
import AutoriteShell from '../desktop/AutoriteShell';
import { useSignalements, useValiderSignalement } from '../../shared/hooks/useSignalements';
import { flattenApiErrors } from '../../shared/utils/apiErrors';
import { getTopConfirmedPost } from '../../shared/data/riverainsData';
import EtatListe from '../../shared/components/EtatListe';
import Pagination from '../../shared/components/Pagination';

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
  const topConfirmedPost = useMemo(() => getTopConfirmedPost(), []);

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

      {/* Bannière Priorité Communautaire : Le plus confirmé par les riverains */}
      {topConfirmedPost && (
        <div className="bg-gradient-to-r from-red-50 via-amber-50 to-white dark:from-[#200e12] dark:via-[#1c1214] dark:to-[#071322] border-2 border-[#CC131A] dark:border-red-600 rounded-xl p-4 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#CC131A] text-white flex items-center justify-center flex-shrink-0 shadow-sm animate-pulse">
              <Flame size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-[#CC131A] dark:text-red-400">
                  Signalement Citoyen N°1 en Confirmations
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/80 text-[#CC131A] dark:text-red-300">
                  Priorité Haute
                </span>
              </div>
              <h4 className="text-sm font-bold text-navy-900 dark:text-white mt-0.5">
                {topConfirmedPost.titre} — {topConfirmedPost.auteur} ({topConfirmedPost.quartier})
              </h4>
              <p className="text-xs text-navy-600 dark:text-navy-300 line-clamp-1 mt-0.5">
                {topConfirmedPost.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-navy-800 border border-red-200 dark:border-red-900 flex-shrink-0 self-end md:self-auto shadow-xs">
            <ThumbsUp size={15} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-extrabold text-navy-900 dark:text-white">
              {topConfirmedPost.totalVotes} confirmations riveraines
            </span>
          </div>
        </div>
      )}

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
        <EtatListe chargement={isLoading} vide={filtered.length === 0} messageVide="Aucun signalement dans cette catégorie.">
          {filtered.map((feature) => <SignalementCard key={feature.id} feature={feature} />)}
        </EtatListe>
      </div>

      <Pagination page={page} data={data} setPage={setPage} />
    </AutoriteShell>
  );
}
