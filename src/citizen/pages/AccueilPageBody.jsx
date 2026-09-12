import Logo from '../../shared/components/Logo';
import ThemeToggle from '../../theme/ThemeToggle';
import { useAuth } from '../../auth/AuthContext';

// Squelette de la Phase 1 : prouve que la connexion, le routage par rôle et
// le mode sombre fonctionnent de bout en bout. Le contenu réel (risque,
// actions rapides, prédiction IA...) arrive en Phase 2.
export default function AccueilPageBody() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-navy-50 dark:bg-navy-950 text-navy dark:text-navy-50 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4">
        <Logo size="sm" />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={logout}
            className="text-sm font-semibold text-red border-[1.5px] border-red rounded-md px-4 py-2"
          >
            Se déconnecter
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-navy-600 dark:text-navy-200">Espace Citoyen — Accueil (Phase 2)</p>
      </div>
    </div>
  );
}
