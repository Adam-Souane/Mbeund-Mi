import client from '../client';

// POST /api/chat/ — relaie une question à NDAM. Django rassemble le contexte
// côté serveur ; le frontend n'envoie que la question.
export function askNdam(question) {
  return client.post('/chat/', { question }).then((r) => r.data);
}
