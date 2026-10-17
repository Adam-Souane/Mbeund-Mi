import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  CloudRain,
  Camera,
  BarChart3,
  ShieldAlert,
  Settings,
  PhoneCall,
  Users2,
  TrendingUp,
  Activity,
  UserPlus,
  ChevronDown,
  Download,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import Logo from '../../shared/components/Logo';
import ThemeToggle from '../../theme/ThemeToggle';
import NotificationCenter from '../../shared/components/NotificationCenter';
import EmergencyModal from '../../shared/components/EmergencyModal';
import { useAuth } from '../../auth/AuthContext';

const SIDEBAR_ITEMS = [
  { to: '/autorite/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/autorite/carte', label: 'Carte interactive', icon: Map },
  { to: '/autorite/previsions', label: 'Prévisions & alertes', icon: CloudRain },
  { to: '/autorite/signalements', label: 'Signalements terrain', icon: Camera },
  { to: '/autorite/crise', label: 'Gestion de crise', icon: ShieldAlert },
];

const MORE_ITEMS = [
  { to: '/autorite/registre', label: 'Registre communautaire', icon: Users2 },
  { to: '/autorite/contact', label: 'Contact & urgence', icon: PhoneCall },
];

const TOOLS_ITEMS_COMMON = [
  { to: '/autorite/statistiques', label: 'Statistiques', icon: BarChart3 },
  { to: '/autorite/export', label: 'Exports & Rapports', icon: Download },
];

const TOOLS_ITEMS_ADMIN = [
  { to: '/autorite/fiabilite', label: 'Fiabilité du modèle', icon: TrendingUp },
  { to: '/autorite/backtesting', label: 'Backtesting', icon: Activity },
  { to: '/autorite/capteurs', label: 'Admin & capteurs', icon: Settings },
];

// État d'un menu déroulant, refermé par un clic en dehors de lui.
function useMenuDeroulant() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return { open, setOpen, ref };
}

function DropdownMenu({ label, icon: Icon, items }) {
  const { open, setOpen, ref } = useMenuDeroulant();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-navy-700 dark:text-navy-200 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
      >
        {Icon && <Icon size={16} />}
        <span className="hidden sm:inline">{label}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-56 bg-white dark:bg-navy-900 border border-navy-100 dark:border-navy-800 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
          {items?.map(({ to, label, icon: ItemIcon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-navy-100 dark:bg-navy-800 text-navy-900 dark:text-white font-bold'
                    : 'text-navy-600 dark:text-navy-300 hover:bg-navy-50 dark:hover:bg-navy-800/60'
                }`
              }
            >
              <ItemIcon size={15} />
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileMenu({ isAdmin, logout }) {
  const { open, setOpen, ref } = useMenuDeroulant();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        title="Paramètres & Profil"
        className="p-2 rounded-lg text-navy-700 dark:text-navy-200 hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
      >
        <Settings size={18} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-56 bg-white dark:bg-navy-900 border border-navy-100 dark:border-navy-800 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
          {isAdmin && (
            <>
              <NavLink
                to="/autorite/tracking"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-navy-100 dark:bg-navy-800 text-navy-900 dark:text-white'
                      : 'text-navy-600 dark:text-navy-300 hover:bg-navy-50 dark:hover:bg-navy-800/60'
                  }`
                }
              >
                <TrendingUp size={15} />
                Suivi des autorités
              </NavLink>
              <NavLink
                to="/autorite/authorities"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-navy-100 dark:bg-navy-800 text-navy-900 dark:text-white'
                      : 'text-navy-600 dark:text-navy-300 hover:bg-navy-50 dark:hover:bg-navy-800/60'
                  }`
                }
              >
                <UserPlus size={15} />
                Gérer les autorités
              </NavLink>
            </>
          )}
          <button
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left border-t border-navy-100 dark:border-navy-800"
          >
            <LogOut size={15} />
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}

export default function AutoriteShell({ children }) {
  const { logout, role } = useAuth();
  const isAdmin = role === 'admin';
  const location = useLocation();
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  // Mémorisation de l'état replié de la sidebar
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('mbeund_mi_autorite_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Tiroir pour les écrans mobiles / tablettes (< 1024px)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Ferme le tiroir mobile lors d'un changement de page
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('mbeund_mi_autorite_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const toolsItems = isAdmin ? [...TOOLS_ITEMS_COMMON, ...TOOLS_ITEMS_ADMIN] : TOOLS_ITEMS_COMMON;

  return (
    <div className="min-h-screen bg-navy-50 dark:bg-navy-950 text-navy dark:text-navy-50 flex flex-col">
      {/* Pop-up des Contacts d'Urgence 24/7 */}
      <EmergencyModal isOpen={emergencyOpen} onClose={() => setEmergencyOpen(false)} />

      {/* 1. Header supérieur complet & responsive : z-50 pour rester au-dessus des couches Leaflet */}
      <header className="bg-white dark:bg-[#071322] border-b border-navy-100 dark:border-navy-800 flex-shrink-0 z-50 sticky top-0 transition-all duration-300">
        <div className="w-full flex items-center justify-between">
          {/* Bloc Logo desktop : largeur synchrone avec la sidebar pour alignement parfait */}
          <div
            className={`hidden lg:flex flex-shrink-0 items-center justify-center py-3 px-3 border-r border-navy-100 dark:border-navy-800 transition-all duration-300 ${
              isCollapsed ? 'w-20' : 'w-56'
            }`}
          >
            <Logo size={isCollapsed ? 'sm' : 'md'} />
          </div>

          {/* Bouton burger mobile + Logo mobile (< 1024px) */}
          <div className="flex lg:hidden items-center gap-3 px-4 py-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-navy-100 dark:bg-navy-800 text-navy-800 dark:text-navy-100"
              aria-label="Ouvrir le menu de navigation"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Logo size="md" />
          </div>

          {/* Outils & Actions du Header */}
          <div className="flex-1 flex items-center justify-end gap-2.5 px-4 lg:px-8 py-3">
            <DropdownMenu label="Outils" icon={BarChart3} items={toolsItems} />

            {/* Bouton Rouge Urgence */}
            <button
              type="button"
              onClick={() => setEmergencyOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-sm hover:shadow-md transition cursor-pointer"
              title="Numéros d'urgence et secours immédiats"
            >
              <PhoneCall size={15} className="animate-pulse" />
              <span>Urgence</span>
            </button>

            {/* Cloche de notifications */}
            <NotificationCenter />

            {/* Bascule thème clair / sombre */}
            <ThemeToggle />

            {/* Menu profil / déconnexion */}
            <ProfileMenu isAdmin={isAdmin} logout={logout} />
          </div>
        </div>
      </header>

      {/* 2. Corps : Sidebar pleine hauteur (Mode Clair: Bleu institutionnel / Mode Sombre: Nuit intense) */}
      <div className="flex-1 flex w-full">
        {/* Backdrop pour mobile drawer */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
            aria-hidden="true"
          />
        )}

        {/* Sidebar Bureau (Sticky) + Tiroir Mobile (Drawer) */}
        <aside
          className={`bg-[#0B2545] dark:bg-[#050D18] border-r border-blue-900/60 dark:border-navy-800/80 flex flex-col justify-between shadow-lg transition-all duration-300 ease-in-out ${
            /* Version Mobile Drawer */
            mobileMenuOpen
              ? 'fixed inset-y-0 left-0 w-72 z-50 p-4 flex'
              : 'hidden'
          } lg:flex lg:sticky lg:top-[65px] lg:h-[calc(100vh-65px)] lg:z-20 ${
            /* Version Desktop repliable */
            isCollapsed ? 'lg:w-20 lg:p-2.5' : 'lg:w-56 lg:p-3'
          }`}
        >
          {/* Haut de la sidebar : Contrôle repliement + Liens de navigation */}
          <div className="flex flex-col flex-1 min-h-0">
            <div
              className={`flex items-center justify-between pb-2 mb-1 border-b border-white/10 ${
                isCollapsed ? 'justify-center' : 'px-2'
              }`}
            >
              {(!isCollapsed || mobileMenuOpen) && (
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-300/80">
                  {isAdmin ? 'Administration' : 'Espace Autorité'}
                </span>
              )}

              {/* Bouton flèche desktop pour replier/déplier */}
              <button
                type="button"
                onClick={toggleSidebar}
                title={isCollapsed ? 'Agrandir la sidebar' : 'Replier la sidebar (gagner de l’espace)'}
                className="hidden lg:flex w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white items-center justify-center transition cursor-pointer shadow-2xs"
                aria-label={isCollapsed ? 'Agrandir la barre latérale' : 'Replier la barre latérale'}
              >
                {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>

              {/* Bouton fermeture mobile */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-white hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {/* Liste des liens de navigation */}
            <nav className="flex flex-col gap-1.5 overflow-y-auto pr-0.5 mt-2 flex-1">
              {/* Liens principaux de la crise et du suivi */}
              {SIDEBAR_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  title={isCollapsed && !mobileMenuOpen ? label : undefined}
                  className={({ isActive }) =>
                    `flex items-center rounded-xl font-bold transition-all duration-200 min-h-[46px] ${
                      isCollapsed && !mobileMenuOpen
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
                          isActive
                            ? 'text-[#0B2545] dark:text-white'
                            : 'text-slate-200 dark:text-slate-300'
                        }`}
                      />
                      {(!isCollapsed || mobileMenuOpen) && <span className="truncate">{label}</span>}
                    </>
                  )}
                </NavLink>
              ))}

              {/* Séparateur pour les registres et contacts d'urgence */}
              <div className="my-2 border-t border-white/10" />

              {MORE_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  title={isCollapsed && !mobileMenuOpen ? label : undefined}
                  className={({ isActive }) =>
                    `flex items-center rounded-xl font-semibold transition-all duration-200 min-h-[42px] ${
                      isCollapsed && !mobileMenuOpen
                        ? 'justify-center p-2.5'
                        : 'gap-3 px-3.5 py-2.5 text-sm'
                    } ${
                      isActive
                        ? 'bg-white dark:bg-navy-800 text-[#0B2545] dark:text-white font-black shadow-md border-l-4 border-[#CC131A]'
                        : 'text-slate-200 dark:text-slate-300 hover:text-white hover:bg-white/10 active:scale-[0.98]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={18}
                        className={`flex-shrink-0 ${
                          isActive
                            ? 'text-[#0B2545] dark:text-white'
                            : 'text-slate-300'
                        }`}
                      />
                      {(!isCollapsed || mobileMenuOpen) && <span className="truncate">{label}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Bas de la sidebar : Bouton Se déconnecter */}
          <div className="pt-3 border-t border-white/15 mt-auto">
            <button
              onClick={logout}
              title={isCollapsed && !mobileMenuOpen ? 'Se déconnecter' : undefined}
              className={`w-full flex items-center justify-center rounded-xl text-sm font-bold text-white bg-red-600/20 hover:bg-red-600 border border-red-500/40 hover:border-red-600 transition-all duration-200 shadow-xs cursor-pointer active:scale-95 ${
                isCollapsed && !mobileMenuOpen ? 'p-3' : 'gap-2.5 px-4 py-3'
              }`}
            >
              <LogOut size={18} className="flex-shrink-0" />
              {(!isCollapsed || mobileMenuOpen) && <span>Se déconnecter</span>}
            </button>
          </div>
        </aside>

        {/* 3. Zone Principale : Pleine largeur fluide avec transition automatique */}
        <main className="flex-1 min-w-0 p-5 lg:p-8 flex flex-col gap-5 max-w-[1600px] transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
