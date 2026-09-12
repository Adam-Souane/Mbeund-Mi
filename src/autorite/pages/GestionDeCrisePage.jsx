import { useState } from 'react';
import { Send, CheckCircle2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import AutoriteShell from '../desktop/AutoriteShell';
import RiskBadge from '../../shared/components/RiskBadge';
import { useZones } from '../../shared/hooks/useZones';
import { useAlertesListe, useCreateAlerte, useUpdateAlerteStatut } from '../../shared/hooks/useAlertes';
import { flattenApiErrors } from '../../shared/utils/apiErrors';

const NIVEAUX = [
  { value: 'vert', label: 'Vert' },
  { value: 'jaune', label: 'Jaune' },
  { value: 'orange', label: 'Orange' },
  { value: 'rouge', label: 'Rouge' },
];

const STATUT_LABELS = {
  en_attente: 'En attente',
  envoyee: 'Envoyée',
  resolue: 'Résolue',
};

// Machine à états exacte de l'action `statut` côté backend
// (AlerteViewSet.statut) : en_attente -> envoyee -> resolue, jamais en arrière.
const NEXT_STATUT = { en_attente: 'envoyee', envoyee: 'resolue' };
const NEXT_LABEL = { en_attente: 'Envoyer', envoyee: 'Marquer résolue' };

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function NouvelleAlerteForm() {
  const { data: zonesData } = useZones();
  const zones = zonesData?.features?.map((f) => ({ id: f.id, ...f.properties })) ?? [];

  const [zoneId, setZoneId] = useState('');
  const [niveau, setNiveau] = useState('jaune');
  const [message, setMessage] = useState('');
  const [canaux, setCanaux] = useState('sms,push');

  const mutation = useCreateAlerte();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!zoneId) return;
    mutation.mutate(
      {
        zone: Number(zoneId),
        niveau,
        message,
        canaux,
        timestamp: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          setMessage('');
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5 flex flex-col gap-3">
      <h3 className="text-sm font-bold flex items-center gap-2">
        <Plus size={15} />
        Émettre une nouvelle alerte
      </h3>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-xs font-semibold mb-1.5">Zone</span>
          <select
            required
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm"
          >
            <option value="">Sélectionner…</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.quartier}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-xs font-semibold mb-1.5">Niveau</span>
          <select
            value={niveau}
            onChange={(e) => setNiveau(e.target.value)}
            className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm"
          >
            {NIVEAUX.map((n) => (
              <option key={n.value} value={n.value}>
                {n.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="block text-xs font-semibold mb-1.5">Message</span>
        <textarea
          rows={2}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ex : Montée d'eau rapide signalée, niveau rouge."
          className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm"
        />
      </label>

      <label className="block">
        <span className="block text-xs font-semibold mb-1.5">Canaux</span>
        <input
          type="text"
          value={canaux}
          onChange={(e) => setCanaux(e.target.value)}
          placeholder="sms,push"
          className="w-full px-3 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm"
        />
      </label>

      {mutation.isError && (
        <div className="text-xs text-red">
          {flattenApiErrors(mutation.error).map((msg, i) => (
            <p key={i}>{msg}</p>
          ))}
        </div>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="self-start flex items-center gap-2 bg-red text-white font-bold text-xs px-4 py-2.5 rounded-md disabled:opacity-60"
      >
        <Send size={14} />
        {mutation.isPending ? 'Envoi…' : "Émettre l'alerte"}
      </button>
    </form>
  );
}

function AlerteRow({ alerte }) {
  const mutation = useUpdateAlerteStatut();
  const next = NEXT_STATUT[alerte.statut];

  return (
    <div className="flex items-start gap-3 p-4 border border-navy-50 dark:border-navy-800 rounded-lg">
      <RiskBadge niveau={alerte.niveau} className="mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold truncate">{alerte.zone?.quartier}</span>
          <span className="text-[11px] text-navy-400 flex-shrink-0">{formatDateTime(alerte.timestamp)}</span>
        </div>
        <p className="text-xs text-navy-600 dark:text-navy-200 mt-0.5">{alerte.message}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px] font-bold uppercase text-navy-400">{STATUT_LABELS[alerte.statut] ?? alerte.statut}</span>
          {next && (
            <button
              onClick={() => mutation.mutate({ id: alerte.id, statut: next })}
              disabled={mutation.isPending}
              className="flex items-center gap-1.5 text-xs font-bold text-red disabled:opacity-60"
            >
              <CheckCircle2 size={13} />
              {NEXT_LABEL[alerte.statut]}
            </button>
          )}
        </div>
        {mutation.isError && (
          <p className="text-[11px] text-red mt-1">{flattenApiErrors(mutation.error)[0]}</p>
        )}
      </div>
    </div>
  );
}

export default function GestionDeCrisePage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAlertesListe(page);
  const alertes = data?.results ?? [];

  return (
    <AutoriteShell>
      <div>
        <h1 className="text-2xl font-extrabold">Gestion de crise</h1>
        <p className="text-sm text-navy-600 dark:text-navy-200 mt-0.5">
          Cycle de vie des alertes · en attente → envoyée → résolue
        </p>
      </div>

      <NouvelleAlerteForm />

      <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5 flex flex-col gap-3">
        <h3 className="text-sm font-bold">Toutes les alertes · {data?.count ?? 0}</h3>
        {isLoading ? (
          <p className="text-xs text-navy-400">Chargement…</p>
        ) : alertes.length === 0 ? (
          <p className="text-xs text-navy-400">Aucune alerte pour l’instant.</p>
        ) : (
          alertes.map((a) => <AlerteRow key={a.id} alerte={a} />)
        )}
      </div>

      {(data?.next || data?.previous) && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!data?.previous}
            className="flex items-center gap-1 text-xs font-bold text-navy-600 dark:text-navy-200 disabled:opacity-40"
          >
            <ChevronLeft size={14} />
            Précédent
          </button>
          <span className="text-xs text-navy-400">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!data?.next}
            className="flex items-center gap-1 text-xs font-bold text-navy-600 dark:text-navy-200 disabled:opacity-40"
          >
            Suivant
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </AutoriteShell>
  );
}
