import requests
import pandas as pd
import os
from datetime import datetime

# Coordonnées de Thiaroye Sur Mer
LAT = 14.742
LNG = -17.406

def telecharger_donnees_historiques(date_debut="2010-01-01", date_fin="2024-12-31"):
    """
    Télécharge l'historique des pluies quotidiennes depuis l'API Open-Meteo (Plan B).
    """
    print(f"Téléchargement des données historiques Open-Meteo de {date_debut} à {date_fin}...")
    url = "https://archive-api.open-meteo.com/v1/archive"
    
    params = {
        "latitude": LAT,
        "longitude": LNG,
        "start_date": date_debut,
        "end_date": date_fin,
        "daily": "precipitation_sum",
        "timezone": "Africa/Dakar"
    }
    
    response = requests.get(url, params=params)
    if response.status_code == 200:
        data = response.json()
        
        # Extraction des séries temporelles
        dates = data['daily']['time']
        pluies = data['daily']['precipitation_sum']
        
        # Création du DataFrame
        df = pd.DataFrame({
            "date": dates,
            "pluie_mm": pluies
        })
        
        # Nettoyage des valeurs nulles (on suppose 0 mm s'il n'y a pas de donnée)
        df['pluie_mm'] = df['pluie_mm'].fillna(0.0)
        
        # Sauvegarde
        base_dir = os.path.dirname(os.path.dirname(__file__))
        out_dir = os.path.join(base_dir, 'data')
        os.makedirs(out_dir, exist_ok=True)
        
        out_file = os.path.join(out_dir, 'pluies_dakar_2010_2024_openmeteo.csv')
        df.to_csv(out_file, index=False)
        print(f"[SUCCES] Téléchargement terminé : {len(df)} jours de données récupérés !")
        print(f"Fichier sauvegardé dans : {out_file}")
        
        # Affichage d'un aperçu des jours de forte pluie
        fortes_pluies = df[df['pluie_mm'] > 50.0]
        print("\nAperçu des inondations potentielles passées (> 50mm/j) :")
        print(fortes_pluies.sort_values(by='pluie_mm', ascending=False).head(5))
        
        return out_file
    else:
        print(f"[ERREUR] Erreur API : {response.status_code}")
        print(response.text)
        return None

if __name__ == "__main__":
    telecharger_donnees_historiques()
