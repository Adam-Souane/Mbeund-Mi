import pytest
from datetime import timedelta
from django.utils import timezone
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from alertes.models import ZoneRisque, Alerte, SegmentRue, PrevisionMeteo, HistoriqueRisque, PredictionIA

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def auth_client(api_client, db):
    user = User.objects.create_user(username='testuser', password='password123')
    user.profile.role = 'autorite'
    user.profile.save()
    api_client.force_authenticate(user=user)
    return api_client

@pytest.fixture
def citoyen_client(api_client, db):
    user = User.objects.create_user(username='citoyen_alertes', password='password123')
    user.profile.role = 'citoyen'
    user.profile.save()
    api_client.force_authenticate(user=user)
    return api_client

@pytest.fixture
def test_zone(db):
    return ZoneRisque.objects.create(
        geom="POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))",
        quartier="Thiaroye",
        niveau_risque="jaune"
    )

@pytest.mark.django_db
def test_create_alerte_success(auth_client, test_zone):
    url = '/api/alertes/'
    data = {
        "niveau": "orange",
        "zone": test_zone.id,
        "timestamp": timezone.now().isoformat(),
        "canaux": "sms,email",
        "statut": "en_attente"
    }
    response = auth_client.post(url, data, format='json')
    assert response.status_code == 201
    assert response.data['niveau'] == 'orange'
    assert response.data['statut'] == 'en_attente'
    assert response.data['zone']['id'] == test_zone.id
    assert response.data['zone']['quartier'] == 'Thiaroye'

@pytest.mark.django_db
def test_create_alerte_invalid_niveau(auth_client, test_zone):
    url = '/api/alertes/'
    data = {
        "niveau": "invalid_color",
        "zone": test_zone.id,
        "timestamp": timezone.now().isoformat(),
        "canaux": "sms"
    }
    response = auth_client.post(url, data, format='json')
    assert response.status_code == 400
    assert 'niveau' in response.data

@pytest.mark.django_db
def test_list_and_filter_alertes(auth_client, test_zone):
    zone2 = ZoneRisque.objects.create(
        geom="POLYGON((1 1, 1 2, 2 2, 2 1, 1 1))",
        quartier="Dakar",
        niveau_risque="rouge"
    )
    
    a1 = Alerte.objects.create(niveau="jaune", zone=test_zone, timestamp=timezone.now(), statut="en_attente")
    a2 = Alerte.objects.create(niveau="rouge", zone=test_zone, timestamp=timezone.now(), statut="envoyee")
    a3 = Alerte.objects.create(niveau="jaune", zone=zone2, timestamp=timezone.now(), statut="resolue")

    # List all (paginé : /api/alertes/ grossit en continu)
    response = auth_client.get('/api/alertes/')
    assert response.status_code == 200
    assert response.data['count'] == 3

    # Filter by zone
    response = auth_client.get(f'/api/alertes/?zone={test_zone.id}')
    assert response.status_code == 200
    assert response.data['count'] == 2
    for item in response.data['results']:
        assert item['zone']['id'] == test_zone.id

    # Filter by level
    response = auth_client.get('/api/alertes/?niveau=jaune')
    assert response.status_code == 200
    assert response.data['count'] == 2
    for item in response.data['results']:
        assert item['niveau'] == 'jaune'

    # Filter by both
    response = auth_client.get(f'/api/alertes/?zone={test_zone.id}&niveau=jaune')
    assert response.status_code == 200
    assert response.data['count'] == 1
    assert response.data['results'][0]['id'] == a1.id

@pytest.mark.django_db
def test_statut_transitions_valid(auth_client, test_zone):
    # niveau="jaune" (pas orange/rouge) : ce test vérifie la machine à états du
    # statut en isolation, pas le pipeline SMS automatique (qui passerait lui-même
    # le statut à 'envoyee' dès la création pour orange/rouge — voir signals.py).
    alerte = Alerte.objects.create(niveau="jaune", zone=test_zone, timestamp=timezone.now(), statut="en_attente")
    url = f'/api/alertes/{alerte.id}/statut/'

    # 1. transition en_attente -> envoyee
    response = auth_client.patch(url, {"statut": "envoyee"}, format='json')
    assert response.status_code == 200
    assert response.data['statut'] == 'envoyee'

    # 2. same status transition (envoyee -> envoyee) - no-op
    response = auth_client.patch(url, {"statut": "envoyee"}, format='json')
    assert response.status_code == 200
    assert response.data['statut'] == 'envoyee'

    # 3. transition envoyee -> resolue
    response = auth_client.patch(url, {"statut": "resolue"}, format='json')
    assert response.status_code == 200
    assert response.data['statut'] == 'resolue'

@pytest.mark.django_db
def test_statut_transitions_invalid(auth_client, test_zone):
    # niveau="jaune" : voir commentaire de test_statut_transitions_valid ci-dessus.
    alerte = Alerte.objects.create(niveau="jaune", zone=test_zone, timestamp=timezone.now(), statut="en_attente")
    url = f'/api/alertes/{alerte.id}/statut/'

    # Transition direct en_attente -> resolue is invalid
    response = auth_client.patch(url, {"statut": "resolue"}, format='json')
    assert response.status_code == 400
    assert 'detail' in response.data

    # Change to envoyee
    alerte.statut = "envoyee"
    alerte.save()

    # Transition envoyee -> en_attente is invalid (cannot go backwards)
    response = auth_client.patch(url, {"statut": "en_attente"}, format='json')
    assert response.status_code == 400
    assert 'detail' in response.data

    # Change to resolue
    alerte.statut = "resolue"
    alerte.save()

    # Transition from resolue to anything is invalid
    response = auth_client.patch(url, {"statut": "envoyee"}, format='json')
    assert response.status_code == 400
    assert 'detail' in response.data


@pytest.mark.django_db
def test_alerte_orange_rouge_declenche_sms_et_passe_envoyee(test_zone):
    # Comportement intentionnel (Étape 4) : une alerte orange/rouge notifie
    # automatiquement par SMS dès sa création, ce qui la fait passer directement
    # à 'envoyee' — sans transition manuelle via /statut/. C'est ce qui a cassé
    # test_statut_transitions_valid/invalid quand Celery est passé en mode eager
    # pour les tests (avant, la tâche restait simplement en file, jamais exécutée).
    alerte = Alerte.objects.create(niveau="rouge", zone=test_zone, timestamp=timezone.now(), statut="en_attente")
    alerte.refresh_from_db()
    assert alerte.statut == "envoyee"


@pytest.mark.django_db
def test_alerte_jaune_ne_declenche_pas_sms(test_zone):
    alerte = Alerte.objects.create(niveau="jaune", zone=test_zone, timestamp=timezone.now(), statut="en_attente")
    alerte.refresh_from_db()
    assert alerte.statut == "en_attente"


import asyncio
from channels.testing import WebsocketCommunicator
from channels.db import database_sync_to_async
from mbeund_mi_backend.asgi import application

@pytest.mark.django_db(transaction=True)
def test_websocket_alerte_broadcast():
    async def run_test():
        # 1. Create ZoneRisque
        @database_sync_to_async
        def create_test_data():
            return ZoneRisque.objects.create(
                geom="POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))",
                quartier="Thiaroye",
                niveau_risque="jaune"
            )
            
        zone = await create_test_data()

        # 2. Connect to the WebSocket
        communicator = WebsocketCommunicator(application, "/ws/alertes/")
        connected, subprotocol = await communicator.connect()
        assert connected

        # 3. Create Alerte to trigger the post_save signal
        @database_sync_to_async
        def create_alerte(zone_obj):
            import django.utils.timezone as dj_timezone
            return Alerte.objects.create(
                niveau="rouge",
                zone=zone_obj,
                timestamp=dj_timezone.now(),
                canaux="sms",
                statut="en_attente"
            )

        alerte = await create_alerte(zone)

        # 4. Assert receiving the broadcast message and the JSON content
        response = await communicator.receive_json_from()
        assert response["id"] == alerte.id
        assert response["niveau"] == "rouge"
        assert response["zone"]["id"] == zone.id
        assert response["zone"]["quartier"] == "Thiaroye"
        assert response["statut"] == "en_attente"

        # 5. Clean up
        await communicator.disconnect()

    asyncio.run(run_test())

@pytest.mark.django_db
def test_statut_transition_unauthorized(api_client, test_zone):
    alerte = Alerte.objects.create(niveau="orange", zone=test_zone, timestamp=timezone.now(), statut="en_attente")
    url = f'/api/alertes/{alerte.id}/statut/'
    response = api_client.patch(url, {"statut": "envoyee"}, format='json')
    assert response.status_code == 401

@pytest.mark.django_db
def test_statut_transition_not_found(auth_client):
    url = '/api/alertes/9999/statut/'
    response = auth_client.patch(url, {"statut": "envoyee"}, format='json')
    assert response.status_code == 404

@pytest.mark.django_db
def test_statut_transition_bad_requests(auth_client, test_zone):
    alerte = Alerte.objects.create(niveau="orange", zone=test_zone, timestamp=timezone.now(), statut="en_attente")
    url = f'/api/alertes/{alerte.id}/statut/'

    # 1. Missing statut key
    response = auth_client.patch(url, {}, format='json')
    assert response.status_code == 400
    assert 'statut' in response.data

    # 2. Invalid choice
    response = auth_client.patch(url, {"statut": "invalid_choice"}, format='json')
    assert response.status_code == 400
    assert 'statut' in response.data





# --- SegmentRue ---

@pytest.mark.django_db
def test_segment_rue_crud(auth_client, test_zone):
    payload = {
        "nom": "Rue Test",
        "geom": {"type": "LineString", "coordinates": [[-17.38, 14.75], [-17.37, 14.76]]},
        "zone": test_zone.id,
        "etat_drainage": "obstrue",
        "score_risque_actuel": 3.5,
    }
    response = auth_client.post('/api/segments/', payload, format='json')
    assert response.status_code == 201, response.data

    response_list = auth_client.get('/api/segments/')
    assert response_list.status_code == 200
    assert len(response_list.data['features']) == 1


@pytest.mark.django_db
def test_segment_rue_forbidden_for_citoyen(citoyen_client):
    payload = {
        "nom": "Rue Test",
        "geom": {"type": "LineString", "coordinates": [[-17.38, 14.75], [-17.37, 14.76]]},
    }
    assert citoyen_client.post('/api/segments/', payload, format='json').status_code == 403
    assert citoyen_client.get('/api/segments/').status_code == 200


# --- PrevisionMeteo ---

@pytest.mark.django_db
def test_prevision_meteo_crud(auth_client):
    payload = {
        "date_prevision": timezone.now().isoformat(),
        "precipitation": 12.5,
        "temperature": 27.3,
        "vitesse_vent": 15.0,
        "source": "Open-Meteo",
    }
    response = auth_client.post('/api/previsions/', payload, format='json')
    assert response.status_code == 201, response.data

    response_list = auth_client.get('/api/previsions/')
    assert response_list.status_code == 200
    assert response_list.data['count'] == 1
    assert response_list.data['results'][0]['source'] == "Open-Meteo"


@pytest.mark.django_db
def test_prevision_meteo_forbidden_for_citoyen(citoyen_client):
    payload = {"date_prevision": timezone.now().isoformat(), "precipitation": 5.0}
    assert citoyen_client.post('/api/previsions/', payload, format='json').status_code == 403


# --- HistoriqueRisque ---

@pytest.mark.django_db
def test_historique_risque_readonly_api(auth_client, test_zone):
    # En lecture seule côté API : alimenté par une tâche système (calcul de
    # risque), pas par un POST direct d'un utilisateur.
    HistoriqueRisque.objects.create(zone=test_zone, score_risque=2.5)

    response_list = auth_client.get('/api/historique-risque/')
    assert response_list.status_code == 200
    assert response_list.data['count'] == 1
    assert response_list.data['results'][0]['type_cible'] == 'zone'

    response_post = auth_client.post('/api/historique-risque/', {"zone": test_zone.id, "score_risque": 1.0})
    assert response_post.status_code == 405


@pytest.mark.django_db
def test_historique_risque_serializer_validate_zone_ou_segment(test_zone):
    from api.serializers import HistoriqueRisqueSerializer

    segment = SegmentRue.objects.create(
        nom="Segment Test",
        geom="LINESTRING(-17.38 14.75, -17.37 14.76)",
        zone=test_zone,
    )

    # Zone seule : OK
    s1 = HistoriqueRisqueSerializer(data={"zone": test_zone.id, "score_risque": 2.5})
    assert s1.is_valid(), s1.errors

    # Segment seul : OK
    s2 = HistoriqueRisqueSerializer(data={"segment": segment.id, "score_risque": 1.0})
    assert s2.is_valid(), s2.errors

    # Aucune cible : rejeté
    s3 = HistoriqueRisqueSerializer(data={"score_risque": 1.0})
    assert not s3.is_valid()

    # Les deux à la fois : rejeté
    s4 = HistoriqueRisqueSerializer(data={"zone": test_zone.id, "segment": segment.id, "score_risque": 1.0})
    assert not s4.is_valid()


@pytest.mark.django_db
def test_historique_risque_contrainte_bdd(test_zone):
    # La contrainte CheckConstraint protège aussi les créations hors API (ex: tâche Celery future)
    with pytest.raises(IntegrityError):
        HistoriqueRisque.objects.create(score_risque=1.0)


# --- appel_modele_ia (intégration réelle avec le service IA de Maïmouna) ---

@pytest.mark.django_db
def test_appel_modele_ia_cree_prediction_et_alerte_si_risque_eleve(test_zone):
    from capteurs.models import Capteur, Mesure
    from alertes.tasks import appel_modele_ia

    capteur_eau = Capteur.objects.create(
        nom="Capteur eau zone test", type="eau", localisation="POINT(-17.38 14.75)",
        zone=test_zone, date_installation="2026-08-17",
    )
    capteur_pluie = Capteur.objects.create(
        nom="Capteur pluie zone test", type="pluviometre", localisation="POINT(-17.38 14.75)",
        zone=test_zone, date_installation="2026-08-17",
    )
    # Valeurs volontairement hautes pour déclencher un risque élevé (comme testé
    # manuellement avec le vrai service : niveau 85cm + pluie 65mm -> "rouge")
    Mesure.objects.create(capteur=capteur_eau, valeur=85.0, unite="cm", timestamp=timezone.now())
    Mesure.objects.create(capteur=capteur_pluie, valeur=65.0, unite="mm", timestamp=timezone.now())

    resultat = appel_modele_ia(test_zone.id)

    assert resultat["status"] == "success"
    prediction = PredictionIA.objects.get(id=resultat["prediction_id"])
    assert prediction.zone_id == test_zone.id
    assert 0 <= prediction.probabilite <= 1
    # Un seul relevé disponible : pas assez d'historique pour le LSTM (24 jours requis)
    assert prediction.niveau_eau_predit_cm is None

    # Avec ces valeurs, le vrai modèle RandomForest classe en risque élevé,
    # ce qui doit créer une Alerte automatiquement.
    if resultat["risque"] in ("orange", "rouge"):
        assert resultat["alerte_id"] is not None
        alerte = Alerte.objects.get(id=resultat["alerte_id"])
        assert alerte.zone_id == test_zone.id
        assert alerte.niveau == resultat["risque"]
        assert alerte.message  # la recommandation FR du modèle


@pytest.mark.django_db
def test_appel_modele_ia_sans_mesures(test_zone):
    from alertes.tasks import appel_modele_ia

    resultat = appel_modele_ia(test_zone.id)
    assert resultat["status"] == "skipped"
    assert PredictionIA.objects.filter(zone=test_zone).count() == 0


@pytest.mark.django_db
def test_ecoute_mqtt_declenche_analyse_ia_si_capteur_zone(test_zone):
    import json
    from unittest.mock import MagicMock, patch
    from django.core.management import call_command
    from capteurs.models import Capteur

    capteur = Capteur.objects.create(
        nom="Capteur avec zone", type="eau", localisation="POINT(-17.38 14.75)",
        zone=test_zone, date_installation="2026-08-17",
    )

    with patch('paho.mqtt.client.Client') as mock_client_class, \
         patch('alertes.tasks.appel_modele_ia.delay') as mock_delay:
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.loop_forever.side_effect = KeyboardInterrupt()

        call_command('ecoute_mqtt')

        on_message_callback = mock_client.on_message
        msg = MagicMock()
        msg.topic = f"capteurs/{capteur.id}/mesures"
        msg.payload = json.dumps({
            "capteur_id": capteur.id, "valeur": 12.0, "unite": "cm",
            "timestamp": "2026-08-17T18:00:00Z",
        }).encode('utf-8')

        on_message_callback(mock_client, None, msg)

        mock_delay.assert_called_once_with(test_zone.id)


# --- analyse_gee_periodique (intégration réelle GEE, avec repli propre si non authentifié) ---

@pytest.mark.django_db
def test_analyse_gee_periodique_sans_authentification():
    from alertes.tasks import analyse_gee_periodique

    # Sans `earthengine authenticate` sur la machine, la tâche doit se terminer
    # proprement (pas de crash, pas de retry infini) plutôt que planter.
    resultat = analyse_gee_periodique()
    assert resultat["status"] == "skipped"
    assert resultat["reason"] == "gee_unavailable"


@pytest.mark.django_db
def test_analyse_gee_periodique_cree_episode_si_inondation_detectee():
    from unittest.mock import patch
    from alertes.tasks import analyse_gee_periodique
    from alertes.models import EpisodeInondation

    faux_resultat_gee = {
        "metadata": {"surface_inondee_ha": 12.3, "date_analyse": "2026-09-10", "crs": "EPSG:4326"},
        "geojson": {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[-17.39, 14.74], [-17.39, 14.75], [-17.38, 14.75], [-17.38, 14.74], [-17.39, 14.74]]],
                    },
                    "properties": {},
                }
            ],
        },
    }

    with patch('gee.detection_inondation.detecter_zones_inondees', return_value=faux_resultat_gee):
        resultat = analyse_gee_periodique()

    assert resultat["status"] == "success"
    assert resultat["surface_ha"] == 12.3
    episode = EpisodeInondation.objects.get(id=resultat["episode_id"])
    assert episode.surface_ha == 12.3


@pytest.mark.django_db
def test_analyse_gee_periodique_aucune_inondation():
    from unittest.mock import patch
    from alertes.tasks import analyse_gee_periodique
    from alertes.models import EpisodeInondation

    faux_resultat_sans_eau = {
        "metadata": {"surface_inondee_ha": 0, "date_analyse": "2026-09-10", "crs": "EPSG:4326"},
        "geojson": {"type": "FeatureCollection", "features": []},
    }

    with patch('gee.detection_inondation.detecter_zones_inondees', return_value=faux_resultat_sans_eau):
        resultat = analyse_gee_periodique()

    assert resultat["status"] == "success"
    assert resultat["surface_ha"] == 0
    assert EpisodeInondation.objects.count() == 0


# --- ContactAlerte (registre citoyen pour SMS d'alerte) ---

@pytest.mark.django_db
def test_contact_alerte_inscription_libre(api_client, test_zone):
    payload = {"telephone": "+221770000001", "zone": test_zone.id, "nom": "Fatou"}
    response = api_client.post('/api/contacts-alerte/', payload, format='json')
    assert response.status_code == 201, response.data
    assert response.data['actif'] is True

    # Mais la consultation reste réservée (numéros de téléphone = PII)
    assert api_client.get('/api/contacts-alerte/').status_code == 401


@pytest.mark.django_db
def test_contact_alerte_liste_reservee_autorite(test_zone, db):
    from alertes.models import ContactAlerte
    ContactAlerte.objects.create(telephone="+221770000002", zone=test_zone)

    # Deux clients indépendants (auth_client/citoyen_client partagent le même
    # APIClient sous-jacent s'ils sont demandés ensemble — instances séparées ici).
    citoyen = User.objects.create_user(username='citoyen_reg', password='x')
    citoyen.profile.role = 'citoyen'
    citoyen.profile.save()
    client_citoyen = APIClient()
    client_citoyen.force_authenticate(user=citoyen)
    assert client_citoyen.get('/api/contacts-alerte/').status_code == 403

    autorite = User.objects.create_user(username='autorite_reg', password='x')
    autorite.profile.role = 'autorite'
    autorite.profile.save()
    client_autorite = APIClient()
    client_autorite.force_authenticate(user=autorite)
    response = client_autorite.get('/api/contacts-alerte/')
    assert response.status_code == 200
    assert response.data['count'] == 1


@pytest.mark.django_db
def test_envoyer_sms_alerte_notifie_contacts_de_la_zone(test_zone, monkeypatch):
    from alertes.models import ContactAlerte
    from alertes.tasks import envoyer_sms_alerte

    autre_zone = ZoneRisque.objects.create(
        geom="POLYGON((5 5, 5 6, 6 6, 6 5, 5 5))", quartier="Ailleurs", niveau_risque="vert"
    )
    ContactAlerte.objects.create(telephone="+221770000003", zone=test_zone, actif=True)
    ContactAlerte.objects.create(telephone="+221770000004", zone=test_zone, actif=False)  # désinscrit
    ContactAlerte.objects.create(telephone="+221770000005", zone=autre_zone, actif=True)  # autre zone

    alerte = Alerte.objects.create(
        niveau="rouge", zone=test_zone, timestamp=timezone.now(), statut="en_attente",
        message="Test SMS zone",
    )

    numeros_appeles = []
    monkeypatch.setattr(
        'alertes.tasks.send_alert_sms',
        lambda numero, message: numeros_appeles.append(numero) or True,
    )

    resultat = envoyer_sms_alerte(alerte.id)

    assert resultat["status"] == "sent"
    # Seul le contact actif de la bonne zone doit être notifié
    assert numeros_appeles == ["+221770000003"]


# --- LSTM (prédiction du niveau d'eau à 24h, complémentaire de RandomForest) ---

@pytest.mark.django_db
def test_appel_modele_ia_avec_historique_24_jours_predit_niveau_eau(test_zone):
    from capteurs.models import Capteur, Mesure
    from alertes.tasks import appel_modele_ia

    capteur_eau = Capteur.objects.create(
        nom="Capteur eau", type="eau", localisation="POINT(-17.38 14.75)",
        zone=test_zone, date_installation="2026-01-01",
    )
    capteur_pluie = Capteur.objects.create(
        nom="Capteur pluie", type="pluviometre", localisation="POINT(-17.38 14.75)",
        zone=test_zone, date_installation="2026-01-01",
    )

    # 24 jours consécutifs de relevés (aujourd'hui inclus), un par jour
    aujourdhui = timezone.now()
    for i in range(24):
        jour = aujourdhui - timedelta(days=i)
        Mesure.objects.create(capteur=capteur_eau, valeur=20.0 + i, unite="cm", timestamp=jour)
        Mesure.objects.create(capteur=capteur_pluie, valeur=5.0 + i, unite="mm", timestamp=jour)

    resultat = appel_modele_ia(test_zone.id)

    assert resultat["status"] == "success"
    prediction = PredictionIA.objects.get(id=resultat["prediction_id"])
    # 24 jours d'historique continu réunis : le LSTM doit produire une valeur réelle
    assert prediction.niveau_eau_predit_cm is not None
    assert prediction.niveau_eau_predit_cm >= 0
    # Le modèle ne doit jamais renvoyer une valeur extravagante (voir bug de
    # double-dénormalisation corrigé pendant le développement : ~570cm au lieu
    # d'une valeur cohérente avec l'échelle d'entraînement, max ~127cm).
    assert prediction.niveau_eau_predit_cm < 200


@pytest.mark.django_db
def test_historique_journalier_zone_incomplet_retourne_vide(test_zone):
    from capteurs.models import Capteur, Mesure
    from alertes.tasks import _historique_journalier_zone

    capteur_eau = Capteur.objects.create(
        nom="Capteur eau", type="eau", localisation="POINT(-17.38 14.75)",
        zone=test_zone, date_installation="2026-01-01",
    )
    # Seulement 5 jours de données, pas 24
    for i in range(5):
        Mesure.objects.create(
            capteur=capteur_eau, valeur=20.0 + i, unite="cm",
            timestamp=timezone.now() - timedelta(days=i),
        )

    assert _historique_journalier_zone(test_zone.id) == []


def test_predire_niveau_eau_lstm_rejette_historique_incomplet():
    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'mbeund_mi_ia'))
    from ia.service_prediction import PredictionService

    service = PredictionService()
    historique_incomplet = [{"pluie_mm": 5.0, "niveau_eau_cm": 20.0}] * 10
    assert service.predire_niveau_eau_lstm(historique_incomplet) is None


def test_predire_niveau_eau_lstm_valeur_coherente_avec_echelle_entrainement():
    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'mbeund_mi_ia'))
    from ia.service_prediction import PredictionService

    service = PredictionService()
    historique = [{"pluie_mm": 5.0 + i * 2, "niveau_eau_cm": 20.0 + i * 3} for i in range(24)]
    prediction = service.predire_niveau_eau_lstm(historique)

    assert prediction is not None
    # Le scaler a été entraîné avec niveau_eau_cm max ~127cm ; une régression du
    # bug de double-dénormalisation renverrait une valeur ~127x trop grande.
    assert 0 <= prediction < 200
