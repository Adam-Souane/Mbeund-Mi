"""Webhook des SMS entrants : seules les requêtes signées par Twilio passent."""
from types import SimpleNamespace

import pytest
from rest_framework.test import APIClient
from twilio.request_validator import RequestValidator

URL = 'http://testserver/api/sms/inbound/'
DONNEES = {'From': '+221771234567', 'Body': 'Inondation rue 10', 'MessageSid': 'SM123'}


@pytest.fixture
def traitement(monkeypatch):
    recus = []

    def faux_traitement(**kwargs):
        recus.append(kwargs)
        return SimpleNamespace(id=1, signalement_cree_id=None)

    monkeypatch.setattr('api.views.traiter_webhook_sms', faux_traitement)
    return recus


def poster(signature=None):
    entetes = {'HTTP_X_TWILIO_SIGNATURE': signature} if signature else {}
    return APIClient().post('/api/sms/inbound/', DONNEES, **entetes)


def test_signature_valide_acceptee(settings, traitement):
    settings.TWILIO_AUTH_TOKEN = 'jeton-test'
    signature = RequestValidator('jeton-test').compute_signature(URL, DONNEES)
    assert poster(signature).status_code == 200
    assert traitement[0]['phone_number'] == '+221771234567'


def test_signature_absente_ou_fausse_refusee(settings, traitement):
    settings.TWILIO_AUTH_TOKEN = 'jeton-test'
    assert poster().status_code == 403
    fausse = RequestValidator('autre-jeton').compute_signature(URL, DONNEES)
    assert poster(fausse).status_code == 403
    assert traitement == []


def test_sans_jeton_refuse_en_production(settings, traitement):
    settings.TWILIO_AUTH_TOKEN = ''
    settings.DEBUG = False
    assert poster().status_code == 403
    settings.DEBUG = True
    assert poster().status_code == 200
