"use client";

interface Capability {
  title: string;
  tag: string;
  tagColor: string;
  description: string;
  bullets: string[];
}

const CAPABILITIES: Capability[] = [
  {
    title: "DNS Toolkit",
    tag: "DNS",
    tagColor: "badge-blue",
    description: "Full record resolution and health analysis.",
    bullets: [
      "A, AAAA, MX, TXT, NS, SOA, CNAME, CAA",
      "Authoritative trace from root",
      "DNSSEC chain validation",
      "Propagation comparison across resolvers",
    ],
  },
  {
    title: "BGP / Routing",
    tag: "BGP",
    tagColor: "badge-green",
    description: "Routing visibility, origin validation, and RPKI.",
    bullets: [
      "ASN lookup and announced prefixes",
      "Prefix origin and RPKI status",
      "Route visibility summary",
      "MOAS detection and AS path context",
    ],
  },
  {
    title: "Mail Health",
    tag: "MAIL",
    tagColor: "badge-yellow",
    description: "End-to-end mail delivery and authentication checks.",
    bullets: [
      "MX, SPF, DKIM, DMARC parsing",
      "SMTP banner and connectivity tests",
      "PTR alignment verification",
      "Blocklist reputation checks",
    ],
  },
  {
    title: "TLS / HTTP",
    tag: "TLS",
    tagColor: "badge-gray",
    description: "Certificate inspection and HTTP security posture.",
    bullets: [
      "Certificate details, SANs, expiry",
      "Protocol and cipher suite summary",
      "Redirect chain analysis",
      "Security header presence check",
    ],
  },
  {
    title: "IP Intelligence",
    tag: "IP",
    tagColor: "badge-blue",
    description: "Public IP context, PTR, ASN, and geolocation.",
    bullets: [
      "What is my IP (auto-detected)",
      "Reverse DNS and PTR resolution",
      "ASN and organization lookup",
      "Geolocation and whois pivots",
    ],
  },
  {
    title: "Monitoring",
    tag: "PRO",
    tagColor: "badge-green",
    description: "Continuous tracking and change alerting.",
    bullets: [
      "Watchlists for any domain, IP, ASN, or prefix",
      "Configurable check intervals (5m – 24h)",
      "Webhook alerts on result change",
      "Historical snapshots for trend review",
    ],
  },
];

const EXAMPLES: { label: string; query: string; type: string }[] = [
  { label: "8.8.8.8", query: "8.8.8.8", type: "IPv4" },
  { label: "github.com", query: "github.com", type: "Domain" },
  { label: "AS15169", query: "AS15169", type: "ASN" },
  { label: "1.1.1.0/24", query: "1.1.1.0/24", type: "Prefix" },
  { label: "cloudflare.com", query: "cloudflare.com", type: "Domain" },
  { label: "AS13335", query: "AS13335", type: "ASN" },
  { label: "2606:4700::/32", query: "2606:4700::/32", type: "Prefix" },
  { label: "smtp.gmail.com", query: "smtp.gmail.com", type: "Domain" },
];

const WORKFLOWS: { title: string; steps: string[] }[] = [
  {
    title: "Why is my email failing?",
    steps: ["Check MX records", "Validate SPF / DKIM / DMARC", "Test SMTP connectivity", "Scan blocklists"],
  },
  {
    title: "Why is DNS wrong after a cutover?",
    steps: ["Trace authoritative answer", "Compare recursive resolvers", "Inspect TTL expiry", "Verify DNSSEC chain"],
  },
  {
    title: "Is my prefix reachable globally?",
    steps: ["Validate RPKI origin", "Check route visibility", "Detect MOAS conflicts", "Review AS path context"],
  },
  {
    title: "Is my TLS config healthy?",
    steps: ["Inspect certificate chain", "Check expiry and SANs", "Audit protocol support", "Review security headers"],
  },
];

interface Props {
  onExample: (q: string) => void;
}

export default function HomeFeatures({ onExample }: Props) {
  return (
    <div className="space-y-16 mt-2 pb-16">
      {/* Quick example queries */}
      <section>
        <p className="text-xs uppercase tracking-widest text-slate-500 mb-4 font-sans">Try an example</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.query}
              onClick={() => onExample(ex.query)}
              className="group flex items-center gap-2 px-3 py-1.5 rounded border border-surface-border bg-surface hover:border-accent hover:bg-navy-800 transition-colors"
            >
              <span className="text-xs text-slate-500 font-sans">{ex.type}</span>
              <span className="font-mono text-sm text-slate-300 group-hover:text-accent transition-colors">
                {ex.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Guided workflows */}
      <section>
        <p className="text-xs uppercase tracking-widest text-slate-500 mb-4 font-sans">Guided troubleshooting</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {WORKFLOWS.map((wf) => (
            <div
              key={wf.title}
              className="card p-4 hover:border-accent/40 transition-colors"
            >
              <p className="font-mono text-sm text-slate-200 mb-3">{wf.title}</p>
              <ol className="space-y-1">
                {wf.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs font-mono text-slate-500">
                    <span className="text-accent/50 shrink-0">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* Capability cards */}
      <section>
        <p className="text-xs uppercase tracking-widest text-slate-500 mb-4 font-sans">Platform capabilities</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CAPABILITIES.map((cap) => (
            <div key={cap.title} className="card p-4 flex flex-col gap-3 hover:border-accent/40 transition-colors">
              <div className="flex items-center gap-2">
                <span className={`badge ${cap.tagColor}`}>{cap.tag}</span>
                <span className="font-mono text-sm text-slate-200">{cap.title}</span>
              </div>
              <p className="text-xs text-slate-500 font-sans leading-relaxed">{cap.description}</p>
              <ul className="space-y-1">
                {cap.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-xs font-mono text-slate-500">
                    <span className="text-accent/40 shrink-0 mt-px">›</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* API callout */}
      <section>
        <div className="border border-surface-border rounded p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface">
          <div>
            <p className="font-mono text-sm text-slate-200 mb-1">JSON API access</p>
            <p className="text-xs text-slate-500 font-sans">
              Every lookup is available as a structured JSON response. Authenticate with an API key to query programmatically.
            </p>
            <div className="mt-2 font-mono text-xs text-slate-600 bg-navy-900 border border-surface-border rounded px-3 py-1.5 inline-block select-all">
              curl https://your-host/api/v1/dns/github.com
            </div>
          </div>
          <a
            href="/api/docs"
            target="_blank"
            className="btn-ghost text-sm py-1.5 px-4 border border-surface-border shrink-0"
          >
            API Docs ↗
          </a>
        </div>
      </section>
    </div>
  );
}
