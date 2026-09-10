# Mbeund-Mi - Plateforme de Prévention des Inondations (Thiaroye Sur Mer)

**Projet de Fin de Formation (PFE) - 2026**
Ce dépôt contient le Backend (Django/DRF + PostGIS), le module d'Intelligence Artificielle et le Frontend (React) de la plateforme Mbeund-Mi.

## 🚀 Démarrage Rapide (Pour l'équipe)

### 1. Activer l'Environnement Virtuel
Tout a été installé et isolé pour éviter les conflits. Ouvrez un terminal à la racine du projet et tapez :
```bash
.\env\Scripts\activate
```

### 2. Démarrer le Serveur Backend (Mama Adam & Mame Diarra)
Une fois l'environnement activé, naviguez dans le dossier backend et lancez le serveur :
```bash
cd backend
python manage.py runserver
```
L'API sera disponible sur : `http://localhost:8000/api/`

### 3. Lancer la Démonstration de l'IA (Maïmouna Sall)
Pour montrer le fonctionnement de l'IA, de l'envoi de SMS (Twilio) et du relais vers le Backend (Firebase) lors de la soutenance :
```bash
cd mbeund_mi_ia
python demo/demo_scenarii.py
```

---

## 🗄️ Base de données (PostgreSQL + PostGIS)

- **Base de données principale** : PostgreSQL 16 + PostGIS 3.4
- **Cache / File d'attente / Broker Celery** : Redis 7 (Alpine)
- **Système de coordonnées géographique** : WGS 84 (SRID 4326), compatible avec GeoDjango et les bibliothèques cartographiques frontend (Leaflet, Mapbox, OpenLayers)

Le schéma est géré par les migrations Django (source de vérité). Pour la conception et la documentation du modèle de données :
- [Diagramme MCD/ERD](diagrams/schema_mcd.md)
- [Diagrammes UML](diagrams/uml_diagrams.md)
- [Dictionnaire des données](docs/db_schema.md)

Les scripts `sql/init.sql`, `sql/triggers_and_functions.sql` et `seeds/seed_data.sql` documentent la conception initiale de la base ; ils servent de référence et ne sont pas exécutés automatiquement — le schéma réel est généré par `python manage.py migrate`.

---

## 📡 Documentation API (Pour Ngoné - Frontend)

Le Backend est configuré avec CORS pour te permettre de faire tes requêtes depuis React sans blocage (origines autorisées via `CORS_ALLOWED_ORIGINS` dans `.env`).

### Points d'accès (Endpoints) :
URL de base : `http://localhost:8000/api/`

- **GET `/api/zones/`** : Zones à risque (géométrie, quartier, niveau de risque).
- **GET `/api/capteurs/`** : Capteurs IoT (non paginé, liste bornée).
- **GET `/api/mesures/`** : Relevés capteurs (niveau d'eau, pluviométrie) — **paginé**.
- **GET `/api/alertes/`** : Alertes générées (Vert, Jaune, Orange, Rouge) — **paginé**.
- **GET `/api/predictions/`** : Prédictions IA de risque par zone.
- **GET `/api/inondations/`** : Épisodes d'inondation historiques.
- **GET `/api/previsions/`** : Prévisions météo — **paginé**.
- **GET `/api/historique-risque/`** : Historique des scores de risque — **paginé**.
- **POST `/api/signalements/`** : Permet aux citoyens de signaler un problème (géolocalisation, description, photo) — liste **paginée**.
  - *Note sur le Geofencing* : Si les coordonnées envoyées sont à plus de 4 km de Thiaroye Sur Mer, l'API renverra une erreur 400 (Validation Error). Les photos sont automatiquement compressées par le serveur.
  - *Note anti-spam* : la création est limitée à 20 requêtes/heure par IP anonyme (au-delà : `429 Too Many Requests`).
- **POST `/api/token/`** / **POST `/api/token/refresh/`** : Authentification JWT.

> **Pagination** : les endpoints marqués "paginé" renvoient `{"count", "next", "previous", "results"}` au lieu d'une liste brute (`results` contient la liste, ou le GeoJSON `FeatureCollection` pour les signalements). Page par défaut : 50 éléments (`?page=2` pour la suivante).

---

## 🔒 Sécurité & Production
Avant de déployer le projet sur un serveur final :
1. Les clés secrètes (Twilio, Firebase, Django) sont protégées par le fichier `.env`. **Ne jamais l'envoyer sur GitHub.** Le fichier `.gitignore` est déjà configuré pour l'ignorer.
2. Dans `backend/mbeund_mi_backend/settings/prod.py`, `DEBUG` doit rester à `False`.
3. Assurez-vous que `firebase_credentials.json` n'est jamais envoyé sur un dépôt public.
