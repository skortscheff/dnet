"use client";

interface MxEntry {
  exchange: string;
  priority: number;
}

interface HealthSummary {
  has_mx?: boolean;
  has_spf?: boolean;
  has_dmarc?: boolean;
  has_dkim?: boolean;
  has_mta_sts?: boolean;
  spf_passes?: boolean;
  dmarc_passes?: boolean;
}

interface MailData {
  domain?: string | null;
  mx?: MxEntry[];
  spf?: string | null;
  dmarc?: string | null;
  dkim_found?: boolean;
  dkim_selector?: string | null;
  mta_sts?: string | null;
  bimi?: string | null;
  health_summary?: HealthSummary | null;
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
  const h = d.health_summary ?? {};
  const mx = d.mx ?? [];

  return (
    <div className="card p-5 space-y-5">
      {/* Domain header */}
      <div className="font-mono text-xl text-slate-100 tracking-tight">
        {d.domain ?? "—"}
      </div>

      {/* Health badges */}
      <div className="flex flex-wrap gap-2">
        <HealthBadge ok={!!h.has_mx} label="MX" />
        <HealthBadge ok={!!h.has_spf} label="SPF" />
        <HealthBadge ok={!!h.has_dmarc} label="DMARC" />
        <HealthBadge ok={!!h.has_dkim} label="DKIM" />
        <HealthBadge ok={!!h.has_mta_sts} label="MTA-STS" />
      </div>

      {/* MX Records */}
      {mx.length > 0 && (
        <div>
          <div className="section-title">MX Records</div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="table-cell data-label text-left w-20">PRIORITY</th>
                <th className="table-cell data-label text-left">EXCHANGE</th>
              </tr>
            </thead>
            <tbody>
              {mx.map((m, i) => (
                <tr key={i} className="table-row">
                  <td className="table-cell data-value text-mono-yellow">{m.priority}</td>
                  <td className="table-cell data-value">{m.exchange}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SPF */}
      <div>
        <div className="section-title">SPF Record</div>
        <table className="w-full border-collapse">
          <tbody>
            <DetailRow
              label="RECORD"
              value={
                d.spf ? (
                  <span className="text-mono-green">{d.spf}</span>
                ) : (
                  <span className="text-slate-500">—</span>
                )
              }
            />
            <DetailRow
              label="PASSES"
              value={
                h.spf_passes != null ? (
                  <span className={h.spf_passes ? "text-mono-green" : "text-mono-red"}>
                    {h.spf_passes ? "Yes" : "No"}
                  </span>
                ) : (
                  <span className="text-slate-500">—</span>
                )
              }
            />
          </tbody>
        </table>
      </div>

      {/* DMARC */}
      <div>
        <div className="section-title">DMARC Record</div>
        <table className="w-full border-collapse">
          <tbody>
            <DetailRow
              label="RECORD"
              value={
                d.dmarc ? (
                  <span className="text-mono-cyan">{d.dmarc}</span>
                ) : (
                  <span className="text-slate-500">—</span>
                )
              }
            />
            <DetailRow
              label="PASSES"
              value={
                h.dmarc_passes != null ? (
                  <span className={h.dmarc_passes ? "text-mono-green" : "text-mono-red"}>
                    {h.dmarc_passes ? "Yes" : "No"}
                  </span>
                ) : (
                  <span className="text-slate-500">—</span>
                )
              }
            />
          </tbody>
        </table>
      </div>

      {/* DKIM */}
      <div>
        <div className="section-title">DKIM</div>
        <table className="w-full border-collapse">
          <tbody>
            <DetailRow
              label="FOUND"
              value={
                d.dkim_found != null ? (
                  <span className={d.dkim_found ? "text-mono-green" : "text-mono-red"}>
                    {d.dkim_found ? "Yes" : "No"}
                  </span>
                ) : (
                  <span className="text-slate-500">—</span>
                )
              }
            />
            <DetailRow
              label="SELECTOR"
              value={d.dkim_selector ?? <span className="text-slate-500">—</span>}
            />
          </tbody>
        </table>
      </div>

      {/* MTA-STS */}
      {(d.mta_sts != null || h.has_mta_sts != null) && (
        <div>
          <div className="section-title">MTA-STS Policy</div>
          <table className="w-full border-collapse">
            <tbody>
              <DetailRow
                label="POLICY"
                value={
                  d.mta_sts ? (
                    <span className="text-mono-green">{d.mta_sts}</span>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )
                }
              />
            </tbody>
          </table>
        </div>
      )}

      {/* BIMI */}
      {d.bimi && (
        <div>
          <div className="section-title">BIMI</div>
          <div className="mono text-slate-300 break-all">{d.bimi}</div>
        </div>
      )}
    </div>
  );
}
