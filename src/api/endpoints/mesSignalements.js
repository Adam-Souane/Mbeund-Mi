import client from '../client';

// GET /api/mes-signalements/ — historique des signalements du citoyen connecté
export function getMesSignalements({ page = 1 } = {}) {
  return client.get('/mes-signalements/', { params: { page } }).then((r) => r.data);
}
