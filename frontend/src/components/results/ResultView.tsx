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

  useEffect(() => {
    if (input_type !== "domain" || !normalized) {
      setMailData(null);
      return;
    }
    setMailLoading(true);
    setMailData(null);
    fetch(`/api/v1/mail/${encodeURIComponent(normalized)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setMailData(d?.result ?? null))
      .catch(() => setMailData(null))
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
          {mailData && <MailResult data={mailData} />}
        </>
      ) : input_type === "asn" ? (
        <BgpResult data={data} input_type="asn" />
      ) : input_type === "cidr4" || input_type === "cidr6" ? (
        <BgpResult data={data} input_type="prefix" />
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
