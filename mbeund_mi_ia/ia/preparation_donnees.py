import pandas as pd
import numpy as np
import pickle
from sklearn.preprocessing import MinMaxScaler
import os

def preparer_donnees():
    print("Démarrage de la préparation des données...")
    base_dir = os.path.dirname(os.path.dirname(__file__))
    data_dir = os.path.join(base_dir, 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    pluies_path = os.path.join(data_dir, 'pluies_dakar_2010_2024_openmeteo.csv')
    
    # On charge les vraies données Open-Meteo (Plan B)
    df_pluies = pd.read_csv(pluies_path)
    df_pluies['date'] = pd.to_datetime(df_pluies['date'])
    
    # Création de features basiques pour l'entraînement
    df_pluies['pluie_cumul_24h'] = df_pluies['pluie_mm'].rolling(window=1, min_periods=1).sum()
    df_pluies['pluie_cumul_72h'] = df_pluies['pluie_mm'].rolling(window=3, min_periods=1).sum()
    
    # Simuler un niveau d'eau corrélé à la pluie pour l'apprentissage
    df_pluies['niveau_eau_cm'] = df_pluies['pluie_cumul_72h'] * 1.5 + np.random.normal(0, 5, len(df_pluies))
    df_pluies['niveau_eau_cm'] = df_pluies['niveau_eau_cm'].clip(lower=0)
    
    # Features pour LSTM
    features = ['pluie_mm', 'pluie_cumul_24h', 'pluie_cumul_72h', 'niveau_eau_cm']
    
    scaler = MinMaxScaler()
    df_scaled = scaler.fit_transform(df_pluies[features])
    
    window_size = 24
    X, y = [], []
    
    # On doit avoir suffisamment de données pour la fenêtre (ici 24 jours pour la démo)
    for i in range(len(df_scaled) - window_size):
        X.append(df_scaled[i:(i + window_size)])
        y.append(df_pluies['niveau_eau_cm'].iloc[i + window_size])
        
    X = np.array(X)
    y = np.array(y)
    
    # Sauvegarde
    np.save(os.path.join(data_dir, 'X_train.npy'), X)
    np.save(os.path.join(data_dir, 'y_train.npy'), y)
    
    with open(os.path.join(data_dir, 'scaler.pkl'), 'wb') as f:
        pickle.dump(scaler, f)
        
    print(f"Données préparées avec succès !")
    print(f"Shape X (séquences) : {X.shape}")
    print(f"Shape y (cibles) : {y.shape}")
    
if __name__ == "__main__":
    preparer_donnees()
