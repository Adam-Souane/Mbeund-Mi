#!/bin/bash
# =============================================================================
# deploy.sh – Script de déploiement/mise à jour du backend Mbeund-Mi
# Usage : ./scripts/deploy.sh [--no-build]
# Emplacement sur le VPS : /opt/mbeund-mi/scripts/deploy.sh
# =============================================================================

set -euo pipefail

# Configuration
DEPLOY_DIR="/opt/mbeund-mi"
BRANCH="feature/backend-mama-adam"
COMPOSE_FILE="$DEPLOY_DIR/docker-compose.yml"
LOG_FILE="/var/log/mbeund-deploy.log"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# Couleurs pour la sortie
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[DEPLOY]${NC} $1"
    echo "[$TIMESTAMP] $1" >> "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    echo "[$TIMESTAMP] WARN: $1" >> "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "[$TIMESTAMP] ERROR: $1" >> "$LOG_FILE"
    exit 1
}

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "$COMPOSE_FILE" ]; then
    error "docker-compose.yml introuvable dans $DEPLOY_DIR. Exécuter depuis le bon répertoire."
fi

cd "$DEPLOY_DIR"

echo ""
echo -e "${BLUE}=============================================================${NC}"
echo -e "${BLUE}   Mbeund-Mi — Script de déploiement${NC}"
echo -e "${BLUE}   $(date)${NC}"
echo -e "${BLUE}=============================================================${NC}"
echo ""

# ---------------------------------------------------------------------------
# 1. Vérifier que .env existe
# ---------------------------------------------------------------------------
log "Vérification du fichier .env..."
if [ ! -f ".env" ]; then
    error ".env introuvable ! Copier .env.production.example vers .env et le remplir."
fi

# Vérifier DEBUG=False
if grep -q "^DEBUG=True" .env; then
    error "DEBUG=True détecté dans .env ! Ne pas déployer en production avec DEBUG=True."
fi
log "DEBUG=False ✓"

# ---------------------------------------------------------------------------
# 2. Sauvegarder la base de données avant la mise à jour
# ---------------------------------------------------------------------------
log "Sauvegarde préventive de la base de données..."
if docker compose ps db | grep -q "Up"; then
    ./scripts/backup.sh || warn "La sauvegarde a échoué — continuer quand même (vérifier manuellement)"
else
    warn "Le conteneur DB n'est pas en cours d'exécution — pas de sauvegarde."
fi

# ---------------------------------------------------------------------------
# 3. Pull des dernières modifications du repo
# ---------------------------------------------------------------------------
log "Pull des dernières modifications (branche $BRANCH)..."
git fetch origin
git checkout "$BRANCH" || error "Impossible de basculer sur la branche $BRANCH"
git pull origin "$BRANCH" || error "Impossible de pull depuis origin/$BRANCH"
log "Code à jour ✓"

# ---------------------------------------------------------------------------
# 4. Build des images Docker (sauf si --no-build)
# ---------------------------------------------------------------------------
if [[ "${1:-}" != "--no-build" ]]; then
    log "Construction des images Docker..."
    docker compose build --no-cache web celery-worker celery-beat
    log "Images construites ✓"
else
    warn "Construction des images ignorée (--no-build)."
fi

# ---------------------------------------------------------------------------
# 5. Arrêt propre du stack (sans supprimer les volumes)
# ---------------------------------------------------------------------------
log "Arrêt propre des services en cours..."
docker compose down --remove-orphans
log "Services arrêtés ✓"

# ---------------------------------------------------------------------------
# 6. Démarrer le stack avec les nouvelles images
# ---------------------------------------------------------------------------
log "Démarrage du stack avec les nouvelles images..."
docker compose up -d
log "Stack démarré ✓"

# ---------------------------------------------------------------------------
# 7. Attendre que les services soient prêts (max 120s)
# ---------------------------------------------------------------------------
log "Attente que les services soient prêts..."
TIMEOUT=120
ELAPSED=0
INTERVAL=5

until docker compose exec -T web python manage.py check --deploy 2>/dev/null; do
    ELAPSED=$((ELAPSED + INTERVAL))
    if [ "$ELAPSED" -ge "$TIMEOUT" ]; then
        error "Timeout : les services ne sont pas prêts après ${TIMEOUT}s. Vérifier : docker compose logs web"
    fi
    echo "  ... attente ($ELAPSED/${TIMEOUT}s)"
    sleep $INTERVAL
done

log "Services prêts ✓"

# ---------------------------------------------------------------------------
# 8. Vérification finale
# ---------------------------------------------------------------------------
echo ""
log "=== État du stack ==="
docker compose ps

echo ""
log "=== Vérification API ==="
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://mbeundmi.sn/admin/login/ 2>/dev/null || echo "N/A")
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "302" ]; then
    log "API accessible — HTTP $HTTP_STATUS ✓"
else
    warn "API inaccessible ou retourne HTTP $HTTP_STATUS. Vérifier les logs."
fi

# ---------------------------------------------------------------------------
# 9. Nettoyer les anciennes images
# ---------------------------------------------------------------------------
log "Nettoyage des images inutilisées..."
docker image prune -f
log "Nettoyage terminé ✓"

echo ""
echo -e "${GREEN}=============================================================${NC}"
echo -e "${GREEN}   ✅ Déploiement terminé avec succès !${NC}"
echo -e "${GREEN}   $(date)${NC}"
echo -e "${GREEN}=============================================================${NC}"
echo ""

echo "Logs de déploiement disponibles : $LOG_FILE"
