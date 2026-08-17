import pytest
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from alertes.models import ZoneRisque, PredictionIA, EpisodeInondation

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def auth_client(api_client, db):
    user = User.objects.create_user(username='testuser2', password='password123')
    api_client.force_authenticate(user=user)
    return api_client

@pytest.mark.django_db
def test_zones_geojson_endpoint(auth_client):
    zone1 = ZoneRisque.objects.create(
        geom="POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))",
        quartier="Medina",
        niveau_risque="vert"
    )
    zone2 = ZoneRisque.objects.create(
        geom="POLYGON((1 1, 1 2, 2 2, 2 1, 1 1))",
        quartier="Pikine",
        niveau_risque="rouge"
    )

    response = auth_client.get('/api/zones/')
    assert response.status_code == 200
    
    # Verify standard FeatureCollection wrapper
    data = response.data
    assert data['type'] == 'FeatureCollection'
    assert isinstance(data['features'], list)
    assert len(data['features']) == 2

    # Verify first feature format
    feature = data['features'][0]
    assert feature['type'] == 'Feature'
    assert feature['id'] == zone1.id
    assert feature['geometry']['type'] == 'Polygon'
    assert isinstance(feature['geometry']['coordinates'], list)
    assert feature['geometry']['coordinates'] == [[[0.0, 0.0], [0.0, 1.0], [1.0, 1.0], [1.0, 0.0], [0.0, 0.0]]]
    assert feature['properties']['quartier'] == "Medina"
    assert feature['properties']['niveau_risque'] == "vert"

@pytest.mark.django_db
def test_predictions_latest_per_zone(auth_client):
    zone1 = ZoneRisque.objects.create(geom="POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))", quartier="Z1", niveau_risque="jaune")
    zone2 = ZoneRisque.objects.create(geom="POLYGON((1 1, 1 2, 2 2, 2 1, 1 1))", quartier="Z2", niveau_risque="rouge")
    zone3 = ZoneRisque.objects.create(geom="POLYGON((2 2, 2 3, 3 3, 3 2, 2 2))", quartier="Z3", niveau_risque="vert")

    now = timezone.now()

    # Predictions for Zone 1
    p1_old = PredictionIA.objects.create(zone=zone1, probabilite=0.4, horizon_h=12, confiance=0.8, timestamp=now - timedelta(hours=5))
    p1_latest = PredictionIA.objects.create(zone=zone1, probabilite=0.75, horizon_h=6, confiance=0.9, timestamp=now - timedelta(hours=1))

    # Predictions for Zone 2
    p2_latest = PredictionIA.objects.create(zone=zone2, probabilite=0.9, horizon_h=3, confiance=0.95, timestamp=now - timedelta(minutes=10))
    p2_old = PredictionIA.objects.create(zone=zone2, probabilite=0.6, horizon_h=12, confiance=0.85, timestamp=now - timedelta(hours=2))

    # No predictions for Zone 3

    response = auth_client.get('/api/predictions/')
    assert response.status_code == 200

    # Predictions should be a standard flat list (since they aren't GeoJSON directly, but nest zone details)
    predictions = response.data
    assert isinstance(predictions, list)
    assert len(predictions) == 2

    # Map by zone ID for easier validation
    pred_map = {p['zone']['id']: p for p in predictions}
    assert zone1.id in pred_map
    assert zone2.id in pred_map
    assert zone3.id not in pred_map

    # Validate latest zone 1 prediction details
    z1_pred = pred_map[zone1.id]
    assert z1_pred['probabilite'] == 0.75
    assert z1_pred['horizon_h'] == 6
    assert z1_pred['confiance'] == 0.9
    assert z1_pred['zone']['quartier'] == "Z1"

    # Validate latest zone 2 prediction details
    z2_pred = pred_map[zone2.id]
    assert z2_pred['probabilite'] == 0.9
    assert z2_pred['horizon_h'] == 3
    assert z2_pred['confiance'] == 0.95
    assert z2_pred['zone']['quartier'] == "Z2"

@pytest.mark.django_db
def test_inondations_geojson_endpoint(auth_client):
    inondation = EpisodeInondation.objects.create(
        geom="MULTIPOLYGON(((0 0, 0 1, 1 1, 1 0, 0 0)), ((2 2, 2 3, 3 3, 3 2, 2 2)))",
        date_debut=timezone.now() - timedelta(days=2),
        date_fin=timezone.now() - timedelta(days=1),
        surface_ha=15.5
    )

    response = auth_client.get('/api/inondations/')
    assert response.status_code == 200

    data = response.data
    assert data['type'] == 'FeatureCollection'
    assert isinstance(data['features'], list)
    assert len(data['features']) == 1

    feature = data['features'][0]
    assert feature['type'] == 'Feature'
    assert feature['id'] == inondation.id
    assert feature['geometry']['type'] == 'MultiPolygon'
    assert isinstance(feature['geometry']['coordinates'], list)
    assert feature['geometry']['coordinates'] == [
        [[[0.0, 0.0], [0.0, 1.0], [1.0, 1.0], [1.0, 0.0], [0.0, 0.0]]],
        [[[2.0, 2.0], [2.0, 3.0], [3.0, 3.0], [3.0, 2.0], [2.0, 2.0]]]
    ]
    assert feature['properties']['surface_ha'] == 15.5

@pytest.mark.django_db
@pytest.mark.parametrize("url", [
    "/api/zones/",
    "/api/predictions/",
    "/api/inondations/",
])
def test_endpoints_unauthorized(api_client, url):
    response = api_client.get(url)
    assert response.status_code == 401

@pytest.mark.django_db
@pytest.mark.parametrize("url", [
    "/api/zones/9999/",
    "/api/predictions/9999/",
    "/api/inondations/9999/",
])
def test_endpoints_not_found(auth_client, url):
    response = auth_client.get(url)
    assert response.status_code == 404

@pytest.mark.django_db
def test_detail_endpoints_success(auth_client):
    zone = ZoneRisque.objects.create(
        geom="POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))",
        quartier="TestZone",
        niveau_risque="vert"
    )
    prediction = PredictionIA.objects.create(
        zone=zone,
        probabilite=0.5,
        horizon_h=12,
        confiance=0.9,
        timestamp=timezone.now()
    )
    inondation = EpisodeInondation.objects.create(
        geom="MULTIPOLYGON(((0 0, 0 1, 1 1, 1 0, 0 0)))",
        date_debut=timezone.now(),
        surface_ha=10.0
    )

    # Zone detail
    res_zone = auth_client.get(f"/api/zones/{zone.id}/")
    assert res_zone.status_code == 200
    assert res_zone.data["id"] == zone.id

    # Prediction detail
    res_pred = auth_client.get(f"/api/predictions/{prediction.id}/")
    assert res_pred.status_code == 200
    assert res_pred.data["id"] == prediction.id

    # Inondation detail
    res_inond = auth_client.get(f"/api/inondations/{inondation.id}/")
    assert res_inond.status_code == 200
    assert res_inond.data["id"] == inondation.id

