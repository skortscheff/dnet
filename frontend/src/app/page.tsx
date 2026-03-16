"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { search, saveResult } from "@/lib/api";
import type { LookupResponse } from "@/lib/types";
import Link from "next/link";
import dynamic from "next/dynamic";

const ResultView = dynamic(() => import("@/components/results/ResultView"), { ssr: false });
const HomeFeatures = dynamic(() => import("@/components/HomeFeatures"), { ssr: false });

export default function Home() {
  const { user, token } = useAuth();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [myIpLoading, setMyIpLoading] = useState(false);

  const handleExample = (q: string) => {
    setQuery(q);
    handleSearch(q);
  };

  const handleSearch = async (q?: string) => {
    const term = (q ?? query).trim();
    if (!term) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);
    try {
      const data = await search(term);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleMyIp = async () => {
    setMyIpLoading(true);
    setError(null);
    try {
      // Detect the public IP client-side so we get the browser's real external IP,
      // not the Docker bridge or proxy IP that the server would see.
      const ipRes = await fetch("https://api64.ipify.org?format=json");
      if (!ipRes.ok) throw new Error("IP detection service unavailable");
      const { ip } = await ipRes.json() as { ip: string };
      setMyIpLoading(false);
      setQuery(ip);
      handleSearch(ip);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not detect your public IP");
      setMyIpLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result || !token || !result.permalink_id) return;
    setSaving(true);
    try {
      await saveResult(token, {
        permalink_id: result.permalink_id,
        input: result.input,
        input_type: result.input_type,
      });
      setSaved(true);
    } catch {
      // ignore duplicate saves
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Auth CTA for unauthenticated users */}
      {!user && (
        <div className="mb-8 border border-accent-dim bg-sky-50 dark:bg-sky-950/30 rounded p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-accent font-mono text-sm font-medium mb-1">Create a free account</p>
            <p className="text-slate-400 text-sm">Save results, set watchlists, and get API access.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link href="/login" className="btn-ghost text-sm py-1.5 px-4 border border-surface-border">Login</Link>
            <Link href="/register" className="btn-primary text-sm py-1.5 px-4">Register</Link>
          </div>
        </div>
      )}

      {/* Search box */}
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          placeholder="8.8.8.8, github.com, AS15169, 1.1.1.0/24, https://example.com ..."
          className="input-field font-mono text-sm flex-1 py-3 px-4 text-base"
          autoFocus
          spellCheck={false}
          autoComplete="off"
        />
        <button
          onClick={() => handleSearch()}
          disabled={loading}
          className="btn-primary px-6 py-3 font-mono text-sm disabled:opacity-50 shrink-0"
        >
          {loading ? "..." : "Search"}
        </button>
      </div>
      <p className="text-xs text-slate-500 font-mono mb-6">
        Accepts IP, domain, ASN (AS15169), CIDR (1.1.1.0/24), URL, or email address
      </p>

      {/* What's my IP card — hidden once results are displayed */}
      {!result && !loading && <button
        onClick={handleMyIp}
        disabled={myIpLoading}
        className="w-full mb-8 card p-4 flex items-center gap-4 text-left hover:border-accent/50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
          <span className="text-accent text-lg leading-none">⊕</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-accent transition-colors">
            {myIpLoading ? "Detecting your IP…" : "What's my IP?"}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Find your public IP address, location, and ASN instantly
          </p>
        </div>
        <span className="font-mono text-accent text-sm shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
          {myIpLoading ? "…" : "→"}
        </span>
      </button>}

      {/* Status line */}
      {loading && (
        <div className="font-mono text-sm text-accent animate-pulse mb-6">
          ▶ Running diagnostics for {query}...
        </div>
      )}
      {error && (
        <div className="font-mono text-sm text-mono-red mb-6">
          ✕ {error}
        </div>
      )}

      {/* Features shown when idle */}
      {!result && !loading && !error && (
        <HomeFeatures onExample={handleExample} />
      )}

      {/* Results */}
      {result && !loading && (
        <div>
          {/* Result header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="badge badge-blue">{result.input_type.toUpperCase()}</span>
              <span className="font-mono text-sm text-slate-700 dark:text-slate-300">{result.normalized}</span>
              {result.error && <span className="badge badge-red">error</span>}
            </div>
            <div className="flex items-center gap-3">
              {result.permalink_id && (
                <a
                  href={`/r/${result.permalink_id}`}
                  className="text-xs font-mono text-slate-500 hover:text-accent transition-colors"
                  target="_blank"
                >
                  permalink ↗
                </a>
              )}
              {user && result.permalink_id && (
                <button
                  onClick={handleSave}
                  disabled={saving || saved}
                  className="text-xs font-mono text-slate-500 hover:text-mono-green transition-colors disabled:opacity-50"
                >
                  {saved ? "✓ saved" : saving ? "saving..." : "save"}
                </button>
              )}
            </div>
          </div>
          <ResultView result={result} onSearch={handleSearch} />
        </div>
      )}
    </div>
  );
}
