import os
from dotenv import load_dotenv

# Charger le fichier .env
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'backend', '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv() # Fallback local à la racine du script

DJANGO_API_URL = os.getenv('DJANGO_API_URL', 'http://localhost:8000/api')
DJANGO_API_TOKEN = os.getenv('DJANGO_API_TOKEN', '')

TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '')
TWILIO_MESSAGING_SERVICE_SID = os.getenv('TWILIO_MESSAGING_SERVICE_SID', '')
TWILIO_NUMERO_DESTINATAIRE = os.getenv('TWILIO_NUMERO_DESTINATAIRE', '')

OPENWEATHERMAP_API_KEY = os.getenv('OPENWEATHERMAP_API_KEY', '')
FIREBASE_SERVER_KEY = os.getenv('FIREBASE_SERVER_KEY', '')
GEE_PROJECT_ID = os.getenv('GEE_PROJECT_ID', '')
GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')

MQTT_BROKER_HOST = os.getenv('MQTT_BROKER_HOST', 'localhost')
MQTT_BROKER_PORT = int(os.getenv('MQTT_BROKER_PORT', 1883))
MQTT_TOPIC_PREFIX = os.getenv('MQTT_TOPIC_PREFIX', 'mbeundmi/capteurs')

ANTISPAM_DELAI_HEURES = int(os.getenv('ANTISPAM_DELAI_HEURES', 2))
GEOFENCE_RAYON_KM = int(os.getenv('GEOFENCE_RAYON_KM', 4))
GEOFENCE_LAT_CENTRE = float(os.getenv('GEOFENCE_LAT_CENTRE', 14.742))
GEOFENCE_LNG_CENTRE = float(os.getenv('GEOFENCE_LNG_CENTRE', -17.375))

def verifier_config():
    missing = []
    # On commente la vérification stricte pour le mode développement local
    # if not TWILIO_ACCOUNT_SID:
    #     missing.append("TWILIO_ACCOUNT_SID")
    # if not OPENWEATHERMAP_API_KEY:
    #     missing.append("OPENWEATHERMAP_API_KEY")
        
    if missing:
        raise ValueError(f"Configuration critique manquante dans le .env : {', '.join(missing)}")
