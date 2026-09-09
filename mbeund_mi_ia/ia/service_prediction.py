import numpy as np
import pandas as pd
import pickle
import os
from datetime import datetime
from .recommandations import generer_recommandation
from .detecteur_anomalies import DetecteurAnomalies
import logging

logger_pred = logging.getLogger('mbeund_mi_prediction')

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
        self.detecteur = DetecteurAnomalies()
        
        self.risque_labels = {0: "vert", 1: "jaune", 2: "orange", 3: "rouge"}
        self._charger_modeles()

    def _charger_modeles(self):
        """Charge les modèles s'ils existent dans data/"""
        lstm_path = os.path.join(self.data_dir, 'modele_lstm.h5')
        rf_calibre_path = os.path.join(self.data_dir, 'modele_rf_calibre.pkl')
        rf_path = os.path.join(self.data_dir, 'modele_rf.pkl')
        scaler_path = os.path.join(self.data_dir, 'scaler.pkl')

        if TF_AVAILABLE and os.path.exists(lstm_path):
            self.lstm_model = tf.keras.models.load_model(lstm_path, compile=False)
            
        if os.path.exists(rf_calibre_path):
            with open(rf_calibre_path, 'rb') as f:
                self.rf_model = pickle.load(f)  # nosec B301
        elif os.path.exists(rf_path):
            with open(rf_path, 'rb') as f:
                self.rf_model = pickle.load(f)  # nosec B301
                
        if os.path.exists(scaler_path):
            with open(scaler_path, 'rb') as f:
                self.scaler = pickle.load(f)  # nosec B301

    def analyser_risque(self, zone_id, mesures_recentes):
        """
        Analyse le risque à partir des dernières mesures.
        mesures_recentes = [{"capteur_id": 1, "pluie_mm": 15.2, "niveau_eau_cm": 45.0}, ...]
        """
        if not mesures_recentes:
            return {"erreur": "Aucune mesure fournie"}

        # 1. Filtrage des anomalies
        mesures_valides, anomalies = self.detecteur.filtrer_mesures(mesures_recentes)
        
        capteurs_exclus = [ano['capteur_id'] for ano in anomalies]
        nb_total = len(mesures_recentes)
        nb_valides = len(mesures_valides)
        
        for ano in anomalies:
            logger_pred.warning(f"ANOMALIE détectée capteur {ano['capteur_id']}: valeur exclue du calcul ({ano['raison']})")

        alerte_fiabilite = False
        message_fiabilite = ""
        qualite_donnees = "BONNE"
        
        if nb_valides < (nb_total / 2):
            alerte_fiabilite = True
            message_fiabilite = "Données insuffisantes - résultat peu fiable"
            qualite_donnees = "DEGRADEE"
            
        # Si tout est exclu, on garde au moins la dernière pour éviter un crash (fallback extrême)
        if not mesures_valides:
            mesures_valides = mesures_recentes

        derniere_mesure = mesures_valides[-1]
        niveau_actuel = float(derniere_mesure.get('niveau_eau_cm', 0))
        pluie = float(derniere_mesure.get('pluie_mm', 0))
        
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
        
        risque_final = self.risque_labels.get(risque_code, "vert")
        reco = generer_recommandation(zone_id, risque_final, round(niveau_actuel, 1), 12)
        
        return {
            "zone_id": zone_id,
            "timestamp": datetime.now().isoformat(),
            "niveau_actuel_cm": round(niveau_actuel, 1),
            "predictions": {
                "12h": {"niveau_cm": round(niveau_pred_12h, 1)},
                "24h": {"niveau_cm": round(niveau_pred_24h, 1)},
                "72h": {"niveau_cm": round(niveau_pred_72h, 1)}
            },
            "risque_global": risque_final,
            "confiance": round(confiance, 1),
            "recommandation_fr": reco['fr'],
            "recommandation_wo": reco['wo'],
            "qualite_donnees": qualite_donnees,
            "nb_capteurs_total": nb_total,
            "nb_capteurs_valides": nb_valides,
            "capteurs_exclus": capteurs_exclus
        }
        
        if alerte_fiabilite:
            resultat["alerte_fiabilite"] = True
            resultat["message_fiabilite"] = message_fiabilite
            
        return resultat

if __name__ == "__main__":
    service = PredictionService()
    mesures = [{"pluie_mm": 65.0, "niveau_eau_cm": 85.0}]
    resultat = service.analyser_risque(1, mesures)
    import json
    print(json.dumps(resultat, indent=2, ensure_ascii=False))
