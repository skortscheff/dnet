# Internet Toolkit

An operator-first network diagnostics platform. Paste any domain, IP, ASN, prefix, URL, or email address and get DNS, BGP, mail, TLS, and reachability analysis — all in one place.

See [ROADMAP.md](ROADMAP.md) for the v0.1 → v1 plan.

---

## What it does

Instead of juggling a dozen separate tools, Internet Toolkit fans a single input out across multiple diagnostic lenses simultaneously:

| Toolkit | Checks |
|---------|--------|
| **Public IP** | IPv4/IPv6 detection, rDNS, ASN, geo |
| **DNS** | A/AAAA/MX/TXT/NS/SOA, DNSSEC, propagation, authoritative trace |
| **BGP / Routing** | ASN lookup, prefix origin, RPKI, peers, route history |
| **Mail** | MX/SPF/DKIM/DMARC/MTA-STS/BIMI health check |
| **TLS / HTTP** | Cert inspection, SANs, ciphers/protocols, security headers |
| **Reachability** | TCP port tests, HTTP checks, redirect chains |

User accounts unlock saved results, API keys, watchlists with change alerts, and team workspaces.

---

## Technology stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| API | FastAPI (Python 3.12), SQLAlchemy, Alembic |
| Worker | Celery + Redis (async jobs, watchlist checks, webhooks) |
| Database | PostgreSQL 16 |
| Cache / Queue | Redis 7 |
| Proxy | Nginx (reverse proxy, rate limiting, TLS termination) |

All six services run in Docker containers. Only Nginx is exposed to the host (ports 80/443).

---

## Deploy

**Requirements:** Docker 24+ and Docker Compose v2. Nothing else needs to be installed on the host.

### One command

```sh
git clone https://github.com/skortscheff/dnet.git
cd dnet
bash scripts/deploy.sh
```

This generates `.env.prod` with random secrets, builds all images, runs migrations, and starts the full stack. Review `.env.prod` afterwards and set `CORS_ORIGINS` to your domain.

### Manual

```sh
git clone https://github.com/skortscheff/dnet.git
cd dnet

cp .env.example .env.prod
# Edit .env.prod — set POSTGRES_PASSWORD, SECRET_KEY (openssl rand -hex 32), CORS_ORIGINS

docker compose -f compose.yaml -f compose.prod.yaml build
docker compose -f compose.yaml -f compose.prod.yaml up -d postgres redis
docker compose -f compose.yaml -f compose.prod.yaml run --rm api alembic upgrade head
docker compose -f compose.yaml -f compose.prod.yaml up -d
```

### HTTPS

Get a certificate with Certbot, mount `/etc/letsencrypt` into the nginx container, then copy `nginx/conf.d/ssl.conf.example` to `nginx/conf.d/default.conf` and replace `yourdomain.com` with your domain.

### Updating

```sh
git pull
docker compose -f compose.yaml -f compose.prod.yaml build
docker compose -f compose.yaml -f compose.prod.yaml run --rm api alembic upgrade head
docker compose -f compose.yaml -f compose.prod.yaml up -d
```

---

## Development

```sh
cp .env.example .env.dev
make init-dev   # build images, run migrations
make up         # start stack with hot reload
```

Open `http://localhost`. API docs at `http://localhost/api/docs`.
