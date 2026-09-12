import client from '../client';

// GET /api/signalements/ — paginé, results est une FeatureCollection GeoJSON.
export function getSignalements({ page } = {}) {
  return client.get('/signalements/', { params: { page } }).then((r) => r.data);
}

// POST /api/signalements/ — AllowAny, mais géré via multipart/form-data car
// la photo (optionnelle) est un vrai fichier. `localisation` accepte la
// forme "lon,lat" en texte d'après SignalementCitoyenSerializer.to_internal_value.
export function createSignalement({ description, categorie, longitude, latitude, photo }) {
  const formData = new FormData();
  formData.append('description', description);
  formData.append('categorie', categorie);
  formData.append('localisation', `${longitude},${latitude}`);
  if (photo) formData.append('photo', photo);

  return client
    .post('/signalements/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
}

// PATCH /api/signalements/{id}/valider/ — IsAutoriteOrAdmin.
export function validerSignalement(id, valide) {
  return client.patch(`/signalements/${id}/valider/`, { valide }).then((r) => r.data);
}
