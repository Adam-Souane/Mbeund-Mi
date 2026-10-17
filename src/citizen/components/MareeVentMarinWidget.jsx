import React, { useState } from 'react';
import { Waves, Wind, Compass, Droplets, Info, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function MareeVentMarinWidget({ className = '' }) {
  const [detailsOuverts, setDetailsOuverts] = useState(false);

  // Données représentatives de la façade maritime de Thiaroye-sur-Mer / Baie de Hann
  const maree = {
    etat: 'Marée Descendante',
    prochaineBasse: '00h55 (0.55 m)',
    derniereHaute: '18h40 (1.85 m)',
    coefficient: 78,
    statutDrainage: 'favorable', // 'favorable' ou 'bloquant'
    impactExutoire: 'Évacuation des caniveaux vers la mer dégagée et fluide.',
  };

  const vent = {
    vitesseKmH: 22,
    direction: 'Ouest-Nord-Ouest',
    forceLabel: 'Brise modérée',
    rafalesKmH: 34,
    houleMetres: 1.4,
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-500/10 via-cyan-500/5 to-blue-600/10 dark:from-sky-950/40 dark:via-cyan-950/20 dark:to-blue-950/30 border border-sky-200/60 dark:border-sky-800/40 backdrop-blur-md p-4 sm:p-5 transition-all duration-300 hover:border-sky-300 dark:hover:border-sky-700 shadow-xs ${className}`}
      data-testid="maree-vent-marin-widget"
    >
      {/* Vaguelette SVG atmosphérique en arrière-plan discret */}
      <div className="absolute -bottom-2 inset-x-0 h-10 opacity-20 dark:opacity-10 pointer-events-none overflow-hidden">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full text-sky-500 fill-current animate-pulse">
          <path d="M0,0 C150,90 350,-40 500,40 C650,120 900,10 1200,40 L1200,120 L0,120 Z" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Section 1 : État de la Marée Atlantique */}
        <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-sky-500/20">
            <Waves size={22} className="animate-[bounce_3s_ease-in-out_infinite]" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-300">
                Façade Maritime · Thiaroye Plage
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/15 dark:bg-sky-400/15 text-sky-800 dark:text-sky-200 text-[10px] font-black">
                Coef. {maree.coefficient}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-2 mt-0.5">
              <h3 className="text-sm sm:text-base font-black text-navy-900 dark:text-white">
                {maree.etat}
              </h3>
              <span className="text-xs text-navy-600 dark:text-navy-300 font-medium">
                · Basse mer à {maree.prochaineBasse}
              </span>
            </div>

            {/* Impact drainage côtier */}
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 size={13} className="flex-shrink-0" />
              <span className="truncate">{maree.impactExutoire}</span>
            </div>
          </div>
        </div>

        {/* Séparateur vertical discret sur grand écran */}
        <div className="hidden md:block w-px h-12 bg-sky-200/60 dark:bg-sky-800/60 self-center" />

        {/* Section 2 : Vent marin & Houle */}
        <div className="flex items-center gap-3.5 flex-shrink-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/80 dark:bg-navy-900/80 border border-sky-200/80 dark:border-sky-800/80 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0 shadow-xs">
            <Wind size={20} />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <Compass size={12} className="text-sky-600 dark:text-sky-400" />
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-extrabold text-navy-500 dark:text-navy-400">
                {vent.direction}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm sm:text-base font-black text-navy-900 dark:text-white">
                {vent.vitesseKmH} km/h
              </span>
              <span className="text-[11px] text-navy-500 dark:text-navy-400 font-medium">
                (rafales {vent.rafalesKmH} km/h)
              </span>
            </div>
            <div className="text-[11px] font-medium text-navy-500 dark:text-navy-400">
              Houle {vent.houleMetres} m · {vent.forceLabel}
            </div>
          </div>

          {/* Bouton pour dérouler l'explication citoyenne */}
          <button
            type="button"
            onClick={() => setDetailsOuverts(!detailsOuverts)}
            aria-expanded={detailsOuverts}
            className="ml-1 sm:ml-2 p-2 rounded-xl bg-white/70 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60 transition cursor-pointer"
            title="Comprendre l'impact des marées sur Thiaroye"
          >
            {detailsOuverts ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Volet déroulant pédagogique pour le citoyen */}
      {detailsOuverts && (
        <div className="mt-3.5 pt-3.5 border-t border-sky-200/50 dark:border-sky-800/40 text-xs text-navy-700 dark:text-navy-200 space-y-2 animate-fadeIn">
          <div className="flex items-start gap-2">
            <Info size={15} className="text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-navy-900 dark:text-white">
                Pourquoi la marée est-elle capitale pour Thiaroye ?
              </p>
              <p className="mt-0.5 text-navy-600 dark:text-navy-300 leading-relaxed">
                À marée haute (pleine mer), le niveau de l’Océan dépasse la cote des buses d’évacuation pluviale de Thiaroye Plage et du Débarcadère. L’eau de pluie ne peut plus s’écouler naturellement et refoule vers les quartiers bas (Cuvette Ouest). À marée basse, les pompes ONAS et l'écoulement gravitaire fonctionnent à plein rendement.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
