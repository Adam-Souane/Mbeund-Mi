import { Link } from 'react-router-dom';
import { CloudRain, Droplets, Wind } from 'lucide-react';
import AutoriteShell from '../desktop/AutoriteShell';
import WeatherWidget from '../../shared/components/WeatherWidget';
import RiskBadge from '../../shared/components/RiskBadge';
import { usePrevisions } from '../../shared/hooks/usePrevisions';
import { useAlertesRecentes } from '../../shared/hooks/useAlertes';

const STATUT_LABELS = {
  en_attente: 'En attente',
  envoyee: 'Envoyée',
  resolue: 'Résolue',
};

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function PrevisionsAlertesPage() {
  const { data: previsionsData, isLoading: previsionsLoading } = usePrevisions();
  const { data: alertesData, isLoading: alertesLoading } = useAlertesRecentes();

  const previsions = previsionsData?.results ?? [];
  const alertes = alertesData?.results ?? [];

  return (
    <AutoriteShell>
      <div>
        <h1 className="text-3xl font-extrabold">Prévisions & alertes</h1>
        <p className="text-base text-navy-600 dark:text-navy-200 mt-0.5">Thiaroye-sur-Mer · Suivi météo et vigilance</p>
      </div>

      <WeatherWidget previsions={previsions} />

      <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5">
        <h3 className="text-base font-bold mb-3 flex items-center gap-2">
          <CloudRain size={15} />
          Toutes les prévisions
        </h3>
        {previsionsLoading ? (
          <p className="text-sm text-navy-400">Chargement…</p>
        ) : previsions.length === 0 ? (
          <p className="text-sm text-navy-400">Aucune prévision météo enregistrée pour l’instant.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-navy-400 uppercase border-b border-navy-50 dark:border-navy-800">
                <tr>
                  <th className="py-2 pr-3 font-semibold">Date</th>
                  <th className="py-2 pr-3 font-semibold">Température</th>
                  <th className="py-2 pr-3 font-semibold">
                    <Droplets size={11} className="inline mr-1" />
                    Précipitations
                  </th>
                  <th className="py-2 pr-3 font-semibold">
                    <Wind size={11} className="inline mr-1" />
                    Vent
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50 dark:divide-navy-800">
                {previsions.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 pr-3 font-semibold">{formatDateTime(p.date_prevision)}</td>
                    <td className="py-2 pr-3">{p.temperature != null ? `${p.temperature}°C` : '—'}</td>
                    <td className="py-2 pr-3">{p.precipitation != null ? `${p.precipitation} mm` : '—'}</td>
                    <td className="py-2 pr-3">{p.vitesse_vent != null ? `${p.vitesse_vent} km/h` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold">Alertes récentes</h3>
          <Link to="/autorite/crise" className="text-sm font-bold text-red">
            Gérer les alertes
          </Link>
        </div>
        {alertesLoading ? (
          <p className="text-sm text-navy-400">Chargement…</p>
        ) : alertes.length === 0 ? (
          <p className="text-sm text-navy-400">Aucune alerte pour l’instant.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {alertes.map((a) => (
              <div key={a.id} className="flex items-start gap-3 pb-3 border-b border-navy-50 dark:border-navy-800 last:border-0 last:pb-0">
                <RiskBadge niveau={a.niveau} className="mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-semibold truncate">{a.zone?.quartier}</span>
                    <span className="text-[11px] text-navy-400 flex-shrink-0">{formatDateTime(a.timestamp)}</span>
                  </div>
                  <p className="text-sm text-navy-600 dark:text-navy-200 mt-0.5">{a.message}</p>
                  <span className="inline-block mt-1 text-[11px] font-bold uppercase text-navy-400">
                    {STATUT_LABELS[a.statut] ?? a.statut}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AutoriteShell>
  );
}
