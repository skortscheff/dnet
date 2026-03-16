"use client";

import React from "react";

interface MxRecord {
  priority: number;
  host: string;
}

interface MxData {
  records: MxRecord[];
  found: boolean;
}

interface SpfData {
  found: boolean;
  record: string | null;
  valid: boolean;
}

interface DmarcData {
  found: boolean;
  record: string | null;
  policy: string | null;
  rua: string | null;
}

interface DkimData {
  selectors_found: string[];
  selectors_checked: string[];
}

interface MtaStsData {
  dns_record_found: boolean;
}

interface BimiData {
  found: boolean;
  record: string | null;
}

interface HealthSummary {
  mx_ok: boolean;
  spf_ok: boolean;
  dmarc_ok: boolean;
  dkim_ok: boolean;
}

interface MailData {
  domain?: string | null;
  mx?: MxData;
  spf?: SpfData;
  dmarc?: DmarcData;
  dkim?: DkimData;
  mta_sts?: MtaStsData;
  bimi?: BimiData;
  health_summary?: HealthSummary;
}

interface Props {
  data: Record<string, unknown>;
}

function HealthBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`badge ${ok ? "badge-green" : "badge-red"}`}>
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr className="table-row">
      <td className="table-cell data-label w-28 select-none">{label}</td>
      <td className="table-cell data-value break-all">{value}</td>
    </tr>
  );
}

export default function MailResult({ data }: Props) {
  const d = data as MailData;
  const h = d.health_summary;
  const mx = d.mx;
  const spf = d.spf;
  const dmarc = d.dmarc;
  const dkim = d.dkim;
  const mta_sts = d.mta_sts;
  const bimi = d.bimi;

  return (
    <div className="card p-5 space-y-5">
      {/* Domain header */}
      <div className="font-mono text-xl text-slate-900 dark:text-slate-100 tracking-tight">
        {d.domain ?? "—"}
      </div>

      {/* Health badges */}
      {h && (
        <div className="flex flex-wrap gap-2">
          <HealthBadge ok={h.mx_ok} label="MX" />
          <HealthBadge ok={h.spf_ok} label="SPF" />
          <HealthBadge ok={h.dmarc_ok} label="DMARC" />
          <HealthBadge ok={h.dkim_ok} label="DKIM" />
          {mta_sts && <HealthBadge ok={mta_sts.dns_record_found} label="MTA-STS" />}
        </div>
      )}

      {/* MX Records */}
      {mx && (
        <div>
          <div className="section-title">MX Records</div>
          {mx.records.length > 0 ? (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="table-cell data-label text-left w-20">PRIORITY</th>
                  <th className="table-cell data-label text-left">HOST</th>
                </tr>
              </thead>
              <tbody>
                {mx.records.map((m, i) => (
                  <tr key={i} className="table-row">
                    <td className="table-cell data-value text-mono-yellow">{m.priority}</td>
                    <td className="table-cell data-value">{m.host}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-500 font-mono">No MX records found</p>
          )}
        </div>
      )}

      {/* SPF */}
      {spf && (
        <div>
          <div className="section-title">SPF Record</div>
          <table className="w-full border-collapse">
            <tbody>
              <DetailRow
                label="RECORD"
                value={
                  spf.record ? (
                    <span className="text-mono-green">{spf.record}</span>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )
                }
              />
              <DetailRow
                label="VALID"
                value={
                  <span className={spf.valid ? "text-mono-green" : "text-mono-red"}>
                    {spf.valid ? "Yes" : "No"}
                  </span>
                }
              />
            </tbody>
          </table>
        </div>
      )}

      {/* DMARC */}
      {dmarc && (
        <div>
          <div className="section-title">DMARC Record</div>
          <table className="w-full border-collapse">
            <tbody>
              <DetailRow
                label="RECORD"
                value={
                  dmarc.record ? (
                    <span className="text-mono-cyan break-all">{dmarc.record}</span>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )
                }
              />
              <DetailRow
                label="POLICY"
                value={
                  dmarc.policy ? (
                    <span className={dmarc.policy === "reject" || dmarc.policy === "quarantine" ? "text-mono-green" : "text-mono-yellow"}>
                      {dmarc.policy}
                    </span>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )
                }
              />
              {dmarc.rua && (
                <DetailRow label="RUA" value={<span className="text-slate-600 dark:text-slate-400">{dmarc.rua}</span>} />
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* DKIM */}
      {dkim && (
        <div>
          <div className="section-title">DKIM</div>
          <table className="w-full border-collapse">
            <tbody>
              <DetailRow
                label="SELECTORS"
                value={
                  dkim.selectors_found.length > 0 ? (
                    <span className="text-mono-green">{dkim.selectors_found.join(", ")}</span>
                  ) : (
                    <span className="text-mono-red">None found</span>
                  )
                }
              />
              <DetailRow
                label="CHECKED"
                value={<span className="text-slate-500">{dkim.selectors_checked.join(", ")}</span>}
              />
            </tbody>
          </table>
        </div>
      )}

      {/* MTA-STS */}
      {mta_sts && (
        <div>
          <div className="section-title">MTA-STS</div>
          <table className="w-full border-collapse">
            <tbody>
              <DetailRow
                label="DNS RECORD"
                value={
                  <span className={mta_sts.dns_record_found ? "text-mono-green" : "text-slate-500"}>
                    {mta_sts.dns_record_found ? "Found" : "Not found"}
                  </span>
                }
              />
            </tbody>
          </table>
        </div>
      )}

      {/* BIMI */}
      {bimi && bimi.found && bimi.record && (
        <div>
          <div className="section-title">BIMI</div>
          <div className="mono text-slate-700 dark:text-slate-300 break-all text-sm">{bimi.record}</div>
        </div>
      )}
    </div>
  );
}
