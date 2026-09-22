# ☁️ Guide de Déploiement en Production - Mbeund-Mi

**Objectif:** Déployer le système sur serveur cloud scalable 24/7

**Options:** Heroku (facile), AWS/GCP (robuste), DigitalOcean (équilibre)

---

## 🚀 OPTION 1: HEROKU (RECOMMANDÉ POUR DÉMARRAGE)

### **Avantages:**
- ✅ Déploiement en 5 minutes
- ✅ Scaling automatique
- ✅ SSL gratuit
- ✅ Monitoring intégré

### **Étapes:**

#### **1. Installer Heroku CLI**
```bash
# Windows
choco install heroku-cli

# ou télécharger depuis https://devcenter.heroku.com/articles/heroku-cli
```

#### **2. Créer app Heroku**
```bash
heroku login
heroku create mbeund-mi-prod
```

#### **3. Configurer variables d'environnement**
```bash
heroku config:set DEBUG=False
heroku config:set SECRET_KEY="votre-clé-secrète-longue"
heroku config:set ALLOWED_HOSTS="mbeund-mi-prod.herokuapp.com"
heroku config:set DATABASE_URL="postgresql://..."  # Heroku configure auto
heroku config:set REDIS_URL="redis://..."  # AddOn Redis
heroku config:set TWILIO_ACCOUNT_SID="..."
heroku config:set TWILIO_AUTH_TOKEN="..."
heroku config:set TWILIO_PHONE_NUMBER="+..."
heroku config:set FIREBASE_CREDENTIALS_PATH="/app/firebase.json"
heroku config:set GEE_PROJECT_ID="mbeund-mi"
```

#### **4. Ajouter AddOns**
```bash
# Redis (pour Celery)
heroku addons:create heroku-redis:premium-0

# PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# SendGrid (emails)
heroku addons:create sendgrid:starter

# Papertrail (logs)
heroku addons:create papertrail:choklad
```

#### **5. Créer Procfile**
```bash
# backend/Procfile
web: gunicorn mbeund_mi_backend.wsgi --log-file -
worker: celery -A mbeund_mi_backend worker -l info
beat: celery -A mbeund_mi_backend beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

#### **6. Créer runtime.txt**
```bash
# backend/runtime.txt
python-3.12.10
```

#### **7. Créer requirements.txt**
```bash
cd backend
pip freeze > requirements.txt
# Ajouter: gunicorn, psycopg2-binary, redis
```

#### **8. Déployer**
```bash
git push heroku frontend-reconstruction:main

# Exécuter migrations
heroku run python manage.py migrate

# Charger données initiales (optionnel)
heroku run python manage.py loaddata fixture_zones.json
```

#### **9. Vérifier le déploiement**
```bash
heroku open
heroku logs --tail
```

### **Coût Heroku (mensuel):**
- Dyno web: $7-50 (échelle automatique)
- Redis: $30-300
- PostgreSQL: $50-1000
- Total: ~$100-150/mois pour démarrer

---

## 🔥 OPTION 2: AWS (SCALABLE PRODUCTION)

### **Architecture Recommandée:**

```
┌─────────────────┐
│  Route 53 (DNS) │
└────────┬────────┘
         │
┌────────▼──────────┐
│  CloudFront (CDN) │
└────────┬──────────┘
         │
┌────────▼──────────────────┐
│  ALB (Load Balancer)       │
└────────┬──────────────────┘
         │
    ┌────┼────┐
    │    │    │
┌───▼─┐ ┌─┴──▼──┐ ┌────▼───┐
│ EC2 │ │ RDS   │ │ElastiC │
│(web)│ │(DB)   │ │Cache   │
└─────┘ └───────┘ │(Redis) │
                  └────────┘
```

### **Étapes:**

#### **1. EC2 Instance**
```bash
# Lancer instance Ubuntu 22.04 LTS
# Type: t3.medium (2 CPU, 4GB RAM)
# Security group: SSH (22), HTTP (80), HTTPS (443)

# Se connecter
ssh -i key.pem ubuntu@your-instance-ip

# Installer dépendances
sudo apt update
sudo apt install python3.12 python3-pip python3-venv nginx certbot
```

#### **2. Cloner et déployer**
```bash
git clone https://github.com/Adam-Souane/Mbeund-Mi.git
cd Mbeund-Mi/backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn psycopg2-binary redis
```

#### **3. Configurer PostgreSQL RDS**
```bash
# Console AWS > RDS > Create Database
# Engine: PostgreSQL 15
# Class: db.t3.micro (free tier)
# Storage: 20GB
# Public: No (only EC2 access)
```

#### **4. Configurer ElastiCache (Redis)**
```bash
# Console AWS > ElastiCache > Create Cluster
# Engine: Redis 7.0
# Node type: cache.t3.micro
# Nodes: 1
```

#### **5. Configurer Nginx**
```bash
sudo vi /etc/nginx/sites-available/default

# Ajouter:
server {
    listen 80;
    server_name mbeund-mi.com;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /static/ {
        alias /home/ubuntu/Mbeund-Mi/backend/staticfiles/;
    }
    
    location /media/ {
        alias /home/ubuntu/Mbeund-Mi/backend/media/;
    }
}

sudo systemctl restart nginx
```

#### **6. Configurer Gunicorn avec SystemD**
```bash
sudo vi /etc/systemd/system/mbeund.service

[Unit]
Description=Mbeund-Mi Django App
After=network.target

[Service]
Type=notify
User=ubuntu
WorkingDirectory=/home/ubuntu/Mbeund-Mi/backend
ExecStart=/home/ubuntu/Mbeund-Mi/backend/venv/bin/gunicorn \
    --workers 4 \
    --bind 127.0.0.1:8000 \
    mbeund_mi_backend.wsgi:application

[Install]
WantedBy=multi-user.target

sudo systemctl daemon-reload
sudo systemctl start mbeund
sudo systemctl enable mbeund
```

#### **7. Configurer Celery Worker**
```bash
sudo vi /etc/systemd/system/mbeund-celery.service

[Unit]
Description=Mbeund-Mi Celery Worker
After=network.target

[Service]
Type=forking
User=ubuntu
WorkingDirectory=/home/ubuntu/Mbeund-Mi/backend
ExecStart=/home/ubuntu/Mbeund-Mi/backend/venv/bin/celery multi start worker \
    -A mbeund_mi_backend --loglevel=info

ExecStop=/home/ubuntu/Mbeund-Mi/backend/venv/bin/celery multi stopwait worker \
    -A mbeund_mi_backend

[Install]
WantedBy=multi-user.target

sudo systemctl enable mbeund-celery
sudo systemctl start mbeund-celery
```

#### **8. Configurer Celery Beat**
```bash
sudo vi /etc/systemd/system/mbeund-beat.service

[Unit]
Description=Mbeund-Mi Celery Beat
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/Mbeund-Mi/backend
ExecStart=/home/ubuntu/Mbeund-Mi/backend/venv/bin/celery -A mbeund_mi_backend beat \
    -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler

[Install]
WantedBy=multi-user.target

sudo systemctl enable mbeund-beat
sudo systemctl start mbeund-beat
```

#### **9. SSL avec Let's Encrypt**
```bash
sudo certbot --nginx -d mbeund-mi.com
# Auto-renewal configuré
```

#### **10. Vérifier le déploiement**
```bash
sudo systemctl status mbeund
sudo systemctl status mbeund-celery
sudo systemctl status mbeund-beat
tail -f /var/log/syslog | grep mbeund
```

### **Coût AWS (mensuel):**
- EC2 t3.medium: ~$30
- RDS db.t3.micro: ~$30
- ElastiCache cache.t3.micro: ~$15
- Total: ~$75-100/mois

---

## 📊 MONITORING PRODUCTION

### **CloudWatch (AWS) / Papertrail (Heroku)**

```bash
# Vérifier logs
heroku logs --tail      # Heroku
tail -f /var/log/syslog # AWS

# Vérifier Celery
celery -A mbeund_mi_backend inspect active
celery -A mbeund_mi_backend inspect stats

# Vérifier Redis
redis-cli PING
redis-cli INFO

# Vérifier DB
python manage.py shell
from django.db import connection
connection.ensure_connection()
```

---

## ✅ CHECKLIST PRÉ-DÉPLOIEMENT

- [ ] `DEBUG = False` en settings
- [ ] `SECRET_KEY` changée
- [ ] `ALLOWED_HOSTS` configurés
- [ ] Certificat SSL installé
- [ ] Base de données migrée
- [ ] Fichiers statiques collectés (`collectstatic`)
- [ ] Redis fonctionne
- [ ] Celery Worker/Beat fonctionnent
- [ ] SMS testés en production
- [ ] Emails testés
- [ ] Backups configurés
- [ ] Monitoring configuré

---

## 🎯 RÉSUMÉ

| Option | Durée Setup | Coût/mois | Scalabilité | Recommandé |
|--------|------------|-----------|-------------|-----------|
| **Heroku** | 15 min | $100 | Auto | ✅ Démarrage |
| **AWS** | 2-3h | $75 | Manuel | ✅ Production |
| **DigitalOcean** | 1-2h | $60 | Manuel | ✅ Équilibre |

**Recommandation:** Commencer avec Heroku, migrer à AWS en cas de croissance.

