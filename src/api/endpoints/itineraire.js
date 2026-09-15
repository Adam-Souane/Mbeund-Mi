import client from '../client';

// GET /api/itineraire-securise/?lat=..&lon=.. — calcule un itinéraire à pied
// qui évite autant que possible les rues à risque élevé (Dijkstra pondéré
// par le risque côté backend, voir api/services/routing_service.py).
export function getItineraireSecurise({ lat, lon }) {
  return client.get('/itineraire-securise/', { params: { lat, lon } }).then((r) => r.data);
}
