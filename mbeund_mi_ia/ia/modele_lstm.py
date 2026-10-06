"""Entraînement et évaluation du LSTM de niveau d'eau à 24 h (voir ia/preparation_donnees.py).

Usage : python -m ia.preparation_donnees puis python -m ia.modele_lstm (depuis mbeund_mi_ia/).
Écrit data/modele_lstm.h5 et data/metriques_lstm.json (résultats sur le jeu de test chronologique,
comparés à deux références : persistance et règle empirique utilisée en repli par le service).
"""
import json
import os

import numpy as np
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.models import Sequential


def _erreurs(prediction, cible):
    return {'mae': round(float(np.mean(np.abs(prediction - cible))), 2), 'rmse': round(float(np.sqrt(np.mean((prediction - cible) ** 2))), 2)}


def entrainer_lstm():
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
    charge = lambda nom, jeu: np.load(os.path.join(data_dir, f'{nom}_{jeu}.npy'))  # noqa: E731
    X_train, y_train, X_val, y_val, X_test, y_test = (charge(n, j) for j in ('train', 'val', 'test') for n in ('X', 'y'))

    import tensorflow as tf
    tf.keras.utils.set_random_seed(42)
    model = Sequential([
        LSTM(64, return_sequences=True, input_shape=(X_train.shape[1], X_train.shape[2])),
        Dropout(0.2),
        LSTM(32),
        Dropout(0.2),
        Dense(16, activation='relu'),
        Dense(1, activation='linear'),
    ])
    model.compile(optimizer='adam', loss='mse', metrics=['mae'])
    historique = model.fit(
        X_train, y_train, validation_data=(X_val, y_val), epochs=80, batch_size=64, verbose=2,
        callbacks=[EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True), ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=4)],
    )
    model.save(os.path.join(data_dir, 'modele_lstm.h5'))

    # Évaluation sur le jeu de test (jamais vu), contre deux références
    prediction = np.maximum(model.predict(X_test, verbose=0).ravel(), 0)
    persistance = charge('dernier_niveau', 'test')
    empirique = persistance + 0.5 * charge('pluie_j1', 'test')  # règle de repli du service : niveau + 0,5 × pluie prévue
    metriques = {
        'donnees': 'pluie journalière Dakar 2010-2024 (Open-Meteo) ; niveau d\'eau reconstitué (1,5 × cumul 72 h + bruit de 5 cm)',
        'sequences': {'apprentissage': int(len(y_train)), 'validation': int(len(y_val)), 'test': int(len(y_test))},
        'epoques_effectuees': len(historique.history['loss']),
        'niveau_moyen_test_cm': round(float(y_test.mean()), 2),
        'jours_test_niveau_ge_30cm': int((y_test >= 30).sum()),
        'lstm': _erreurs(prediction, y_test),
        'persistance': _erreurs(persistance, y_test),
        'regle_empirique': _erreurs(empirique, y_test),
    }
    fort = y_test >= 30
    if fort.any():
        metriques['sur_les_jours_ge_30cm'] = {'lstm': _erreurs(prediction[fort], y_test[fort]), 'persistance': _erreurs(persistance[fort], y_test[fort]), 'regle_empirique': _erreurs(empirique[fort], y_test[fort])}
    with open(os.path.join(data_dir, 'metriques_lstm.json'), 'w', encoding='utf-8') as f:
        json.dump(metriques, f, ensure_ascii=False, indent=2)
    print(json.dumps(metriques, ensure_ascii=False, indent=2))
    return metriques


if __name__ == "__main__":
    entrainer_lstm()
