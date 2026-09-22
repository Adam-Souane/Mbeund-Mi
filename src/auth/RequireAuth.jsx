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
  const wrongSpace = (space === 'autorite' && !isAutoriteRole) || (space === 'citoyen' && isAutoriteRole);

  if (wrongSpace) {
    // Le rôle réel du compte (claim JWT) prime toujours sur l'URL demandée —
    // jamais d'écran d'erreur, on ramène simplement vers le bon espace.
    return <Navigate to={homeRouteForRole(role)} replace />;
  }

  return children;
}
