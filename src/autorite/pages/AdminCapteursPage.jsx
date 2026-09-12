import { Gauge, Droplet, CloudRain } from 'lucide-react';
import AutoriteShell from '../desktop/AutoriteShell';
import { useCapteurs, useUpdateCapteur } from '../../shared/hooks/useCapteurs';
import { useZones } from '../../shared/hooks/useZones';
import { useMesuresRecentes } from '../../shared/hooks/useMesuresRecentes';

const STATUTS = [
  { value: 'actif', label: 'Actif' },
  { value: 'inactif', label: 'Inactif' },
  { value: 'maintenance', label: 'En maintenance' },
];

const TYPE_LABELS = { eau: 'Capteur eau', pluviometre: 'Pluviomètre' };

const STATUT_DOT = {
  actif: 'bg-risk-vert',
  inactif: 'bg-navy-400',
  maintenance: 'bg-risk-orange',
};

function formatDateTime(iso) {
  if (!iso) return 'Jamais';
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function AdminCapteursPage() {
  const { data: capteursData, isLoading } = useCapteurs();
  const { data: zonesData } = useZones();
  const { data: mesuresRecentes } = useMesuresRecentes();
  const updateCapteur = useUpdateCapteur();

  const zoneNameById = new Map((zonesData?.features ?? []).map((f) => [f.id, f.properties.quartier]));
  const releveCountByCapteur = new Map((mesuresRecentes ?? []).map((g) => [g.capteur.id, g.mesures.length]));

  const capteurs = capteursData?.features ?? [];
  const actifs = capteurs.filter((f) => f.properties.statut === 'actif').length;

  return (
    <AutoriteShell>
      <div>
        <h1 className="text-3xl font-extrabold">Admin & capteurs</h1>
        <p className="text-base text-navy-600 dark:text-navy-200 mt-0.5">
          {capteurs.length} capteur{capteurs.length > 1 ? 's' : ''} enregistré{capteurs.length > 1 ? 's' : ''} ·{' '}
          {actifs} actif{actifs > 1 ? 's' : ''}
        </p>
      </div>

      <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5 flex flex-col gap-3">
        {isLoading ? (
          <p className="text-sm text-navy-400">Chargement…</p>
        ) : capteurs.length === 0 ? (
          <p className="text-sm text-navy-400">Aucun capteur enregistré pour l’instant.</p>
        ) : (
          capteurs.map((f) => (
            <div key={f.id} className="flex items-center gap-3 p-3.5 border border-navy-50 dark:border-navy-800 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-navy-50 dark:bg-navy-800 flex items-center justify-center flex-shrink-0 text-navy dark:text-navy-50">
                {f.properties.type === 'pluviometre' ? <CloudRain size={17} /> : <Droplet size={17} />}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUT_DOT[f.properties.statut] ?? 'bg-navy-400'}`} />
                  <span className="text-base font-semibold truncate">{f.properties.nom}</span>
                </div>
                <p className="text-sm text-navy-400 mt-0.5">
                  {TYPE_LABELS[f.properties.type] ?? f.properties.type} ·{' '}
                  {zoneNameById.get(f.properties.zone) ?? 'Zone non assignée'} · Dernier relevé :{' '}
                  {formatDateTime(f.properties.dernier_releve)}
                  {releveCountByCapteur.has(f.id) && ` · ${releveCountByCapteur.get(f.id)} relevé(s) sur 24h`}
                </p>
              </div>

              <select
                value={f.properties.statut}
                onChange={(e) => updateCapteur.mutate({ id: f.id, payload: { statut: e.target.value } })}
                disabled={updateCapteur.isPending}
                className="text-sm font-semibold px-2.5 py-2 rounded-md border-[1.5px] border-navy-200 dark:border-navy-800 bg-white dark:bg-navy flex-shrink-0"
              >
                {STATUTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          ))
        )}
      </div>

      <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5">
        <h3 className="text-base font-bold mb-3 flex items-center gap-2">
          <Gauge size={15} />
          Relevés des dernières 24h
        </h3>
        {!mesuresRecentes || mesuresRecentes.length === 0 ? (
          <p className="text-sm text-navy-400">Aucun relevé enregistré sur les dernières 24h.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {mesuresRecentes.map((g) => (
              <div key={g.capteur.id} className="flex items-center justify-between text-sm border-b border-navy-50 dark:border-navy-800 pb-2 last:border-0 last:pb-0">
                <span className="font-semibold">{g.capteur.properties.nom}</span>
                <span className="text-navy-400">
                  {g.mesures.length} mesure{g.mesures.length > 1 ? 's' : ''} · dernière :{' '}
                  {g.mesures[0]?.valeur} {g.mesures[0]?.unite}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AutoriteShell>
  );
}
