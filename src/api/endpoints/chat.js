import client from '../client';

// POST /api/chat/ — relaie une question à NDAM. Django rassemble le contexte
// côté serveur ; le frontend envoie la question avec l'historique et la langue.
export function askNdam(question, options = {}) {
  const payload =
    typeof question === 'object' && question !== null
      ? question
      : { question, ...options };
  return client.post('/chat/', payload).then((r) => r.data);
}

// POST /api/chat/transcribe/ — transcrit un mémo vocal via Whisper Groq
export function transcribeAudio(audioBlob, langue = 'fr') {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'voice_message.webm');
  formData.append('langue', langue);
  return client
    .post('/chat/transcribe/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
}
