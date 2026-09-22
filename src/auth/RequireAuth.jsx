import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const AUTORITE_ROLES = ['autorite', 'admin', 'agent'];

export function homeRouteForRole(role) {
  return AUTORITE_ROLES.includes(role) ? '/autorite/dashboard' : '/citoyen/accueil';
}

// Permissions par rôle - quelles pages chaque rôle peut accéder
export const ROLE_PERMISSIONS = {
  agent: {
    allowed: ['dashboard', 'carte', 'alertes', 'parametres'],
    forbidden: ['backtesting', 'fiabilite', 'admin-authorites', 'admin-capteurs'],
  },
  autorite: {
    allowed: ['dashboard', 'carte', 'alertes', 'backtesting', 'fiabilite', 'parametres'],
    forbidden: ['admin-authorites', 'admin-capteurs'],
  },
  admin: {
    allowed: ['dashboard', 'carte', 'alertes', 'backtesting', 'fiabilite', 'parametres', 'admin-authorites', 'admin-capteurs'],
    forbidden: [],
  },
  citoyen: {
    allowed: ['accueil', 'carte', 'alertes', 'refuges', 'survival-kit', 'profil-vulnerabilite'],
    forbidden: ['admin-authorites', 'admin-capteurs', 'backtesting', 'fiabilite'],
  },
};

// Helper pour vérifier si un rôle a accès à une page
export function hasPageAccess(role, pageKey) {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;

  if (permissions.forbidden.includes(pageKey)) return false;
  if (permissions.allowed.includes(pageKey)) return true;

  return false;
}

/**
 * @param {'citoyen' | 'autorite'} space — quel espace cette branche de routes protège.
 * @param {string} requiredRole — rôle spécifique requis (optionnel, ex: 'admin')
 * @param {string} pageKey — clé de la page pour vérifier les permissions (optionnel)
 */
export default function RequireAuth({ space, children, requiredRole = null, pageKey = null }) {
  const { isAuthenticated, isReady, role } = useAuth();
  const location = useLocation();

  if (!isReady) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérifier le rôle requis (strict)
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={homeRouteForRole(role)} replace />;
  }

  // Vérifier l'espace (autorite vs citoyen)
  const isAutoriteRole = AUTORITE_ROLES.includes(role);
  const wrongSpace = (space === 'autorite' && !isAutoriteRole) || (space === 'citoyen' && isAutoriteRole);

  if (wrongSpace) {
    return <Navigate to={homeRouteForRole(role)} replace />;
  }

  // Vérifier les permissions de page si pageKey fourni
  if (pageKey && !hasPageAccess(role, pageKey)) {
    return <Navigate to={homeRouteForRole(role)} replace />;
  }

  return children;
}
