// Les géométries GeoJSON renvoyées par le backend utilisent l'ordre
// [longitude, latitude] ; Leaflet attend [latitude, longitude] partout.
// Ces helpers convertissent chaque type de géométrie en positions
// directement utilisables par <Polygon>/<Polyline>/<CircleMarker>.

function ringToLatLngs(ring) {
  return ring.map(([lon, lat]) => [lat, lon]);
}

export function polygonToLatLngs(geometry) {
  if (!geometry) return [];
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map(ringToLatLngs);
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map((polygon) => polygon.map(ringToLatLngs));
  }
  return [];
}

export function lineToLatLngs(geometry) {
  if (!geometry) return [];
  if (geometry.type === 'LineString') {
    return ringToLatLngs(geometry.coordinates);
  }
  if (geometry.type === 'MultiLineString') {
    return geometry.coordinates.map(ringToLatLngs);
  }
  return [];
}

export function pointToLatLng(geometry) {
  if (!geometry || geometry.type !== 'Point') return null;
  const [lon, lat] = geometry.coordinates;
  return [lat, lon];
}
