# Roadmap: v0.1 → v1

## Where we are

Phases 0–3 are complete. The platform has 6 working diagnostic tools (DNS, IP, BGP, Mail, HTTP, TLS), full user accounts, API keys, watchlists, alerts (webhook-only), snapshots, and team collaboration.

## v1 goal

Production-ready — the tools that exist should be deep enough to trust, the UX should be solid enough to put in front of real users, and the platform should be observably healthy. Billing is post-v1.

---

## Milestones

| Milestone | Theme | Key deliverables |
|-----------|-------|-----------------|
| **v0.2** | DNS depth | Propagation checker, DNSSEC validation, authoritative trace |
| **v0.3** | Mail depth | SMTP connectivity test, PTR alignment, blocklist checks, DKIM selector config |
| **v0.4** | BGP depth | MOAS detection, route history, looking glass links, clickable ASN navigation |
| **v0.5** | Reachability | TCP port tests, latency, HTTP reachability with timing |
| **v0.6** | UX & workflows | Guided troubleshooting flows, snapshot diff view, copy/export, mobile pass |
| **v0.7** | Platform hardening | Email alert channel, per-user quotas, structured logs, Sentry |
| **v1.0** | Launch ready | Perf tuning, public API docs, HTTPS automation, error pages, SEO meta |

---

## v0.2 — DNS Depth

DNS is the most-used tool. Propagation and DNSSEC are the two most common operator questions that the current view doesn't answer.

- **Propagation checker** — query 5 public resolvers (8.8.8.8, 1.1.1.1, 9.9.9.9, 208.67.222.222, 94.140.14.14) in parallel; show per-resolver answers and highlight disagreements
- **DNSSEC validation** — validate DS/DNSKEY chain; return status (valid / insecure / bogus / no chain), algorithm, key tags, failure reason
- **Authoritative trace** — walk NS delegation from root; show nameserver chain and whether they agree
- **SRV records** — add to existing record type list

---

## v0.3 — Mail Depth

Mail troubleshooting is the most complex operator flow. SMTP tests and blocklist status are the two most common gaps.

- **SMTP connectivity test** (async) — TCP connect to MX on ports 25 and 587; grab banner; check STARTTLS
- **PTR alignment** — resolve sending IP rDNS, check if it matches the domain
- **Blocklist checks** — query Spamhaus ZEN, Barracuda, SORBS, SpamCop via DNS; return listed/clean per list
- **DMARC improvements** — parse alignment mode (aspf, adkim), pct, ruf
- **User-configurable DKIM selectors** — `?selectors=google,selector1,custom` query param; allow inline input in the UI

---

## v0.4 — BGP Depth

The tabbed ASN view (v0.1.1) is solid but missing MOAS, route history, and inter-ASN navigation.

- **MOAS detection** — flag prefixes with multiple origin ASNs via RIPE Stat; show all origins
- **Route history** — RIPE Stat routing-history for a prefix; surface first-seen, last-seen, origin changes over 30 days
- **Country field** — populate from RIPE Stat asn-overview (currently None)
- **Looking glass links** — HE BGP Toolkit, RIPE Stat, PCH for any ASN or prefix
- **Clickable ASN links** — neighbours tab links navigate to that ASN's result page

---

## v0.5 — Reachability

TCP port tests and HTTP checks are in the original design doc and fill a real operator need. All checks are user-specified and bounded (no scanning).

- `POST /api/v1/reachability/tcp` — `{host, port}`, TCP connect with 5s timeout; return open/closed/timeout + latency ms
- `POST /api/v1/reachability/http` — timed HTTP GET; return connect_ms, ttfb_ms, total_ms
- **Port presets** — web (80, 443), mail (25, 465, 587, 993, 995), SSH (22), DNS (53)
- **Quick port test panel** on IP result page

---

## v0.6 — UX & Workflows

The tools exist; the UX needs to surface them as workflows, not just isolated lookups.

- **Guided troubleshooting flows**
  - `/workflows/dns` — "Why is my DNS wrong?" — propagation + DNSSEC + authoritative walk
  - `/workflows/mail` — "Why is my email failing?" — MX → SPF → DKIM → DMARC → blocklist → SMTP
  - `/workflows/prefix` — "Why is my prefix unreachable?" — RPKI → visibility → MOAS → neighbours
- **Snapshot diff** — compare two watchlist snapshots; show added/removed/changed fields inline
- **Copy to clipboard** — on all key values (IPs, ASNs, records, prefixes)
- **Export as JSON** — download raw API response from any result page
- **Mobile responsiveness** — fix horizontal overflow in result tables, ensure tab nav works on touch
- **Empty states** — dashboard, watchlists, alerts currently show blank space

---

## v0.7 — Platform Hardening

Production-ready means the platform is observable, rate-limited, and alertable beyond webhooks.

- **Email alert channel** — `channel_type="email"` alongside existing webhooks; configured via `SMTP_*` env vars
- **Per-user quotas** — soft daily lookup limit (default 500/day) enforced in API middleware, counter in Redis
- **Structured logs** — JSON logs throughout API and worker
- **Health endpoint** — `/api/v1/health` returns postgres latency, redis latency, worker queue depth
- **Sentry integration** — optional via `SENTRY_DSN` env var; no-op if unset
- **Standardized error responses** — `{error, code, detail}` shape everywhere; no 500s leaking stack traces

---

## v1.0 — Launch Ready

The final gap between "working" and "publicly launchable."

- **Public API docs** — add descriptions, examples, and auth instructions to all Swagger endpoints; `/docs` page with curl examples
- **HTTPS automation** — wire certbot + `nginx/conf.d/ssl.conf.example` into the deploy script
- **Cache TTL audit** — review Redis TTLs per tool; add `Cache-Control` on permalink responses
- **Lazy-load pattern** — apply BgpResult's lazy tab loading to DNS and Mail result tabs
- **404 / error pages** — styled to match the app
- **Open Graph + favicon** — link preview meta tags
- `robots.txt` and basic SEO meta

---

## Post-v1 (not in scope)

- Billing / Stripe integration and paid tier enforcement
- Reputation module (AbuseIPDB, VirusTotal)
- Scheduled reports (PDF/email digest of watchlist changes)
- Looking glass proxy (live queries, not just external links)
- DKIM cryptographic signature validation
