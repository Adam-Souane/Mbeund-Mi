import { Link } from 'react-router-dom';
import Logo from '../shared/components/Logo';
import ThemeToggle from '../theme/ThemeToggle';

// Pas encore de endpoint d'auto-inscription côté backend (hors des trois
// lacunes comblées en Phase 0) — cet écran reprend la maquette validée mais
// reste volontairement non fonctionnel tant que ce endpoint n'existe pas.
export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-navy-50 dark:bg-navy-950 relative">
      <ThemeToggle className="absolute top-7 right-8" />
      <div className="w-full max-w-[420px]">
        <div className="flex flex-col items-center mb-7">
          <Logo size="lg" withSlogan />
        </div>

        <div className="bg-white dark:bg-navy rounded-xl border border-navy-50 dark:border-navy-800 shadow-lg p-7">
          <h1 className="text-base font-extrabold text-navy dark:text-navy-50 mb-4">Créer un compte citoyen</h1>

          <div className="px-3.5 py-3 rounded-md bg-navy-50 dark:bg-navy-800 text-navy-600 dark:text-navy-200 text-xs mb-5">
            L'auto-inscription n'est pas encore disponible — contactez la mairie de Thiaroye-sur-Mer ou une autorité
            habilitée pour obtenir un accès citoyen.
          </div>

          <p className="text-center text-xs text-navy-600 dark:text-navy-200">
            Déjà inscrit ?{' '}
            <Link to="/login" className="font-bold text-red">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
