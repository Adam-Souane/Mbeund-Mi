import {
  Navigation,
  X,
  ShieldCheck,
  ShieldAlert,
  CornerUpRight,
  CornerUpLeft,
  ArrowRight,
  Flag,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import RiskBadge from '../../shared/components/RiskBadge';

export default function ItineraireNavigationOverlay({
  itineraireData,
  isNavigating,
  onStartNavigation,
  onClose,
  onFinishNavigation,
  onFocusAvoidedRoads,
  currentStepIndex = 0,
  onPrevStep,
  onNextStep,
}) {
  if (!itineraireData) return null;

  const instructions = itineraireData.instructions || [];
  const currentStep = instructions[currentStepIndex] || instructions[0] || null;
  const isLastStep = currentStepIndex >= instructions.length - 1;

  const getStepIcon = (direction) => {
    switch (direction) {
      case 'gauche':
      case 'tourner_gauche':
        return <CornerUpLeft size={24} className="text-amber-300 flex-shrink-0" />;
      case 'droite':
      case 'tourner_droite':
        return <CornerUpRight size={24} className="text-amber-300 flex-shrink-0" />;
      case 'arrivee':
        return <Flag size={24} className="text-emerald-300 flex-shrink-0" />;
      case 'depart':
        return <MapPin size={24} className="text-sky-300 flex-shrink-0" />;
      default:
        return <ArrowRight size={24} className="text-emerald-300 flex-shrink-0" />;
    }
  };

  // 1. MODE GUIDAGE PAS-À-PAS EN DIRECT SUR LA MAP (Style Google Maps / Waze Navigation Sheet)
  if (isNavigating) {
    const progressPct = instructions.length > 1
      ? Math.round(((currentStepIndex + 1) / instructions.length) * 100)
      : 100;

    return (
      <div
        className="absolute bottom-3 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-[520px] max-w-[96%] z-[1000] bg-slate-900/95 dark:bg-[#071322]/95 backdrop-blur-md border-2 border-emerald-500 rounded-2xl p-3.5 sm:p-4 shadow-2xl text-white flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-300 pointer-events-auto"
        role="region"
        aria-label="Guidage d’évacuation pas-à-pas"
      >
        {/* En-tête : badge statut en direct + compteur étape + bouton quitter */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Guidage en direct
            </span>
            <span className="text-xs font-black text-white">
              Étape {currentStepIndex + 1} sur {instructions.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-300 hover:text-white px-2 py-0.5 rounded-md hover:bg-white/10 transition cursor-pointer"
          >
            Quitter
          </button>
        </div>

        {/* Jauge fine de progression */}
        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-emerald-400 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Instruction courante grand format style Google Maps HUD */}
        <div className="flex items-center gap-3 py-0.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/40 shadow-inner">
            {getStepIcon(currentStep?.direction)}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-black text-white leading-snug tracking-tight">
              {currentStep?.instruction || 'Continuez tout droit sur cet axe sécurisé.'}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-300 font-semibold flex-wrap">
              {currentStep?.ruelle && (
                <span className="text-emerald-300">{currentStep.ruelle}</span>
              )}
              {currentStep?.distance_m ? (
                <span>· dans {currentStep.distance_m} m</span>
              ) : null}
              {onFocusAvoidedRoads ? (
                <button
                  type="button"
                  onClick={onFocusAvoidedRoads}
                  className="inline-flex items-center gap-1 text-[9.5px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/40 font-medium transition cursor-pointer"
                  title="Voir la déviation sécurisée sur la carte"
                >
                  <ShieldAlert size={10} />
                  <span>Voies inondées contournées</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 text-[9.5px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
                  <ShieldAlert size={10} />
                  <span>Voies inondées contournées</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Boutons d'action navigation TOUJOURS 100% VISIBLES */}
        <div className="flex items-center gap-2 pt-1 border-t border-white/10">
          <button
            type="button"
            onClick={onPrevStep}
            disabled={currentStepIndex === 0}
            className="py-2.5 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition disabled:opacity-30 cursor-pointer shrink-0"
          >
            Précédent
          </button>

          {!isLastStep ? (
            <button
              type="button"
              onClick={onNextStep}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition cursor-pointer"
            >
              <span>Étape suivante</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onFinishNavigation || onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-600 active:scale-98 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-500/30 transition cursor-pointer"
            >
              <CheckCircle2 size={16} />
              <span>Arrivé en zone sûre · Terminer</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. BANDEAU DE VISUALISATION INITIALE SUR LA MAP AVEC LE BOUTON « SUIVRE L'ITINÉRAIRE »
  const tempsEstime = itineraireData.temps_marche_min || Math.max(1, Math.round(itineraireData.distance_km * 14));

  return (
    <div
      className="absolute bottom-3 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-[520px] max-w-[96%] z-[1000] bg-white/95 dark:bg-[#071322]/95 backdrop-blur-md border-2 border-blue-500/50 dark:border-blue-500/60 rounded-2xl p-3.5 sm:p-4 shadow-2xl flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-300 pointer-events-auto"
      role="region"
      aria-label="Aperçu de l’itinéraire sécurisé"
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-navy-800 pb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-[#2563EB] dark:text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-500/30">
            <ShieldCheck size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#2563EB] dark:text-blue-400">
              Itinéraire sécurisé prêt
            </p>
            <h4 className="text-xs sm:text-sm font-black text-navy-950 dark:text-white truncate">
              Vers {itineraireData.zone_arrivee.quartier}
            </h4>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 text-slate-500 flex items-center justify-center cursor-pointer transition active:scale-95"
          title="Fermer l'itinéraire"
          aria-label="Fermer"
        >
          <X size={15} />
        </button>
      </div>

      {/* Alerte déviations automatiques */}
      {onFocusAvoidedRoads ? (
        <button
          type="button"
          onClick={onFocusAvoidedRoads}
          className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-[11px] font-semibold transition cursor-pointer text-left"
          title="Voir la déviation sécurisée sur la carte"
        >
          <div className="flex items-center gap-2 min-w-0">
            <ShieldAlert size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Voies inondées automatiquement contournées</span>
          </div>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold underline shrink-0">Voir</span>
        </button>
      ) : (
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-[11px] font-semibold">
          <ShieldAlert size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Voies inondées automatiquement contournées</span>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-medium px-1">
        <span>Distance : <strong className="text-navy-950 dark:text-white">{itineraireData.distance_km} km</strong></span>
        <span>À pied : <strong className="text-navy-950 dark:text-white">~{tempsEstime} min</strong></span>
        <RiskBadge niveau={itineraireData.zone_arrivee.niveau_risque} />
      </div>

      <button
        type="button"
        onClick={onStartNavigation}
        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
      >
        <Navigation size={16} className="fill-white" />
        <span>Suivre l’itinéraire (Guidage pas-à-pas)</span>
      </button>
    </div>
  );
}
