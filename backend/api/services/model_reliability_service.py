import os
import pickle
import numpy as np
from sklearn.calibration import calibration_curve
from sklearn.metrics import log_loss, accuracy_score, confusion_matrix, classification_report
import logging

logger = logging.getLogger('mbeund_mi_reliability')


class ModelReliabilityService:
    """Service pour exposer les métriques de fiabilité du modèle Random Forest."""

    def __init__(self):
        """Charge les modèles et données de test."""
        from django.conf import settings
        base_path = os.path.dirname(settings.BASE_DIR)
        self.data_dir = os.path.join(base_path, 'mbeund_mi_ia', 'data')

        self.X_test = None
        self.y_test = None
        self.rf_model = None
        self.rf_calibre = None
        self.risk_labels = {0: "vert", 1: "jaune", 2: "orange", 3: "rouge"}

        self._charger_donnees()

    def _charger_donnees(self):
        """Charge les modèles et données de test."""
        try:
            # Charger données de test
            with open(os.path.join(self.data_dir, 'X_test.pkl'), 'rb') as f:
                self.X_test = pickle.load(f)  # nosec B301
            with open(os.path.join(self.data_dir, 'y_test.pkl'), 'rb') as f:
                self.y_test = pickle.load(f)  # nosec B301

            # Charger modèles
            with open(os.path.join(self.data_dir, 'modele_rf.pkl'), 'rb') as f:
                self.rf_model = pickle.load(f)  # nosec B301
            with open(os.path.join(self.data_dir, 'modele_rf_calibre.pkl'), 'rb') as f:
                self.rf_calibre = pickle.load(f)  # nosec B301

            logger.info("Modèles et données de test chargés avec succès")
        except FileNotFoundError as e:
            logger.error(f"Erreur chargement modèles: {e}")
            raise

    def generer_rapport(self):
        """Génère le rapport complet de fiabilité du modèle."""
        if not (self.X_test is not None and self.y_test is not None):
            return {"erreur": "Données de test non disponibles"}

        # Prédictions
        prob_rf = self.rf_model.predict_proba(self.X_test)
        prob_calibre = self.rf_calibre.predict_proba(self.X_test)

        pred_rf = self.rf_model.predict(self.X_test)
        pred_calibre = self.rf_calibre.predict(self.X_test)

        # Métriques
        y_true_onehot = np.eye(4)[self.y_test.to_numpy(dtype=int)]
        brier_rf = float(np.mean(np.sum((y_true_onehot - prob_rf) ** 2, axis=1)))
        brier_calibre = float(np.mean(np.sum((y_true_onehot - prob_calibre) ** 2, axis=1)))

        ll_rf = float(log_loss(self.y_test, prob_rf))
        ll_calibre = float(log_loss(self.y_test, prob_calibre))

        acc_rf = float(accuracy_score(self.y_test, pred_rf) * 100)
        acc_calibre = float(accuracy_score(self.y_test, pred_calibre) * 100)

        # Amélioration Brier Score
        brier_improvement = ((brier_rf - brier_calibre) / brier_rf * 100) if brier_rf > 0 else 0

        # Matrice de confusion (modèle calibré)
        cm = confusion_matrix(self.y_test, pred_calibre)
        cm_dict = {
            "vert": {"vert": int(cm[0, 0]), "jaune": int(cm[0, 1]), "orange": int(cm[0, 2]), "rouge": int(cm[0, 3])},
            "jaune": {"vert": int(cm[1, 0]), "jaune": int(cm[1, 1]), "orange": int(cm[1, 2]), "rouge": int(cm[1, 3])},
            "orange": {"vert": int(cm[2, 0]), "jaune": int(cm[2, 1]), "orange": int(cm[2, 2]), "rouge": int(cm[2, 3])},
            "rouge": {"vert": int(cm[3, 0]), "jaune": int(cm[3, 1]), "orange": int(cm[3, 2]), "rouge": int(cm[3, 3])},
        }

        # Courbe de calibration (focus sur risque rouge = classe 3)
        y_true_3 = (self.y_test == 3).astype(int)
        prob_rf_3 = prob_rf[:, 3]
        prob_calibre_3 = prob_calibre[:, 3]

        prob_true_rf, prob_pred_rf = calibration_curve(y_true_3, prob_rf_3, n_bins=10)
        prob_true_cal, prob_pred_cal = calibration_curve(y_true_3, prob_calibre_3, n_bins=10)

        calibration_data = {
            "avant_calibration": {
                "prob_pred": [float(x) for x in prob_pred_rf],
                "prob_true": [float(x) for x in prob_true_rf],
            },
            "apres_calibration": {
                "prob_pred": [float(x) for x in prob_pred_cal],
                "prob_true": [float(x) for x in prob_true_cal],
            },
        }

        return {
            "metriques": {
                "brier_score_avant": round(brier_rf, 4),
                "brier_score_apres": round(brier_calibre, 4),
                "brier_improvement_percent": round(brier_improvement, 1),
                "log_loss_avant": round(ll_rf, 4),
                "log_loss_apres": round(ll_calibre, 4),
                "accuracy_avant_percent": round(acc_rf, 1),
                "accuracy_apres_percent": round(acc_calibre, 1),
            },
            "matrice_confusion": cm_dict,
            "calibration_curve": calibration_data,
            "nombre_echantillons_test": int(len(self.y_test)),
        }
