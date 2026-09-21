import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, CloudRain, Camera, BarChart3, ShieldAlert, Settings, PhoneCall, Users2, TrendingUp, Activity, UserPlus, MoreVertical, ChevronDown } from 'lucide-react';
import Logo from '../../shared/components/Logo';
import ThemeToggle from '../../theme/ThemeToggle';
import { useAuth } from '../../auth/AuthContext';

const SIDEBAR_ITEMS = [
  { to: '/autorite/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/autorite/carte', label: 'Carte interactive', icon: Map },
  { to: '/autorite/previsions', label: 'Prévisions & alertes', icon: CloudRain },
  { to: '/autorite/signalements', label: 'Signalements terrain', icon: Camera },
  { to: '/autorite/crise', label: 'Gestion de crise', icon: ShieldAlert },
];

const TOOLS_ITEMS = [
  { to: '/autorite/statistiques', label: 'Statistiques', icon: BarChart3 },
  { to: '/autorite/fiabilite', label: 'Fiabilité du modèle', icon: TrendingUp },
  { to: '/autorite/backtesting', label: 'Backtesting', icon: Activity },
  { to: '/autorite/capteurs', label: 'Admin & capteurs', icon: Settings },
];

const MORE_ITEMS = [
  { to: '/autorite/registre', label: 'Registre communautaire', icon: Users2 },
  { to: '/autorite/contact', label: 'Contact & urgence', icon: PhoneCall },
];

function DropdownMenu({ label, icon: Icon, items, children }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const hasActivePage = items?.some(item => location.pathname === item.to);
  const initialOpen = hasActivePage;

  useEffect(() => {
    if (hasActivePage) {
      setOpen(true);
    }
  }, [hasActivePage]);

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
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-semibold transition-colors ${
          hasActivePage
            ? 'bg-navy dark:bg-navy-800 text-white'
            : 'text-navy-600 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800'
        }`}
      >
        {Icon && <Icon size={16} />}
        {label}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-lg shadow-lg z-50">
          {children || items?.map(({ to, label, icon: ItemIcon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => {
                if (isActive && !hasActivePage) {
                  setOpen(false);
                }
                return `flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-navy dark:bg-navy-800 text-white'
                    : 'text-navy-600 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800'
                }`;
              }}
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
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const isOnAdminPage = location.pathname === '/autorite/authorities';

  useEffect(() => {
    if (isOnAdminPage) {
      setOpen(true);
    }
  }, [isOnAdminPage]);

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
        className={`p-2 rounded-md transition-colors ${
          isOnAdminPage
            ? 'bg-navy dark:bg-navy-800 text-white'
            : 'text-navy-600 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800'
        }`}
      >
        <Settings size={18} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-lg shadow-lg z-50">
          {isAdmin && (
            <NavLink
              to="/autorite/authorities"
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
  const location = useLocation();
  const { logout, role } = useAuth();
  const isAdmin = role === 'admin';
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  const moreHasActivePage = MORE_ITEMS.some(item => location.pathname === item.to);

  useEffect(() => {
    if (moreHasActivePage) {
      setMoreOpen(true);
    }
  }, [moreHasActivePage]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    }
    if (moreOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moreOpen]);

  return (
    <div className="min-h-screen bg-navy-50 dark:bg-navy-950 text-navy dark:text-navy-50 flex flex-col">
      <div className="bg-white dark:bg-navy border-b border-navy-50 dark:border-navy-800 flex-shrink-0">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-7 py-4">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            <DropdownMenu label="Outils" icon={BarChart3} items={TOOLS_ITEMS} />
            <ThemeToggle />
            <ProfileMenu isAdmin={isAdmin} logout={logout} />
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[1600px] w-full mx-auto flex gap-6 px-7 py-6 items-start">
        <nav className="w-60 flex-shrink-0 flex flex-col gap-1 sticky top-6">
          {SIDEBAR_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3.5 py-2.5 rounded-md text-base font-semibold transition-colors ${
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

          <div ref={moreRef} className="relative mt-2">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-md text-sm font-semibold transition-colors ${
                moreHasActivePage
                  ? 'bg-navy dark:bg-navy-800 text-white'
                  : 'text-navy-600 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800'
              }`}
            >
              <MoreVertical size={16} />
              Plus
              <ChevronDown size={14} className={`ml-auto transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </button>

            {moreOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-navy border border-navy-50 dark:border-navy-800 rounded-lg shadow-lg z-50">
                {MORE_ITEMS.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) => {
                      if (isActive && !moreHasActivePage) {
                        setMoreOpen(false);
                      }
                      return `flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                        isActive
                          ? 'bg-navy dark:bg-navy-800 text-white'
                          : 'text-navy-600 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800'
                      }`;
                    }}
                  >
                    <Icon size={14} />
                    {label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>

        <main className="flex-1 min-w-0 flex flex-col gap-5">{children}</main>
      </div>
    </div>
  );
}
