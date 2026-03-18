# Changelog

All notable changes to this project are documented here.

---

## [Unreleased] — Dark theme palette picker

### Added
- **`frontend/src/lib/theme.tsx`** — `PALETTES` constant defining 4 dark color schemes (Navy, Slate, Forest, Midnight); each palette specifies 5 RGB triplets for `--color-bg`, `--color-bg-secondary`, `--color-surface`, `--color-surface-hover`, and `--color-border`. `ThemeCtx` extended with `palette: string` and `setPalette(id)`. On init, `itk_palette` is read from `localStorage` (default `"navy"`) and applied immediately; changes are persisted back to `localStorage`.
- **`frontend/src/app/settings/appearance/page.tsx`** *(new)* — Settings page under `/settings/appearance` with a 2×2 palette picker grid; each card previews the scheme with three inline color swatches and highlights the active selection with `ring-2 ring-accent`. No auth required — palette is client-only.

### Changed
- **`frontend/src/components/Sidebar.tsx`** — added "Appearance" link to the settings nav (below "API Keys")

---

## [Unreleased] — Homepage UX: prominent "What's my IP?" button

### Changed
- **`frontend/src/app/page.tsx`** — replaced the small `text-xs` text link with a full-width card button featuring an icon, bold title, and descriptive subtitle ("Find your public IP address, location, and ASN instantly"); card highlights on hover, shows a spinner during detection, and hides once results are displayed
- Public IP detection continues to use client-side fetch to `api64.ipify.org` so the real browser IP is always returned regardless of Docker bridge / reverse-proxy topology

---

## [Unreleased] — Portability and deployment

### Fixed
- **`scripts/deploy.sh`** — script now `cd`s to the repo root at startup (`cd "$(dirname "$0")/.."`) so it can be invoked from any directory (e.g. `sudo bash scripts/deploy.sh` from the repo root, or `sudo bash deploy.sh` from inside `scripts/`). Previously, running from the `scripts/` directory caused `sed: can't read .env.example: No such file or directory` because all relative paths resolved against the working directory instead of the repo root.

### Added
- **`scripts/deploy.sh`** — one-command production deploy script: checks prerequisites, generates `.env.prod` with random secrets, builds images, waits for Postgres, runs migrations, starts all services
- **`nginx/conf.d/ssl.conf.example`** — ready-to-use HTTPS nginx config with Let's Encrypt paths, modern TLS settings, and HSTS; includes inline cert renewal instructions
- **`make deploy` / `make prod-*` targets** — Makefile now has a full set of production commands (`prod-up`, `prod-down`, `prod-build`, `prod-logs`, `prod-ps`, `prod-migrate`, `deploy`)
- **`compose.prod.yaml`** — now sets `build.target: runner` for the frontend (standalone production Next.js build)

### Changed
- **`backend/Dockerfile`** and **`worker/Dockerfile`** — removed hard-coded corporate CA certificate (`ds-ca-chain.crt`); images now install system CAs only and work on any Docker host
- **`.env.example`** — expanded with inline comments explaining every variable and production vs development differences
- **`README.md`** — comprehensive rewrite with two deployment paths (one-command and manual), HTTPS setup walkthrough, cert renewal cron example, full API reference, and updated project layout

---

## [Unreleased] — Fix MX records and mail diagnostics (closes #1)

### Fixed
- **MX records blank in DNS result** — `dns/service.py` was calling `r.to_text()` for all record types; for MX this produces a raw string (`"10 aspmx.l.google.com."`) rather than the `{priority, exchange}` object that `DnsResult.tsx` expects. MX records are now parsed into structured dicts sorted by priority, consistent with the mail service.
- **Mail diagnostics silently disappearing** — `ResultView.tsx` swallowed all fetch errors and showed nothing. Now surfaces a visible error card (`✕ Mail diagnostics: <reason>`) when the fetch fails or returns a non-ok response.
- **Mail router unhandled exceptions** — `mail/router.py` had no top-level try/except; an unexpected error in `lookup_mail` would return a raw 500 with no structured body. Errors are now caught and returned as `LookupResponse.error` so the frontend can display them.

---

## [Unreleased] — Mail health fix

### Fixed
- **`MailResult.tsx`** — rewritten with correct nested data interfaces matching the actual API response shape (`mx.records[].host`, `spf.record/valid`, `dmarc.policy/rua`, `dkim.selectors_found`, `mta_sts.dns_record_found`)
- **`ResultView.tsx`** — domain searches now auto-fetch `/api/v1/mail/{domain}` client-side and render `MailResult` below `DnsResult`; shows a loading pulse while the mail check runs

### Added
- `gmail.com` mail example added to homepage example strip

---

## [Unreleased] — Dark/light mode theme toggle

### Added
- **Theme toggle button** in the top-right of the navbar — switches between dark and light mode
- **ThemeProvider** (`lib/theme.tsx`) manages the `dark` class on `<html>`, persists preference to `localStorage`
- **Full light mode** — backgrounds, surfaces, borders, and badges all adapt via CSS custom properties; text colors adapt via CSS cascade overrides (no per-component changes required)
- CSS variable system for `--color-bg`, `--color-bg-secondary`, `--color-surface`, `--color-surface-hover`, `--color-border` with `:root` (light) and `.dark` definitions
- Tailwind `darkMode: "class"` enabled; `navy-900`, `navy-800`, `surface.*` color tokens now reference CSS variables and adapt automatically
- Badge, button, card, and input component classes updated with proper `dark:` variants

---

## [Unreleased] — Homepage enhancements

### Added
- **Capabilities section** — homepage now displays a 3-column grid of platform feature cards (DNS, BGP, Mail, TLS/HTTP, IP Intelligence, Monitoring) when no result is active
- **Guided troubleshooting workflows** — four operator-focused workflow cards ("Why is my email failing?", "Why is DNS wrong after a cutover?", etc.) showing the diagnostic steps the platform covers
- **Clickable example queries** — 8 example inputs (IPs, domains, ASNs, prefixes) that populate the search box and run immediately on click
- **API callout** — inline banner linking to `/api/docs` with a sample `curl` command
- New component `HomeFeatures` isolates all landing page content, rendered lazily so it doesn't affect search performance

---

## [Phase 3]

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
