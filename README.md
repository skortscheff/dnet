# Internet Toolkit

An operator-first network diagnostics platform. Paste any domain, IP, ASN, prefix, URL, or email header into one search box and get DNS, BGP, mail, TLS, and reachability analysis — all in one place.

---

## What it does

Instead of juggling a dozen separate tools, Internet Toolkit fans a single input out across multiple diagnostic lenses simultaneously:

| Toolkit | Checks |
|---------|--------|
| **Public IP** | IPv4/IPv6 detection, rDNS, ASN, geo |
| **DNS** | A/AAAA/MX/TXT/NS/SOA, DNSSEC, propagation, authoritative trace |
| **BGP / Routing** | ASN lookup, prefix origin, RPKI, MOAS, route history |
| **Reachability** | TCP port tests, HTTP checks, redirect chains, latency |
| **Mail** | MX/SPF/DKIM/DMARC, SMTP test, blocklists, MTA-STS |
| **TLS / HTTP** | Cert inspection, SAN, ciphers/protocols, security headers |
| **Reputation** | Blocklist status, mail/DNS/domain health scores |

---

## Architecture

Six containerized services. Only nginx is exposed to the host.

```
User → Nginx (80/443) → Frontend (Next.js)
                      → API (FastAPI) → PostgreSQL
                                      → Redis (cache + job queue)
                                      → Worker (Celery) → Redis
```

**Fast path** — simple lookups hit the API directly and return from the Redis cache or a quick network call.

**Async path** — slow checks (SMTP, TLS scans, DNS traces) are enqueued in Redis, processed by the worker, and the frontend polls `/api/v1/jobs/{id}` for completion.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Docker | 29+ |
| Docker Compose | v2+ |
| Git | any |

All services run in containers. Nothing else needs to be installed on the host.

---

## Getting started

```sh
# First-time setup: builds images, starts dependencies, runs migrations
make init-dev

# Start the full stack
make up
```

Then open `http://localhost` in your browser.

Verify the API is healthy:
```sh
curl http://localhost/api/v1/health
# {"status":"ok"}
```

---

## Common commands

```sh
make up           # Start dev stack (foreground)
make down         # Stop and remove containers
make build        # Rebuild all images
make logs         # Tail all service logs
make ps           # Show container status
make shell-api    # Open a shell in the API container
make shell-worker # Open a shell in the worker container
make migrate      # Run pending Alembic migrations
```

---

## Configuration

Copy `.env.example` to `.env.dev` and adjust as needed (already done by `make init-dev`):

```sh
cp .env.example .env.dev
```

Key variables:

| Variable | Purpose |
|----------|---------|
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `DATABASE_URL` | Full async database URL for the API |
| `REDIS_URL` | Redis connection string |
| `SECRET_KEY` | API signing key — **change in production** |
| `CORS_ORIGINS` | Allowed origins for CORS |

`.env.dev` and `.env.prod` are gitignored. Never commit secrets.

---

## Project layout

```
dnet-tools/
├── compose.yaml            # Base service definitions
├── compose.dev.yaml        # Dev overrides (bind mounts, hot reload)
├── compose.prod.yaml       # Prod overrides (restart policies)
├── .env.example            # Config template
├── Makefile                # Developer shortcuts
├── nginx/                  # Reverse proxy config
├── frontend/
│   └── src/
│       ├── app/            # Next.js pages (/, /login, /register, /dashboard, /r/[id], /settings/api-keys)
│       ├── components/
│       │   ├── Navbar.tsx  # Auth-aware top bar
│       │   ├── Sidebar.tsx # Dashboard/settings nav
│       │   └── results/    # IP, DNS, BGP, mail, HTTP, TLS result cards
│       └── lib/            # API client, auth context, shared types
├── backend/
│   ├── app/
│   │   ├── main.py         # FastAPI entrypoint
│   │   ├── core/           # Config, dependencies
│   │   ├── api/            # Route handlers
│   │   ├── dns/            # DNS toolkit module
│   │   ├── bgp/            # BGP/routing module
│   │   ├── mail/           # Mail toolkit module
│   │   ├── http_tls/       # TLS/HTTP module
│   │   ├── reachability/   # Reachability module
│   │   ├── reputation/     # Reputation module
│   │   ├── auth/           # Registration, login, JWT
│   │   ├── api_keys/       # API key management
│   │   ├── saved_results/  # User-linked lookup history
│   │   ├── lookup/         # Universal search + input detection
│   │   └── jobs/           # Async job definitions
│   ├── migrations/         # Alembic migrations
│   └── alembic.ini
├── worker/                 # Celery worker entrypoint
└── scripts/                # init-dev.sh, backup-db.sh, restore-db.sh
```

---

## API

Interactive docs available at `http://localhost/api/docs` when the stack is running.

Implemented endpoints:

```
# Diagnostics (Phase 1)
POST /api/v1/search          # Universal input detection + routing
GET  /api/v1/ip/{ip}         # Geo, ASN, rDNS
GET  /api/v1/dns/{name}      # A/AAAA/MX/NS/TXT/SOA/CNAME/CAA
GET  /api/v1/asn/{asn}       # ASN overview, announced prefixes
GET  /api/v1/prefix/{cidr}   # Prefix overview + RPKI validation
GET  /api/v1/mail/{domain}   # MX/SPF/DKIM/DMARC/MTA-STS/BIMI
POST /api/v1/http/check      # Redirect chain + security headers
POST /api/v1/tls/check       # Cert inspection, SANs, expiry, cipher
GET  /api/v1/lookup/{id}     # Retrieve permalink by ID (7-day TTL)

# Auth (Phase 2)
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me

# API Keys (Phase 2)
POST   /api/v1/api-keys
GET    /api/v1/api-keys
DELETE /api/v1/api-keys/{id}

# Saved Results (Phase 2)
POST   /api/v1/saved-results
GET    /api/v1/saved-results
DELETE /api/v1/saved-results/{id}
```

---

## Database migrations

```sh
# Apply all pending migrations
make migrate

# Inside the api container, use Alembic directly
docker compose -f compose.yaml -f compose.dev.yaml exec api alembic revision --autogenerate -m "description"
docker compose -f compose.yaml -f compose.dev.yaml exec api alembic upgrade head
docker compose -f compose.yaml -f compose.dev.yaml exec api alembic downgrade -1
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

## Production

```sh
# Start with production overrides (requires .env.prod)
docker compose -f compose.yaml -f compose.prod.yaml up -d
```

To move to a new Linux host:
1. Install Docker and Docker Compose
2. Clone this repository
3. Provide `.env.prod`
4. Restore the database from backup if needed
5. `docker compose -f compose.yaml -f compose.prod.yaml up -d`

---

## Roadmap

| Phase | Scope |
|-------|-------|
| **0 — Scaffold** ✅ | Working Compose stack, all 6 services boot |
| **1 — MVP** ✅ | Universal search, public IP, DNS, BGP, mail, TLS/HTTP, permalinks |
| **2 — Accounts** ✅ | User auth, saved results, API keys |
| **3 — Premium** | Watchlists, alerts, historical snapshots, team workspaces |
