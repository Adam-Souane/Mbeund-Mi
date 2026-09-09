import time
from celery import shared_task
from celery.utils.log import get_task_logger
from django.utils import timezone
from alertes.models import ZoneRisque, Alerte, PredictionIA, EpisodeInondation
from api.services.sms_service import send_alert_sms

logger = get_task_logger(__name__)

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

    # TODO [Intégration Maïmouna] :
    # 1. Récupérer les données météo récentes (GEE / météo externe).
    # 2. Récupérer les dernières mesures des capteurs de la zone (niveaux d'eau, humidité, etc.).
    # 3. Envoyer ces données au service IA de Maïmouna ou charger son modèle sérialisé.
    # 4. Pour l'instant, on simule l'appel de modèle avec des valeurs mockées réalistes.
    
    logger.info(f"[IA Task] Simulation de l'appel du modèle IA pour {zone.quartier}...")
    time.sleep(1)  # Simulation d'un délai réseau ou de calcul
    
    # Génération d'une prédiction simulée
    probabilite_mock = 0.75  # 75% de chance d'inondation
    horizon_h_mock = 6       # Horizon de 6 heures
    confiance_mock = 0.88    # 88% de confiance
    
    prediction = PredictionIA.objects.create(
        zone=zone,
        probabilite=probabilite_mock,
        horizon_h=horizon_h_mock,
        confiance=confiance_mock,
        timestamp=timezone.now()
    )
    
    logger.info(f"[IA Task] Prédiction enregistrée avec succès pour la zone {zone.quartier}. ID Prédiction : {prediction.id}")
    return {
        "status": "success",
        "prediction_id": prediction.id,
        "quartier": zone.quartier,
        "probabilite": probabilite_mock
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

    # NOTE : il n'existe pas encore de registre des résidents/citoyens par zone.
    # En attendant, le SMS est envoyé aux profils (agents/autorités) ayant un
    # numéro de téléphone renseigné. À étendre lorsqu'un registre de contacts
    # par zone sera disponible.
    from users.models import Profile
    message = alerte.message or f"Risque {alerte.niveau} détecté dans la zone {alerte.zone.quartier}. Prudence."
    destinataires = Profile.objects.filter(
        role__in=['agent', 'autorite', 'admin'],
    ).exclude(telephone='')

    nb_envoyes = 0
    for profil in destinataires:
        if send_alert_sms(profil.telephone, message):
            nb_envoyes += 1

    logger.info(
        f"[SMS Task] SMS envoyé à {nb_envoyes}/{destinataires.count()} destinataire(s) "
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
    Tâche périodique simulant l'analyse d'images satellites Google Earth Engine (GEE).
    """
    logger.info(f"[GEE Task] Démarrage de l'analyse GEE périodique (Essai {self.request.retries + 1}/5)")
    
    # TODO [Intégration Google Earth Engine] :
    # 1. S'authentifier auprès de l'API GEE (ee.Initialize).
    # 2. Récupérer les dernières images Sentinel-1 (radar) ou Sentinel-2 (optique) pour la région de Thiaroye.
    # 3. Appliquer l'algorithme de détection d'eau/inondation (ex: NDWI ou rétrodiffusion radar).
    # 4. Calculer la surface inondée en hectares (surface_ha).
    # 5. Si une nouvelle inondation est détectée, créer un enregistrement EpisodeInondation.
    
    logger.info("[GEE Task] Simulation de la récupération et du traitement de l'image satellite...")
    time.sleep(2)  # Simulation du temps de traitement d'images lourdes
    
    # Exemple de création d'un épisode simulé si nécessaire
    surface_detectee = 15.4  # hectares
    
    episode = EpisodeInondation.objects.create(
        geom="MULTIPOLYGON (((-17.39 14.74, -17.39 14.75, -17.38 14.75, -17.38 14.74, -17.39 14.74)))",
        date_debut=timezone.now(),
        surface_ha=surface_detectee
    )
    
    logger.info(f"[GEE Task] Analyse GEE terminée. Épisode d'inondation enregistré : ID {episode.id}, surface : {surface_detectee} ha")
    return {
        "status": "completed",
        "episode_id": episode.id,
        "surface_ha": surface_detectee
    }
