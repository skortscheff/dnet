"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  listWatchlists,
  createWatchlist,
  deleteWatchlist,
} from "@/lib/api";
import type { WatchlistOut } from "@/lib/types";
import Sidebar from "@/components/Sidebar";

const INPUT_TYPES = ["domain", "ipv4", "ipv6", "asn", "prefix"];
const INTERVALS = [
  { label: "5 min", value: 5 },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "6 hours", value: 360 },
  { label: "24 hours", value: 1440 },
];

function formatDate(s: string | null) {
  if (!s) return "Never";
  return new Date(s).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
      const item = await createWatchlist(token, {
        label,
        input,
        input_type: inputType,
        check_interval_minutes: interval,
      });
      setItems((prev) => [item, ...prev]);
      setLabel(""); setInput(""); setInputType("domain"); setInterval(60);
      setShowForm(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create watchlist");
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
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900 text-slate-900 dark:text-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-8">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-mono font-semibold text-slate-900 dark:text-slate-100">Watchlists</h1>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="px-3 py-1.5 rounded bg-accent text-black text-sm font-mono font-medium hover:bg-accent/80 transition-colors"
            >
              {showForm ? "Cancel" : "+ New Watchlist"}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleCreate} className="mb-6 p-4 rounded border border-surface-border bg-surface space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Label</label>
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded bg-background border border-surface-border text-sm font-mono text-slate-200 focus:outline-none focus:border-accent"
                    placeholder="e.g. Monitor example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Input</label>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded bg-background border border-surface-border text-sm font-mono text-slate-200 focus:outline-none focus:border-accent"
                    placeholder="e.g. example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Type</label>
                  <select
                    value={inputType}
                    onChange={(e) => setInputType(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-background border border-surface-border text-sm font-mono text-slate-200 focus:outline-none focus:border-accent"
                  >
                    {INPUT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Check interval</label>
                  <select
                    value={interval}
                    onChange={(e) => setInterval(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded bg-background border border-surface-border text-sm font-mono text-slate-200 focus:outline-none focus:border-accent"
                  >
                    {INTERVALS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
                  </select>
                </div>
              </div>
              {formError && <p className="text-red-400 text-xs">{formError}</p>}
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-1.5 rounded bg-accent text-black text-sm font-mono font-medium disabled:opacity-50"
              >
                {creating ? "Creating…" : "Create Watchlist"}
              </button>
            </form>
          )}

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          {fetching ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 bg-surface rounded animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-slate-500 text-sm font-mono">No watchlists yet. Create one to start monitoring.</p>
          ) : (
            <div className="border border-surface-border rounded overflow-hidden">
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="border-b border-surface-border bg-surface">
                    <th className="text-left px-4 py-2 text-slate-400 font-normal">Label</th>
                    <th className="text-left px-4 py-2 text-slate-400 font-normal">Input</th>
                    <th className="text-left px-4 py-2 text-slate-400 font-normal">Type</th>
                    <th className="text-left px-4 py-2 text-slate-400 font-normal">Interval</th>
                    <th className="text-left px-4 py-2 text-slate-400 font-normal">Last check</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((w) => (
                    <tr key={w.id} className="border-b border-surface-border last:border-0 hover:bg-surface/50 transition-colors">
                      <td className="px-4 py-3 text-slate-200">{w.label}</td>
                      <td className="px-4 py-3 text-accent">{w.input}</td>
                      <td className="px-4 py-3 text-slate-400">{w.input_type}</td>
                      <td className="px-4 py-3 text-slate-400">{w.check_interval_minutes}m</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(w.last_checked_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(w.id)}
                          disabled={deletingId === w.id}
                          className="text-xs text-red-400 hover:text-red-300 disabled:opacity-40"
                        >
                          {deletingId === w.id ? "Removing…" : "Remove"}
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
    </div>
  );
}
