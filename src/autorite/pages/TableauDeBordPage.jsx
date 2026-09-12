import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Droplet, BarChart3, Send } from 'lucide-react';
import AutoriteShell from '../desktop/AutoriteShell';
import GaugeRisk from '../../shared/components/GaugeRisk';
import RiskBadge from '../../shared/components/RiskBadge';
import { useZones } from '../../shared/hooks/useZones';
import { usePredictions } from '../../shared/hooks/usePredictions';
import { useAlertesRecentes } from '../../shared/hooks/useAlertes';
import { useSignalementsApercu } from '../../shared/hooks/useSignalements';

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

function KpiCard({ icon: Icon, label, value, caption, tone = 'navy' }) {
  return (
    <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-lg p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          tone === 'red' ? 'bg-red-50 dark:bg-red/15 text-red' : 'bg-navy-50 dark:bg-navy-800 text-navy dark:text-navy-50'
        }`}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase text-navy-400 truncate">{label}</div>
        <div className="text-xl font-extrabold text-navy dark:text-navy-50">{value}</div>
        {caption && <div className="text-[11px] text-navy-400">{caption}</div>}
      </div>
    </div>
  );
}

export default function TableauDeBordPage() {
  const navigate = useNavigate();

  const { data: zonesData } = useZones();
  const { data: predictions } = usePredictions();
  const { data: alertesData } = useAlertesRecentes();
  const { data: signalementsData } = useSignalementsApercu();

  const zones = zonesData?.features?.map((f) => ({ id: f.id, ...f.properties })) ?? [];
  const topZone = pickMostAtRiskZone(zonesData?.features);
  const zonePrediction = predictions?.find((p) => p.zone?.id === topZone?.id);

  const zonesARisqueEleve = zones.filter((z) => z.niveau_risque === 'orange' || z.niveau_risque === 'rouge').length;
  const scoreRisqueMoyen = zones.length
    ? (zones.reduce((sum, z) => sum + Number(z.score_risque_moyen ?? 0), 0) / zones.length).toFixed(2)
    : '—';

  const recentAlertes = alertesData?.results?.slice(0, 4) ?? [];
  const totalAlertesEnvoyees = alertesData?.count ?? 0;

  const signalementsFeatures = signalementsData?.results?.features ?? [];
  const signalementsEnAttente = signalementsFeatures.filter((f) => !f.properties.valide);

  return (
    <AutoriteShell>
      <div>
        <h1 className="text-2xl font-extrabold">Tableau de bord</h1>
        <p className="text-sm text-navy-600 dark:text-navy-200 mt-0.5">Thiaroye-sur-Mer · Supervision temps réel</p>
      </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={ShieldAlert} label="Zones à risque élevé" value={zonesARisqueEleve} tone="red" />
          <KpiCard
            icon={Droplet}
            label="Prédiction IA (24h)"
            value={zonePrediction?.niveau_eau_predit_cm != null ? `${zonePrediction.niveau_eau_predit_cm} cm` : '—'}
            caption={zonePrediction ? `confiance ${Math.round(zonePrediction.confiance)}%` : undefined}
          />
          <KpiCard icon={BarChart3} label="Score de risque moyen" value={scoreRisqueMoyen} caption="échelle 0–1" />
          <KpiCard icon={Send} label="Alertes émises" value={totalAlertesEnvoyees} />
        </div>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5 items-start">
          <GaugeRisk zone={topZone} prediction={zonePrediction} onExploreMap={() => navigate('/autorite/carte')} />

          <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold">Alertes récentes</h3>
              <Link to="/autorite/crise" className="text-xs font-bold text-red">
                Gérer
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
        </div>

        <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold">Signalements citoyens à valider</h3>
              <p className="text-xs text-navy-400">Observations transmises par les riverains</p>
            </div>
            <span className="text-xs font-bold text-navy-600 dark:text-navy-200">{signalementsEnAttente.length} en attente</span>
          </div>
          {signalementsEnAttente.length === 0 ? (
            <p className="text-xs text-navy-400">Rien à valider pour l’instant.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {signalementsEnAttente.slice(0, 4).map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-3 border border-navy-50 dark:border-navy-800 rounded-md">
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-pill bg-navy-50 dark:bg-navy-800 flex-shrink-0">
                    {f.properties.categorie}
                  </span>
                  <p className="text-xs text-navy-600 dark:text-navy-200 truncate flex-1">{f.properties.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
    </AutoriteShell>
  );
}
