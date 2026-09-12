import client from '../client';

// GET /api/mesures/recentes/ — relevés des dernières 24h, groupés par capteur.
// Liste brute (pas paginée), contrairement à /api/mesures/ elle-même.
export function getMesuresRecentes() {
  return client.get('/mesures/recentes/').then((r) => r.data);
}

export function getMesures({ page } = {}) {
  return client.get('/mesures/', { params: { page } }).then((r) => r.data);
}
