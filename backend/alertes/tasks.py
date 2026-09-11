import json
import os
import sys
import time
from datetime import timedelta
from celery import shared_task
from celery.utils.log import get_task_logger
from django.conf import settings
from django.utils import timezone
from alertes.models import ZoneRisque, Alerte, PredictionIA, EpisodeInondation, ContactAlerte
from capteurs.models import Capteur, Mesure
from api.services.sms_service import send_alert_sms

logger = get_task_logger(__name__)

# mbeund_mi_ia est un module frère de backend/ (pas un paquet pip installé) —
# on l'ajoute au path pour réutiliser le vrai service de prédiction de Maïmouna
# (RandomForest + LSTM) au lieu de dupliquer sa logique dans Django.
_MBEUND_MI_IA_PATH = os.path.join(os.path.dirname(settings.BASE_DIR), 'mbeund_mi_ia')
if _MBEUND_MI_IA_PATH not in sys.path:
    sys.path.insert(0, _MBEUND_MI_IA_PATH)

_prediction_service = None


def _get_prediction_service():
    """Charge le service IA (modèles RandomForest/LSTM) une seule fois par worker."""
    global _prediction_service
    if _prediction_service is None:
        from ia.service_prediction import PredictionService
        _prediction_service = PredictionService()
    return _prediction_service


def _historique_journalier_zone(zone_id, jours=24):
    """
    Construit l'historique journalier {pluie_mm, niveau_eau_cm} des `jours`
    derniers jours pour une zone, attendu par PredictionService.predire_niveau_eau_lstm.
    Pluie = somme des relevés du jour (cumul journalier) ; niveau d'eau = maximum
    du jour (niveau le plus défavorable atteint) — les deux capteurs eau/pluviomètre
    étant physiquement séparés. Retourne [] si un seul jour de la fenêtre manque de
    données (le modèle a besoin d'une séquence continue de 24 jours).
    """
    from django.db.models import Sum, Max
    from django.db.models.functions import TruncDate

    capteurs_zone = Capteur.objects.filter(zone_id=zone_id)
    aujourdhui = timezone.now().date()
    date_debut = aujourdhui - timedelta(days=jours - 1)

    pluie_par_jour = {
        row['jour']: row['total'] for row in (
            Mesure.objects.filter(capteur__in=capteurs_zone, capteur__type='pluviometre', timestamp__date__gte=date_debut)
            .annotate(jour=TruncDate('timestamp')).values('jour').annotate(total=Sum('valeur'))
        )
    }
    eau_par_jour = {
        row['jour']: row['maximum'] for row in (
            Mesure.objects.filter(capteur__in=capteurs_zone, capteur__type='eau', timestamp__date__gte=date_debut)
            .annotate(jour=TruncDate('timestamp')).values('jour').annotate(maximum=Max('valeur'))
        )
    }

    historique = []
    for i in range(jours):
        jour = date_debut + timedelta(days=i)
        if jour not in pluie_par_jour and jour not in eau_par_jour:
            return []  # jour manquant dans la séquence : fenêtre incomplète
        historique.append({
            "pluie_mm": pluie_par_jour.get(jour, 0.0),
            "niveau_eau_cm": eau_par_jour.get(jour, 0.0),
        })
    return historique

@shared_task(
    bind=True,
    max_retries=5,
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
    autoretry_for=(Exception,)
)
def appel_modele_ia(self, zone_id):
    """
    Tâche asynchrone pour appeler le modèle de prédiction IA pour une zone de risque spécifique.
    """
    logger.info(f"[IA Task] Démarrage de la prédiction IA pour la zone {zone_id} (Essai {self.request.retries + 1}/5)")
    
    try:
        zone = ZoneRisque.objects.get(id=zone_id)
    except ZoneRisque.DoesNotExist as e:
        logger.error(f"[IA Task] La zone avec l'ID {zone_id} n'existe pas.")
        # Pas de retry si la zone n'existe pas (erreur irrécupérable)
        raise e

    # Dernière mesure de chaque type de capteur dans la zone (eau + pluviométrie).
    # Le service IA attend un relevé combiné {niveau_eau_cm, pluie_mm} par "instant" ;
    # nos capteurs eau/pluviomètre sont physiquement séparés, donc on combine leurs
    # dernières valeurs respectives en un seul relevé représentant l'état actuel de la zone.
    capteurs_zone = Capteur.objects.filter(zone_id=zone_id)
    derniere_eau = Mesure.objects.filter(capteur__in=capteurs_zone, capteur__type='eau').order_by('-timestamp').first()
    derniere_pluie = Mesure.objects.filter(capteur__in=capteurs_zone, capteur__type='pluviometre').order_by('-timestamp').first()

    if not derniere_eau and not derniere_pluie:
        logger.warning(f"[IA Task] Aucune mesure disponible pour la zone {zone.quartier} — prédiction ignorée.")
        return {"status": "skipped", "reason": "no_measurements", "quartier": zone.quartier}

    mesures_recentes = [{
        "capteur_id": zone_id,
        "niveau_eau_cm": derniere_eau.valeur if derniere_eau else 0,
        "pluie_mm": derniere_pluie.valeur if derniere_pluie else 0,
    }]

    service = _get_prediction_service()
    resultat = service.analyser_risque(zone_id, mesures_recentes)

    if "erreur" in resultat:
        logger.error(f"[IA Task] Le service IA a renvoyé une erreur pour {zone.quartier} : {resultat['erreur']}")
        raise ValueError(resultat['erreur'])

    risque = resultat["risque_global"]
    confiance_pct = resultat["confiance"]

    # Prédiction complémentaire du niveau d'eau du lendemain (LSTM, régression
    # sur 24 jours d'historique) — indépendante de la classification RandomForest
    # ci-dessus. None tant que 24 jours d'historique continu ne sont pas réunis
    # pour la zone (cas normal en début de vie de l'application).
    historique = _historique_journalier_zone(zone_id)
    niveau_eau_predit = service.predire_niveau_eau_lstm(historique) if historique else None

    prediction = PredictionIA.objects.create(
        zone=zone,
        # Le service classe un niveau de risque (vert/jaune/orange/rouge) avec une
        # confiance en %, pas une probabilité brute d'inondation — on dérive
        # `probabilite` (0-1) de cette confiance, `confiance` garde l'échelle % d'origine.
        probabilite=confiance_pct / 100,
        horizon_h=24,
        confiance=confiance_pct,
        niveau_eau_predit_cm=niveau_eau_predit,
        timestamp=timezone.now()
    )

    logger.info(
        f"[IA Task] Prédiction enregistrée pour {zone.quartier} : risque={risque}, "
        f"confiance={confiance_pct}%, niveau_eau_predit={niveau_eau_predit} "
        f"(ID Prédiction {prediction.id})"
    )

    alerte_id = None
    if risque in ('orange', 'rouge'):
        alerte = Alerte.objects.create(
            niveau=risque,
            zone=zone,
            message=resultat.get('recommandation_fr', ''),
            timestamp=timezone.now(),
            canaux='sms,web',
            statut='en_attente',
        )
        alerte_id = alerte.id
        logger.warning(f"[IA Task] Risque {risque} détecté pour {zone.quartier} — Alerte {alerte.id} créée.")

    return {
        "status": "success",
        "prediction_id": prediction.id,
        "quartier": zone.quartier,
        "risque": risque,
        "confiance": confiance_pct,
        "alerte_id": alerte_id,
    }


@shared_task(
    bind=True,
    max_retries=5,
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
    autoretry_for=(Exception,)
)
def envoyer_sms_alerte(self, alerte_id):
    """
    Tâche asynchrone pour envoyer un SMS d'alerte pour une alerte spécifique.
    """
    logger.info(f"[SMS Task] Démarrage de l'envoi de SMS pour l'alerte {alerte_id} (Essai {self.request.retries + 1}/5)")
    
    try:
        alerte = Alerte.objects.get(id=alerte_id)
    except Alerte.DoesNotExist as e:
        logger.error(f"[SMS Task] L'alerte avec l'ID {alerte_id} n'existe pas.")
        raise e

    from users.models import Profile
    message = alerte.message or f"Risque {alerte.niveau} détecté dans la zone {alerte.zone.quartier}. Prudence."

    # Deux sources de destinataires : le staff (agents/autorités/admin, notifiés
    # pour toute zone) et le registre des citoyens inscrits spécifiquement à
    # cette zone (ContactAlerte, inscription libre via /api/contacts-alerte/).
    numeros_staff = set(
        Profile.objects.filter(role__in=['agent', 'autorite', 'admin']).exclude(telephone='').values_list('telephone', flat=True)
    )
    numeros_citoyens = set(
        ContactAlerte.objects.filter(zone=alerte.zone, actif=True).exclude(telephone='').values_list('telephone', flat=True)
    )
    numeros = numeros_staff | numeros_citoyens

    nb_envoyes = 0
    for numero in numeros:
        if send_alert_sms(numero, message):
            nb_envoyes += 1

    logger.info(
        f"[SMS Task] SMS envoyé à {nb_envoyes}/{len(numeros)} destinataire(s) "
        f"({len(numeros_staff)} staff + {len(numeros_citoyens)} citoyens inscrits) "
        f"pour l'alerte {alerte.id} (Niveau : {alerte.niveau}, zone {alerte.zone.quartier})."
    )

    # Mise à jour du statut de l'alerte
    alerte.statut = 'envoyee'
    alerte.save()

    return {
        "status": "sent",
        "alerte_id": alerte.id,
        "statut": alerte.statut,
        "nb_destinataires": nb_envoyes,
    }


@shared_task(
    bind=True,
    max_retries=5,
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
    autoretry_for=(Exception,)
)
def analyse_gee_periodique(self):
    """
    Tâche périodique de détection d'inondation par imagerie satellite (Google Earth Engine).

    Compare l'indice d'eau (NDWI, Sentinel-2) entre une période de référence en
    saison sèche et les 15 derniers jours, pour détecter les zones nouvellement
    inondées autour de Thiaroye-sur-Mer.

    Nécessite une authentification GEE préalable sur la machine qui exécute le
    worker Celery (commande `earthengine authenticate`, une fois, interactive)
    et GEE_PROJECT_ID renseigné dans .env — voir mbeund_mi_ia/gee/config_gee.py.
    Sans ça, la tâche se termine proprement en "skipped", elle ne plante pas.
    """
    logger.info(f"[GEE Task] Démarrage de l'analyse GEE périodique (Essai {self.request.retries + 1}/5)")

    from gee.detection_inondation import detecter_zones_inondees

    maintenant = timezone.now()
    annee_courante = maintenant.year
    date_reference_debut = f"{annee_courante}-01-01"
    date_reference_fin = f"{annee_courante}-01-31"
    date_recente_fin = maintenant.strftime('%Y-%m-%d')
    date_recente_debut = (maintenant - timedelta(days=15)).strftime('%Y-%m-%d')

    resultat = detecter_zones_inondees(
        date_reference_debut, date_reference_fin, date_recente_debut, date_recente_fin
    )

    if resultat is None:
        logger.warning(
            "[GEE Task] Analyse GEE indisponible (authentification manquante ou erreur GEE) — tâche ignorée."
        )
        return {"status": "skipped", "reason": "gee_unavailable"}

    surface_ha = resultat['metadata']['surface_inondee_ha']

    if surface_ha <= 0:
        logger.info("[GEE Task] Aucune nouvelle zone inondée détectée par satellite.")
        return {"status": "success", "surface_ha": 0, "episode_id": None}

    # Fusionne les polygones détectés (un par zone d'eau isolée) en un seul MultiPolygon.
    # django.contrib.gis.geos (GEOS/GDAL) n'est importé que si USE_GIS=True : le
    # module plante à l'import si GEOS n'est pas installé, même sans s'en servir.
    features_polygones = [
        f for f in resultat['geojson'].get('features', []) if f['geometry']['type'] == 'Polygon'
    ]
    if not features_polygones:
        logger.warning("[GEE Task] Surface détectée mais aucun polygone exploitable — épisode non créé.")
        return {"status": "success", "surface_ha": surface_ha, "episode_id": None}

    if settings.USE_GIS:
        from django.contrib.gis.geos import GEOSGeometry, MultiPolygon
        polygones = [GEOSGeometry(json.dumps(f['geometry'])) for f in features_polygones]
        geom_value = MultiPolygon(polygones)
    else:
        from api.serializers import geojson_to_wkt
        coords_multipolygon = [f['geometry']['coordinates'] for f in features_polygones]
        geom_value = geojson_to_wkt({"type": "MultiPolygon", "coordinates": coords_multipolygon})

    episode = EpisodeInondation.objects.create(
        geom=geom_value,
        date_debut=timezone.now(),
        surface_ha=surface_ha,
    )

    logger.info(f"[GEE Task] Analyse GEE terminée. Épisode d'inondation enregistré : ID {episode.id}, surface : {surface_ha} ha")
    return {
        "status": "success",
        "episode_id": episode.id,
        "surface_ha": surface_ha,
    }
