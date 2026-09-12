import client from '../client';

// GET /api/predictions/ — dernière PredictionIA par zone, non paginé.
export function getPredictions() {
  return client.get('/predictions/').then((r) => r.data);
}
