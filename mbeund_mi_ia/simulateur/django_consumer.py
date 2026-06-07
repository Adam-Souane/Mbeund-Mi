import paho.mqtt.client as mqtt
import requests
import json
import logging
import time

from config import MQTT_BROKER, MQTT_PORT, MQTT_TOPIC_BASE

DJANGO_API_URL = "http://localhost:8000/api/mesures/"

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        logging.info("Connecté au broker MQTT avec succès")
        client.subscribe(f"{MQTT_TOPIC_BASE}#")
    else:
        logging.error(f"Échec de connexion MQTT (code: {rc})")

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode("utf-8"))
        logging.info(f"Message reçu de {payload.get('nom')} : {payload.get('valeur')} {payload.get('unite')}")
        
        # Tentative d'envoi à Django
        # Par défaut, ce bloc est commenté pour ne pas faire d'erreur tant que l'API de Mama Adam n'est pas prête.
        # Décommente quand l'API est en ligne !
        
        """
        try:
            response = requests.post(DJANGO_API_URL, json=payload, timeout=5)
            if response.status_code == 201:
                logging.info("Donnée sauvegardée dans Django")
            else:
                logging.error(f"Erreur API Django: {response.status_code} - {response.text}")
        except requests.exceptions.RequestException as e:
            logging.error(f"Erreur réseau vers Django : {e}")
        """
            
    except json.JSONDecodeError:
        logging.error("Erreur de décodage JSON du message")

def main():
    try:
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1, client_id="mbeundmi_django_consumer")
    except AttributeError:
        client = mqtt.Client(client_id="mbeundmi_django_consumer")
        
    client.on_connect = on_connect
    client.on_message = on_message
    
    logging.info("Démarrage du consumer Django MQTT...")
    
    while True:
        try:
            client.connect(MQTT_BROKER, MQTT_PORT, 60)
            client.loop_forever()
        except Exception as e:
            logging.error(f"Erreur de connexion MQTT: {e}. Nouvelle tentative dans 5s...")
            time.sleep(5)

if __name__ == "__main__":
    main()
