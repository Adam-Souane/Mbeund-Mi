import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  Droplets,
  Flame,
  ShieldCheck,
  MapPin,
  Clock,
  ExternalLink,
  X,
  Eye,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';

const LIVE_RUELLES_ITEMS = [
  {
    id: 'live-1',
    quartier: 'Ndakhane (Thiaroye)',
    ruelle: 'Ruelle 4 Cuvette Basse',
    type: 'curage',
    typeLabel: 'Curage terminé',
    statutBadge: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-500',
    },
    message: 'Caniveau dégagé sur 120m par le comité de quartier. Écoulement pluvial fluide.',
    photo: '/images/curage-caniveau-sable-thiaroye.jpg',
    time: 'Il y a 12 min',
    icon: CheckCircle2,
    badgeColor: '#10B981',
  },
  {
    id: 'live-2',
    quartier: 'Thiaroye Plage',
    ruelle: 'Axe Débarcadère Côtier',
    type: 'pompage',
    typeLabel: 'Pompage actif (ONAS)',
    statutBadge: {
      bg: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
      dot: 'bg-sky-500',
    },
    message: 'Motopompe de forte puissance déployée. La marre centrale est absorbée à 85%.',
    photo: '/images/pompage-motopompe-thiaroye.jpg',
    time: 'Il y a 24 min',
    icon: Droplets,
    badgeColor: '#0284C7',
  },
  {
    id: 'live-3',
    quartier: 'Thiaroye Gare',
    ruelle: 'Rue 10 Marché',
    type: 'circulation',
    typeLabel: 'Voie sécurisée',
    statutBadge: {
      bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      dot: 'bg-amber-500',
    },
    message: 'Retrait des parpaings instables. Passage piétonnier et commerces entièrement accessibles.',
    photo: '/images/ruelle-thiaroye.jpg',
    time: 'Il y a 38 min',
    icon: ShieldCheck,
    badgeColor: '#F59E0B',
  },
  {
    id: 'live-4',
    quartier: 'Sam Sam 2',
    ruelle: 'Ruelle des Puits',
    type: 'solidarite',
    typeLabel: 'Digue citoyenne',
    statutBadge: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-500',
    },
    message: 'Pose de sacs de sable en amont pour protéger 4 concessions vulnérables.',
    photo: '/images/curage-caniveau-sable-thiaroye.jpg',
    time: 'Il y a 55 min',
    icon: CheckCircle2,
    badgeColor: '#10B981',
  },
  {
    id: 'live-5',
    quartier: 'Tally Diallo',
    ruelle: 'Bassin Sud',
    type: 'bassin',
    typeLabel: 'Niveau d’eau stabilisé',
    statutBadge: {
      bg: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
      dot: 'bg-teal-500',
    },
    message: 'Niveau d’eau mesuré à 38% de capacité. Déversoir fonctionnel sans reflux.',
    photo: '/images/pompage-motopompe-thiaroye.jpg',
    time: 'Il y a 1h 10',
    icon: Droplets,
    badgeColor: '#0D9488',
  },
];

export default function RubanLiveRuelles() {
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef(null);

  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full my-3">
      {/* ── Conteneur Principal du Ruban Live ── */}
      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#071322] border border-slate-200 dark:border-navy-800/90 shadow-sm overflow-hidden p-3 sm:p-4">
        {/* En-tête du Ruban */}
        <div className="flex items-center justify-between gap-3 mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <div className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#CC131A] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#CC131A]"></span>
            </div>
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-navy-950 dark:text-white flex items-center gap-1.5">
              <span>Le Fil Live des Ruelles</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/50 text-[#CC131A] dark:text-red-300 border border-red-200 dark:border-red-900/60 hidden sm:inline-block">
                En direct
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="text-[11px] hidden md:inline">Survolez pour figer · Cliquez pour voir le détail</span>
            <div className="flex items-center gap-1 ml-1">
              <button
                type="button"
                onClick={() => handleScroll('left')}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-navy-800 dark:text-slate-200 flex items-center justify-center transition cursor-pointer"
                aria-label="Faire défiler vers la gauche"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-navy-800 dark:text-slate-200 flex items-center justify-center transition cursor-pointer"
                aria-label="Faire défiler vers la droite"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Défilement horizontal fluide des pastilles d'activité */}
        <div
          ref={scrollContainerRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1 scroll-smooth"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {LIVE_RUELLES_ITEMS.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="group flex-shrink-0 flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900/60 border border-slate-200/90 dark:border-navy-800 hover:border-red-300 dark:hover:border-red-700 hover:bg-white dark:hover:bg-navy-900 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md max-w-[320px] sm:max-w-[360px]"
                style={{ scrollSnapAlign: 'start' }}
              >
                {/* Photo miniature */}
                <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-slate-200 dark:bg-navy-800 flex-shrink-0 border border-slate-200 dark:border-navy-700">
                  <img
                    src={item.photo}
                    alt={item.ruelle}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <span
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white"
                    style={{ backgroundColor: item.badgeColor }}
                  />
                </div>

                {/* Textes et Statut */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-xs font-black text-navy-950 dark:text-white truncate group-hover:text-[#CC131A] transition-colors">
                      {item.ruelle}
                    </span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 flex-shrink-0 font-medium">
                      {item.time}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${item.statutBadge.bg}`}
                    >
                      <IconComponent size={10} />
                      <span className="truncate">{item.typeLabel}</span>
                    </span>
                    <span className="text-slate-600 dark:text-slate-300 truncate font-semibold">· {item.quartier}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MODALE DÉTAIL DE L'ACTIVITÉ Ruelle (Au clic sur une pastille) ── */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedItem(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-[#071322] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-navy-700 animate-in zoom-in-95 duration-200"
          >
            {/* Image d'observation */}
            <div className="relative w-full h-56 bg-slate-900 overflow-hidden">
              <img
                src={selectedItem.photo}
                alt={selectedItem.ruelle}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition cursor-pointer"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>

              <div className="absolute bottom-3 left-4 right-4 text-white">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border mb-1.5 shadow-sm ${selectedItem.statutBadge.bg}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedItem.statutBadge.dot}`} />
                  {selectedItem.typeLabel}
                </span>
                <h3 className="text-lg font-black text-white leading-tight">
                  {selectedItem.ruelle}
                </h3>
                <p className="text-xs text-slate-200 flex items-center gap-1.5 mt-0.5">
                  <MapPin size={12} className="text-[#CC131A]" />
                  <span>{selectedItem.quartier}</span>
                  <span>·</span>
                  <Clock size={12} />
                  <span>{selectedItem.time}</span>
                </p>
              </div>
            </div>

            {/* Corps descriptif */}
            <div className="p-5 space-y-4">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Point de situation citoyen
                </h4>
                <p className="text-sm text-navy-900 dark:text-slate-100 leading-relaxed font-medium">
                  {selectedItem.message}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItem(null);
                    navigate(`/citoyen/carte?quartier=${encodeURIComponent(selectedItem.quartier)}`);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#CC131A] hover:bg-red-700 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-98"
                >
                  <MapPin size={14} />
                  <span>Localiser ce secteur sur la Carte</span>
                  <ExternalLink size={12} className="opacity-80" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 dark:hover:bg-navy-700 transition cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
