import client from '../client';

// GET /api/historique-risque/ — paginé.
export function getHistoriqueRisque({ page } = {}) {
  return client.get('/historique-risque/', { params: { page } }).then((r) => r.data);
}
