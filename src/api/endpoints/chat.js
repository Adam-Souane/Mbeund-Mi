import client from '../client';

// POST /api/chat/ — relaie une question à NDAM. Django rassemble le contexte
// côté serveur ; le frontend peut transmettre la langue, l'historique, la localisation,
// le mode vocal (is_voice) ou une image en base64.
export function askNdam(question, optionsOrImage = null) {
  const payload = { question };
  if (optionsOrImage && typeof optionsOrImage === 'object' && !Array.isArray(optionsOrImage)) {
    if (optionsOrImage.langue) payload.langue = optionsOrImage.langue;
    if (optionsOrImage.history) payload.history = optionsOrImage.history;
    if (optionsOrImage.localisation) payload.localisation = optionsOrImage.localisation;
    if (optionsOrImage.isVoice != null) payload.is_voice = Boolean(optionsOrImage.isVoice);
    if (optionsOrImage.is_voice != null) payload.is_voice = Boolean(optionsOrImage.is_voice);
    if (optionsOrImage.image) payload.image = optionsOrImage.image;
  } else if (optionsOrImage) {
    payload.image = optionsOrImage;
  }
  return client.post('/chat/', payload).then((r) => r.data);
}

// Transcrit un blob audio en texte (Wolof / Français) avec détection automatique de la langue
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
    return { text: '', detected_lang: lang };
  }
}

// Génère un audio MP3 (Data URL) avec la voix féminine naturelle de NDAM
export async function synthesizeSpeech(text, langue = 'fr') {
  try {
    const res = await client.post('/chat/tts/', { text, langue });
    return res.data;
  } catch {
    return { audio_url: null, langue };
  }
}
