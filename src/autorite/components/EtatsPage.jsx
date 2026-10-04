import { AlertCircle, Lock } from 'lucide-react';
import AutoriteShell from '../desktop/AutoriteShell';

// États d'une page de l'espace autorité (accès refusé, chargement, erreur,
// absence de données), communs aux pages de backtesting et de fiabilité.

export function AccesReserveAdmin() {
  return (
    <AutoriteShell>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-white dark:bg-navy p-12 rounded-xl border border-navy-50 dark:border-navy-800">
          <Lock size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-navy dark:text-white mb-2">Accès réservé aux administrateurs</h2>
          <p className="text-navy-600 dark:text-navy-300">Cette page n’est accessible que pour les administrateurs du système.</p>
        </div>
      </div>
    </AutoriteShell>
  );
}

export function PageEnChargement({ message }) {
  return (
    <AutoriteShell>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-navy-500 mx-auto mb-4"></div>
          <p className="text-navy-600 dark:text-navy-200">{message}</p>
        </div>
      </div>
    </AutoriteShell>
  );
}

export function PageEnErreur({ message }) {
  return (
    <AutoriteShell>
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
          <div>
            <h3 className="font-bold text-red-900 dark:text-red-200">Erreur</h3>
            <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
          </div>
        </div>
      </div>
    </AutoriteShell>
  );
}

export function PageSansDonnees({ message }) {
  return (
    <AutoriteShell>
      <div className="text-center text-navy-600 dark:text-navy-200">{message || 'Aucune donnée disponible'}</div>
    </AutoriteShell>
  );
}
