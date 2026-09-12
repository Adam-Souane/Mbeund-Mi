import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../auth/tokenStorage';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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

    return Promise.reject(error);
  }
);

export default client;
