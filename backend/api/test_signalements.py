import pytest
import os
import tempfile
import shutil
from io import BytesIO
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from alertes.models import SignalementCitoyen

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

# Auto-use fixture to isolate Media Storage during tests
@pytest.fixture(autouse=True)
def temp_media_root(settings):
    temp_dir = tempfile.mkdtemp()
    settings.MEDIA_ROOT = temp_dir
    yield
    shutil.rmtree(temp_dir, ignore_errors=True)

def generate_test_image(size=(1200, 1200), format='PNG'):
    file_obj = BytesIO()
    image = Image.new('RGB', size, 'blue')
    image.save(file_obj, format)
    file_obj.seek(0)
    return SimpleUploadedFile('test_image.png', file_obj.read(), content_type='image/png')

@pytest.mark.django_db
def test_create_signalement_accepted(api_client):
    # Center of Thiaroye: lat=14.75, lon=-17.38
    # Point at < 4 km: -17.38, 14.76 (approx 1.11 km away)
    photo = generate_test_image()
    data = {
        "localisation": "[-17.38, 14.76]",
        "description": "Inondation de la chaussée à Thiaroye",
        "categorie": "inondation",
        "photo": photo
    }
    response = api_client.post('/api/signalements/', data, format='multipart')
    assert response.status_code == 201
    
    # Check default status of valide is False
    res_data = response.data
    assert res_data['type'] == 'Feature'
    assert res_data['properties']['valide'] is False
    assert res_data['properties']['categorie'] == 'inondation'
    assert res_data['properties']['description'] == 'Inondation de la chaussée à Thiaroye'
    assert res_data['geometry']['type'] == 'Point'
    assert res_data['geometry']['coordinates'] == [-17.38, 14.76]

@pytest.mark.django_db
def test_create_signalement_rejected(api_client):
    # Center of Thiaroye: lat=14.75, lon=-17.38
    # Point at > 4 km: -17.38, 14.85 (approx 11.1 km away)
    photo = generate_test_image()
    data = {
        "localisation": "[-17.38, 14.85]",
        "description": "Trop loin de Thiaroye",
        "categorie": "autre",
        "photo": photo
    }
    response = api_client.post('/api/signalements/', data, format='multipart')
    assert response.status_code == 400
    assert 'localisation' in response.data
    # Check the custom validation error message contains "4 km"
    assert "4 km" in response.data['localisation'][0]

@pytest.mark.django_db
def test_create_signalement_compression(api_client):
    # Send a large 1500x1000 image
    photo = generate_test_image(size=(1500, 1000), format='PNG')
    data = {
        "localisation": "[-17.38, 14.75]",
        "description": "Vérification compression de photo",
        "categorie": "egouts",
        "photo": photo
    }
    response = api_client.post('/api/signalements/', data, format='multipart')
    assert response.status_code == 201
    
    # Fetch from db
    signalement = SignalementCitoyen.objects.last()
    assert signalement is not None
    assert bool(signalement.photo) is True
    
    # Open saved photo and verify dimensions, format and compression
    saved_path = signalement.photo.path
    assert os.path.exists(saved_path)
    
    with Image.open(saved_path) as img:
        # Check aspect ratio was preserved and max dimension is 800
        # For 1500x1000, 1500 is scaled down to 800.
        # Height should scale to: 1000 * (800/1500) = 533.33 -> 533 or 534
        assert img.width == 800
        assert img.height in (533, 534)
        # Check format is JPEG
        assert img.format == 'JPEG'
        
    # Check that file size is reasonable (should be around ~100 Ko or less)
    file_size = os.path.getsize(saved_path)
    # 200 KB is a safe bound for 800x533 JPEG at 70% quality, which is usually around 40-70 KB
    assert file_size < 200000

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
def signalement_instance(db):
    return SignalementCitoyen.objects.create(
        localisation="POINT(-17.38 14.76)",
        description="Trou dans la route",
        categorie="autre",
        valide=False
    )

@pytest.mark.django_db
def test_signalements_unauthorized(api_client, signalement_instance):
    # GET list is restricted to Autorite/Admin -> 401
    response = api_client.get('/api/signalements/')
    assert response.status_code == 401

    # GET detail is restricted -> 401
    response = api_client.get(f'/api/signalements/{signalement_instance.id}/')
    assert response.status_code == 401

    # DELETE is restricted -> 401
    response = api_client.delete(f'/api/signalements/{signalement_instance.id}/')
    assert response.status_code == 401

@pytest.mark.django_db
def test_signalements_citoyen_forbidden(api_client, user_citoyen, signalement_instance):
    api_client.force_authenticate(user=user_citoyen)

    # GET list (SAFE_METHOD) is allowed -> 200
    response = api_client.get('/api/signalements/')
    assert response.status_code == 200

    # GET detail (SAFE_METHOD) is allowed -> 200
    response = api_client.get(f'/api/signalements/{signalement_instance.id}/')
    assert response.status_code == 200

    # DELETE (unsafe method) is restricted -> 403
    response = api_client.delete(f'/api/signalements/{signalement_instance.id}/')
    assert response.status_code == 403

@pytest.mark.django_db
def test_signalements_autorite_allowed(api_client, user_autorite, signalement_instance):
    api_client.force_authenticate(user=user_autorite)

    # GET list -> 200
    response = api_client.get('/api/signalements/')
    assert response.status_code == 200
    assert len(response.data.get('features', [])) == 1

    # GET detail -> 200
    response = api_client.get(f'/api/signalements/{signalement_instance.id}/')
    assert response.status_code == 200

    # UPDATE (PATCH) -> 200
    response = api_client.patch(f'/api/signalements/{signalement_instance.id}/', {'valide': True})
    assert response.status_code == 200

    # DELETE -> 204
    response = api_client.delete(f'/api/signalements/{signalement_instance.id}/')
    assert response.status_code == 204


@pytest.mark.django_db
def test_signalements_not_found(api_client, user_autorite):
    api_client.force_authenticate(user=user_autorite)

    response = api_client.get('/api/signalements/9999/')
    assert response.status_code == 404

    response = api_client.patch('/api/signalements/9999/', {'valide': True})
    assert response.status_code == 404

    response = api_client.delete('/api/signalements/9999/')
    assert response.status_code == 404
