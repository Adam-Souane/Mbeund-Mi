"""
Tests de non-régression de la diffusion des alertes (WebSocket, push, SMS)
et du calcul du niveau de risque par la tâche planifiée.
"""
import pytest
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient

from alertes.models import Alerte, ContactAlerte, SignalementCitoyen, ZoneRisque


@pytest.fixture
def zone(db):
    return ZoneRisque.objects.create(
        geom="POLYGON((-17.38 14.74, -17.38 14.75, -17.37 14.75, -17.37 14.74, -17.38 14.74))",
        quartier="Thiaroye sur Mer",
        niveau_risque="vert",
    )


def ajouter_pluie(zone, mm):
    """Enregistre un relevé de pluviomètre dans la zone (cumul 24 h = mm)."""
    from capteurs.models import Capteur, Mesure
    capteur = Capteur.objects.create(
        nom="Pluvio test", type="pluviometre", localisation="POINT(-17.375 14.742)",
        zone=zone, date_installation="2026-01-01",
    )
    Mesure.objects.create(capteur=capteur, valeur=mm, unite="mm", timestamp=timezone.now())


@pytest.fixture
def diffusions(monkeypatch):
    """Capture les messages WebSocket au lieu de les envoyer."""
    envoyes = []
    monkeypatch.setattr(
        'alertes.signals._diffuser',
        lambda groupe, type_message, donnees: envoyes.append((groupe, type_message)),
    )
    return envoyes


@pytest.fixture
def sms_envoyes(monkeypatch):
    numeros = []
    monkeypatch.setattr(
        'alertes.tasks.send_alert_sms',
        lambda numero, message: numeros.append(numero) or True,
    )
    return numeros


@pytest.mark.django_db
def test_creation_alerte_diffusee_en_temps_reel(zone, diffusions, sms_envoyes):
    Alerte.objects.create(niveau='jaune', zone=zone, message="Vigilance", timestamp=timezone.now())
    assert ("alertes", "send_alerte") in diffusions


@pytest.mark.django_db
def test_alerte_rouge_declenche_notification_push(zone, diffusions, sms_envoyes, monkeypatch):
    pushes = []
    monkeypatch.setattr(
        'api.firebase_service.envoyer_notification_push',
        lambda titre, corps, topic="thiaroye_alertes": pushes.append(titre) or True,
    )
    Alerte.objects.create(niveau='rouge', zone=zone, message="Évacuez", timestamp=timezone.now())
    assert len(pushes) == 1
    assert "Thiaroye sur Mer" in pushes[0]


@pytest.mark.django_db
def test_nouveau_signalement_signale_aux_autorites(diffusions):
    SignalementCitoyen.objects.create(localisation="POINT(-17.375 14.742)", categorie="inondation")
    assert ("autorite_notifications", "send_signalement") in diffusions


@pytest.mark.django_db
@pytest.mark.parametrize("score_risque, niveau_attendu", [(0.70, 'orange'), (0.90, 'rouge'), (0.50, 'jaune')])
def test_tache_planifiee_envoie_un_seul_sms_par_alerte(
    zone, diffusions, sms_envoyes, monkeypatch, score_risque, niveau_attendu
):
    """Orange/rouge passaient par la tâche ET par le signal : deux SMS identiques."""
    from alertes.tasks import predire_risques_avec_random_forest

    ContactAlerte.objects.create(telephone="+221770000010", zone=zone, actif=True)
    ajouter_pluie(zone, 60)
    monkeypatch.setattr('alertes.tasks.predict_zone_risk', lambda nom, pluie: {
        'risque': 'Grave', 'score': 0.99, 'score_risque': score_risque,
        'probabilites': {'Faible': 0.1, 'Moyen': 0.3, 'Grave': 0.6},
    })

    predire_risques_avec_random_forest()

    zone.refresh_from_db()
    assert zone.niveau_risque == niveau_attendu
    assert Alerte.objects.filter(zone=zone, niveau=niveau_attendu).count() == 1
    assert sms_envoyes == ["+221770000010"]


@pytest.mark.django_db
def test_prediction_faible_tres_sure_ne_met_pas_la_zone_au_rouge(zone, diffusions, sms_envoyes, monkeypatch):
    """Avant correction, la confiance (0,95) d'une prédiction « Faible » servait de score de risque."""
    from alertes.tasks import predire_risques_avec_random_forest

    ajouter_pluie(zone, 40)
    monkeypatch.setattr('alertes.tasks.predict_zone_risk', lambda nom, pluie: {
        'risque': 'Faible', 'score': 0.95, 'score_risque': 0.04,
        'probabilites': {'Faible': 0.95, 'Moyen': 0.03, 'Grave': 0.02},
    })

    predire_risques_avec_random_forest()

    zone.refresh_from_db()
    assert zone.niveau_risque == 'vert'
    assert not Alerte.objects.filter(zone=zone).exists()


def test_score_risque_croit_avec_la_gravite():
    from alertes.flood_risk_predictor import FloodRiskPredictor

    predicteur = FloodRiskPredictor()
    if predicteur._model_data is None:
        pytest.skip("Modèle Random Forest absent")
    sec = predicteur.predict_zone_risk("Thiaroye sur Mer", 0.0)
    fort = predicteur.predict_zone_risk("Thiaroye sur Mer", 80.0)
    if 'erreur' in sec or 'erreur' in fort:
        pytest.skip("Prédiction indisponible")
    assert 0.0 <= sec['score_risque'] <= fort['score_risque'] <= 1.0
    assert fort['score_risque'] > sec['score_risque']


@pytest.mark.django_db
def test_pluie_faible_hors_domaine_du_modele_laisse_la_zone_au_vert(zone, diffusions, sms_envoyes, monkeypatch):
    """Sous 30 mm, le modèle (entraîné à partir de 35,8 mm) n'est pas consulté."""
    from alertes.tasks import predire_risques_avec_random_forest

    zone.niveau_risque = 'jaune'
    zone.save()
    ajouter_pluie(zone, 5)
    appels = []
    monkeypatch.setattr('alertes.tasks.predict_zone_risk', lambda nom, pluie: appels.append(pluie) or {
        'risque': 'Moyen', 'score': 0.9, 'score_risque': 0.51, 'probabilites': {'Faible': 0, 'Moyen': 1, 'Grave': 0},
    })

    predire_risques_avec_random_forest()

    zone.refresh_from_db()
    assert appels == []
    assert zone.niveau_risque == 'vert'
    assert not Alerte.objects.filter(zone=zone).exists()


@pytest.mark.django_db
def test_validation_signalement_journalisee_pour_l_autorite(diffusions):
    from users.models import AuthorityActivity

    autorite = User.objects.create_user(username='autorite_journal', password='motdepasse123')
    autorite.profile.role = 'autorite'
    autorite.profile.save()
    signalement = SignalementCitoyen.objects.create(
        localisation="POINT(-17.375 14.742)", categorie="inondation", valide=False
    )

    client = APIClient()
    client.force_authenticate(user=autorite)
    reponse = client.patch(f'/api/signalements/{signalement.id}/valider/', {'valide': True}, format='json')

    assert reponse.status_code == 200
    activite = AuthorityActivity.objects.get(action_type='request_handled')
    assert activite.authority == autorite
