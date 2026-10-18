import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const AUTORITE_ROLES = ['autorite', 'admin', 'agent'];

export function homeRouteForRole(role) {
  return AUTORITE_ROLES.includes(role) ? '/autorite/dashboard' : '/citoyen/accueil';
}

/**
 * @param {'citoyen' | 'autorite'} space — quel espace cette branche de routes protège.
 */
export default function RequireAuth({ space, children }) {
  const { isAuthenticated, isReady, role } = useAuth();
  const location = useLocation();

  if (!isReady) return null; // évite un redirect prématuré le temps de relire localStorage

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAutoriteRole = AUTORITE_ROLES.includes(role);
  // Seul l'espace autorité est strictement restreint aux citoyens normaux.
  // Les autorités et administrateurs peuvent librement naviguer dans l'espace citoyen pour tester et superviser.
  const wrongSpace = space === 'autorite' && !isAutoriteRole;

  if (wrongSpace) {
    // Un citoyen qui tente d'accéder à l'espace autorité est redirigé vers l'accueil citoyen.
    return <Navigate to="/citoyen/accueil" replace />;
  }

  return children;
}
