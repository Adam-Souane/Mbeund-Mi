import pytest
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from alertes.models import ZoneRisque, Alerte

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def zone_risque(db):
    return ZoneRisque.objects.create(
        geom="POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))",
        quartier="Test Zone",
        niveau_risque="vert"
    )

@pytest.fixture
def alerte_instance(db, zone_risque):
    return Alerte.objects.create(
        niveau="vert",
        zone=zone_risque,
        timestamp=timezone.now(),
        canaux="SMS",
        statut="en_attente"
    )

@pytest.fixture
def user_citoyen(db):
    user = User.objects.create_user(username='citoyen', password='password123')
    user.profile.role = 'citoyen'
    user.profile.save()
    return user

@pytest.fixture
def user_autorite(db):
    user = User.objects.create_user(username='autorite', password='password123')
    user.profile.role = 'autorite'
    user.profile.save()
    return user

@pytest.fixture
def user_admin(db):
    user = User.objects.create_user(username='admin', password='password123')
    user.profile.role = 'admin'
    user.profile.save()
    return user

@pytest.mark.django_db
def test_jwt_obtain_pair_and_refresh(api_client, user_citoyen):
    # Obtain token
    response = api_client.post('/api/token/', {
        'username': 'citoyen',
        'password': 'password123'
    })
    assert response.status_code == 200
    assert 'access' in response.data
    assert 'refresh' in response.data
    
    access_token = response.data['access']
    refresh_token = response.data['refresh']

    # Refresh token
    response_refresh = api_client.post('/api/token/refresh/', {
        'refresh': refresh_token
    })
    assert response_refresh.status_code == 200
    assert 'access' in response_refresh.data

@pytest.mark.django_db
def test_alerts_read_access(api_client, user_citoyen, alerte_instance):
    # No auth: should return 401 since DEFAULT_PERMISSION_CLASSES is IsAuthenticated
    response = api_client.get('/api/alertes/')
    assert response.status_code == 401

    # Authenticated (citoyen): should return 200
    api_client.force_authenticate(user=user_citoyen)
    response = api_client.get('/api/alertes/')
    assert response.status_code == 200

@pytest.mark.django_db
def test_alerts_write_access_citoyen(api_client, user_citoyen, zone_risque, alerte_instance):
    api_client.force_authenticate(user=user_citoyen)
    
    # Try to create alerte
    response = api_client.post('/api/alertes/', {
        'niveau': 'jaune',
        'zone': zone_risque.id,
        'timestamp': timezone.now().isoformat(),
        'canaux': 'SMS',
        'statut': 'en_attente'
    })
    assert response.status_code == 403

    # Try to update alerte
    response = api_client.put(f'/api/alertes/{alerte_instance.id}/', {
        'niveau': 'rouge',
        'zone': zone_risque.id,
        'timestamp': timezone.now().isoformat(),
        'canaux': 'SMS',
        'statut': 'en_attente'
    })
    assert response.status_code == 403

    # Try to change statut
    response = api_client.patch(f'/api/alertes/{alerte_instance.id}/statut/', {
        'statut': 'envoyee'
    })
    assert response.status_code == 403

@pytest.mark.django_db
def test_alerts_write_access_autorite(api_client, user_autorite, zone_risque, alerte_instance):
    api_client.force_authenticate(user=user_autorite)

    # Create alerte
    response = api_client.post('/api/alertes/', {
        'niveau': 'jaune',
        'zone': zone_risque.id,
        'timestamp': timezone.now().isoformat(),
        'canaux': 'SMS',
        'statut': 'en_attente'
    })
    assert response.status_code == 201

    # Update alerte
    response = api_client.patch(f'/api/alertes/{alerte_instance.id}/', {
        'niveau': 'jaune'
    })
    assert response.status_code == 200
    assert response.data['niveau'] == 'jaune'

    # Change statut
    response = api_client.patch(f'/api/alertes/{alerte_instance.id}/statut/', {
        'statut': 'envoyee'
    })
    assert response.status_code == 200
    assert response.data['statut'] == 'envoyee'

@pytest.mark.django_db
def test_alerts_write_access_admin(api_client, user_admin, zone_risque, alerte_instance):
    api_client.force_authenticate(user=user_admin)

    # Create alerte
    response = api_client.post('/api/alertes/', {
        'niveau': 'rouge',
        'zone': zone_risque.id,
        'timestamp': timezone.now().isoformat(),
        'canaux': 'SMS',
        'statut': 'en_attente'
    })
    assert response.status_code == 201

    # Update alerte
    response = api_client.patch(f'/api/alertes/{alerte_instance.id}/', {
        'niveau': 'jaune'
    })
    assert response.status_code == 200

@pytest.mark.django_db
def test_alerts_not_found(api_client, user_autorite):
    api_client.force_authenticate(user=user_autorite)
    
    # Detail not found
    response = api_client.get('/api/alertes/9999/')
    assert response.status_code == 404

    # Update not found
    response = api_client.patch('/api/alertes/9999/', {'niveau': 'jaune'})
    assert response.status_code == 404

    # Delete not found
    response = api_client.delete('/api/alertes/9999/')
    assert response.status_code == 404

@pytest.mark.django_db
def test_alerts_bad_request(api_client, user_autorite, zone_risque):
    api_client.force_authenticate(user=user_autorite)

    # Missing zone
    response = api_client.post('/api/alertes/', {
        'niveau': 'jaune',
        'timestamp': timezone.now().isoformat()
    })
    assert response.status_code == 400
    assert 'zone' in response.data

    # Invalid niveau
    response = api_client.post('/api/alertes/', {
        'niveau': 'bleu',  # Invalid
        'zone': zone_risque.id,
        'timestamp': timezone.now().isoformat()
    })
    assert response.status_code == 400
    assert 'niveau' in response.data

