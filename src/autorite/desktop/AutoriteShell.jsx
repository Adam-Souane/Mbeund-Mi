import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, CloudRain, Camera, BarChart3, ShieldAlert, Settings, PhoneCall, Users2, TrendingUp, Activity, UserPlus, MoreVertical, ChevronDown, Download } from 'lucide-react';
import Logo from '../../shared/components/Logo';
import ThemeToggle from '../../theme/ThemeToggle';
import NotificationCenter from '../../shared/components/NotificationCenter';
import { useAuth } from '../../auth/AuthContext';
import { hasPageAccess } from '../../auth/RequireAuth';

const SIDEBAR_ITEMS = [
  { to: '/autorite/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, pageKey: 'dashboard' },
  { to: '/autorite/carte', label: 'Carte interactive', icon: Map, pageKey: 'carte' },
  { to: '/autorite/previsions', label: 'Prévisions & alertes', icon: CloudRain, pageKey: 'alertes' },
  { to: '/autorite/signalements', label: 'Signalements terrain', icon: Camera, pageKey: 'alertes' },
  { to: '/autorite/crise', label: 'Gestion de crise', icon: ShieldAlert, pageKey: 'alertes' },
];

const TOOLS_ITEMS = [
  { to: '/autorite/statistiques', label: 'Statistiques', icon: BarChart3, pageKey: 'dashboard' },
  { to: '/autorite/fiabilite', label: 'Fiabilité du modèle', icon: TrendingUp, pageKey: 'fiabilite' },
  { to: '/autorite/backtesting', label: 'Backtesting', icon: Activity, pageKey: 'backtesting' },
  { to: '/autorite/capteurs', label: 'Admin & capteurs', icon: Settings, pageKey: 'admin-capteurs' },
  { to: '/autorite/export', label: 'Exports & Rapports', icon: Download, pageKey: 'dashboard' },
];

const MORE_ITEMS = [
  { to: '/autorite/registre', label: 'Registre communautaire', icon: Users2, pageKey: 'dashboard' },
  { to: '/autorite/contact', label: 'Contact & urgence', icon: PhoneCall, pageKey: 'dashboard' },
];

// Filtrer les items selon les permissions du rôle
function filterItemsByRole(items, role) {
  return items.filter(item => {
    if (!item.pageKey) return true; // Afficher si pas de restriction
    return hasPageAccess(role, item.pageKey);
  });
}

function DropdownMenu({ label, icon: Icon, items, children, role }) {
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

  // Filtrer les items selon les permissions
  const filteredItems = role ? filterItemsByRole(items || [], role) : items;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-semibold text-navy-600 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 transition-colors"
      >
        {Icon && <Icon size={16} />}
        {label}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-lg shadow-lg z-50">
          {children || filteredItems?.map(({ to, label, icon: ItemIcon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-navy dark:bg-navy-800 text-white'
                    : 'text-navy-600 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800'
                }`
              }
            >
              <ItemIcon size={14} />
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileMenu({ isAdmin, logout }) {
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-md text-navy-600 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 transition-colors"
      >
        <Settings size={18} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-lg shadow-lg z-50">
          {isAdmin && (
            <NavLink
              to="/autorite/authorities"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-navy dark:bg-navy-800 text-white'
                    : 'text-navy-600 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800'
                }`
              }
            >
              <UserPlus size={14} />
              Gérer les autorités
            </NavLink>
          )}
          <button
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-red hover:bg-red-50 dark:hover:bg-red/10 transition-colors text-left border-t border-navy-50 dark:border-navy-800"
          >
            <PhoneCall size={14} />
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
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    }
    if (moreOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moreOpen]);

  // Filtrer les items selon les permissions du rôle
  const filteredSidebarItems = filterItemsByRole(SIDEBAR_ITEMS, role);
  const filteredMoreItems = filterItemsByRole(MORE_ITEMS, role);

  return (
    <div className="min-h-screen bg-navy-50 dark:bg-navy-950 text-navy dark:text-navy-50 flex flex-col">
      <div className="bg-white dark:bg-navy border-b border-navy-50 dark:border-navy-800 flex-shrink-0">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-7 py-4">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            <DropdownMenu label="Outils" icon={BarChart3} items={TOOLS_ITEMS} role={role} />
            <NotificationCenter />
            <ThemeToggle />
            <ProfileMenu isAdmin={isAdmin} logout={logout} />
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[1600px] w-full mx-auto flex gap-6 px-7 py-6 items-start">
        <nav className="w-60 flex-shrink-0 flex flex-col gap-1 sticky top-6">
          {filteredSidebarItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3.5 py-2.5 rounded-md text-lg font-semibold transition-colors ${
                  isActive
                    ? 'bg-navy dark:bg-navy-800 text-white'
                    : 'text-navy-600 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}

          {filteredMoreItems.length > 0 && (
            <div ref={moreRef} className="relative mt-2">
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-md text-base font-semibold text-navy-600 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 transition-colors"
              >
                <MoreVertical size={18} />
                Plus
                <ChevronDown size={16} className={`ml-auto transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
              </button>

              {moreOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-lg shadow-lg z-50">
                  {filteredMoreItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setMoreOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3.5 py-2.5 text-base font-semibold transition-colors ${
                          isActive
                            ? 'bg-navy dark:bg-navy-800 text-white'
                            : 'text-navy-600 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800'
                        }`
                      }
                    >
                      <Icon size={16} />
                      {label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        <main className="flex-1 min-w-0 flex flex-col gap-5">{children}</main>
      </div>
    </div>
  );
}
