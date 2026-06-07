import logging
import time
import requests
from datetime import datetime
import sys
import os
from twilio.rest import Client
from dotenv import load_dotenv

# Charger les variables d'environnement depuis backend/.env
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'backend', '.env')
load_dotenv(env_path)

# Ajout du parent au path pour importer le service prédiction
base_dir = os.path.dirname(os.path.dirname(__file__))
sys.path.append(base_dir)

try:
    from ia.service_prediction import PredictionService
    IA_AVAILABLE = True
except ImportError:
    IA_AVAILABLE = False

logging.basicConfig(level=logging.INFO, format='%(asctime)s - [ALERTE] %(message)s')

DJANGO_API_ALERTES = "http://localhost:8000/api/alertes/"

# Identifiants Twilio (Chargés depuis le fichier .env pour la sécurité)
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
MESSAGING_SERVICE_SID = os.getenv("TWILIO_MESSAGING_SERVICE_SID")
NUMERO_DESTINATAIRE = os.getenv("TWILIO_NUMERO_DESTINATAIRE")

def envoyer_sms_urgence(zone_id):
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=f"URGENT: ALERTE ROUGE INONDATION\nRisque critique détecté sur la Zone {zone_id} (Thiaroye Sur Mer). Évacuation recommandée immédiatement.",
            messaging_service_sid=MESSAGING_SERVICE_SID,
            to=NUMERO_DESTINATAIRE
        )
        logging.info(f"SMS envoyé avec succès ! ID: {message.sid}")
    except Exception as e:
        logging.error(f"Échec de l'envoi du SMS via Twilio : {e}")

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
            
        logging.info(f"Évaluation Zone {zone_id} : Risque {niveau_risque.upper()} ({confiance}%)")
        
        # 2. Logique de déclenchement avec anti-spam (ex: 2h)
        maintenant = time.time()
        delai_ecoule = maintenant - self.derniere_alerte["timestamp"]
        
        if niveau_risque in ["orange", "rouge"]:
            # On ne redéclenche que si le délai de 2h (7200s) est passé ou si le risque a augmenté (ex: orange -> rouge)
            if delai_ecoule > 7200 or niveau_risque != self.derniere_alerte["niveau"]:
                self._envoyer_alerte_django(zone_id, niveau_risque)
                self.derniere_alerte = {"niveau": niveau_risque, "timestamp": maintenant}
                
                # Intégration Twilio
                if niveau_risque == "rouge":
                    logging.warning("[ALERTE] ENVOI SMS D'URGENCE VIA TWILIO EN COURS...")
                    envoyer_sms_urgence(zone_id)
            else:
                logging.info(f"Alerte {niveau_risque} déjà émise récemment (anti-spam actif).")
        else:
            # Retour à la normale
            if self.derniere_alerte["niveau"] in ["orange", "rouge"]:
                logging.info("[RETOUR NORMALE] Clôture de l'alerte.")
                self.derniere_alerte = {"niveau": "vert", "timestamp": maintenant}

    def _envoyer_alerte_django(self, zone_id, niveau):
        payload = {
            "zone_id": zone_id,
            "niveau": niveau,
            "canaux": "sms,web" if niveau == "rouge" else "web",
            "timestamp": datetime.now().isoformat()
        }
        
        # Envoi réel à l'API Django
        try:
            requests.post(DJANGO_API_ALERTES, json=payload, timeout=5)
            logging.info("[SUCCES] Alerte synchronisée avec le Backend Django !")
        except Exception as e:
            logging.error(f"[ERREUR] Échec de la synchronisation avec Django: {e}")
        logging.warning(f"[NOTIFICATION] Alerte {niveau.upper()} déclenchée sur la zone {zone_id}")

if __name__ == "__main__":
    declencheur = Declencheur()
    declencheur.verifier_et_declencher()
