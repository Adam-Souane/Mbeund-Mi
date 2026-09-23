# B) DÉPLOIEMENT GOOGLE CLOUD RUN - Guide Complet

**Objectif:** Déployer le backend Django sur Google Cloud Run (GRATUIT)

**Durée estimée:** 30-45 minutes

**Coût:** €0 (free tier permanent)

---

## **ÉTAPE 0: PRÉREQUIS**

Avant de commencer, assurez-vous d'avoir:

- ✅ Compte Google Cloud (gratuit)
- ✅ Google Cloud CLI (`gcloud`) installé
- ✅ Docker installé (pour build local)
- ✅ Repository git du projet

### Installer Google Cloud CLI:

```bash
# Windows
https://cloud.google.com/sdk/docs/install#windows
→ Télécharger et installer l'installateur

# Mac/Linux
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

Vérifier installation:
```bash
gcloud --version
```

---

## **ÉTAPE 1: CRÉER PROJET GOOGLE CLOUD (5 min)**

### 1.1 Aller sur Console Google Cloud
```
https://console.cloud.google.com/
```

### 1.2 Créer un nouveau projet
```
1. Cliquer sur "Select a Project" (en haut)
2. "NEW PROJECT"
3. Nom: "mbeund-mi" (ou votre choix)
4. Cliquer "CREATE"
5. Attendre quelques secondes
```

### 1.3 Activer Cloud Run API
```
1. Aller à: https://console.cloud.google.com/apis/library/run.googleapis.com
2. Cliquer "ENABLE"
3. Attendre (30 secondes)
```

### 1.4 Activer Artifact Registry API
```
1. Aller à: https://console.cloud.google.com/apis/library/artifactregistry.googleapis.com
2. Cliquer "ENABLE"
3. Attendre
```

### 1.5 Créer Cloud Storage Bucket (pour media files)
```bash
gsutil mb gs://mbeund-mi-media/
```

✅ **ÉTAPE 1 COMPLÈTE**

---

## **ÉTAPE 2: CONFIGURER .env.production (5 min)**

Créer le fichier `.env.production` dans le dossier `backend/`:

```env
# ============================================================================
# Django Settings
# ============================================================================
DEBUG=False
SECRET_KEY=YOUR_VERY_SECRET_KEY_MIN_50_CHARS_HERE

# Hosts
ALLOWED_HOSTS=mbeund-mi-backend.run.app,localhost
CORS_ALLOWED_ORIGINS=https://mbeund-mi.vercel.app,http://localhost:3000

# ============================================================================
# Database - Neon (déjà configuré)
# ============================================================================
DATABASE_URL=postgis://mbeund_mi_db_owner:PASSWORD@ep-plain-frog-b2ldjgwn-pooler.c-6.eu-central-1.aws.neon.tech/mbeund_mi_db?sslmode=require&channel_binding=require

# ============================================================================
# Redis - Upstash (déjà configuré)
# ============================================================================
REDIS_URL=rediss://default:PASSWORD@bright-lioness-156590.upstash.io:6379
CELERY_BROKER_URL=rediss://default:PASSWORD@bright-lioness-156590.upstash.io:6379?ssl_cert_reqs=CERT_REQUIRED
CELERY_RESULT_BACKEND=rediss://default:PASSWORD@bright-lioness-156590.upstash.io:6379?ssl_cert_reqs=CERT_REQUIRED

# ============================================================================
# Twilio SMS
# ============================================================================
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# ============================================================================
# WhatsApp (meta)
# ============================================================================
WHATSAPP_PHONE_NUMBER_ID=1206...
WHATSAPP_ACCESS_TOKEN=EAAB...

# ============================================================================
# External APIs
# ============================================================================
OPENWEATHER_API_KEY=...
OPENWEATHERMAP_API_KEY=...
GROQ_API_KEY=...
GEE_PROJECT_ID=...

# ============================================================================
# Cloud Storage - Google Cloud
# ============================================================================
GCS_BUCKET_NAME=mbeund-mi-media
USE_GIS=True

# ============================================================================
# Environment
# ============================================================================
ENVIRONMENT=production
USE_GIS=True
```

**⚠️ IMPORTANT:** 
- Remplacer les `PASSWORD` par vos vraies valeurs (Neon, Upstash)
- Remplacer les `...` par vos vraies clés API
- Ne PAS committer ce fichier (il est dans .gitignore)

✅ **ÉTAPE 2 COMPLÈTE**

---

## **ÉTAPE 3: CRÉER DOCKERFILE (Fichier fourni)**

Voir le fichier `Dockerfile` dans le même dossier que ce guide.

Le Dockerfile:
- ✅ Utilise Python 3.12
- ✅ Installe les dépendances
- ✅ Collecte les fichiers statiques
- ✅ Lance Gunicorn sur port 8080

✅ **ÉTAPE 3 COMPLÈTE** (fichier fourni)

---

## **ÉTAPE 4: CRÉER .dockerignore (Fichier fourni)**

Voir le fichier `.dockerignore` dans le même dossier.

Empêche les gros fichiers d'être inclus dans l'image Docker.

✅ **ÉTAPE 4 COMPLÈTE** (fichier fourni)

---

## **ÉTAPE 5: AUTHENTIFIER AVEC GOOGLE CLOUD**

```bash
# Authentifier gcloud avec votre compte
gcloud auth login

# Définir le projet
gcloud config set project mbeund-mi

# Vérifier que c'est bon
gcloud config list
# Doit afficher: project = mbeund-mi
```

✅ **ÉTAPE 5 COMPLÈTE**

---

## **ÉTAPE 6: DÉPLOYER SUR CLOUD RUN (10-15 min)**

### 6.1 Vérifier que vous êtes dans le bon dossier

```bash
cd C:\Users\pc\Documents\PERSO\Mbeund-Mi\backend
ls  # Devrait afficher: Dockerfile, manage.py, requirements.txt, etc.
```

### 6.2 Déployer

```bash
gcloud run deploy mbeund-mi-backend \
  --source . \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars-file .env.production \
  --memory 512Mi \
  --timeout 3600 \
  --max-instances 100
```

**Explication des flags:**
- `--source .` : Build depuis le dossier courant
- `--platform managed` : Serverless (pas d'EC2)
- `--region europe-west1` : Data center Belgique (proche du Sénégal)
- `--allow-unauthenticated` : Accessible sans authentification (API publique)
- `--set-env-vars-file .env.production` : Charger les variables d'environnement
- `--memory 512Mi` : RAM (512MB suffisant)
- `--timeout 3600` : Timeout 1h (pour tâches longues)
- `--max-instances 100` : Auto-scale jusqu'à 100 instances

### 6.3 Attendre le déploiement

```
Building using Buildpacks...
✓ Cloud Build successful
✓ Pushing to Artifact Registry
✓ Creating Cloud Run service...

Service URL: https://mbeund-mi-backend-xxxxxxxx.run.app
```

**Copier cette URL!** Vous en aurez besoin pour le frontend.

✅ **ÉTAPE 6 COMPLÈTE** - Backend est en ligne! 🎉

---

## **ÉTAPE 7: VÉRIFIER QUE ÇA MARCHE (5 min)**

### 7.1 Tester l'API

```bash
# Remplacer par votre URL
curl https://mbeund-mi-backend-xxxxxxxx.run.app/api/

# Doit retourner un JSON ou 401 Unauthorized (c'est OK)
```

### 7.2 Tester l'authentification

```bash
curl -X POST https://mbeund-mi-backend-xxxxxxxx.run.app/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}'

# Doit retourner: {"detail":"No active account found..."}
# ou {"access":"...", "refresh":"..."}
```

### 7.3 Vérifier dans Google Cloud Console

```
1. Aller à https://console.cloud.google.com/run
2. Cliquer sur "mbeund-mi-backend"
3. Voir les logs en temps réel
4. Vérifier que aucune erreur
```

✅ **ÉTAPE 7 COMPLÈTE**

---

## **ÉTAPE 8: CONFIGURER LE FRONTEND (Vercel)**

Maintenant que le backend est en ligne, configurer le frontend.

### 8.1 Ajouter URL du backend au frontend

Créer `.env.production.local` dans le dossier frontend (`C:\Users\pc\Documents\PERSO\Mbeund-Mi\`):

```env
VITE_API_URL=https://mbeund-mi-backend-xxxxxxxx.run.app/api
VITE_WS_URL=wss://mbeund-mi-backend-xxxxxxxx.run.app/ws/alertes/
```

### 8.2 Déployer Frontend sur Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Aller dans le dossier frontend
cd C:\Users\pc\Documents\PERSO\Mbeund-Mi

# Déployer
vercel

# Répondre aux questions:
# - Set up and deploy? Yes
# - Which scope? Your name
# - Link to existing project? No
# - Project name? mbeund-mi
# - Directory? .
# - Override settings? No
```

**Copier l'URL Vercel!** (exemple: https://mbeund-mi.vercel.app)

✅ **ÉTAPE 8 COMPLÈTE**

---

## **ÉTAPE 9: CONFIGURER CELERY WORKER**

Les tâches async (SMS, IA, météo) ont besoin d'un worker Celery.

### Option A: Cloud Run Worker (Recommandé)

```bash
gcloud run deploy mbeund-mi-worker \
  --source . \
  --platform managed \
  --region europe-west1 \
  --no-allow-unauthenticated \
  --set-env-vars-file .env.production \
  --args "celery,-A,mbeund_mi_backend,worker,-l,info" \
  --memory 512Mi \
  --timeout 3600
```

### Option B: Celery Beat (Tâches périodiques)

```bash
gcloud run deploy mbeund-mi-beat \
  --source . \
  --platform managed \
  --region europe-west1 \
  --no-allow-unauthenticated \
  --set-env-vars-file .env.production \
  --args "celery,-A,mbeund_mi_backend,beat,-l,info" \
  --memory 256Mi \
  --timeout 3600
```

✅ **ÉTAPE 9 COMPLÈTE** (optionnel, mais recommandé)

---

## **ÉTAPE 10: VÉRIFIER LES LOGS (Monitoring)**

Voir ce qui se passe en production:

```bash
# Logs du backend
gcloud run logs read mbeund-mi-backend --region europe-west1 --limit 50

# Logs du worker
gcloud run logs read mbeund-mi-worker --region europe-west1 --limit 50

# Suivi en temps réel
gcloud run logs read mbeund-mi-backend --region europe-west1 --follow
```

Ou dans Google Cloud Console:
```
https://console.cloud.google.com/run
→ Cliquer sur le service
→ Onglet "Logs"
```

✅ **ÉTAPE 10 COMPLÈTE**

---

## **ÉTAPE 11: TESTER COMPLET (Frontend + Backend)**

### 11.1 Ouvrir le frontend

```
https://mbeund-mi.vercel.app
```

### 11.2 Tester le workflow OTP

```
1. Cliquer "Register"
2. Créer un compte citoyen
3. Attendre OTP par SMS/WhatsApp
4. Entrer le code OTP
5. Être redirigé vers dashboard

✅ Si ça marche → Déploiement réussi!
```

### 11.3 Tester les erreurs

```
1. Essayer d'accéder sans authentification
2. Vérifier les messages d'erreur
3. Vérifier que les logs apparaissent
```

✅ **ÉTAPE 11 COMPLÈTE**

---

## **RÉSUMÉ - B) CLOUD DEPLOYMENT**

### ✅ Fait:
- ✅ Projet Google Cloud créé
- ✅ Backend déployé sur Cloud Run (gratuit)
- ✅ Frontend déployé sur Vercel (gratuit)
- ✅ Celery Worker configuré
- ✅ Logs en monitoring
- ✅ Test complet réussi

### 📊 Coûts:
- Backend (Cloud Run): €0/mois (free tier)
- Frontend (Vercel): €0/mois (free tier)
- Database (Neon): €0/mois (free tier)
- Cache (Upstash): €0/mois (free tier)
- **TOTAL: €0/mois** ✅

### 🎯 URLs:
- **Backend API:** https://mbeund-mi-backend-xxxxxxxx.run.app
- **Frontend:** https://mbeund-mi.vercel.app
- **Database:** Neon (déjà en place)
- **Cache:** Upstash (déjà en place)

---

## **PROCHAINES ÉTAPES:**

**C) Security Audit** - Vérifier la sécurité
**D) Performance** - Optimiser la performance
**E) Documentation** - Documenter tout
**F) Test Coverage** - Améliorer les tests

---

## **TROUBLESHOOTING**

### Erreur: "Permission denied"
```
Solution: gcloud auth login
```

### Erreur: "Service not found"
```
Solution: Vérifier que Cloud Run API est activée
```

### Erreur: "Build failed"
```
Solution: Vérifier les logs avec:
gcloud run logs read mbeund-mi-backend --region europe-west1
```

### API lente
```
Solution: Augmenter la mémoire:
gcloud run deploy mbeund-mi-backend --memory 1Gi
```

### Trop de requêtes (429)
```
Solution: 
- Vérifier rate limiting dans settings.prod.py
- Augmenter max-instances
- C'est normal pour les tests
```

---

## **SUPPORT**

Documentation complète: https://cloud.google.com/run/docs
Discord/Chat support: Disponible 24/7

