import numpy as np
from sklearn.ensemble import IsolationForest
import pickle
import os
import logging
from datetime import datetime

# Configuration du logger pour les anomalies
logger_ano = logging.getLogger('mbeund_mi_anomalies')
logger_ano.setLevel(logging.INFO)
fh = logging.FileHandler('anomalies.log', encoding='utf-8')
fh.setFormatter(logging.Formatter('%(asctime)s - [ANOMALIE] %(message)s'))
logger_ano.addHandler(fh)

class DetecteurAnomalies:
    def __init__(self):
        base_dir = os.path.dirname(os.path.dirname(__file__))
        self.data_dir = os.path.join(base_dir, 'data')
        self.model_path = os.path.join(self.data_dir, 'modele_anomalies.pkl')
        self.model = None
        self._charger_ou_entrainer()

    def _charger_ou_entrainer(self):
        if os.path.exists(self.model_path):
            with open(self.model_path, 'rb') as f:
                self.model = pickle.load(f)  # nosec B301
        else:
            self._entrainer_modele_synthetique()

    def _entrainer_modele_synthetique(self):
        """Entraîne un modèle sur des données synthétiques normales si pas de données réelles."""
        print("Entraînement de l'IsolationForest sur données normales...")
        np.random.seed(42)
        # Features : [valeur_cm, variation_1h, variation_3h, heure_journee, mois]
        valeur_cm = np.random.uniform(0, 100, 1000)
        variation_1h = np.random.normal(0, 5, 1000)
        variation_3h = np.random.normal(0, 15, 1000)
        heure_journee = np.random.randint(0, 24, 1000)
        mois = np.random.randint(1, 13, 1000)
        
        X = np.column_stack((valeur_cm, variation_1h, variation_3h, heure_journee, mois))
        
        self.model = IsolationForest(contamination=0.05, random_state=42)
        self.model.fit(X)
        
        os.makedirs(self.data_dir, exist_ok=True)
        with open(self.model_path, 'wb') as f:
            pickle.dump(self.model, f)

    def analyser_mesure(self, mesure_dict, variation_15m=0, variation_1h=0, variation_3h=0):
        valeur = float(mesure_dict.get('niveau_eau_cm', 0))
        pluie = float(mesure_dict.get('pluie_mm', 0))
        capteur_id = mesure_dict.get('capteur_id', 0)
        
        ts_str = mesure_dict.get('timestamp', datetime.now().isoformat())
        try:
            dt = datetime.fromisoformat(ts_str)
        except ValueError:
            dt = datetime.now()
            
        # Règles métier hard-codées
        if valeur < 0:
            return {'est_anomalie': True, 'score': -1, 'capteur_id': capteur_id, 'raison': 'Valeur négative impossible', 'action': 'EXCLURE_DU_CALCUL'}
        if valeur > 500:
            return {'est_anomalie': True, 'score': -1, 'capteur_id': capteur_id, 'raison': 'Valeur > 500cm impossible', 'action': 'EXCLURE_DU_CALCUL'}
        if pluie > 200:
            return {'est_anomalie': True, 'score': -1, 'capteur_id': capteur_id, 'raison': 'Pluie > 200 mm/h impossible', 'action': 'EXCLURE_DU_CALCUL'}
        if variation_15m > 50:
            return {'est_anomalie': True, 'score': -1, 'capteur_id': capteur_id, 'raison': 'Variation > 50cm en 15m', 'action': 'EXCLURE_DU_CALCUL'}
            
        # Modèle IsolationForest
        X = np.array([[valeur, variation_1h, variation_3h, dt.hour, dt.month]])
        pred = self.model.predict(X)[0] # 1 = normal, -1 = anomalie
        score = self.model.score_samples(X)[0]
        
        if pred == -1:
            return {'est_anomalie': True, 'score': float(score), 'capteur_id': capteur_id, 'raison': 'Écart anormal vs historique', 'action': 'EXCLURE_DU_CALCUL'}
            
        return {'est_anomalie': False, 'score': float(score), 'capteur_id': capteur_id, 'raison': 'Normale', 'action': 'INCLURE'}

    def filtrer_mesures(self, liste_mesures):
        mesures_valides = []
        anomalies = []
        
        for i, mesure in enumerate(liste_mesures):
            var_15m = 0
            if i > 0:
                var_15m = abs(float(mesure.get('niveau_eau_cm', 0)) - float(liste_mesures[i-1].get('niveau_eau_cm', 0)))
                
            resultat = self.analyser_mesure(mesure, variation_15m=var_15m)
            
            if resultat['est_anomalie']:
                anomalies.append(resultat)
                logger_ano.warning(f"Capteur {resultat['capteur_id']} : {resultat['raison']} (Score: {resultat['score']:.2f})")
            else:
                mesures_valides.append(mesure)
                
        return mesures_valides, anomalies
