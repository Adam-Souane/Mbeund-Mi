import client from '../client';

// POST /api/chat/ — relaie une question à NDAM. Django rassemble le contexte
// côté serveur ; le frontend peut également joindre une image en base64.
export function askNdam(question, image = null) {
  const payload = { question };
  if (image) {
    payload.image = image;
  }
  return client.post('/chat/', payload).then((r) => r.data);
}

// Transcrit un blob audio en texte (Wolof / Français)
export async function transcribeAudio(audioBlob, lang = 'fr') {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'audio.webm');
  formData.append('lang', lang);
  try {
    const res = await client.post('/chat/transcribe/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  } catch {
    // Fallback gracieux si l'API audio STT est indisponible
    return { text: '' };
  }
}
