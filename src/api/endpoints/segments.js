import client from '../client';

// GET /api/segments/ — GeoJSON FeatureCollection (LineString), non paginé.
export function getSegments() {
  return client.get('/segments/').then((r) => r.data);
}
