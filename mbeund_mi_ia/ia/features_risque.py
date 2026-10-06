"""Définition unique des features et de la cible du modèle de risque pluviométrique.

Partagé par l'entraînement (random_forest.py) et l'inférence (service_prediction.py)
pour garantir les mêmes colonnes, le même ordre et les mêmes calculs de cumuls.

Tâche : à partir de la pluie observée jusqu'au jour J, prédire la classe de risque
du jour J+1 (alerte précoce à 24 h). La classe est définie par le cumul de pluie
sur 72 h du jour J+1, mais ce cumul n'est PAS connu à J : le modèle doit réellement
anticiper, il ne peut pas redécouvrir un seuil appliqué à sa propre entrée.
"""
import numpy as np
import pandas as pd

FEATURES_RF = ['pluie_mm', 'pluie_cumul_24h', 'pluie_cumul_72h']

# Seuils sur le cumul de pluie 72 h (mm). Calibrés pour la presqu'île de Dakar :
# vert < 20 <= jaune < 45 <= orange < 75 <= rouge (≥ 75 mm correspond aux inondations majeures / ORSEC)
SEUILS_RISQUE_72H = (20.0, 45.0, 75.0)
LABELS_RISQUE = {0: "vert", 1: "jaune", 2: "orange", 3: "rouge"}


def classer_risque(cumul_72h):
    """Classe de risque (0..3) à partir d'un cumul 72 h (scalaire, array ou Series)."""
    return np.digitize(cumul_72h, SEUILS_RISQUE_72H)


def calculer_features(pluie_mm):
    """Features pour chaque jour d'une série de pluie journalière ordonnée.

    pluie_cumul_24h : pluie du jour ; pluie_cumul_72h : somme des 3 derniers jours
    (jour courant inclus, min_periods=1 en début de série).
    """
    pluie = pd.Series(pluie_mm, dtype=float).reset_index(drop=True)
    return pd.DataFrame({
        'pluie_mm': pluie,
        'pluie_cumul_24h': pluie.rolling(window=1, min_periods=1).sum(),
        'pluie_cumul_72h': pluie.rolling(window=3, min_periods=1).sum(),
    })[FEATURES_RF]


def features_depuis_pluies_recentes(pluies_3j):
    """Une ligne de features à partir des pluies des 3 derniers jours (du plus ancien
    au plus récent, jour courant en dernier). Même calcul que calculer_features()."""
    return calculer_features(list(pluies_3j)).iloc[[-1]].reset_index(drop=True)
