# Guide d'Installation de l'IA et de l'API (MBEUND MI)

Ce guide est destiné à l'équipe Backend (Mama Adam) et aux autres membres pour configurer la partie IA et API du projet.

## 1. Prérequis

- **Python 3.11** ou supérieur.
- **pip** (gestionnaire de paquets Python).
- **Mosquitto MQTT Broker** (pour la simulation IoT).

## 2. Installation des dépendances

Ouvrez un terminal à la racine du projet, activez votre environnement virtuel et exécutez ces commandes :

```bash
# Librairies IA & Data
pip install tensorflow scikit-learn pandas numpy

# Librairies API & Services Externes
pip install paho-mqtt earthengine-api geemap pillow python-dotenv twilio reportlab groq
```

## 3. Configuration du fichier `.env`

Le fichier `.env` est crucial pour sécuriser nos clés d'API.

1. Copiez le modèle :
   ```bash
   cp .env.example .env
   ```
   *(Sur Windows : `copy .env.example .env`)*

2. Remplissez les clés dans le fichier `.env` :
   - `TWILIO_ACCOUNT_SID` et `TWILIO_AUTH_TOKEN` : Obtenez-les sur la [console Twilio](https://console.twilio.com/).
   - `OPENWEATHERMAP_API_KEY` : Générez votre clé sur [OpenWeatherMap](https://home.openweathermap.org/api_keys).
   - `GROQ_API_KEY` : Générez votre clé gratuitement sur la [console Groq](https://console.groq.com/). Indispensable pour le Chatbot NDAM.
   - `FIREBASE_SERVER_KEY` : Depuis les paramètres de votre projet Firebase.

## 4. Lancement de la Simulation

Pour vérifier que l'IA, le détecteur d'anomalies, et l'anti-spam fonctionnent ensemble :

```bash
# Naviguez dans le dossier de l'IA
cd mbeund_mi_ia

# 1. Lancez le scénario de démonstration IA (Anomalies, RF, Alertes)
python demo/demo_scenarii.py

# 2. Testez le Chatbot interactif NDAM dans votre terminal
python demo/demo_chatbot.py
```

## 5. Comment vérifier que tout fonctionne ?

Vous pouvez tester spécifiquement les recommandations, l'anti-spam et le chatbot avec Pytest :
```bash
pip install pytest pytest-mock
pytest mbeund_mi_ia/tests/
```
Si tous les tests passent en vert, l'architecture est valide !

## 6. FAQ et Problèmes courants

- **Problème :** `ImportError: No module named tensorflow`
  - **Solution :** Si votre PC n'a pas assez de RAM pour TensorFlow, le code a été conçu avec un *fallback* manuel. Vous pouvez ignorer cette erreur pour la démo, l'API utilisera les règles conditionnelles basiques et le Random Forest.
- **Problème :** Le SMS n'est pas envoyé.
  - **Solution :** Vérifiez que vous n'êtes pas bloqué par l'anti-spam (délai de grâce de 2h). Vérifiez aussi vos logs dans `mbeund_mi_ia/alertes.log`.
