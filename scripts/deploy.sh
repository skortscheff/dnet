#!/usr/bin/env bash
# deploy.sh — Production deployment script for Internet Toolkit
# Usage: bash scripts/deploy.sh [--update]
set -euo pipefail

# Always run from the repo root regardless of where the script is invoked from
cd "$(dirname "$0")/.."

COMPOSE="docker compose -f compose.yaml -f compose.prod.yaml"

print() { echo "==> $*"; }
die()   { echo "ERROR: $*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Prerequisites
# ---------------------------------------------------------------------------
command -v docker >/dev/null 2>&1         || die "Docker not installed. See https://docs.docker.com/engine/install/"
docker compose version >/dev/null 2>&1   || die "Docker Compose v2 not found. Update Docker Desktop or install the plugin."
docker info >/dev/null 2>&1              || die "Docker daemon is not running."

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------
if [ ! -f .env.prod ]; then
  print "No .env.prod found — creating from template with random secrets..."

  command -v openssl >/dev/null 2>&1 || die "openssl is required to generate secrets. Install it or create .env.prod manually."

  SECRET_KEY=$(openssl rand -hex 32)
  DB_PASS=$(openssl rand -hex 16)

  sed \
    -e "s/change_me_in_prod/${DB_PASS}/g" \
    -e "s/ENVIRONMENT=development/ENVIRONMENT=production/" \
    .env.example > .env.prod

  # Replace the generic SECRET_KEY placeholder with a real one
  sed -i "s/SECRET_KEY=${DB_PASS}/SECRET_KEY=${SECRET_KEY}/" .env.prod

  # Also fix DATABASE_URL which contains the password
  sed -i "s|postgresql+asyncpg://toolkit:${DB_PASS}@|postgresql+asyncpg://toolkit:${DB_PASS}@|" .env.prod

  echo ""
  echo "  .env.prod created. IMPORTANT — review and update:"
  echo "    - CORS_ORIGINS: set to your actual domain (e.g. [\"https://yourdomain.com\"])"
  echo "    - POSTGRES_PASSWORD and DATABASE_URL must match"
  echo ""
  cat .env.prod
  echo ""
  read -rp "  Press Enter to continue with these settings, or Ctrl+C to edit .env.prod first: "
fi

# Validate .env.prod doesn't have placeholder secrets
if grep -q "change_me_in_prod" .env.prod 2>/dev/null; then
  die ".env.prod still contains placeholder values. Edit it before deploying."
fi

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
print "Building images..."
$COMPOSE build

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
print "Starting PostgreSQL and Redis..."
$COMPOSE up -d postgres redis

print "Waiting for PostgreSQL to be ready..."
until $COMPOSE exec -T postgres pg_isready -U toolkit -d toolkit >/dev/null 2>&1; do
  sleep 2
done
print "PostgreSQL ready."

print "Running database migrations..."
$COMPOSE run --rm api alembic upgrade head

# ---------------------------------------------------------------------------
# Start all services
# ---------------------------------------------------------------------------
print "Starting all services..."
$COMPOSE up -d

echo ""
echo "======================================================"
echo "  Deployment complete."
echo "======================================================"
echo ""
echo "  URL:    http://$(hostname -I | awk '{print $1}' 2>/dev/null || echo 'your-server-ip')"
echo "  Health: curl http://localhost/api/v1/health"
echo ""
echo "  Useful commands:"
echo "    docker compose -f compose.yaml -f compose.prod.yaml ps"
echo "    docker compose -f compose.yaml -f compose.prod.yaml logs -f"
echo "    docker compose -f compose.yaml -f compose.prod.yaml down"
echo ""
echo "  To enable HTTPS, see: nginx/conf.d/ssl.conf.example"
echo "======================================================"
