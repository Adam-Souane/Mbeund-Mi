import { useState } from 'react';
import {
  ShieldAlert,
  BookOpen,
  X,
  PhoneCall,
  AlertTriangle,
  ZapOff,
  LifeBuoy,
  Users,
  Radio,
  ChevronRight,
} from 'lucide-react';
import EmergencyModal from '../../shared/components/EmergencyModal';


const REFLEXES_VITAUX = [
  {
    numero: '1',
    titre: 'Couper l’alimentation électrique',
    description: 'Dès que l’eau pénètre dans la concession, coupez immédiatement le disjoncteur général pour éviter toute électrocution par les prises basses.',
    icon: ZapOff,
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40',
  },
  {
    numero: '2',
    titre: 'Ne jamais traverser les caniveaux immergés',
    description: 'L’eau boueuse masque les avaloirs ouverts et les fosses de drainage. Le courant peut vous aspirer même avec seulement 20 cm d’eau.',
    icon: AlertTriangle,
    color: 'text-red-500 bg-red-50 dark:bg-red-950/40',
  },
  {
    numero: '3',
    titre: 'Mettre à l’abri les personnes vulnérables',
    description: 'Évacuez en priorité les personnes âgées, les enfants en bas âge et les personnes à mobilité réduite vers une maison à étage ou un abri sûr.',
    icon: Users,
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40',
  },
  {
    numero: '4',
    titre: 'Surélever denrées et documents d’identité',
    description: 'Placez les vivres, sacs de riz, médicaments et papiers administratifs dans des sacs plastique scellés sur les étagères hautes.',
    icon: LifeBuoy,
    color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40',
  },
  {
    numero: '5',
    titre: 'Alerter la communauté sur Mbeund-Mi',
    description: 'Prenez une photo de la montée des eaux et transmettez-la en direct pour déclencher les secours municipaux et prévenir vos voisins.',
    icon: Radio,
    color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40',
  },
];

export default function SentinellesUrgenceBanner() {
  const [showNumeros, setShowNumeros] = useState(false);
  const [showReflexes, setShowReflexes] = useState(false);

  return (
    <section className="relative mt-8 sm:mt-10 overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B2545] via-[#10345E] to-[#0B2545] text-white p-4 sm:p-8 shadow-2xl border border-sky-400/25">
      {/* ── STYLES D'ANIMATION CSS DOUCE POUR L'EAU ET LA LUEUR ── */}
      <style>{`
        @keyframes gentleGlow {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.65; transform: scale(1.05); }
        }
        @keyframes waveFloat {
          0% { transform: translateX(0) translateZ(0) scaleY(1); }
          50% { transform: translateX(-25%) translateZ(0) scaleY(0.85); }
          100% { transform: translateX(-50%) translateZ(0) scaleY(1); }
        }
        .anim-gentle-glow {
          animation: gentleGlow 6s ease-in-out infinite;
        }
        .anim-wave {
          animation: waveFloat 22s linear infinite;
        }
      `}</style>

      {/* Cercles de lueur atmosphérique */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-sky-400/15 rounded-full blur-3xl pointer-events-none anim-gentle-glow" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-red-600/15 rounded-full blur-3xl pointer-events-none anim-gentle-glow" style={{ animationDelay: '3s' }} />

      {/* Vague décorative animée en fond */}
      <div className="absolute -bottom-2 left-0 right-0 h-16 opacity-15 pointer-events-none overflow-hidden">
        <svg
          className="anim-wave w-[200%] h-full"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M0,0 C150,90 350,-40 500,50 C650,140 900,10 1200,60 L1200,120 L0,120 Z" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
        {/* ── 1. GAUCHE : MESSAGE D'ENGAGEMENT ET SENTINELLE ── */}
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-sky-200 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>COMMUNAUTÉ & RÉACTEUR DE SÉCURITÉ CIVILE</span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight">
            Ensemble, protégeons <span className="text-sky-300">Thiaroye-sur-Mer</span> des inondations
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-sky-100/90 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Face aux eaux de ruissellement et aux montées pluviales, la solidarité communautaire et les bons réflexes sauvent des vies. Restez vigilants et connectés aux services de secours.
          </p>

          {/* ── 2. CENTRE : 3 CHIFFRES CLÉS FACTUELS (SANS PROMESSE DE DÉLAI) ── */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-5 max-w-lg mx-auto lg:mx-0">
            {/* Chiffre 1 */}
            <div className="p-2 sm:p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center transition-transform hover:scale-105">
              <span className="text-base sm:text-2xl font-black text-white block">4</span>
              <span className="text-[10px] sm:text-xs font-semibold text-sky-200 block mt-0.5 leading-tight">
                Bassins sous surveillance
              </span>
            </div>

            {/* Chiffre 2 */}
            <div className="p-2 sm:p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center transition-transform hover:scale-105">
              <span className="text-base sm:text-2xl font-black text-emerald-300 block">18</span>
              <span className="text-[10px] sm:text-xs font-semibold text-sky-200 block mt-0.5 leading-tight">
                Relais & Sentinelles mobilisés
              </span>
            </div>

            {/* Chiffre 3 : FACTUEL (24/7 au lieu des 15min comme demandé) */}
            <div className="p-2 sm:p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center transition-transform hover:scale-105">
              <span className="text-base sm:text-2xl font-black text-amber-300 block">24/7</span>
              <span className="text-[10px] sm:text-xs font-semibold text-sky-200 block mt-0.5 leading-tight">
                Veille continue & alertes directes
              </span>
            </div>
          </div>
        </div>

        {/* ── 3. DROITE : 2 BOUTONS D'ACTION RAPIDE VITALES ── */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto flex-shrink-0">
          {/* Bouton 1 : Numéros d'urgence */}
          <button
            type="button"
            onClick={() => setShowNumeros(true)}
            className="group px-5 py-3.5 rounded-2xl bg-[#CC131A] hover:bg-red-700 text-white text-xs sm:text-sm font-black shadow-xl hover:shadow-red-600/30 transition-all active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer border border-red-400/40"
          >
            <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <PhoneCall size={16} className="text-white animate-bounce" />
            </span>
            <div className="text-left">
              <span className="block font-black leading-tight">Numéros d’Urgence 24/7</span>
              <span className="block text-[11px] font-medium text-red-100">Pompiers 18 · ONAS · SAMU</span>
            </div>
            <ChevronRight size={16} className="ml-auto opacity-70 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Bouton 2 : 5 Réflexes vitaux */}
          <button
            type="button"
            onClick={() => setShowReflexes(true)}
            className="group px-5 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-black backdrop-blur-md transition-all active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer border border-white/25 shadow-md"
          >
            <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <BookOpen size={16} className="text-sky-200" />
            </span>
            <div className="text-left">
              <span className="block font-black leading-tight">5 Réflexes de Sécurité</span>
              <span className="block text-[11px] font-medium text-sky-200">Consignes vitales en cas d’inondation</span>
            </div>
            <ChevronRight size={16} className="ml-auto opacity-70 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── MODALE 1 : NUMÉROS D'URGENCE DU SÉNÉGAL (THIAROYE / PIKINE) ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <EmergencyModal isOpen={showNumeros} onClose={() => setShowNumeros(false)} />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── MODALE 2 : 5 RÉFLEXES VITAUX EN CAS D'INONDATION ───────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showReflexes && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/75 backdrop-blur-sm transition-opacity"
          onClick={() => setShowReflexes(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl md:max-w-2xl bg-white dark:bg-[#071322] rounded-3xl overflow-hidden shadow-2xl border border-navy-100 dark:border-navy-800 text-navy-900 dark:text-white flex flex-col max-h-[85vh] max-h-[85dvh] my-auto animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Header modale */}
            <div className="p-4 sm:p-5 border-b border-navy-100 dark:border-navy-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-xs">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black">5 Réflexes de Sécurité Inondation</h3>
                  <p className="text-xs text-navy-500 dark:text-navy-400">Consignes prioritaires pour protéger votre famille</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowReflexes(false)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-200 flex items-center justify-center hover:bg-navy-200 dark:hover:bg-navy-700 active:scale-95 transition cursor-pointer flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Liste des 5 réflexes avec défilement fluide sans coupure */}
            <div className="p-4 sm:p-5 overflow-y-auto overscroll-contain space-y-3.5 flex-1 min-h-0">
              {REFLEXES_VITAUX.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.numero}
                    className="p-4 rounded-2xl bg-navy-50/60 dark:bg-white/5 border border-navy-100 dark:border-navy-800 flex items-start gap-3.5"
                  >
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 font-black text-sm ${item.color}`}>
                      <IconComponent size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-navy-900 dark:bg-white text-white dark:text-navy-900 text-[11px] font-black flex items-center justify-center">
                          {item.numero}
                        </span>
                        <h4 className="text-sm font-black text-navy-900 dark:text-white">
                          {item.titre}
                        </h4>
                      </div>
                      <p className="text-xs text-navy-600 dark:text-navy-300 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer modale avec flex-shrink-0 garanti pour iPad Mini */}
            <div className="p-3.5 sm:p-4 border-t border-navy-100 dark:border-navy-800 bg-navy-50/50 dark:bg-black/20 text-center flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowReflexes(false)}
                className="w-full py-2.5 sm:py-3 rounded-xl bg-navy-900 dark:bg-white text-white dark:text-navy-900 text-xs sm:text-sm font-bold hover:opacity-90 active:scale-95 transition cursor-pointer shadow-xs"
              >
                J'ai compris ces réflexes
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
