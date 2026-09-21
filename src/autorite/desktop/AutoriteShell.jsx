import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, CloudRain, Camera, BarChart3, ShieldAlert, Settings, PhoneCall, Users2, TrendingUp, Activity, ChevronDown } from 'lucide-react';
import Logo from '../../shared/components/Logo';
import ThemeToggle from '../../theme/ThemeToggle';
import { useAuth } from '../../auth/AuthContext';
import { useUser } from '../../auth/AuthContext';

const NAV_GROUPS = [
  {
    id: 'principal',
    label: '📊 Principal',
    items: [
      { to: '/autorite/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { to: '/autorite/carte', label: 'Carte interactive', icon: Map },
    ],
  },
  {
    id: 'alertes',
    label: '🚨 Alertes & Prévisions',
    items: [
      { to: '/autorite/previsions', label: 'Prévisions & alertes', icon: CloudRain },
      { to: '/autorite/statistiques', label: 'Statistiques', icon: BarChart3 },
    ],
  },
  {
    id: 'signalements',
    label: '📋 Signalements',
    items: [
      { to: '/autorite/signalements', label: 'Signalements terrain', icon: Camera },
      { to: '/autorite/registre', label: 'Registre communautaire', icon: Users2 },
    ],
  },
  {
    id: 'crise',
    label: '⚠️ Gestion de Crise',
    items: [
      { to: '/autorite/crise', label: 'Gestion de crise', icon: ShieldAlert },
      { to: '/autorite/contact', label: 'Contact & urgence', icon: PhoneCall },
    ],
  },
  {
    id: 'analyse',
    label: '📈 Analyse',
    items: [
      { to: '/autorite/fiabilite', label: 'Fiabilité du modèle', icon: TrendingUp },
      { to: '/autorite/backtesting', label: 'Backtesting', icon: Activity },
    ],
  },
  {
    id: 'config',
    label: '⚙️ Configuration',
    items: [
      { to: '/autorite/capteurs', label: 'Admin & capteurs', icon: Settings },
    ],
  },
];

/**
 * Coquille commune à toutes les pages autorité : en-tête + navigation
 * latérale persistante (les 8 sections définies dans le prototype d'origine,
 * `src/components/layout/Sidebar.jsx`). Chaque page ne fournit plus que son
 * propre contenu, plus de header dupliqué par page.
 */
export default function AutoriteShell({ children }) {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState(new Set(['principal', 'alertes']));

  const toggleGroup = (groupId) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const isAdmin = user?.profile?.role === 'admin';

  return (
    <div className="min-h-screen bg-navy-50 dark:bg-navy-950 text-navy dark:text-navy-50 flex flex-col">
      <div className="bg-white dark:bg-navy border-b border-navy-50 dark:border-navy-800 flex-shrink-0">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-7 py-4">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={logout} className="text-base font-semibold text-red border-[1.5px] border-red rounded-md px-4 py-2">
              Se déconnecter
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[1600px] w-full mx-auto flex gap-6 px-7 py-6 items-start">
        <nav className="w-64 flex-shrink-0 flex flex-col gap-2 sticky top-6 max-h-[calc(100vh-120px)] overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.id}>
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-sm font-bold text-navy-700 dark:text-navy-300 hover:bg-navy-50 dark:hover:bg-navy-800 transition-colors"
              >
                {group.label}
                <ChevronDown
                  size={16}
                  className={`transition-transform ${expandedGroups.has(group.id) ? 'rotate-180' : ''}`}
                />
              </button>

              {expandedGroups.has(group.id) && (
                <div className="flex flex-col gap-1 pl-2 mt-1">
                  {group.items.map(({ to, label, icon: Icon }) => (
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
                </div>
              )}
            </div>
          ))}

          {isAdmin && (
            <>
              <div className="border-t border-navy-200 dark:border-navy-700 my-2" />
              <button
                onClick={() => toggleGroup('admin')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-sm font-bold text-navy-700 dark:text-navy-300 hover:bg-navy-50 dark:hover:bg-navy-800 transition-colors"
              >
                👥 Administration
                <ChevronDown
                  size={16}
                  className={`transition-transform ${expandedGroups.has('admin') ? 'rotate-180' : ''}`}
                />
              </button>

              {expandedGroups.has('admin') && (
                <div className="flex flex-col gap-1 pl-2 mt-1">
                  <NavLink
                    to="/autorite/authorities"
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3.5 py-2.5 rounded-md text-sm font-semibold transition-colors ${
                        isActive
                          ? 'bg-navy dark:bg-navy-800 text-white'
                          : 'text-navy-600 dark:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800'
                      }`
                    }
                  >
                    <Users2 size={16} />
                    Gérer les autorités
                  </NavLink>
                </div>
              )}
            </>
          )}
        </nav>

        <main className="flex-1 min-w-0 flex flex-col gap-5">{children}</main>
      </div>
    </div>
  );
}
