"""SMS d'alerte : même fournisseur que les codes OTP (Orange en production)."""
import pytest

from api.services import sms_service


class Reponse:
    def __init__(self, code, donnees=None):
        self.status_code, self._donnees, self.text = code, donnees or {}, ''

    def json(self):
        return self._donnees

    def raise_for_status(self):
        assert self.status_code < 400


@pytest.fixture
def orange(monkeypatch, settings):
    """Fournisseur Orange déclaré ; les appels HTTP sont interceptés."""
    envois = []

    def faux_post(url, **kwargs):
        if url == sms_service.ORANGE_TOKEN_URL:
            return Reponse(200, {'access_token': 'jeton', 'expires_in': 3600})
        envois.append(kwargs['json']['outboundSMSMessageRequest'])
        return Reponse(201)

    monkeypatch.setenv('ORANGE_CLIENT_ID', 'id-test')
    monkeypatch.setenv('ORANGE_CLIENT_SECRET', 'secret-test')
    monkeypatch.setattr(sms_service.requests, 'post', faux_post)
    monkeypatch.setitem(sms_service._jeton_orange, 'valeur', None)
    settings.SMS_FOURNISSEUR = 'orange'
    return envois


def test_alerte_par_orange_avec_numero_local(orange):
    assert sms_service.send_alert_sms('77 123 45 67', 'Risque rouge à Ndakhane') is True
    (requete,) = orange
    assert requete['address'] == 'tel:+221771234567'
    assert requete['outboundSMSTextMessage']['message'].startswith('[ALERTE MBEUND MI] Risque rouge à Ndakhane')


def test_alerte_numero_inexploitable_ignore(orange):
    assert sms_service.send_alert_sms('12', 'Risque rouge') is False
    assert orange == []


def test_alerte_refus_orange_signale(monkeypatch, settings):
    def faux_post(url, **kwargs):
        if url == sms_service.ORANGE_TOKEN_URL:
            return Reponse(200, {'access_token': 'jeton'})
        return Reponse(403)

    monkeypatch.setenv('ORANGE_CLIENT_ID', 'id-test')
    monkeypatch.setenv('ORANGE_CLIENT_SECRET', 'secret-test')
    monkeypatch.setattr(sms_service.requests, 'post', faux_post)
    monkeypatch.setitem(sms_service._jeton_orange, 'valeur', None)
    settings.SMS_FOURNISSEUR = 'orange'
    assert sms_service.send_alert_sms('+221771234567', 'Risque rouge') is False


def test_alerte_sans_fournisseur(settings):
    settings.SMS_FOURNISSEUR = ''
    settings.DEBUG = False
    assert sms_service.send_alert_sms('+221771234567', 'Risque rouge') is False
    settings.DEBUG = True
    assert sms_service.send_alert_sms('+221771234567', 'Risque rouge') is True
