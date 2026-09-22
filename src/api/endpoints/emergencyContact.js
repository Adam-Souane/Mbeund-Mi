import client from '../client';

// GET /api/mon-emergency-contact/ — contact d'urgence du citoyen connecté
export function getMonEmergencyContact() {
  return client.get('/mon-emergency-contact/').then((r) => r.data);
}

// PUT /api/mon-emergency-contact/ — met à jour le contact d'urgence du citoyen connecté
export function saveMonEmergencyContact(data) {
  return client.put('/mon-emergency-contact/', data).then((r) => r.data);
}
