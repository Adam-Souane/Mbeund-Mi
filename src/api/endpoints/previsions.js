import client from '../client';

// GET /api/previsions/ — paginé.
export function getPrevisions({ page } = {}) {
  return client.get('/previsions/', { params: { page } }).then((r) => r.data);
}
