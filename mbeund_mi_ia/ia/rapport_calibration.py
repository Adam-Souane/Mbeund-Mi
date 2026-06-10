import os
import pickle
import numpy as np
import matplotlib.pyplot as plt
from sklearn.calibration import calibration_curve
from sklearn.metrics import log_loss, accuracy_score
import sys

def generer_rapport():
    base_dir = os.path.dirname(os.path.dirname(__file__))
    data_dir = os.path.join(base_dir, 'data')
    
    try:
        with open(os.path.join(data_dir, 'X_test.pkl'), 'rb') as f:
            X_test = pickle.load(f)  # nosec B301
        with open(os.path.join(data_dir, 'y_test.pkl'), 'rb') as f:
            y_test = pickle.load(f)  # nosec B301
            
        with open(os.path.join(data_dir, 'modele_rf.pkl'), 'rb') as f:
            rf = pickle.load(f)  # nosec B301
        with open(os.path.join(data_dir, 'modele_rf_calibre.pkl'), 'rb') as f:
            rf_calibre = pickle.load(f)  # nosec B301
    except FileNotFoundError:
        print("Erreur: Les modèles ou jeux de test n'ont pas été trouvés. Veuillez exécuter random_forest.py d'abord.")
        return
        
    prob_rf = rf.predict_proba(X_test)
    prob_calibre = rf_calibre.predict_proba(X_test)
    
    pred_rf = rf.predict(X_test)
    pred_calibre = rf_calibre.predict(X_test)
    
    # Le Brier Score multiclass classique
    y_true_onehot = np.eye(4)[y_test.to_numpy(dtype=int)]
    brier_rf = np.mean(np.sum((y_true_onehot - prob_rf)**2, axis=1))
    brier_calibre = np.mean(np.sum((y_true_onehot - prob_calibre)**2, axis=1))
    
    ll_rf = log_loss(y_test, prob_rf)
    ll_calibre = log_loss(y_test, prob_calibre)
    
    acc_rf = accuracy_score(y_test, pred_rf) * 100
    acc_calibre = accuracy_score(y_test, pred_calibre) * 100
    
    print("Métrique            | Avant calibration | Après calibration")
    print("-" * 55)
    print(f"Brier Score         | {brier_rf:.4f}            | {brier_calibre:.4f}")
    print(f"Log Loss            | {ll_rf:.4f}            | {ll_calibre:.4f}")
    print(f"Accuracy            | {acc_rf:.1f}%             | {acc_calibre:.1f}%")
    print("-" * 55)
    
    improvement = ((brier_rf - brier_calibre) / brier_rf) * 100 if brier_rf > 0 else 0
    print(f"\nAmélioration Brier Score : -{improvement:.1f}% -> Le modèle calibré est {improvement:.1f}% plus fiable\n")
    
    plt.figure(figsize=(10, 5))
    
    # On se concentre sur le risque le plus critique pour la courbe de fiabilité : Rouge (3)
    y_true_3 = (y_test == 3).astype(int)
    
    plt.subplot(1, 2, 1)
    prob_rf_3 = prob_rf[:, 3]
    prob_true, prob_pred = calibration_curve(y_true_3, prob_rf_3, n_bins=10)
    plt.plot(prob_pred, prob_true, marker='o', label='RF non calibré', color='red')
    plt.plot([0, 1], [0, 1], linestyle='--', color='gray')
    plt.title('Avant Calibration (Risque Rouge)')
    plt.xlabel('Probabilité prédite')
    plt.ylabel('Proportion réelle')
    
    plt.subplot(1, 2, 2)
    prob_calibre_3 = prob_calibre[:, 3]
    prob_true_c, prob_pred_c = calibration_curve(y_true_3, prob_calibre_3, n_bins=10)
    plt.plot(prob_pred_c, prob_true_c, marker='o', label='RF calibré', color='green')
    plt.plot([0, 1], [0, 1], linestyle='--', color='gray')
    plt.title('Après Calibration (Risque Rouge)')
    plt.xlabel('Probabilité prédite')
    
    plt.tight_layout()
    output_png = os.path.join(os.path.dirname(__file__), 'calibration_avant_apres.png')
    plt.savefig(output_png)
    print(f"Graphique généré : {output_png}")

if __name__ == "__main__":
    generer_rapport()
