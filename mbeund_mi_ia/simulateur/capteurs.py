import time
import json
import random
import argparse
import numpy as np
import paho.mqtt.client as mqtt
from datetime import datetime

from config import MQTT_BROKER, MQTT_PORT, MQTT_TOPIC_BASE, CAPTEURS_EAU, PLUVIOMETRES

def simuler_valeur(valeur_base, bruit_pct=0.05):
    """Ajoute un bruit gaussien de +/- bruit_pct %"""
    bruit = np.random.normal(0, valeur_base * bruit_pct)
    return round(max(0, valeur_base + bruit), 2)

def main():
    parser = argparse.ArgumentParser(description="Simulateur IoT MBEUND MI")
    parser.add_argument("--mode", choices=["normal", "pluie_moderee", "inondation_critique"],
                        default="normal", help="Scénario de simulation")
    args = parser.parse_args()

    # Connexion MQTT (compatibilité paho-mqtt v1 et v2)
    try:
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1, client_id="mbeundmi_simulateur")
    except AttributeError:
        client = mqtt.Client(client_id="mbeundmi_simulateur")
    
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        print(f"Connecté au broker MQTT {MQTT_BROKER}:{MQTT_PORT} (Mode: {args.mode})")
    except Exception as e:
        print(f"Erreur de connexion MQTT: {e}")
        print("Attention: Mosquitto n'est pas lancé. Les données seront seulement affichées dans la console.")
        client = None

    # Définition des valeurs de base selon le mode
    if args.mode == "normal":
        eau_base = 25.0
        pluie_base = 2.0
    elif args.mode == "pluie_moderee":
        eau_base = 45.0
        pluie_base = 15.0
    else:  # inondation_critique
        eau_base = 85.0
        pluie_base = 65.0

    print("Démarrage de la simulation (Ctrl+C pour arrêter)...")
    
    try:
        while True:
            timestamp = datetime.now().isoformat()
            
            # Simulation Capteurs d'eau
            for capteur in CAPTEURS_EAU:
                # Ajout de variation aléatoire pour différencier les capteurs
                valeur = simuler_valeur(eau_base + random.uniform(-10, 10))
                payload = {
                    "capteur_id": capteur["id"],
                    "nom": capteur["nom"],
                    "valeur": valeur,
                    "unite": "cm",
                    "timestamp": timestamp,
                    "type": "eau"
                }
                topic = f"{MQTT_TOPIC_BASE}{capteur['id']}"
                if client:
                    client.publish(topic, json.dumps(payload))
                print(f"[EAU] {capteur['nom']} : {valeur} cm")
                
            # Simulation Pluviomètres
            for pluvio in PLUVIOMETRES:
                valeur = simuler_valeur(pluie_base + random.uniform(-2, 5))
                payload = {
                    "capteur_id": pluvio["id"],
                    "nom": pluvio["nom"],
                    "valeur": valeur,
                    "unite": "mm/h",
                    "timestamp": timestamp,
                    "type": "pluie"
                }
                topic = f"{MQTT_TOPIC_BASE}{pluvio['id']}"
                if client:
                    client.publish(topic, json.dumps(payload))
                print(f"[PLUIE] {pluvio['nom']} : {valeur} mm/h")
                
            print("-" * 40)
            time.sleep(60) # Une mesure toutes les 60 secondes
            
            # Si le mode est critique, on simule une montée des eaux progressive
            if args.mode == "inondation_critique":
                eau_base += 2.0
                
    except KeyboardInterrupt:
        print("\nSimulation arrêtée.")
        if client:
            client.disconnect()

if __name__ == "__main__":
    main()
