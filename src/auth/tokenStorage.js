// Stockage des JWT en localStorage. Le backend n'a pas de configuration
// CORS à cookies (CORS_ALLOWED_ORIGINS sans credentials), donc pas d'option
// "cookie httpOnly" possible sans changement backend — localStorage est le
// choix pragmatique pour une SPA qu'on rouvre depuis un écran d'accueil
// mobile sans redemander la connexion à chaque fois.
const ACCESS_KEY = 'mbeund_access_token';
const REFRESH_KEY = 'mbeund_refresh_token';

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}
