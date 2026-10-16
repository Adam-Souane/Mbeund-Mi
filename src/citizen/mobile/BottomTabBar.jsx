import { NavLink } from 'react-router-dom';
import { Home, Map, Camera, MessageCircle, User } from 'lucide-react';

const SIDE_ITEMS_LEFT = [
  { to: '/citoyen/accueil', label: 'Accueil', icon: Home },
  { to: '/citoyen/carte', label: 'Carte', icon: Map },
];

// MessageCircle plutôt que l'icône "vague" de la marque NDAM — doit se lire
// comme "ouvre une conversation" au premier coup d'œil.
const SIDE_ITEMS_RIGHT = [
  { to: '/citoyen/chat', label: 'NDAM', icon: MessageCircle },
  { to: '/citoyen/profil', label: 'Profil', icon: User },
];

function TabLink({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-1 flex-1 py-2 text-[11px] font-semibold transition-colors ${
          isActive ? 'text-[#CC131A] font-black' : 'text-navy-400 hover:text-navy-600 dark:hover:text-navy-200'
        }`
      }
    >
      <Icon size={19} />
      <span>{label}</span>
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
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-[#071322]/95 backdrop-blur-md border-t border-navy-100 dark:border-navy-800 flex items-stretch max-w-3xl mx-auto lg:hidden shadow-lg">
      {SIDE_ITEMS_LEFT.map((item) => (
        <TabLink key={item.to} {...item} />
      ))}

      <div className="flex-1 flex justify-center">
        <NavLink to="/citoyen/signaler" className="flex flex-col items-center -mt-5">
          {({ isActive }) => (
            <>
              <span
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-90 ${
                  isActive ? 'bg-red-700 ring-4 ring-red-100 dark:ring-red-950' : 'bg-[#CC131A] hover:bg-red-700'
                }`}
              >
                <Camera size={20} />
              </span>
              <span className={`text-[11px] font-semibold mt-1 ${isActive ? 'text-[#CC131A] font-black' : 'text-navy-400'}`}>
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
