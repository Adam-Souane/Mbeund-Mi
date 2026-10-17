// Les géométries GeoJSON renvoyées par le backend utilisent l'ordre
// [longitude, latitude] ; Leaflet attend [latitude, longitude] partout.
// Ces helpers convertissent chaque type de géométrie en positions
// directement utilisables par <Polygon>/<Polyline>/<CircleMarker>.

function ringToLatLngs(ring) {
  return ring.map(([lon, lat]) => {
    // Si lon est dans la bande côtière de Thiaroye et lat < 14.7425, rehausser sur le littoral habité
    if (lon >= -17.420 && lon <= -17.350 && lat < 14.7425) {
      return [14.7425, lon];
    }
    return [lat, lon];
  });
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

export function clampPointToThiaroyeLand(point) {
  if (!point || !Array.isArray(point) || point.length < 2) return point;
  const [lat, lon] = point;
  // Délimitation côtière de Thiaroye-sur-Mer (longitude -17.420 à -17.350)
  // Toute latitude inférieure à 14.7428 descend sur l'océan Atlantique.
  // Ce calage de sécurité garantit que tout avatar/signalement reste 100% sur la terre ferme habitée.
  if (lon >= -17.420 && lon <= -17.350) {
    const MIN_SAFE_LAND_LAT = 14.7432;
    if (lat < MIN_SAFE_LAND_LAT) {
      return [MIN_SAFE_LAND_LAT, lon];
    }
  }
  return [lat, lon];
}

export function pointToLatLng(geometry) {
  if (!geometry || geometry.type !== 'Point') return null;
  const [lon, lat] = geometry.coordinates;
  return clampPointToThiaroyeLand([lat, lon]);
}

export function getPolygonCenter(geometry) {
  if (!geometry) return null;
  let coords = [];
  if (geometry.type === 'Polygon' && geometry.coordinates?.[0]) {
    coords = geometry.coordinates[0];
  } else if (geometry.type === 'MultiPolygon' && geometry.coordinates?.[0]?.[0]) {
    coords = geometry.coordinates[0][0];
  }
  if (!coords.length) return null;
  let sumLat = 0;
  let sumLon = 0;
  coords.forEach(([lon, lat]) => {
    sumLon += lon;
    sumLat += lat;
  });
  const centerLat = sumLat / coords.length;
  const centerLon = sumLon / coords.length;
  return clampPointToThiaroyeLand([centerLat, centerLon]);
}
