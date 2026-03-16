#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="./data/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/toolkit_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "Backing up database to ${BACKUP_FILE}..."
docker compose exec postgres pg_dump -U toolkit toolkit | gzip > "$BACKUP_FILE"
echo "Backup complete: ${BACKUP_FILE}"
