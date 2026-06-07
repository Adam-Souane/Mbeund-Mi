import numpy as np
import pandas as pd
import pickle
import os
from datetime import datetime

# Import conditionnel de TensorFlow pour éviter que ça plante si TF n'est pas encore installé
try:
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

class PredictionService:
    def __init__(self):
        base_dir = os.path.dirname(os.path.dirname(__file__))
        self.data_dir = os.path.join(base_dir, 'data')
        
        self.lstm_model = None
        self.rf_model = None
        self.scaler = None
        
        self.risque_labels = {0: "vert", 1: "jaune", 2: "orange", 3: "rouge"}
        self._charger_modeles()

    def _charger_modeles(self):
        """Charge les modèles s'ils existent dans data/"""
        lstm_path = os.path.join(self.data_dir, 'modele_lstm.h5')
        rf_path = os.path.join(self.data_dir, 'modele_rf.pkl')
        scaler_path = os.path.join(self.data_dir, 'scaler.pkl')

        if TF_AVAILABLE and os.path.exists(lstm_path):
            self.lstm_model = tf.keras.models.load_model(lstm_path, compile=False)

            
        if os.path.exists(rf_path):
            with open(rf_path, 'rb') as f:
                self.rf_model = pickle.load(f)
                
        if os.path.exists(scaler_path):
            with open(scaler_path, 'rb') as f:
                self.scaler = pickle.load(f)

    def analyser_risque(self, zone_id, mesures_recentes):
        """
        Analyse le risque à partir des dernières mesures.
        mesures_recentes = [{"pluie_mm": 15.2, "niveau_eau_cm": 45.0}, ...]
        """
        derniere_mesure = mesures_recentes[-1]
        niveau_actuel = float(derniere_mesure['niveau_eau_cm'])
        pluie = float(derniere_mesure['pluie_mm'])
        
        # LSTM predict (simplifié pour l'API)
        # Normalement on passe la fenêtre de 24h au lstm_model
        niveau_pred_12h = niveau_actuel + (pluie * 0.2)
        niveau_pred_24h = niveau_actuel + (pluie * 0.5)
        niveau_pred_72h = niveau_actuel + (pluie * 0.8)
        
        # RF classify
        confiance = 80.0
        risque_code = 0
        
        if self.rf_model:
            # On utilise un DataFrame pandas au lieu de numpy pour éviter le warning rouge
            import pandas as pd
            features = pd.DataFrame([[
                pluie,
                pluie * 12, # cumul 24h estimé
                pluie * 36, # cumul 72h estimé
                niveau_actuel
            ]], columns=['pluie_mm', 'pluie_cumul_24h', 'pluie_cumul_72h', 'niveau_eau_cm'])
            
            risque_code = self.rf_model.predict(features)[0]
            probabilites = self.rf_model.predict_proba(features)[0]
            confiance = float(max(probabilites) * 100)
        else:
            # Fallback manuel si modèle non chargé
            if niveau_actuel > 80: risque_code = 3
            elif niveau_actuel > 50: risque_code = 2
            elif niveau_actuel > 30: risque_code = 1
        
        return {
            "zone_id": zone_id,
            "timestamp": datetime.now().isoformat(),
            "niveau_actuel_cm": round(niveau_actuel, 1),
            "predictions": {
                "12h": {"niveau_cm": round(niveau_pred_12h, 1)},
                "24h": {"niveau_cm": round(niveau_pred_24h, 1)},
                "72h": {"niveau_cm": round(niveau_pred_72h, 1)}
            },
            "risque_global": self.risque_labels.get(risque_code, "vert"),
            "confiance": round(confiance, 1),
            "recommandation": "Évacuation recommandée" if risque_code >= 2 else "Surveillance normale"
        }

if __name__ == "__main__":
    service = PredictionService()
    mesures = [{"pluie_mm": 65.0, "niveau_eau_cm": 85.0}]
    resultat = service.analyser_risque(1, mesures)
    import json
    print(json.dumps(resultat, indent=2, ensure_ascii=False))
