"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { listSavedResults, deleteSavedResult } from "@/lib/api";
import type { SavedResultOut } from "@/lib/types";
import Sidebar from "@/components/Sidebar";

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

function SkeletonRows() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <tr key={i} className="table-row animate-pulse">
          <td className="table-cell">
            <div className="h-4 bg-surface rounded w-32" />
          </td>
          <td className="table-cell">
            <div className="h-4 bg-surface rounded w-14" />
          </td>
          <td className="table-cell">
            <div className="h-4 bg-surface rounded w-24" />
          </td>
          <td className="table-cell">
            <div className="h-4 bg-surface rounded w-20" />
          </td>
        </tr>
      ))}
    </>
  );
}

export default function DashboardPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [results, setResults] = useState<SavedResultOut[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    setFetching(true);
    listSavedResults(token)
      .then((data) => {
        setResults(data);
        setError(null);
      })
      .catch(() => setError("Failed to load saved results."))
      .finally(() => setFetching(false));
  }, [token, authLoading, router]);

  async function handleDelete(id: string) {
    if (!token) return;
    setDeletingId(id);
    try {
      await deleteSavedResult(token, id);
      setResults((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // deletion failed — leave row in place
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex gap-8">
      <Sidebar />
      <div className="flex-1">
        <div className="mb-6">
          <p className="section-title">Saved Results</p>
          {!fetching && (
            <p className="text-slate-400 text-sm mono mt-1">
              {results.length} {results.length === 1 ? "result" : "results"}
            </p>
          )}
        </div>

        {error && (
          <div className="card p-4 text-mono-red text-sm mono mb-4">{error}</div>
        )}

        <div className="card overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="table-cell text-left data-label">Input</th>
                <th className="table-cell text-left data-label">Type</th>
                <th className="table-cell text-left data-label">Saved</th>
                <th className="table-cell text-left data-label">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fetching ? (
                <SkeletonRows />
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={4} className="table-cell py-8 text-center text-slate-500 text-sm">
                    No saved results yet. Search for something and click Save.
                  </td>
                </tr>
              ) : (
                results.map((r) => (
                  <tr key={r.id} className="table-row">
                    <td className="table-cell mono text-slate-200">
                      {r.label ? (
                        <span>
                          <span>{r.label}</span>
                          <span className="text-slate-500 ml-2">({r.input})</span>
                        </span>
                      ) : (
                        r.input
                      )}
                    </td>
                    <td className="table-cell">
                      <span className={typeBadgeClass(r.input_type)}>
                        {r.input_type}
                      </span>
                    </td>
                    <td className="table-cell text-slate-400 text-sm">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/r/${r.permalink_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-ghost text-xs px-2 py-1"
                        >
                          open ↗
                        </Link>
                        <button
                          onClick={() => handleDelete(r.id)}
                          disabled={deletingId === r.id}
                          className="btn-ghost text-xs px-2 py-1 text-mono-red hover:text-mono-red disabled:opacity-50"
                        >
                          {deletingId === r.id ? "…" : "delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
