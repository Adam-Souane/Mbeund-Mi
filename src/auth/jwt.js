/**
 * Décodage local d'un JWT (payload uniquement, pas de vérification de
 * signature côté client — l'application ne fait jamais confiance à ce
 * contenu pour appliquer un contrôle d'accès réel, seulement pour choisir
 * quel espace afficher. La sécurité réelle vient des permissions DRF
 * appliquées par le backend sur chaque endpoint.
 */
export function decodeJwt(token) {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const payload = decodeJwt(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
}
