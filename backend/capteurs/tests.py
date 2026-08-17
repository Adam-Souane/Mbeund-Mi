import pytest
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from capteurs.models import Capteur, Mesure

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def auth_client(api_client, db):
    user = User.objects.create_user(username='testuser', password='password123')
    api_client.force_authenticate(user=user)
    return api_client

@pytest.mark.django_db
def test_capteurs_list_and_create(auth_client):
    # 1. Test POST /api/capteurs/ (Create)
    post_data = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [-17.38, 14.75]
        },
        "properties": {
            "nom": "Capteur Test POST",
            "type": "eau",
            "actif": True,
            "date_installation": "2026-08-17"
        }
    }
    
    response = auth_client.post('/api/capteurs/', post_data, format='json')
    assert response.status_code == 201
    
    # Assert return format is GeoJSON
    res_data = response.data
    assert res_data['type'] == 'Feature'
    assert res_data['geometry']['type'] == 'Point'
    assert res_data['geometry']['coordinates'] == [-17.38, 14.75]
    assert res_data['properties']['nom'] == "Capteur Test POST"
    assert res_data['properties']['type'] == "eau"
    assert res_data['properties']['actif'] is True
    assert res_data['properties']['date_installation'] == "2026-08-17"
    
    # 2. Test GET /api/capteurs/ (List)
    response_list = auth_client.get('/api/capteurs/')
    assert response_list.status_code == 200
    if isinstance(response_list.data, dict) and response_list.data.get('type') == 'FeatureCollection':
        features = response_list.data['features']
    else:
        features = response_list.data
    assert isinstance(features, list)
    assert len(features) >= 1
    
    feature = features[0]
    assert feature['type'] == 'Feature'
    assert feature['geometry']['type'] == 'Point'
    assert feature['properties']['nom'] == "Capteur Test POST"


@pytest.mark.django_db
def test_mesures_list_and_create(auth_client):
    # Setup test Capteur
    capteur = Capteur.objects.create(
        nom="Capteur Test Mesure",
        type="pluviometre",
        localisation="POINT(-17.40 14.80)",
        actif=True,
        date_installation="2026-08-17"
    )
    
    # 1. Test POST /api/mesures/ (Create)
    post_data = {
        "capteur": capteur.id,
        "valeur": 25.5,
        "unite": "mm",
        "timestamp": "2026-08-17T12:00:00Z"
    }
    
    response = auth_client.post('/api/mesures/', post_data, format='json')
    assert response.status_code == 201
    
    res_data = response.data
    assert res_data['valeur'] == 25.5
    assert res_data['unite'] == "mm"
    assert res_data['timestamp'] == "2026-08-17T12:00:00Z"
    
    # Nested capteur validation
    assert res_data['capteur']['type'] == 'Feature'
    assert res_data['capteur']['properties']['nom'] == "Capteur Test Mesure"
    assert res_data['capteur']['geometry']['coordinates'] == [-17.40, 14.80]

    # 2. Test GET /api/mesures/ (List)
    response_list = auth_client.get('/api/mesures/')
    assert response_list.status_code == 200
    assert isinstance(response_list.data, list)
    assert len(response_list.data) >= 1
    
    item = response_list.data[0]
    assert item['valeur'] == 25.5
    assert item['capteur']['properties']['nom'] == "Capteur Test Mesure"


@pytest.mark.django_db
def test_mesures_recentes(auth_client):
    # Setup test Capteurs
    cap1 = Capteur.objects.create(
        nom="Cap1",
        type="eau",
        localisation="POINT(-17.1 14.1)",
        actif=True,
        date_installation="2026-08-17"
    )
    cap2 = Capteur.objects.create(
        nom="Cap2",
        type="pluviometre",
        localisation="POINT(-17.2 14.2)",
        actif=True,
        date_installation="2026-08-17"
    )
    
    now = timezone.now()
    
    # Measurements in last 24h
    m1 = Mesure.objects.create(capteur=cap1, valeur=10.0, unite="m", timestamp=now - timedelta(hours=2))
    m2 = Mesure.objects.create(capteur=cap1, valeur=12.0, unite="m", timestamp=now - timedelta(hours=5))
    m3 = Mesure.objects.create(capteur=cap2, valeur=30.0, unite="mm", timestamp=now - timedelta(hours=12))
    
    # Measurement older than 24h (should be ignored)
    m_old = Mesure.objects.create(capteur=cap1, valeur=99.0, unite="m", timestamp=now - timedelta(hours=30))
    
    response = auth_client.get('/api/mesures/recentes/')
    assert response.status_code == 200
    
    res_list = response.data
    # Should contain 2 groups (one for cap1, one for cap2)
    assert len(res_list) == 2
    
    # Map by capteur name for checks
    grouped_data = {item['capteur']['properties']['nom']: item for item in res_list}
    
    assert "Cap1" in grouped_data
    assert "Cap2" in grouped_data
    
    # Cap1 measures should only have 2 records (m1 and m2, not m_old)
    cap1_measures = grouped_data["Cap1"]["mesures"]
    assert len(cap1_measures) == 2
    valeurs = [m["valeur"] for m in cap1_measures]
    assert 10.0 in valeurs
    assert 12.0 in valeurs
    assert 99.0 not in valeurs
    
    # Cap2 measures should have 1 record
    cap2_measures = grouped_data["Cap2"]["mesures"]
    assert len(cap2_measures) == 1
    assert cap2_measures[0]["valeur"] == 30.0
