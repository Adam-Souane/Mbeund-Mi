# Mbeund-Mi — Base de Données

## Plateforme de prévention des inondations (PFE — Thiaroye-sur-Mer, Dakar — 2026)

Ce repository contient la partie **Base de données** de la plateforme de prévention des inondations. Il regroupe la modélisation, le stockage, l'organisation et l'optimisation des données géospatiales et temporelles du projet.

---

## 📁 Architecture des dossiers

```bash
.
├── .env.example          # Fichier de variables d'environnement modèle
├── .env                  # Fichier de variables d'environnement local (généré)
├── docker-compose.yml    # Configuration des services Docker (PostGIS & Redis)
├── sql/
│   └── init.sql          # Script SQL d'initialisation du schéma et des index
├── seeds/
│   └── seed_data.sql     # Script SQL d'insertion de données de test (Dakar, Thiaroye)
├── docs/
│   └── db_schema.md      # Dictionnaire des données & requêtes types
└── diagrams/
    └── schema_mcd.md     # Diagramme Entité-Association (ERD) en Mermaid
```

---

## 🛠️ Technologies & Dépendances

- **Base de données principale** : PostgreSQL 15 + PostGIS 3.3
- **Cache / File d'attente** : Redis 7 (Alpine)
- **Déploiement** : Docker & Docker Compose
- **Système de coordonnées géographique** : WGS 84 (SRID 4326), compatible avec GeoDjango et les bibliothèques cartographiques frontend (Leaflet, Mapbox, OpenLayers).

---

## 🚀 Démarrage et Initialisation

### Prerequis
Avoir installé **Docker** et **Docker Compose** sur votre machine.

### Étape 1 : Configurer les variables d'environnement
Copiez le fichier `.env.example` pour créer votre fichier `.env` :
```bash
cp .env.example .env
```
Ajustez les mots de passe et configurations si nécessaire.

### Étape 2 : Lancer la base de données et le cache
Exécutez la commande suivante à la racine du projet :
```bash
docker compose up -d
```
Cette commande va :
1. Télécharger et lancer l'image PostgreSQL avec PostGIS activé.
2. Télécharger et lancer l'image Redis Alpine.
3. Monter automatiquement les scripts `sql/init.sql` et `seeds/seed_data.sql` dans le dossier d'initialisation de l'image de base de données PostgreSQL. Lors du premier démarrage, les tables seront créées et les données de test insérées automatiquement.

### Étape 3 : Vérifier et inspecter les logs
Vous pouvez suivre l'état du démarrage et l'exécution des scripts avec :
```bash
docker compose logs -f db
```

---

## 📊 Exploration du Modèle de Données

- Pour voir les entités et relations détaillées, consultez le [Diagramme MCD](diagrams/schema_mcd.md).
- Pour obtenir le dictionnaire complet des tables et des types de données, consultez la [Documentation du Schéma](docs/db_schema.md).
- Pour des exemples de requêtes géospatiales complexes (ex: intersections spatiales, distances géodésiques), consultez la section correspondante de la documentation.

---

## 🔗 Intégration Backend Django (GeoDjango)
Pour connecter ce schéma à une application Django avec prise en charge spatiale :
1. Configurez le moteur de base de données dans Django :
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.contrib.gis.db.backends.postgis',
           'NAME': 'mbeund_mi',
           'USER': 'postgres',
           'PASSWORD': 'mbeund_mi_password',
           'HOST': '127.0.0.1',
           'PORT': '5433',
       }
   }
   ```
2. Utilisez la commande d'inspection automatique de Django pour générer vos modèles de base :
   ```bash
   python manage.py inspectdb > models.py
   ```
   *Note : N'oubliez pas de remplacer `django.db.models` par `django.contrib.gis.db.models` pour les champs géométriques.*
