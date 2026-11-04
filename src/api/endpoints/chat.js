import client from '../client';

// POST /api/chat/ — relaie une question (et une photo optionnelle) à NDAM.
// Django rassemble le contexte côté serveur.
export function askNdam(question, image = null) {
  const payload = { question };
  if (image) {
    payload.image = image;
  }
  return client.post('/chat/', payload).then((r) => r.data);
}
