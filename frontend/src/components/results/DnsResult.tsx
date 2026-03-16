"use client";
import { useState } from "react";

interface MxRecord {
  exchange: string;
  priority: number;
}

interface SoaRecord {
  mname: string;
  rname: string;
  serial: number;
  refresh: number;
  retry: number;
  expire: number;
  minimum: number;
}

interface CaaRecord {
  flags: number;
  tag: string;
  value: string;
}

interface DnsRecords {
  A?: string[];
  AAAA?: string[];
  MX?: MxRecord[];
  NS?: string[];
  TXT?: string[];
  CNAME?: string[];
  SOA?: SoaRecord | null;
  CAA?: CaaRecord[];
}

interface DnsData {
  name?: string | null;
  records?: DnsRecords | null;
}

interface Props {
  data: Record<string, unknown>;
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b border-surface-border last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-2 px-0 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
      >
        <span className="section-title mb-0 inline-flex items-center gap-2">
          {title}
          <span className="badge badge-gray">{count}</span>
        </span>
        <span className="text-slate-500 text-xs font-mono select-none">
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

export default function DnsResult({ data }: Props) {
  const d = data as DnsData;
  const name = d.name ?? "—";
  const records = d.records ?? {};

  const sections: React.ReactNode[] = [];

  // A records
  if (records.A && records.A.length > 0) {
    sections.push(
      <Section key="A" title="A" count={records.A.length}>
        <table className="w-full border-collapse">
          <tbody>
            {records.A.map((ip, i) => (
              <tr key={i} className="table-row">
                <td className="table-cell data-value text-mono-green">{ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    );
  }

  // AAAA records
  if (records.AAAA && records.AAAA.length > 0) {
    sections.push(
      <Section key="AAAA" title="AAAA" count={records.AAAA.length}>
        <table className="w-full border-collapse">
          <tbody>
            {records.AAAA.map((ip, i) => (
              <tr key={i} className="table-row">
                <td className="table-cell data-value text-mono-cyan">{ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    );
  }

  // CNAME records
  if (records.CNAME && records.CNAME.length > 0) {
    sections.push(
      <Section key="CNAME" title="CNAME" count={records.CNAME.length}>
        <table className="w-full border-collapse">
          <tbody>
            {records.CNAME.map((c, i) => (
              <tr key={i} className="table-row">
                <td className="table-cell data-value text-accent">{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    );
  }

  // MX records
  if (records.MX && records.MX.length > 0) {
    sections.push(
      <Section key="MX" title="MX" count={records.MX.length}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="table-cell data-label text-left w-20">PRIORITY</th>
              <th className="table-cell data-label text-left">EXCHANGE</th>
            </tr>
          </thead>
          <tbody>
            {records.MX.map((mx, i) => (
              <tr key={i} className="table-row">
                <td className="table-cell data-value text-mono-yellow">{mx.priority}</td>
                <td className="table-cell data-value">{mx.exchange}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    );
  }

  // NS records
  if (records.NS && records.NS.length > 0) {
    sections.push(
      <Section key="NS" title="NS" count={records.NS.length}>
        <table className="w-full border-collapse">
          <tbody>
            {records.NS.map((ns, i) => (
              <tr key={i} className="table-row">
                <td className="table-cell data-value">{ns}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    );
  }

  // TXT records
  if (records.TXT && records.TXT.length > 0) {
    sections.push(
      <Section key="TXT" title="TXT" count={records.TXT.length}>
        <table className="w-full border-collapse">
          <tbody>
            {records.TXT.map((txt, i) => (
              <tr key={i} className="table-row">
                <td className="table-cell mono text-slate-700 dark:text-slate-300 break-all whitespace-pre-wrap">
                  {txt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    );
  }

  // SOA record
  if (records.SOA) {
    const soa = records.SOA;
    sections.push(
      <Section key="SOA" title="SOA" count={1}>
        <table className="w-full border-collapse">
          <tbody>
            {(
              [
                ["MNAME", soa.mname],
                ["RNAME", soa.rname],
                ["SERIAL", String(soa.serial)],
                ["REFRESH", String(soa.refresh)],
                ["RETRY", String(soa.retry)],
                ["EXPIRE", String(soa.expire)],
                ["MINIMUM", String(soa.minimum)],
              ] as [string, string][]
            ).map(([k, v]) => (
              <tr key={k} className="table-row">
                <td className="table-cell data-label w-24">{k}</td>
                <td className="table-cell data-value">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    );
  }

  // CAA records
  if (records.CAA && records.CAA.length > 0) {
    sections.push(
      <Section key="CAA" title="CAA" count={records.CAA.length}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="table-cell data-label text-left w-16">FLAGS</th>
              <th className="table-cell data-label text-left w-24">TAG</th>
              <th className="table-cell data-label text-left">VALUE</th>
            </tr>
          </thead>
          <tbody>
            {records.CAA.map((caa, i) => (
              <tr key={i} className="table-row">
                <td className="table-cell data-value">{caa.flags}</td>
                <td className="table-cell data-value text-mono-yellow">{caa.tag}</td>
                <td className="table-cell data-value break-all">{caa.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    );
  }

  return (
    <div className="card p-5">
      <div className="font-mono text-xl text-slate-900 dark:text-slate-100 tracking-tight mb-4">
        {name}
      </div>
      {sections.length > 0 ? (
        <div className="divide-y divide-surface-border">{sections}</div>
      ) : (
        <div className="mono text-slate-500">No records found.</div>
      )}
    </div>
  );
}
