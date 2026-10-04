"""
Tests des vues du profil citoyen et du triage d'appel, qui renvoyaient une
erreur 500 (imports manquants dans api/views.py), et de la génération des
secrets (mots de passe temporaires et OTP).
"""
import string

import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from alertes.models import SignalementCitoyen, TriageAppel


@pytest.fixture
def citoyen(db):
    return User.objects.create_user(username='citoyen_profil', password='motdepasse123')


@pytest.fixture
def autorite(db):
    user = User.objects.create_user(username='autorite_profil', password='motdepasse123')
    user.profile.role = 'autorite'
    user.profile.save()
    return user


def client_pour(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
def test_kit_de_survie_lecture_et_mise_a_jour(citoyen):
    client = client_pour(citoyen)
    assert client.get('/api/mon-survival-kit/').status_code == 200

    reponse = client.put('/api/mon-survival-kit/', {'eau_potable_litres': 12, 'lampe_torche': True}, format='json')
    assert reponse.status_code == 200
    assert reponse.data['eau_potable_litres'] == 12


@pytest.mark.django_db
def test_contact_urgence_lecture_et_mise_a_jour(citoyen):
    client = client_pour(citoyen)
    assert client.get('/api/mon-emergency-contact/').status_code == 200

    reponse = client.put(
        '/api/mon-emergency-contact/',
        {'nom': 'Awa Diop', 'relation': 'famille', 'telephone': '+221770000020'},
        format='json',
    )
    assert reponse.status_code == 200
    assert reponse.data['nom'] == 'Awa Diop'


@pytest.mark.django_db
def test_historique_ne_montre_que_mes_signalements(citoyen):
    autre = User.objects.create_user(username='autre_citoyen', password='motdepasse123')
    SignalementCitoyen.objects.create(localisation="POINT(-17.375 14.742)", categorie="inondation", signale_par=citoyen)
    SignalementCitoyen.objects.create(localisation="POINT(-17.376 14.741)", categorie="egouts", signale_par=autre)

    reponse = client_pour(citoyen).get('/api/mes-signalements/')

    assert reponse.status_code == 200
    resultats = reponse.data.get('results', reponse.data)
    assert len(resultats) == 1


@pytest.mark.django_db
def test_triage_appel_avec_citoyen_associe(autorite, citoyen):
    reponse = client_pour(autorite).post(
        '/api/enregistrer-triage-appel/',
        {'citoyen_id': citoyen.id, 'categorie': 'evacuation', 'reponses': {'q1': True}, 'pourcentage_complete': 50},
        format='json',
    )
    assert reponse.status_code == 201
    assert TriageAppel.objects.get().citoyen == citoyen


@pytest.mark.django_db
def test_triage_appel_interdit_aux_citoyens(citoyen):
    reponse = client_pour(citoyen).post('/api/enregistrer-triage-appel/', {'categorie': 'eau'}, format='json')
    assert reponse.status_code == 403
    assert not TriageAppel.objects.exists()


def test_otp_genere_avec_secrets():
    from users.views import UserViewSet

    codes = {UserViewSet()._generate_otp() for _ in range(50)}
    assert all(len(c) == 6 and set(c) <= set(string.digits) for c in codes)
    assert len(codes) > 1


def test_aucun_module_random_dans_les_vues_utilisateurs():
    import users.views as vues

    assert not hasattr(vues, 'random'), "random n'est pas sûr pour les mots de passe et les OTP : utiliser secrets"
    assert hasattr(vues, 'secrets')
