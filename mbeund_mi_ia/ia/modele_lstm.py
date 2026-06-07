import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
import os

def entrainer_lstm():
    base_dir = os.path.dirname(os.path.dirname(__file__))
    data_dir = os.path.join(base_dir, 'data')
    
    print("Chargement des données préparées...")
    X_train = np.load(os.path.join(data_dir, 'X_train.npy'))
    y_train = np.load(os.path.join(data_dir, 'y_train.npy'))
    
    print("Création de l'architecture LSTM...")
    model = Sequential([
        LSTM(64, return_sequences=True, input_shape=(X_train.shape[1], X_train.shape[2])),
        Dropout(0.2),
        LSTM(32),
        Dropout(0.2),
        Dense(16, activation='relu'),
        Dense(1, activation='linear')
    ])
    
    model.compile(optimizer='adam', loss='mse', metrics=['mae'])
    
    print("Début de l'entraînement du modèle LSTM...")
    # Entraînement rapide pour la démo avec 5 epochs
    model.fit(X_train, y_train, epochs=5, batch_size=16, validation_split=0.2, verbose=1)
    
    model.save(os.path.join(data_dir, 'modele_lstm.h5'))
    print("[SUCCES] Modèle LSTM entraîné et sauvegardé (modele_lstm.h5) !")

if __name__ == "__main__":
    entrainer_lstm()
