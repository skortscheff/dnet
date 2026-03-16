"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPermalink } from "@/lib/api";
import ResultView from "@/components/results/ResultView";
import type { LookupResponse } from "@/lib/types";

function formatDate(str: string): string {
  return new Date(str).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function typeBadgeClass(inputType: string): string {
  switch (inputType) {
    case "ipv4":
    case "ipv6":
      return "badge-blue";
    case "domain":
      return "badge-green";
    case "asn":
      return "badge-gray";
    default:
      return "badge-gray";
  }
}

type PageState = "loading" | "notfound" | "error" | "success";

export default function PermalinkPage() {
  const params = useParams<{ id: string }>();
  const { id } = params;

  const [state, setState] = useState<PageState>("loading");
  const [result, setResult] = useState<LookupResponse | null>(null);

  useEffect(() => {
    if (!id) return;
    setState("loading");
    getPermalink(id)
      .then((data: LookupResponse) => {
        setResult(data);
        setState("success");
      })
      .catch((err: unknown) => {
        const status =
          err instanceof Error && "status" in err
            ? (err as Error & { status?: number }).status
            : undefined;
        setState(status === 404 ? "notfound" : "error");
      });
  }, [id]);

  if (state === "loading") {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="mono text-slate-400 text-sm animate-pulse">Fetching result…</p>
      </div>
    );
  }

  if (state === "notfound" || state === "error") {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="mono text-slate-400 text-sm">Result not found or expired.</p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Result header */}
      <div className="card p-4 mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className={typeBadgeClass(result.input_type)}>{result.input_type}</span>
          <span className="mono text-accent text-lg font-semibold">{result.input}</span>
        </div>
        <p className="data-label">Saved {formatDate(result.timestamp)}</p>
      </div>

      {/* Result body */}
      <ResultView result={result} onSearch={() => {}} />
    </div>
  );
}
