# Configuration Redis Cloud pour Production

## Pourquoi Redis en production?

- **Cache distribué:** Rate limiting cohérent entre workers
- **Message queue:** Celery broker pour SMS/IA/Weather tasks
- **Session store:** Peut être utilisé pour les sessions Django
- **Fallback:** Si Redis local n'existe pas en cloud

## Solutions Gratuit/Payant

| Service | Plan | Coût | Avantages |
|---------|------|------|-----------|
| **Upstash** ⭐ | Free | €0/mois | 10GB, suffisant pour dev/staging |
| AWS ElastiCache | t3.micro | €15/mois | Production grade, auto-scaling |
| Heroku Redis | Hobby-dev | €15/mois | Facile si sur Heroku |

---

## Configuration Upstash (Recommandé - GRATUIT)

### Étape 1: Créer compte Upstash

1. Aller à https://upstash.com
2. S'enregistrer (email + password)
3. Créer une nouvelle base de données Redis

### Étape 2: Copier les URL

1. Dans console Upstash, voir votre base de données
2. Copier:
   - `UPSTASH_REDIS_REST_URL` (REST API)
   - `UPSTASH_REDIS_REST_TOKEN` (Token)
   
   OU directement le URL complet:
   - `rediss://default:password@host.upstash.io:6379`

**Note:** `rediss://` (avec deux 's') = connexion TLS/SSL sécurisée

### Étape 3: Ajouter dans `.env.production`

```env
# Redis - Upstash Cloud
REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379

# Celery doit utiliser la même instance
CELERY_BROKER_URL=rediss://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379?ssl_cert_reqs=CERT_REQUIRED
CELERY_RESULT_BACKEND=rediss://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379?ssl_cert_reqs=CERT_REQUIRED
```

**Important:** `?ssl_cert_reqs=CERT_REQUIRED` est obligatoire pour Upstash avec Celery!

### Étape 4: Vérifier la connexion

```bash
# Tester connexion Redis
python << 'EOF'
import redis
import os

redis_url = "rediss://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379"
r = redis.from_url(redis_url, ssl_cert_reqs="required")
r.ping()
print("✅ Redis connecté!")
EOF
```

### Étape 5: Déployer

Une fois configuré:
```bash
# Environnement production
export ENVIRONMENT=production
export REDIS_URL=rediss://...
python manage.py runserver --settings=mbeund_mi_backend.settings.prod
```

---

## Configuration Celery avec Redis Cloud

### Worker Celery

```bash
# Lancer le worker Celery
export ENVIRONMENT=production
export DJANGO_SETTINGS_MODULE=mbeund_mi_backend.settings.prod
celery -A mbeund_mi_backend worker -l info
```

### Celery Beat (tâches périodiques)

```bash
# Lancer le scheduler
export ENVIRONMENT=production
export DJANGO_SETTINGS_MODULE=mbeund_mi_backend.settings.prod
celery -A mbeund_mi_backend beat -l info
```

**Ou avec supervisor/systemd pour que ça reste lancé:**

```bash
# /etc/systemd/system/celery-worker.service
[Unit]
Description=Celery Worker
After=network.target

[Service]
Type=forking
User=www-data
WorkingDirectory=/var/www/mbeund-mi/backend
Environment="ENVIRONMENT=production"
Environment="DJANGO_SETTINGS_MODULE=mbeund_mi_backend.settings.prod"
ExecStart=/usr/local/bin/celery multi start worker1 -A mbeund_mi_backend --pidfile=/var/run/celery/%n.pid --logfile=/var/log/celery/%n%I.log --loglevel=info
ExecStop=/usr/local/bin/celery multi stopwait worker1 --pidfile=/var/run/celery/%n.pid
Restart=on-failure
RestartSec=10s

[Install]
WantedBy=multi-user.target
```

---

## Tâches Celery lancées automatiquement

Une fois Redis + Worker/Beat configurés, ces tâches vont tourner automatiquement:

```
✅ envoyer_sms_alerte()         - SMS quand alerte créée
✅ appel_modele_ia()           - IA prédictions
✅ mettre_a_jour_previsions_meteo()   - Météo toutes les 3h
✅ predire_risques_avec_random_forest()  - RF prédictions toutes les 6h
✅ analyse_gee_periodique()    - Satellite toutes les 12h
```

---

## Dépannage

### "Connection refused"
```
→ URL Redis incorrecte
→ Vérifier REDIS_URL dans .env
→ Tester avec redis-cli: redis-cli -u "rediss://..."
```

### "SSL: CERTIFICATE_VERIFY_FAILED"
```
→ Ajouter ?ssl_cert_reqs=CERT_REQUIRED à l'URL
→ Ou utiliser ?ssl_cert_reqs=CERT_NONE (moins sécurisé)
```

### Celery worker pas lancé
```
→ Vérifier: ps aux | grep celery
→ Vérifier logs: tail -f /var/log/celery/worker1.log
→ Vérifier REDIS_URL: echo $REDIS_URL
```

---

## Monitoring

Une fois en production, surveiller:

```bash
# Voir les tâches en queue
celery -A mbeund_mi_backend inspect active

# Voir les stats du worker
celery -A mbeund_mi_backend inspect stats

# Voir les tâches échouées
celery -A mbeund_mi_backend events
```

Ou utiliser une UI comme Flower:
```bash
pip install flower
celery -A mbeund_mi_backend -B flower
# Accès: http://localhost:5555
```

---

## Checklist

- [ ] Créer compte Upstash
- [ ] Créer base de données Redis
- [ ] Copier URL Redis
- [ ] Ajouter dans `.env.production`
- [ ] Tester connexion Redis localement
- [ ] Configurer `ENVIRONMENT=production`
- [ ] Lancer Celery worker
- [ ] Lancer Celery beat
- [ ] Vérifier tâches dans queue: `celery -A mbeund_mi_backend inspect active`

