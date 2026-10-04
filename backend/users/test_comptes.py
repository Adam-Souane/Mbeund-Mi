"""
Gestion des comptes : routes génériques fermées, identifiants proposés,
inscription administrateur par invitation, gestion des autorités (réservée à
l'administrateur).
"""
from datetime import timedelta

import pytest
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient

from users.models import AuthorityTracking, InviteCode


def compte(username, role='citoyen', password='motdepasse123'):
    user = User.objects.create_user(username=username, password=password, email=f'{username}@example.com')
    user.profile.role = role
    user.profile.telephone = '+221770000000'
    user.profile.save()
    return user


def client_de(user):
    client = APIClient()
    client.force_authenticate(user)
    return client


# --- Routes génériques fermées ------------------------------------------------

@pytest.mark.django_db
def test_un_citoyen_ne_peut_ni_lister_ni_modifier_ni_supprimer_les_comptes():
    citoyen = compte('awa')
    admin = compte('admin', role='admin')
    client = client_de(citoyen)
    assert client.get('/api/users/').status_code in (404, 405)
    assert client.get(f'/api/users/{admin.pk}/').status_code in (404, 405)
    assert client.patch(f'/api/users/{admin.pk}/', {'email': 'pirate@example.com'}, format='json').status_code in (404, 405)
    assert client.delete(f'/api/users/{admin.pk}/').status_code in (404, 405)
    admin.refresh_from_db()
    assert admin.email == 'admin@example.com'


# --- Identifiants proposés ----------------------------------------------------

@pytest.mark.django_db
def test_identifiants_proposes():
    client = APIClient()
    assert client.get('/api/users/check-username/').status_code == 400
    reponse = client.get('/api/users/check-username/', {'first_name': 'Awa', 'last_name': 'Diop'})
    assert reponse.status_code == 200
    assert reponse.data['options']
    assert reponse.data['recommended'] == reponse.data['options'][0]
    # Un identifiant déjà pris n'est plus proposé
    compte(reponse.data['options'][0])
    suivante = client.get('/api/users/check-username/', {'first_name': 'Awa', 'last_name': 'Diop'})
    assert reponse.data['options'][0] not in suivante.data['options']


# --- Inscription administrateur -----------------------------------------------

def invitation(**champs):
    valeurs = {'code': InviteCode.generate_code(), 'expires_at': timezone.now() + timedelta(days=1)}
    valeurs.update(champs)
    return InviteCode.objects.create(**valeurs)


def inscrire_admin(code, **champs):
    donnees = {
        'code': code, 'email': 'chef@example.com', 'password': 'motdepasse123',
        'first_name': 'Mame', 'last_name': 'Ndiaye', 'telephone': '771112233',
    }
    donnees.update(champs)
    return APIClient().post('/api/users/admin-register/', donnees, format='json')


@pytest.mark.django_db
def test_inscription_admin_avec_invitation_valide():
    invite = invitation()
    reponse = inscrire_admin(invite.code)
    assert reponse.status_code == 201
    admin = User.objects.get(email='chef@example.com')
    assert admin.profile.role == 'admin'
    assert admin.profile.is_verified
    invite.refresh_from_db()
    assert invite.used and invite.used_by == admin
    # Une invitation ne sert qu'une fois
    assert inscrire_admin(invite.code, email='autre@example.com').status_code == 400


@pytest.mark.django_db
@pytest.mark.parametrize('cas', ['sans_code', 'code_inconnu', 'expiree', 'mot_de_passe_court', 'sans_telephone'])
def test_inscription_admin_refusee(cas):
    invite = invitation(expires_at=timezone.now() - timedelta(minutes=1)) if cas == 'expiree' else invitation()
    code = {'sans_code': '', 'code_inconnu': 'inconnu'}.get(cas, invite.code)
    champs = {'mot_de_passe_court': {'password': 'court'}, 'sans_telephone': {'telephone': ''}}.get(cas, {})
    assert inscrire_admin(code, **champs).status_code == 400
    assert not User.objects.filter(email='chef@example.com').exists()


# --- Gestion des autorités ----------------------------------------------------

@pytest.fixture
def admin_client(db):
    return client_de(compte('admin', role='admin'))


def creer_autorite(client, **champs):
    donnees = {
        'first_name': 'Moussa', 'last_name': 'Fall', 'email': 'moussa@example.com',
        'telephone': '+221771234567', 'username': 'moussafall',
    }
    donnees.update(champs)
    return client.post('/api/users/create-authority/', donnees, format='json')


@pytest.mark.django_db
@pytest.mark.parametrize('route, methode', [
    ('/api/users/create-authority/', 'post'),
    ('/api/users/list-authorities/', 'get'),
    ('/api/users/regenerate-authority-password/', 'post'),
    ('/api/users/delete-authority/', 'post'),
    ('/api/users/authority-stats/', 'get'),
    ('/api/users/authority-activities/1/', 'get'),
])
@pytest.mark.parametrize('role', ['citoyen', 'autorite'])
def test_gestion_des_autorites_reservee_a_l_admin(route, methode, role):
    client = client_de(compte('utilisateur', role=role))
    if methode == 'post':
        reponse = client.post(route, {'username': 'utilisateur'}, format='json')
    else:
        reponse = client.get(route)
    assert reponse.status_code == 403


@pytest.mark.django_db
def test_creation_d_une_autorite(admin_client):
    reponse = creer_autorite(admin_client)
    assert reponse.status_code == 201
    autorite = User.objects.get(username='moussafall')
    assert autorite.profile.role == 'autorite'
    assert autorite.check_password(reponse.data['password'])
    assert AuthorityTracking.objects.filter(user=autorite).exists()
    # Identifiant ou email déjà pris
    assert creer_autorite(admin_client, email='autre@example.com').status_code == 400
    assert creer_autorite(admin_client, username='autre').status_code == 400


@pytest.mark.django_db
@pytest.mark.parametrize('champ', ['first_name', 'last_name', 'username', 'telephone'])
def test_creation_d_une_autorite_champ_manquant(admin_client, champ):
    assert creer_autorite(admin_client, **{champ: ''}).status_code == 400


@pytest.mark.django_db
def test_liste_statistiques_et_activites_des_autorites(admin_client):
    creer_autorite(admin_client)
    autorite = User.objects.get(username='moussafall')
    liste = admin_client.get('/api/users/list-authorities/')
    assert liste.status_code == 200 and liste.data['count'] == 1
    stats = admin_client.get('/api/users/authority-stats/')
    assert stats.status_code == 200
    assert stats.data['authorities'][0]['username'] == 'moussafall'
    assert admin_client.get(f'/api/users/authority-activities/{autorite.pk}/').status_code == 200


@pytest.mark.django_db
def test_regeneration_du_mot_de_passe_d_une_autorite(admin_client):
    creer_autorite(admin_client)
    reponse = admin_client.post('/api/users/regenerate-authority-password/', {'username': 'moussafall'}, format='json')
    assert reponse.status_code == 200
    assert User.objects.get(username='moussafall').check_password(reponse.data['password'])


@pytest.mark.django_db
def test_regeneration_refusee_pour_un_compte_non_autorite(admin_client):
    citoyen = compte('awa')
    reponse = admin_client.post('/api/users/regenerate-authority-password/', {'username': 'awa'}, format='json')
    assert reponse.status_code == 404
    citoyen.refresh_from_db()
    assert citoyen.check_password('motdepasse123')


@pytest.mark.django_db
def test_suppression_d_une_autorite(admin_client):
    creer_autorite(admin_client)
    compte('awa')
    assert admin_client.post('/api/users/delete-authority/', {'username': 'awa'}, format='json').status_code == 400
    assert User.objects.filter(username='awa').exists()
    assert admin_client.post('/api/users/delete-authority/', {'username': 'moussafall'}, format='json').status_code == 200
    assert not User.objects.filter(username='moussafall').exists()
