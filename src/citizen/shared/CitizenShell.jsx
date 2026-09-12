import { LogOut } from 'lucide-react';
import Logo from '../../shared/components/Logo';
import ThemeToggle from '../../theme/ThemeToggle';
import { useAuth } from '../../auth/AuthContext';
import { useMediaQuery } from '../../shared/hooks/useMediaQuery';
import BottomTabBar from '../mobile/BottomTabBar';
import CitizenDesktopShell from '../desktop/CitizenDesktopShell';

/**
 * Point d'entrée unique de toutes les pages citoyen : choisit entre le
 * gabarit mobile (colonne étroite + barre d'onglets basse, la maquette
 * "app mobile" d'origine) et le gabarit desktop (sidebar, comme l'espace
 * autorité) selon la largeur d'écran — jamais les deux à la fois, pour ne
 * pas monter le contenu de la page deux fois (double appel des hooks de
 * données de chaque page).
 */
export default function CitizenShell({ children }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { logout } = useAuth();

  if (isDesktop) {
    return <CitizenDesktopShell>{children}</CitizenDesktopShell>;
  }

  return (
    <div className="min-h-screen bg-navy-50 dark:bg-navy-950 text-navy dark:text-navy-50 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-navy flex-shrink-0">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={logout}
            aria-label="Se déconnecter"
            className="w-9 h-9 rounded-full border border-navy-200 dark:border-navy-800 flex items-center justify-center text-red"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-3xl w-full mx-auto px-6 py-5 flex flex-col gap-4 pb-24">{children}</div>

      <BottomTabBar />
    </div>
  );
}
