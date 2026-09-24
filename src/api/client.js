import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../auth/tokenStorage';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const csrfToken = getCookie('csrftoken');
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }

  return config;
});

let refreshPromise = null;

// SIMPLE_JWT est configuré avec ROTATE_REFRESH_TOKENS=True et
// BLACKLIST_AFTER_ROTATION=True côté backend : chaque rafraîchissement
// renvoie un NOUVEAU refresh token et blackliste l'ancien. Il faut donc
// bien persister les deux valeurs à chaque appel, sous peine que le
// rafraîchissement suivant échoue (refresh token déjà blacklisté).
async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error('Aucun refresh token disponible.');

  // Requête axios brute (pas `client`) pour ne pas redéclencher cet
  // intercepteur en boucle sur un 401 de /token/refresh/ lui-même.
  const response = await axios.post(`${import.meta.env.VITE_API_URL}/token/refresh/`, { refresh });
  setTokens({ access: response.data.access, refresh: response.data.refresh });
  return response.data.access;
}

function getErrorMessage(error) {
  const { response, code, message } = error;

  if (response?.status === 401) return 'Session expirée. Veuillez vous reconnecter.';
  if (response?.status === 403) return 'Accès refusé. Vous n\'avez pas la permission.';
  if (response?.status === 404) return 'Ressource non trouvée.';
  if (response?.status === 422) {
    const errors = response.data?.errors || response.data?.detail;
    if (errors) return typeof errors === 'string' ? errors : 'Veuillez vérifier vos données.';
  }
  if (response?.status >= 500) return 'Erreur serveur. Veuillez réessayer plus tard.';
  if (response?.status >= 400) return response.data?.detail || 'Une erreur s\'est produite.';
  if (code === 'ECONNABORTED') return 'La demande a pris trop longtemps. Veuillez réessayer.';
  if (code === 'ENOTFOUND' || code === 'ECONNREFUSED') return 'Impossible de se connecter au serveur.';
  if (message === 'Network Error') return 'Erreur réseau. Vérifiez votre connexion.';

  return 'Une erreur inattendue s\'est produite.';
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const isAuthEndpoint = config?.url?.includes('/token/');

    if (response?.status === 401 && !config._retry && !isAuthEndpoint) {
      config._retry = true;
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });

      try {
        const newAccess = await refreshPromise;
        config.headers.Authorization = `Bearer ${newAccess}`;
        return client(config);
      } catch {
        clearTokens();
        // Rechargement complet plutôt qu'un appel à AuthContext : cet
        // intercepteur vit en dehors de l'arbre React et n'a pas accès à
        // son state.
        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
      }
    }

    // Global error logging (ne rejette pas encore, juste pour la visibilité)
    const errorMsg = getErrorMessage(error);
    if (import.meta.env.DEV) {
      console.error(`API Error [${config?.method?.toUpperCase()} ${config?.url}]:`, {
        status: response?.status,
        message: errorMsg,
        data: response?.data,
        error: error.message,
      });
    }

    // Attacher le message utilisateur-friendly à l'erreur
    error.userMessage = errorMsg;
    return Promise.reject(error);
  }
);

export default client;
