import client from '../client';

/**
 * GET /api/users/me/ — profil complet de l'utilisateur connecté
 */
export function getCurrentUser() {
  return client.get('/users/me/').then((r) => r.data);
}

/**
 * PATCH /api/users/me/ — met à jour prénom, nom, email ou téléphone
 */
export function updateCurrentUser(data) {
  return client.patch('/users/me/', data).then((r) => r.data);
}

