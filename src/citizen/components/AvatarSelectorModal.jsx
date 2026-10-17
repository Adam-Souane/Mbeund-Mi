import { useState, useRef } from 'react';
import {
  X,
  Upload,
  Camera,
  ShieldCheck,
  HeartHandshake,
  Sparkles,
  Eye,
  Radio,
  Leaf,
  HardHat,
  Droplet,
  Check,
  RotateCcw,
} from 'lucide-react';

export const PHOTO_AVATARS = [
  { id: 'fatou', label: 'Fatou', src: '/images/avatar-fatou.jpg' },
  { id: 'modou', label: 'Modou', src: '/images/avatar-modou.jpg' },
  { id: 'awa', label: 'Awa', src: '/images/avatar-awa.jpg' },
  { id: 'amadou', label: 'Amadou', src: '/images/avatar-amadou.jpg' },
  { id: 'mariama', label: 'Mariama', src: '/images/avatar-mariama.jpg' },
  { id: 'ibrahima', label: 'Ibrahima', src: '/images/avatar-ibrahima.jpg' },
  { id: 'mamadou', label: 'Mamadou', src: '/images/avatar-mamadou.jpg' },
  { id: 'enfant', label: 'Jeune sentinelle', src: '/images/avatar-enfant.jpg' },
];

export const ICON_AVATARS = [
  {
    id: 'icon:shield',
    label: 'Sentinelle',
    icon: ShieldCheck,
    bg: 'bg-gradient-to-br from-blue-700 to-[#0B2545]',
    color: 'text-white',
  },
  {
    id: 'icon:heart',
    label: 'Entraide',
    icon: HeartHandshake,
    bg: 'bg-gradient-to-br from-rose-500 to-red-700',
    color: 'text-white',
  },
  {
    id: 'icon:sparkles',
    label: 'Vigilance',
    icon: Sparkles,
    bg: 'bg-gradient-to-br from-amber-400 to-orange-600',
    color: 'text-white',
  },
  {
    id: 'icon:eye',
    label: 'Observateur',
    icon: Eye,
    bg: 'bg-gradient-to-br from-cyan-600 to-blue-800',
    color: 'text-white',
  },
  {
    id: 'icon:radio',
    label: 'Relais',
    icon: Radio,
    bg: 'bg-gradient-to-br from-emerald-600 to-teal-800',
    color: 'text-white',
  },
  {
    id: 'icon:droplet',
    label: 'Pluie & Crue',
    icon: Droplet,
    bg: 'bg-gradient-to-br from-sky-500 to-indigo-700',
    color: 'text-white',
  },
  {
    id: 'icon:hardhat',
    label: 'Secours',
    icon: HardHat,
    bg: 'bg-gradient-to-br from-orange-500 to-amber-700',
    color: 'text-white',
  },
  {
    id: 'icon:leaf',
    label: 'Résilience',
    icon: Leaf,
    bg: 'bg-gradient-to-br from-emerald-500 to-green-700',
    color: 'text-white',
  },
];

/**
 * Rendu d'un avatar quelconque (photo, upload base64, icône vectorielle ou initiale de repli)
 */
export function RenderAvatar({ avatar, initial = '?', size = 'w-14 h-14', textClass = 'text-xl' }) {
  if (!avatar) {
    return (
      <div className={`${size} rounded-full bg-[#0B2545] dark:bg-navy-800 text-white flex items-center justify-center ${textClass} font-extrabold flex-shrink-0 shadow-inner`}>
        {initial}
      </div>
    );
  }

  // Si c'est une icône vectorielle prédéfinie
  if (typeof avatar === 'string' && avatar.startsWith('icon:')) {
    const iconObj = ICON_AVATARS.find((item) => item.id === avatar);
    if (iconObj) {
      const IconComponent = iconObj.icon;
      return (
        <div className={`${size} rounded-full ${iconObj.bg} ${iconObj.color} flex items-center justify-center flex-shrink-0 shadow-sm border border-white/20`}>
          <IconComponent size={24} />
        </div>
      );
    }
  }

  // Image d'URL ou Data URL d'upload
  return (
    <div className={`${size} rounded-full overflow-hidden flex-shrink-0 shadow-sm border border-navy-200 dark:border-navy-700 bg-slate-100 dark:bg-navy-900`}>
      <img
        src={avatar}
        alt="Avatar citoyen"
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
}

export default function AvatarSelectorModal({ isOpen, onClose, currentAvatar, onSelectAvatar, initial = '?' }) {
  const [selected, setSelected] = useState(currentAvatar || null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convertir en Data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setSelected(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirm = () => {
    onSelectAvatar(selected);
    onClose();
  };

  const handleReset = () => {
    setSelected(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-avatar-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-[#071322] border border-navy-100 dark:border-navy-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header modale */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-navy-100 dark:border-navy-800 flex-shrink-0">
          <div>
            <h2 id="modal-avatar-title" className="text-base font-extrabold text-navy-900 dark:text-white">
              Personnaliser votre avatar
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choisissez un avatar ou importez votre propre photo
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la modale"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corps avec défilement */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Aperçu en direct */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-navy-900/60 border border-slate-200/80 dark:border-navy-800">
            <div className="flex items-center gap-3">
              <div className="relative">
                <RenderAvatar avatar={selected} initial={initial} size="w-14 h-14" />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white dark:border-navy-900 shadow-xs">
                  <Check size={11} strokeWidth={3} />
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-navy-900 dark:text-white">Aperçu sélectionné</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {selected
                    ? selected.startsWith('data:')
                      ? 'Photo personnelle uploadée'
                      : selected.startsWith('icon:')
                      ? 'Icône stylisée Sentinelle'
                      : 'Avatar de la communauté'
                    : 'Initiale par défaut'}
                </p>
              </div>
            </div>

            {selected && (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-navy-800 transition cursor-pointer"
                title="Rétablir l'initiale par défaut"
              >
                <RotateCcw size={13} />
                <span>Réinitialiser</span>
              </button>
            )}
          </div>

          {/* Option d'upload depuis l'appareil */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-600 dark:text-navy-300">
                1. Depuis votre appareil
              </span>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-navy-700 hover:border-[#CC131A] dark:hover:border-[#CC131A] bg-slate-50/60 dark:bg-navy-900/40 text-navy-900 dark:text-white hover:text-[#CC131A] transition cursor-pointer group"
            >
              <Upload size={17} className="text-[#CC131A] group-hover:scale-110 transition" />
              <span className="text-xs font-extrabold">Uploader une photo depuis votre appareil</span>
            </button>
          </div>

          {/* Bibliothèque 1 : Avatars photos */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-600 dark:text-navy-300">
                2. Bibliothèque de portraits citoyens
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
              {PHOTO_AVATARS.map((photo) => {
                const isCurrent = selected === photo.src;
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setSelected(photo.src)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition cursor-pointer group ${
                      isCurrent
                        ? 'bg-red-50 dark:bg-red-950/40 ring-2 ring-[#CC131A]'
                        : 'hover:bg-slate-100 dark:hover:bg-navy-900'
                    }`}
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-slate-200 dark:border-navy-700 group-hover:scale-105 transition shadow-xs">
                      <img
                        src={photo.src}
                        alt={photo.label}
                        className="w-full h-full object-cover"
                      />
                      {isCurrent && (
                        <div className="absolute inset-0 bg-[#CC131A]/30 flex items-center justify-center text-white">
                          <Check size={16} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-navy-800 dark:text-slate-200 truncate w-full text-center">
                      {photo.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bibliothèque 2 : Avatars icônes stylisés */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-600 dark:text-navy-300">
                3. Bibliothèque d'icônes Sentinelles
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
              {ICON_AVATARS.map((item) => {
                const isCurrent = selected === item.id;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelected(item.id)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition cursor-pointer group ${
                      isCurrent
                        ? 'bg-red-50 dark:bg-red-950/40 ring-2 ring-[#CC131A]'
                        : 'hover:bg-slate-100 dark:hover:bg-navy-900'
                    }`}
                  >
                    <div className={`relative w-12 h-12 rounded-full ${item.bg} ${item.color} flex items-center justify-center border-2 border-white/20 group-hover:scale-105 transition shadow-xs`}>
                      <IconComponent size={22} />
                      {isCurrent && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#CC131A] text-white flex items-center justify-center shadow-xs">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-navy-800 dark:text-slate-200 truncate w-full text-center">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pied de modale : Validation */}
        <div className="px-5 py-3.5 border-t border-navy-100 dark:border-navy-800 flex items-center justify-end gap-2.5 flex-shrink-0 bg-slate-50/70 dark:bg-navy-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-navy-800 transition cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-[#CC131A] hover:bg-[#b01016] shadow-md transition cursor-pointer active:scale-95"
          >
            Enregistrer cet avatar
          </button>
        </div>
      </div>
    </div>
  );
}
