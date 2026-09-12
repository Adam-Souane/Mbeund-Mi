import client from '../client';

// GET /api/alertes/ — paginé, filtrable par zone/niveau.
export function getAlertes({ page, zone, niveau } = {}) {
  return client.get('/alertes/', { params: { page, zone, niveau } }).then((r) => r.data);
}

export function createAlerte(payload) {
  return client.post('/alertes/', payload).then((r) => r.data);
}

// PATCH /api/alertes/{id}/statut/ — machine à états en_attente -> envoyee -> resolue.
export function updateAlerteStatut(id, statut) {
  return client.patch(`/alertes/${id}/statut/`, { statut }).then((r) => r.data);
}
