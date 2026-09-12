import { NavLink } from 'react-router-dom';
import { Home, Map, Camera, Waves, User } from 'lucide-react';

const SIDE_ITEMS_LEFT = [
  { to: '/citoyen/accueil', label: 'Accueil', icon: Home },
  { to: '/citoyen/carte', label: 'Carte', icon: Map },
];

const SIDE_ITEMS_RIGHT = [
  { to: '/citoyen/chat', label: 'NDAM', icon: Waves },
  { to: '/citoyen/profil', label: 'Profil', icon: User },
];

function TabLink({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-1 flex-1 py-2 text-[11px] font-semibold ${
          isActive ? 'text-red' : 'text-navy-400'
        }`
      }
    >
      <Icon size={19} />
      {label}
    </NavLink>
  );
}

/**
 * Barre d'onglets persistante de l'expérience mobile citoyenne — visible sur
 * toutes les pages (voir CitizenShell), avec "Signaler" mis en avant au
 * centre (bouton surélevé), le geste le plus fréquent pour un citoyen.
 */
export default function BottomTabBar() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-navy border-t border-navy-50 dark:border-navy-800 flex items-stretch max-w-3xl mx-auto lg:hidden">
      {SIDE_ITEMS_LEFT.map((item) => (
        <TabLink key={item.to} {...item} />
      ))}

      <div className="flex-1 flex justify-center">
        <NavLink to="/citoyen/signaler" className="flex flex-col items-center -mt-5">
          {({ isActive }) => (
            <>
              <span
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg ${
                  isActive ? 'bg-red-700' : 'bg-red'
                }`}
              >
                <Camera size={20} />
              </span>
              <span className={`text-[11px] font-semibold mt-1 ${isActive ? 'text-red' : 'text-navy-400'}`}>
                Signaler
              </span>
            </>
          )}
        </NavLink>
      </div>

      {SIDE_ITEMS_RIGHT.map((item) => (
        <TabLink key={item.to} {...item} />
      ))}
    </nav>
  );
}
