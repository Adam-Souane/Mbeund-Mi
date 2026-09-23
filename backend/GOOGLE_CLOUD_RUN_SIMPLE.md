# B) DÉPLOIEMENT GOOGLE CLOUD RUN - VERSION SANS DOCKER

**Objectif:** Déployer sans Docker local (Google construit automatiquement)

**Durée:** 20-30 minutes

**Coût:** €0 (free tier)

**Requis:** Juste `gcloud` CLI (pas Docker!)

---

## **POURQUOI PAS DOCKER?**

```
❌ Docker = Lourd, consomme beaucoup d'espace disque
✅ Google Cloud Buildpacks = Automatique, pas besoin de Docker local

Google Cloud va:
1. Prendre votre code Python
2. Détecter que c'est Django
3. Construire l'image automatiquement DANS LE CLOUD
4. Déployer sur Cloud Run

Vous n'avez besoin que de `gcloud` CLI.
```

---

## **PRÉREQUIS - VÉRIFIER**

### 1. Google Cloud CLI installé

```bash
# Vérifier
gcloud --version

# Si pas installé: https://cloud.google.com/sdk/docs/install
```

### 2. Avoir un compte Google Cloud

```bash
# Vérifier
gcloud auth list

# Si pas encore connecté:
gcloud auth login
```

### 3. Avoir le code source Git

```bash
# Vérifier que vous êtes dans le bon dossier
cd C:\Users\pc\Documents\PERSO\Mbeund-Mi\backend
git status
```

✅ **PRÉREQUIS VÉRIFIÉS**

---

## **ÉTAPE 1: CRÉER PROJET GOOGLE CLOUD (5 min)**

### 1.1 Console Google Cloud

```
https://console.cloud.google.com/
```

### 1.2 Créer un projet

```
1. Cliquer "Select a Project" (haut)
2. "NEW PROJECT"
3. Nom: "mbeund-mi"
4. "CREATE"
```

### 1.3 Activer les APIs

```bash
# Cloud Run API
gcloud services enable run.googleapis.com

# Cloud Build API (pour construire l'image)
gcloud services enable cloudbuild.googleapis.com

# Artifact Registry API (pour stocker l'image)
gcloud services enable artifactregistry.googleapis.com

# Cloud Storage API (pour les media files)
gcloud services enable storage-api.googleapis.com
```

### 1.4 Définir le projet par défaut

```bash
gcloud config set project mbeund-mi
```

✅ **ÉTAPE 1 COMPLÈTE**

---

## **ÉTAPE 2: CRÉER .env.production (5 min)**

Créer le fichier `backend/.env.production`:

```env
# Django
DEBUG=False
SECRET_KEY=YOUR_VERY_SECRET_KEY_MIN_50_CHARS

# Hosts
ALLOWED_HOSTS=mbeund-mi-backend.run.app,localhost
CORS_ALLOWED_ORIGINS=https://mbeund-mi.vercel.app,http://localhost:3000

# Database - Neon (déjà en place)
DATABASE_URL=postgis://mbeund_mi_db_owner:PASSWORD@ep-plain-frog-b2ldjgwn-pooler.c-6.eu-central-1.aws.neon.tech/mbeund_mi_db?sslmode=require&channel_binding=require

# Redis - Upstash (déjà en place)
REDIS_URL=rediss://default:PASSWORD@bright-lioness-156590.upstash.io:6379
CELERY_BROKER_URL=rediss://default:PASSWORD@bright-lioness-156590.upstash.io:6379?ssl_cert_reqs=CERT_REQUIRED
CELERY_RESULT_BACKEND=rediss://default:PASSWORD@bright-lioness-156590.upstash.io:6379?ssl_cert_reqs=CERT_REQUIRED

# Twilio SMS
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=1206...
WHATSAPP_ACCESS_TOKEN=EAAB...

# External APIs
OPENWEATHER_API_KEY=...
OPENWEATHERMAP_API_KEY=...
GROQ_API_KEY=...
GEE_PROJECT_ID=...

# Environment
ENVIRONMENT=production
USE_GIS=True
```

⚠️ **Remplacer les valeurs par les vraies!**

✅ **ÉTAPE 2 COMPLÈTE**

---

## **ÉTAPE 3: CRÉER app.yaml (Configuration Cloud Run)**

Créer le fichier `backend/app.yaml`:

```yaml
runtime: python312

env: standard

entrypoint: gunicorn --bind :$PORT --workers 4 --worker-class sync --timeout 120 mbeund_mi_backend.wsgi:application

env_variables:
  DEBUG: "False"
  ENVIRONMENT: "production"
  USE_GIS: "True"

automatic_scaling:
  min_instances: 1
  max_instances: 100
```

✅ **ÉTAPE 3 COMPLÈTE**

---

## **ÉTAPE 4: VÉRIFIER requirements.txt**

```bash
# S'assurer que gunicorn est dans requirements.txt
grep gunicorn requirements.txt

# Si pas présent, l'ajouter:
echo "gunicorn==21.2.0" >> requirements.txt
```

✅ **ÉTAPE 4 COMPLÈTE**

---

## **ÉTAPE 5: DÉPLOYER (La partie facile!)**

### 5.1 Se placer dans le bon dossier

```bash
cd C:\Users\pc\Documents\PERSO\Mbeund-Mi\backend
```

### 5.2 Déployer

```bash
gcloud run deploy mbeund-mi-backend \
  --source . \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --env-vars-file .env.production \
  --memory 512Mi \
  --timeout 3600 \
  --max-instances 100
```

**Explication:**
- `--source .` : Utiliser le code du dossier courant
- `--platform managed` : Serverless (pas de serveur)
- `--region europe-west1` : Belgique (proche du Sénégal)
- `--allow-unauthenticated` : API publique
- `--env-vars-file .env.production` : Charger les variables
- `--memory 512Mi` : 512MB RAM
- `--timeout 3600` : 1 heure de timeout
- `--max-instances 100` : Auto-scale jusqu'à 100

### 5.3 Attendre le déploiement

```
Building with Buildpacks...
✓ Cloud Build successful
✓ Pushing to Artifact Registry
✓ Creating Cloud Run service...

Service URL: https://mbeund-mi-backend-xxxxxxxx.run.app
```

**COPIER CETTE URL!** ⬆️

✅ **ÉTAPE 5 COMPLÈTE - Backend est en ligne! 🎉**

---

## **ÉTAPE 6: VÉRIFIER QUE ÇA MARCHE**

### 6.1 Tester l'API

```bash
# Remplacer par votre URL
curl https://mbeund-mi-backend-xxxxxxxx.run.app/api/

# Doit retourner un JSON ou 401 (normal)
```

### 6.2 Voir les logs

```bash
# Logs temps réel
gcloud run logs read mbeund-mi-backend --region europe-west1 --follow

# Ou dans la Console:
# https://console.cloud.google.com/run
```

✅ **ÉTAPE 6 COMPLÈTE**

---

## **ÉTAPE 7: CONFIGURER LE FRONTEND**

Créer `.env.production.local` dans le dossier frontend:

```env
VITE_API_URL=https://mbeund-mi-backend-xxxxxxxx.run.app/api
VITE_WS_URL=wss://mbeund-mi-backend-xxxxxxxx.run.app/ws/alertes/
```

Déployer sur Vercel:

```bash
npm i -g vercel
cd C:\Users\pc\Documents\PERSO\Mbeund-Mi
vercel
```

✅ **ÉTAPE 7 COMPLÈTE**

---

## **ÉTAPE 8: TESTER COMPLET**

```
1. Ouvrir https://mbeund-mi.vercel.app
2. Register → OTP → Verify
3. Si ça marche → ✅ Succès!
```

---

## **RÉSUMÉ**

### ✅ Fait:
- Backend déployé sur Cloud Run (€0/mois)
- Frontend déployé sur Vercel (€0/mois)
- Database Neon (€0/mois)
- Cache Upstash (€0/mois)

### 📊 Coûts:
- **TOTAL: €0/mois** ✅

### 🎯 URLs:
- Backend: https://mbeund-mi-backend-xxxxxxxx.run.app
- Frontend: https://mbeund-mi.vercel.app

### ⏱️ Temps total: ~30 minutes

---

## **TROUBLESHOOTING SANS DOCKER**

### Erreur: "Build failed"
```bash
# Voir les détails du build
gcloud run deploy ... (avec --verbose)

# Ou voir dans Cloud Build:
https://console.cloud.google.com/cloud-build/builds
```

### Erreur: "requirements.txt not found"
```bash
# S'assurer que requirements.txt est à la racine de backend/
ls requirements.txt
```

### Erreur: "ModuleNotFoundError"
```bash
# Vérifier que requirements.txt a toutes les dépendances
pip list > requirements.txt
```

### API lente
```bash
# Augmenter la mémoire
gcloud run deploy mbeund-mi-backend \
  --memory 1Gi \
  --region europe-west1
```

---

## **C'EST TOUT!**

Vous avez déployé votre backend en production SANS Docker!

Google Cloud Buildpacks a:
✅ Détecté que c'est du Python
✅ Construit l'image automatiquement
✅ Déployé sur Cloud Run
✅ Tout gratuit!

**Prochaine étape: C) Security Audit** 🔒

