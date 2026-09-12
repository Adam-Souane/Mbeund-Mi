import { Trash2, PhoneCall, ShieldAlert } from 'lucide-react';
import AutoriteShell from '../desktop/AutoriteShell';
import { useZones } from '../../shared/hooks/useZones';
import { useContactsAlerte, useDeleteContactAlerte } from '../../shared/hooks/useContactsAlerte';

const NUMEROS_URGENCE = [
  { label: 'Sapeurs-pompiers', numero: '18' },
  { label: 'Police secours', numero: '17' },
  { label: 'SAMU', numero: '1515' },
];

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ContactUrgencePage() {
  const { data: zonesData } = useZones();
  const { data, isLoading } = useContactsAlerte();
  const deleteContact = useDeleteContactAlerte();

  const zoneNameById = new Map((zonesData?.features ?? []).map((f) => [f.id, f.properties.quartier]));
  const contacts = data?.results ?? [];

  const handleDelete = (contact) => {
    if (window.confirm(`Retirer ${contact.telephone} du registre d'alerte SMS ?`)) {
      deleteContact.mutate(contact.id);
    }
  };

  return (
    <AutoriteShell>
      <div>
        <h1 className="text-3xl font-extrabold">Contact & urgence</h1>
        <p className="text-base text-navy-600 dark:text-navy-200 mt-0.5">
          Registre des contacts inscrits aux alertes SMS · {data?.count ?? 0} inscrit{(data?.count ?? 0) > 1 ? 's' : ''}
        </p>
      </div>

      <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5">
        <h3 className="text-base font-bold mb-3 flex items-center gap-2">
          <ShieldAlert size={15} />
          Numéros d’urgence
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {NUMEROS_URGENCE.map((n) => (
            <a
              key={n.numero}
              href={`tel:${n.numero}`}
              className="flex items-center justify-between gap-2 p-3.5 rounded-lg border border-navy-50 dark:border-navy-800 hover:bg-navy-50 dark:hover:bg-navy-800 transition-colors"
            >
              <span className="text-base font-semibold">{n.label}</span>
              <span className="flex items-center gap-1.5 text-red font-extrabold text-base">
                <PhoneCall size={14} />
                {n.numero}
              </span>
            </a>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5 flex flex-col gap-2">
        <h3 className="text-base font-bold mb-1">Registre des contacts SMS</h3>
        {isLoading ? (
          <p className="text-sm text-navy-400">Chargement…</p>
        ) : contacts.length === 0 ? (
          <p className="text-sm text-navy-400">Aucun contact inscrit pour l’instant.</p>
        ) : (
          contacts.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3 border border-navy-50 dark:border-navy-800 rounded-md">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold">{c.telephone}</span>
                  {!c.actif && <span className="text-[11px] font-bold uppercase text-navy-400">Inactif</span>}
                </div>
                <p className="text-sm text-navy-400 mt-0.5">
                  {c.nom || 'Sans nom'} · {zoneNameById.get(c.zone) ?? 'Zone inconnue'} · inscrit le {formatDate(c.date_inscription)}
                </p>
              </div>
              <button
                onClick={() => handleDelete(c)}
                disabled={deleteContact.isPending}
                className="p-2 rounded-md text-red hover:bg-red-50 dark:hover:bg-red/15 disabled:opacity-60 flex-shrink-0"
                aria-label="Retirer ce contact"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>
    </AutoriteShell>
  );
}
