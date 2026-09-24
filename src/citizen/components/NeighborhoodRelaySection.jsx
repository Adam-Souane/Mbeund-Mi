import { memo, useCallback, useMemo } from 'react';
import { Users2, Loader2, CheckCircle2 } from 'lucide-react';
import { useZones } from '../../shared/hooks/useZones';
import { flattenApiErrors } from '../../shared/utils/apiErrors';

function NeighborhoodRelaySectionComponent({ monRelais, relaisZone, setRelaisZone, createRelais, deleteRelais }) {
  const { data: zonesData } = useZones();

  const zones = useMemo(
    () => zonesData?.features?.map((f) => ({ id: f.id, quartier: f.properties.quartier })) ?? [],
    [zonesData]
  );

  const handleZoneChange = useCallback((e) => setRelaisZone(e.target.value), [setRelaisZone]);
  const handleDevenirRelais = useCallback(() => createRelais.mutate({ zone: relaisZone }), [relaisZone, createRelais]);

  return (
    <div className="lg:col-span-2 bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <Users2 size={16} className="text-red" />
        <h3 className="text-sm font-bold">Relais de quartier</h3>
      </div>
      <p className="text-xs text-navy-600 dark:text-navy-200 mb-4">
        Devenez volontaire pour être notifié en priorité lors d'une alerte et aider les foyers vulnérables à évacuer.
      </p>

      {monRelais ? (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-semibold">
              Inscrit·e pour {zones.find((z) => z.id === monRelais.zone)?.quartier ?? 'votre quartier'}
            </p>
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold mt-1 ${monRelais.verifie ? 'text-risk-vert' : 'text-navy-400'}`}>
              {monRelais.verifie ? <CheckCircle2 size={13} /> : null}
              {monRelais.verifie ? 'Vérifié par une autorité' : 'En attente de vérification'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => deleteRelais.mutate(monRelais.id)}
            disabled={deleteRelais.isPending}
            className="text-xs font-bold text-red border-[1.5px] border-red rounded-md px-3.5 py-2 disabled:opacity-60"
          >
            Se désinscrire
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          <select value={relaisZone} onChange={handleZoneChange} className="px-3.5 py-2.5 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy text-sm">
            <option value="">Choisir un quartier</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{z.quartier}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleDevenirRelais}
            disabled={!relaisZone || createRelais.isPending}
            className="flex items-center gap-1.5 bg-navy dark:bg-navy-800 text-white font-bold text-sm px-4 py-2.5 rounded-md disabled:opacity-60"
          >
            {createRelais.isPending && <Loader2 size={14} className="animate-spin" />}
            Devenir relais de quartier
          </button>
        </div>
      )}

      {createRelais.isError && (
        <div className="mt-3 px-3 py-2.5 rounded-md bg-red-50 dark:bg-red/15 text-red-900 dark:text-red-200 text-xs space-y-1">
          {flattenApiErrors(createRelais.error).map((msg, i) => (
            <p key={i}>{msg}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export const NeighborhoodRelaySection = memo(NeighborhoodRelaySectionComponent);
