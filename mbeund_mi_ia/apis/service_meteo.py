import requests
import json
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

# Coordonnées Thiaroye Sur Mer
LAT = 14.742
LNG = -17.406

def get_previsions_open_meteo():
    """
    Récupère les prévisions gratuites horaires via Open-Meteo.
    Ne nécessite pas de clé API.
    """
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": LAT,
        "longitude": LNG,
        "hourly": "precipitation,rain,windspeed_10m,relativehumidity_2m",
        "timezone": "Africa/Dakar",
        "forecast_days": 3
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        return data
    except Exception as e:
        logging.error(f"Erreur API Open-Meteo: {e}")
        return None

def analyser_previsions():
    """
    Extrait la pluie prévue sur les prochaines heures et détermine s'il faut alerter.
    """
    data = get_previsions_open_meteo()
    if not data or 'hourly' not in data:
        return None
        
    pluies = data['hourly']['precipitation']
    
    # On regarde les 6 premières heures
    pluie_prochaines_6h = sum(pluies[0:6])
    pluie_prochaines_24h = sum(pluies[0:24])
    
    alerte_meteo = False
    niveau = "vert"
    
    if pluie_prochaines_6h > 30:
        alerte_meteo = True
        niveau = "orange"
    elif pluie_prochaines_6h > 15:
        alerte_meteo = True
        niveau = "jaune"
        
    resultat = {
        "timestamp": datetime.now().isoformat(),
        "pluie_6h_mm": round(pluie_prochaines_6h, 1),
        "pluie_24h_mm": round(pluie_prochaines_24h, 1),
        "alerte_preventive": alerte_meteo,
        "niveau_alerte": niveau
    }
    
    logging.info(f"Météo: {resultat['pluie_6h_mm']}mm prévus dans les 6h. Alerte: {niveau}")
    return resultat

if __name__ == "__main__":
    print(json.dumps(analyser_previsions(), indent=2))
