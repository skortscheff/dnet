#!/usr/bin/env bash
set -euo pipefail

echo "==> Initializing development environment..."

# Copy env file if not already present
if [ ! -f .env.dev ]; then
  cp .env.example .env.dev
  echo "    Created .env.dev from .env.example — review and update any secrets."
fi

# Build all images
echo "==> Building images..."
docker compose -f compose.yaml -f compose.dev.yaml build

# Start dependencies
echo "==> Starting postgres and redis..."
docker compose -f compose.yaml -f compose.dev.yaml up -d postgres redis

# Wait for postgres to be ready
echo "==> Waiting for PostgreSQL..."
until docker compose -f compose.yaml -f compose.dev.yaml exec postgres \
    pg_isready -U toolkit -d toolkit > /dev/null 2>&1; do
  sleep 1
done
echo "    PostgreSQL ready."

# Run migrations
echo "==> Running database migrations..."
docker compose -f compose.yaml -f compose.dev.yaml run --rm api \
    alembic upgrade head

echo ""
echo "==> Done. Run 'make up' to start the full stack."
