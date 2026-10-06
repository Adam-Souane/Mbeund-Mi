# Rejoue la logique de la tâche planifiée « predire_risques_avec_random_forest » (backend/alertes/tasks.py)
# pour plusieurs cumuls de pluie sur 24 h et les 7 zones : seuil d'activation, forêt aléatoire en 3 classes,
# seuils jaune/orange/rouge par défaut des zones. Sans base de données ni réseau.
# Usage (depuis backend/, environnement du projet) : python ../rapport_pff/sources/mesures/rejeu_seuils.py
import json
import os
import re
import sys

backend = os.getcwd()
sys.path.insert(0, backend)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings_audit')
import django  # noqa: E402
django.setup()
from alertes.flood_risk_predictor import predict_zone_risk  # noqa: E402

tasks = open(os.path.join(backend, 'alertes', 'tasks.py'), encoding='utf8').read()
modeles = open(os.path.join(backend, 'alertes', 'models.py'), encoding='utf8').read()
seuil_min = float(re.search(r'PLUIE_MIN_MODELE_MM\s*=\s*([\d.]+)', tasks).group(1))
jaune, orange, rouge = (float(re.search(rf'seuil_{n}\s*=.*?default=([\d.]+)', modeles).group(1)) for n in ('jaune', 'orange', 'rouge'))
zones = [l.split(',')[0] for l in open(os.path.join(backend, 'alertes', 'topographie_thiaroye.csv'), encoding='utf8').read().split('\n')[1:] if l.strip()]


def niveau(score):
    return 'rouge' if score >= rouge else 'orange' if score >= orange else 'jaune' if score >= jaune else 'vert'


sortie = {'seuil_activation_mm': seuil_min, 'seuils_zone': {'jaune': jaune, 'orange': orange, 'rouge': rouge}, 'resultats': []}
for pluie in (5, 10, 14, 15, 20, 30, 45, 65, 80):
    ligne = {'pluie_24h_mm': pluie, 'zones': {}}
    for z in zones:
        if pluie < seuil_min:
            ligne['zones'][z] = {'niveau': 'vert', 'score': 0.0, 'modele_appele': False}
            continue
        p = predict_zone_risk(z, pluie)
        ligne['zones'][z] = {'niveau': niveau(p['score_risque']), 'score': round(p['score_risque'], 2), 'classe_rf': p['risque'], 'modele_appele': True}
    sortie['resultats'].append(ligne)
print(json.dumps(sortie, ensure_ascii=False, indent=1))
