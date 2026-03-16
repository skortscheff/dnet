"use client";
import { useState } from "react";

interface AnnouncedPrefix {
  prefix: string;
  name?: string | null;
}

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
  announced_prefixes?: AnnouncedPrefix[];
}

interface PrefixData {
  prefix?: string | null;
  name?: string | null;
  description?: string | null;
  country?: string | null;
  rir?: string | null;
  origin_asns?: OriginAsn[];
  rpki?: RpkiStatus | null;
}

interface Props {
  data: Record<string, unknown>;
  input_type: "asn" | "prefix";
}

const RPKI_BADGE: Record<string, string> = {
  valid: "badge-green",
  invalid: "badge-red",
  "not-found": "badge-yellow",
  unknown: "badge-gray",
};

const PREFIXES_PAGE = 10;

export default function BgpResult({ data, input_type }: Props) {
  const [showAll, setShowAll] = useState(false);

  if (input_type === "asn") {
    const d = data as AsnData;
    const prefixes = d.announced_prefixes ?? [];
    const visible = showAll ? prefixes : prefixes.slice(0, PREFIXES_PAGE);

    return (
      <div className="card p-5 space-y-5">
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

        {/* Announced prefixes */}
        {prefixes.length > 0 && (
          <div>
            <div className="section-title">
              Announced prefixes
              <span className="badge badge-gray ml-2">{prefixes.length}</span>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="table-cell data-label text-left">PREFIX</th>
                  <th className="table-cell data-label text-left">NAME</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p, i) => (
                  <tr key={i} className="table-row">
                    <td className="table-cell data-value text-mono-green">{p.prefix}</td>
                    <td className="table-cell data-value text-slate-400">{p.name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {prefixes.length > PREFIXES_PAGE && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="mt-2 text-xs font-mono text-accent hover:underline"
              >
                {showAll
                  ? "Show less"
                  : `Show ${prefixes.length - PREFIXES_PAGE} more…`}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Prefix view
  const d = data as PrefixData;
  const originAsns = d.origin_asns ?? [];
  const rpki = d.rpki ?? null;
  const rpkiStatus = rpki?.status ?? "unknown";
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
          {rpki && (
            <span className={`badge ${rpkiBadge}`}>
              RPKI: {rpkiStatus}
            </span>
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
