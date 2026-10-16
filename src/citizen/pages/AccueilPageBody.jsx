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
import ConseilsCarousel from '../components/ConseilsCarousel';
import MesSignalementsWidget from '../components/MesSignalementsWidget';
import FilCommunautaireWidget from '../components/FilCommunautaireWidget';

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
      {/* En-tête dynamique avec badge communautaire */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-navy-900 dark:text-white">Bonjour</h1>
          {topZone && (
            <div className="flex items-center gap-1.5 text-navy-600 dark:text-navy-300 text-sm mt-0.5">
              <MapPin size={14} className="text-red flex-shrink-0" />
              <span className="font-bold">{topZone.quartier}</span>
            </div>
          )}
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/60 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold shadow-xs">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span>Entraide quartier active</span>
        </div>
      </div>

      {zonesLoading && <p className="text-sm text-navy-400 animate-pulse">Chargement des données de votre zone…</p>}
      {zonesError && (
        <p className="text-sm text-red bg-red-50 dark:bg-red/15 rounded-xl px-4 py-3 border border-red/20">
          Impossible de charger les zones à risque pour l’instant.
        </p>
      )}

      {/* 1. Carrousel visuel immersif avec photos réalistes de Dakar en vedette */}
      <ConseilsCarousel />

      {/* 2. Bannière de Risque Majeure avec dégradé moderne */}
      {topZone && (
        <div
          className={`rounded-2xl p-5 sm:p-6 text-white flex items-center justify-between gap-4 shadow-md transition-all ${
            topZone.niveau_risque === 'rouge'
              ? 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-700'
              : topZone.niveau_risque === 'orange'
              ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-red-600'
              : 'bg-gradient-to-r from-navy-900 via-navy-800 to-navy-950'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs">
                Votre secteur
              </span>
              <span className="text-xs opacity-85">· En temps réel</span>
            </div>
            <div className="text-2xl font-black my-1 drop-shadow-sm">Risque {topZone.niveau_risque}</div>
            <p className="text-xs sm:text-sm opacity-90 max-w-lg leading-relaxed">
              {topZone.description || "Surveillance hydrologique active dans votre quartier. Restez vigilants."}
            </p>
          </div>
          <RiskBadge niveau={topZone.niveau_risque} className="bg-white/25 text-white flex-shrink-0 shadow-sm" />
        </div>
      )}

      {/* 3. 4 Cartes d'Accès Rapides avec micro-dégradés */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/citoyen/signaler"
          className="group bg-gradient-to-br from-white to-red-50/30 dark:from-navy dark:to-navy-900 border border-navy-100 dark:border-navy-800 rounded-2xl p-4 flex flex-col gap-2.5 hover:border-red hover:shadow-md transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red/20 text-red flex items-center justify-center group-hover:scale-105 transition-transform">
            <Camera size={19} />
          </div>
          <span className="text-sm font-extrabold text-navy-900 dark:text-navy-50">Signaler</span>
        </Link>
        <Link
          to="/citoyen/carte"
          className="group bg-gradient-to-br from-white to-navy-50/40 dark:from-navy dark:to-navy-900 border border-navy-100 dark:border-navy-800 rounded-2xl p-4 flex flex-col gap-2.5 hover:border-navy-400 dark:hover:border-navy-600 hover:shadow-md transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-navy-50 dark:bg-navy-800 text-navy dark:text-navy-50 flex items-center justify-center group-hover:scale-105 transition-transform">
            <MapPinIcon size={19} />
          </div>
          <span className="text-sm font-extrabold text-navy-900 dark:text-navy-50">Carte</span>
        </Link>
        <Link
          to="/citoyen/alertes"
          className="group bg-gradient-to-br from-white to-blue-50/30 dark:from-navy dark:to-navy-900 border border-navy-100 dark:border-navy-800 rounded-2xl p-4 flex flex-col gap-2.5 hover:border-blue-400 hover:shadow-md transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center group-hover:scale-105 transition-transform">
            <CloudRain size={19} />
          </div>
          <span className="text-sm font-extrabold text-navy-900 dark:text-navy-50">Prévisions</span>
        </Link>
        <a
          href="tel:18"
          className="group bg-gradient-to-br from-white to-red-50/40 dark:from-navy dark:to-navy-900 border border-navy-100 dark:border-navy-800 rounded-2xl p-4 flex flex-col gap-2.5 hover:border-red hover:shadow-md transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-red text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
            <PhoneCall size={19} />
          </div>
          <span className="text-sm font-extrabold text-red">Urgence · 18</span>
        </a>
      </div>

      {/* 4. Suivi des signalements du citoyen & Fil communautaire */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MesSignalementsWidget />
        <FilCommunautaireWidget />
      </div>

      {/* Risque & Alertes météo */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1.4fr_1fr] lg:gap-5 lg:items-start">
        <div className="order-1 lg:order-1">
          <GaugeRisk zone={topZone} prediction={zonePrediction} onExploreMap={() => navigate('/citoyen/carte')} />
        </div>

        <div className="order-3 lg:order-2 bg-white dark:bg-navy border border-navy-100 dark:border-navy-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold">Alertes récentes</h3>
            <Link to="/citoyen/alertes" className="text-xs font-bold text-red hover:underline">
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

        <div className="order-2 lg:order-3 lg:col-span-2">
          <WeatherWidget previsions={previsionsData?.results ?? []} />
        </div>
      </div>
    </CitizenShell>
  );
}
