import { Link } from 'react-router-dom';
import { CloudRain, Camera, ShieldCheck, ArrowRight, PhoneCall, Sparkles } from 'lucide-react';

export default function ParcoursActionCitoyenne() {
  const steps = [
    {
      num: '01',
      title: 'Anticiper',
      subtitle: 'Surveillance & Alertes',
      desc: 'Consultez la pluviométrie en direct et le niveau des canaux d’évacuation de Thiaroye-sur-Mer.',
      to: '/citoyen/alertes',
      actionText: 'Voir la météo',
      icon: CloudRain,
      accentColor: 'blue',
      themeClasses: {
        circle: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-400/30 group-hover:bg-blue-600 group-hover:text-white',
        tag: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50',
        hoverBorder: 'group-hover:border-blue-400/50',
      },
    },
    {
      num: '02',
      title: 'Alerter',
      subtitle: 'Entraide & Signalement',
      desc: 'Prenez une photo en 30 secondes pour prévenir instantanément vos voisins et mobiliser l’ONAS.',
      to: '/citoyen/signaler',
      actionText: 'Faire un signalement',
      icon: Camera,
      accentColor: 'red',
      themeClasses: {
        circle: 'bg-red-500/10 dark:bg-red-500/20 text-[#CC131A] dark:text-red-300 border-red-400/30 group-hover:bg-[#CC131A] group-hover:text-white',
        tag: 'text-[#CC131A] dark:text-red-400 bg-red-50 dark:bg-red-950/50',
        hoverBorder: 'group-hover:border-red-400/50',
      },
    },
    {
      num: '03',
      title: 'Protéger',
      subtitle: 'Sécurité & Réflexes 72h',
      desc: 'Positionnez les sacs de sable, mettez les papiers à l’abri et contactez les pompiers au 18.',
      href: 'tel:18',
      actionText: 'Urgence pompiers (18)',
      icon: PhoneCall,
      accentColor: 'emerald',
      themeClasses: {
        circle: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-400/30 group-hover:bg-emerald-600 group-hover:text-white',
        tag: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50',
        hoverBorder: 'group-hover:border-emerald-400/50',
      },
    },
  ];

  return (
    <div className="py-2">
      {/* En-tête fluide sans boîte fermée */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#CC131A] animate-ping" />
          <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-navy-800 dark:text-navy-100 flex items-center gap-2">
            <span>Votre parcours citoyen à Thiaroye-sur-Mer</span>
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          3 gestes essentiels pour protéger votre quartier
        </span>
      </div>

      {/* Grille fluide connectée par une ligne visuelle */}
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Ligne connectrice décorative en arrière-plan (visible sur desktop) */}
        <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-blue-300/40 via-red-300/40 to-emerald-300/40 dark:from-blue-700/30 dark:via-red-700/30 dark:to-emerald-700/30 -z-0" />

        {steps.map((step) => {
          const Icon = step.icon;
          const Component = step.to ? Link : 'a';
          const props = step.to ? { to: step.to } : { href: step.href };

          return (
            <Component
              key={step.num}
              {...props}
              className={`group relative z-10 flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-navy-900/40 backdrop-blur-xs border border-slate-200/80 dark:border-navy-800 hover:bg-white dark:hover:bg-navy-800/80 hover:shadow-lg transition-all duration-300 ${step.themeClasses.hoverBorder}`}
            >
              {/* Rangée supérieure : Cercle icône vibrant + Numéro d'étape */}
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all duration-300 shadow-xs group-hover:scale-105 ${step.themeClasses.circle}`}
                >
                  <Icon size={20} />
                </div>
                <span className="text-xs font-black tracking-widest text-slate-400 dark:text-slate-500 font-mono">
                  Étape {step.num}
                </span>
              </div>

              {/* Titre et description de l'étape */}
              <div className="space-y-1 mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-navy-900 dark:text-white group-hover:text-[#0B2545] dark:group-hover:text-blue-300 transition-colors">
                    {step.title}
                  </h3>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${step.themeClasses.tag}`}>
                    {step.subtitle}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              {/* Action fluide en bas avec flèche dynamique */}
              <div className="pt-2 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-xs font-bold text-navy-700 dark:text-slate-200 group-hover:text-[#CC131A] transition-colors">
                <span>{step.actionText}</span>
                <ArrowRight size={14} className="transform group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Component>
          );
        })}
      </div>
    </div>
  );
}
