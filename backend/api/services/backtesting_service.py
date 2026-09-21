import os
import sys
import pandas as pd
from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.gis.geos import GEOSGeometry
from alertes.models import EpisodeInondation
import logging

logger = logging.getLogger('mbeund_mi_backtesting')

# Import du service de prédiction IA
_MBEUND_MI_IA_PATH = os.path.join(os.path.dirname(settings.BASE_DIR), 'mbeund_mi_ia')
if _MBEUND_MI_IA_PATH not in sys.path:
    sys.path.insert(0, _MBEUND_MI_IA_PATH)


class BacktestingService:
    """Service pour tester le modèle sur l'historique réel d'inondations."""

    def __init__(self):
        self.data_dir = os.path.join(os.path.dirname(settings.BASE_DIR), 'mbeund_mi_ia', 'data')
        self.pluies_df = None
        self.prediction_service = None
        self._charger_donnees()

    def _charger_donnees(self):
        """Charge les données historiques de pluie et le service de prédiction."""
        try:
            # Charger CSV pluies Open-Meteo
            csv_path = os.path.join(self.data_dir, 'pluies_dakar_2010_2024_openmeteo.csv')
            self.pluies_df = pd.read_csv(csv_path)
            self.pluies_df['date'] = pd.to_datetime(self.pluies_df['date'])
            self.pluies_df = self.pluies_df.sort_values('date')

            # Charger le service de prédiction
            from ia.service_prediction import PredictionService
            self.prediction_service = PredictionService()

            logger.info(f"Backtesting service initialized with {len(self.pluies_df)} days of rain data")
        except Exception as e:
            logger.error(f"Erreur chargement données backtesting: {e}")
            raise

    def _obtenir_pluies_precedentes(self, date, jours=3):
        """
        Retourne la pluie cumulée des N jours précédant une date donnée.
        date: datetime.date ou datetime.datetime
        jours: nombre de jours à regarder en arrière (défaut: 3 = 72h)
        """
        if isinstance(date, datetime):
            date = date.date()

        date_fin = date
        date_debut = date - timedelta(days=jours)

        pluies_window = self.pluies_df[
            (self.pluies_df['date'].dt.date >= date_debut) &
            (self.pluies_df['date'].dt.date <= date_fin)
        ]

        if len(pluies_window) == 0:
            return 0.0, []

        pluie_cumulee = float(pluies_window['pluie_mm'].sum())
        pluies_list = pluies_window.to_dict('records')

        return pluie_cumulee, pluies_list

    def executer_backtesting(self):
        """
        Exécute le backtesting : pour chaque inondation réelle,
        calcule ce que le modèle aurait prédit.

        Retourne:
        {
          "episodes": [
            {
              "id": 123,
              "date_debut": "2020-09-01T...",
              "pluie_cumulee_72h_mm": 145.2,
              "niveau_estime_cm": 75.3,
              "risque_predit": "orange",
              "confiance": 87.5,
              "detecte": true,  # risque_predit >= "jaune"
              "surface_ha": 25.5,
              "geom_wkt": "MULTIPOLYGON(...)"
            },
            ...
          ],
          "statistiques": {
            "nombre_episodes_total": 15,
            "nombre_episodes_detectes": 13,
            "taux_detection_percent": 86.7,
            "risques_predits_distribution": {"vert": 2, "jaune": 3, "orange": 5, "rouge": 5}
          }
        }
        """
        episodes = EpisodeInondation.objects.all().order_by('date_debut')

        if not episodes.exists():
            return {
                "episodes": [],
                "statistiques": {
                    "nombre_episodes_total": 0,
                    "nombre_episodes_detectes": 0,
                    "taux_detection_percent": 0,
                    "risques_predits_distribution": {}
                },
                "message": "Aucun épisode d'inondation historique enregistré pour le backtesting."
            }

        resultats_episodes = []
        risques_count = {"vert": 0, "jaune": 0, "orange": 0, "rouge": 0}

        for episode in episodes:
            try:
                # Récupérer les pluies 72h avant l'inondation
                pluie_cumulee, pluies_historique = self._obtenir_pluies_precedentes(
                    episode.date_debut, jours=3
                )

                # Estimer le niveau d'eau : formule simple basée sur pluie
                # (même formule que dans service_prediction.analyser_risque())
                niveau_estime = pluie_cumulee * 0.5  # Factor empirique

                # Lancer la prédiction du modèle
                if pluie_cumulee > 0:
                    mesures = [{"pluie_mm": pluie_cumulee, "niveau_eau_cm": niveau_estime}]
                    resultat_pred = self.prediction_service.analyser_risque(1, mesures)

                    risque_predit = resultat_pred.get('risque_global', 'vert')
                    confiance = resultat_pred.get('confiance', 0)
                else:
                    # Aucune pluie = pas de prédiction d'inondation
                    risque_predit = 'vert'
                    confiance = 0
                    niveau_estime = 0

                # Déterminer si "détecté" : risque >= jaune
                risque_labels_ordre = {'vert': 0, 'jaune': 1, 'orange': 2, 'rouge': 3}
                detecte = risque_labels_ordre.get(risque_predit, 0) >= 1

                # Compter les résultats
                risques_count[risque_predit] = risques_count.get(risque_predit, 0) + 1

                # Convertir la géométrie au WKT pour la sérialisation JSON
                geom_wkt = episode.geom.wkt if episode.geom else None

                resultats_episodes.append({
                    "id": episode.id,
                    "date_debut": episode.date_debut.isoformat(),
                    "date_fin": episode.date_fin.isoformat() if episode.date_fin else None,
                    "pluie_cumulee_72h_mm": round(pluie_cumulee, 1),
                    "niveau_estime_cm": round(niveau_estime, 1),
                    "risque_predit": risque_predit,
                    "confiance": round(confiance, 1),
                    "detecte": detecte,
                    "surface_ha": episode.surface_ha,
                    "geom_wkt": geom_wkt,
                })

            except Exception as e:
                logger.error(f"Erreur backtesting épisode {episode.id}: {e}")
                # Continuer avec l'épisode suivant
                resultats_episodes.append({
                    "id": episode.id,
                    "date_debut": episode.date_debut.isoformat(),
                    "erreur": str(e),
                })

        # Calculer les stats
        nb_total = len(resultats_episodes)
        nb_detectes = sum(1 for e in resultats_episodes if e.get('detecte', False))
        taux_detection = (nb_detectes / nb_total * 100) if nb_total > 0 else 0

        return {
            "episodes": resultats_episodes,
            "statistiques": {
                "nombre_episodes_total": nb_total,
                "nombre_episodes_detectes": nb_detectes,
                "taux_detection_percent": round(taux_detection, 1),
                "risques_predits_distribution": risques_count
            }
        }
