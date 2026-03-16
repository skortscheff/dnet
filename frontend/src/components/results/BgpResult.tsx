"use client";
import { useEffect, useState } from "react";

// ── Interfaces ──────────────────────────────────────────────────────────────

interface OriginAsn {
  asn: string;
  name?: string | null;
}

interface RpkiStatus {
  status: "valid" | "invalid" | "not-found" | "unknown";
  validating_roas?: unknown[];
}

interface AsnData {
  asn?: string | null;
  name?: string | null;
  description?: string | null;
  country?: string | null;
  rir?: string | null;
  announced?: boolean | null;
  prefixes_v4?: string[];
  prefixes_v6?: string[];
  prefixes_v4_count?: number | null;
  prefixes_v6_count?: number | null;
  visibility_percent?: number | null;
  irr_route_count?: number | null;
  actual_route_count?: number | null;
  route_consistency_ok?: boolean | null;
}

interface PrefixData {
  prefix?: string | null;
  name?: string | null;
  description?: string | null;
  country?: string | null;
  rir?: string | null;
  origin_asns?: OriginAsn[];
  rpki?: RpkiStatus | null;
  rpki_state?: string | null;
  rpki_description?: string | null;
}

interface PrefixEntry {
  prefix: string;
}

interface PrefixesPayload {
  asn: string;
  prefixes_v4: PrefixEntry[];
  prefixes_v6: PrefixEntry[];
  prefixes_v4_count: number;
  prefixes_v6_count: number;
}

interface NeighbourEntry {
  asn: number;
  power: number;
  prefixes: number;
}

interface NeighboursPayload {
  asn: string;
  upstreams: NeighbourEntry[];
  downstreams: NeighbourEntry[];
  peers: NeighbourEntry[];
  upstream_count: number;
  downstream_count: number;
  peer_count: number;
}

interface WhoisPayload {
  asn: string;
  handle?: string | null;
  name?: string | null;
  org?: string | null;
  country?: string | null;
  rir?: string | null;
  registration_date?: string | null;
  last_changed_date?: string | null;
  remarks: string[];
  links: string[];
  rdap_url: string;
}

interface Props {
  data: Record<string, unknown>;
  input_type: "asn" | "prefix";
  onSearch: (q: string) => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

const RPKI_BADGE: Record<string, string> = {
  valid: "badge-green",
  invalid: "badge-red",
  "not-found": "badge-yellow",
  unknown: "badge-gray",
};

const PAGE_SIZE = 25;

type AsnTab = "overview" | "prefixes" | "peers" | "whois";

// ── Helpers ──────────────────────────────────────────────────────────────────

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-mono border-b-2 transition-colors ${
        active
          ? "border-accent text-accent"
          : "border-transparent text-slate-400 hover:text-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

function LoadingCard({ msg }: { msg: string }) {
  return (
    <div className="font-mono text-sm text-accent animate-pulse py-4">{msg}</div>
  );
}

function ErrorCard({ msg }: { msg: string }) {
  return (
    <div className="font-mono text-sm text-mono-red py-4">✕ {msg}</div>
  );
}

// ── ASN tab content ──────────────────────────────────────────────────────────

function OverviewTab({ d }: { d: AsnData }) {
  return (
    <div className="space-y-5">
      {/* Network Scale */}
      <div>
        <div className="section-title">Network Scale</div>
        <table className="w-full border-collapse">
          <tbody>
            <tr className="table-row">
              <td className="table-cell data-label w-48">IPv4 Routes</td>
              <td className="table-cell data-value font-mono">
                {d.prefixes_v4_count ?? "—"}
              </td>
            </tr>
            <tr className="table-row">
              <td className="table-cell data-label">IPv6 Routes</td>
              <td className="table-cell data-value font-mono">
                {d.prefixes_v6_count ?? "—"}
              </td>
            </tr>
            <tr className="table-row">
              <td className="table-cell data-label">Visibility</td>
              <td className="table-cell data-value font-mono">
                {d.visibility_percent != null
                  ? `${d.visibility_percent}%`
                  : "—"}
              </td>
            </tr>
            <tr className="table-row">
              <td className="table-cell data-label">IRR Sync</td>
              <td className="table-cell data-value font-mono">
                {d.route_consistency_ok == null ? (
                  "—"
                ) : d.route_consistency_ok ? (
                  <span className="badge badge-green">In sync</span>
                ) : (
                  <span className="badge badge-yellow">
                    {d.irr_route_count ?? 0}/{d.actual_route_count ?? 0} routes in IRR
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Sample prefixes */}
      {((d.prefixes_v4 ?? []).length > 0 || (d.prefixes_v6 ?? []).length > 0) && (
        <div>
          <div className="section-title">Sample Prefixes</div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="table-cell data-label text-left">PREFIX</th>
              </tr>
            </thead>
            <tbody>
              {[...(d.prefixes_v4 ?? []), ...(d.prefixes_v6 ?? [])].map(
                (p, i) => (
                  <tr key={i} className="table-row">
                    <td className="table-cell data-value text-mono-green font-mono">
                      {p}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Showing sample — see Prefixes tab for full list.
          </p>
        </div>
      )}
    </div>
  );
}

function PrefixesTab({
  data,
  loading,
  error,
}: {
  data: PrefixesPayload | null;
  loading: boolean;
  error: string | null;
}) {
  const [filter, setFilter] = useState("");
  const [v4Page, setV4Page] = useState(0);
  const [v6Page, setV6Page] = useState(0);

  if (loading) return <LoadingCard msg="▶ Loading prefixes…" />;
  if (error) return <ErrorCard msg={error} />;
  if (!data) return null;

  const v4 = data.prefixes_v4.filter((p) =>
    filter ? p.prefix.startsWith(filter) : true
  );
  const v6 = data.prefixes_v6.filter((p) =>
    filter ? p.prefix.startsWith(filter) : true
  );

  const v4Slice = v4.slice(v4Page * PAGE_SIZE, (v4Page + 1) * PAGE_SIZE);
  const v6Slice = v6.slice(v6Page * PAGE_SIZE, (v6Page + 1) * PAGE_SIZE);
  const v4Pages = Math.ceil(v4.length / PAGE_SIZE);
  const v6Pages = Math.ceil(v6.length / PAGE_SIZE);

  return (
    <div className="space-y-5">
      <input
        type="text"
        placeholder="Filter by prefix…"
        value={filter}
        onChange={(e) => {
          setFilter(e.target.value);
          setV4Page(0);
          setV6Page(0);
        }}
        className="w-full max-w-xs px-2 py-1 text-xs font-mono bg-slate-800 border border-slate-600 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-accent"
      />

      {/* IPv4 */}
      <div>
        <div className="section-title">
          IPv4 <span className="badge badge-gray ml-2">{v4.length}</span>
        </div>
        {v4Slice.length === 0 ? (
          <p className="text-xs text-slate-500 font-mono">No results.</p>
        ) : (
          <>
            <table className="w-full border-collapse">
              <tbody>
                {v4Slice.map((p, i) => (
                  <tr key={i} className="table-row">
                    <td className="table-cell data-value text-mono-green font-mono">
                      {p.prefix}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {v4Pages > 1 && (
              <div className="flex gap-2 mt-2 items-center text-xs font-mono text-slate-400">
                <button
                  disabled={v4Page === 0}
                  onClick={() => setV4Page((p) => p - 1)}
                  className="hover:text-accent disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span>
                  {v4Page + 1}/{v4Pages}
                </span>
                <button
                  disabled={v4Page >= v4Pages - 1}
                  onClick={() => setV4Page((p) => p + 1)}
                  className="hover:text-accent disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* IPv6 */}
      <div>
        <div className="section-title">
          IPv6 <span className="badge badge-gray ml-2">{v6.length}</span>
        </div>
        {v6Slice.length === 0 ? (
          <p className="text-xs text-slate-500 font-mono">No results.</p>
        ) : (
          <>
            <table className="w-full border-collapse">
              <tbody>
                {v6Slice.map((p, i) => (
                  <tr key={i} className="table-row">
                    <td className="table-cell data-value text-mono-green font-mono">
                      {p.prefix}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {v6Pages > 1 && (
              <div className="flex gap-2 mt-2 items-center text-xs font-mono text-slate-400">
                <button
                  disabled={v6Page === 0}
                  onClick={() => setV6Page((p) => p - 1)}
                  className="hover:text-accent disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span>
                  {v6Page + 1}/{v6Pages}
                </span>
                <button
                  disabled={v6Page >= v6Pages - 1}
                  onClick={() => setV6Page((p) => p + 1)}
                  className="hover:text-accent disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function NeighbourRow({
  n,
  onSearch,
}: {
  n: NeighbourEntry;
  onSearch: (q: string) => void;
}) {
  return (
    <tr className="table-row">
      <td className="table-cell data-value">
        <button
          onClick={() => onSearch(`AS${n.asn}`)}
          className="font-mono text-accent hover:underline"
        >
          AS{n.asn}
        </button>
      </td>
      <td className="table-cell data-value text-slate-400 font-mono">{n.power}</td>
      <td className="table-cell data-value text-slate-400 font-mono">{n.prefixes}</td>
    </tr>
  );
}

function PeersTab({
  data,
  loading,
  error,
  asnName,
  asnId,
  onSearch,
}: {
  data: NeighboursPayload | null;
  loading: boolean;
  error: string | null;
  asnName: string | null | undefined;
  asnId: string | null | undefined;
  onSearch: (q: string) => void;
}) {
  if (loading) return <LoadingCard msg="▶ Loading neighbours…" />;
  if (error) return <ErrorCard msg={error} />;
  if (!data) return null;

  const upstreams20 = data.upstreams.slice(0, 20);
  const downstreams20 = data.downstreams.slice(0, 20);

  function NeighbourTable({
    rows,
    label,
  }: {
    rows: NeighbourEntry[];
    label: string;
  }) {
    if (rows.length === 0)
      return <p className="text-xs text-slate-500 font-mono">No {label}.</p>;
    return (
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="table-cell data-label text-left">ASN</th>
            <th className="table-cell data-label text-left">POWER</th>
            <th className="table-cell data-label text-left">PREFIXES</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((n, i) => (
            <NeighbourRow key={i} n={n} onSearch={onSearch} />
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connectivity diagram */}
      <div className="flex flex-col items-center gap-0">
        {/* Upstreams */}
        <div className="w-full max-w-lg">
          <div className="section-title text-center mb-1">
            Upstreams
            <span className="badge badge-gray ml-2">{data.upstream_count}</span>
          </div>
          <NeighbourTable rows={upstreams20} label="upstreams" />
        </div>

        {/* Up arrow */}
        <div className="text-center text-slate-500 font-mono text-sm py-1 select-none">
          ▲ transit ▲
        </div>

        {/* ASN node box */}
        <div className="border border-accent px-4 py-2 font-mono text-accent text-sm my-1">
          {asnId ?? "—"}{asnName ? ` — ${asnName}` : ""}
        </div>

        {/* Down arrow */}
        <div className="text-center text-slate-500 font-mono text-sm py-1 select-none">
          ▼ customers ▼
        </div>

        {/* Downstreams */}
        <div className="w-full max-w-lg">
          <div className="section-title text-center mb-1">
            Downstreams
            <span className="badge badge-gray ml-2">{data.downstream_count}</span>
          </div>
          <NeighbourTable rows={downstreams20} label="downstreams" />
        </div>
      </div>

      {/* Peers (lateral) */}
      {data.peers.length > 0 && (
        <div>
          <div className="section-title">
            Peers
            <span className="badge badge-gray ml-2">{data.peer_count}</span>
          </div>
          <NeighbourTable rows={data.peers} label="peers" />
        </div>
      )}
    </div>
  );
}

function WhoisTab({
  data,
  loading,
  error,
}: {
  data: WhoisPayload | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) return <LoadingCard msg="▶ Loading WHOIS…" />;
  if (error) return <ErrorCard msg={error} />;
  if (!data) return null;

  const rows: [string, string | null | undefined][] = [
    ["HANDLE", data.handle],
    ["NAME", data.name],
    ["ORG", data.org],
    ["RIR", data.rir],
    ["COUNTRY", data.country],
    ["REGISTERED", data.registration_date],
    ["LAST CHANGED", data.last_changed_date],
    ["RDAP SOURCE", data.rdap_url],
  ];

  return (
    <div className="space-y-4">
      <table className="w-full border-collapse">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="table-row">
              <td className="table-cell data-label w-40">{label}</td>
              <td className="table-cell data-value font-mono text-slate-200">
                {value ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {data.remarks.length > 0 && (
        <details className="text-xs font-mono">
          <summary className="cursor-pointer text-slate-400 hover:text-slate-200 select-none">
            Remarks ({data.remarks.length})
          </summary>
          <pre className="mt-2 p-3 bg-slate-900 rounded text-slate-300 whitespace-pre-wrap overflow-auto">
            {data.remarks.join("\n")}
          </pre>
        </details>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function BgpResult({ data, input_type, onSearch }: Props) {
  if (input_type === "asn") {
    return <AsnView data={data} onSearch={onSearch} />;
  }
  return <PrefixView data={data} onSearch={onSearch} />;
}

function AsnView({
  data,
  onSearch,
}: {
  data: Record<string, unknown>;
  onSearch: (q: string) => void;
}) {
  const d = data as AsnData;
  const [activeTab, setActiveTab] = useState<AsnTab>("overview");

  const [prefixData, setPrefixData] = useState<PrefixesPayload | null>(null);
  const [prefixLoading, setPrefixLoading] = useState(false);
  const [prefixError, setPrefixError] = useState<string | null>(null);

  const [peersData, setPeersData] = useState<NeighboursPayload | null>(null);
  const [peersLoading, setPeersLoading] = useState(false);
  const [peersError, setPeersError] = useState<string | null>(null);

  const [whoisData, setWhoisData] = useState<WhoisPayload | null>(null);
  const [whoisLoading, setWhoisLoading] = useState(false);
  const [whoisError, setWhoisError] = useState<string | null>(null);

  const asn = d.asn ?? "";

  useEffect(() => {
    if (!asn) return;

    if (activeTab === "prefixes" && !prefixData && !prefixLoading) {
      setPrefixLoading(true);
      setPrefixError(null);
      fetch(`/api/v1/asn/${encodeURIComponent(asn)}/prefixes`)
        .then((r) =>
          r.ok
            ? r.json()
            : r
                .json()
                .then((b: { detail?: string }) =>
                  Promise.reject(b.detail ?? `HTTP ${r.status}`)
                )
        )
        .then((body: { result?: PrefixesPayload }) =>
          setPrefixData(body.result ?? null)
        )
        .catch((err: unknown) =>
          setPrefixError(
            typeof err === "string" ? err : "Failed to load prefixes"
          )
        )
        .finally(() => setPrefixLoading(false));
    }

    if (activeTab === "peers" && !peersData && !peersLoading) {
      setPeersLoading(true);
      setPeersError(null);
      fetch(`/api/v1/asn/${encodeURIComponent(asn)}/neighbours`)
        .then((r) =>
          r.ok
            ? r.json()
            : r
                .json()
                .then((b: { detail?: string }) =>
                  Promise.reject(b.detail ?? `HTTP ${r.status}`)
                )
        )
        .then((body: { result?: NeighboursPayload }) =>
          setPeersData(body.result ?? null)
        )
        .catch((err: unknown) =>
          setPeersError(
            typeof err === "string" ? err : "Failed to load neighbours"
          )
        )
        .finally(() => setPeersLoading(false));
    }

    if (activeTab === "whois" && !whoisData && !whoisLoading) {
      setWhoisLoading(true);
      setWhoisError(null);
      fetch(`/api/v1/asn/${encodeURIComponent(asn)}/whois`)
        .then((r) =>
          r.ok
            ? r.json()
            : r
                .json()
                .then((b: { detail?: string }) =>
                  Promise.reject(b.detail ?? `HTTP ${r.status}`)
                )
        )
        .then((body: { result?: WhoisPayload }) =>
          setWhoisData(body.result ?? null)
        )
        .catch((err: unknown) =>
          setWhoisError(
            typeof err === "string" ? err : "Failed to load WHOIS"
          )
        )
        .finally(() => setWhoisLoading(false));
    }
  }, [activeTab, asn]);

  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div>
        <div className="font-mono text-2xl text-slate-900 dark:text-slate-100 tracking-tight">
          {d.asn ?? "—"}
        </div>
        {(d.name || d.description) && (
          <div className="font-mono text-sm text-slate-400 mt-1">
            {d.name ?? d.description}
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-2">
          {d.country && <span className="badge badge-blue">{d.country}</span>}
          {d.rir && <span className="badge badge-gray">{d.rir}</span>}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-700">
        {(["overview", "prefixes", "peers", "whois"] as AsnTab[]).map((tab) => (
          <TabButton
            key={tab}
            label={tab.charAt(0).toUpperCase() + tab.slice(1)}
            active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          />
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && <OverviewTab d={d} />}
      {activeTab === "prefixes" && (
        <PrefixesTab data={prefixData} loading={prefixLoading} error={prefixError} />
      )}
      {activeTab === "peers" && (
        <PeersTab
          data={peersData}
          loading={peersLoading}
          error={peersError}
          asnName={d.name}
          asnId={d.asn}
          onSearch={onSearch}
        />
      )}
      {activeTab === "whois" && (
        <WhoisTab data={whoisData} loading={whoisLoading} error={whoisError} />
      )}
    </div>
  );
}

function PrefixView({
  data,
}: {
  data: Record<string, unknown>;
  onSearch: (q: string) => void;
}) {
  const d = data as PrefixData;
  const originAsns = d.origin_asns ?? [];
  const rpkiStatus = d.rpki_state ?? d.rpki?.status ?? "unknown";
  const rpkiBadge = RPKI_BADGE[rpkiStatus] ?? "badge-gray";

  return (
    <div className="card p-5 space-y-5">
      {/* Header */}
      <div>
        <div className="font-mono text-2xl text-slate-900 dark:text-slate-100 tracking-tight">
          {d.prefix ?? "—"}
        </div>
        {(d.name || d.description) && (
          <div className="font-mono text-sm text-slate-400 mt-1">
            {d.name ?? d.description}
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-2">
          {d.country && <span className="badge badge-blue">{d.country}</span>}
          {d.rir && <span className="badge badge-gray">{d.rir}</span>}
          {(d.rpki || d.rpki_state) && (
            <span className={`badge ${rpkiBadge}`}>RPKI: {rpkiStatus}</span>
          )}
        </div>
      </div>

      {/* Origin ASNs */}
      {originAsns.length > 0 && (
        <div>
          <div className="section-title">Origin ASNs</div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="table-cell data-label text-left w-32">ASN</th>
                <th className="table-cell data-label text-left">NAME</th>
              </tr>
            </thead>
            <tbody>
              {originAsns.map((a, i) => (
                <tr key={i} className="table-row">
                  <td className="table-cell data-value text-accent">{a.asn}</td>
                  <td className="table-cell data-value text-slate-400">{a.name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
