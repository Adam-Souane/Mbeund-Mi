import pytest
import sys
import os

# Ajouter le dossier parent au sys.path pour les imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ia.recommandations import generer_recommandation

def test_recommandation_rouge_wakhinane():
    reco = generer_recommandation(zone_id=2, risque='rouge', niveau_cm=130, horizon_h=12)
    
    assert 'Wakhinane' in reco['fr']
    assert 'ÉVACUATION' in reco['fr']
    
    assert 'Wakhinane' in reco['wo']
    assert 'GÉNN' in reco['wo']

def test_recommandation_vert():
    reco = generer_recommandation(zone_id=1, risque='vert', niveau_cm=20, horizon_h=12)
    
    assert 'Surveillance' in reco['fr']
    assert 'bayyi xel' in reco['wo']

def test_tous_quartiers_couverts():
    for zone_id in range(1, 6):
        try:
            reco = generer_recommandation(zone_id, 'jaune', 50, 24)
            assert isinstance(reco, dict)
            assert 'fr' in reco and 'wo' in reco
            # Vérifier qu'on n'utilise pas le fallback "Zone X" si possible
            assert 'Zone' not in reco['fr'] or zone_id == 5 # 5 is Zone Industrielle
        except KeyError:
            pytest.fail(f"KeyError levée pour la zone {zone_id}")
