import { Link, useNavigate } from 'react-router-dom';
import { Camera, MapPin as MapPinIcon, CloudRain, PhoneCall, MapPin, ShieldCheck, ChevronRight } from 'lucide-react';
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
  const recentAlertes = alertesData?.results?.slice(0, 3) ?? [];

  const nomCitoyen = username || 'Citoyen';

  return (
    <CitizenShell>
      {/* Bannière Majeure Unifiée Tout en Haut (Bonjour Citoyen + Niveau de Risque Réel) */}
      {(() => {
        const riskLevel = topZone?.niveau_risque?.toLowerCase() || 'vert';
        
        // Configuration chromatique et textuelle dynamique selon le risque réel
        const THEMES = {
          vert: {
            gradient: 'from-emerald-950 via-teal-900 to-slate-900',
            border: 'border-emerald-500/40 shadow-emerald-950/20',
            badgeBg: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
            dotPing: 'bg-emerald-400',
            dotCore: 'bg-emerald-500',
            tagLabel: 'FAIBLE',
            defaultDesc: 'Conditions stables. Aucun débordement ni accumulation critique des eaux signalés à Thiaroye-sur-Mer. Vigilance habituelle.',
          },
          jaune: {
            gradient: 'from-amber-950 via-yellow-900 to-slate-900',
            border: 'border-amber-500/40 shadow-amber-950/20',
            badgeBg: 'bg-amber-500/20 text-amber-200 border-amber-400/30',
            dotPing: 'bg-amber-400',
            dotCore: 'bg-amber-500',
            tagLabel: 'MODÉRÉ',
            defaultDesc: 'Vigilance modérée. Sol saturé et légères accumulations d’eau possibles dans les points bas de Thiaroye-sur-Mer.',
          },
          orange: {
            gradient: 'from-orange-950 via-orange-900 to-slate-900',
            border: 'border-orange-500/50 shadow-orange-950/30',
            badgeBg: 'bg-orange-500/25 text-orange-200 border-orange-400/40',
            dotPing: 'bg-orange-400',
            dotCore: 'bg-orange-500',
            tagLabel: 'ÉLEVÉ',
            defaultDesc: 'Risque élevé d’inondation. Caniveaux sous tension et ruissellement marqué dans les secteurs de Ndakhane et Plage.',
          },
          rouge: {
            gradient: 'from-red-950 via-[#B5121B] to-slate-950',
            border: 'border-red-500/60 shadow-red-950/40',
            badgeBg: 'bg-red-500/30 text-white border-red-400/50',
            dotPing: 'bg-red-400',
            dotCore: 'bg-red-500',
            tagLabel: 'CRITIQUE',
            defaultDesc: 'Alerte critique d’inondation à Thiaroye-sur-Mer. Évacuez les zones basses, suivez les consignes et contactez les secours (18).',
          },
        };

        const theme = THEMES[riskLevel] || THEMES.vert;
        
        // Éliminer les incohérences (ex: base contenant "risque imminent" alors que le niveau est vert)
        const isContradictory = riskLevel === 'vert' && /imminent|grave|critique/i.test(topZone?.description || '');
        const descriptionReelle = (!isContradictory && topZone?.description) ? topZone.description : theme.defaultDesc;

        return (
          <div
            className={`rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-xl border bg-gradient-to-br ${theme.gradient} ${theme.border} transition-all duration-300 relative overflow-hidden mb-1`}
          >
            {/* Lueur subtile en arrière-plan */}
            <div className="absolute -right-16 -top-16 w-60 h-60 rounded-full bg-white/5 blur-3xl pointer-events-none" />

            {/* Partie Supérieure : Salutation citoyenne + Localisation Thiaroye + Statut live */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/15 relative z-10">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Bonjour, {nomCitoyen}
                </h1>
                <div className="flex items-center gap-1.5 text-slate-200 text-xs sm:text-sm mt-0.5">
                  <MapPin size={15} className="text-[#CC131A] flex-shrink-0" />
                  <span className="font-extrabold text-white">Thiaroye-sur-Mer</span>
                  {topZone?.quartier && topZone.quartier !== 'Thiaroye-sur-Mer' && (
                    <span className="text-xs text-slate-300">· Secteur {topZone.quartier}</span>
                  )}
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-white shadow-xs">
                <span className="flex h-2 w-2 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme.dotPing}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${theme.dotCore}`}></span>
                </span>
                <span>Veille en temps réel · Thiaroye</span>
              </div>
            </div>

            {/* Partie Inférieure : Risque Réel Contextualisé avec couleurs adaptées */}
            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-xs text-white">
                    Votre secteur
                  </span>
                  <span className="text-xs text-slate-300">· Niveau de vigilance</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white capitalize my-1 drop-shadow-sm">
                  Risque {riskLevel}
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-lg opacity-95">
                  {descriptionReelle}
                </p>
              </div>

              {/* Badge d'évaluation du risque adapté */}
              <div className="flex items-center gap-3 self-start sm:self-center flex-shrink-0">
                <span className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider backdrop-blur-md border shadow-md flex items-center gap-2 ${theme.badgeBg}`}>
                  <ShieldCheck size={16} />
                  {theme.tagLabel}
                </span>
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

      {/* 2. Titre de section : Actions Rapides & Services Citoyens */}
      <div className="w-full text-center pt-2 pb-1">
        <div className="inline-flex items-center justify-center gap-2 mb-1">
          <div className="w-2 h-4 rounded-full bg-[#CC131A]" />
          <h2 className="text-lg sm:text-xl font-black text-navy-900 dark:text-white tracking-tight">
            Actions Prioritaires & Services
          </h2>
          <div className="w-2 h-4 rounded-full bg-[#CC131A]" />
        </div>
        <p className="text-xs sm:text-sm text-navy-500 dark:text-navy-400 max-w-xl mx-auto">
          Accédez rapidement aux outils essentiels : signalez une inondation, explorez la carte ou consultez les alertes.
        </p>
      </div>

      {/* 3 tuiles prioritaires sur la même ligne (grid-cols-3 sur tous les écrans, mobile inclus) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-5 w-full pb-2">
        {/* Tuile 1 : Signaler */}
        <Link
          to="/citoyen/signaler"
          className="group flex flex-col items-center justify-center text-center p-2.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#071322] border-2 border-red-100/80 dark:border-red-950/60 hover:border-red-400 dark:hover:border-red-700 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
        >
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-xs mb-1.5 sm:mb-2">
            <Camera size={22} className="sm:hidden" />
            <Camera size={26} className="hidden sm:block" />
          </div>
          <h4 className="text-xs sm:text-base font-black text-navy-900 dark:text-white group-hover:text-red-600 transition-colors leading-tight">
            Signaler
          </h4>
          <p className="text-[10px] sm:text-xs text-navy-500 dark:text-navy-400 truncate w-full mt-0.5">
            Zone inondée
          </p>
        </Link>

        {/* Tuile 2 : Carte */}
        <Link
          to="/citoyen/carte"
          className="group flex flex-col items-center justify-center text-center p-2.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#071322] border-2 border-blue-100/80 dark:border-blue-950/60 hover:border-blue-400 dark:hover:border-blue-700 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
        >
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-xs mb-1.5 sm:mb-2">
            <MapPin size={22} className="sm:hidden" />
            <MapPin size={26} className="hidden sm:block" />
          </div>
          <h4 className="text-xs sm:text-base font-black text-navy-900 dark:text-white group-hover:text-blue-600 transition-colors leading-tight">
            Carte
          </h4>
          <p className="text-[10px] sm:text-xs text-navy-500 dark:text-navy-400 truncate w-full mt-0.5">
            Risques direct
          </p>
        </Link>

        {/* Tuile 3 : Prévisions */}
        <Link
          to="/citoyen/alertes"
          className="group flex flex-col items-center justify-center text-center p-2.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#071322] border-2 border-sky-100/80 dark:border-sky-950/60 hover:border-sky-400 dark:hover:border-sky-700 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
        >
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-xs mb-1.5 sm:mb-2">
            <CloudRain size={22} className="sm:hidden" />
            <CloudRain size={26} className="hidden sm:block" />
          </div>
          <h4 className="text-xs sm:text-base font-black text-navy-900 dark:text-white group-hover:text-sky-600 transition-colors leading-tight">
            Prévisions
          </h4>
          <p className="text-[10px] sm:text-xs text-navy-500 dark:text-navy-400 truncate w-full mt-0.5">
            Météo & pluie
          </p>
        </Link>
      </div>

      {/* 3. Carrousel visuel immersif en pleine largeur */}
      <div className="w-full">
        <ConseilsCarousel />
      </div>

      {/* 4. Titre de section : Veille & Vie de Quartier (Harmonisé avec le 1er titre) */}
      <div className="w-full text-center py-4 sm:py-5 my-1">
        <div className="inline-flex items-center justify-center gap-2 mb-1">
          <div className="w-2 h-4 rounded-full bg-[#0B2545] dark:bg-[#CC131A]" />
          <h2 className="text-lg sm:text-xl font-black text-navy-900 dark:text-white tracking-tight">
            Veille Territoriale & Vie de Quartier
          </h2>
          <div className="w-2 h-4 rounded-full bg-[#0B2545] dark:bg-[#CC131A]" />
        </div>
        <p className="text-xs sm:text-sm text-navy-500 dark:text-navy-300 max-w-xl mx-auto">
          Suivez en direct la météo côtière de Thiaroye-sur-Mer et les observations partagées par les riverains.
        </p>
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

      {/* 6. Suivi des Risques, Mes Signalements & Alertes officielles avec Titre en haut de chaque carte */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full mt-6 sm:mt-8 pt-4 sm:pt-6 items-stretch auto-rows-fr">
        {/* Carte 1 : Évaluation du Risque */}
        <div className="flex flex-col gap-2.5 h-full min-h-0">
          <div className="flex items-center gap-2 px-1">
            <div className="w-2 h-4 rounded-full bg-[#CC131A]" />
            <h3 className="text-sm font-black uppercase tracking-wider text-navy-900 dark:text-white">
              Évaluation du Risque
            </h3>
          </div>
          <GaugeRisk
            zone={topZone}
            prediction={zonePrediction}
            onExploreMap={() => navigate('/citoyen/carte')}
            className="flex-1 h-full"
          />
        </div>

        {/* Carte 2 : Vos Observations Terrain (Renommé pour éviter la redondance avec le titre interne de la carte) */}
        <div className="flex flex-col gap-2.5 h-full min-h-0">
          <div className="flex items-center gap-2 px-1">
            <div className="w-2 h-4 rounded-full bg-[#0B2545] dark:bg-[#CC131A]" />
            <h3 className="text-sm font-black uppercase tracking-wider text-navy-900 dark:text-white">
              Vos Observations Terrain
            </h3>
          </div>
          <MesSignalementsWidget className="flex-1 h-full" />
        </div>

        {/* Carte 3 : Alertes Officielles */}
        <div className="flex flex-col gap-2.5 h-full min-h-0">
          <div className="flex items-center gap-2 px-1">
            <div className="w-2 h-4 rounded-full bg-[#CC131A]" />
            <h3 className="text-sm font-black uppercase tracking-wider text-navy-900 dark:text-white">
              Alertes Officielles
            </h3>
          </div>
          <div className="bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 rounded-3xl p-5 shadow-xs transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[1.025] hover:-translate-y-1.5 hover:shadow-2xl hover:border-navy-300 dark:hover:border-navy-600 will-change-transform flex flex-col justify-between flex-1 h-full">
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
                    <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-2xl bg-navy-50/50 dark:bg-white/5 border border-navy-100/80 dark:border-navy-800">
                      <RiskBadge niveau={a.niveau} className="mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-navy-900 dark:text-white truncate">{a.zone?.quartier || 'Thiaroye'}</div>
                        <p className="text-xs text-navy-600 dark:text-navy-300 line-clamp-2 mt-0.5 leading-snug">{a.message}</p>
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
