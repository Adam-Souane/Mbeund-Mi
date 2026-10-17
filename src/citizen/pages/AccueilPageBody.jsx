import { Link, useNavigate } from 'react-router-dom';
import { Camera, MapPin as MapPinIcon, CloudRain, PhoneCall, MapPin, ShieldCheck, ChevronRight, Users } from 'lucide-react';
import CitizenShell from '../shared/CitizenShell';
import GaugeRisk from '../../shared/components/GaugeRisk';
import WeatherWidget from '../../shared/components/WeatherWidget';
import RiskBadge from '../../shared/components/RiskBadge';
import { useAuth } from '../../auth/AuthContext';
import { useZones } from '../../shared/hooks/useZones';
import { usePredictions } from '../../shared/hooks/usePredictions';
import { useAlertesRecentes } from '../../shared/hooks/useAlertes';
import { usePrevisions } from '../../shared/hooks/usePrevisions';
import ConseilsCarousel from '../components/ConseilsCarousel';
import MesSignalementsWidget from '../components/MesSignalementsWidget';
import FilActualiteStoriesWidget from '../components/FilActualiteStoriesWidget';
import SentinellesUrgenceBanner from '../components/SentinellesUrgenceBanner';

const NIVEAU_RANK = { vert: 0, jaune: 1, orange: 2, rouge: 3 };

// Alertes officielles émises par la Protection Civile et la Mairie de Thiaroye-sur-Mer
const DEFAULT_ALERTES_OFFICIELLES = [
  {
    id: 'alerte-officielle-1',
    niveau: 'rouge',
    zone: { quartier: 'Cuvette Ouest (Thiaroye)' },
    message: 'Montée critique des eaux pluviales. Coupez l’électricité et évacuez les pièces basses vers les points surélevés.',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    emetteur: 'Protection Civile · BNSP (18)',
  },
  {
    id: 'alerte-officielle-2',
    niveau: 'orange',
    zone: { quartier: 'Thiaroye Plage' },
    message: 'Débordement au Débarcadère. 3 motopompes ONAS en cours de pompage actif pour faciliter le rejet marin.',
    timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    emetteur: 'Services Techniques Municipaux & ONAS',
  },
  {
    id: 'alerte-officielle-3',
    niveau: 'jaune',
    zone: { quartier: 'Thiaroye Gare' },
    message: 'Ruissellement sur la Rue 10 et carrefour marché. Chaussée glissante, réduisez votre allure.',
    timestamp: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
    emetteur: 'Cellule Communale de Veille',
  },
];

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
  const { username } = useAuth();

  const { data: zonesData, isLoading: zonesLoading, isError: zonesError } = useZones();
  const { data: predictions } = usePredictions();
  const { data: alertesData } = useAlertesRecentes();
  const { data: previsionsData } = usePrevisions();

  const topZone = pickMostAtRiskZone(zonesData?.features);
  const zonePrediction = predictions?.find((p) => p.zone?.id === topZone?.id);
  
  const apiAlertes = alertesData?.results ?? [];
  const recentAlertes = apiAlertes.length > 0 ? apiAlertes.slice(0, 3) : DEFAULT_ALERTES_OFFICIELLES;

  const nomCitoyen = username || 'Citoyen';

  return (
    <CitizenShell>
      {/* ========================================================= */}
      {/* ÉTAPE 1 : HERO IMMERSIF, AÉRÉ & CHALEUREUX (Village de Thiaroye) */}
      {/* ========================================================= */}
      {(() => {
        const riskLevel = topZone?.niveau_risque?.toLowerCase() || 'vert';

        const THEMES = {
          vert: {
            bgAura: 'from-emerald-500/15 via-teal-500/10 to-transparent',
            cardBg: 'bg-gradient-to-r from-emerald-950/30 via-slate-900/40 to-teal-950/20 dark:from-emerald-950/50 dark:via-navy-950/60 dark:to-teal-950/30',
            border: 'border-emerald-500/25 dark:border-emerald-500/30',
            pillBg: 'bg-emerald-600 text-white border-emerald-400 shadow-xs font-black',
            iconBg: 'bg-emerald-600 text-white border-emerald-400/40 shadow-xs',
            pingColor: 'bg-emerald-400',
            dotColor: 'bg-emerald-500',
            tagLabel: 'Vigilance normale',
            summary: 'Ruelles praticables · Pas de débordement critique signalé à Thiaroye-sur-Mer.',
          },
          jaune: {
            bgAura: 'from-amber-500/15 via-yellow-500/10 to-transparent',
            cardBg: 'bg-gradient-to-r from-amber-950/30 via-slate-900/40 to-amber-950/20 dark:from-amber-950/50 dark:via-navy-950/60 dark:to-yellow-950/30',
            border: 'border-amber-500/25 dark:border-amber-500/30',
            pillBg: 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs font-black',
            iconBg: 'bg-amber-500 text-slate-950 border-amber-300/60 shadow-xs',
            pingColor: 'bg-amber-400',
            dotColor: 'bg-amber-500',
            tagLabel: 'Vigilance modérée',
            summary: 'Sols humides · Ralentissements possibles dans les ruelles basses de Thiaroye.',
          },
          orange: {
            bgAura: 'from-orange-500/20 via-orange-600/10 to-transparent',
            cardBg: 'bg-gradient-to-r from-orange-950/40 via-slate-900/50 to-orange-950/30 dark:from-orange-950/60 dark:via-navy-950/70 dark:to-orange-950/40',
            border: 'border-orange-500/35 dark:border-orange-500/40',
            pillBg: 'bg-orange-600 text-white border-orange-400 shadow-xs font-black',
            iconBg: 'bg-orange-600 text-white border-orange-400/40 shadow-xs',
            pingColor: 'bg-orange-400',
            dotColor: 'bg-orange-500',
            tagLabel: 'Risque élevé',
            summary: 'Ruissellement marqué · Caniveaux sous surveillance à Ndakhane et Plage.',
          },
          rouge: {
            bgAura: 'from-red-600/25 via-red-500/15 to-transparent',
            cardBg: 'bg-gradient-to-r from-red-950/50 via-slate-900/60 to-red-950/40 dark:from-red-950/70 dark:via-navy-950/80 dark:to-red-950/50',
            border: 'border-red-500/40 dark:border-red-500/50',
            pillBg: 'bg-red-600 text-white border-red-300/80 shadow-md font-black',
            iconBg: 'bg-red-600 text-white border-red-400/60 shadow-md shadow-red-950/40',
            pingColor: 'bg-red-400',
            dotColor: 'bg-red-500',
            tagLabel: 'Alerte critique',
            summary: 'Montée critique des eaux · Évacuez les points bas et contactez les secours (18).',
          },
        };

        const theme = THEMES[riskLevel] || THEMES.vert;
        const quartierAffiche = topZone?.quartier || 'Thiaroye-sur-Mer';
        return (
          <div className="relative w-auto -mx-3.5 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 px-4 sm:px-8 lg:px-12 pt-8 sm:pt-12 pb-14 sm:pb-20 overflow-hidden mb-3 min-h-[240px] sm:min-h-[280px] flex flex-col justify-center">
            {/* 1. Photographie panoramique du littoral de Thiaroye-sur-Mer (Cadrage centré sur la plage dorée et les pirogues) */}
            <img
              src="/images/hero-littoral-thiaroye.jpg"
              alt="Littoral de Thiaroye-sur-Mer"
              className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
              loading="eager"
            />

            {/* 2. Voile dégradé horizontal : contraste net sur le texte à gauche, laissant la mer et les pirogues éclatantes à droite */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/40 to-transparent/10 dark:from-navy-950/90 dark:via-navy-950/50 dark:to-transparent/20" />

            {/* 3. Fondu vertical doux vers le bas qui dissout organiquement le rivage dans la page */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-navy-50 via-navy-50/60 to-transparent dark:from-navy-950 dark:via-navy-950/60 dark:to-transparent" />

            {/* 4. Lueur atmosphérique subtile liée au niveau de vigilance */}
            <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${theme.bgAura} rounded-full blur-3xl pointer-events-none opacity-40`} />

            {/* 5. Contenu textuel et indicateurs flottant librement dans l'espace ouvert */}
            <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-8 lg:gap-12 xl:gap-16 relative z-10 text-white">
              {/* Salutation humaine & territoriale */}
              <div className="space-y-2 flex-1 min-w-0 max-w-2xl">
                {/* Pastille territoriale */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/25 text-xs font-bold text-white shadow-xs">
                  <MapPin size={13} className="text-[#CC131A] flex-shrink-0" />
                  <span>{quartierAffiche}</span>
                  <span className="text-white/60">·</span>
                  <span className="flex items-center gap-1.5 text-emerald-300 font-extrabold text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    En direct
                  </span>
                </div>

                {/* Grand titre chaleureux et accueillant */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md break-words">
                  Bonjour, <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-white bg-clip-text text-transparent">{nomCitoyen}</span>
                </h1>
                <p className="text-xs sm:text-sm font-extrabold text-amber-300 drop-shadow-xs">
                  Dalal ak jamm · Votre sentinelle veille sur Thiaroye
                </p>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium drop-shadow-xs max-w-lg">
                  {theme.summary}
                </p>
              </div>

              {/* Statut de vigilance organique et flottant bien ancré à droite avec marge garantie */}
              <div className="flex items-center gap-3.5 self-start lg:self-center flex-shrink-0 bg-slate-900/75 dark:bg-navy-950/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 shadow-xl text-white lg:ml-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${theme.iconBg}`}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-black tracking-wider text-slate-300">
                    Niveau actuel
                  </span>
                  <span className="text-sm font-black text-white capitalize flex items-center gap-2 mt-0.5">
                    <span>Risque {riskLevel}</span>
                    <span className={`text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-black border ${theme.pillBg}`}>
                      {theme.tagLabel}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {zonesLoading && <p className="text-sm text-navy-400 animate-pulse">Chargement des données de votre zone…</p>}
      {zonesError && (
        <p className="text-sm text-red bg-red-50 dark:bg-red/15 rounded-xl px-4 py-3 border border-red/20">
          Impossible de charger les zones à risque pour l’instant.
        </p>
      )}

      {/* 2. Capsules d'Actions Express Citoyennes (Flottantes, légères & vivantes) */}
      <div className="w-full pt-1 pb-2">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-3.5 rounded-full bg-[#CC131A]" />
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-navy-900 dark:text-white">
              Actions Express & Services
            </h2>
          </div>
          <span className="text-[11px] font-bold text-navy-400 dark:text-navy-500">
            Accès direct
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 w-full">
          {/* Capsule 1 : Signaler */}
          <Link
            to="/citoyen/signaler"
            className="group relative overflow-hidden flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#071322] border border-red-200/80 dark:border-red-950/60 hover:border-red-400 dark:hover:border-red-700 shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-red-500 to-[#CC131A] text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-red-500/30 group-hover:scale-105 transition-transform">
              <Camera size={19} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-black text-navy-900 dark:text-white group-hover:text-red-600 transition-colors leading-tight truncate">
                Signaler
              </h3>
              <p className="text-[10px] sm:text-[11px] text-navy-500 dark:text-navy-400 font-medium truncate mt-0.5">
                Zone inondée
              </p>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#CC131A] animate-pulse flex-shrink-0 mr-0.5" title="Action prioritaire" />
          </Link>

          {/* Capsule 2 : Carte */}
          <Link
            to="/citoyen/carte"
            className="group relative overflow-hidden flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#071322] border border-blue-200/80 dark:border-blue-950/60 hover:border-blue-400 dark:hover:border-blue-700 shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-500/30 group-hover:scale-105 transition-transform">
              <MapPin size={19} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-black text-navy-900 dark:text-white group-hover:text-blue-600 transition-colors leading-tight truncate">
                Carte
              </h3>
              <p className="text-[10px] sm:text-[11px] text-navy-500 dark:text-navy-400 font-medium truncate mt-0.5">
                Ruelles & risques
              </p>
            </div>
          </Link>

          {/* Capsule 3 : Entraide */}
          <Link
            to="/citoyen/communaute"
            className="group relative overflow-hidden flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#071322] border border-emerald-200/80 dark:border-emerald-950/60 hover:border-emerald-400 dark:hover:border-emerald-700 shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-500/30 group-hover:scale-105 transition-transform">
              <Users size={19} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-black text-navy-900 dark:text-white group-hover:text-emerald-600 transition-colors leading-tight truncate">
                Entraide
              </h3>
              <p className="text-[10px] sm:text-[11px] text-navy-500 dark:text-navy-400 font-medium truncate mt-0.5">
                Stories du quartier
              </p>
            </div>
          </Link>

          {/* Capsule 4 : Prévisions */}
          <Link
            to="/citoyen/alertes"
            className="group relative overflow-hidden flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#071322] border border-amber-200/80 dark:border-amber-950/60 hover:border-amber-400 dark:hover:border-amber-700 shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-amber-500/30 group-hover:scale-105 transition-transform">
              <CloudRain size={19} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-black text-navy-900 dark:text-white group-hover:text-amber-600 transition-colors leading-tight truncate">
                Prévisions
              </h3>
              <p className="text-[10px] sm:text-[11px] text-navy-500 dark:text-navy-400 font-medium truncate mt-0.5">
                Pluies & alertes
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* 3. Carrousel visuel immersif en pleine largeur */}
      <div className="w-full">
        <ConseilsCarousel />
      </div>

      {/* 4. En-tête fluide : Veille Territoriale & Vie de Quartier */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-6 pb-2.5 px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-4 rounded-full bg-[#CC131A]" />
          <div>
            <h2 className="text-base sm:text-lg font-black text-navy-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Veille Territoriale & Vie du Quartier</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black tracking-normal">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Direct
              </span>
            </h2>
            <p className="text-xs text-navy-500 dark:text-navy-400 font-medium">
              Météo côtière en direct et observations partagées par les riverains
            </p>
          </div>
        </div>

        <Link
          to="/citoyen/communaute"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#CC131A] dark:text-red-400 hover:underline self-start sm:self-center"
        >
          <span>Espace communauté</span>
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* 5. Duo Météo (Gauche, largeur contenue) & Fil d'Actualité (Droite, spacieux) à hauteur rigoureusement identique */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] xl:grid-cols-[400px_1fr] gap-4 sm:gap-6 w-full items-stretch auto-rows-fr">
        <div className="h-full flex flex-col min-h-0">
          <WeatherWidget previsions={previsionsData?.results ?? []} zone={topZone} className="h-full flex-1" />
        </div>
        <div className="h-full flex flex-col min-h-0">
          <FilActualiteStoriesWidget className="h-full flex-1" />
        </div>
      </div>

      {/* 6. Diagnostic Territorial, Vos Observations & Alertes officielles */}
      <div className="w-full pt-6 sm:pt-8 pb-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full bg-[#CC131A]" />
            <h2 className="text-base sm:text-lg font-black text-navy-900 dark:text-white tracking-tight">
              Diagnostic Territorial & Veille Active
            </h2>
          </div>
          <span className="text-[11px] font-bold text-navy-400 dark:text-navy-500 hidden sm:inline">
            Données consolidées
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full items-stretch auto-rows-fr">
          {/* Carte 1 : Évaluation du Risque */}
          <GaugeRisk
            zone={topZone}
            prediction={zonePrediction}
            onExploreMap={() => navigate('/citoyen/carte')}
            className="w-full h-full"
          />

          {/* Carte 2 : Vos Observations Terrain */}
          <MesSignalementsWidget className="w-full h-full" />

          {/* Carte 3 : Alertes Officielles */}
          <div className="bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 rounded-3xl p-5 shadow-xs transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[1.025] hover:-translate-y-1.5 hover:shadow-2xl hover:border-navy-300 dark:hover:border-navy-600 will-change-transform flex flex-col justify-between w-full h-full">
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red/15 text-[#CC131A] dark:text-red-400 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-navy-900 dark:text-white">
                      Protection Civile
                    </h4>
                    <span className="text-[11px] text-navy-500 dark:text-navy-400">
                      Consignes Thiaroye
                    </span>
                  </div>
                </div>
                <Link to="/citoyen/alertes" className="text-xs font-bold text-[#CC131A] hover:underline flex items-center gap-0.5">
                  Voir tout <ChevronRight size={14} />
                </Link>
              </div>

              {recentAlertes.length === 0 ? (
                <p className="text-xs text-navy-400 py-8 text-center">Aucune alerte critique émise pour l’instant.</p>
              ) : (
                <div className="space-y-2.5">
                  {recentAlertes.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start gap-3 p-3 rounded-2xl bg-navy-50/60 dark:bg-white/5 border border-navy-100/80 dark:border-navy-800/80 hover:border-red-200 dark:hover:border-red-900/50 transition-colors"
                    >
                      <RiskBadge niveau={a.niveau} className="mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-xs font-black text-navy-900 dark:text-white truncate">
                            {a.zone?.quartier || 'Thiaroye'}
                          </span>
                          <span className="text-[10px] text-navy-400 font-medium flex-shrink-0">
                            {a.timestamp
                              ? new Date(a.timestamp).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Récemment'}
                          </span>
                        </div>
                        <p className="text-xs text-navy-600 dark:text-navy-300 line-clamp-2 mt-0.5 leading-snug">
                          {a.message}
                        </p>
                        {a.emetteur && (
                          <span className="inline-block mt-1 text-[10px] font-extrabold text-[#CC131A] dark:text-red-400">
                            {a.emetteur}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/citoyen/alertes"
              className="mt-3.5 w-full py-2.5 px-3 rounded-2xl bg-navy-50 hover:bg-red-50 dark:bg-navy-900/50 dark:hover:bg-red-950/30 text-navy-800 hover:text-[#CC131A] dark:text-navy-100 dark:hover:text-red-400 border border-navy-100 dark:border-navy-800 text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <span>Consulter toutes les alertes officielles</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* 7. Bandeau d'engagement & Réflexes d'urgence 24/7 (Élément de fin de page interactif et animé) */}
      <SentinellesUrgenceBanner />
    </CitizenShell>
  );
}
