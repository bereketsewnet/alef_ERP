#!/bin/bash

# =============================================================================
#  ALEF DELTA ERP - Storage Cleanup Script
#  Safely frees disk space without touching running containers, volumes,
#  or any active system. Safe to run while the system is live.
# =============================================================================

set -e
cd "$(dirname "$0")"

# ── colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

echo ""
echo -e "${BOLD}==========================================${RESET}"
echo -e "${BOLD}  ALEF DELTA ERP - Storage Cleanup${RESET}"
echo -e "${BOLD}==========================================${RESET}"
echo ""

# ── helper: human-readable bytes ─────────────────────────────────────────────
hr() { du -sh "$1" 2>/dev/null | cut -f1; }

# ── snapshot disk before ─────────────────────────────────────────────────────
BEFORE_AVAIL=$(df -h / | awk 'NR==2{print $4}')
BEFORE_PCT=$(df / | awk 'NR==2{print $5}')

echo -e "${CYAN}Disk before cleanup:${RESET}  $BEFORE_PCT used  ($BEFORE_AVAIL free)"
echo ""

# ── what will be cleaned ─────────────────────────────────────────────────────
echo -e "${BOLD}What this script will clean:${RESET}"
echo "  [1] Docker build cache (unused layers only)"
echo "  [2] Dangling Docker images (untagged, not used by any container)"
echo "  [3] Unused tagged images (images with no running container)"
echo "  [4] Host node_modules for staff & member_portal"
echo "       (Docker builds them inside the container — safe to delete)"
echo "  [5] npm cache (~/.npm)"
echo "  [6] Laravel application log (truncated, not deleted)"
echo "  [7] System journal logs older than 7 days"
echo ""
echo -e "${GREEN}Will NOT touch:${RESET}"
echo "  ✓ Running containers"
echo "  ✓ Docker volumes (database data)"
echo "  ✓ Active images used by running containers"
echo "  ✓ backend/vendor (mounted into container)"
echo "  ✓ Any system or OS files"
echo ""

# ── confirmation ─────────────────────────────────────────────────────────────
if [[ "$1" != "--yes" && "$1" != "-y" ]]; then
    echo -e "${YELLOW}Proceed with cleanup? [y/N]${RESET} \c"
    read -r CONFIRM
    if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
        echo "Aborted."
        exit 0
    fi
fi

echo ""

# ── step 1: Docker build cache ────────────────────────────────────────────────
echo -e "${BOLD}[1/7] Docker build cache...${RESET}"
CACHE_BEFORE=$(docker system df 2>/dev/null | awk '/Build Cache/{print $4}')
docker builder prune -f --filter "until=24h" >/dev/null 2>&1 || true
# Also prune ALL reclaimable cache (layers not referenced by any current image)
docker builder prune -f >/dev/null 2>&1 || true
CACHE_AFTER=$(docker system df 2>/dev/null | awk '/Build Cache/{print $4}')
echo -e "    Build cache: ${RED}${CACHE_BEFORE}${RESET} → ${GREEN}${CACHE_AFTER}${RESET}"

# ── step 2: dangling images ───────────────────────────────────────────────────
echo -e "${BOLD}[2/7] Dangling images (untagged)...${RESET}"
DANGLING=$(docker images -f "dangling=true" -q)
if [ -n "$DANGLING" ]; then
    COUNT=$(echo "$DANGLING" | wc -l | tr -d ' ')
    docker image prune -f >/dev/null 2>&1 || true
    echo -e "    Removed ${RED}${COUNT}${RESET} dangling image(s)."
else
    echo "    None found — skipping."
fi

# ── step 3: unused tagged images ─────────────────────────────────────────────
echo -e "${BOLD}[3/7] Unused tagged images...${RESET}"

# Collect image IDs that are actively used by running or stopped containers
ACTIVE_IMAGE_IDS=$(docker ps -a --format '{{.Image}}' | xargs -I{} docker inspect {} --format '{{.Id}}' 2>/dev/null | sort -u)

REMOVED_IMAGES=0
SKIPPED_IMAGES=0

while IFS= read -r line; do
    IMG_ID=$(echo "$line" | awk '{print $3}')
    IMG_NAME=$(echo "$line" | awk '{print $1":"$2}')

    # Skip if this image ID is in use by any container
    if echo "$ACTIVE_IMAGE_IDS" | grep -q "$IMG_ID"; then
        SKIPPED_IMAGES=$((SKIPPED_IMAGES + 1))
        continue
    fi

    # Skip <none> entries (handled by step 2)
    if [[ "$IMG_NAME" == *"<none>"* ]]; then
        continue
    fi

    echo -e "    Removing unused image: ${YELLOW}${IMG_NAME}${RESET}"
    docker rmi "$IMG_ID" >/dev/null 2>&1 && REMOVED_IMAGES=$((REMOVED_IMAGES + 1)) || true

done < <(docker images --format '{{.Repository}} {{.Tag}} {{.ID}}')

if [ "$REMOVED_IMAGES" -eq 0 ]; then
    echo "    No unused tagged images found."
else
    echo -e "    Removed ${RED}${REMOVED_IMAGES}${RESET} unused image(s)."
fi

# ── step 4: host node_modules ─────────────────────────────────────────────────
echo -e "${BOLD}[4/7] Host node_modules...${RESET}"

DIRS=(
    "staff/node_modules"
    "member_portal/node_modules"
)

for DIR in "${DIRS[@]}"; do
    if [ -d "$DIR" ]; then
        SIZE=$(hr "$DIR")
        rm -rf "$DIR"
        echo -e "    Removed ${YELLOW}${DIR}${RESET} (${SIZE})"
    else
        echo "    ${DIR} — not found, skipping."
    fi
done

# ── step 5: npm cache ─────────────────────────────────────────────────────────
echo -e "${BOLD}[5/7] npm cache...${RESET}"
if [ -d "$HOME/.npm" ]; then
    SIZE=$(hr "$HOME/.npm")
    npm cache clean --force >/dev/null 2>&1 || true
    echo -e "    Cleared npm cache (${SIZE})"
else
    echo "    No npm cache found — skipping."
fi

# ── step 6: Laravel logs ──────────────────────────────────────────────────────
echo -e "${BOLD}[6/7] Laravel application log...${RESET}"
BACKEND_CONTAINER=$(docker ps --format '{{.Names}}' | grep -i "erp_backend\|erp-backend" | head -1)
if [ -n "$BACKEND_CONTAINER" ]; then
    LOG_SIZE=$(docker exec "$BACKEND_CONTAINER" du -sh /var/www/html/storage/logs/laravel.log 2>/dev/null | cut -f1 || echo "?")
    docker exec "$BACKEND_CONTAINER" bash -c "> /var/www/html/storage/logs/laravel.log" 2>/dev/null || true
    echo -e "    Truncated laravel.log (was ${LOG_SIZE}) in ${BACKEND_CONTAINER}"
else
    echo "    Backend container not running — skipping."
fi

# ── step 7: system journal ────────────────────────────────────────────────────
echo -e "${BOLD}[7/7] System journal logs (older than 7 days)...${RESET}"
JOURNAL_BEFORE=$(journalctl --disk-usage 2>/dev/null | grep -o '[0-9.]\+[MGK]B' | head -1 || echo "?")
sudo journalctl --vacuum-time=7d >/dev/null 2>&1 || true
JOURNAL_AFTER=$(journalctl --disk-usage 2>/dev/null | grep -o '[0-9.]\+[MGK]B' | head -1 || echo "?")
echo -e "    Journal: ${RED}${JOURNAL_BEFORE}${RESET} → ${GREEN}${JOURNAL_AFTER}${RESET}"

# ── verify containers still healthy ──────────────────────────────────────────
echo ""
echo -e "${BOLD}Verifying running containers...${RESET}"
ALL_OK=true
while IFS= read -r line; do
    NAME=$(echo "$line" | awk '{print $1}')
    STATUS=$(echo "$line" | awk '{print $2}')
    if [[ "$STATUS" == "Up" ]]; then
        echo -e "    ${GREEN}✓${RESET} $NAME"
    else
        echo -e "    ${RED}✗${RESET} $NAME — $STATUS"
        ALL_OK=false
    fi
done < <(docker ps --format '{{.Names}} {{.Status}}' | awk '{print $1, $2}')

if [ "$ALL_OK" = false ]; then
    echo -e "\n${RED}WARNING: Some containers are not running. Check with: docker ps -a${RESET}"
fi

# ── final report ─────────────────────────────────────────────────────────────
AFTER_AVAIL=$(df -h / | awk 'NR==2{print $4}')
AFTER_PCT=$(df / | awk 'NR==2{print $5}')

echo ""
echo -e "${BOLD}==========================================${RESET}"
echo -e "${BOLD}  Cleanup Complete${RESET}"
echo -e "${BOLD}==========================================${RESET}"
echo -e "  Before: ${RED}${BEFORE_PCT}${RESET} used  (${BEFORE_AVAIL} free)"
echo -e "  After:  ${GREEN}${AFTER_PCT}${RESET} used  (${AFTER_AVAIL} free)"
echo ""
echo -e "${CYAN}Docker storage summary:${RESET}"
docker system df
echo ""
echo -e "${YELLOW}Tip:${RESET} Run this script anytime disk usage looks high."
echo -e "     Pass ${BOLD}--yes${RESET} to skip the confirmation prompt."
echo ""
