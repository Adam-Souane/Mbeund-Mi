import client from '../client';

// GET /api/mon-survival-kit/ — kit de survie du citoyen connecté
export function getMonSurvivalKit() {
  return client.get('/mon-survival-kit/').then((r) => r.data);
}

// PUT /api/mon-survival-kit/ — met à jour le kit de survie du citoyen connecté
export function saveMonSurvivalKit(data) {
  return client.put('/mon-survival-kit/', data).then((r) => r.data);
}
