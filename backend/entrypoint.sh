#!/bin/bash
# =============================================================================
# entrypoint.sh – Script de démarrage du conteneur Django/Gunicorn
# Ordre : attendre PostgreSQL → migrate → collectstatic → gunicorn
# =============================================================================

set -e

echo "==================================================================="
echo "  Mbeund-Mi Backend – Démarrage du conteneur Django"
echo "==================================================================="

# ---------------------------------------------------------------------------
# 1. Attendre que PostgreSQL soit prêt
# ---------------------------------------------------------------------------
echo "[entrypoint] Attente de PostgreSQL..."

# Extraire host et port depuis DATABASE_URL (format: postgis://user:pass@host:port/db)
if [ -n "$DATABASE_URL" ]; then
    DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:]+):.*|\1|')
    DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
else
    DB_HOST="${POSTGRES_HOST:-db}"
    DB_PORT="${POSTGRES_PORT:-5432}"
fi

echo "[entrypoint] Connexion à PostgreSQL sur $DB_HOST:$DB_PORT..."

MAX_RETRIES=30
RETRY_COUNT=0

until pg_isready -h "$DB_HOST" -p "$DB_PORT" -q; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
        echo "[entrypoint] ERREUR: PostgreSQL inaccessible après $MAX_RETRIES tentatives."
        exit 1
    fi
    echo "[entrypoint] PostgreSQL non disponible, attente... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

echo "[entrypoint] PostgreSQL est prêt !"

# ---------------------------------------------------------------------------
# 2. Appliquer les migrations Django
# ---------------------------------------------------------------------------
echo "[entrypoint] Application des migrations..."
python manage.py migrate --noinput
echo "[entrypoint] Migrations appliquées."

# ---------------------------------------------------------------------------
# 3. Collecter les fichiers statiques
# ---------------------------------------------------------------------------
echo "[entrypoint] Collecte des fichiers statiques..."
python manage.py collectstatic --noinput --clear
echo "[entrypoint] Fichiers statiques collectés."

# ---------------------------------------------------------------------------
# 4. Créer un superutilisateur par défaut si aucun n'existe (optionnel)
# ---------------------------------------------------------------------------
echo "[entrypoint] Vérification du superutilisateur..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser('admin', 'admin@mbeundmi.sn', 'admin1234')
    print('[entrypoint] Superutilisateur admin créé (mot de passe: admin1234)')
else:
    print('[entrypoint] Un superutilisateur existe déjà.')
" 2>/dev/null || true

# ---------------------------------------------------------------------------
# 5. Lancer Gunicorn
# ---------------------------------------------------------------------------
echo "[entrypoint] Démarrage de Gunicorn sur 0.0.0.0:8000..."
exec gunicorn mbeund_mi_backend.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 2 \
    --threads 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --log-level info
