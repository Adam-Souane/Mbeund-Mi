import { NavLink } from 'react-router-dom';
import { Home, Map, CloudRain, Camera, MessageCircle, User } from 'lucide-react';
import Logo from '../../shared/components/Logo';
import ThemeToggle from '../../theme/ThemeToggle';
import { useAuth } from '../../auth/AuthContext';

const NAV_ITEMS = [
  { to: '/citoyen/accueil', label: 'Accueil', icon: Home },
  { to: '/citoyen/carte', label: 'Carte interactive', icon: Map },
  { to: '/citoyen/alertes', label: 'Prévisions & alertes', icon: CloudRain },
  { to: '/citoyen/signaler', label: 'Signaler', icon: Camera },
  // MessageCircle (et non l'icône "vague" de la marque NDAM) — doit se lire
  // au premier coup d'œil comme "ouvre une conversation", pas comme une
  // simple icône décorative liée à l'eau.
  { to: '/citoyen/chat', label: 'NDAM · Assistant', icon: MessageCircle },
  { to: '/citoyen/profil', label: 'Profil', icon: User },
];

/**
 * Pendant desktop de l'expérience citoyenne — même gabarit que
 * AutoriteShell (en-tête + sidebar persistante) pour que l'app se présente
 * comme une vraie web app sur grand écran, en plus de sa version mobile
 * (voir CitizenShell qui choisit entre les deux selon la largeur d'écran).
 */
export default function CitizenDesktopShell({ children }) {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-navy-50 dark:bg-navy-950 text-navy dark:text-navy-50 flex flex-col">
      <div className="bg-white dark:bg-navy border-b border-navy-50 dark:border-navy-800 flex-shrink-0">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-7 py-4">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={logout} className="text-sm font-semibold text-red border-[1.5px] border-red rounded-md px-4 py-2">
              Se déconnecter
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[1600px] w-full mx-auto flex gap-6 px-7 py-6 items-start">
        <nav className="w-60 flex-shrink-0 flex flex-col gap-1 sticky top-6">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
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
        </nav>

        <main className="flex-1 min-w-0 flex flex-col gap-5">{children}</main>
      </div>
    </div>
  );
}
