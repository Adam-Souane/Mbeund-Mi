import { useState, useEffect } from 'react';
import {
  PhoneCall,
  X,
  Phone,
  Copy,
  Check,
  Flame,
  Droplets,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

export const NUMEROS_URGENCE_OFFICIELS = [
  {
    nom: 'Sapeurs-Pompiers (BNSP)',
    numero: '18',
    tel: '18',
    description: 'Secours d’urgence, sauvetage et évacuations',
    badge: 'Gratuit · 24/7',
    icon: Flame,
    iconBg: 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400',
    badgeStyle: 'bg-red-100 dark:bg-red-950/60 text-[#CC131A] dark:text-red-300',
  },
  {
    nom: 'ONAS (Assainissement & Pompage)',
    numero: '818 00 11 11',
    tel: '818001111',
    description: 'Déploiement de motopompes et curage de canaux',
    badge: 'Numéro Vert',
    icon: Droplets,
    iconBg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
    badgeStyle: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
  },
  {
    nom: 'SAMU National',
    numero: '15',
    tel: '15',
    description: 'Urgences médicales et blessés',
    badge: '24h/24',
    icon: ShieldAlert,
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    badgeStyle: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
  },
  {
    nom: 'Police / Commissariat Thiaroye',
    numero: '17',
    tel: '17',
    description: 'Sécurité publique et déviations de circulation',
    badge: 'Urgence',
    icon: ShieldCheck,
    iconBg: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
    badgeStyle: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300',
  },
  {
    nom: 'Mairie de Thiaroye-sur-Mer',
    numero: '+221 33 834 00 00',
    tel: '+221338340000',
    description: 'Comité communal de gestion des inondations',
    badge: 'Mairie',
    icon: PhoneCall,
    iconBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    badgeStyle: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  },
];

export default function EmergencyModal({ isOpen, onClose }) {
  const [copiedNumber, setCopiedNumber] = useState(null);

  // Fermer la modale avec la touche Echap
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Bloquer le scroll d'arrière-plan quand la modale est ouverte
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (numero, e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(numero.replace(/\s+/g, ''));
    setCopiedNumber(numero);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/75 backdrop-blur-sm transition-opacity"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg md:max-w-2xl bg-white dark:bg-[#071322] rounded-3xl overflow-hidden shadow-2xl border border-navy-100 dark:border-navy-800 text-navy-900 dark:text-white flex flex-col max-h-[85vh] max-h-[85dvh] my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header modale avec touch target confortable et contrasté */}
        <div className="p-4 sm:p-5 border-b border-navy-100 dark:border-navy-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-red-100 dark:bg-red-950/60 text-[#CC131A] flex items-center justify-center flex-shrink-0 shadow-xs">
              <PhoneCall size={20} className="animate-pulse" />
            </div>
            <div className="min-w-0">
              <h3 id="emergency-modal-title" className="text-base sm:text-lg font-black text-navy-900 dark:text-white truncate">
                Numéros d’Urgence Gratuits
              </h3>
              <p className="text-xs text-navy-500 dark:text-navy-400 truncate">
                Services d'intervention de Thiaroye & Dakar · 24/7
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-200 flex items-center justify-center hover:bg-navy-200 dark:hover:bg-navy-700 active:scale-95 transition cursor-pointer flex-shrink-0"
            aria-label="Fermer la fenêtre d'urgence"
          >
            <X size={18} />
          </button>
        </div>

        {/* Bannière de rappel réflexe vital immédiat */}
        <div className="px-4 sm:px-5 pt-3.5 pb-1 flex-shrink-0">
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/60 flex items-center gap-2.5">
            <Flame size={18} className="text-[#CC131A] flex-shrink-0" />
            <p className="text-xs text-red-950 dark:text-red-200 leading-snug font-medium">
              <strong className="font-black text-[#CC131A] dark:text-red-300">Danger immédiat :</strong> composez le <span className="font-mono font-black text-red-700 dark:text-red-300 underline">18</span> (Pompiers) ou le <span className="font-mono font-black text-red-700 dark:text-red-300 underline">818 00 11 11</span> (ONAS).
            </p>
          </div>
        </div>

        {/* Liste des numéros avec défilement fluide et overscroll maîtrisé pour iPad Mini */}
        <div className="p-4 sm:p-5 overflow-y-auto overscroll-contain space-y-3 flex-1 min-h-0">
          {NUMEROS_URGENCE_OFFICIELS.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                className="p-3.5 sm:p-4 rounded-2xl bg-navy-50/70 dark:bg-white/5 border border-navy-100 dark:border-navy-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition hover:border-red-200 dark:hover:border-red-900/50 hover:shadow-xs"
              >
                {/* Informations du service */}
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs ${item.iconBg}`}>
                    <IconComp size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm sm:text-base font-black text-navy-900 dark:text-white">
                        {item.nom}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase ${item.badgeStyle}`}>
                        {item.badge}
                      </span>
                    </div>

                    <p className="text-xs text-navy-500 dark:text-navy-400 mt-0.5 leading-tight">
                      {item.description}
                    </p>

                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-base sm:text-lg font-mono font-black text-[#CC131A] dark:text-red-400 tracking-wider">
                        {item.numero}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Boutons d'action : Copier (idéal iPad/tablette) et Appeler (mobile) */}
                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={(e) => handleCopy(item.numero, e)}
                    title="Copier le numéro dans le presse-papiers"
                    className="h-10 px-3 rounded-xl border border-navy-200 dark:border-navy-700 hover:bg-navy-100 dark:hover:bg-navy-800 text-navy-700 dark:text-navy-200 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs"
                  >
                    {copiedNumber === item.numero ? (
                      <>
                        <Check size={14} className="text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Copié</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copier</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`tel:${item.tel}`}
                    className="h-10 px-4 rounded-xl bg-[#CC131A] hover:bg-red-700 active:scale-95 text-white text-xs sm:text-sm font-black flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  >
                    <Phone size={14} />
                    <span>Appeler</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer modale avec bouton Fermer bien accessible */}
        <div className="p-3.5 sm:p-4 border-t border-navy-100 dark:border-navy-800 bg-navy-50/50 dark:bg-black/20 text-center flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 sm:py-3 rounded-xl bg-navy-900 dark:bg-white text-white dark:text-navy-900 text-xs sm:text-sm font-bold hover:opacity-90 active:scale-95 transition cursor-pointer shadow-xs"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
