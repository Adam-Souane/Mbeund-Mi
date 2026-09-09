#!/bin/bash
# =============================================================================
# backup.sh – Sauvegarde PostgreSQL du backend Mbeund-Mi
# Usage : ./scripts/backup.sh
# Emplacement sur le VPS : /opt/mbeund-mi/scripts/backup.sh
# Cron recommandé : 0 2 * * * /opt/mbeund-mi/scripts/backup.sh
# =============================================================================

set -euo pipefail

# Configuration
DEPLOY_DIR="/opt/mbeund-mi"
BACKUP_DIR="/opt/mbeund-mi/backups"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="/var/log/mbeund-backup.log"

# Charger les variables d'environnement
if [ -f "$DEPLOY_DIR/.env" ]; then
    # Extraire les variables nécessaires sans sourcer le fichier complet
    POSTGRES_DB=$(grep "^POSTGRES_DB=" "$DEPLOY_DIR/.env" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    POSTGRES_USER=$(grep "^POSTGRES_USER=" "$DEPLOY_DIR/.env" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    POSTGRES_PASSWORD=$(grep "^POSTGRES_PASSWORD=" "$DEPLOY_DIR/.env" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
else
    echo "[BACKUP ERROR] Fichier .env introuvable dans $DEPLOY_DIR"
    exit 1
fi

# Vérifier que les variables sont définies
if [ -z "$POSTGRES_DB" ] || [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_PASSWORD" ]; then
    echo "[BACKUP ERROR] Variables PostgreSQL manquantes dans .env"
    exit 1
fi

BACKUP_FILENAME="mbeund_mi_backup_${TIMESTAMP}.sql.gz"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILENAME"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] [BACKUP] Démarrage de la sauvegarde..." | tee -a "$LOG_FILE"

# ---------------------------------------------------------------------------
# 1. Créer le répertoire de backup si nécessaire
# ---------------------------------------------------------------------------
mkdir -p "$BACKUP_DIR"

# ---------------------------------------------------------------------------
# 2. Vérifier que le conteneur DB est en cours d'exécution
# ---------------------------------------------------------------------------
cd "$DEPLOY_DIR"
if ! docker compose ps db 2>/dev/null | grep -q "Up"; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [BACKUP ERROR] Le conteneur 'db' n'est pas démarré !" | tee -a "$LOG_FILE"
    exit 1
fi

# ---------------------------------------------------------------------------
# 3. Exécuter pg_dump via Docker
# ---------------------------------------------------------------------------
echo "[$(date '+%Y-%m-%d %H:%M:%S')] [BACKUP] Dump PostgreSQL en cours..." | tee -a "$LOG_FILE"

PGPASSWORD="$POSTGRES_PASSWORD" docker compose exec -T db \
    pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-password \
    | gzip > "$BACKUP_PATH"

if [ $? -eq 0 ] && [ -f "$BACKUP_PATH" ]; then
    BACKUP_SIZE=$(du -sh "$BACKUP_PATH" | cut -f1)
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [BACKUP] ✅ Sauvegarde créée : $BACKUP_FILENAME ($BACKUP_SIZE)" | tee -a "$LOG_FILE"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [BACKUP ERROR] Échec du dump PostgreSQL !" | tee -a "$LOG_FILE"
    rm -f "$BACKUP_PATH"
    exit 1
fi

# ---------------------------------------------------------------------------
# 4. Rotation des sauvegardes (supprimer les fichiers > RETENTION_DAYS jours)
# ---------------------------------------------------------------------------
echo "[$(date '+%Y-%m-%d %H:%M:%S')] [BACKUP] Rotation des sauvegardes (conservation : ${RETENTION_DAYS} jours)..." | tee -a "$LOG_FILE"

DELETED_COUNT=$(find "$BACKUP_DIR" -name "mbeund_mi_backup_*.sql.gz" -mtime +$RETENTION_DAYS | wc -l)
find "$BACKUP_DIR" -name "mbeund_mi_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

if [ "$DELETED_COUNT" -gt 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [BACKUP] $DELETED_COUNT ancienne(s) sauvegarde(s) supprimée(s)." | tee -a "$LOG_FILE"
fi

# ---------------------------------------------------------------------------
# 5. Afficher la liste des sauvegardes existantes
# ---------------------------------------------------------------------------
echo "[$(date '+%Y-%m-%d %H:%M:%S')] [BACKUP] Sauvegardes existantes dans $BACKUP_DIR :" | tee -a "$LOG_FILE"
ls -lh "$BACKUP_DIR"/mbeund_mi_backup_*.sql.gz 2>/dev/null | tee -a "$LOG_FILE" || echo "  (aucune)"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] [BACKUP] Terminé." | tee -a "$LOG_FILE"

# ---------------------------------------------------------------------------
# RESTAURATION (instructions commentées)
# ---------------------------------------------------------------------------
# Pour restaurer une sauvegarde :
#
#   cd /opt/mbeund-mi
#
#   # Arrêter les services qui utilisent la DB (sauf db)
#   docker compose stop web celery-worker celery-beat
#
#   # Restaurer le dump
#   gunzip -c backups/mbeund_mi_backup_YYYYMMDD_HHMMSS.sql.gz | \
#       docker compose exec -T db \
#       psql -U mbeund_user -d mbeund_mi_db
#
#   # Redémarrer les services
#   docker compose start web celery-worker celery-beat
# ---------------------------------------------------------------------------
