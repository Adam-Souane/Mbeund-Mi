import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  MapPin,
  Compass,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

export const NUMEROS_URGENCE_OFFICIELS = [
  {
    nom: 'Sapeurs-Pompiers (BNSP)',
    numero: '18',
    tel: '18',
    description: 'Secours d’urgence, sauvetage et évacuations de personnes',
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
    description: 'Urgences médicales, blessés et assistance vitale',
    badge: '24h/24',
    icon: ShieldAlert,
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    badgeStyle: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
  },
  {
    nom: 'Police / Commissariat Thiaroye',
    numero: '17',
    tel: '17',
    description: 'Sécurité publique, circulation et périmètres de danger',
    badge: 'Urgence',
    icon: ShieldCheck,
    iconBg: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
    badgeStyle: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300',
  },
  {
    nom: 'Mairie de Thiaroye-sur-Mer',
    numero: '+221 33 834 00 00',
    tel: '+221338340000',
    description: 'Cellule communale de veille et gestion des sinistrés',
    badge: 'Mairie',
    icon: PhoneCall,
    iconBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    badgeStyle: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  },
];

export default function EmergencyModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [copiedNumber, setCopiedNumber] = useState(null);
  const [copiedGps, setCopiedGps] = useState(false);

  // Coordonnées de détresse de référence (Fass Thiaroye-sur-Mer)
  const coordsTexte = 'Fass Rue 12 · Thiaroye-sur-Mer (14.7491° N, 17.3789° O)';

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

  const handleCopyGps = () => {
    navigator.clipboard?.writeText(coordsTexte);
    setCopiedGps(true);
    setTimeout(() => setCopiedGps(false), 2500);
  };

  const handleAllerRefuge = () => {
    onClose();
    navigate('/citoyen/carte?refugeId=refuge-1');
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/80 backdrop-blur-md transition-opacity"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg md:max-w-2xl bg-white dark:bg-[#071322] rounded-3xl overflow-hidden shadow-2xl border border-red-500/30 text-navy-900 dark:text-white flex flex-col max-h-[88vh] max-h-[88dvh] my-auto animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header modale avec badge d'alerte vitale */}
        <div className="p-4 sm:p-5 border-b border-navy-100 dark:border-navy-800 flex items-center justify-between flex-shrink-0 bg-red-600/10 dark:bg-red-950/30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-900/40">
              <PhoneCall size={20} className="animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 id="emergency-modal-title" className="text-base sm:text-lg font-black text-navy-900 dark:text-white truncate">
                  SOS & Numéros d’Urgence 24/7
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white font-extrabold uppercase">
                  Prioritaire
                </span>
              </div>
              <p className="text-xs text-navy-500 dark:text-navy-400 truncate">
                Protection Civile, Secours d'Urgence & Refuges Thiaroye
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

        {/* Bloc 1 : Coordonnées GPS immédiates à dicter au standardiste */}
        <div className="px-4 sm:px-5 pt-3.5 pb-2 flex-shrink-0">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-start gap-2.5 min-w-0">
              <MapPin size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-700 dark:text-amber-400 block">
                  À dicter aux secours lors de votre appel :
                </span>
                <p className="font-bold text-navy-900 dark:text-white truncate">
                  {coordsTexte}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyGps}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-bold transition flex items-center gap-1.5 self-end sm:self-center cursor-pointer shrink-0"
              title="Copier les coordonnées pour les partager par SMS ou message"
            >
              {copiedGps ? (
                <>
                  <Check size={13} className="text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Copié</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copier</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bloc 2 : Refuge le plus proche à pied avec bouton d'évacuation direct */}
        <div className="px-4 sm:px-5 pb-2 flex-shrink-0">
          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Compass size={18} className="text-blue-500 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-black tracking-wider text-blue-700 dark:text-blue-400 block">
                  Refuge officiel le plus proche :
                </span>
                <p className="font-bold text-navy-900 dark:text-white truncate">
                  CEM Thiaroye Gare <span className="font-medium text-navy-500 dark:text-navy-300">· 450 m (6 min à pied hors eau)</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAllerRefuge}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs transition flex items-center gap-1.5 self-end sm:self-center cursor-pointer shrink-0 shadow-sm shadow-blue-600/30"
            >
              <span>Suivre l'itinéraire</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Liste des numéros avec défilement fluide */}
        <div className="p-4 sm:px-5 sm:py-3 overflow-y-auto overscroll-contain space-y-2.5 flex-1 min-h-0">
          {NUMEROS_URGENCE_OFFICIELS.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                className="p-3 sm:p-3.5 rounded-2xl bg-navy-50/70 dark:bg-white/5 border border-navy-100 dark:border-navy-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition hover:border-red-200 dark:hover:border-red-900/50 hover:shadow-xs"
              >
                {/* Informations du service */}
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs ${item.iconBg}`}>
                    <IconComp size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-navy-900 dark:text-white">
                        {item.nom}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${item.badgeStyle}`}>
                        {item.badge}
                      </span>
                    </div>

                    <p className="text-xs text-navy-500 dark:text-navy-400 mt-0.5 leading-tight">
                      {item.description}
                    </p>

                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-base sm:text-lg font-mono font-black text-[#CC131A] dark:text-red-400 tracking-wider">
                        {item.numero}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Boutons d'action : Copier et Appeler */}
                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={(e) => handleCopy(item.numero, e)}
                    title="Copier le numéro dans le presse-papiers"
                    className="h-9 px-3 rounded-xl border border-navy-200 dark:border-navy-700 hover:bg-navy-100 dark:hover:bg-navy-800 text-navy-700 dark:text-navy-200 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    {copiedNumber === item.numero ? (
                      <>
                        <Check size={13} className="text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Copié</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copier</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`tel:${item.tel}`}
                    className="h-9 px-3.5 rounded-xl bg-[#CC131A] hover:bg-red-700 active:scale-95 text-white text-xs sm:text-sm font-black flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Phone size={13} />
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
            className="w-full py-2.5 rounded-xl bg-navy-900 dark:bg-white text-white dark:text-navy-900 text-xs sm:text-sm font-bold hover:opacity-90 active:scale-95 transition cursor-pointer shadow-xs"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
