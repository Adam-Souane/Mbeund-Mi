import logging
import time
import requests
from datetime import datetime
import sys
import os
from twilio.rest import Client

# Ajout du parent au path pour importer le service prédiction
base_dir = os.path.dirname(os.path.dirname(__file__))
sys.path.append(base_dir)

try:
    from ia.service_prediction import PredictionService
    IA_AVAILABLE = True
except ImportError:
    IA_AVAILABLE = False

from datetime import timedelta

# Configuration du logging (console + fichier alertes.log)
logger = logging.getLogger('mbeund_mi_alerte')
logger.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - [ALERTE] %(message)s')

# Handler Console
ch = logging.StreamHandler()
ch.setFormatter(formatter)
logger.addHandler(ch)

# Handler Fichier
fh = logging.FileHandler('alertes.log', encoding='utf-8')
fh.setFormatter(formatter)
logger.addHandler(fh)

HISTORIQUE_SMS = {}

def peut_envoyer_sms(zone_id, nouveau_niveau):
    """Vérifie si on peut envoyer un SMS selon les règles anti-spam."""
    niveaux_ordre = {'vert': 0, 'jaune': 1, 'orange': 2, 'rouge': 3}
    
    if zone_id not in HISTORIQUE_SMS:
        return True
        
    dernier = HISTORIQUE_SMS[zone_id]
    ancien_niveau = dernier['niveau']
    dernier_temps = dernier['timestamp']
    
    # Règle 2 & 3 : Le niveau a empiré ou baissé
    if niveaux_ordre.get(nouveau_niveau, 0) != niveaux_ordre.get(ancien_niveau, 0):
        return True
        
    # Règle 1 : Bloqué si même niveau il y a moins de 2 heures
    maintenant = datetime.now()
    if (maintenant - dernier_temps) > timedelta(hours=2):
        return True
        
    return False

from ia.config import (
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_MESSAGING_SERVICE_SID,
    TWILIO_NUMERO_DESTINATAIRE,
    DJANGO_API_URL
)

DJANGO_API_ALERTES = f"{DJANGO_API_URL}/alertes/"

def envoyer_sms_urgence(zone_id, niveau="rouge"):
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=f"URGENT: ALERTE {niveau.upper()} INONDATION\nRisque détecté sur la Zone {zone_id} (Thiaroye Sur Mer).",
            messaging_service_sid=TWILIO_MESSAGING_SERVICE_SID,
            to=TWILIO_NUMERO_DESTINATAIRE
        )
        logger.info(f"SMS envoyé avec succès ! ID: {message.sid}")
    except Exception as e:
        logger.error(f"Échec de l'envoi du SMS via Twilio : {e}")

class Declencheur:
    def __init__(self):
        self.ia_service = PredictionService() if IA_AVAILABLE else None
        self.derniere_alerte = {"niveau": "vert", "timestamp": 0}

    def verifier_et_declencher(self, zone_id=1, mesures_recentes=None):
        """Récupère les mesures, interroge l'IA et déclenche les alertes (SMS/Django/Firebase)."""
        if mesures_recentes is None:
            mesures_recentes = [{"pluie_mm": 45.0, "niveau_eau_cm": 65.0}]
        
        # 1. Analyse IA du risque
        if self.ia_service:
            prediction = self.ia_service.analyser_risque(zone_id, mesures_recentes)
            niveau_risque = prediction["risque_global"]
            confiance = prediction["confiance"]
        else:
            niveau_risque = "orange" # Fallback pour la démo si IA non disponible
            confiance = 80.0
            
        logger.info(f"Évaluation Zone {zone_id} : Risque {niveau_risque.upper()} ({confiance}%)")
        
        # 2. Logique de déclenchement avec anti-spam (ex: 2h)
        maintenant = time.time()
        delai_ecoule = maintenant - self.derniere_alerte["timestamp"]
        
        if niveau_risque in ["orange", "rouge"]:
            # Intégration Twilio avec le délai de grâce (Anti-spam)
            if peut_envoyer_sms(zone_id, niveau_risque):
                logger.warning(f"[ALERTE] ENVOI SMS D'URGENCE VIA TWILIO EN COURS POUR NIVEAU {niveau_risque.upper()}...")
                envoyer_sms_urgence(zone_id, niveau_risque)
                HISTORIQUE_SMS[zone_id] = {"niveau": niveau_risque, "timestamp": datetime.now()}
            else:
                logger.info(f"SMS bloqué (anti-spam) pour zone {zone_id} niveau {niveau_risque}")
                
            # Logique pour le Backend
            if delai_ecoule > 7200 or niveau_risque != self.derniere_alerte["niveau"]:
                self._envoyer_alerte_django(zone_id, niveau_risque)
                self.derniere_alerte = {"niveau": niveau_risque, "timestamp": maintenant}
            else:
                logger.info(f"Alerte Django {niveau_risque} déjà synchronisée récemment.")
                
        else:
            # Retour à la normale
            if self.derniere_alerte["niveau"] in ["orange", "rouge"]:
                logger.info("[RETOUR NORMALE] Clôture de l'alerte.")
                self.derniere_alerte = {"niveau": "vert", "timestamp": maintenant}
                
            # On envoie un SMS de retour à la normale si on était en alerte
            if zone_id in HISTORIQUE_SMS and HISTORIQUE_SMS[zone_id]['niveau'] in ["orange", "rouge"]:
                if peut_envoyer_sms(zone_id, "vert"):
                    logger.warning("[RETOUR NORMALE] ENVOI SMS VIA TWILIO...")
                    envoyer_sms_urgence(zone_id, "vert")
                    HISTORIQUE_SMS[zone_id] = {"niveau": "vert", "timestamp": datetime.now()}

    def _envoyer_alerte_django(self, zone_id, niveau):
        payload = {
            "zone_id": zone_id,
            "niveau": niveau,
            "canaux": "sms,web" if niveau == "rouge" else "web",
            "timestamp": datetime.now().isoformat()
        }
        
        try:
            requests.post(DJANGO_API_ALERTES, json=payload, timeout=5)
            logger.info("[SUCCES] Alerte synchronisée avec le Backend Django !")
        except Exception as e:
            logger.error(f"[ERREUR] Échec de la synchronisation avec Django: {e}")
        logger.warning(f"[NOTIFICATION] Alerte {niveau.upper()} déclenchée sur la zone {zone_id}")

if __name__ == "__main__":
    declencheur = Declencheur()
    declencheur.verifier_et_declencher()
