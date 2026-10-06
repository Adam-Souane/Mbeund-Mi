import numpy as np
import pandas as pd
import pickle
import os
from datetime import datetime
from .recommandations import generer_recommandation
from .detecteur_anomalies import DetecteurAnomalies
from .features_risque import features_depuis_pluies_recentes, classer_risque
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

    # ------------------------------------------------------------------
    # Historique de 24 jours
    # ------------------------------------------------------------------
    @staticmethod
    def _preparer_django():
        """Rend les modèles Django importables depuis le module IA (hors serveur web)."""
        import sys
        backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend'))
        if backend_dir not in sys.path:
            sys.path.insert(0, backend_dir)

        import django
        if not os.environ.get('DJANGO_SETTINGS_MODULE'):
            os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mbeund_mi_backend.settings.dev')
        try:
            django.setup()
        except Exception as e:
            # Déjà initialisé par le serveur dans la plupart des cas : on le note sans bloquer.
            logger_pred.warning(f"django.setup() ignoré : {e}")

    @staticmethod
    def _valeurs_par_jour(mesures):
        """Regroupe les mesures par jour : {jour: {"pluie_mm": [...], "niveau_eau_cm": [...]}}."""
        par_jour = {}
        for mesure in mesures:
            valeurs = par_jour.setdefault(mesure.timestamp.date(), {"pluie_mm": [], "niveau_eau_cm": []})
            if mesure.capteur.type == 'pluviometre':
                valeurs["pluie_mm"].append(mesure.valeur)
            elif mesure.capteur.type == 'eau':
                valeurs["niveau_eau_cm"].append(mesure.valeur)
        return par_jour

    @staticmethod
    def _historique_depuis_jours(debut, par_jour):
        """Construit la liste de 24 jours (moyennes ; 0.0 si le jour n'a pas de mesure)."""
        from datetime import timedelta
        vide = {"pluie_mm": [], "niveau_eau_cm": []}
        historique = []
        for i in range(24):
            valeurs = par_jour.get(debut.date() + timedelta(days=i), vide)
            historique.append({
                "pluie_mm": float(np.mean(valeurs["pluie_mm"])) if valeurs["pluie_mm"] else 0.0,
                "niveau_eau_cm": float(np.mean(valeurs["niveau_eau_cm"])) if valeurs["niveau_eau_cm"] else 0.0,
            })
        return historique

    def recuperer_historique_24j(self, zone_id):
        """
        Récupère les 24 derniers jours de mesures pour une zone.
        Retourne une liste de 24 dict : [{"pluie_mm": X, "niveau_eau_cm": Y}, ...]
        Retourne None si impossible d'avoir 24 jours complets.
        """
        try:
            self._preparer_django()
            from django.utils import timezone
            from datetime import timedelta
            from capteurs.models import Mesure, Capteur

            capteurs = Capteur.objects.filter(zone_id=zone_id, statut='actif')
            if not capteurs.exists():
                logger_pred.warning(f"Aucun capteur actif pour la zone {zone_id}")
                return None

            # Les 24 derniers jours (minuit à minuit)
            maintenant = timezone.now()
            debut = (maintenant - timedelta(days=24)).replace(hour=0, minute=0, second=0, microsecond=0)
            fin = maintenant.replace(hour=23, minute=59, second=59, microsecond=999999)
            mesures = Mesure.objects.filter(capteur__in=capteurs, timestamp__range=[debut, fin]).order_by('timestamp')
            if not mesures.exists():
                logger_pred.warning(f"Aucune mesure trouvée pour la zone {zone_id} sur les 24 derniers jours")
                return None

            historique_24j = self._historique_depuis_jours(debut, self._valeurs_par_jour(mesures))
            logger_pred.info(f"Historique 24j chargé pour zone {zone_id}: {len(historique_24j)} jours")
            return historique_24j

        except Exception as e:
            logger_pred.error(f"Erreur chargement historique 24j zone {zone_id}: {e}")
            return None

    # ------------------------------------------------------------------
    # Analyse du risque
    # ------------------------------------------------------------------
    @staticmethod
    def _risque_selon_niveau_eau(niveau_cm):
        """Code de risque (0 à 3) déduit du seul niveau d'eau mesuré."""
        if niveau_cm > 80:
            return 3
        if niveau_cm > 50:
            return 2
        if niveau_cm > 30:
            return 1
        return 0

    def _filtrer_mesures(self, mesures_recentes):
        """Écarte les mesures aberrantes. Retourne (mesures retenues, anomalies, nombre de mesures valides, fiable)."""
        mesures_valides, anomalies = self.detecteur.filtrer_mesures(mesures_recentes)
        for ano in anomalies:
            logger_pred.warning(f"ANOMALIE détectée capteur {ano['capteur_id']}: valeur exclue du calcul ({ano['raison']})")
        fiable = len(mesures_valides) >= (len(mesures_recentes) / 2)
        # Si tout est exclu, on garde au moins les mesures reçues pour éviter un crash (repli extrême)
        return (mesures_valides or mesures_recentes), anomalies, len(mesures_valides), fiable

    @staticmethod
    def _previsions_pluie(pluie):
        """Pluie prévue (mm) sur 12 h, 24 h et 72 h : Open-Meteo, sinon extrapolation de la mesure courante."""
        previsions = (pluie * 0.5, pluie * 1.0, pluie * 1.5)
        try:
            from apis.service_meteo import get_previsions_open_meteo
            meteo_hourly = get_previsions_open_meteo()
            if meteo_hourly and 'hourly' in meteo_hourly and 'precipitation' in meteo_hourly['hourly']:
                precips = meteo_hourly['hourly']['precipitation']
                previsions = (float(sum(precips[:12])), float(sum(precips[:24])), float(sum(precips[:72])))
        except Exception as e:
            logger_pred.warning(f"Prévisions Open-Meteo indisponibles, extrapolation de la mesure courante : {e}")
        return previsions

    def _niveaux_projetes(self, zone_id, niveau_actuel, previsions_pluie, historique_24j):
        """Niveaux d'eau projetés à 12 h, 24 h, 72 h et source de la prédiction à 24 h."""
        pluie_12h, pluie_24h, pluie_72h = previsions_pluie
        niveau_24h, source = None, "empirique"
        if self.lstm_model and historique_24j and len(historique_24j) == 24:
            pred_lstm = self.predire_niveau_eau_lstm(historique_24j)
            if pred_lstm is not None:
                niveau_24h, source = round(float(pred_lstm), 1), "LSTM"
                logger_pred.info(f"Prédictions LSTM activées pour zone {zone_id}")
        if niveau_24h is None:
            niveau_24h = round(niveau_actuel + (pluie_24h * 0.5), 1)

        # Horizons 12 h et 72 h : apport pluvieux prévu et ruissellement
        taux_ruissellement = 0.4
        niveau_12h = round(niveau_actuel + (pluie_12h * taux_ruissellement), 1)
        niveau_72h = round(niveau_actuel + (pluie_72h * taux_ruissellement), 1)
        return niveau_12h, niveau_24h, niveau_72h, source

    def _classer_risque(self, zone_id, pluie, niveau_actuel, historique_24j, qualite_donnees):
        """Retourne (code de risque, confiance en %, qualité des données)."""
        if not self.rf_model:
            # Repli manuel si le modèle n'est pas chargé
            return self._risque_selon_niveau_eau(niveau_actuel), 80.0, qualite_donnees

        # Mêmes features que l'entraînement (ia/features_risque.py) : pluie du jour
        # (mesure courante) + pluies des 2 jours précédents issues de l'historique.
        # Sans historique, on ne dispose que de la pluie du jour : cumul 72 h =
        # borne basse, signalée dans la qualité des données.
        if historique_24j and len(historique_24j) >= 2:
            pluies_3j = [historique_24j[-2]["pluie_mm"], historique_24j[-1]["pluie_mm"], pluie]
        else:
            pluies_3j = [pluie]
            if qualite_donnees == "BONNE":
                qualite_donnees = "DEGRADEE"
            logger_pred.warning(f"Historique de pluie indisponible zone {zone_id} : cumuls 24h/72h limités à la mesure courante")
        features = features_depuis_pluies_recentes(pluies_3j)

        # Le modèle prédit la classe de risque du lendemain (J+1)
        risque_prevu = int(self.rf_model.predict(features)[0])
        confiance = float(max(self.rf_model.predict_proba(features)[0]) * 100)

        # Situation hydrologique immédiate : cumul 72 h observé et niveau d'eau actuel
        risque_actuel = max(int(classer_risque(float(sum(pluies_3j)))), self._risque_selon_niveau_eau(niveau_actuel))

        # Vigilance opérationnelle (principe de sécurité civile) : on retient le niveau le plus
        # critique entre la situation immédiate et la prévision à J+1
        return max(risque_actuel, risque_prevu), confiance, qualite_donnees

    def analyser_risque(self, zone_id, mesures_recentes):
        """
        Analyse le risque à partir des dernières mesures.
        mesures_recentes = [{"capteur_id": 1, "pluie_mm": 15.2, "niveau_eau_cm": 45.0}, ...]
        """
        if not mesures_recentes:
            return {"erreur": "Aucune mesure fournie"}

        mesures_valides, anomalies, nb_valides, fiable = self._filtrer_mesures(mesures_recentes)
        qualite_donnees = "BONNE" if fiable else "DEGRADEE"

        derniere_mesure = mesures_valides[-1]
        niveau_actuel = float(derniere_mesure.get('niveau_eau_cm', 0))
        pluie = float(derniere_mesure.get('pluie_mm', 0))

        historique_24j = self.recuperer_historique_24j(zone_id) if zone_id else None
        niveau_12h, niveau_24h, niveau_72h, source_prediction = self._niveaux_projetes(
            zone_id, niveau_actuel, self._previsions_pluie(pluie), historique_24j)
        risque_code, confiance, qualite_donnees = self._classer_risque(zone_id, pluie, niveau_actuel, historique_24j, qualite_donnees)

        risque_final = self.risque_labels.get(risque_code, "vert")
        reco = generer_recommandation(zone_id, risque_final, round(niveau_actuel, 1), 12)

        resultat = {
            "zone_id": zone_id,
            "timestamp": datetime.now().isoformat(),
            "niveau_actuel_cm": round(niveau_actuel, 1),
            "predictions": {
                "12h": {"niveau_cm": round(niveau_12h, 1)},
                "24h": {"niveau_cm": round(niveau_24h, 1)},
                "72h": {"niveau_cm": round(niveau_72h, 1)}
            },
            "source_predictions": source_prediction,  # "LSTM" ou "empirique"
            "risque_global": risque_final,
            "confiance": round(confiance, 1),
            "recommandation_fr": reco['fr'],
            "recommandation_wo": reco['wo'],
            "qualite_donnees": qualite_donnees,
            "nb_capteurs_total": len(mesures_recentes),
            "nb_capteurs_valides": nb_valides,
            "capteurs_exclus": [ano['capteur_id'] for ano in anomalies]
        }

        if not fiable:
            resultat["alerte_fiabilite"] = True
            resultat["message_fiabilite"] = "Données insuffisantes - résultat peu fiable"

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
