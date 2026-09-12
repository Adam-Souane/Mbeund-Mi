import client from '../client';

// GET /api/capteurs/ — GeoJSON FeatureCollection, non paginé.
export function getCapteurs() {
  return client.get('/capteurs/').then((r) => r.data);
}

export function createCapteur(payload) {
  return client.post('/capteurs/', payload).then((r) => r.data);
}

export function updateCapteur(id, payload) {
  return client.patch(`/capteurs/${id}/`, payload).then((r) => r.data);
}

export function deleteCapteur(id) {
  return client.delete(`/capteurs/${id}/`);
}
