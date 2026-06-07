# Configuration des capteurs IoT simulés pour Thiaroye Sur Mer

# Broker MQTT
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_TOPIC_BASE = "mbeundmi/capteurs/"

# Liste des capteurs de niveau d'eau (cm)
CAPTEURS_EAU = [
    {"id": 1, "nom": "Capteur_Thiaroye_Gare", "lat": 14.742333, "lng": -17.374694, "type": "eau"},
    {"id": 2, "nom": "Capteur_Wakhinane", "lat": 14.741333, "lng": -17.377000, "type": "eau"},
    {"id": 3, "nom": "Capteur_Diamaguene", "lat": 14.743167, "lng": -17.376472, "type": "eau"},
    # Deux autres points génériques proches pour couvrir 5 capteurs
    {"id": 4, "nom": "Capteur_Thiaroye_Mer", "lat": 14.740500, "lng": -17.375500, "type": "eau"},
    {"id": 5, "nom": "Capteur_Zone_Industrielle", "lat": 14.744000, "lng": -17.373000, "type": "eau"}
]

# Liste des pluviomètres (mm/h)
PLUVIOMETRES = [
    {"id": 6, "nom": "Pluvio_Mairie", "lat": 14.742000, "lng": -17.375000, "type": "pluie"},
    {"id": 7, "nom": "Pluvio_Est", "lat": 14.743500, "lng": -17.372000, "type": "pluie"},
    {"id": 8, "nom": "Pluvio_Ouest", "lat": 14.741000, "lng": -17.378000, "type": "pluie"}
]
