import client from '../client';

// GET /api/inondations/ — GeoJSON FeatureCollection (MultiPolygon), non paginé.
export function getInondations() {
  return client.get('/inondations/').then((r) => r.data);
}
