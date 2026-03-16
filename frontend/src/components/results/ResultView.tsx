"use client";
import { useEffect, useState } from "react";
import type { LookupResponse } from "@/lib/types";
import IpResult from "./IpResult";
import DnsResult from "./DnsResult";
import BgpResult from "./BgpResult";
import MailResult from "./MailResult";
import HttpResult from "./HttpResult";
import TlsResult from "./TlsResult";
import PivotLinks from "./PivotLinks";

interface Props {
  result: LookupResponse;
  onSearch: (q: string) => void;
}

export default function ResultView({ result, onSearch }: Props) {
  const { input_type, result: data, pivots, error, normalized } = result;
  const [mailData, setMailData] = useState<Record<string, unknown> | null>(null);
  const [mailLoading, setMailLoading] = useState(false);
  const [mailError, setMailError] = useState<string | null>(null);

  useEffect(() => {
    if (input_type !== "domain" || !normalized) {
      setMailData(null);
      setMailError(null);
      return;
    }
    setMailLoading(true);
    setMailData(null);
    setMailError(null);
    fetch(`/api/v1/mail/${encodeURIComponent(normalized)}`)
      .then((r) => r.ok ? r.json() : r.json().then((b: { detail?: string }) => Promise.reject(b.detail ?? `HTTP ${r.status}`)))
      .then((d: { result?: Record<string, unknown>; error?: string | null }) => {
        if (d.error) {
          setMailError(d.error);
        } else {
          setMailData(d.result ?? null);
        }
      })
      .catch((err: unknown) => setMailError(typeof err === "string" ? err : "Mail diagnostics unavailable"))
      .finally(() => setMailLoading(false));
  }, [input_type, normalized]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="card p-4 font-mono text-sm text-mono-red">
          ✕ {error}
        </div>
      )}

      {input_type === "ipv4" || input_type === "ipv6" ? (
        <IpResult data={data} />
      ) : input_type === "domain" ? (
        <>
          <DnsResult data={data} />
          {mailLoading && (
            <div className="card p-4 font-mono text-sm text-accent animate-pulse">
              ▶ Checking mail health...
            </div>
          )}
          {mailError && !mailLoading && (
            <div className="card p-4 font-mono text-sm text-mono-red">
              ✕ Mail diagnostics: {mailError}
            </div>
          )}
          {mailData && !mailLoading && <MailResult data={mailData} />}
        </>
      ) : input_type === "asn" ? (
        <BgpResult data={data} input_type="asn" onSearch={onSearch} />
      ) : input_type === "cidr4" || input_type === "cidr6" ? (
        <BgpResult data={data} input_type="prefix" onSearch={onSearch} />
      ) : input_type === "url" ? (
        <HttpResult data={data} />
      ) : input_type === "email" ? (
        <DnsResult data={data} />
      ) : null}

      {pivots && pivots.length > 0 && (
        <PivotLinks pivots={pivots} onSearch={onSearch} />
      )}
    </div>
  );
}
