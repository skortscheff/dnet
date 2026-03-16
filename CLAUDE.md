# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Internet Toolkit** — an operator-first web platform for DNS, BGP, mail, reachability, and Internet diagnostics. The full product design is in `dnet-dercas.md`. The project is in the planning phase; implementation has not yet started.

## Development Commands

Once scaffolded per the planned structure, development will use Docker Compose:

```sh
# Start development stack
docker compose -f compose.yaml -f compose.dev.yaml up

# Start production stack
docker compose -f compose.yaml -f compose.prod.yaml up -d

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
                               → Worker (Celery/RQ) → Redis
```

**Fast path** (simple lookups): Nginx → API → Redis cache check → quick lookup → response
**Async path** (slow checks: SMTP, TLS scans, DNS traces): API enqueues job in Redis → Worker processes → result stored in Redis/PostgreSQL → frontend polls `/api/v1/jobs/{id}`

### Services

| Service | Tech | Purpose |
|---------|------|---------|
| `nginx` | Nginx | Reverse proxy, TLS termination, rate limiting |
| `frontend` | Next.js + TypeScript + Tailwind | UI, search, results rendering |
| `api` | FastAPI (Python) | Input detection, orchestration, caching, auth |
| `worker` | Celery or RQ (Python) | Async jobs: DNS traces, SMTP, TLS scans |
| `postgres` | PostgreSQL | Users, API keys, lookups, results, watchlists, alerts |
| `redis` | Redis | Response cache, job queue, rate-limit counters, job state |

### Backend Module Structure

`backend/app/` is organized by domain (not by layer):
- `dns/`, `bgp/`, `mail/`, `http_tls/`, `reachability/`, `reputation/`
- `auth/`, `lookup/`, `jobs/`
- Each module has its own API routes, service layer, provider integrations, and models

### Planned API Endpoints

```
POST /api/v1/search          # Universal input detection + routing
GET  /api/v1/ip/{ip}
GET  /api/v1/dns/{name}
GET  /api/v1/asn/{asn}
GET  /api/v1/prefix/{cidr}
GET  /api/v1/mail/{domain}
POST /api/v1/http/check
POST /api/v1/tls/check
GET  /api/v1/jobs/{id}
```

All responses include: normalized input, timestamp, summary section, raw details, health flags, and related pivot links.

## Key Architectural Rules

- **WSL is the host environment, not the architecture.** All services run in containers; nothing is installed directly on WSL.
- **Named volumes** for PostgreSQL, Redis, and storage data. **Bind mounts only** for source code in dev.
- Config comes exclusively from env files and mounted config files — never hardcoded.
- Workers must have bounded timeouts and strict target validation (SSRF prevention, no unbounded probing).
- Per-IP rate limiting and per-account quotas are required for all network-facing endpoints.

## Repository Structure (Planned)

```
network-toolkit/
├── compose.yaml / compose.dev.yaml / compose.prod.yaml
├── .env.example / .env.dev / .env.prod
├── Makefile
├── nginx/
├── frontend/          # Next.js app
├── backend/           # FastAPI app
│   └── app/api/ core/ services/ models/ schemas/ jobs/
│   └── migrations/
├── worker/            # Celery/RQ jobs
├── scripts/           # backup-db.sh, restore-db.sh, init-dev.sh
└── data/              # named volume mount points
```

## Development Phases

- **Phase 0:** Repository scaffolding + working Compose stack
- **Phase 1:** MVP — universal search, public IP, DNS lookup/trace, BGP summary, mail checks, HTTP/TLS checks, permalinks
- **Phase 2:** User accounts, saved results, API keys
- **Phase 3:** Watchlists, alerts, historical snapshots, team collaboration
