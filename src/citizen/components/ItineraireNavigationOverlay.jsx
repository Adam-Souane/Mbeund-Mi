import {
  Navigation,
  X,
  ShieldCheck,
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
        return <CornerUpLeft size={22} className="text-amber-400 flex-shrink-0" />;
      case 'droite':
      case 'tourner_droite':
        return <CornerUpRight size={22} className="text-amber-400 flex-shrink-0" />;
      case 'arrivee':
        return <Flag size={22} className="text-emerald-400 flex-shrink-0" />;
      case 'depart':
        return <MapPin size={22} className="text-teal-400 flex-shrink-0" />;
      default:
        return <ArrowRight size={22} className="text-emerald-400 flex-shrink-0" />;
    }
  };

  // 1. MODE GUIDAGE PAS-À-PAS EN DIRECT SUR LA MAP
  if (isNavigating) {
    const progressPct = instructions.length > 1
      ? Math.round(((currentStepIndex + 1) / instructions.length) * 100)
      : 100;

    return (
      <div
        className="absolute top-3 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-[480px] z-[1000] bg-white/95 dark:bg-[#071322]/95 backdrop-blur-md border-2 border-emerald-500 rounded-2xl p-3.5 shadow-2xl flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-3 duration-300"
        role="region"
        aria-label="Guidage d’évacuation pas-à-pas"
      >
        {/* En-tête : badge statut + compteur étape + quitter */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-navy-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Guidage en direct
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Étape {currentStepIndex + 1} sur {instructions.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-500 hover:text-navy-950 dark:hover:text-white px-2 py-0.5 rounded-md hover:bg-slate-100 dark:hover:bg-navy-800 transition cursor-pointer"
          >
            Quitter
          </button>
        </div>

        {/* Jauge fine de progression */}
        <div className="w-full bg-slate-100 dark:bg-navy-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Instruction courante grand format */}
        <div className="flex items-start gap-3 py-1">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
            {getStepIcon(currentStep?.direction)}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-black text-navy-950 dark:text-white leading-snug">
              {currentStep?.instruction || 'Continuez tout droit sur cet axe sécurisé.'}
            </h4>
            {currentStep?.ruelle && (
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                {currentStep.ruelle} {currentStep.distance_m ? `· ${currentStep.distance_m} m` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Boutons d'action navigation */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onPrevStep}
            disabled={currentStepIndex === 0}
            className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-700 text-navy-900 dark:text-white text-xs font-bold transition disabled:opacity-30 cursor-pointer"
          >
            Précédent
          </button>

          {!isLastStep ? (
            <button
              type="button"
              onClick={onNextStep}
              className="flex-1 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <span>Étape suivante</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <CheckCircle2 size={15} />
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
      className="absolute bottom-4 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-md z-[1000] bg-white/95 dark:bg-[#071322]/95 backdrop-blur-md border border-teal-500/40 rounded-2xl p-3.5 shadow-2xl flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-300"
      role="region"
      aria-label="Aperçu de l’itinéraire sécurisé"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0 border border-teal-500/30">
            <ShieldCheck size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
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

      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-medium px-1">
        <span>Distance : <strong className="text-navy-950 dark:text-white">{itineraireData.distance_km} km</strong></span>
        <span>À pied : <strong className="text-navy-950 dark:text-white">~{tempsEstime} min</strong></span>
        <RiskBadge niveau={itineraireData.zone_arrivee.niveau_risque} />
      </div>

      <button
        type="button"
        onClick={onStartNavigation}
        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
      >
        <Navigation size={16} className="fill-white" />
        <span>Suivre l’itinéraire</span>
      </button>
    </div>
  );
}
