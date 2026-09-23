"""
Service de prédiction des risques d'inondation utilisant Random Forest
Charge le modèle entraîné et fournit des prédictions en temps réel
"""

import pickle
import os
import pandas as pd
from django.conf import settings
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)

class FloodRiskPredictor:
    """Service de prédiction des risques d'inondation"""

    _instance = None
    _model_data = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        """Initialiser le service et charger le modèle"""
        if self._model_data is None:
            self._load_model()

    def _load_model(self):
        """Charger le modèle Random Forest depuis le fichier pickle"""
        try:
            model_path = os.path.join(
                os.path.dirname(__file__),
                'random_forest_flood_risk_model.pkl'
            )

            if not os.path.exists(model_path):
                logger.warning(f"Modèle non trouvé: {model_path}")
                return False

            with open(model_path, 'rb') as f:
                self._model_data = pickle.load(f)

            logger.info(f"Modèle Random Forest chargé avec succès")
            return True
        except Exception as e:
            logger.error(f"Erreur lors du chargement du modèle: {e}")
            return False

    def analyser_risque(self, zone_id, mesures_recentes):
        """
        Interface compatible avec PredictionService.analyser_risque()
        mesures_recentes = [{"capteur_id": 1, "pluie_mm": 15.2, "niveau_eau_cm": 45.0}, ...]
        """
        if not mesures_recentes:
            return {"erreur": "Aucune mesure fournie"}

        # Récupérer la zone pour son nom
        from alertes.models import ZoneRisque
        try:
            zone = ZoneRisque.objects.get(id=zone_id)
            zone_name = zone.quartier
        except ZoneRisque.DoesNotExist:
            return {"erreur": f"Zone {zone_id} non trouvée"}

        # Utiliser la dernière mesure pour la pluviométrie
        derniere_mesure = mesures_recentes[-1]
        pluie_mm = float(derniere_mesure.get('pluie_mm', 0))

        # Appeler predict_zone_risk et adapter la réponse
        resultat = self.predict_zone_risk(zone_name, pluie_mm)

        if 'erreur' in resultat:
            return resultat

        # Adapter le format de retour pour être compatible avec PredictionService
        return {
            "risque_global": resultat.get('risque', 'vert').lower(),
            "confiance": resultat.get('confiance', 0),
            "recommandation_fr": resultat.get('recommandation', ''),
            "details": resultat
        }

    def predire_niveau_eau_lstm(self, historique):
        """
        Placeholder pour compatibilité avec PredictionService
        Returns None car FloodRiskPredictor n'a pas de LSTM
        """
        return None

    def predict_zone_risk(self, zone_name, pluviometrie_mm, altitude_m=None, pente=None):
        """
        Prédire le niveau de risque pour une zone

        Args:
            zone_name (str): Nom de la zone
            pluviometrie_mm (float): Pluviométrie en mm (dernières 24h)
            altitude_m (float): Altitude médiane (optionnel, récupérée de la BD)
            pente (float): Pente en % (optionnel, récupérée de la BD)

        Returns:
            dict: {
                'zone': str,
                'risque': str ('Faible', 'Moyen', 'Grave'),
                'score': float (0-1),
                'probabilites': {'Faible': %, 'Moyen': %, 'Grave': %}
            }
        """
        if self._model_data is None:
            return {'zone': zone_name, 'risque': 'Indisponible', 'erreur': 'Modèle non chargé'}

        try:
            model = self._model_data['model']
            drainage_encoder = self._model_data['drainage_encoder']
            gravity_map_inv = {v: k for k, v in self._model_data['gravity_map'].items()}

            # Récupérer les données topographiques si non fournies
            topographie = {z['Zone']: z for z in self._model_data['topographie']}
            if zone_name in topographie:
                zone_data = topographie[zone_name]
                altitude_m = altitude_m or zone_data.get('Altitude_mediane_m', 5.0)
                pente = pente or zone_data.get('Pente_percent', 0.5)
                permeabilite = zone_data.get('Permeabilite_percent', 50)
                drainage_qualite = zone_data.get('Drainage_qualite', 'Moyen')
            else:
                # Valeurs par défaut
                altitude_m = altitude_m or 5.0
                pente = pente or 0.5
                permeabilite = 50
                drainage_qualite = 'Moyen'

            # Encoder le drainage
            drainage_encoded = drainage_encoder.transform([drainage_qualite])[0]

            # Préparer les features pour la prédiction
            features = pd.DataFrame({
                'Pluviometrie_mm': [pluviometrie_mm],
                'Altitude_mediane_m': [altitude_m],
                'Pente_percent': [pente],
                'Permeabilite_percent': [permeabilite],
                'Drainage_encoded': [drainage_encoded]
            })

            # Prédiction
            prediction = model.predict(features)[0]
            prediction_proba = model.predict_proba(features)[0]

            # Score de confiance (probabilité du risque prédit)
            score = prediction_proba[prediction]

            # Résultat
            return {
                'zone': zone_name,
                'risque': gravity_map_inv.get(prediction, 'Inconnu'),
                'score': float(score),
                'probabilites': {
                    'Faible': float(prediction_proba[0]),
                    'Moyen': float(prediction_proba[1]),
                    'Grave': float(prediction_proba[2])
                },
                'features': {
                    'pluviometrie': pluviometrie_mm,
                    'altitude': altitude_m,
                    'pente': pente,
                    'permeabilite': permeabilite,
                    'drainage': drainage_qualite
                }
            }
        except Exception as e:
            logger.error(f"Erreur prédiction pour {zone_name}: {e}")
            return {'zone': zone_name, 'risque': 'Erreur', 'erreur': str(e)}

    def predict_all_zones(self, rainfall_data):
        """
        Prédire les risques pour TOUTES les zones

        Args:
            rainfall_data (dict): {zone: pluviometrie_mm}

        Returns:
            list: Prédictions pour chaque zone
        """
        predictions = []
        for zone, rainfall in rainfall_data.items():
            pred = self.predict_zone_risk(zone, rainfall)
            predictions.append(pred)
        return predictions


# Instance globale
predictor = FloodRiskPredictor()


def predict_zone_risk(zone_name, pluviometrie_mm):
    """Fonction helper pour prédiction rapide"""
    return predictor.predict_zone_risk(zone_name, pluviometrie_mm)
