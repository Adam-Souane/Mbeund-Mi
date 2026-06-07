import pytest
import sys
import os

# Ajouter le dossier racine au path pour les imports
base_dir = os.path.dirname(os.path.dirname(__file__))
sys.path.append(base_dir)

from simulateur.capteurs import simuler_valeur
from apis.service_meteo import analyser_previsions

def test_simulateur_bruit():
    valeur_base = 50.0
    valeur_bruit = simuler_valeur(valeur_base, bruit_pct=0.05)
    # Le bruit est de +/- 5% max environ
    assert 45.0 <= valeur_bruit <= 55.0

def test_simulateur_valeur_negative():
    # S'assure qu'un niveau d'eau ne peut pas devenir négatif
    valeur_base = 0.0
    valeur_bruit = simuler_valeur(valeur_base, bruit_pct=0.10)
    assert valeur_bruit >= 0.0

def test_format_donnees_meteo(mocker):
    # Mock de l'API Open-Meteo pour ne pas faire de vraies requêtes
    mock_data = {
        "hourly": {
            "precipitation": [0.0]*5 + [10.5, 5.0, 20.0] + [0.0]*16,
            "time": ["2026-08-15T00:00"] * 24
        }
    }
    mocker.patch('apis.service_meteo.get_previsions_open_meteo', return_value=mock_data)
    
    resultat = analyser_previsions()
    assert resultat is not None
    # Sur les 6 premières heures : index 0 à 5. La pluie est 10.5 à l'index 5.
    assert resultat["pluie_6h_mm"] == 10.5
    assert resultat["alerte_preventive"] is False
    assert resultat["niveau_alerte"] == "vert"
