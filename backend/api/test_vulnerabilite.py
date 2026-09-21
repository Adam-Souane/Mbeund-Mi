import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from alertes.models import ZoneRisque, ProfilVulnerabilite, RelaisQuartier

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user_citoyen(db):
    user = User.objects.create_user(username='citoyen1', password='password123')
    user.profile.role = 'citoyen'
    user.profile.save()
    return user


@pytest.fixture
def user_citoyen2(db):
    user = User.objects.create_user(username='citoyen2', password='password123')
    user.profile.role = 'citoyen'
    user.profile.save()
    return user


@pytest.fixture
def user_autorite(db):
    user = User.objects.create_user(username='autorite1', password='password123')
    user.profile.role = 'autorite'
    user.profile.save()
    return user


@pytest.fixture
def zone(db):
    return ZoneRisque.objects.create(
        geom="POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))",
        quartier="Zone test",
        niveau_risque="jaune",
    )


# --- ProfilVulnerabilite ---------------------------------------------------

@pytest.mark.django_db
def test_mon_profil_vulnerabilite_requires_auth(api_client):
    response = api_client.get('/api/mon-profil-vulnerabilite/')
    assert response.status_code == 401

    response = api_client.put('/api/mon-profil-vulnerabilite/', {})
    assert response.status_code == 401


@pytest.mark.django_db
def test_mon_profil_vulnerabilite_get_before_declaration_is_null(api_client, user_citoyen):
    api_client.force_authenticate(user=user_citoyen)
    response = api_client.get('/api/mon-profil-vulnerabilite/')
    assert response.status_code == 200
    assert response.data is None


@pytest.mark.django_db
def test_mon_profil_vulnerabilite_put_creates_then_updates(api_client, user_citoyen, zone):
    api_client.force_authenticate(user=user_citoyen)

    response = api_client.put('/api/mon-profil-vulnerabilite/', {
        'zone': zone.id,
        'personnes_agees': 2,
        'personne_mobilite_reduite': True,
    }, format='json')
    assert response.status_code == 200
    assert response.data['personnes_agees'] == 2
    assert response.data['est_prioritaire'] is True
    assert ProfilVulnerabilite.objects.filter(user=user_citoyen).count() == 1

    # Un deuxième PUT met à jour le même profil (upsert), n'en crée pas un second.
    response = api_client.put('/api/mon-profil-vulnerabilite/', {
        'personnes_agees': 0,
        'personne_mobilite_reduite': False,
    }, format='json')
    assert response.status_code == 200
    assert response.data['personnes_agees'] == 0
    assert response.data['est_prioritaire'] is False
    assert ProfilVulnerabilite.objects.filter(user=user_citoyen).count() == 1


@pytest.mark.django_db
def test_mon_profil_vulnerabilite_scoped_to_own_user(api_client, user_citoyen, user_citoyen2, zone):
    api_client.force_authenticate(user=user_citoyen)
    api_client.put('/api/mon-profil-vulnerabilite/', {'personnes_agees': 3}, format='json')

    api_client.force_authenticate(user=user_citoyen2)
    response = api_client.get('/api/mon-profil-vulnerabilite/')
    assert response.status_code == 200
    assert response.data is None


@pytest.mark.django_db
def test_profils_vulnerabilite_list_reserved_to_autorite(api_client, user_citoyen, user_autorite, zone):
    ProfilVulnerabilite.objects.create(user=user_citoyen, zone=zone, personnes_agees=1)

    api_client.force_authenticate(user=user_citoyen)
    response = api_client.get('/api/profils-vulnerabilite/')
    assert response.status_code == 403

    api_client.force_authenticate(user=user_autorite)
    response = api_client.get('/api/profils-vulnerabilite/')
    assert response.status_code == 200
    assert response.data['count'] == 1
    assert response.data['results'][0]['username'] == 'citoyen1'


@pytest.mark.django_db
def test_profils_vulnerabilite_filter_by_zone(api_client, user_citoyen, user_citoyen2, user_autorite, zone):
    autre_zone = ZoneRisque.objects.create(
        geom="POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))", quartier="Autre zone", niveau_risque="vert",
    )
    ProfilVulnerabilite.objects.create(user=user_citoyen, zone=zone, personnes_agees=1)
    ProfilVulnerabilite.objects.create(user=user_citoyen2, zone=autre_zone, personnes_agees=1)

    api_client.force_authenticate(user=user_autorite)
    response = api_client.get('/api/profils-vulnerabilite/', {'zone': zone.id})
    assert response.status_code == 200
    assert response.data['count'] == 1
    assert response.data['results'][0]['username'] == 'citoyen1'


# --- RelaisQuartier ---------------------------------------------------------

@pytest.mark.django_db
def test_relais_quartier_create_requires_auth(api_client, zone):
    response = api_client.post('/api/relais-quartier/', {'zone': zone.id})
    assert response.status_code == 401


@pytest.mark.django_db
def test_relais_quartier_create_and_moi(api_client, user_citoyen, zone):
    api_client.force_authenticate(user=user_citoyen)

    response = api_client.get('/api/relais-quartier/moi/')
    assert response.status_code == 200
    assert response.data is None

    response = api_client.post('/api/relais-quartier/', {'zone': zone.id}, format='json')
    assert response.status_code == 201
    assert response.data['verifie'] is False

    response = api_client.get('/api/relais-quartier/moi/')
    assert response.status_code == 200
    assert response.data['zone'] == zone.id


@pytest.mark.django_db
def test_relais_quartier_double_inscription_rejected(api_client, user_citoyen, zone):
    api_client.force_authenticate(user=user_citoyen)
    RelaisQuartier.objects.create(user=user_citoyen, zone=zone)

    response = api_client.post('/api/relais-quartier/', {'zone': zone.id}, format='json')
    assert response.status_code == 400


@pytest.mark.django_db
def test_relais_quartier_verifie_read_only_on_create(api_client, user_citoyen, zone):
    api_client.force_authenticate(user=user_citoyen)
    response = api_client.post('/api/relais-quartier/', {'zone': zone.id, 'verifie': True}, format='json')
    assert response.status_code == 201
    assert response.data['verifie'] is False


@pytest.mark.django_db
def test_relais_quartier_list_reserved_to_autorite(api_client, user_citoyen, user_autorite, zone):
    RelaisQuartier.objects.create(user=user_citoyen, zone=zone)

    api_client.force_authenticate(user=user_citoyen)
    response = api_client.get('/api/relais-quartier/')
    assert response.status_code == 403

    api_client.force_authenticate(user=user_autorite)
    response = api_client.get('/api/relais-quartier/')
    assert response.status_code == 200
    assert response.data['count'] == 1


@pytest.mark.django_db
def test_relais_quartier_verifier_action(api_client, user_citoyen, user_autorite, zone):
    relais = RelaisQuartier.objects.create(user=user_citoyen, zone=zone)

    # Un citoyen ne peut pas se vérifier lui-même.
    api_client.force_authenticate(user=user_citoyen)
    response = api_client.patch(f'/api/relais-quartier/{relais.id}/verifier/', {'verifie': True}, format='json')
    assert response.status_code == 403

    api_client.force_authenticate(user=user_autorite)
    response = api_client.patch(f'/api/relais-quartier/{relais.id}/verifier/', {'verifie': True}, format='json')
    assert response.status_code == 200
    assert response.data['verifie'] is True

    relais.refresh_from_db()
    assert relais.verifie is True


@pytest.mark.django_db
def test_relais_quartier_verifier_action_validates_payload(api_client, user_autorite, user_citoyen, zone):
    relais = RelaisQuartier.objects.create(user=user_citoyen, zone=zone)
    api_client.force_authenticate(user=user_autorite)

    response = api_client.patch(f'/api/relais-quartier/{relais.id}/verifier/', {})
    assert response.status_code == 400

    response = api_client.patch(f'/api/relais-quartier/{relais.id}/verifier/', {'verifie': 'oui'})
    assert response.status_code == 400


@pytest.mark.django_db
def test_relais_quartier_delete_scoped_to_own_user(api_client, user_citoyen, user_citoyen2, zone):
    relais = RelaisQuartier.objects.create(user=user_citoyen, zone=zone)

    api_client.force_authenticate(user=user_citoyen2)
    response = api_client.delete(f'/api/relais-quartier/{relais.id}/')
    assert response.status_code == 404

    api_client.force_authenticate(user=user_citoyen)
    response = api_client.delete(f'/api/relais-quartier/{relais.id}/')
    assert response.status_code == 204
