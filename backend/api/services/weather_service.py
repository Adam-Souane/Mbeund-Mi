import os
import sys
import requests
from datetime import datetime, timezone

# Coordonnées géographiques de Thiaroye-sur-Mer, Dakar, Sénégal
LATITUDE = 14.738
LONGITUDE = -17.380

def fetch_and_save_weather():
    """
    Récupère les prévisions météo pour Thiaroye-sur-Mer via OpenWeatherMap API.
    Si aucune clé API n'est configurée dans .env, fonctionne en mode simulation réaliste.
    """
    api_key = os.environ.get('OPENWEATHER_API_KEY')
    print("=" * 65)
    print("MBEUND-MI - SERVICE D'INGESTION METEO EN TEMPS REEL")
    print("=" * 65)

    if api_key:
        print("[INFO] Clé OpenWeatherMap détectée. Interrogation de l'API en direct...")
        url = f"https://api.openweathermap.org/data/2.5/forecast?lat={LATITUDE}&lon={LONGITUDE}&units=metric&appid={api_key}&lang=fr"
        try:
            res = requests.get(url, timeout=10)
            if res.status_code == 200:
                data = res.json()
                forecasts = []
                for item in data.get('list', [])[:5]:
                    dt = datetime.fromtimestamp(item['dt'], tz=timezone.utc)
                    temp = item['main']['temp']
                    rain = item.get('rain', {}).get('3h', 0.0)
                    wind = item['wind']['speed'] * 3.6 # m/s -> km/h
                    forecasts.append({'dt': dt, 'temp': temp, 'rain': rain, 'wind': wind, 'source': 'OpenWeatherMap API'})
                print(f"[SUCCESS] {len(forecasts)} prévisions récupérées depuis l'API OpenWeatherMap.")
                return forecasts
            else:
                print(f"[WARN] Erreur API ({res.status_code}). Basculement en mode simulation...")
        except Exception as e:
            print(f"[WARN] Erreur de connexion API ({e}). Basculement en mode simulation...")

    # Mode Simulation Réaliste pour Dakar / Thiaroye-sur-Mer
    print("[INFO] Mode Simulation Actif (OpenWeatherMap / ANACIM Sénégal)")
    now = datetime.now(timezone.utc)
    simulated_data = [
        {'dt': now, 'temp': 30.5, 'rain': 15.2, 'wind': 18.5, 'source': 'ANACIM Sénégal (Simulé)'},
        {'dt': now, 'temp': 28.0, 'rain': 45.0, 'wind': 25.0, 'source': 'ANACIM Sénégal (Forte Pluie)'},
        {'dt': now, 'temp': 26.5, 'rain': 8.0, 'wind': 14.0, 'source': 'OpenWeatherMap (Simulé)'},
    ]
    print(f"[SUCCESS] {len(simulated_data)} prévisions météo générées avec succès.")
    print("=" * 65)
    return simulated_data

if __name__ == '__main__':
    fetch_and_save_weather()
