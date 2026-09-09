# API Endpoints: Zones, Predictions & Inondations

This document defines the response formats and structures for the `/api/zones/`, `/api/predictions/`, and `/api/inondations/` endpoints. All geometry fields are exposed as standard GeoJSON objects.

---

## 1. Zones de Risque (`GET /api/zones/`)

Returns a list of risk zones in a standard GeoJSON `FeatureCollection` format, directly compatible with the `@react-google-maps/api` map component (e.g. `map.data.addGeoJson(response)`).

### Response Format (GeoJSON `FeatureCollection`)
* **Endpoint**: `/api/zones/`
* **Method**: `GET`
* **Format**:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "id": 1,
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [-17.38, 14.75],
            [-17.38, 14.76],
            [-17.37, 14.76],
            [-17.37, 14.75],
            [-17.38, 14.75]
          ]
        ]
      },
      "properties": {
        "quartier": "Thiaroye Sur Mer",
        "niveau_risque": "rouge"
      }
    }
  ]
}
```

---

## 2. Prédictions IA (`GET /api/predictions/`)

Exposes the latest prediction per zone (only one prediction record per risk zone, corresponding to the most recent timestamp).

### Response Format (JSON List)
* **Endpoint**: `/api/predictions/`
* **Method**: `GET`
* **Format**:
```json
[
  {
    "id": 12,
    "zone": {
      "id": 1,
      "quartier": "Thiaroye Sur Mer",
      "niveau_risque": "rouge"
    },
    "probabilite": 0.85,
    "horizon_h": 6,
    "confiance": 0.92,
    "timestamp": "2026-08-17T16:00:00Z"
  }
]
```

---

## 3. Historique des Inondations (`GET /api/inondations/`)

Returns the history of flood events as a standard GeoJSON `FeatureCollection` of MultiPolygon features (representing flooded areas).

### Response Format (GeoJSON `FeatureCollection`)
* **Endpoint**: `/api/inondations/`
* **Method**: `GET`
* **Format**:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "id": 1,
      "type": "Feature",
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [
          [
            [
              [-17.39, 14.74],
              [-17.39, 14.75],
              [-17.38, 14.75],
              [-17.38, 14.74],
              [-17.39, 14.74]
            ]
          ]
        ]
      },
      "properties": {
        "date_debut": "2026-08-15T08:00:00Z",
        "date_fin": "2026-08-16T12:00:00Z",
        "surface_ha": 24.5
      }
    }
  ]
}
```

---

## Google Maps Integration Example

Using the `@react-google-maps/api` package, you can load the zones directly onto the map using the standard Data Layer:

```javascript
import React, { useCallback } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

function MyMapComponent({ zonesGeoJson }) {
  const onLoad = useCallback(function callback(map) {
    // Directly add standard GeoJSON FeatureCollection to the map
    map.data.addGeoJson(zonesGeoJson);
    
    // Style the features based on risk level
    map.data.setStyle((feature) => {
      const level = feature.getProperty('niveau_risque');
      let color = 'green';
      if (level === 'rouge') color = 'red';
      else if (level === 'orange') color = 'orange';
      else if (level === 'jaune') color = 'yellow';
      
      return {
        fillColor: color,
        strokeColor: color,
        strokeWeight: 2,
        fillOpacity: 0.35
      };
    });
  }, []);

  return (
    <GoogleMap
      mapContainerClassName="map-container"
      center={{ lat: 14.75, lng: -17.38 }}
      zoom={14}
      onLoad={onLoad}
    />
  );
}
```
