"use client";

interface CertEntity {
  cn?: string | null;
  o?: string | null;
}

interface SanEntry {
  type: string;
  value: string;
}

interface TlsData {
  host?: string | null;
  port?: number | null;
  tls_version?: string | null;
  cipher_suite?: string | null;
  subject?: CertEntity | null;
  issuer?: CertEntity | null;
  not_before?: string | null;
  not_after?: string | null;
  days_until_expiry?: number | null;
  expired?: boolean | null;
  san?: SanEntry[];
  san_count?: number | null;
}

interface Props {
  data: Record<string, unknown>;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toUTCString().replace(" GMT", " UTC");
  } catch {
    return iso;
  }
}

function expiryBadgeClass(days: number | null | undefined, expired: boolean | null | undefined): string {
  if (expired) return "badge-red";
  if (days == null) return "badge-gray";
  if (days <= 0) return "badge-red";
  if (days <= 30) return "badge-yellow";
  return "badge-green";
}

function expiryLabel(days: number | null | undefined, expired: boolean | null | undefined): string {
  if (expired) return "Expired";
  if (days == null) return "Unknown";
  if (days <= 0) return "Expired";
  return `${days}d remaining`;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr className="table-row">
      <td className="table-cell data-label w-28 select-none">{label}</td>
      <td className="table-cell data-value break-all">{value}</td>
    </tr>
  );
}

export default function TlsResult({ data }: Props) {
  const d = data as TlsData;
  const san = d.san ?? [];
  const badgeClass = expiryBadgeClass(d.days_until_expiry, d.expired);
  const badgeLabel = expiryLabel(d.days_until_expiry, d.expired);

  return (
    <div className="card p-5 space-y-5">
      {/* Header */}
      <div>
        <div className="font-mono text-xl text-slate-900 dark:text-slate-100 tracking-tight">
          {d.host ?? "—"}
          {d.port != null && (
            <span className="text-slate-500">:{d.port}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
          {d.tls_version && (
            <span className="badge badge-blue">{d.tls_version}</span>
          )}
        </div>
      </div>

      {/* Certificate details */}
      <div>
        <div className="section-title">Certificate</div>
        <table className="w-full border-collapse">
          <tbody>
            <Row
              label="SUBJECT CN"
              value={d.subject?.cn ?? <span className="text-slate-500">—</span>}
            />
            <Row
              label="SUBJECT O"
              value={d.subject?.o ?? <span className="text-slate-500">—</span>}
            />
            <Row
              label="ISSUER CN"
              value={d.issuer?.cn ?? <span className="text-slate-500">—</span>}
            />
            <Row
              label="ISSUER O"
              value={d.issuer?.o ?? <span className="text-slate-500">—</span>}
            />
            <Row
              label="NOT BEFORE"
              value={<span className="text-slate-700 dark:text-slate-300">{formatDate(d.not_before)}</span>}
            />
            <Row
              label="NOT AFTER"
              value={
                <span className={d.expired ? "text-mono-red" : "text-slate-700 dark:text-slate-300"}>
                  {formatDate(d.not_after)}
                </span>
              }
            />
          </tbody>
        </table>
      </div>

      {/* Cipher */}
      {d.cipher_suite && (
        <div>
          <div className="section-title">Cipher suite</div>
          <div className="mono text-slate-700 dark:text-slate-300">{d.cipher_suite}</div>
        </div>
      )}

      {/* SANs */}
      {san.length > 0 && (
        <div>
          <div className="section-title">
            Subject alternative names
            <span className="badge badge-gray ml-2">{d.san_count ?? san.length}</span>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="table-cell data-label text-left w-20">TYPE</th>
                <th className="table-cell data-label text-left">VALUE</th>
              </tr>
            </thead>
            <tbody>
              {san.map((s, i) => (
                <tr key={i} className="table-row">
                  <td className="table-cell data-value text-mono-yellow">{s.type}</td>
                  <td className="table-cell data-value text-accent break-all">{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
