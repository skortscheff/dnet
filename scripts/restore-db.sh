#!/usr/bin/env bash
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "Restoring database from ${BACKUP_FILE}..."
gunzip -c "$BACKUP_FILE" | docker compose exec -T postgres psql -U toolkit toolkit
echo "Restore complete."
