"""
Tests de l'OTP (inscription, renvoi, mot de passe oublié) par téléphone ou email.
Les emails partent dans django.core.mail.outbox ; l'envoi SMS est intercepté.
"""
import re

import pytest
from django.contrib.auth.models import User
from django.core import mail
from rest_framework.test import APIClient

from users import otp


@pytest.fixture(autouse=True)
def cache_memoire(settings):
    settings.CACHES = {'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}}
    from django.core.cache import cache
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def envois_telephone(monkeypatch, settings):
    # Un fournisseur SMS est déclaré ; l'envoi lui-même est intercepté.
    settings.SMS_FOURNISSEUR = 'orange'
    envois = []
    monkeypatch.setattr(
        'api.services.sms_service.send_otp_sms',
        lambda numero, code: envois.append((numero, code)) or True,
    )
    return envois


def inscrire(client, **champs):
    donnees = {
        'username': 'awadiop', 'password': 'motdepasse123', 'first_name': 'Awa', 'last_name': 'Diop',
        'telephone': '77 123 45 67',
    }
    donnees.update(champs)
    return client.post('/api/users/register/', donnees, format='json')


def code_du_dernier_email():
    return re.search(r'\b(\d{6})\b', mail.outbox[-1].body).group(1)


# --- Numéros ---------------------------------------------------------------

@pytest.mark.parametrize('saisie, attendu', [
    ('77 123 45 67', '+221771234567'),
    ('771234567', '+221771234567'),
    ('+221 77 123 45 67', '+221771234567'),
    ('00221771234567', '+221771234567'),
    ('33-820-00-00', '+221338200000'),
    ('+33 6 12 34 56 78', '+33612345678'),
    ('12345', None),
    ('abc', None),
    ('', None),
])
def test_normaliser_telephone(saisie, attendu):
    assert otp.normaliser_telephone(saisie) == attendu


def test_masquage():
    assert otp.masquer_telephone('+221771234567') == '+221 77 *** ** 67'
    assert otp.masquer_email('awa.diop@gmail.com') == 'a*******@gmail.com'


# --- Inscription -----------------------------------------------------------

@pytest.mark.django_db
def test_inscription_ne_peut_pas_creer_un_admin(envois_telephone):
    reponse = inscrire(APIClient(), role='admin')
    assert reponse.status_code == 201
    assert User.objects.get(username='awadiop').profile.role == 'citoyen'


@pytest.mark.django_db
def test_inscription_code_par_telephone(envois_telephone):
    reponse = inscrire(APIClient())
    assert reponse.status_code == 201
    assert reponse.data['otp']['canal'] == 'telephone'
    assert reponse.data['otp']['destination'] == '+221 77 *** ** 67'
    assert User.objects.get(username='awadiop').profile.telephone == '+221771234567'
    assert len(envois_telephone) == 1 and envois_telephone[0][0] == '+221771234567'
    assert not mail.outbox


@pytest.mark.django_db
def test_inscription_code_par_email(envois_telephone):
    reponse = inscrire(APIClient(), email='awa@exemple.sn', canal_otp='email')
    assert reponse.status_code == 201
    assert reponse.data['otp']['envoye'] is True
    assert reponse.data['otp']['destination'] == 'a***@exemple.sn'
    assert len(mail.outbox) == 1
    message = mail.outbox[0]
    assert message.to == ['awa@exemple.sn']
    assert 'code de vérification' in message.subject
    assert re.search(r'\b\d{6}\b', message.body)
    assert not envois_telephone


@pytest.mark.django_db
@pytest.mark.parametrize('champs, champ_en_erreur', [
    ({'canal_otp': 'email'}, 'canal_otp'),                  # email demandé mais absent
    ({'telephone': ''}, 'telephone'),                       # téléphone obligatoire
    ({'telephone': '12345'}, 'telephone'),                  # numéro inexploitable
    ({'email': 'pas-un-email'}, 'email'),
    ({'canal_otp': 'pigeon'}, 'canal_otp'),
])
def test_inscription_refusee(envois_telephone, champs, champ_en_erreur):
    reponse = inscrire(APIClient(), **champs)
    assert reponse.status_code == 400
    assert champ_en_erreur in reponse.data
    assert not User.objects.filter(username='awadiop').exists()


@pytest.mark.django_db
def test_un_numero_par_compte(envois_telephone):
    client = APIClient()
    assert inscrire(client).status_code == 201
    reponse = inscrire(client, username='autre', telephone='+221771234567')
    assert reponse.status_code == 400
    assert 'telephone' in reponse.data


# --- Vérification et renvoi ------------------------------------------------

@pytest.mark.django_db
def test_verification_avec_le_code_recu_par_email(envois_telephone):
    client = APIClient()
    inscrire(client, email='awa@exemple.sn', canal_otp='email')

    reponse = client.post('/api/users/verify-otp/', {'username': 'awadiop', 'otp': code_du_dernier_email()}, format='json')

    assert reponse.status_code == 200
    assert User.objects.get(username='awadiop').profile.is_verified is True


@pytest.mark.django_db
def test_code_annule_apres_cinq_erreurs(envois_telephone):
    client = APIClient()
    inscrire(client)
    bon_code = envois_telephone[0][1]
    mauvais = '000000' if bon_code != '000000' else '111111'

    for _ in range(otp.ESSAIS_MAX):
        client.post('/api/users/verify-otp/', {'username': 'awadiop', 'otp': mauvais}, format='json')
    reponse = client.post('/api/users/verify-otp/', {'username': 'awadiop', 'otp': bon_code}, format='json')

    assert reponse.status_code == 400
    assert 'expiré' in reponse.data['detail']


@pytest.mark.django_db
def test_renvoi_par_email_apres_inscription_par_telephone(envois_telephone, settings):
    client = APIClient()
    inscrire(client, email='awa@exemple.sn')

    trop_tot = client.post('/api/users/resend-otp/', {'username': 'awadiop', 'canal': 'email'}, format='json')
    assert trop_tot.status_code == 429

    from django.core.cache import cache
    cache.delete(f'otp_delai_{otp.MOTIF_INSCRIPTION}_{User.objects.get(username="awadiop").pk}')
    reponse = client.post('/api/users/resend-otp/', {'username': 'awadiop', 'canal': 'email'}, format='json')

    assert reponse.status_code == 200
    assert reponse.data['canal'] == 'email'
    verif = client.post('/api/users/verify-otp/', {'username': 'awadiop', 'otp': code_du_dernier_email()}, format='json')
    assert verif.status_code == 200


@pytest.mark.django_db
def test_renvoi_par_email_impossible_sans_email(envois_telephone):
    client = APIClient()
    inscrire(client)
    reponse = client.post('/api/users/resend-otp/', {'username': 'awadiop', 'canal': 'email'}, format='json')
    assert reponse.status_code == 400


# --- Mot de passe oublié ----------------------------------------------------

@pytest.mark.django_db
def test_mot_de_passe_oublie_par_email_de_bout_en_bout(envois_telephone):
    client = APIClient()
    inscrire(client, email='awa@exemple.sn')
    mail.outbox.clear()

    demande = client.post('/api/users/password-reset/', {'identifiant': 'awa@exemple.sn', 'canal': 'email'}, format='json')
    assert demande.status_code == 200
    assert 'réinitialisation' in mail.outbox[-1].subject

    confirmation = client.post('/api/users/confirm-password-reset/', {
        'identifiant': 'awa@exemple.sn', 'code': code_du_dernier_email(), 'new_password': 'nouveau-secret-42',
    }, format='json')

    assert confirmation.status_code == 200
    assert User.objects.get(username='awadiop').check_password('nouveau-secret-42')


@pytest.mark.django_db
def test_mot_de_passe_oublie_par_telephone_au_format_local(envois_telephone):
    client = APIClient()
    inscrire(client)
    envois_telephone.clear()

    client.post('/api/users/password-reset/', {'identifiant': '771234567'}, format='json')

    assert len(envois_telephone) == 1
    code = envois_telephone[0][1]
    reponse = client.post('/api/users/confirm-password-reset/', {
        'identifiant': '77 123 45 67', 'code': code, 'new_password': 'nouveau-secret-42',
    }, format='json')
    assert reponse.status_code == 200


@pytest.mark.django_db
def test_mot_de_passe_oublie_ne_revele_pas_les_comptes(envois_telephone):
    client = APIClient()
    inscrire(client, email='awa@exemple.sn')
    mail.outbox.clear()

    connu = client.post('/api/users/password-reset/', {'identifiant': 'awa@exemple.sn'}, format='json')
    inconnu = client.post('/api/users/password-reset/', {'identifiant': 'personne@exemple.sn'}, format='json')

    assert connu.status_code == inconnu.status_code == 200
    assert connu.data['detail'] == inconnu.data['detail']
    assert len(mail.outbox) == 1


@pytest.mark.django_db
def test_prenom_echappe_dans_l_email(envois_telephone):
    inscrire(APIClient(), email='awa@exemple.sn', canal_otp='email', first_name='<b>Awa</b>')
    html = mail.outbox[0].alternatives[0][0]
    assert '<b>Awa</b>' not in html
    assert '&lt;b&gt;Awa&lt;/b&gt;' in html


# --- Connexion des comptes non vérifiés -------------------------------------

def connecter(client, username='awadiop', password='motdepasse123'):
    return client.post('/api/token/', {'username': username, 'password': password}, format='json')


@pytest.mark.django_db
def test_connexion_refusee_tant_que_le_nouveau_compte_n_est_pas_verifie(envois_telephone):
    client = APIClient()
    inscrire(client)
    reponse = connecter(client)
    assert reponse.status_code == 403
    assert reponse.data['code'] == 'compte_non_verifie'
    assert reponse.data['username'] == 'awadiop'
    assert 'access' not in reponse.data
    # Le code d'inscription vient de partir : pas de second SMS immédiat
    assert reponse.data['otp']['envoye'] is False
    assert len(envois_telephone) == 1


@pytest.mark.django_db
def test_connexion_bloquee_renvoie_un_code_apres_le_delai(envois_telephone):
    from django.core.cache import cache
    client = APIClient()
    inscrire(client)
    cache.clear()   # délai de renvoi écoulé
    reponse = connecter(client)
    assert reponse.status_code == 403
    assert reponse.data['otp']['envoye'] is True
    _, code = envois_telephone[-1]
    assert client.post('/api/users/verify-otp/', {'username': 'awadiop', 'otp': code}, format='json').status_code == 200
    assert 'access' in connecter(client).data


@pytest.mark.django_db
def test_mauvais_mot_de_passe_ne_revele_pas_la_verification(envois_telephone):
    client = APIClient()
    inscrire(client)
    reponse = connecter(client, password='mauvais-mot-de-passe')
    assert reponse.status_code == 401
    assert 'otp' not in reponse.data


@pytest.mark.django_db
def test_comptes_existants_non_bloques():
    User.objects.create_user(username='ancien', password='motdepasse123')
    assert 'access' in connecter(APIClient(), 'ancien').data


# --- Envoi SMS ----------------------------------------------------------------

def test_sms_sans_fournisseur_echoue_en_production(settings):
    from api.services import sms_service
    settings.SMS_FOURNISSEUR = ''
    settings.DEBUG = False
    assert sms_service.send_otp_sms('+221771234567', '123456') is False
    settings.DEBUG = True
    assert sms_service.send_otp_sms('+221771234567', '123456') is True


def test_sms_echec_twilio_signale(monkeypatch, settings):
    from api.services import sms_service

    class ClientEnPanne:
        def __init__(self, *args):
            raise RuntimeError('numéro non vérifié')

    monkeypatch.setenv('TWILIO_ACCOUNT_SID', 'AC-test')
    monkeypatch.setenv('TWILIO_AUTH_TOKEN', 'jeton-test')
    monkeypatch.setenv('TWILIO_PHONE_NUMBER', '+15550000000')
    monkeypatch.setattr('twilio.rest.Client', ClientEnPanne)
    settings.SMS_FOURNISSEUR = 'twilio'
    settings.DEBUG = True
    assert sms_service.send_otp_sms('+221771234567', '123456') is False


@pytest.mark.django_db
def test_routes_publiques_ignorent_un_jeton_perime(envois_telephone):
    # Un ancien jeton resté dans le navigateur ne doit pas bloquer la vérification.
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION='Bearer jeton.perime.invalide')
    inscrire(client)
    _, code = envois_telephone[-1]
    reponse = client.post('/api/users/verify-otp/', {'username': 'awadiop', 'otp': code}, format='json')
    assert reponse.status_code == 200


def test_sms_par_orange(monkeypatch, settings):
    from api.services import sms_service

    class Reponse:
        def __init__(self, code, donnees=None):
            self.status_code, self._donnees, self.text = code, donnees or {}, ''

        def json(self):
            return self._donnees

        def raise_for_status(self):
            assert self.status_code < 400

    appels = []

    def faux_post(url, **kwargs):
        appels.append((url, kwargs))
        if url == sms_service.ORANGE_TOKEN_URL:
            return Reponse(200, {'access_token': 'jeton', 'expires_in': 3600})
        return Reponse(201)

    monkeypatch.setenv('ORANGE_CLIENT_ID', 'id-test')
    monkeypatch.setenv('ORANGE_CLIENT_SECRET', 'secret-test')
    monkeypatch.setattr(sms_service.requests, 'post', faux_post)
    monkeypatch.setitem(sms_service._jeton_orange, 'valeur', None)
    settings.SMS_FOURNISSEUR = 'orange'

    assert sms_service.send_otp_sms('+221771234567', '123456') is True
    (url_jeton, _), (url_sms, envoi) = appels
    assert url_jeton == sms_service.ORANGE_TOKEN_URL
    assert url_sms.endswith('/outbound/tel%3A%2B2210000/requests')
    requete = envoi['json']['outboundSMSMessageRequest']
    assert requete['address'] == 'tel:+221771234567'
    assert requete['senderAddress'] == 'tel:+2210000'
    assert '123456' in requete['outboundSMSTextMessage']['message']
    assert envoi['headers']['Authorization'] == 'Bearer jeton'


# --- Sans fournisseur SMS : tout passe par l'email ----------------------------

@pytest.fixture
def sans_sms(settings):
    settings.SMS_FOURNISSEUR = ''
    settings.DEBUG = False


@pytest.mark.django_db
def test_canaux_annonces(sans_sms):
    assert APIClient().get('/api/users/otp-canaux/').data == {'telephone': False, 'email': True}


@pytest.mark.django_db
def test_inscription_exige_un_email_sans_sms(sans_sms):
    reponse = inscrire(APIClient())
    assert reponse.status_code == 400
    assert 'canal_otp' in reponse.data
    assert not User.objects.filter(username='awadiop').exists()


@pytest.mark.django_db
def test_inscription_par_email_par_defaut_sans_sms(sans_sms):
    reponse = inscrire(APIClient(), email='awa@example.com')
    assert reponse.status_code == 201
    assert reponse.data['otp']['canal'] == 'email'
    assert len(mail.outbox) == 1


@pytest.mark.django_db
def test_mot_de_passe_oublie_par_sms_refuse_sans_sms(sans_sms):
    reponse = APIClient().post('/api/users/password-reset/', {'identifiant': '771234567', 'canal': 'telephone'}, format='json')
    assert reponse.status_code == 400


@pytest.mark.django_db
def test_connexion_bloquee_renvoie_le_code_par_email_sans_sms(sans_sms):
    from django.core.cache import cache
    client = APIClient()
    inscrire(client, email='awa@example.com')
    cache.clear()
    reponse = connecter(client)
    assert reponse.status_code == 403
    assert reponse.data['otp']['canal'] == 'email'
    assert reponse.data['otp']['envoye'] is True
