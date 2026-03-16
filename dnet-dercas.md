# Networking Toolkit Website Full Design

## Working Title

**Internet Toolkit**
A modular, operator-first web platform for DNS, BGP, mail, reachability, and Internet diagnostics.

---

## 1. Executive Summary

This project is a **web-based networking toolkit** designed for network engineers, NOC teams, MSPs, sysadmins, SREs, and infrastructure operators.

The platform should unify tools that are usually scattered across separate websites into a single, workflow-driven interface. Instead of forcing users to jump between a web dig, a public IP site, BGP resources, DNS propagation pages, SMTP testers, and TLS inspection tools, the platform should provide a single search-first experience with contextual pivots.

The system must also satisfy the following engineering requirements:

* Run fully on **WSL 2** during development
* Be **modular** and service-separated
* Be **portable** to another Linux server later
* Be **reproducible** through containers and Compose files
* Be **secure** enough to prevent abuse of network-facing tools
* Support future monetization via accounts, APIs, alerting, and saved investigations

---

## 2. Product Vision

Build a modern Internet diagnostics workbench that combines:

* public IP utilities
* DNS inspection
* BGP / routing visibility
* mail health diagnostics
* HTTP / TLS inspection
* reachability testing
* reputation and policy checks

The goal is not to create a random list of small utilities. The goal is to create a **network operations console** that helps users answer questions quickly.

### Vision statement

**A single operator-first platform where any domain, IP, prefix, ASN, hostname, URL, or email header can be analyzed through DNS, routing, reachability, TLS, and mail diagnostics from one interface.**

---

## 3. Problem Statement

Today, troubleshooting Internet infrastructure is fragmented.

A simple problem like "email to my domain is failing" may require several disconnected checks:

* MX lookup
* SPF validation
* DKIM validation
* DMARC parsing
* PTR verification
* blocklist status
* SMTP banner/connectivity testing
* TLS policy inspection

A routing problem may require:

* prefix to ASN lookup
* visibility analysis
* origin validation
* RPKI status
* route propagation checks
* AS path inspection
* looking glass access

A DNS cutover may require:

* authoritative resolution
* recursive comparison
* TTL analysis
* propagation checking
* DNSSEC validation

The user currently has to connect all this context manually.

---

## 4. Product Thesis

The site should be designed around **unified workflows**, not isolated tools.

### Core interaction model

The user pastes any of these into one search box:

* Domain
* Hostname
* IPv4
* IPv6
* ASN
* CIDR / prefix
* URL
* Email header blob

The system detects the input type and routes to a unified results page.

### Why this matters

This lets the product behave like an operator console instead of a bag of widgets.

---

## 5. Audience

### Primary users

* Network engineers
* NOC analysts
* Sysadmins
* MSP operators
* Hosting operators
* Mail and DNS administrators

### Secondary users

* SRE teams
* Security engineers
* Developers debugging infra issues
* Consultants

### User expectations

This audience expects:

* fast response times
* technically dense output
* trustworthy data
* clean formatting
* copyable values
* shareable permalinks
* API support

---

## 6. Positioning

### Positioning statement

**Internet Toolkit is a modern Internet diagnostics console for DNS, BGP, mail, reachability, and TLS, designed for operators who need context and fast pivots, not isolated lookups.**

### Differentiation

The strongest differentiator is not a larger number of tools. It is:

* one input → many pivots
* troubleshooting workflows
* unified result pages
* saved investigations and monitoring later

---

## 7. Product Principles

1. **One input, many pivots**
   Every lookup should unlock related technical context.

2. **Workflow over utility list**
   The platform should guide the user toward answers.

3. **Operator-first UX**
   Dense, technical, efficient views with strong visual hierarchy.

4. **Separation of concerns**
   Web, API, workers, cache, and storage should be isolated services.

5. **Portability by design**
   The stack must move from WSL to any Linux server with minimal change.

6. **Security first**
   Network-facing checks must be rate-limited, bounded, and abuse-resistant.

7. **Progressive depth**
   The overview should be quick, but deeper technical panels must always be available.

---

## 8. Core User Flows

### Flow A: DNS troubleshooting

1. User enters `example.com`
2. System detects domain input
3. Overview page displays:

   * A / AAAA
   * NS / SOA
   * TTL summary
   * authoritative status
   * DNSSEC health
4. DNS tab allows:

   * full dig-style answers
   * authoritative trace
   * resolver comparison
   * propagation status
   * raw output export

### Flow B: Prefix / BGP troubleshooting

1. User enters `203.0.113.0/24` or `AS64500`
2. System displays:

   * origin ASN
   * visibility summary
   * RPKI validation state
   * route history summary
   * upstream/downstream context
3. User can pivot to:

   * path visibility
   * MOAS detection
   * suspect route leak/hijack indicators
   * external looking glass references

### Flow C: Mail troubleshooting

1. User enters `example.com`
2. Mail tab displays:

   * MX
   * SPF
   * DKIM selectors if known or discovered
   * DMARC
   * PTR alignment
   * SMTP test results
   * blocklist findings
3. System summarizes likely failure points

### Flow D: Public IP / reachability

1. User opens homepage
2. Site immediately displays:

   * public IP
   * reverse DNS
   * ASN
   * coarse geolocation
   * request metadata
3. User can pivot to:

   * whois
   * port tests
   * HTTP/TLS diagnostics
   * latency / reachability tests

---

## 9. Information Architecture

### Global navigation

* Home
* Tools
* DNS
* BGP / Routing
* Reachability
* Mail
* TLS / HTTP
* Reputation
* API
* Pricing
* Docs

### Results tabs

* Overview
* DNS
* BGP / Routing
* Reachability
* Mail
* TLS / HTTP
* Reputation
* History

### Homepage sections

1. Hero + universal search
2. Quick tools
3. Guided workflows
4. Feature proof / screenshots
5. API teaser
6. Pricing / account CTA

---

## 10. Feature Catalog

### 10.1 Public IP Toolkit

* What is my IP
* IPv4 / IPv6 detection
* reverse DNS
* HTTP header echo
* browser request metadata
* ASN association
* geolocation sanity view

### 10.2 DNS Toolkit

* A / AAAA / MX / TXT / NS / SOA / CNAME / SRV / PTR / CAA
* DNSKEY / DS
* authoritative trace
* recursive comparison
* propagation checker
* TTL visualization
* DNSSEC validation
* raw dig-style result export

### 10.3 BGP / Routing Toolkit

* ASN lookup
* announced prefixes
* prefix origin lookup
* origin validation
* path summary
* prefix visibility summary
* RPKI status
* MOAS detection
* route history timeline
* peering context
* external looking glass links

### 10.4 Reachability Toolkit

* TCP port tests
* HTTP request checks
* HTTPS/TLS checks
* redirect chain inspection
* latency/timing summary
* basic path / probe orchestration

### 10.5 Mail Toolkit

* MX lookup
* SPF parsing
* DKIM discovery and validation
* DMARC parsing
* PTR alignment checks
* SMTP banner / connectivity tests
* MTA-STS and TLS-RPT checks
* BIMI checks
* reputation / blocklist checks

### 10.6 TLS / HTTP Toolkit

* certificate inspection
* SAN listing
* issuer / expiry review
* protocol and cipher support summary
* redirect chain analysis
* security header presence

### 10.7 Reputation Toolkit

* blocklist status
* mail health summary
* DNS health summary
* domain readiness summary

### 10.8 Premium / Future Toolkit

* watchlists
* alerts
* historical snapshots
* saved investigations
* team workspaces
* API quotas
* webhook notifications

---

## 11. MVP Definition

### Phase 1 MVP

The first release should contain:

1. Universal search
2. Public IP and reverse DNS
3. Web dig and authoritative trace
4. DNS propagation checker
5. Prefix / ASN / RPKI lookup
6. BGP visibility summary
7. MX / SPF / DKIM / DMARC checks
8. HTTP/TLS inspection
9. TCP port checks
10. Shareable result permalinks
11. Basic JSON API

### Why this MVP

This version is small enough to build and large enough to prove the product thesis.

---

## 12. System Design Goals

The technical architecture must satisfy:

* local development on WSL 2
* containerized execution
* clean migration to Ubuntu VPS/dedicated server later
* service isolation
* persistent storage where required
* safe execution of network-facing jobs
* reproducible setup via Compose

### Architectural rule

**WSL is the host environment, not the architecture.**

The architecture itself must be Linux-container based.

---

## 13. Recommended Technology Stack

### Frontend

* **Next.js**
* TypeScript
* Tailwind CSS

### API Backend

Preferred options:

* **FastAPI** for rapid delivery and good Python networking ecosystem
* or **NestJS** if a full TypeScript stack is preferred

Recommended choice:

* **FastAPI**

### Background Jobs

* **Celery** or **RQ** if using Python backend
* separate worker process/container

### Database

* **PostgreSQL** as primary database

### Cache / Queue

* **Redis**

### Reverse Proxy

* **Nginx**

### Storage

* local volume for MVP
* optional **MinIO** or S3-compatible object storage later

### Packaging / Orchestration

* **Docker**
* **Docker Compose**

### Monitoring

* logs
* metrics
* error tracking

---

## 14. High-Level Architecture

The platform should be split into the following services:

### 14.1 Nginx

Responsibilities:

* reverse proxy
* TLS termination later
* static serving
* request limits
* basic caching
* routing to frontend and API

### 14.2 Frontend Service

Responsibilities:

* universal search UI
* results rendering
* dashboard views
* account pages
* API docs pages

### 14.3 API Service

Responsibilities:

* auth
* input detection
* request validation
* synchronous tool orchestration
* database access
* caching lookups
* API responses for UI and external clients

### 14.4 Worker Service

Responsibilities:

* slow DNS traces
* SMTP checks
* TLS scans
* long-running enrichment
* scheduled monitoring
* alert evaluation

### 14.5 PostgreSQL Service

Stores:

* users
* API keys
* lookups metadata
* saved results
* watchlists
* alerts
* billing metadata later
* audit records

### 14.6 Redis Service

Stores:

* short-term cache
* rate-limit counters
* queue state
* in-progress job status
* temporary lookup data

### 14.7 Optional Object Storage

Stores:

* exports
* JSON snapshots
* uploaded email headers / artifacts later
* report files

---

## 15. Request Processing Model

### Fast path

Used for simple lookups such as:

* what is my IP
* simple DNS queries
* cached ASN lookup
* cached reverse DNS

Flow:

1. user request enters nginx
2. nginx forwards to API
3. API validates input
4. API checks cache
5. API performs quick lookup or returns cached result
6. API optionally writes metadata to database
7. frontend renders result

### Async path

Used for slower checks such as:

* SMTP validation
* deep TLS checks
* route enrichment
* scheduled diagnostics

Flow:

1. API accepts request
2. job is placed in Redis queue
3. worker consumes job
4. result stored in cache and/or database
5. frontend polls for completion
6. final result is rendered

---

## 16. Portability Strategy

To make the system portable, the following must be true:

### 16.1 Container-first deployment

All core services must run in containers:

* nginx
* frontend
* api
* worker
* postgres
* redis

### 16.2 Compose-defined infrastructure

The environment should be defined through:

* `compose.yaml`
* `compose.dev.yaml`
* `compose.prod.yaml`

### 16.3 No core services installed directly on WSL

Do not install these directly on the host as part of the architecture:

* postgres
* redis
* nginx
* backend runtime

### 16.4 Environment-driven config

All configuration should come from env files and mounted config files.

### 16.5 Volume-based persistence

Persistent services should use named volumes.

### 16.6 Migration model

A future move to another Linux server should require only:

1. install Docker and Compose
2. copy repository
3. provide env files
4. restore database and volumes if needed
5. start Compose stack

---

## 17. WSL Deployment Design

### WSL requirements

* WSL 2
* Ubuntu distribution
* Docker Engine
* Docker Compose plugin
* project stored in Linux filesystem

### Important rule

Keep the project under something like:

* `/home/<user>/projects/network-toolkit`

Do not rely on Windows-mounted paths for normal development.

### Why

This improves Linux-side filesystem performance and keeps the environment closer to the target production setup.

---

## 18. Service Topology

### Core services

* `nginx`
* `frontend`
* `api`
* `worker`
* `postgres`
* `redis`

### Optional development-only services

* `adminer` or `pgadmin`
* `mailhog`
* `minio`

### Network layout

Use an internal Docker network for all services, with only nginx exposing ports to the host.

Example:

* host port 80 → nginx
* host port 443 → nginx later
* internal service discovery by Compose service names

---

## 19. Recommended Repository Structure

```text
network-toolkit/
├── compose.yaml
├── compose.dev.yaml
├── compose.prod.yaml
├── .env.example
├── .env.dev
├── .env.prod
├── Makefile
├── docs/
│   ├── product-design.md
│   ├── architecture.md
│   └── api-spec.md
├── nginx/
│   ├── nginx.conf
│   └── conf.d/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── public/
│   └── src/
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── services/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── jobs/
│   └── migrations/
├── worker/
│   ├── Dockerfile
│   └── jobs/
├── scripts/
│   ├── backup/
│   ├── restore/
│   └── init/
└── data/
```

---

## 20. Compose Design

### Base Compose file

`compose.yaml` should define the shared services, networks, and volumes.

### Dev override

`compose.dev.yaml` should add:

* bind mounts for source code
* hot reload
* debug ports
* dev-only tools

### Prod override

`compose.prod.yaml` should add:

* stricter restart policies
* hardened nginx config
* no source bind mounts
* production environment variables
* backup jobs / scheduled tasks later

---

## 21. Configuration Strategy

### Environment files

Use:

* `.env.example` for defaults and documentation
* `.env.dev` for local development
* `.env.prod` for deployment

### Config sources

Configuration should come from:

* environment variables
* mounted config files
* secrets in deployment environment later

### Examples of config values

* database URL
* redis URL
* API base URL
* app secret key
* mail settings
* rate limit values
* feature flags
* external data provider tokens later

---

## 22. Persistence Design

### Use named volumes for:

* PostgreSQL data
* Redis persistence if enabled
* MinIO/object storage data
* upload/export storage

### Use bind mounts for:

* source code during development only
* nginx config during development if desired

### Rule

Application code should be portable and versioned. Service data should live in named volumes or explicit backup files.

---

## 23. Backend Modular Design

The backend should be split by domain, not by controller chaos.

### Suggested modules

* `auth`
* `lookup`
* `dns`
* `bgp`
* `mail`
* `http_tls`
* `reachability`
* `reputation`
* `jobs`
* `billing` later
* `alerts` later

### Internal layers

* API layer
* service layer
* provider/integration layer
* persistence layer
* background job layer

This helps keep each toolkit isolated and easy to expand.

---

## 24. Frontend Modular Design

### Core pages

* homepage
* tool landing pages
* result pages
* account pages
* pricing page
* API docs page

### Frontend component groups

* search components
* result summary cards
* record tables
* technical detail panels
* health badges
* charts/timelines later

### Result page design

Each result page should have:

* top summary banner
* key identifiers
* health highlights
* issue callouts
* raw technical panels below

---

## 25. API Design Principles

### Input model

Single search input should resolve to a typed internal query model:

* domain
* hostname
* ip
* asn
* prefix
* url
* email header

### API style

Recommended endpoints:

* `/api/v1/search`
* `/api/v1/ip/{ip}`
* `/api/v1/dns/{name}`
* `/api/v1/asn/{asn}`
* `/api/v1/prefix/{cidr}`
* `/api/v1/mail/{domain}`
* `/api/v1/http/check`
* `/api/v1/tls/check`
* `/api/v1/jobs/{id}`

### Response style

Responses should include:

* normalized input
* timestamp
* summary section
* raw details section
* health flags
* related pivots

---

## 26. Data Model Overview

### Core tables

* `users`
* `api_keys`
* `lookups`
* `lookup_results`
* `saved_investigations`
* `watchlists`
* `alerts`
* `jobs`
* `audit_events`

### Key concepts

#### users

Account and auth metadata

#### lookups

Lookup request metadata

#### lookup_results

Normalized or cached result payload metadata and references

#### jobs

Async execution state and timing

#### watchlists

Tracked domains, IPs, prefixes, and ASNs

#### alerts

Rules and notification targets later

---

## 27. Caching Strategy

Caching matters because many lookups are repeated.

### Cache appropriate results

* public IP metadata
* reverse DNS results
* ASN information
* recent DNS answers
* recent HTTP/TLS checks
* recent BGP enrichment

### Do not cache blindly

Data should respect sensible TTLs depending on source volatility.

### Redis responsibilities

* response cache
* job queue broker
* job progress state
* rate limiting counters
* burst control

---

## 28. Background Job Design

Separate background jobs are required for expensive or slow work.

### Job types

* deep DNS trace
* SMTP diagnostics
* DKIM validation attempts
* TLS scan
* route enrichment
* scheduled watchlist checks
* alert evaluation

### Worker behavior

* bounded timeouts
* strict validation
* structured logs
* retry only where safe
* no unbounded external probing

---

## 29. Security Design

This product must be hardened because users can trigger network-facing activity.

### Threats

* abuse for scanning
* abuse for SMTP probing
* resource exhaustion
* SSRF-like behavior
* credential exposure
* API key theft
* unbounded external requests

### Required protections

* per-IP rate limiting
* per-account quotas
* job timeout limits
* DNS and HTTP target validation
* outbound restrictions where possible
* audit logs
* safe defaults
* strict request size limits
* authentication for heavy features

### Safe product behavior

Avoid building unrestricted offensive scanning tools into the public tier.

---

## 30. Observability Design

### Logs

* nginx access logs
* API logs
* worker logs
* job execution logs
* error logs

### Metrics

* request latency
* job duration
* queue depth
* cache hit rate
* error rate
* external provider failure rate

### Error tracking

A central error tracker should be added once the MVP is stable.

---

## 31. Backup and Recovery

### Backup requirements

* PostgreSQL dump
* object storage export if used
* critical env/config backup

### Recovery goal

A new Linux host should be able to restore the platform from:

* repository
* env files
* database dump
* optional storage snapshot

### Operational scripts

Create:

* `backup-db.sh`
* `restore-db.sh`
* `init-dev.sh`
* `init-prod.sh`

---

## 32. Deployment Profiles

### Development

Runs on WSL with:

* source bind mounts
* hot reload
* debug logging
* admin tooling

### Staging

Runs like production but with non-public access and test data.

### Production

Runs with:

* hardened nginx config
* no source bind mounts
* strict env configuration
* real TLS
* scheduled backups
* monitoring enabled

---

## 33. UX Direction

### Visual style

* dark friendly
* technical
* clean
* low-friction
* fast

### Homepage layout

1. Hero search
2. Quick action cards
3. Guided troubleshooting cards
4. Product proof section
5. API/premium section

### Result UX

Each result page should emphasize:

* identifiers
* health status
* issues first
* raw evidence second
* follow-up pivots always visible

---

## 34. Guided Troubleshooting Experiences

The product should feature special workflows such as:

### "Why is my DNS wrong?"

* authoritative answer
* recursive comparison
* TTL awareness
* propagation indicators
* DNSSEC validation

### "Why is my email failing?"

* MX
* PTR
* SPF
* DKIM
* DMARC
* SMTP check
* blocklists

### "Why is my prefix unreachable?"

* origin ASN
* RPKI validity
* visibility
* path changes
* MOAS
* related pivots

### "Is my website healthy over TLS?"

* cert
* redirect chain
* protocol support
* expiration warnings
* security header summary

---

## 35. Naming Ideas

Possible names:

* RouteKit
* NetScope
* PrefixLab
* Internet Toolkit
* NOC Tools
* RouteDeck
* PacketAtlas
* ASNavi

### Recommended naming angle

Choose something infrastructure-oriented rather than generic consumer wording.

---

## 36. Monetization Model

### Free tier

* manual lookups
* low rate limits
* public permalinks
* limited recent history

### Paid tier

* higher API quotas
* saved investigations
* watchlists
* alerts
* team sharing
* scheduled reports
* historical views

### Premium principle

Charge for:

* automation
* history
* collaboration
* monitoring

Do not charge for basic one-off curiosity-driven lookups if the goal is organic growth.

---

## 37. Development Plan

### Phase 0: foundation

* repository scaffolding
* dockerized local environment
* nginx + frontend + api + postgres + redis + worker
* env and config framework

### Phase 1: MVP tools

* universal search
* public IP page
* DNS lookup
* DNS trace
* basic BGP summary
* mail checks
* HTTP/TLS checks
* permalink support

### Phase 2: user features

* accounts
* saved results
* API keys
* basic dashboards

### Phase 3: premium features

* watchlists
* alerts
* historical snapshots
* team collaboration

---

## 38. Success Metrics

### Product metrics

* searches per session
* repeat usage
* most-used tool families
* account signup conversion
* API key creation rate

### Technical metrics

* median response time
* async job success rate
* cache hit rate
* worker error rate
* queue backlog

### Business metrics

* conversion to paid plans
* active watchlists
* retention by team/workspace

---

## 39. Final Recommendation

The correct implementation strategy is:

* develop on **WSL 2**
* run the stack with **Docker Compose**
* keep all core services **containerized**
* use **Nginx + Next.js + FastAPI + Worker + PostgreSQL + Redis**
* design modules by domain
* use **named volumes** for persistent data
* use **bind mounts** only for dev source code
* define everything through versioned configuration

This gives you a platform that is:

* modular
* portable
* reproducible
* scalable enough for growth
* realistic to run locally now and on a Linux server later

---

## 40. One-Sentence Summary

**Build a containerized, operator-first Internet diagnostics platform that runs cleanly on WSL today and can be moved to any Linux host later without redesigning the stack.**
