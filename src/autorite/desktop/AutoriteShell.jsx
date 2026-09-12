import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, CloudRain, Camera, BarChart3, ShieldAlert, Settings, PhoneCall } from 'lucide-react';
import Logo from '../../shared/components/Logo';
import ThemeToggle from '../../theme/ThemeToggle';
import { useAuth } from '../../auth/AuthContext';

const NAV_ITEMS = [
  { to: '/autorite/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/autorite/carte', label: 'Carte interactive', icon: Map },
  { to: '/autorite/previsions', label: 'Prévisions & alertes', icon: CloudRain },
  { to: '/autorite/signalements', label: 'Signalements terrain', icon: Camera },
  { to: '/autorite/statistiques', label: 'Statistiques', icon: BarChart3 },
  { to: '/autorite/crise', label: 'Gestion de crise', icon: ShieldAlert },
  { to: '/autorite/capteurs', label: 'Admin & capteurs', icon: Settings },
  { to: '/autorite/contact', label: 'Contact & urgence', icon: PhoneCall },
];

/**
 * Coquille commune à toutes les pages autorité : en-tête + navigation
 * latérale persistante (les 8 sections définies dans le prototype d'origine,
 * `src/components/layout/Sidebar.jsx`). Chaque page ne fournit plus que son
 * propre contenu, plus de header dupliqué par page.
 */
export default function AutoriteShell({ children }) {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-navy-50 dark:bg-navy-950 text-navy dark:text-navy-50 flex flex-col">
      <div className="bg-white dark:bg-navy border-b border-navy-50 dark:border-navy-800 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-7 py-4">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={logout} className="text-sm font-semibold text-red border-[1.5px] border-red rounded-md px-4 py-2">
              Se déconnecter
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl w-full mx-auto flex gap-6 px-7 py-6 items-start">
        <nav className="w-60 flex-shrink-0 flex flex-col gap-1 sticky top-6">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3.5 py-2.5 rounded-md text-sm font-semibold transition-colors ${
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
        </nav>

        <main className="flex-1 min-w-0 flex flex-col gap-5">{children}</main>
      </div>
    </div>
  );
}
