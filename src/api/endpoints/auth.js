import axios from 'axios';

// Appels bruts (pas via `client`) : on n'a pas encore de token à attacher,
// et on ne veut pas déclencher l'intercepteur de rafraîchissement ici.
const baseURL = import.meta.env.VITE_API_URL;

export function obtainToken({ username, password }) {
  return axios.post(`${baseURL}/token/`, { username, password }).then((r) => r.data);
}

export function refreshToken(refresh) {
  return axios.post(`${baseURL}/token/refresh/`, { refresh }).then((r) => r.data);
}
