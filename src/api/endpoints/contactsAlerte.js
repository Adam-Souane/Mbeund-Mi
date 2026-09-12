import client from '../client';

// GET /api/contacts-alerte/ — EstAdminOuAutorite (même la lecture est restreinte : PII).
export function getContactsAlerte({ page } = {}) {
  return client.get('/contacts-alerte/', { params: { page } }).then((r) => r.data);
}

// POST /api/contacts-alerte/ — AllowAny (inscription SMS libre).
export function createContactAlerte({ telephone, zone, nom }) {
  return client.post('/contacts-alerte/', { telephone, zone, nom }).then((r) => r.data);
}
