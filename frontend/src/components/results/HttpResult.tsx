"use client";

interface ChainHop {
  url: string;
  status_code?: number | null;
  location?: string | null;
  error?: string | null;
}

interface SecurityHeaders {
  "strict-transport-security"?: string | null;
  "content-security-policy"?: string | null;
  "x-frame-options"?: string | null;
  "x-content-type-options"?: string | null;
  "referrer-policy"?: string | null;
  "permissions-policy"?: string | null;
}

interface HttpData {
  url?: string | null;
  chain?: ChainHop[];
  hops?: number | null;
  final_url?: string | null;
  uses_https?: boolean | null;
  security_headers?: SecurityHeaders | null;
}

interface Props {
  data: Record<string, unknown>;
}

const SECURITY_HEADER_LABELS: [keyof SecurityHeaders, string][] = [
  ["strict-transport-security", "Strict-Transport-Security"],
  ["content-security-policy", "Content-Security-Policy"],
  ["x-frame-options", "X-Frame-Options"],
  ["x-content-type-options", "X-Content-Type-Options"],
  ["referrer-policy", "Referrer-Policy"],
  ["permissions-policy", "Permissions-Policy"],
];

function statusBadgeClass(code: number | null | undefined): string {
  if (code == null) return "badge-gray";
  if (code >= 200 && code < 300) return "badge-green";
  if (code >= 300 && code < 400) return "badge-blue";
  if (code >= 400 && code < 500) return "badge-yellow";
  if (code >= 500) return "badge-red";
  return "badge-gray";
}

export default function HttpResult({ data }: Props) {
  const d = data as HttpData;
  const chain = d.chain ?? [];
  const headers = d.security_headers ?? {};

  return (
    <div className="card p-5 space-y-5">
      {/* URL header */}
      <div>
        <div className="font-mono text-base text-slate-900 dark:text-slate-100 break-all">
          {d.url ?? "—"}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {d.uses_https != null && (
            <span className={`badge ${d.uses_https ? "badge-green" : "badge-red"}`}>
              {d.uses_https ? "HTTPS" : "HTTP only"}
            </span>
          )}
          {d.hops != null && (
            <span className="badge badge-gray">{d.hops} hop{d.hops !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>

      {/* Redirect chain */}
      {chain.length > 0 && (
        <div>
          <div className="section-title">Redirect chain</div>
          <div className="space-y-2">
            {chain.map((hop, i) => (
              <div key={i} className="flex items-start gap-3">
                {/* Arrow connector */}
                {i > 0 && (
                  <div className="flex flex-col items-center self-stretch">
                    <div className="w-px flex-1 bg-surface-border" />
                    <span className="text-slate-500 text-xs font-mono leading-none py-0.5">↓</span>
                  </div>
                )}
                <div className={`flex-1 flex items-start gap-2 py-1 ${i > 0 ? "" : ""}`}>
                  {hop.status_code != null && (
                    <span className={`badge ${statusBadgeClass(hop.status_code)} shrink-0`}>
                      {hop.status_code}
                    </span>
                  )}
                  {hop.error ? (
                    <span className="mono text-mono-red break-all">{hop.error}</span>
                  ) : (
                    <span className="mono text-slate-700 dark:text-slate-300 break-all">{hop.url}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {d.final_url && d.final_url !== chain[chain.length - 1]?.url && (
            <div className="mt-2 text-xs font-mono text-slate-500">
              Final: <span className="text-slate-700 dark:text-slate-300">{d.final_url}</span>
            </div>
          )}
        </div>
      )}

      {/* Security headers */}
      <div>
        <div className="section-title">Security headers</div>
        <table className="w-full border-collapse">
          <tbody>
            {SECURITY_HEADER_LABELS.map(([key, label]) => {
              const val = headers[key];
              const present = val != null && val !== "";
              return (
                <tr key={key} className="table-row">
                  <td className="table-cell w-8 pr-2">
                    <span className={`font-mono text-xs ${present ? "text-mono-green" : "text-mono-red"}`}>
                      {present ? "✓" : "✗"}
                    </span>
                  </td>
                  <td className="table-cell data-label">{label}</td>
                  <td className="table-cell data-value break-all">
                    {present ? (
                      <span className="text-slate-700 dark:text-slate-300">{val}</span>
                    ) : (
                      <span className="text-slate-600">missing</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
