"""Tests du service de prédiction (ia/service_prediction.py) : classification du risque,
filtrage des anomalies, historique de 24 jours, prévisions météo. Aucun appel réseau,
aucun modèle chargé depuis le disque : le service est construit à la main avec des doubles."""
import os
import sys
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import numpy as np
import pytest

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from ia.service_prediction import PredictionService  # noqa: E402


class DetecteurFactice:
    """Détecteur d'anomalies : exclut les mesures dont le capteur est dans `exclus`."""

    def __init__(self, exclus=()):
        self.exclus = set(exclus)

    def filtrer_mesures(self, mesures):
        valides = [m for m in mesures if m.get('capteur_id') not in self.exclus]
        anomalies = [{'capteur_id': m['capteur_id'], 'raison': 'test'} for m in mesures if m.get('capteur_id') in self.exclus]
        return valides, anomalies


class ModeleRFFactice:
    """Forêt aléatoire factice : prédit toujours la même classe avec une probabilité fixe."""

    def __init__(self, classe=0, proba=0.9):
        self.classe, self.proba = classe, proba

    def predict(self, features):
        return np.array([self.classe])

    def predict_proba(self, features):
        p = np.full((1, 4), (1 - self.proba) / 3)
        p[0, self.classe] = self.proba
        return p


@pytest.fixture
def service(monkeypatch):
    s = PredictionService.__new__(PredictionService)
    s.lstm_model, s.rf_model, s.scaler = None, None, None
    s.detecteur = DetecteurFactice()
    s.risque_labels = {0: "vert", 1: "jaune", 2: "orange", 3: "rouge"}
    # pas de base de données ni de réseau
    monkeypatch.setattr(PredictionService, 'recuperer_historique_24j', lambda self, zone_id: None)
    monkeypatch.setattr(PredictionService, '_previsions_pluie', staticmethod(lambda pluie: (0.0, 0.0, 0.0)))
    return s


def mesure(niveau, pluie=0.0, capteur=1):
    return {'capteur_id': capteur, 'niveau_eau_cm': niveau, 'pluie_mm': pluie}


# ---------- règle de repli sur le niveau d'eau ----------
@pytest.mark.parametrize('niveau, attendu', [(10, 0), (30, 0), (31, 1), (50, 1), (51, 2), (80, 2), (81, 3)])
def test_risque_selon_niveau_eau(niveau, attendu):
    assert PredictionService._risque_selon_niveau_eau(niveau) == attendu


@pytest.mark.parametrize('niveau, risque', [(10, 'vert'), (35, 'jaune'), (60, 'orange'), (90, 'rouge')])
def test_sans_modele_le_niveau_deau_decide(service, niveau, risque):
    r = service.analyser_risque(1, [mesure(niveau)])
    assert r['risque_global'] == risque
    assert r['confiance'] == 80.0
    assert r['source_predictions'] == 'empirique'


def test_sans_mesure_renvoie_une_erreur(service):
    assert service.analyser_risque(1, []) == {'erreur': 'Aucune mesure fournie'}


# ---------- avec le modèle de classification ----------
def test_la_prevision_du_modele_peut_relever_le_niveau(service):
    service.rf_model = ModeleRFFactice(classe=2, proba=0.8)
    r = service.analyser_risque(1, [mesure(niveau=5, pluie=1.0)])
    assert r['risque_global'] == 'orange'
    assert r['confiance'] == 80.0


def test_la_situation_immediate_l_emporte_sur_une_prevision_plus_basse(service):
    service.rf_model = ModeleRFFactice(classe=0, proba=0.95)
    r = service.analyser_risque(1, [mesure(niveau=60, pluie=0.0)])
    assert r['risque_global'] == 'orange'


def test_un_cumul_de_pluie_eleve_donne_au_moins_le_niveau_observe(service):
    service.rf_model = ModeleRFFactice(classe=0)
    # 80 mm en une journée : cumul 72 h >= 75 mm, classe « rouge » observée
    r = service.analyser_risque(1, [mesure(niveau=0, pluie=80.0)])
    assert r['risque_global'] == 'rouge'


def test_sans_historique_la_qualite_des_donnees_est_degradee(service):
    service.rf_model = ModeleRFFactice()
    assert service.analyser_risque(1, [mesure(10)])['qualite_donnees'] == 'DEGRADEE'


def test_avec_historique_la_qualite_reste_bonne(service, monkeypatch):
    service.rf_model = ModeleRFFactice()
    historique = [{'pluie_mm': 0.0, 'niveau_eau_cm': 0.0}] * 24
    monkeypatch.setattr(PredictionService, 'recuperer_historique_24j', lambda self, zone_id: historique)
    assert service.analyser_risque(1, [mesure(10)])['qualite_donnees'] == 'BONNE'


# ---------- anomalies et fiabilité ----------
def test_les_capteurs_exclus_sont_listes(service):
    service.detecteur = DetecteurFactice(exclus={2})
    r = service.analyser_risque(1, [mesure(10, capteur=1), mesure(500, capteur=2), mesure(12, capteur=3)])
    assert r['capteurs_exclus'] == [2]
    assert r['nb_capteurs_total'] == 3 and r['nb_capteurs_valides'] == 2
    assert 'alerte_fiabilite' not in r


def test_trop_de_mesures_ecartees_declenche_une_alerte_de_fiabilite(service):
    service.detecteur = DetecteurFactice(exclus={1, 2, 3})
    r = service.analyser_risque(1, [mesure(10, capteur=1), mesure(10, capteur=2), mesure(10, capteur=3), mesure(10, capteur=4)])
    assert r['alerte_fiabilite'] is True
    assert r['qualite_donnees'] == 'DEGRADEE'


def test_si_tout_est_exclu_le_calcul_continue_avec_les_mesures_recues(service):
    service.detecteur = DetecteurFactice(exclus={1})
    r = service.analyser_risque(1, [mesure(95, capteur=1)])
    assert r['nb_capteurs_valides'] == 0
    assert r['risque_global'] == 'rouge'


# ---------- prévisions de pluie ----------
def test_previsions_open_meteo(monkeypatch):
    import apis.service_meteo as meteo
    monkeypatch.setattr(meteo, 'get_previsions_open_meteo', lambda: {'hourly': {'precipitation': [1.0] * 72}})
    assert PredictionService._previsions_pluie(0.0) == (12.0, 24.0, 72.0)


def test_previsions_repli_si_open_meteo_est_indisponible(monkeypatch, caplog):
    import apis.service_meteo as meteo

    def echec():
        raise RuntimeError('réseau coupé')

    monkeypatch.setattr(meteo, 'get_previsions_open_meteo', echec)
    with caplog.at_level('WARNING', logger='mbeund_mi_prediction'):
        assert PredictionService._previsions_pluie(10.0) == (5.0, 10.0, 15.0)
    assert 'réseau coupé' in caplog.text  # l'erreur n'est plus avalée en silence


# ---------- historique de 24 jours ----------
def test_historique_depuis_jours_moyenne_et_complete_les_trous():
    debut = datetime(2026, 9, 1, tzinfo=timezone.utc)
    par_jour = {
        (debut + timedelta(days=0)).date(): {'pluie_mm': [10.0, 20.0], 'niveau_eau_cm': [40.0]},
        (debut + timedelta(days=23)).date(): {'pluie_mm': [], 'niveau_eau_cm': [5.0, 15.0]},
    }
    h = PredictionService._historique_depuis_jours(debut, par_jour)
    assert len(h) == 24
    assert h[0] == {'pluie_mm': 15.0, 'niveau_eau_cm': 40.0}
    assert h[23] == {'pluie_mm': 0.0, 'niveau_eau_cm': 10.0}
    assert h[5] == {'pluie_mm': 0.0, 'niveau_eau_cm': 0.0}


def test_valeurs_par_jour_separe_pluie_et_niveau():
    jour = datetime(2026, 9, 2, 10, 0, tzinfo=timezone.utc)
    mesures = [
        SimpleNamespace(timestamp=jour, valeur=12.0, capteur=SimpleNamespace(type='pluviometre')),
        SimpleNamespace(timestamp=jour, valeur=33.0, capteur=SimpleNamespace(type='eau')),
        SimpleNamespace(timestamp=jour, valeur=99.0, capteur=SimpleNamespace(type='autre')),
    ]
    assert PredictionService._valeurs_par_jour(mesures) == {jour.date(): {'pluie_mm': [12.0], 'niveau_eau_cm': [33.0]}}


# ---------- LSTM ----------
def test_lstm_exige_modele_scaler_et_24_jours(service):
    assert service.predire_niveau_eau_lstm([{'pluie_mm': 0.0, 'niveau_eau_cm': 0.0}] * 24) is None  # modèle absent
    service.lstm_model, service.scaler = object(), object()
    assert service.predire_niveau_eau_lstm([{'pluie_mm': 0.0, 'niveau_eau_cm': 0.0}] * 23) is None  # fenêtre incomplète


class LstmFactice:
    """Modèle factice : mémorise l'entrée reçue et renvoie un niveau fixe."""

    def __init__(self, niveau=42.0):
        self.niveau, self.entree = niveau, None

    def predict(self, entree, verbose=0):
        self.entree = entree
        return np.array([[self.niveau]])


class ScalerIdentite:
    def transform(self, df):
        return df.to_numpy(dtype=float)


def historique(pluie=2.0, niveau=10.0):
    return [{'pluie_mm': pluie + i, 'niveau_eau_cm': niveau} for i in range(24)]


def test_lstm_recoit_cinq_variables_dont_la_pluie_prevue(service):
    service.lstm_model, service.scaler = LstmFactice(), ScalerIdentite()
    assert service.predire_niveau_eau_lstm(historique(), pluie_prevue_j1=17.0) == 42.0
    entree = service.lstm_model.entree
    assert entree.shape == (1, 24, 5)
    # dernière ligne : pluie du dernier jour, cumuls 24 h et 72 h, niveau, pluie prévue
    assert entree[0, -1].tolist() == [25.0, 25.0, 23.0 + 24.0 + 25.0, 10.0, 17.0]
    # chaque jour voit la pluie du lendemain réel dans la dernière colonne
    assert entree[0, 0, 4] == 3.0


def test_lstm_sans_prevision_suppose_la_pluie_de_la_veille(service):
    service.lstm_model, service.scaler = LstmFactice(), ScalerIdentite()
    service.predire_niveau_eau_lstm(historique())
    assert service.lstm_model.entree[0, -1, 4] == 25.0


def test_lstm_ne_renvoie_jamais_un_niveau_negatif(service):
    service.lstm_model, service.scaler = LstmFactice(niveau=-8.0), ScalerIdentite()
    assert service.predire_niveau_eau_lstm(historique()) == 0.0


def test_analyse_du_risque_utilise_le_lstm_avec_la_pluie_prevue(service, monkeypatch):
    service.lstm_model, service.scaler = LstmFactice(niveau=61.0), ScalerIdentite()
    monkeypatch.setattr(PredictionService, 'recuperer_historique_24j', lambda self, zone_id: historique())
    monkeypatch.setattr(PredictionService, '_previsions_pluie', staticmethod(lambda pluie: (3.0, 12.0, 30.0)))
    r = service.analyser_risque(1, [mesure(niveau=10, pluie=2.0)])
    assert r['source_predictions'] == 'LSTM'
    assert r['predictions']['24h']['niveau_cm'] == 61.0
    assert service.lstm_model.entree[0, -1, 4] == 12.0  # pluie prévue sur 24 h


def test_niveaux_projetes_sans_lstm_sont_empiriques(service):
    n12, n24, n72, source = service._niveaux_projetes(1, 20.0, (10.0, 20.0, 30.0), None)
    assert (n12, n24, n72, source) == (24.0, 30.0, 32.0, 'empirique')
