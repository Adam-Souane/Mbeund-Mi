"""Entraînement et évaluation honnête du classifieur de risque (Random Forest).

Méthodologie :
- features = pluie uniquement (aucun niveau d'eau synthétique en entrée) ;
- cible = classe de risque du jour J+1, définie par le cumul de pluie 72 h de J+1 ;
- découpage temporel strict : entraînement 2010-2021, test 2022-2024 ;
- comparaison à une baseline (persistance : « demain = classe d'aujourd'hui ») ;
- hyperparamètres choisis par validation croisée temporelle (TimeSeriesSplit) sur le train.
"""
import json
import os
import pickle

import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (accuracy_score, classification_report, confusion_matrix,
                             f1_score, precision_score, recall_score)
from sklearn.model_selection import GridSearchCV, TimeSeriesSplit

from .features_risque import FEATURES_RF, LABELS_RISQUE, SEUILS_RISQUE_72H, calculer_features, classer_risque

ANNEE_FIN_TRAIN = 2021
CLASSES = [0, 1, 2, 3]
NOMS = [LABELS_RISQUE[c] for c in CLASSES]


def construire_dataset(csv_path):
    """Retourne (X, y, dates_cible) : features au jour J, risque au jour J+1."""
    df = pd.read_csv(csv_path, parse_dates=['date']).sort_values('date').reset_index(drop=True)
    feats = calculer_features(df['pluie_mm'])
    risque_jour = classer_risque(feats['pluie_cumul_72h'])

    X = feats.iloc[:-1].reset_index(drop=True)
    y = pd.Series(risque_jour[1:], name='risque')                  # classe du lendemain
    dates_cible = df['date'].iloc[1:].reset_index(drop=True)
    return X, y, dates_cible


def decouper_temporel(X, y, dates_cible):
    """Train/test selon la date de la CIBLE : aucune cible 2022+ dans le train."""
    train = (dates_cible.dt.year <= ANNEE_FIN_TRAIN).to_numpy()
    return X[train], X[~train], y[train], y[~train]


def baseline_persistance(X):
    """Règle métier sans ML : le risque de demain est la classe d'aujourd'hui."""
    return classer_risque(X['pluie_cumul_72h'])


def metriques(y_true, y_pred):
    return {
        'accuracy': float(accuracy_score(y_true, y_pred)),
        'precision_macro': float(precision_score(y_true, y_pred, labels=CLASSES, average='macro', zero_division=0)),
        'recall_macro': float(recall_score(y_true, y_pred, labels=CLASSES, average='macro', zero_division=0)),
        'f1_macro': float(f1_score(y_true, y_pred, labels=CLASSES, average='macro', zero_division=0)),
        'f1_par_classe': {n: float(v) for n, v in zip(
            NOMS, f1_score(y_true, y_pred, labels=CLASSES, average=None, zero_division=0))},
        'matrice_confusion': confusion_matrix(y_true, y_pred, labels=CLASSES).tolist(),
        'rapport': classification_report(y_true, y_pred, labels=CLASSES, target_names=NOMS,
                                         zero_division=0, output_dict=True),
    }


def entrainer_rf():
    base_dir = os.path.dirname(os.path.dirname(__file__))
    data_dir = os.path.join(base_dir, 'data')

    X, y, dates_cible = construire_dataset(os.path.join(data_dir, 'pluies_dakar_2010_2024_openmeteo.csv'))
    X_train, X_test, y_train, y_test = decouper_temporel(X, y, dates_cible)
    print(f"Train : {len(X_train)} jours (2010-{ANNEE_FIN_TRAIN}) | Test : {len(X_test)} jours (2022-2024)")
    print("Effectifs train :", y_train.value_counts().sort_index().to_dict())
    print("Effectifs test  :", y_test.value_counts().sort_index().to_dict())

    # Réglage par validation croisée temporelle, sur le train uniquement
    recherche = GridSearchCV(
        RandomForestClassifier(random_state=42, class_weight='balanced_subsample', n_jobs=-1),
        param_grid={'n_estimators': [100, 300], 'max_depth': [3, 5, None], 'min_samples_leaf': [1, 5, 20]},
        cv=TimeSeriesSplit(n_splits=5), scoring='f1_macro', n_jobs=-1,
    )
    recherche.fit(X_train, y_train)
    rf = recherche.best_estimator_
    print("Meilleurs hyperparamètres :", recherche.best_params_,
          f"| F1 macro CV temporelle : {recherche.best_score_:.3f}")

    # Calibration des probabilités (validation croisée temporelle). Si une classe
    # rare est absente d'un pli, la calibration est impossible : on le dit, sans mentir.
    try:
        rf_calibre = CalibratedClassifierCV(rf, method='sigmoid', cv=TimeSeriesSplit(n_splits=3))
        rf_calibre.fit(X_train, y_train)
        calibration = 'sigmoid + TimeSeriesSplit(3)'
    except Exception as e:  # noqa: BLE001
        print(f"[ATTENTION] Calibration impossible ({e}) : modèle non calibré réutilisé.")
        rf_calibre, calibration = rf, 'indisponible (classes rares)'

    resultats = {
        'protocole': {
            'features': FEATURES_RF, 'cible': "classe de risque du jour J+1 (cumul 72 h)",
            'seuils_72h_mm': list(SEUILS_RISQUE_72H),
            'train': f"2010-{ANNEE_FIN_TRAIN}", 'test': '2022-2024',
            'effectifs_train': {NOMS[k]: int(v) for k, v in y_train.value_counts().sort_index().items()},
            'effectifs_test': {NOMS[k]: int(v) for k, v in y_test.value_counts().sort_index().items()},
            'hyperparametres': recherche.best_params_, 'f1_macro_cv_temporelle': float(recherche.best_score_),
            'calibration': calibration,
        },
        'baseline_persistance': metriques(y_test, baseline_persistance(X_test)),
        'baseline_toujours_vert': metriques(y_test, np.zeros(len(y_test), dtype=int)),
        'random_forest': metriques(y_test, rf.predict(X_test)),
        'random_forest_calibre': metriques(y_test, rf_calibre.predict(X_test)),
    }

    with open(os.path.join(data_dir, 'modele_rf.pkl'), 'wb') as f:
        pickle.dump(rf, f)
    with open(os.path.join(data_dir, 'modele_rf_calibre.pkl'), 'wb') as f:
        pickle.dump(rf_calibre, f)
    # Jeu de test conservé pour le rapport de fiabilité (ModelReliabilityService)
    with open(os.path.join(data_dir, 'X_test.pkl'), 'wb') as f:
        pickle.dump(X_test, f)
    with open(os.path.join(data_dir, 'y_test.pkl'), 'wb') as f:
        pickle.dump(y_test, f)
    with open(os.path.join(data_dir, 'metriques_rf.json'), 'w', encoding='utf-8') as f:
        json.dump(resultats, f, indent=2, ensure_ascii=False)

    print("\n=== Test 2022-2024 ===")
    for nom in ('baseline_toujours_vert', 'baseline_persistance', 'random_forest', 'random_forest_calibre'):
        m = resultats[nom]
        print(f"{nom:24s} acc={m['accuracy']:.3f}  P_macro={m['precision_macro']:.3f}  "
              f"R_macro={m['recall_macro']:.3f}  F1_macro={m['f1_macro']:.3f}")
    print("\nRapport Random Forest :")
    print(classification_report(y_test, rf.predict(X_test), labels=CLASSES, target_names=NOMS, zero_division=0))
    print("Matrice de confusion RF (lignes=réel, colonnes=prédit) :\n",
          confusion_matrix(y_test, rf.predict(X_test), labels=CLASSES))
    return resultats


if __name__ == "__main__":
    entrainer_rf()
