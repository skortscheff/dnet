"use client";
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
  const { input_type, result: data, pivots, error } = result;

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
        <DnsResult data={data} />
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
