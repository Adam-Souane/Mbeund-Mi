import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Users,
  Map,
  CloudRain,
  Camera,
  MessageCircle,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  PhoneCall,
} from 'lucide-react';
import Logo from '../../shared/components/Logo';
import ThemeToggle from '../../theme/ThemeToggle';
import NotificationCenter from '../../shared/components/NotificationCenter';
import EmergencyModal from '../../shared/components/EmergencyModal';
import { useAuth } from '../../auth/AuthContext';

const NAV_ITEMS = [
  { to: '/citoyen/accueil', label: 'Accueil', icon: Home },
  { to: '/citoyen/carte', label: 'Carte interactive', icon: Map },
  { to: '/citoyen/alertes', label: 'Prévisions & alertes', icon: CloudRain },
  { to: '/citoyen/signaler', label: 'Signaler', icon: Camera },
  { to: '/citoyen/communaute', label: 'Communauté', icon: Users },
  { to: '/citoyen/chat', label: 'NDAM · Assistant', icon: MessageCircle },
  { to: '/citoyen/profil', label: 'Profil', icon: User },
];

/**
 * Pendant desktop de l'expérience citoyenne :
 * - Header pleine largeur avec logo aligné sur la sidebar
 * - Sidebar bleue repliable (avec flèche vers la gauche)
 * - En mode replié : seules les icônes s'affichent, le dashboard s'élargit pour remplir tout l'espace
 * - Sticky au défilement
 */
export default function CitizenDesktopShell({ children }) {
  const { logout } = useAuth();
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  // Mémorisation de l'état replié/déplié dans le localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('mbeund_mi_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('mbeund_mi_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-navy-50 dark:bg-navy-950 text-navy dark:text-navy-50 flex flex-col">
      {/* Pop-up des Contacts d'Urgence 24/7 */}
      <EmergencyModal isOpen={emergencyOpen} onClose={() => setEmergencyOpen(false)} />

      {/* 1. Header supérieur avec Logo aligné et responsive avec l'état de la sidebar */}
      <header className="bg-white dark:bg-[#071322] border-b border-navy-100 dark:border-navy-800 flex-shrink-0 z-30 sticky top-0 transition-all duration-300">
        <div className="w-full flex items-center justify-between">
          {/* Bloc Logo : s'ajuste à la largeur de la sidebar */}
          <div
            className={`flex-shrink-0 flex items-center justify-center py-3 px-3 border-r border-navy-100 dark:border-navy-800 transition-all duration-300 ${
              isCollapsed ? 'w-20' : 'w-56'
            }`}
          >
            <Logo size={isCollapsed ? 'sm' : 'md'} />
          </div>

          {/* Reste du header sur la droite : Urgence -> Notifications -> Thème */}
          <div className="flex-1 flex items-center justify-end gap-3 px-6 lg:px-8 py-3">
            {/* Bouton Rouge Urgence */}
            <button
              type="button"
              onClick={() => setEmergencyOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-sm hover:shadow-md transition cursor-pointer"
              title="Numéros d'urgence et secours immédiats"
            >
              <PhoneCall size={15} className="animate-pulse" />
              <span>Urgence</span>
            </button>

            {/* Cloche de notifications */}
            <NotificationCenter />

            {/* Bascule Mode Clair / Sombre */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 2. Corps : Sidebar bleue pleine hauteur + Contenu principal fluide */}
      <div className="flex-1 flex w-full">
        {/* Sidebar Bleue Institutionnelle (Clair: #0B2545 / Sombre: #050D18) */}
        <aside
          className={`flex-shrink-0 bg-[#0B2545] dark:bg-[#050D18] border-r border-blue-900/60 dark:border-navy-800/80 sticky top-[65px] h-[calc(100vh-65px)] flex flex-col justify-between z-20 shadow-lg transition-all duration-300 ease-in-out ${
            isCollapsed ? 'w-20 p-2.5' : 'w-56 p-3'
          }`}
        >
          {/* Haut de la sidebar : En-tête + Bouton de repliement */}
          <div>
            <div className={`flex items-center justify-between pb-2 mb-1 border-b border-white/10 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
              {!isCollapsed && (
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-300/80">
                  Navigation
                </span>
              )}

              {/* Bouton flèche pour replier / déplier */}
              <button
                type="button"
                onClick={toggleSidebar}
                title={isCollapsed ? 'Agrandir le menu' : 'Replier le menu (gagner de l’espace)'}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition cursor-pointer shadow-2xs"
                aria-label={isCollapsed ? 'Agrandir la barre latérale' : 'Replier la barre latérale'}
              >
                {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
            </div>

            {/* Navigation haute : liens ou icônes seules */}
            <nav className="flex flex-col gap-1.5 overflow-y-auto pr-0.5 mt-2">
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  title={isCollapsed ? label : undefined}
                  className={({ isActive }) =>
                    `flex items-center rounded-xl font-bold transition-all duration-200 min-h-[46px] ${
                      isCollapsed
                        ? 'justify-center p-3'
                        : 'gap-3 px-3.5 py-3 text-[15px]'
                    } ${
                      isActive
                        ? 'bg-white dark:bg-navy-800 text-[#0B2545] dark:text-white font-black shadow-md border-l-4 border-[#CC131A]'
                        : 'text-slate-100 dark:text-slate-200 hover:text-white hover:bg-white/10 active:scale-[0.98]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={20}
                        className={`flex-shrink-0 ${
                          isActive ? 'text-[#0B2545] dark:text-white' : 'text-slate-200 dark:text-slate-300'
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{label}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Bas de la sidebar : Bouton Se déconnecter (texte ou icône seule) */}
          <div className="pt-3 border-t border-white/15 mt-auto">
            <button
              onClick={logout}
              title={isCollapsed ? 'Se déconnecter' : undefined}
              className={`w-full flex items-center justify-center rounded-xl text-sm font-bold text-white bg-red-600/20 hover:bg-red-600 border border-red-500/40 hover:border-red-600 transition-all duration-200 shadow-xs cursor-pointer active:scale-95 ${
                isCollapsed ? 'p-3' : 'gap-2.5 px-4 py-3'
              }`}
            >
              <LogOut size={18} className="flex-shrink-0" />
              {!isCollapsed && <span>Se déconnecter</span>}
            </button>
          </div>
        </aside>

        {/* Zone Principale de Contenu : prend automatiquement tout l'espace disponible */}
        <main className="flex-1 min-w-0 p-6 lg:p-8 flex flex-col gap-7 lg:gap-8 max-w-[1600px] transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
