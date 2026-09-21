import client from '../client';

// GET /api/mon-profil-vulnerabilite/ — profil du citoyen connecté, ou null
// s'il n'a encore rien déclaré.
export function getMonProfilVulnerabilite() {
  return client.get('/mon-profil-vulnerabilite/').then((r) => r.data);
}

// PUT /api/mon-profil-vulnerabilite/ — crée ou met à jour le profil du
// citoyen connecté (upsert).
export function saveMonProfilVulnerabilite(data) {
  return client.put('/mon-profil-vulnerabilite/', data).then((r) => r.data);
}

// GET /api/profils-vulnerabilite/ — réservé autorité/admin, paginé.
export function getProfilsVulnerabilite({ page, zone } = {}) {
  return client.get('/profils-vulnerabilite/', { params: { page, zone } }).then((r) => r.data);
}
