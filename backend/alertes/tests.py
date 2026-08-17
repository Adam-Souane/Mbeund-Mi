import pytest
from django.utils import timezone
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from alertes.models import ZoneRisque, Alerte

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def auth_client(api_client, db):
    user = User.objects.create_user(username='testuser', password='password123')
    api_client.force_authenticate(user=user)
    return api_client

@pytest.fixture
def test_zone(db):
    return ZoneRisque.objects.create(
        geom="POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))",
        quartier="Thiaroye",
        niveau_risque="jaune"
    )

@pytest.mark.django_db
def test_create_alerte_success(auth_client, test_zone):
    url = '/api/alertes/'
    data = {
        "niveau": "orange",
        "zone": test_zone.id,
        "timestamp": timezone.now().isoformat(),
        "canaux": "sms,email",
        "statut": "en_attente"
    }
    response = auth_client.post(url, data, format='json')
    assert response.status_code == 201
    assert response.data['niveau'] == 'orange'
    assert response.data['statut'] == 'en_attente'
    assert response.data['zone']['id'] == test_zone.id
    assert response.data['zone']['quartier'] == 'Thiaroye'

@pytest.mark.django_db
def test_create_alerte_invalid_niveau(auth_client, test_zone):
    url = '/api/alertes/'
    data = {
        "niveau": "invalid_color",
        "zone": test_zone.id,
        "timestamp": timezone.now().isoformat(),
        "canaux": "sms"
    }
    response = auth_client.post(url, data, format='json')
    assert response.status_code == 400
    assert 'niveau' in response.data

@pytest.mark.django_db
def test_list_and_filter_alertes(auth_client, test_zone):
    zone2 = ZoneRisque.objects.create(
        geom="POLYGON((1 1, 1 2, 2 2, 2 1, 1 1))",
        quartier="Dakar",
        niveau_risque="rouge"
    )
    
    a1 = Alerte.objects.create(niveau="jaune", zone=test_zone, timestamp=timezone.now(), statut="en_attente")
    a2 = Alerte.objects.create(niveau="rouge", zone=test_zone, timestamp=timezone.now(), statut="envoyee")
    a3 = Alerte.objects.create(niveau="jaune", zone=zone2, timestamp=timezone.now(), statut="resolue")

    # List all
    response = auth_client.get('/api/alertes/')
    assert response.status_code == 200
    assert len(response.data) == 3

    # Filter by zone
    response = auth_client.get(f'/api/alertes/?zone={test_zone.id}')
    assert response.status_code == 200
    assert len(response.data) == 2
    for item in response.data:
        assert item['zone']['id'] == test_zone.id

    # Filter by level
    response = auth_client.get('/api/alertes/?niveau=jaune')
    assert response.status_code == 200
    assert len(response.data) == 2
    for item in response.data:
        assert item['niveau'] == 'jaune'

    # Filter by both
    response = auth_client.get(f'/api/alertes/?zone={test_zone.id}&niveau=jaune')
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]['id'] == a1.id

@pytest.mark.django_db
def test_statut_transitions_valid(auth_client, test_zone):
    alerte = Alerte.objects.create(niveau="orange", zone=test_zone, timestamp=timezone.now(), statut="en_attente")
    url = f'/api/alertes/{alerte.id}/statut/'

    # 1. transition en_attente -> envoyee
    response = auth_client.patch(url, {"statut": "envoyee"}, format='json')
    assert response.status_code == 200
    assert response.data['statut'] == 'envoyee'

    # 2. same status transition (envoyee -> envoyee) - no-op
    response = auth_client.patch(url, {"statut": "envoyee"}, format='json')
    assert response.status_code == 200
    assert response.data['statut'] == 'envoyee'

    # 3. transition envoyee -> resolue
    response = auth_client.patch(url, {"statut": "resolue"}, format='json')
    assert response.status_code == 200
    assert response.data['statut'] == 'resolue'

@pytest.mark.django_db
def test_statut_transitions_invalid(auth_client, test_zone):
    alerte = Alerte.objects.create(niveau="orange", zone=test_zone, timestamp=timezone.now(), statut="en_attente")
    url = f'/api/alertes/{alerte.id}/statut/'

    # Transition direct en_attente -> resolue is invalid
    response = auth_client.patch(url, {"statut": "resolue"}, format='json')
    assert response.status_code == 400
    assert 'detail' in response.data

    # Change to envoyee
    alerte.statut = "envoyee"
    alerte.save()

    # Transition envoyee -> en_attente is invalid (cannot go backwards)
    response = auth_client.patch(url, {"statut": "en_attente"}, format='json')
    assert response.status_code == 400
    assert 'detail' in response.data

    # Change to resolue
    alerte.statut = "resolue"
    alerte.save()

    # Transition from resolue to anything is invalid
    response = auth_client.patch(url, {"statut": "envoyee"}, format='json')
    assert response.status_code == 400
    assert 'detail' in response.data
