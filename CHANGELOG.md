# Changelog

All notable changes to this project are documented here.

---

## [Unreleased] — Phase 3

### Added
- **Watchlists** — users can track domains, IPs, ASNs, and prefixes with configurable check intervals (5 min – 24 hours)
- **Alerts** — webhook notifications fired when a watchlist item's result changes between snapshots
- **Snapshots** — historical result records stored per watchlist item; viewable via `GET /api/v1/watchlists/{id}/snapshots`
- **Teams** — shared workspaces; owners can invite/remove members and associate watchlists with a team
- New backend modules: `watchlists/`, `alerts/`, `snapshots/`, `teams/`
- New API endpoints: `/api/v1/watchlists`, `/api/v1/alerts`, `/api/v1/teams`
- Celery beat task (`check_due_watchlists`) runs every 5 minutes to dispatch per-item snapshot jobs
- Worker task (`run_watchlist_check`) performs a fresh lookup, stores a snapshot, and fires webhooks on change
- Database migration `f590bd2007a9` adds: `teams`, `team_members`, `watchlists`, `alerts`, `snapshots` tables
- Frontend pages: `/watchlists`, `/alerts`, `/teams`
- Sidebar updated with Watchlists, Alerts, and Teams links

---

## [Phase 2] — 2026-03-16

### Added
- User accounts with email/password registration and JWT authentication
- API key management (create, list, revoke)
- Saved results — users can bookmark any lookup permalink
- Dashboard page listing saved results
- Settings page for API key management
- Login and register pages
- `auth/`, `api_keys/`, `saved_results/` backend modules
- Database migrations for users, api_keys, saved_results tables

---

## [Phase 1] — 2026-03-16

### Added
- Universal search endpoint (`POST /api/v1/search`) with input type detection (IPv4, IPv6, domain, ASN, prefix, URL)
- Public IP lookup (`GET /api/v1/ip/{ip}`) — PTR, ASN, geolocation
- DNS lookup (`GET /api/v1/dns/{name}`) — A, AAAA, MX, TXT, NS, SOA, CNAME, CAA, DNSKEY
- BGP/ASN summary (`GET /api/v1/asn/{asn}`, `GET /api/v1/prefix/{cidr}`) — RPKI, origin, visibility
- Mail health checks (`GET /api/v1/mail/{domain}`) — MX, SPF, DKIM, DMARC, blocklists
- HTTP/TLS inspection (`POST /api/v1/http/check`, `POST /api/v1/tls/check`) — certs, headers, redirect chains
- Permalink storage and retrieval (`GET /api/v1/lookup/{id}`)
- Shodan-style frontend with Next.js + Tailwind; search, result, and permalink pages
- `dns/`, `bgp/`, `mail/`, `http_tls/`, `ip/`, `lookup/` backend modules
- Result pages at `/r/{permalink_id}`

---

## [Phase 0] — 2026-03-16

### Added
- Repository scaffolded: `compose.yaml`, `compose.dev.yaml`, `compose.prod.yaml`
- Six containerized services: nginx, frontend (Next.js), api (FastAPI), worker (Celery), postgres, redis
- Nginx reverse proxy routing traffic to frontend and API
- Environment file pattern: `.env.example`, `.env.dev`, `.env.prod`
- Alembic migration framework wired to async SQLAlchemy
- Celery worker connected to Redis broker
- `Makefile` with common dev commands
- Product design document (`dnet-dercas.md`)
