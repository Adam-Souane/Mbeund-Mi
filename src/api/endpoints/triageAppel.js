import client from '../client';

// POST /api/enregistrer-triage-appel/ — enregistre un triage d'appel
export function enregistrerTriageAppel(triageData) {
  return client.post('/enregistrer-triage-appel/', triageData).then((r) => r.data);
}
