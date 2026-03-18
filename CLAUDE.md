# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Internet Toolkit** — an operator-first web platform for DNS, BGP, mail, reachability, and Internet diagnostics. The full product design is in `dnet-dercas.md`. **Phases 0–3 are complete and running.**

## Development Commands

```sh
# Start development stack
docker compose -f compose.yaml -f compose.dev.yaml up

# Start production stack
docker compose -f compose.yaml -f compose.prod.yaml up -d

# Rebuild after dependency changes
docker compose build api worker

# Run database migrations
docker compose exec api alembic upgrade head

# Generate a new migration (after changing models)
docker compose exec api alembic revision --autogenerate -m "description"
# NOTE: migrations/ is not bind-mounted — copy the generated file from the container:
# docker compose exec api cat /app/migrations/versions/<file>.py > backend/migrations/versions/<file>.py

# Individual service logs
docker compose logs -f api
docker compose logs -f worker
```

Environment configuration uses `.env.dev` for local development and `.env.prod` for deployment. Copy `.env.example` to get started.

## Architecture

Six containerized services orchestrated via Docker Compose. Only **nginx** exposes ports to the host (80/443); all other services communicate via an internal Docker network using Compose service names.

```
User → Nginx → Frontend (Next.js)
             → API (FastAPI)   → PostgreSQL
                               → Redis (cache + job queue)
                               → Worker (Celery) → Redis
```

**Fast path** (simple lookups): Nginx → API → Redis cache check → quick lookup → response
**Async path** (watchlist checks): Celery beat → Worker task → fresh lookup → snapshot stored → webhook fired on change

### Services

| Service | Tech | Purpose |
|---------|------|---------|
| `nginx` | Nginx | Reverse proxy, TLS termination, rate limiting |
| `frontend` | Next.js + TypeScript + Tailwind | UI, search, results rendering |
| `api` | FastAPI (Python) | Input detection, orchestration, caching, auth |
| `worker` | Celery (Python) | Async jobs: watchlist checks, snapshots, alert dispatch |
| `postgres` | PostgreSQL | Users, API keys, lookups, results, watchlists, alerts, snapshots, teams |
| `redis` | Redis | Response cache, job queue, rate-limit counters, job state |

### Backend Module Structure

`backend/app/` is organized by domain:
- `dns/`, `bgp/`, `mail/`, `http_tls/`, `ip/` — lookup modules (router + service each)
- `auth/`, `api_keys/`, `saved_results/` — Phase 2 account features
- `watchlists/`, `alerts/`, `snapshots/`, `teams/` — Phase 3 monitoring features
- `lookup/` — universal input detector, schema, permalink store
- `jobs/` — Celery task definitions (`watchlist_tasks.py`)
- `core/` — config, database session, dependencies
- `reachability/`, `reputation/` — stubs, not yet implemented

### API Endpoints

```
POST /api/v1/search              # Universal input detection + routing
GET  /api/v1/ip/{ip}
GET  /api/v1/dns/{name}
GET  /api/v1/asn/{asn}
GET  /api/v1/asn/{asn}/prefixes
GET  /api/v1/asn/{asn}/neighbours
GET  /api/v1/asn/{asn}/whois
GET  /api/v1/prefix/{cidr}
GET  /api/v1/mail/{domain}
POST /api/v1/http/check
POST /api/v1/tls/check
GET  /api/v1/lookup/{permalink_id}

POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me

GET/POST        /api/v1/api-keys
DELETE          /api/v1/api-keys/{id}
GET/POST        /api/v1/saved-results
DELETE          /api/v1/saved-results/{id}

GET/POST        /api/v1/watchlists
GET/DELETE      /api/v1/watchlists/{id}
GET             /api/v1/watchlists/{id}/snapshots

GET/POST        /api/v1/alerts
PATCH/DELETE    /api/v1/alerts/{id}

GET/POST        /api/v1/teams
GET/DELETE      /api/v1/teams/{id}
GET/POST        /api/v1/teams/{id}/members
DELETE          /api/v1/teams/{id}/members/{user_id}
```

## Key Architectural Rules

- **WSL is the host environment, not the architecture.** All services run in containers; nothing is installed directly on WSL.
- **Named volumes** for PostgreSQL, Redis, and storage data. **Bind mounts only** for source code in dev (`backend/app` and `frontend`).
- The `backend/migrations/` directory is **not** bind-mounted — generate migrations inside the container then copy the file to the host.
- Config comes exclusively from env files and mounted config files — never hardcoded.
- Workers must have bounded timeouts and strict target validation (SSRF prevention, no unbounded probing).
- Per-IP rate limiting and per-account quotas are required for all network-facing endpoints.

## Repository Structure

```
dnet-tools/
├── CHANGELOG.md
├── compose.yaml / compose.dev.yaml / compose.prod.yaml
├── .env.example / .env.dev / .env.prod
├── Makefile
├── nginx/
├── frontend/                  # Next.js app
│   └── src/app/               # Pages: /, /r/[id], /dashboard, /watchlists,
│                              #         /alerts, /teams, /login, /register, /settings
│   └── src/lib/               # auth.tsx, api.ts, types.ts
│   └── src/components/        # Sidebar, etc.
├── backend/
│   ├── app/                   # FastAPI app (bind-mounted in dev)
│   │   ├── main.py
│   │   ├── core/              # config, database
│   │   ├── auth/ api_keys/ saved_results/
│   │   ├── watchlists/ alerts/ snapshots/ teams/
│   │   ├── dns/ bgp/ mail/ http_tls/ ip/ lookup/
│   │   ├── reachability/ reputation/   # stubs
│   │   └── jobs/              # Celery tasks
│   └── migrations/            # Alembic (NOT bind-mounted)
├── worker/
│   └── main.py                # Celery app + beat schedule
└── scripts/                   # backup-db.sh, restore-db.sh, init-dev.sh
```

## Development Phases

- **Phase 0:** ✅ Repository scaffolding + working Compose stack
- **Phase 1:** ✅ MVP — universal search, public IP, DNS, BGP, mail, HTTP/TLS, permalinks
- **Phase 2:** ✅ User accounts, saved results, API keys
- **Phase 3:** ✅ Watchlists, alerts, historical snapshots, team collaboration
