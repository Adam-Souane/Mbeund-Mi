import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  Droplet,
  BarChart3,
  Send,
  Flame,
  ThumbsUp,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import AutoriteShell from '../desktop/AutoriteShell';
import GaugeRisk from '../../shared/components/GaugeRisk';
import RiskBadge from '../../shared/components/RiskBadge';
import { useZones } from '../../shared/hooks/useZones';
import { usePredictions } from '../../shared/hooks/usePredictions';
import { useAlertesRecentes } from '../../shared/hooks/useAlertes';
import { useSignalementsApercu } from '../../shared/hooks/useSignalements';
import { getTopConfirmedPost } from '../../shared/data/riverainsData';

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
        <div className="text-xs font-semibold uppercase text-navy-400 truncate">{label}</div>
        <div className="text-2xl font-extrabold text-navy dark:text-navy-50">{value}</div>
        {caption && <div className="text-xs text-navy-400">{caption}</div>}
      </div>
    </div>
  );
}

export default function TableauDeBordPage() {
  const navigate = useNavigate();
  const [interventionDepêchee, setInterventionDepêchee] = useState(() => {
    try {
      return localStorage.getItem('mbeund_mi_top_report_status') === 'intervenu';
    } catch {
      return false;
    }
  });

  const { data: zonesData } = useZones();
  const { data: predictions } = usePredictions();
  const { data: alertesData } = useAlertesRecentes();
  const { data: signalementsData } = useSignalementsApercu();

  // Récupération dynamique du signalement citoyen ayant le plus de confirmations réelles
  const topConfirmedPost = useMemo(() => getTopConfirmedPost(), []);

  const handleDepecherIntervention = () => {
    setInterventionDepêchee((prev) => {
      const next = !prev;
      try {
        if (next) {
          localStorage.setItem('mbeund_mi_top_report_status', 'intervenu');
        } else {
          localStorage.removeItem('mbeund_mi_top_report_status');
        }
      } catch {}
      return next;
    });
  };

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
        <h1 className="text-3xl font-extrabold">Tableau de bord</h1>
        <p className="text-base text-navy-600 dark:text-navy-200 mt-0.5">Thiaroye-sur-Mer · Supervision temps réel</p>
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

      {/* ── MISE EN ÉVIDENCE PRIORITAIRE : POST LE PLUS CONFIRMÉ PAR LES CITOYENS ── */}
      {topConfirmedPost && (
        <div className="relative overflow-hidden bg-gradient-to-r from-red-50/95 via-amber-50/70 to-white dark:from-[#200e12] dark:via-[#1c1214] dark:to-[#071322] border-2 border-[#CC131A] dark:border-red-600 rounded-2xl p-5 sm:p-6 shadow-xl transition-all">
          {/* Lueur de priorité en arrière-plan */}
          <div className="absolute top-0 right-0 w-80 h-40 bg-red-500/10 dark:bg-red-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Bandeau d'en-tête de la priorité */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-red-200/80 dark:border-red-900/60">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#CC131A] text-white shadow-md animate-pulse">
                <Flame size={18} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#CC131A] dark:text-red-400">
                    Priorité Citoyenne N°1 · Signalement le plus confirmé
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-100 dark:bg-red-950/80 text-[#CC131A] dark:text-red-300 border border-red-300 dark:border-red-800">
                    Urgence Terrain
                  </span>
                </div>
                <p className="text-xs text-navy-600 dark:text-navy-300 font-medium mt-0.5">
                  Consensus populaire fort : requiert une intervention municipale prioritaire
                </p>
              </div>
            </div>

            {/* Badge des confirmations réelles */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#0B2545] border border-red-200 dark:border-red-800 shadow-xs">
              <ThumbsUp size={16} className="text-emerald-600 dark:text-emerald-400 animate-bounce" />
              <span className="text-sm font-black text-navy-900 dark:text-white">
                {topConfirmedPost.totalVotes} confirmations
              </span>
              <span className="text-xs text-navy-500 dark:text-navy-300 font-semibold">(+1 vu riverains)</span>
            </div>
          </div>

          {/* Contenu détaillé du signalement prioritaire */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-[140px_1fr] lg:grid-cols-[160px_1fr_auto] gap-5 items-center">
            {/* Photo du signalement */}
            <div className="relative group overflow-hidden rounded-xl border-2 border-red-200 dark:border-red-900 shadow-md">
              <img
                src={topConfirmedPost.photo}
                alt={topConfirmedPost.titre}
                className="w-full h-32 md:h-36 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/75 text-[10px] font-bold text-white backdrop-blur-xs">
                {topConfirmedPost.temps}
              </span>
            </div>

            {/* Détails : Auteur, Quartier, Description */}
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <img
                  src={topConfirmedPost.avatar}
                  alt={topConfirmedPost.auteur}
                  className="w-7 h-7 rounded-full object-cover border border-[#CC131A]"
                />
                <span className="text-sm font-black text-navy-900 dark:text-white">
                  {topConfirmedPost.auteur}
                </span>
                <span className="text-xs text-navy-400 dark:text-navy-400">·</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-navy-700 dark:text-navy-200">
                  <MapPin size={13} className="text-[#CC131A]" />
                  {topConfirmedPost.quartier} ({topConfirmedPost.rue})
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-200">
                  {topConfirmedPost.categorie}
                </span>
              </div>

              <h4 className="text-base font-extrabold text-navy-900 dark:text-white">
                {topConfirmedPost.titre}
              </h4>

              <p className="text-sm text-navy-700 dark:text-navy-200 leading-relaxed line-clamp-2">
                {topConfirmedPost.description}
              </p>

              <div className="flex items-center gap-3 pt-1 text-xs">
                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                  <CheckCircle2 size={14} />
                  {topConfirmedPost.totalVotes} riverains confirment l'ampleur du problème
                </span>
                <span>·</span>
                <span className="text-navy-500 dark:text-navy-400 font-medium">
                  {topConfirmedPost.statutLabel}
                </span>
              </div>
            </div>

            {/* Actions immédiates de l'autorité */}
            <div className="flex flex-row md:flex-col gap-2.5 flex-shrink-0 w-full md:w-auto pt-2 md:pt-0">
              <button
                type="button"
                onClick={handleDepecherIntervention}
                className={`w-full px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                  interventionDepêchee
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-[#CC131A] hover:bg-red-700 text-white'
                }`}
              >
                {interventionDepêchee ? (
                  <>
                    <ShieldCheck size={16} />
                    <span>Équipe Déployée ✓</span>
                  </>
                ) : (
                  <>
                    <Flame size={16} />
                    <span>Dépêcher Intervention</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/autorite/carte')}
                className="w-full px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-700 hover:bg-navy-50 dark:hover:bg-navy-700 text-navy-800 dark:text-white transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <MapPin size={14} className="text-[#CC131A]" />
                <span>Voir sur la carte</span>
              </button>

              <Link
                to="/autorite/signalements"
                className="w-full px-4 py-2 rounded-xl text-[11px] font-bold text-center text-navy-600 dark:text-navy-300 hover:text-[#CC131A] dark:hover:text-red-400 transition"
              >
                Gérer tous les signalements →
              </Link>
            </div>
          </div>
        </div>
      )}

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5 items-start">
          <GaugeRisk zone={topZone} prediction={zonePrediction} onExploreMap={() => navigate('/autorite/carte')} />

          <div className="bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold">Alertes récentes</h3>
              <Link to="/autorite/crise" className="text-sm font-bold text-red">
                Gérer
              </Link>
            </div>
            {recentAlertes.length === 0 ? (
              <p className="text-sm text-navy-400">Aucune alerte pour l’instant.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {recentAlertes.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 pb-3 border-b border-navy-50 dark:border-navy-800 last:border-0 last:pb-0">
                    <RiskBadge niveau={a.niveau} className="mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-base font-semibold truncate">{a.zone?.quartier}</div>
                      <p className="text-sm text-navy-600 dark:text-navy-200 line-clamp-2">{a.message}</p>
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
              <h3 className="text-base font-bold">Signalements citoyens à valider</h3>
              <p className="text-sm text-navy-400">Observations transmises par les riverains</p>
            </div>
            <span className="text-sm font-bold text-navy-600 dark:text-navy-200">{signalementsEnAttente.length} en attente</span>
          </div>
          {signalementsEnAttente.length === 0 ? (
            <p className="text-sm text-navy-400">Rien à valider pour l’instant.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {signalementsEnAttente.slice(0, 4).map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-3 border border-navy-50 dark:border-navy-800 rounded-md">
                  <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-pill bg-navy-50 dark:bg-navy-800 flex-shrink-0">
                    {f.properties.categorie}
                  </span>
                  <p className="text-sm text-navy-600 dark:text-navy-200 truncate flex-1">{f.properties.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
    </AutoriteShell>
  );
}
