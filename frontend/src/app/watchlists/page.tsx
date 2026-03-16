"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { listWatchlists, createWatchlist, deleteWatchlist } from "@/lib/api";
import type { WatchlistOut } from "@/lib/types";
import Sidebar from "@/components/Sidebar";

const INPUT_TYPES = ["domain", "ipv4", "ipv6", "asn", "prefix"];
const INTERVALS = [
  { label: "5 minutes", value: 5 },
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "6 hours", value: 360 },
  { label: "24 hours", value: 1440 },
];

function formatDate(s: string | null) {
  if (!s) return "Never";
  return new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatInterval(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes === 60) return "1 hour";
  if (minutes < 1440) return `${minutes / 60} hours`;
  return "24 hours";
}

const fieldClass = "input-field text-sm";

export default function WatchlistsPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<WatchlistOut[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [input, setInput] = useState("");
  const [inputType, setInputType] = useState("domain");
  const [interval, setInterval] = useState(60);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.replace("/login"); return; }
    setFetching(true);
    listWatchlists(token)
      .then(setItems)
      .catch(() => setError("Failed to load watchlists."))
      .finally(() => setFetching(false));
  }, [token, authLoading, router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    setFormError(null);
    try {
      const item = await createWatchlist(token, { label, input, input_type: inputType, check_interval_minutes: interval });
      setItems((prev) => [item, ...prev]);
      setLabel(""); setInput(""); setInputType("domain"); setInterval(60);
      setShowForm(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create watchlist.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    setDeletingId(id);
    try {
      await deleteWatchlist(token, id);
      setItems((prev) => prev.filter((w) => w.id !== id));
    } catch {
      setError("Failed to delete watchlist.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex gap-8">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="section-title">Watchlists</p>
            {!fetching && (
              <p className="text-slate-400 text-sm mono mt-1">
                {items.length} {items.length === 1 ? "item" : "items"} monitored
              </p>
            )}
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="btn-primary text-sm py-1.5 px-4"
          >
            {showForm ? "Cancel" : "+ New Watchlist"}
          </button>
        </div>

        {showForm && (
          <div className="card p-4 mb-6">
            <p className="data-label mb-3">New Watchlist</p>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="data-label block mb-1">Label</label>
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    required
                    className={fieldClass}
                    placeholder="e.g. Monitor example.com"
                  />
                </div>
                <div>
                  <label className="data-label block mb-1">Input value</label>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    required
                    className={fieldClass}
                    placeholder="e.g. example.com or 8.8.8.8"
                  />
                </div>
                <div>
                  <label className="data-label block mb-1">Type</label>
                  <select value={inputType} onChange={(e) => setInputType(e.target.value)} className={fieldClass}>
                    {INPUT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="data-label block mb-1">Check interval</label>
                  <select value={interval} onChange={(e) => setInterval(Number(e.target.value))} className={fieldClass}>
                    {INTERVALS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
                  </select>
                </div>
              </div>
              {formError && <p className="font-mono text-xs text-mono-red">✕ {formError}</p>}
              <button type="submit" disabled={creating} className="btn-primary disabled:opacity-50 text-sm">
                {creating ? "Creating…" : "Create Watchlist"}
              </button>
            </form>
          </div>
        )}

        {error && <div className="card p-4 text-mono-red text-sm mono mb-4">{error}</div>}

        {fetching ? (
          <div className="card overflow-hidden">
            <table className="w-full border-collapse">
              <tbody>
                {[0, 1, 2].map((i) => (
                  <tr key={i} className="table-row animate-pulse">
                    {[0, 1, 2, 3, 4, 5].map((j) => (
                      <td key={j} className="table-cell"><div className="h-4 bg-surface rounded w-24" /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : items.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="font-mono text-slate-900 dark:text-slate-200 mb-2">No watchlists yet</p>
            <p className="text-sm text-slate-500 mb-5">
              Track any domain, IP, ASN, or prefix for changes. Get alerted via webhook when results shift.
            </p>
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
              Create your first watchlist
            </button>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="table-cell text-left data-label">Label</th>
                  <th className="table-cell text-left data-label">Input</th>
                  <th className="table-cell text-left data-label">Type</th>
                  <th className="table-cell text-left data-label">Interval</th>
                  <th className="table-cell text-left data-label">Last check</th>
                  <th className="table-cell text-left data-label">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((w) => (
                  <tr key={w.id} className="table-row">
                    <td className="table-cell text-slate-900 dark:text-slate-200 text-sm">{w.label}</td>
                    <td className="table-cell mono text-accent text-sm">{w.input}</td>
                    <td className="table-cell text-slate-500 text-sm">{w.input_type}</td>
                    <td className="table-cell text-slate-500 text-sm">{formatInterval(w.check_interval_minutes)}</td>
                    <td className="table-cell text-slate-400 text-sm">{formatDate(w.last_checked_at)}</td>
                    <td className="table-cell">
                      <button
                        onClick={() => handleDelete(w.id)}
                        disabled={deletingId === w.id}
                        className="btn-ghost text-xs px-2 py-1 text-mono-red hover:text-mono-red disabled:opacity-50"
                      >
                        {deletingId === w.id ? "…" : "remove"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
