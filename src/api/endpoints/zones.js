import client from '../client';

// GET /api/zones/ — GeoJSON FeatureCollection, non paginé.
export function getZones() {
  return client.get('/zones/').then((r) => r.data);
}
