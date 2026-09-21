import client from '../client';

// GET /api/relais-quartier/moi/ — l'inscription du citoyen connecté, ou null.
export function getMonRelais() {
  return client.get('/relais-quartier/moi/').then((r) => r.data);
}

// POST /api/relais-quartier/ — inscription du citoyen connecté comme relais
// de sa zone (une seule inscription possible, OneToOne côté backend).
export function createRelais({ zone }) {
  return client.post('/relais-quartier/', { zone }).then((r) => r.data);
}

// DELETE /api/relais-quartier/{id}/ — le citoyen se désinscrit.
export function deleteRelais(id) {
  return client.delete(`/relais-quartier/${id}/`).then((r) => r.data);
}

// GET /api/relais-quartier/ — réservé autorité/admin, paginé.
export function getRelaisQuartier({ page } = {}) {
  return client.get('/relais-quartier/', { params: { page } }).then((r) => r.data);
}

// PATCH /api/relais-quartier/{id}/verifier/ — réservé autorité/admin.
export function verifierRelais(id, verifie) {
  return client.patch(`/relais-quartier/${id}/verifier/`, { verifie }).then((r) => r.data);
}
