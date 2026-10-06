"""Préparation des séquences d'entraînement du LSTM (niveau d'eau du lendemain).

Données : 15 ans de pluie journalière sur Dakar (Open-Meteo, 2010-2024, 5 479 jours).
Faute de mesures historiques de niveau d'eau, le niveau est reconstitué à partir de la pluie
(1,5 × cumul sur 72 h, plus un bruit gaussien d'écart-type 5 cm, graine fixée) : c'est une
cible synthétique, à remplacer par les mesures des capteurs dès qu'elles existent.

Entrée du modèle : une fenêtre de 24 jours de 5 variables
    pluie du jour, cumul 24 h, cumul 72 h, niveau d'eau, pluie du jour suivant.
La dernière variable est la pluie prévue pour le jour à prédire : en entraînement on utilise la
pluie réellement tombée (prévision parfaite) ; en production, la prévision Open-Meteo.
Cible : niveau d'eau (cm) du jour suivant la fenêtre.
Découpage chronologique 70 % / 15 % / 15 % (apprentissage, validation, test), sans mélange.
"""
import os
import pickle

import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler

FEATURES_LSTM = ['pluie_mm', 'pluie_cumul_24h', 'pluie_cumul_72h', 'niveau_eau_cm', 'pluie_jour_suivant_mm']
FENETRE = 24
GRAINE = 42


def construire_dataframe(pluies):
    """DataFrame des 5 variables à partir d'une série de pluie journalière (mm)."""
    df = pd.DataFrame({'pluie_mm': pd.Series(pluies, dtype=float).reset_index(drop=True)})
    df['pluie_cumul_24h'] = df['pluie_mm'].rolling(window=1, min_periods=1).sum()
    df['pluie_cumul_72h'] = df['pluie_mm'].rolling(window=3, min_periods=1).sum()
    bruit = np.random.default_rng(GRAINE).normal(0, 5, len(df))
    df['niveau_eau_cm'] = (df['pluie_cumul_72h'] * 1.5 + bruit).clip(lower=0)
    df['pluie_jour_suivant_mm'] = df['pluie_mm'].shift(-1)
    return df.dropna().reset_index(drop=True)


def construire_sequences(df_scaled, niveaux, fenetre=FENETRE):
    X, y, dernier_niveau = [], [], []
    for i in range(len(df_scaled) - fenetre):
        X.append(df_scaled[i:i + fenetre])
        y.append(niveaux[i + fenetre])
        dernier_niveau.append(niveaux[i + fenetre - 1])
    return np.array(X, dtype=np.float32), np.array(y, dtype=np.float32), np.array(dernier_niveau, dtype=np.float32)


def preparer_donnees():
    base_dir = os.path.dirname(os.path.dirname(__file__))
    data_dir = os.path.join(base_dir, 'data')
    os.makedirs(data_dir, exist_ok=True)

    pluies = pd.read_csv(os.path.join(data_dir, 'pluies_dakar_2010_2024_openmeteo.csv'))['pluie_mm']
    df = construire_dataframe(pluies)

    # Le scaler est ajusté sur la seule partie apprentissage (pas de fuite vers validation/test)
    n_seq = len(df) - FENETRE
    i_train, i_val = int(n_seq * 0.70), int(n_seq * 0.85)
    scaler = MinMaxScaler().fit(df[FEATURES_LSTM].iloc[:i_train + FENETRE])
    X, y, dernier_niveau = construire_sequences(scaler.transform(df[FEATURES_LSTM]), df['niveau_eau_cm'].to_numpy())
    # pluie du jour J+1 (réelle) pour chaque séquence : sert de référence « règle empirique » à l'évaluation
    pluie_j1 = df['pluie_jour_suivant_mm'].to_numpy()[FENETRE - 1:FENETRE - 1 + len(y)].astype(np.float32)

    decoupes = {'train': slice(0, i_train), 'val': slice(i_train, i_val), 'test': slice(i_val, n_seq)}
    for nom, sl in decoupes.items():
        np.save(os.path.join(data_dir, f'X_{nom}.npy'), X[sl])
        np.save(os.path.join(data_dir, f'y_{nom}.npy'), y[sl])
        np.save(os.path.join(data_dir, f'dernier_niveau_{nom}.npy'), dernier_niveau[sl])
        np.save(os.path.join(data_dir, f'pluie_j1_{nom}.npy'), pluie_j1[sl])
    with open(os.path.join(data_dir, 'scaler.pkl'), 'wb') as f:
        pickle.dump(scaler, f)

    print(f"Séquences : {n_seq} (apprentissage {i_train}, validation {i_val - i_train}, test {n_seq - i_val}) ; forme X : {X.shape}")


if __name__ == "__main__":
    preparer_donnees()
