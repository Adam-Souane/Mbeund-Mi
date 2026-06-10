import pytest
from datetime import datetime, timedelta
from unittest.mock import patch
import sys
import os

# Ajouter le dossier parent au sys.path pour les imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from apis.declencheur_alertes import peut_envoyer_sms, HISTORIQUE_SMS

@pytest.fixture(autouse=True)
def reset_historique():
    """Réinitialise l'historique avant chaque test."""
    HISTORIQUE_SMS.clear()

@patch('apis.declencheur_alertes.datetime')
def test_bloque_si_meme_niveau_recent(mock_datetime):
    # 1. Simuler une alerte ORANGE à 12:00
    maintenant = datetime(2026, 8, 15, 12, 0, 0)
    mock_datetime.now.return_value = maintenant
    
    assert peut_envoyer_sms(1, 'orange') == True
    HISTORIQUE_SMS[1] = {'niveau': 'orange', 'timestamp': maintenant}
    
    # 2. Simuler une 2ème alerte ORANGE à 12:05 (5 min plus tard)
    cinq_min_plus_tard = maintenant + timedelta(minutes=5)
    mock_datetime.now.return_value = cinq_min_plus_tard
    
    # Vérifie que le SMS est bloqué
    assert peut_envoyer_sms(1, 'orange') == False

@patch('apis.declencheur_alertes.datetime')
def test_passe_si_niveau_empire(mock_datetime):
    # 1. Simuler une alerte ORANGE à 12:00
    maintenant = datetime(2026, 8, 15, 12, 0, 0)
    mock_datetime.now.return_value = maintenant
    
    assert peut_envoyer_sms(1, 'orange') == True
    HISTORIQUE_SMS[1] = {'niveau': 'orange', 'timestamp': maintenant}
    
    # 2. Simuler une alerte ROUGE (empirement) à 12:05
    cinq_min_plus_tard = maintenant + timedelta(minutes=5)
    mock_datetime.now.return_value = cinq_min_plus_tard
    
    # Vérifie que le SMS passe
    assert peut_envoyer_sms(1, 'rouge') == True

@patch('apis.declencheur_alertes.datetime')
def test_passe_apres_2_heures(mock_datetime):
    # 1. Injecter un historique d'il y a 3 heures
    il_y_a_3h = datetime(2026, 8, 15, 9, 0, 0)
    HISTORIQUE_SMS[1] = {'niveau': 'orange', 'timestamp': il_y_a_3h}
    
    # 2. Tester l'envoi d'une alerte ORANGE maintenant (12:00)
    maintenant = datetime(2026, 8, 15, 12, 0, 0)
    mock_datetime.now.return_value = maintenant
    
    # Vérifie que le SMS passe car le délai de 2h est écoulé
    assert peut_envoyer_sms(1, 'orange') == True
