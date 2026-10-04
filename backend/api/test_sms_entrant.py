"""Traitement des SMS entrants : localisation, signalement créé, numéro masqué."""
import pytest

from alertes.models import SignalementCitoyen, SMSSignalement
from api.services.sms_inbound_service import SMSInboundService, THIAROYE_CENTER, traiter_webhook_sms


@pytest.mark.parametrize('texte, attendu', [
    ('Inondation à Thiaroye Gare, rue 10', ('Thiaroye - Thiaroye Gare', 14.7575, -17.3789)),
    ('Eau partout à NDAKHANE', ('Thiaroye - Ndakhane', 14.765, -17.385)),
    ('Eau ici 14.752, -17.381', ('Eau ici 14.752, -17.381', 14.752, -17.381)),
])
def test_localisation_extraite(texte, attendu):
    assert SMSInboundService._extraire_localisation(texte) == attendu


def test_coordonnees_hors_de_thiaroye_ignorees():
    # Dakar Plateau, à plus de 4 km
    texte, lat, lon = SMSInboundService._extraire_localisation('Eau 14.67, -17.43')
    assert (lat, lon) == (None, None)
    assert texte == 'Eau 14.67, -17.43'


@pytest.mark.django_db
def test_sms_converti_en_signalement_avec_numero_masque():
    sms = traiter_webhook_sms('+221771234567', 'Inondation à Thiaroye Gare', provider_id='SM1')
    assert sms.statut == 'converti'
    assert SMSSignalement.objects.get(pk=sms.pk).telephone == '+221771234567'
    signalement = SignalementCitoyen.objects.get(pk=sms.signalement_cree_id)
    assert signalement.categorie == 'inondation'
    assert signalement.valide is False
    assert '+221771234567' not in signalement.description
    assert '+221 77 *** ** 67' in signalement.description


@pytest.mark.django_db
def test_sms_sans_lieu_reconnu_place_au_centre_de_thiaroye():
    sms = traiter_webhook_sms('+221771234567', 'Il y a de l eau chez moi')
    signalement = SignalementCitoyen.objects.get(pk=sms.signalement_cree_id)
    lat, lon = THIAROYE_CENTER
    assert str(lon) in str(signalement.localisation) and str(lat) in str(signalement.localisation)
