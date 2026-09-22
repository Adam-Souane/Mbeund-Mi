import client from '../client';

// GET /api/refuges/ — GeoJSON FeatureCollection of refuge points
export function getRefuges() {
  return client.get('/refuges/').then((r) => r.data);
}
