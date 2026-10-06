# Rejoue les trois scénarios de demo/demo_scenarii.py avec le vrai service IA (modèles du dépôt),
# sans réseau (prévisions météo remplacées par l'extrapolation de la mesure) ni base de données.
# Usage : python rejeu_scenarios.py   (depuis la racine du dépôt, avec l'environnement du projet)
import json
import os
import sys

racine = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, os.path.join(racine, 'mbeund_mi_ia'))
from ia.service_prediction import PredictionService  # noqa: E402

SCENARIOS = [
    ('Hivernage normal', 25.0, 5.0, 5, 0.0),
    ('Pluie intense', 35.0, 45.0, 5, 8.0),
    ('Inondation critique', 85.0, 80.0, 5, 12.0),
]

PredictionService.recuperer_historique_24j = lambda self, zone_id: None
PredictionService._previsions_pluie = staticmethod(lambda pluie: (pluie * 0.5, pluie, pluie * 1.5))
service = PredictionService()
sortie = []
for nom, eau0, pluie, n, pas in SCENARIOS:
    mesures, eau, lignes = [], eau0, []
    for i in range(n):
        mesures.append({'capteur_id': 1, 'pluie_mm': pluie, 'niveau_eau_cm': eau})
        r = service.analyser_risque(1, mesures)
        lignes.append({'releve': i + 1, 'eau_cm': round(eau, 1), 'pluie_mm': pluie, 'risque': r['risque_global'], 'confiance': r['confiance'],
                       'niveau_24h_cm': r['predictions']['24h']['niveau_cm'], 'qualite': r['qualite_donnees']})
        eau += pas
    sortie.append({'scenario': nom, 'releves': lignes})
print(json.dumps(sortie, ensure_ascii=False, indent=1))
