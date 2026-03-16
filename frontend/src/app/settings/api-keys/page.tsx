"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { listApiKeys, createApiKey, deleteApiKey } from "@/lib/api";
import type { ApiKeyOut, ApiKeyCreated } from "@/lib/types";
import Sidebar from "@/components/Sidebar";

function formatDate(str: string): string {
  return new Date(str).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ApiKeysPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKeyOut[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [newlyCreated, setNewlyCreated] = useState<ApiKeyCreated | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    setFetching(true);
    listApiKeys(token)
      .then((data) => {
        setKeys(data);
        setError(null);
      })
      .catch(() => setError("Failed to load API keys."))
      .finally(() => setFetching(false));
  }, [token, authLoading, router]);

  async function handleGenerate() {
    if (!token || !newKeyName.trim()) return;
    setGenerating(true);
    setGenerateError(null);
    setNewlyCreated(null);
    try {
      const created = await createApiKey(token, newKeyName.trim());
      setNewlyCreated(created);
      setKeys((prev) => [created, ...prev]);
      setNewKeyName("");
    } catch {
      setGenerateError("Failed to create API key. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleRevoke(id: string, name: string) {
    if (!token) return;
    if (!window.confirm(`Revoke API key "${name}"? This cannot be undone.`)) return;
    setRevokingId(id);
    try {
      await deleteApiKey(token, id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
      if (newlyCreated?.id === id) setNewlyCreated(null);
    } catch {
      // deletion failed — leave row in place
    } finally {
      setRevokingId(null);
    }
  }

  async function handleCopy() {
    if (!newlyCreated) return;
    try {
      await navigator.clipboard.writeText(newlyCreated.raw_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard access denied
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex gap-8">
      <Sidebar />
      <div className="flex-1">
        <div className="mb-6">
          <p className="section-title">API Keys</p>
        </div>

        {/* New key form */}
        <div className="card p-4 mb-6">
          <p className="data-label mb-3">Generate New Key</p>
          <div className="flex gap-3 items-start">
            <input
              ref={inputRef}
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="Key name (e.g. my-script)"
              className="input-field flex-1"
              disabled={generating}
            />
            <button
              onClick={handleGenerate}
              disabled={generating || !newKeyName.trim()}
              className="btn-primary disabled:opacity-50"
            >
              {generating ? "Generating…" : "Generate"}
            </button>
          </div>
          {generateError && (
            <p className="text-mono-red text-sm mono mt-2">{generateError}</p>
          )}
        </div>

        {/* Newly created key reveal box */}
        {newlyCreated && (
          <div className="card p-4 mb-6 border border-yellow-600/40 bg-yellow-900/10">
            <div className="flex items-start gap-2 mb-3">
              <span className="text-yellow-400 text-base leading-none mt-0.5">⚠</span>
              <p className="text-yellow-300 text-sm font-medium">
                Copy this key now — it will not be shown again
              </p>
            </div>
            <div className="flex items-center gap-3">
              <code className="mono text-accent flex-1 break-all select-all">
                {newlyCreated.raw_key}
              </code>
              <button
                onClick={handleCopy}
                className="btn-ghost text-xs px-3 py-1.5 shrink-0"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="card p-4 text-mono-red text-sm mono mb-4">{error}</div>
        )}

        {/* Keys table */}
        <div className="card overflow-hidden mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="table-cell text-left data-label">Name</th>
                <th className="table-cell text-left data-label">Prefix</th>
                <th className="table-cell text-left data-label">Created</th>
                <th className="table-cell text-left data-label">Last Used</th>
                <th className="table-cell text-left data-label">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fetching ? (
                <tr>
                  <td colSpan={5} className="table-cell py-6 text-center">
                    <div className="inline-block h-4 w-32 bg-surface rounded animate-pulse" />
                  </td>
                </tr>
              ) : keys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-cell py-8 text-center text-slate-500 text-sm">
                    No API keys yet. Generate one above.
                  </td>
                </tr>
              ) : (
                keys.map((k) => (
                  <tr key={k.id} className="table-row">
                    <td className="table-cell text-slate-200 text-sm">{k.name}</td>
                    <td className="table-cell mono text-accent">{k.prefix}</td>
                    <td className="table-cell text-slate-400 text-sm">
                      {formatDate(k.created_at)}
                    </td>
                    <td className="table-cell text-slate-400 text-sm">
                      {k.last_used_at ? formatDate(k.last_used_at) : "Never"}
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => handleRevoke(k.id, k.name)}
                        disabled={revokingId === k.id}
                        className="btn-ghost text-xs px-2 py-1 text-mono-red hover:text-mono-red disabled:opacity-50"
                      >
                        {revokingId === k.id ? "…" : "revoke"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Usage example */}
        <div className="card p-4">
          <p className="data-label mb-3">Usage Example</p>
          <pre className="mono text-slate-300 text-xs overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
            {`curl -H "X-API-Key: itk_YOUR_KEY" https://your-domain/api/v1/search \\
  -H "Content-Type: application/json" \\
  -d '{"q":"8.8.8.8"}'`}
          </pre>
        </div>
      </div>
    </div>
  );
}
