import numpy as np
import pandas as pd
import pickle
import os
from datetime import datetime
from .recommandations import generer_recommandation
from .detecteur_anomalies import DetecteurAnomalies
import logging

logger_pred = logging.getLogger('mbeund_mi_prediction')

# Import conditionnel de TensorFlow : on capture Exception (pas seulement
# ImportError) car un conflit de version protobuf entre paquets fait planter
# l'import avec une VersionError, pas une ImportError. Le modèle LSTM chargé
# ici n'est de toute façon pas encore utilisé dans analyser_risque() (seul
# RandomForest l'est) — pas de perte fonctionnelle si TF est indisponible.
try:
    import tensorflow as tf
    TF_AVAILABLE = True
except Exception as e:
    TF_AVAILABLE = False
    logging.getLogger('mbeund_mi_prediction').warning(f"TensorFlow indisponible ({e}) — modèle LSTM désactivé, RandomForest reste actif.")

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

    def recuperer_historique_24j(self, zone_id):
        """
        Récupère les 24 derniers jours de mesures pour une zone.
        Retourne une liste de 24 dict : [{"pluie_mm": X, "niveau_eau_cm": Y}, ...]
        Retourne None si impossible d'avoir 24 jours complets.
        """
        try:
            from django.utils import timezone
            from django.db.models import F, Q
            from datetime import timedelta
            from capteurs.models import Mesure, Capteur

            # Capteurs de la zone (pluie + eau)
            capteurs = Capteur.objects.filter(zone_id=zone_id, statut='actif')
            if not capteurs.exists():
                logger_pred.warning(f"Aucun capteur actif pour la zone {zone_id}")
                return None

            # Les 24 derniers jours (midnight à midnight)
            maintenant = timezone.now()
            debut = (maintenant - timedelta(days=24)).replace(hour=0, minute=0, second=0, microsecond=0)
            fin = maintenant.replace(hour=23, minute=59, second=59, microsecond=999999)

            # Récupérer mesures pluie et niveau pour chaque jour
            mesures = Mesure.objects.filter(
                capteur__in=capteurs,
                timestamp__range=[debut, fin]
            ).order_by('timestamp')

            if not mesures.exists():
                logger_pred.warning(f"Aucune mesure trouvée pour la zone {zone_id} sur les 24 derniers jours")
                return None

            # Grouper par jour et moyenner pluie/niveau
            historique_par_jour = {}
            for mesure in mesures:
                jour = mesure.timestamp.date()
                if jour not in historique_par_jour:
                    historique_par_jour[jour] = {"pluie_mm": [], "niveau_eau_cm": []}

                if mesure.capteur.type == 'pluviometre':
                    historique_par_jour[jour]["pluie_mm"].append(mesure.valeur)
                elif mesure.capteur.type == 'eau':
                    historique_par_jour[jour]["niveau_eau_cm"].append(mesure.valeur)

            # Construire la liste 24 jours avec moyennes
            historique_24j = []
            for i in range(24):
                jour = (debut.date() + timedelta(days=i))
                if jour in historique_par_jour:
                    pluie_values = historique_par_jour[jour]["pluie_mm"]
                    niveau_values = historique_par_jour[jour]["niveau_eau_cm"]
                    historique_24j.append({
                        "pluie_mm": float(np.mean(pluie_values)) if pluie_values else 0.0,
                        "niveau_eau_cm": float(np.mean(niveau_values)) if niveau_values else 0.0
                    })
                else:
                    # Jour sans données = 0
                    historique_24j.append({"pluie_mm": 0.0, "niveau_eau_cm": 0.0})

            logger_pred.info(f"Historique 24j chargé pour zone {zone_id}: {len(historique_24j)} jours")
            return historique_24j

        except Exception as e:
            logger_pred.error(f"Erreur chargement historique 24j zone {zone_id}: {e}")
            return None

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

        # ESSAYER D'UTILISER LE LSTM AVEC HISTORIQUE 24J
        niveau_pred_12h = None
        niveau_pred_24h = None
        niveau_pred_72h = None
        source_prediction = "empirique"

        if self.lstm_model and zone_id:
            historique_24j = self.recuperer_historique_24j(zone_id)
            if historique_24j and len(historique_24j) == 24:
                # Ajouter la mesure actuelle comme le 25e jour pour extrapoler
                historique_complet = historique_24j + [{"pluie_mm": pluie, "niveau_eau_cm": niveau_actuel}]

                # Appeler LSTM pour les 3 prochains jours
                pred_demain = self.predire_niveau_eau_lstm(historique_24j)
                if pred_demain is not None:
                    niveau_pred_12h = round(pred_demain * 0.5, 1)  # Approx 12h
                    niveau_pred_24h = round(pred_demain, 1)  # Approx 24h
                    niveau_pred_72h = round(pred_demain * 1.5, 1)  # Approx 72h (extrapolation)
                    source_prediction = "LSTM"
                    logger_pred.info(f"Prédictions LSTM activées pour zone {zone_id}")

        # FALLBACK : formule empirique si LSTM non dispo/incomplet
        if niveau_pred_12h is None:
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
        
        resultat = {
            "zone_id": zone_id,
            "timestamp": datetime.now().isoformat(),
            "niveau_actuel_cm": round(niveau_actuel, 1),
            "predictions": {
                "12h": {"niveau_cm": round(niveau_pred_12h, 1)},
                "24h": {"niveau_cm": round(niveau_pred_24h, 1)},
                "72h": {"niveau_cm": round(niveau_pred_72h, 1)}
            },
            "source_predictions": source_prediction,  # "LSTM" ou "empirique"
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

    def predire_niveau_eau_lstm(self, historique_journalier):
        """
        Prédit le niveau d'eau (cm) du jour suivant à partir des 24 derniers
        jours d'historique pluie/niveau — modèle entraîné pour une fenêtre
        glissante de 24 pas de temps journaliers (voir ia/modele_lstm.py et
        ia/preparation_donnees.py).

        historique_journalier : liste ordonnée du plus ancien au plus récent,
        exactement 24 éléments, chacun {"pluie_mm": float, "niveau_eau_cm": float}
        représentant un jour. Retourne None si le modèle ou le scaler ne sont
        pas chargés, ou si l'historique fourni ne contient pas exactement 24 jours
        (pas assez de données pour remplir la fenêtre glissante du modèle).
        """
        if not (self.lstm_model and self.scaler):
            return None
        if len(historique_journalier) != 24:
            return None

        # Reproduit exactement les features de ia/preparation_donnees.py :
        # pluie_cumul_24h = pluie_mm du jour (rolling(1) est un no-op) ;
        # pluie_cumul_72h = somme glissante des 3 derniers jours.
        pluies = [j["pluie_mm"] for j in historique_journalier]
        lignes = []
        for i, jour in enumerate(historique_journalier):
            pluie_cumul_24h = pluies[i]
            fenetre_72h = pluies[max(0, i - 2):i + 1]
            pluie_cumul_72h = sum(fenetre_72h)
            lignes.append([jour["pluie_mm"], pluie_cumul_24h, pluie_cumul_72h, jour["niveau_eau_cm"]])

        # Seules les features d'ENTRÉE (X) sont normalisées à l'entraînement
        # (ia/preparation_donnees.py) ; la cible (y = niveau_eau_cm) est restée
        # en échelle réelle. La sortie du modèle est donc déjà en cm, aucune
        # dénormalisation supplémentaire à appliquer.
        sequence = pd.DataFrame(lignes, columns=['pluie_mm', 'pluie_cumul_24h', 'pluie_cumul_72h', 'niveau_eau_cm'])
        sequence_normalisee = self.scaler.transform(sequence)
        entree = sequence_normalisee.reshape(1, 24, 4)

        niveau_predit = float(self.lstm_model.predict(entree, verbose=0)[0][0])

        return max(0.0, round(niveau_predit, 1))

if __name__ == "__main__":
    service = PredictionService()
    mesures = [{"pluie_mm": 65.0, "niveau_eau_cm": 85.0}]
    resultat = service.analyser_risque(1, mesures)
    import json
    print(json.dumps(resultat, indent=2, ensure_ascii=False))
