# 🚀 Guide de Déploiement — Mbeund-Mi Backend
## VPS DigitalOcean — Ubuntu 24.04 LTS

> **Version** : B15 | **Branche** : `feature/backend-mama-adam`  
> **Domaine cible** : `mbeundmi.sn`  
> **Stack** : Docker Compose 7 services (PostGIS, Redis, Django, Celery×2, Mosquitto, Nginx)

---

## Table des matières

1. [Prérequis avant de commencer](#1-prérequis-avant-de-commencer)
2. [Phase 1 — Sécurisation initiale du VPS](#2-phase-1--sécurisation-initiale-du-vps)
3. [Phase 2 — Installation Docker](#3-phase-2--installation-docker)
4. [Phase 3 — Clonage du repo et configuration](#4-phase-3--clonage-du-repo-et-configuration)
5. [Phase 4 — Nginx + Certbot SSL](#5-phase-4--nginx--certbot-ssl)
6. [Phase 5 — Lancement et vérifications](#6-phase-5--lancement-et-vérifications)
7. [Phase 6 — Maintenance courante](#7-phase-6--maintenance-courante)
8. [Dépannage](#8-dépannage)

---

## 1. Prérequis avant de commencer

### Sur DigitalOcean (avant de vous connecter)

> ⚠️ **ACTION MANUELLE REQUISE — DigitalOcean Dashboard**
> 1. Créer un **Droplet** Ubuntu 24.04 LTS (minimum recommandé : 2 vCPU / 4 Go RAM / 80 Go SSD)
> 2. Activer la **clé SSH** lors de la création (ajouter votre clé publique)
> 3. Activer le **Firewall DigitalOcean** (Cloud Firewall) ou utiliser UFW (étape suivante)
> 4. Noter l'**IP publique** du Droplet (ex : `165.22.X.X`)

### DNS — Pointage du domaine

> ⚠️ **ACTION MANUELLE REQUISE — Registrar de `mbeundmi.sn`**
>
> Chez votre registrar (NIC Sénégal, Afrinic, etc.), créer/modifier ces enregistrements DNS :
>
> | Type | Nom | Valeur | TTL |
> |------|-----|--------|-----|
> | A | `mbeundmi.sn` | `<IP_VPS>` | 3600 |
> | A | `www.mbeundmi.sn` | `<IP_VPS>` | 3600 |
>
> ⏳ Attendre la propagation DNS (5 min à 48h). Vérifier avec :
> ```bash
> # Depuis votre machine locale
> nslookup mbeundmi.sn
> # ou
> dig mbeundmi.sn +short
> ```
> Le certificat SSL (étape 4) ne fonctionnera **que si le DNS pointe vers le VPS**.

---

## 2. Phase 1 — Sécurisation initiale du VPS

> ⚠️ **ACTION MANUELLE REQUISE — Connexion SSH initiale (en tant que root)**

```bash
# Connexion initiale en root
ssh root@<IP_VPS>
```

### 2.1 Mise à jour du système

```bash
apt update && apt upgrade -y
apt install -y curl wget git vim ufw fail2ban unzip
```

### 2.2 Créer un utilisateur non-root

```bash
# Créer l'utilisateur de déploiement
adduser mbeund
# (Entrer un mot de passe fort, les autres champs sont optionnels)

# Lui donner les droits sudo
usermod -aG sudo mbeund

# Copier la clé SSH de root vers le nouvel utilisateur
rsync --archive --chown=mbeund:mbeund ~/.ssh /home/mbeund/
```

### 2.3 Configurer SSH (désactiver le login root)

```bash
# Éditer la config SSH
vim /etc/ssh/sshd_config
```

Modifier / vérifier ces lignes :

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
Port 22
```

```bash
# Redémarrer SSH
systemctl restart sshd
```

> ⚠️ **ACTION MANUELLE REQUISE** : Ouvrir un **nouveau terminal** et vérifier que la connexion avec l'utilisateur `mbeund` fonctionne AVANT de fermer la session root.
> ```bash
> # Dans un nouveau terminal
> ssh mbeund@<IP_VPS>
> ```

### 2.4 Configurer UFW (pare-feu)

```bash
# Depuis la session mbeund (avec sudo)
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Ports à ouvrir
sudo ufw allow ssh          # Port 22
sudo ufw allow 80/tcp       # HTTP
sudo ufw allow 443/tcp      # HTTPS
sudo ufw allow 1883/tcp     # MQTT (Mosquitto) — optionnel si accès IoT externe
sudo ufw allow 9001/tcp     # MQTT WebSocket — optionnel

# Activer UFW
sudo ufw enable
sudo ufw status verbose
```

> **Note** : Les ports `5432` (PostgreSQL) et `6379` (Redis) ne sont PAS exposés sur le host grâce au `docker-compose.yml` de production. Ne pas les ouvrir dans UFW.

### 2.5 Configurer Fail2ban

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Créer une config locale
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo vim /etc/fail2ban/jail.local
```

Modifier dans la section `[DEFAULT]` :

```ini
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port    = ssh
logpath = %(sshd_log)s
backend = %(syslog_backend)s
```

```bash
sudo systemctl restart fail2ban
sudo fail2ban-client status
```

---

## 3. Phase 2 — Installation Docker

### 3.1 Installer Docker Engine (méthode officielle Ubuntu 24.04)

```bash
# Dépendances
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Clé GPG officielle Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Ajouter le dépôt Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Installer Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin

# Vérifier l'installation
docker --version
docker compose version
```

### 3.2 Ajouter l'utilisateur au groupe docker

```bash
sudo usermod -aG docker mbeund

# Appliquer sans déconnexion
newgrp docker

# Vérifier
docker run hello-world
```

### 3.3 Activer Docker au démarrage

```bash
sudo systemctl enable docker
sudo systemctl enable containerd
```

---

## 4. Phase 3 — Clonage du repo et configuration

### 4.1 Cloner le repo

```bash
# Aller dans /opt pour le déploiement
sudo mkdir -p /opt/mbeund-mi
sudo chown mbeund:mbeund /opt/mbeund-mi
cd /opt/mbeund-mi

# Cloner le repo (branche de production)
git clone -b feature/backend-mama-adam https://github.com/<VOTRE_ORG>/Mbeund-Mi.git .
```

> ⚠️ **ACTION MANUELLE REQUISE** : Remplacer `<VOTRE_ORG>` par le nom de l'organisation/utilisateur GitHub.
>
> Si le repo est **privé**, configurer un deploy key ou utiliser un token :
> ```bash
> git clone -b feature/backend-mama-adam \
>     https://<GITHUB_TOKEN>@github.com/<VOTRE_ORG>/Mbeund-Mi.git .
> ```

### 4.2 Configurer le fichier `.env` de production

```bash
# Copier le template de production
cp .env.production.example .env

# Éditer avec les vraies valeurs
vim .env
```

> ⚠️ **ACTION MANUELLE REQUISE** : Remplir **toutes** les valeurs dans `.env` :

```bash
# Valeurs critiques à remplir obligatoirement :

# 1. Générer une SECRET_KEY sécurisée (50+ caractères aléatoires)
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
# Copier le résultat dans SECRET_KEY=...

# 2. Générer un mot de passe PostgreSQL fort
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
# Utiliser dans POSTGRES_PASSWORD=... et DATABASE_URL=...

# 3. Remplir ALLOWED_HOSTS=mbeundmi.sn,www.mbeundmi.sn

# 4. Configurer MQTT si nécessaire (MQTT_USERNAME, MQTT_PASSWORD)
```

### 4.3 Copier la config Nginx de production

```bash
# La config prod est séparée de la config dev
cp nginx/nginx.prod.conf nginx/nginx.conf
# Note : nginx.prod.conf contient le server_name mbeundmi.sn
# ATTENTION : ne faire cette copie qu'après avoir les certificats SSL (étape 4.3)
```

> ⚠️ **IMPORTANT** : La config Nginx production (HTTPS) ne peut fonctionner qu'**après** l'émission du certificat SSL. Voir Phase 4.

### 4.4 Vérifier les permissions

```bash
# entrypoint.sh doit être exécutable
chmod +x backend/entrypoint.sh
chmod +x scripts/deploy.sh
chmod +x scripts/backup.sh
```

---

## 5. Phase 4 — Nginx + Certbot SSL

### 5.1 Premier démarrage avec config HTTP uniquement (sans SSL)

Avant d'obtenir le certificat SSL, démarrer **uniquement avec HTTP** :

```bash
cd /opt/mbeund-mi

# Utiliser une config Nginx HTTP temporaire (port 80 seulement)
cat > /opt/mbeund-mi/nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout 65;

    upstream django {
        server web:8000;
    }

    server {
        listen 80;
        server_name mbeundmi.sn www.mbeundmi.sn;

        # Challenge Let's Encrypt
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            proxy_pass http://django;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /static/ {
            alias /app/staticfiles/;
        }

        location /media/ {
            alias /app/media/;
        }
    }
}
EOF
```

### 5.2 Démarrer le stack (mode HTTP temporaire)

```bash
docker compose up -d --build

# Vérifier que tout tourne
docker compose ps

# Tester l'accès HTTP
curl -I http://mbeundmi.sn/admin/login/
# Doit retourner HTTP 200 ou 301
```

### 5.3 Obtenir le certificat SSL avec Certbot

> ⚠️ **ACTION MANUELLE REQUISE** — Le DNS doit déjà pointer vers ce VPS !

```bash
# Créer le répertoire pour le challenge ACME
sudo mkdir -p /opt/mbeund-mi/certbot/www
sudo mkdir -p /opt/mbeund-mi/certbot/conf

# Ajouter le volume certbot au docker-compose si non présent
# (déjà dans docker-compose.yml, voir commentaire nginx)

# Émettre le certificat via conteneur Certbot
docker run --rm \
    -v /opt/mbeund-mi/certbot/conf:/etc/letsencrypt \
    -v /opt/mbeund-mi/certbot/www:/var/www/certbot \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email contact@mbeundmi.sn \
    --agree-tos \
    --no-eff-email \
    -d mbeundmi.sn \
    -d www.mbeundmi.sn
```

> Le certificat sera dans `/opt/mbeund-mi/certbot/conf/live/mbeundmi.sn/`

### 5.4 Basculer sur la config Nginx production (HTTPS)

```bash
# Remplacer la config temporaire par la config production complète
cp /opt/mbeund-mi/nginx/nginx.prod.conf /opt/mbeund-mi/nginx/nginx.conf

# Mettre à jour le docker-compose.yml pour monter les certificats et le port 443
# (déjà configuré dans docker-compose.yml via les volumes certbot)

# Redémarrer Nginx
docker compose restart nginx

# Vérifier HTTPS
curl -I https://mbeundmi.sn/admin/login/
# Doit retourner HTTP 200 ou 301
```

### 5.5 Renouvellement automatique des certificats (cron)

```bash
# Ajouter un cron job pour le renouvellement (tous les 1er du mois à 3h)
(crontab -l 2>/dev/null; echo "0 3 1 * * docker run --rm \
    -v /opt/mbeund-mi/certbot/conf:/etc/letsencrypt \
    -v /opt/mbeund-mi/certbot/www:/var/www/certbot \
    certbot/certbot renew --quiet && \
    docker compose -f /opt/mbeund-mi/docker-compose.yml restart nginx") | crontab -

# Vérifier le cron
crontab -l
```

---

## 6. Phase 5 — Lancement et vérifications

### 6.1 Lancer le stack complet

```bash
cd /opt/mbeund-mi
docker compose up -d --build

# Suivre les logs de démarrage
docker compose logs -f web
```

### 6.2 Vérifier l'état de tous les services

```bash
docker compose ps
```

Résultat attendu :

```
NAME                     STATUS          PORTS
mbeund_mi_db             Up (healthy)    5432/tcp
mbeund_mi_redis          Up (healthy)    6379/tcp
mbeund_mi_web            Up (healthy)    8000/tcp
mbeund_mi_celery_worker  Up              
mbeund_mi_celery_beat    Up              
mbeund_mi_mosquitto      Up              1883/tcp, 9001/tcp
mbeund_mi_nginx          Up              0.0.0.0:80->80, 0.0.0.0:443->443
```

### 6.3 Tests de santé

```bash
# API accessible en HTTPS
curl -s https://mbeundmi.sn/api/capteurs/ | head -50
# Attendu : {"detail":"Informations d'authentification non fournies."}

# Admin accessible
curl -I https://mbeundmi.sn/admin/login/
# Attendu : HTTP/2 200

# Certificat SSL valide
echo | openssl s_client -connect mbeundmi.sn:443 2>/dev/null | openssl x509 -noout -dates
# Vérifier notAfter dans ~90 jours
```

### 6.4 Changer le mot de passe admin par défaut

> ⚠️ **ACTION MANUELLE REQUISE** — CRITIQUE pour la sécurité !

```bash
# Changer le mot de passe immédiatement
docker compose exec web python manage.py changepassword admin
# (ou créer un nouvel admin et supprimer le compte admin par défaut)
```

### 6.5 Vérifier DEBUG=False

```bash
# Vérifier que DEBUG est bien False en production
docker compose exec web python manage.py shell -c \
    "from django.conf import settings; print('DEBUG =', settings.DEBUG)"
# Attendu : DEBUG = False

# Vérifier ALLOWED_HOSTS
docker compose exec web python manage.py shell -c \
    "from django.conf import settings; print('ALLOWED_HOSTS =', settings.ALLOWED_HOSTS)"
# Attendu : ALLOWED_HOSTS = ['mbeundmi.sn', 'www.mbeundmi.sn']
```

---

## 7. Phase 6 — Maintenance courante

### 7.1 Mise à jour du code (déploiement continu)

```bash
cd /opt/mbeund-mi
./scripts/deploy.sh
```

### 7.2 Sauvegarde manuelle de la base de données

```bash
cd /opt/mbeund-mi
./scripts/backup.sh
# Les backups sont dans /opt/mbeund-mi/backups/
```

### 7.3 Automatiser les sauvegardes (cron)

```bash
# Sauvegarde quotidienne à 2h du matin
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/mbeund-mi/scripts/backup.sh >> /var/log/mbeund-backup.log 2>&1") | crontab -
```

### 7.4 Consulter les logs

```bash
# Logs de tous les services
docker compose logs --tail=100

# Logs d'un service spécifique
docker compose logs -f web
docker compose logs -f celery-worker
docker compose logs -f nginx

# Logs système Docker
journalctl -u docker.service --since "1 hour ago"
```

### 7.5 Redémarrer un service

```bash
# Redémarrer uniquement Nginx (ex: après renouvellement SSL)
docker compose restart nginx

# Redémarrer le worker Celery
docker compose restart celery-worker

# Redémarrer tout le stack
docker compose restart
```

### 7.6 Mise à jour des images Docker

```bash
cd /opt/mbeund-mi
# Pull les nouvelles images de base
docker compose pull
# Rebuilder les images personnalisées
docker compose build --no-cache web
# Redémarrer avec les nouvelles images
docker compose up -d
```

### 7.7 Nettoyer les ressources Docker inutilisées

```bash
# Nettoyer images, conteneurs, volumes non utilisés
docker system prune -f
# Attention : ne pas utiliser --volumes pour éviter de supprimer des données
```

---

## 8. Dépannage

### ❌ Le conteneur `web` ne démarre pas

```bash
# Voir les logs détaillés
docker compose logs web
# Causes fréquentes :
# - PostgreSQL pas encore prêt (attendre le healthcheck)
# - Variable d'environnement manquante dans .env
# - Erreur de migration Django
```

### ❌ Erreur `502 Bad Gateway` dans Nginx

```bash
# Vérifier que le service web tourne
docker compose ps web
# Vérifier la communication entre nginx et web
docker compose exec nginx wget -qO- http://web:8000/admin/login/
```

### ❌ Le certificat SSL n'est pas émis

```bash
# Vérifier que le DNS pointe bien vers ce VPS
dig mbeundmi.sn +short
# Doit retourner <IP_VPS>

# Tester le challenge HTTP (avant certbot)
curl http://mbeundmi.sn/.well-known/acme-challenge/test
```

### ❌ Erreur `DisallowedHost` Django

```bash
# Vérifier .env
grep ALLOWED_HOSTS /opt/mbeund-mi/.env
# Doit contenir mbeundmi.sn,www.mbeundmi.sn
```

### ❌ Espace disque insuffisant

```bash
df -h
# Nettoyer les logs Docker
docker system prune -f
# Nettoyer les anciens backups (> 30 jours)
find /opt/mbeund-mi/backups/ -name "*.sql.gz" -mtime +30 -delete
```

### ❌ Mosquitto inaccessible depuis l'extérieur

```bash
# Vérifier UFW
sudo ufw status
# Vérifier que le port 1883 est ouvert si nécessaire
sudo ufw allow 1883/tcp
# Vérifier la config mosquitto
docker compose logs mosquitto
```

---

## Récapitulatif des étapes manuelles

| # | Étape | Outil | Quand |
|---|-------|-------|-------|
| 1 | Créer le Droplet Ubuntu 24.04 | DigitalOcean Dashboard | Avant tout |
| 2 | Ajouter la clé SSH au Droplet | DigitalOcean Dashboard | Avant tout |
| 3 | Pointer DNS `mbeundmi.sn` → IP VPS | Registrar DNS | Avant SSL |
| 4 | Connexion SSH initiale en root | Terminal local | Phase 1 |
| 5 | Créer l'utilisateur `mbeund` et tester SSH | Terminal VPS | Phase 1 |
| 6 | Remplir le fichier `.env` avec les secrets | VPS + éditeur | Phase 3 |
| 7 | Remplacer `<VOTRE_ORG>` dans la commande git clone | VPS | Phase 3 |
| 8 | Changer le mot de passe admin après 1er démarrage | VPS | Phase 5 |

---

*Guide généré le 2026-08-17 — Mbeund-Mi B15 — `feature/backend-mama-adam`*
