import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import pickle
import os

def entrainer_rf():
    base_dir = os.path.dirname(os.path.dirname(__file__))
    data_dir = os.path.join(base_dir, 'data')
    
    print("Entraînement du classifieur Random Forest...")
    df = pd.read_csv(os.path.join(data_dir, 'pluies_dakar_2010_2024_openmeteo.csv'))
    
    # Recréation simple des features pour l'entraînement
    df['pluie_cumul_24h'] = df['pluie_mm'].rolling(window=1, min_periods=1).sum()
    df['pluie_cumul_72h'] = df['pluie_mm'].rolling(window=3, min_periods=1).sum()
    df['niveau_eau_cm'] = df['pluie_cumul_72h'] * 1.5 + np.random.normal(0, 5, len(df))
    df['niveau_eau_cm'] = df['niveau_eau_cm'].clip(lower=0)
    
    # Catégorisation du risque
    # 0=vert, 1=jaune, 2=orange, 3=rouge
    conditions = [
        (df['niveau_eau_cm'] < 30),
        (df['niveau_eau_cm'] >= 30) & (df['niveau_eau_cm'] < 60),
        (df['niveau_eau_cm'] >= 60) & (df['niveau_eau_cm'] < 90),
        (df['niveau_eau_cm'] >= 90)
    ]
    choices = [0, 1, 2, 3]
    df['risque'] = np.select(conditions, choices, default=0)
    
    features = ['pluie_mm', 'pluie_cumul_24h', 'pluie_cumul_72h', 'niveau_eau_cm']
    X = df[features].fillna(0)
    y = df['risque']
    
    rf = RandomForestClassifier(n_estimators=50, random_state=42)
    rf.fit(X, y)
    
    # Sauvegarde
    with open(os.path.join(data_dir, 'modele_rf.pkl'), 'wb') as f:
        pickle.dump(rf, f)
        
    accuracy = rf.score(X, y) * 100
    print(f"[SUCCES] Modèle Random Forest entraîné avec une précision de {accuracy:.2f}% et sauvegardé !")

if __name__ == "__main__":
    entrainer_rf()
