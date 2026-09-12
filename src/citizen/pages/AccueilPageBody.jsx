import { Link, useNavigate } from 'react-router-dom';
import { Camera, MapPin as MapPinIcon, CloudRain, PhoneCall, MapPin } from 'lucide-react';
import CitizenShell from '../shared/CitizenShell';
import GaugeRisk from '../../shared/components/GaugeRisk';
import WeatherWidget from '../../shared/components/WeatherWidget';
import RiskBadge from '../../shared/components/RiskBadge';
import { useZones } from '../../shared/hooks/useZones';
import { usePredictions } from '../../shared/hooks/usePredictions';
import { useAlertesRecentes } from '../../shared/hooks/useAlertes';
import { usePrevisions } from '../../shared/hooks/usePrevisions';

const NIVEAU_RANK = { vert: 0, jaune: 1, orange: 2, rouge: 3 };

function pickMostAtRiskZone(features) {
  if (!features?.length) return null;
  return [...features]
    .map((f) => ({ id: f.id, ...f.properties }))
    .sort((a, b) => {
      const rankDiff = (NIVEAU_RANK[b.niveau_risque] ?? 0) - (NIVEAU_RANK[a.niveau_risque] ?? 0);
      if (rankDiff !== 0) return rankDiff;
      return Number(b.score_risque_moyen ?? 0) - Number(a.score_risque_moyen ?? 0);
    })[0];
}

export default function AccueilPageBody() {
  const navigate = useNavigate();

  const { data: zonesData, isLoading: zonesLoading, isError: zonesError } = useZones();
  const { data: predictions } = usePredictions();
  const { data: alertesData } = useAlertesRecentes();
  const { data: previsionsData } = usePrevisions();

  const topZone = pickMostAtRiskZone(zonesData?.features);
  const zonePrediction = predictions?.find((p) => p.zone?.id === topZone?.id);
  const recentAlertes = alertesData?.results?.slice(0, 3) ?? [];

  return (
    <CitizenShell>
      <div>
        <h1 className="text-xl font-extrabold">Bonjour</h1>
        {topZone && (
          <div className="flex items-center gap-1.5 mt-1 text-navy-600 dark:text-navy-200 text-sm">
            <MapPin size={14} />
            <span>{topZone.quartier}</span>
          </div>
        )}
      </div>

      {zonesLoading && <p className="text-sm text-navy-400">Chargement des zones à risque…</p>}
      {zonesError && (
        <p className="text-sm text-red bg-red-50 dark:bg-red/15 rounded-md px-4 py-3">
          Impossible de charger les zones à risque pour l’instant.
        </p>
      )}

      {topZone && (
        <div className="rounded-xl p-6 text-white flex items-center justify-between gap-4" style={{ backgroundColor: '#C0182A' }}>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wide opacity-85">Votre zone</span>
            <div className="text-2xl font-extrabold my-1">Risque {topZone.niveau_risque}</div>
            <p className="text-sm opacity-90 max-w-md">
              {topZone.description || "Restez informé de l'évolution de la situation dans votre quartier."}
            </p>
          </div>
          <RiskBadge niveau={topZone.niveau_risque} className="bg-white/20 text-white flex-shrink-0" />
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link to="/citoyen/signaler" className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-lg p-4 flex flex-col gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red/15 text-red flex items-center justify-center">
            <Camera size={17} />
          </div>
          <span className="text-sm font-bold">Signaler</span>
        </Link>
        <Link to="/citoyen/carte" className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-lg p-4 flex flex-col gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-navy-50 dark:bg-navy-800 text-navy dark:text-navy-50 flex items-center justify-center">
            <MapPinIcon size={17} />
          </div>
          <span className="text-sm font-bold">Carte</span>
        </Link>
        <Link to="/citoyen/alertes" className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-lg p-4 flex flex-col gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-navy-50 dark:bg-navy-800 text-navy dark:text-navy-50 flex items-center justify-center">
            <CloudRain size={17} />
          </div>
          <span className="text-sm font-bold">Prévisions</span>
        </Link>
        <a href="tel:18" className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-lg p-4 flex flex-col gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red/15 text-red flex items-center justify-center">
            <PhoneCall size={17} />
          </div>
          <span className="text-sm font-bold">Urgence · 18</span>
        </a>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <GaugeRisk zone={topZone} prediction={zonePrediction} onExploreMap={() => navigate('/citoyen/carte')} />
        <WeatherWidget previsions={previsionsData?.results ?? []} />
      </div>

      <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">Alertes récentes</h3>
          <Link to="/citoyen/alertes" className="text-xs font-bold text-red">
            Voir tout
          </Link>
        </div>
        {recentAlertes.length === 0 ? (
          <p className="text-xs text-navy-400">Aucune alerte pour l’instant.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {recentAlertes.map((a) => (
              <div key={a.id} className="flex items-start gap-3 pb-3 border-b border-navy-50 dark:border-navy-800 last:border-0 last:pb-0">
                <RiskBadge niveau={a.niveau} className="mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{a.zone?.quartier}</div>
                  <p className="text-xs text-navy-600 dark:text-navy-200 line-clamp-2">{a.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CitizenShell>
  );
}
