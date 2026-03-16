"use client";

interface Classification {
  private?: boolean;
  loopback?: boolean;
  global?: boolean;
  multicast?: boolean;
}

interface IpData {
  ip?: string | null;
  version?: number | null;
  rdns?: string | null;
  classification?: Classification | null;
  org?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  timezone?: string | null;
}

interface Props {
  data: Record<string, unknown>;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr className="table-row">
      <td className="table-cell data-label w-28 select-none">{label}</td>
      <td className="table-cell data-value">{value}</td>
    </tr>
  );
}

export default function IpResult({ data }: Props) {
  const d = data as IpData;

  const classification = d.classification ?? {};
  const classificationBadges: React.ReactNode[] = [];
  if (classification.loopback) classificationBadges.push(<span key="lo" className="badge badge-yellow">Loopback</span>);
  if (classification.private) classificationBadges.push(<span key="priv" className="badge badge-yellow">Private</span>);
  if (classification.multicast) classificationBadges.push(<span key="mc" className="badge badge-blue">Multicast</span>);
  if (classification.global) classificationBadges.push(<span key="gl" className="badge badge-green">Global</span>);

  const location = [d.city, d.region, d.country].filter(Boolean).join(", ") || "—";

  return (
    <div className="card p-5">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Left: IP + version + classification */}
        <div className="min-w-0 flex-shrink-0">
          <div className="font-mono text-2xl text-slate-100 tracking-tight break-all">
            {d.ip ?? "—"}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {d.version != null && (
              <span className="badge badge-blue">
                IPv{d.version}
              </span>
            )}
            {classificationBadges}
          </div>
        </div>

        {/* Right: data table */}
        <div className="flex-1 min-w-0">
          <table className="w-full border-collapse">
            <tbody>
              <Row label="HOSTNAME" value={<span className="text-accent">{d.rdns ?? "—"}</span>} />
              <Row label="ORG" value={d.org ?? "—"} />
              <Row label="LOCATION" value={location} />
              <Row label="TIMEZONE" value={d.timezone ?? "—"} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
