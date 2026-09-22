"""
Service d'intégration Open-Meteo pour prévisions météo
Améliore les prédictions Random Forest avec données météo en temps réel
"""

import requests
import logging
from datetime import datetime, timedelta
from django.utils import timezone

logger = logging.getLogger(__name__)

# Coordonnées Thiaroye-sur-Mer (centre de la zone étudiée)
THIAROYE_LAT = 14.742
THIAROYE_LON = -17.406


class WeatherService:
    """Service pour récupérer les prévisions météo depuis Open-Meteo"""

    BASE_URL = "https://api.open-meteo.com/v1/forecast"

    # Paramètres météo disponibles
    HOURLY_PARAMS = [
        "precipitation",        # Pluie (mm/h)
        "weather_code",         # Code météo
        "temperature_2m",       # Température
        "relative_humidity_2m", # Humidité
    ]

    DAILY_PARAMS = [
        "precipitation_sum",    # Pluie totale (mm)
        "weather_code",         # Code météo
        "temperature_2m_max",   # Temp max
        "temperature_2m_min",   # Temp min
    ]

    @staticmethod
    def get_current_and_forecast():
        """
        Récupère les données météo actuelles ET les prévisions 7 jours

        Returns:
            dict: {
                'current': {...},
                'forecast_24h': {...},
                'forecast_7d': {...},
                'timestamp': datetime
            }
        """
        try:
            params = {
                'latitude': THIAROYE_LAT,
                'longitude': THIAROYE_LON,
                'current': 'precipitation,temperature_2m,relative_humidity_2m,weather_code',
                'hourly': ','.join(WeatherService.HOURLY_PARAMS),
                'daily': ','.join(WeatherService.DAILY_PARAMS),
                'timezone': 'Africa/Dakar',
            }

            response = requests.get(WeatherService.BASE_URL, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()

            # Extraire les données actuelles
            current = data.get('current', {})

            # Extraire les prévisions horaires (24h)
            hourly = data.get('hourly', {})
            forecast_24h = WeatherService._process_hourly_forecast(hourly)

            # Extraire les prévisions journalières (7 jours)
            daily = data.get('daily', {})
            forecast_7d = WeatherService._process_daily_forecast(daily)

            result = {
                'current': {
                    'precipitation_mm': current.get('precipitation', 0),
                    'temperature_c': current.get('temperature_2m', 0),
                    'humidity_percent': current.get('relative_humidity_2m', 0),
                    'weather_code': current.get('weather_code', 0),
                },
                'forecast_24h': forecast_24h,
                'forecast_7d': forecast_7d,
                'timestamp': timezone.now(),
            }

            logger.info("[Weather] Données météo récupérées avec succès")
            return result

        except requests.RequestException as e:
            logger.error(f"[Weather] Erreur API Open-Meteo: {e}")
            return None
        except Exception as e:
            logger.error(f"[Weather] Erreur traitement données météo: {e}")
            return None

    @staticmethod
    def _process_hourly_forecast(hourly_data):
        """Traite les prévisions horaires pour les 24h suivantes"""
        try:
            times = hourly_data.get('time', [])
            precipitation = hourly_data.get('precipitation', [])
            temperature = hourly_data.get('temperature_2m', [])
            humidity = hourly_data.get('relative_humidity_2m', [])

            # Prendre les 24 premières heures
            pluie_total_24h = sum(precipitation[:24]) if len(precipitation) >= 24 else sum(precipitation)
            temp_moyenne = sum(temperature[:24]) / 24 if len(temperature) >= 24 else 0
            humidite_moyenne = sum(humidity[:24]) / 24 if len(humidity) >= 24 else 0

            return {
                'precipitation_total_mm': round(pluie_total_24h, 2),
                'temperature_moyenne_c': round(temp_moyenne, 1),
                'humidity_moyenne_percent': round(humidite_moyenne, 1),
                'heures': len(times[:24]),
            }
        except Exception as e:
            logger.error(f"[Weather] Erreur traitement hourly: {e}")
            return {}

    @staticmethod
    def _process_daily_forecast(daily_data):
        """Traite les prévisions journalières pour les 7 jours"""
        try:
            dates = daily_data.get('time', [])
            precip = daily_data.get('precipitation_sum', [])
            temp_max = daily_data.get('temperature_2m_max', [])
            temp_min = daily_data.get('temperature_2m_min', [])

            forecast = []
            for i in range(min(7, len(dates))):
                forecast.append({
                    'date': dates[i],
                    'precipitation_mm': round(precip[i], 2) if i < len(precip) else 0,
                    'temperature_max_c': round(temp_max[i], 1) if i < len(temp_max) else 0,
                    'temperature_min_c': round(temp_min[i], 1) if i < len(temp_min) else 0,
                })

            return forecast
        except Exception as e:
            logger.error(f"[Weather] Erreur traitement daily: {e}")
            return []

    @staticmethod
    def get_24h_precipitation_forecast():
        """
        Obtient spécifiquement la pluie prévue pour les 24 prochaines heures

        Returns:
            float: Précipitation totale en mm pour les 24h suivantes
        """
        data = WeatherService.get_current_and_forecast()
        if data:
            return data['forecast_24h'].get('precipitation_total_mm', 0)
        return 0


def get_weather_features_for_prediction(current_precipitation=None):
    """
    Obtient les features météo pour améliorer la prédiction Random Forest

    Args:
        current_precipitation (float): Pluie actuelle (si None, récupère de l'API)

    Returns:
        dict: {
            'precipitation_24h': float,
            'temperature': float,
            'humidity': float,
            'precipitation_forecast_72h': float,
        }
    """
    weather_data = WeatherService.get_current_and_forecast()

    if not weather_data:
        # Valeurs par défaut si API indisponible
        return {
            'precipitation_24h': current_precipitation or 0,
            'temperature': 25.0,
            'humidity': 70.0,
            'precipitation_forecast_72h': 0,
        }

    current = weather_data['current']
    forecast_24h = weather_data['forecast_24h']
    forecast_7d = weather_data['forecast_7d']

    # Calculer les prévisions 72h (pluie 3 jours suivants)
    precip_72h = sum([day.get('precipitation_mm', 0) for day in forecast_7d[:3]])

    return {
        'precipitation_24h': current_precipitation or current['precipitation_mm'],
        'temperature': current['temperature_c'],
        'humidity': current['humidity_percent'],
        'precipitation_forecast_24h': forecast_24h.get('precipitation_total_mm', 0),
        'precipitation_forecast_72h': round(precip_72h, 2),
    }
