import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json

def generer_donnees_pluie_anams(start_date="2026-04-01", nb_jours=214):
    """
    Génère des données pluviométriques réalistes basées sur les patterns ANAMS de Dakar.
    Saison sèche : nov-mai
    Hivernage : juin-octobre
    """
    start = datetime.strptime(start_date, "%Y-%m-%d")
    dates = [start + timedelta(days=i) for i in range(nb_jours)]
    
    records = []
    
    for date in dates:
        mois = date.month
        
        # Probabilité de pluie selon le mois (pattern Dakar)
        if mois in [11, 12, 1, 2, 3, 4, 5]: # Saison sèche
            prob = 0.02
            pluie_max = 5.0
        elif mois in [6, 10]: # Début/Fin hivernage
            prob = 0.15
            pluie_max = 20.0
        else: # Plein hivernage (7, 8, 9)
            prob = 0.40
            pluie_max = 80.0
            
        if np.random.random() < prob:
            # Événement pluvieux
            # Distribution exponentielle pour avoir plus de petites pluies et peu de grandes
            pluie = np.random.exponential(scale=pluie_max/4)
            pluie = min(pluie, pluie_max) # plafonner
        else:
            pluie = 0.0
            
        records.append({
            "date": date.strftime("%Y-%m-%d"),
            "pluie_mm": round(pluie, 1)
        })
        
    df = pd.DataFrame(records)
    
    # Export CSV et JSON dans le dossier parent "data/" s'il existe, sinon en local
    import os
    out_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(out_dir, exist_ok=True)
    
    csv_path = os.path.join(out_dir, "pluies_simulees_anams.csv")
    json_path = os.path.join(out_dir, "pluies_simulees_anams.json")
    
    df.to_csv(csv_path, index=False)
    df.to_json(json_path, orient="records", indent=4)
    print(f"Données pluviométriques simulées générées : {csv_path}")
    
    return df

if __name__ == "__main__":
    generer_donnees_pluie_anams()
