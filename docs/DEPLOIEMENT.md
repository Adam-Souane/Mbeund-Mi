# 🚀 Guide de Déploiement — Mbeund-Mi Backend

> **Mis à jour** : 2026-09-11 — migration de Docker/VPS vers une infrastructure cloud managée
> **Branche** : `backend-reconstruction`

---

## Ce qui a changé

L'ancienne version de ce guide décrivait un déploiement Docker Compose (7 conteneurs :
PostGIS, Redis, Django, Celery×2, Mosquitto, Nginx) sur un VPS DigitalOcean. Cette approche a
été abandonnée : trop lourde à faire tourner en local pour le développement, et redondante
avec des services cloud gratuits qui font le travail plus simplement.

**La base de données, le cache/broker et le broker MQTT sont maintenant des services cloud
managés, configurés une fois pour toutes via `backend/.env` :**

| Composant | Service | Configuré via |
|---|---|---|
| PostgreSQL + PostGIS | [Neon](https://neon.tech) | `DATABASE_URL` |
| Redis (cache, Celery, Channels) | [Upstash](https://upstash.com) | `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` |
| Broker MQTT (capteurs IoT) | [HiveMQ Cloud](https://console.hivemq.cloud) | `MOSQUITTO_HOST`, `MOSQUITTO_PORT`, `MQTT_USERNAME`, `MQTT_PASSWORD` |

Voir `backend/.env.example` pour la liste complète des identifiants nécessaires (où et comment
les obtenir).

**Ce qui reste à héberger** : uniquement l'application Django elle-même (serveur web via
Gunicorn/Daphne) et les processus Celery (worker + beat), puisqu'ils exécutent votre code et
doivent tourner en continu. `docker-compose.yml`, `backend/Dockerfile` et
`backend/entrypoint.sh` ont été retirés du dépôt (toujours consultables dans l'historique Git
si besoin de référence) — ils décrivaient un déploiement Docker à 7 conteneurs devenu inutile
maintenant que la base, le cache et le broker MQTT sont des services cloud managés.

> ⚠️ **Décision non prise à ce jour** : où héberger concrètement Django/Celery (VPS classique,
> PaaS type Render/Railway/Fly.io, etc.). Ce guide couvre les étapes communes à toute option ;
> les instructions spécifiques à une plateforme seront ajoutées une fois ce choix fait.

---

## Prérequis, quelle que soit la plateforme choisie

1. **Les 3 services cloud ci-dessus créés et configurés** (voir `backend/.env.example`)
2. **GDAL/GEOS installés sur la machine qui exécute Django** — nécessaire même avec une base
   de données distante, car GeoDjango manipule la géométrie côté client :
   - Linux (Debian/Ubuntu) : `apt-get install binutils libproj-dev gdal-bin libgdal-dev`
   - Windows (développement) : voir la note dans `backend/.env.example` (installation OSGeo4W)
3. Un compte Git avec accès au dépôt

---

## Étapes communes de déploiement

### 1. Cloner le dépôt et installer les dépendances

```bash
git clone https://github.com/Adam-Souane/Mbeund-Mi.git
cd Mbeund-Mi/backend
python -m venv venv
source venv/bin/activate  # ou venv\Scripts\activate sous Windows
pip install -r requirements.txt
```

### 2. Configurer l'environnement de production

```bash
cp .env.example .env
# Remplir .env avec les vraies valeurs (voir backend/.env.example pour chaque service)
```

Variables spécifiques à la production (au-delà de `.env.example`) :

```bash
DEBUG=False
DJANGO_SETTINGS_MODULE=mbeund_mi_backend.settings.prod
ALLOWED_HOSTS=votre-domaine.sn,www.votre-domaine.sn
```

`settings/prod.py` exige `SECRET_KEY` et `ALLOWED_HOSTS` explicites (pas de valeur par défaut)
— le démarrage échoue si l'un des deux manque, volontairement (voir l'audit de sécurité de
l'Étape 4).

### 3. Migrations et fichiers statiques

```bash
python manage.py migrate
python manage.py collectstatic --noinput
```

### 4. Créer un compte administrateur (jamais de mot de passe par défaut en dur)

```bash
# Interactif :
python manage.py createsuperuser

# Ou non-interactif (ex: script de déploiement automatisé) :
DJANGO_SUPERUSER_USERNAME=admin \
DJANGO_SUPERUSER_EMAIL=admin@votre-domaine.sn \
DJANGO_SUPERUSER_PASSWORD=<mot_de_passe_fort_genere> \
python manage.py createsuperuser --noinput
```

### 5. Lancer les processus applicatifs

Trois processus doivent tourner en continu (via systemd, un Procfile, ou l'équivalent du
PaaS choisi) :

```bash
# Serveur web (Channels/WebSockets nécessite Daphne, pas seulement Gunicorn WSGI)
daphne -b 0.0.0.0 -p 8000 mbeund_mi_backend.asgi:application

# Worker Celery (tâches asynchrones : IA, SMS, GEE)
celery -A mbeund_mi_backend worker --loglevel=info

# Celery Beat (tâches périodiques, ex: analyse_gee_periodique)
celery -A mbeund_mi_backend beat --loglevel=info
```

### 6. Reverse proxy (Nginx ou équivalent géré par le PaaS)

Si vous gérez vous-même Nginx (VPS), une configuration minimale : proxy vers le port 8000,
support des upgrades WebSocket (`Upgrade`/`Connection` headers) pour `/ws/`, et service des
fichiers statiques/médias. Voir `nginx/nginx.prod.conf` pour un exemple encore valable
(indépendant de Docker).

### 7. Vérifications post-déploiement

```bash
python manage.py check --deploy
python manage.py shell -c "from django.conf import settings; print('DEBUG =', settings.DEBUG)"
# Attendu : DEBUG = False
```

---

## Sauvegardes

Neon effectue des sauvegardes automatiques (point-in-time recovery selon l'offre). Pour un
export manuel ponctuel :

```bash
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d).sql
```

---

*Guide réécrit le 2026-09-11 suite à la migration Docker → infrastructure cloud (Neon,
Upstash, HiveMQ Cloud). L'historique de l'ancien guide Docker/DigitalOcean reste consultable
dans l'historique Git si besoin de référence.*
