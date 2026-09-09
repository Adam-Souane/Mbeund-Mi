# Contexte projet — MBEUND MI (Backend)

Plateforme de prévention des inondations pour Thiaroye Sur Mer (Dakar, Sénégal).
Projet de fin de formation APD.

## Stack backend imposée
- Django 5.x (LTS) + Django REST Framework 3.x
- Django Channels 4.x (WebSockets, alertes temps réel)
- Celery 5.x + Redis 7.x (tâches asynchrones)
- PostgreSQL 16 + PostGIS 3.x (GeoDjango) — schéma géré avec Mame Diarra (BDD)
- djangorestframework-simplejwt (authentification)
- Réception de données via MQTT (paho-mqtt) depuis un simulateur IoT Python (Maïmouna)
- Déploiement : Docker Compose + Nginx + DigitalOcean

## Modèles principaux
Capteur, Mesure, ZoneRisque, Alerte, EpisodeInondation, PredictionIA, SignalementCitoyen

## Règles à toujours respecter
- Jamais de secret en dur dans le code : tout passe par .env (python-dotenv / django-environ)
- .gitignore doit toujours exclure .env, db.sqlite3, firebase_credentials.json, env/
- DEBUG = False en production, ALLOWED_HOSTS explicite
- Tout endpoint API est testé avec pytest-django avant d'être considéré terminé
- Le format JSON exposé doit rester stable pour le frontend React de Ngoné et le
  service IA de Maïmouna — ne jamais renommer un champ existant sans le signaler
- Ne jamais toucher aux dossiers/fichiers en dehors du périmètre backend
  (ne pas modifier de fichiers React, IA, ou appartenant à d'autres membres)
- Toujours committer par petite étape cohérente (un prompt = une tâche = un commit)

## Équipe
Ngoné Gueye (Frontend React), Mame Diarra Diané (BDD/PostGIS), Maïmouna Sall (IA/GEE/météo)
