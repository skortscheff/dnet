# Internet Toolkit

An operator-first network diagnostics platform. Paste any domain, IP, ASN, prefix, URL, or email address into one search box and get DNS, BGP, mail, TLS, and reachability analysis — all in one place.

---

## What it does

Instead of juggling a dozen separate tools, Internet Toolkit fans a single input out across multiple diagnostic lenses simultaneously:

| Toolkit | Checks |
|---------|--------|
| **Public IP** | IPv4/IPv6 detection, rDNS, ASN, geo |
| **DNS** | A/AAAA/MX/TXT/NS/SOA, DNSSEC, propagation, authoritative trace |
| **BGP / Routing** | ASN lookup, prefix origin, RPKI, MOAS, route history |
| **Mail** | MX/SPF/DKIM/DMARC/MTA-STS/BIMI health check |
| **TLS / HTTP** | Cert inspection, SANs, ciphers/protocols, security headers |
| **Reachability** | TCP port tests, HTTP checks, redirect chains |

---

## Requirements

| Tool | Minimum version |
|------|----------------|
| [Docker](https://docs.docker.com/engine/install/) | 24+ |
| [Docker Compose](https://docs.docker.com/compose/install/) | v2 (plugin) |
| Git | any |

Nothing else needs to be installed on the host. All services run in containers.

---

## Quick start (development)

```sh
git clone https://github.com/skortscheff/dnet.git
cd dnet-tools

# First-time setup: builds images, starts deps, runs migrations
make init-dev

# Start the full stack (hot reload enabled)
make up
```

Open `http://localhost` in your browser.

```sh
curl http://localhost/api/v1/health
# {"status":"ok"}
```

---

## Deploy to production

### Option A — one command

```sh
git clone https://github.com/skortscheff/dnet.git
cd dnet-tools
bash scripts/deploy.sh
```

This will:
1. Check that Docker and Docker Compose are installed
2. Generate `.env.prod` with random secrets (if it doesn't exist yet)
3. Build all container images
4. Start PostgreSQL and Redis and wait for them to be healthy
5. Run all database migrations
6. Start the full stack with `restart: always` on every service

> **Before running in production**, review `.env.prod` and set `CORS_ORIGINS` to your actual domain.

---

### Option B — manual steps

```sh
# 1. Clone and enter the repo
git clone https://github.com/skortscheff/dnet.git
cd dnet-tools

# 2. Create the production environment file
cp .env.example .env.prod
# Edit .env.prod — change POSTGRES_PASSWORD, SECRET_KEY, CORS_ORIGINS
# Generate a secret key:  openssl rand -hex 32

# 3. Build images
make prod-build

# 4. Run migrations (starts postgres/redis temporarily)
docker compose -f compose.yaml -f compose.prod.yaml up -d postgres redis
docker compose -f compose.yaml -f compose.prod.yaml run --rm api alembic upgrade head

# 5. Start everything
make prod-up
```

---

### Updating an existing deployment

```sh
git pull
make prod-build
make prod-migrate   # only if there are new migrations
make prod-up        # recreates containers with new images
```

---

## HTTPS / TLS

By default nginx listens on port 80 only. To add HTTPS:

### Step 1 — get a certificate

```sh
# On the host (not inside a container)
apt install certbot
certbot certonly --standalone -d yourdomain.com
# Certificates are written to /etc/letsencrypt/live/yourdomain.com/
```

> Certbot needs port 80 free while it runs. Stop nginx first:
> `docker compose -f compose.yaml -f compose.prod.yaml stop nginx`

### Step 2 — mount the certs into nginx

Add to `compose.prod.yaml` under the `nginx` service:

```yaml
nginx:
  restart: always
  volumes:
    - /etc/letsencrypt:/etc/letsencrypt:ro
```

### Step 3 — replace the nginx config

```sh
cp nginx/conf.d/ssl.conf.example nginx/conf.d/default.conf
# Edit nginx/conf.d/default.conf — replace "yourdomain.com" with your domain
```

### Step 4 — restart nginx

```sh
docker compose -f compose.yaml -f compose.prod.yaml up -d --no-deps nginx
```

### Certificate renewal

Add a cron job on the host to auto-renew:

```sh
# /etc/cron.d/certbot-renew
0 3 * * * root certbot renew --quiet \
  --pre-hook "docker compose -f /path/to/dnet-tools/compose.yaml -f /path/to/dnet-tools/compose.prod.yaml stop nginx" \
  --post-hook "docker compose -f /path/to/dnet-tools/compose.yaml -f /path/to/dnet-tools/compose.prod.yaml start nginx"
```

---

## Configuration

All configuration comes from environment files. Copy `.env.example` to `.env.dev` or `.env.prod` and adjust:

| Variable | Purpose |
|----------|---------|
| `POSTGRES_DB` | Database name |
| `POSTGRES_USER` | Database user |
| `POSTGRES_PASSWORD` | Database password — **change in production** |
| `DATABASE_URL` | Full async DB URL — must match credentials above |
| `REDIS_URL` | Redis connection string |
| `SECRET_KEY` | JWT signing key — **change in production** (`openssl rand -hex 32`) |
| `ENVIRONMENT` | `development` or `production` |
| `CORS_ORIGINS` | JSON array of allowed origins, e.g. `["https://yourdomain.com"]` |

`.env.dev` and `.env.prod` are gitignored. Never commit them.

---

## Common commands

### Development

```sh
make up           # Start dev stack (foreground, hot reload)
make down         # Stop and remove containers
make build        # Rebuild all images
make logs         # Tail all service logs
make ps           # Show container status
make shell-api    # Open a shell in the API container
make shell-worker # Open a shell in the worker container
make migrate      # Run pending Alembic migrations
make init-dev     # First-time setup (build + deps + migrate)
```

### Production

```sh
make deploy       # First-time deploy (guided)
make prod-up      # Start production stack (detached)
make prod-down    # Stop production stack
make prod-build   # Rebuild production images
make prod-logs    # Tail production logs
make prod-ps      # Show production container status
make prod-migrate # Run pending migrations in production
```

---

## Architecture

Six containerized services. Only nginx is exposed to the host (ports 80/443). All other services communicate via an internal Docker bridge network.

```
User → Nginx (80/443)
         ├── → Frontend (Next.js :3000)
         └── → API (FastAPI :8000) → PostgreSQL
                                   → Redis (cache + job queue)
                                   → Worker (Celery) → Redis
```

**Fast path** — simple lookups hit the API, check the Redis cache, make a quick network call, return immediately.

**Async path** — slow checks (SMTP, full TLS scans, DNS traces) are enqueued in Redis, processed by the Celery worker, and the frontend polls `/api/v1/jobs/{id}` for completion.

### Services

| Service | Image | Purpose |
|---------|-------|---------|
| `nginx` | nginx:1.27-alpine | Reverse proxy, rate limiting, TLS termination |
| `frontend` | Node.js 22 (multi-stage) | Next.js 15 UI |
| `api` | Python 3.12 slim | FastAPI — input detection, lookups, auth, caching |
| `worker` | Python 3.12 slim | Celery — async jobs, watchlist checks, webhooks |
| `postgres` | postgres:16-alpine | Primary data store |
| `redis` | redis:7-alpine | Response cache, job queue, rate-limit counters |

---

## API

Interactive docs: `http://localhost/api/docs`

```
# Diagnostics
POST /api/v1/search            Universal input detection + routing
GET  /api/v1/ip/{ip}           Geo, ASN, rDNS
GET  /api/v1/dns/{name}        A/AAAA/MX/NS/TXT/SOA/CNAME/CAA/DNSKEY
GET  /api/v1/asn/{asn}         ASN overview, announced prefixes
GET  /api/v1/prefix/{cidr}     Prefix overview + RPKI validation
GET  /api/v1/mail/{domain}     MX/SPF/DKIM/DMARC/MTA-STS/BIMI
POST /api/v1/http/check        Redirect chain + security headers
POST /api/v1/tls/check         Cert inspection, SANs, expiry, cipher
GET  /api/v1/lookup/{id}       Retrieve permalink by ID (7-day TTL)

# Auth
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me

# API Keys
POST   /api/v1/api-keys
GET    /api/v1/api-keys
DELETE /api/v1/api-keys/{id}

# Saved Results
POST   /api/v1/saved-results
GET    /api/v1/saved-results
DELETE /api/v1/saved-results/{id}

# Watchlists / Alerts / Teams (Phase 3)
GET    /api/v1/watchlists
POST   /api/v1/watchlists
DELETE /api/v1/watchlists/{id}
GET    /api/v1/watchlists/{id}/snapshots
GET    /api/v1/alerts
POST   /api/v1/alerts
PATCH  /api/v1/alerts/{id}
DELETE /api/v1/alerts/{id}
GET    /api/v1/teams
POST   /api/v1/teams
DELETE /api/v1/teams/{id}
GET    /api/v1/teams/{id}/members
POST   /api/v1/teams/{id}/members
DELETE /api/v1/teams/{id}/members/{user_id}
```

---

## Database migrations

```sh
# Apply all pending migrations (dev)
make migrate

# Apply all pending migrations (prod)
make prod-migrate

# Generate a new migration after model changes
docker compose -f compose.yaml -f compose.dev.yaml exec api \
    alembic revision --autogenerate -m "short description"

# Roll back one migration
docker compose -f compose.yaml -f compose.dev.yaml exec api \
    alembic downgrade -1
```

---

## Corporate / enterprise networks (SSL inspection)

Most users can skip this section.

If your Docker host sits behind a firewall that performs **SSL/TLS inspection** (also called MITM decryption or "SSL decryption"), outbound HTTPS from inside the containers will fail certificate verification because the intercepting firewall substitutes its own CA-signed certificate. You need to inject your organisation's internal CA into the container images.

> **The corporate CA certificate is private company property. Never commit it to this repository or any public git host.**

To add your CA:

```sh
# 1. Copy the CA bundle to the repo (gitignored — will not be committed)
cp /path/to/your-corporate-ca.crt backend/corporate-ca.crt
```

Then edit `backend/Dockerfile` and `worker/Dockerfile` — both files have a commented block near the top showing exactly which two lines to uncomment:

```dockerfile
# Uncomment these two lines:
COPY backend/corporate-ca.crt /usr/local/share/ca-certificates/corporate-ca.crt
# (update-ca-certificates in the RUN step below picks it up automatically)
```

Rebuild with `make build` (dev) or `make prod-build` (prod). The standard `update-ca-certificates` call already present in the `RUN` step will install your CA alongside the system roots.

Add `backend/corporate-ca.crt` to `.gitignore` if it isn't already:

```sh
echo "backend/corporate-ca.crt" >> .gitignore
```

---

## Backup and restore

```sh
# Dump the database to ./data/backups/
bash scripts/backup-db.sh

# Restore from a specific dump file
bash scripts/restore-db.sh ./data/backups/toolkit_20260316_120000.sql.gz
```

---

## Project layout

```
dnet-tools/
├── compose.yaml              Base service definitions
├── compose.dev.yaml          Dev overrides (bind mounts, hot reload)
├── compose.prod.yaml         Prod overrides (restart policies, prod build target)
├── .env.example              Config template — copy to .env.dev or .env.prod
├── Makefile                  Developer shortcuts
├── scripts/
│   ├── deploy.sh             One-command production deploy
│   ├── init-dev.sh           First-time dev setup
│   ├── backup-db.sh          pg_dump to ./data/backups/
│   └── restore-db.sh         Restore from backup file
├── nginx/
│   ├── nginx.conf            Rate limiting, global settings
│   └── conf.d/
│       ├── default.conf      HTTP reverse proxy config (active)
│       └── ssl.conf.example  HTTPS config template (copy → default.conf for TLS)
├── frontend/
│   ├── Dockerfile            Multi-stage: dev target / runner target (prod)
│   └── src/
│       ├── app/              Next.js pages
│       ├── components/
│       │   ├── Navbar.tsx
│       │   ├── Sidebar.tsx
│       │   └── results/      IP, DNS, BGP, Mail, HTTP, TLS result cards
│       └── lib/              API client, auth context, shared types
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── app/
│   │   ├── main.py           FastAPI entrypoint
│   │   ├── core/             Config, dependencies
│   │   ├── dns/              DNS toolkit module
│   │   ├── bgp/              BGP/routing module
│   │   ├── mail/             Mail health module
│   │   ├── http_tls/         TLS/HTTP module
│   │   ├── ip/               IP intelligence module
│   │   ├── auth/             Registration, login, JWT
│   │   ├── api_keys/         API key management
│   │   ├── saved_results/    User-linked lookup history
│   │   ├── watchlists/       Watchlist CRUD
│   │   ├── alerts/           Webhook alert CRUD
│   │   ├── snapshots/        Historical result records
│   │   ├── teams/            Team workspaces
│   │   └── lookup/           Universal search + input detection
│   └── migrations/           Alembic migration files
├── worker/
│   ├── Dockerfile
│   └── main.py               Celery entrypoint + beat schedule
└── data/                     Named volume mount points (gitignored)
```

---

## Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| **0 — Scaffold** | Working Compose stack, all 6 services boot | ✅ |
| **1 — MVP** | Universal search, DNS, BGP, mail, TLS/HTTP, permalinks | ✅ |
| **2 — Accounts** | User auth, saved results, API keys | ✅ |
| **3 — Premium** | Watchlists, alerts, historical snapshots, team workspaces | ✅ |
