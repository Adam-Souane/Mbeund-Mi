import { useState } from 'react';
import { LogOut, PhoneCall } from 'lucide-react';
import Logo from '../../shared/components/Logo';
import ThemeToggle from '../../theme/ThemeToggle';
import NotificationCenter from '../../shared/components/NotificationCenter';
import EmergencyModal from '../../shared/components/EmergencyModal';
import { useAuth } from '../../auth/AuthContext';
import { useMediaQuery } from '../../shared/hooks/useMediaQuery';
import BottomTabBar from '../mobile/BottomTabBar';
import CitizenDesktopShell from '../desktop/CitizenDesktopShell';
import CitizenProfileHeaderButton from '../components/CitizenProfileHeaderButton';

/**
 * Point d'entrée unique de toutes les pages citoyen : choisit entre le
 * gabarit mobile (colonne étroite + barre d'onglets basse, la maquette
 * "app mobile" d'origine) et le gabarit desktop (sidebar, comme l'espace
 * autorité) selon la largeur d'écran — jamais les deux à la fois, pour ne
 * pas monter le contenu de la page deux fois (double appel des hooks de
 * données de chaque page).
 */
export default function CitizenShell({ children, fullHeight = false }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { logout } = useAuth();
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  if (isDesktop) {
    return <CitizenDesktopShell fullHeight={fullHeight}>{children}</CitizenDesktopShell>;
  }

  return (
    <div className={`min-h-screen bg-navy-50 dark:bg-navy-950 text-navy dark:text-navy-50 flex flex-col ${fullHeight ? 'h-screen overflow-hidden' : ''}`}>
      {/* Header mobile & tablette : z-50 pour être toujours au-dessus des couches Leaflet */}
      <header className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6 bg-white dark:bg-[#071322] border-b border-navy-100 dark:border-navy-800 flex-shrink-0 z-50 sticky top-0 shadow-2xs">
        <div className="flex items-center flex-shrink-0">
          <Logo imgClassName="h-6 sm:h-8" className="items-start" />
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          {/* Bouton Rouge Urgence / SOS (compact sur mobile, étendu sur tablette/desktop) */}
          <button
            type="button"
            onClick={() => setEmergencyOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white shadow-xs transition cursor-pointer"
            title="Numéros d'urgence 24/7"
          >
            <PhoneCall size={14} className="animate-pulse flex-shrink-0" />
            <span className="text-[11px] font-black tracking-wide sm:hidden">SOS</span>
            <span className="hidden sm:inline text-xs font-black">Urgence</span>
          </button>

          <NotificationCenter />
          <ThemeToggle />
          <CitizenProfileHeaderButton />

          {/* Déconnexion : visible à partir de la tablette (sur mobile, disponible dans l'onglet Profil) */}
          <button
            onClick={logout}
            aria-label="Se déconnecter"
            className="hidden sm:flex w-9 h-9 rounded-full border border-navy-200 dark:border-navy-800 items-center justify-center text-red hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-95 transition cursor-pointer"
            title="Se déconnecter"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Contenu principal fluide : si fullHeight, prend toute la hauteur disponible sans scroll */}
      <div
        className={`flex-1 max-w-4xl w-full mx-auto px-3.5 sm:px-6 ${
          fullHeight
            ? 'py-3 pb-20 flex flex-col min-h-0 overflow-hidden'
            : 'py-4 sm:py-6 pb-28 sm:pb-24 flex flex-col gap-4 sm:gap-6'
        }`}
      >
        {children}
      </div>

      <BottomTabBar />
      <EmergencyModal isOpen={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
    </div>
  );
}
