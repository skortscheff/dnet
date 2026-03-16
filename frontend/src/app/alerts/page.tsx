"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { listAlerts, listWatchlists, createAlert, updateAlert, deleteAlert } from "@/lib/api";
import type { AlertOut, WatchlistOut } from "@/lib/types";
import Sidebar from "@/components/Sidebar";

function formatDate(s: string | null) {
  if (!s) return "Never";
  return new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const fieldClass = "input-field text-sm";

export default function AlertsPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertOut[]>([]);
  const [watchlists, setWatchlists] = useState<WatchlistOut[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [watchlistId, setWatchlistId] = useState("");
  const [name, setName] = useState("");
  const [channelUrl, setChannelUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.replace("/login"); return; }
    setFetching(true);
    Promise.all([listAlerts(token), listWatchlists(token)])
      .then(([a, w]) => {
        setAlerts(a);
        setWatchlists(w);
        if (w.length > 0) setWatchlistId(w[0].id);
      })
      .catch(() => setError("Failed to load alerts."))
      .finally(() => setFetching(false));
  }, [token, authLoading, router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    setFormError(null);
    try {
      const alert = await createAlert(token, { watchlist_id: watchlistId, name, channel_url: channelUrl });
      setAlerts((prev) => [alert, ...prev]);
      setName(""); setChannelUrl("");
      setShowForm(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create alert.");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(alert: AlertOut) {
    if (!token) return;
    try {
      const updated = await updateAlert(token, alert.id, { is_active: !alert.is_active });
      setAlerts((prev) => prev.map((a) => a.id === updated.id ? updated : a));
    } catch {
      setError("Failed to update alert.");
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    try {
      await deleteAlert(token, id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setError("Failed to delete alert.");
    }
  }

  const watchlistLabel = (id: string) =>
    watchlists.find((w) => w.id === id)?.label ?? id.slice(0, 8) + "…";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex gap-8">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="section-title">Alerts</p>
            {!fetching && (
              <p className="text-slate-400 text-sm mono mt-1">
                {alerts.length} {alerts.length === 1 ? "alert" : "alerts"} configured
              </p>
            )}
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            disabled={watchlists.length === 0}
            className="btn-primary text-sm py-1.5 px-4 disabled:opacity-40"
          >
            {showForm ? "Cancel" : "+ New Alert"}
          </button>
        </div>

        {watchlists.length === 0 && !fetching && (
          <div className="card p-4 mb-6 border-yellow-600/30 bg-yellow-50 dark:bg-yellow-900/10">
            <p className="text-sm text-yellow-700 dark:text-yellow-300 font-mono">
              You need at least one watchlist before creating an alert.{" "}
              <Link href="/watchlists" className="underline hover:no-underline">
                Create a watchlist →
              </Link>
            </p>
          </div>
        )}

        {showForm && (
          <div className="card p-4 mb-6">
            <p className="data-label mb-3">New Alert</p>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="data-label block mb-1">Alert name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={fieldClass}
                    placeholder="e.g. DNS change notification"
                  />
                </div>
                <div>
                  <label className="data-label block mb-1">Watchlist</label>
                  <select value={watchlistId} onChange={(e) => setWatchlistId(e.target.value)} className={fieldClass}>
                    {watchlists.map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="data-label block mb-1">Webhook URL</label>
                  <input
                    value={channelUrl}
                    onChange={(e) => setChannelUrl(e.target.value)}
                    required
                    type="url"
                    className={fieldClass}
                    placeholder="https://hooks.slack.com/... or any HTTPS endpoint"
                  />
                </div>
              </div>
              {formError && <p className="font-mono text-xs text-mono-red">✕ {formError}</p>}
              <button type="submit" disabled={creating} className="btn-primary disabled:opacity-50 text-sm">
                {creating ? "Creating…" : "Create Alert"}
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
        ) : alerts.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="font-mono text-slate-900 dark:text-slate-200 mb-2">No alerts configured</p>
            <p className="text-sm text-slate-500 mb-5">
              Alerts fire a webhook when a watchlist item&apos;s result changes between checks.
            </p>
            {watchlists.length > 0 && (
              <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
                Create your first alert
              </button>
            )}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="table-cell text-left data-label">Name</th>
                  <th className="table-cell text-left data-label">Watchlist</th>
                  <th className="table-cell text-left data-label">Webhook</th>
                  <th className="table-cell text-left data-label">Last fired</th>
                  <th className="table-cell text-left data-label">Active</th>
                  <th className="table-cell text-left data-label">Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id} className="table-row">
                    <td className="table-cell text-slate-900 dark:text-slate-200 text-sm">{a.name}</td>
                    <td className="table-cell mono text-accent text-xs">{watchlistLabel(a.watchlist_id)}</td>
                    <td className="table-cell text-slate-500 text-xs truncate max-w-xs">{a.channel_url}</td>
                    <td className="table-cell text-slate-400 text-sm">{formatDate(a.last_triggered_at)}</td>
                    <td className="table-cell">
                      <button
                        onClick={() => handleToggle(a)}
                        className={`text-xs px-2 py-0.5 rounded font-mono transition-colors ${
                          a.is_active
                            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                            : "bg-slate-100 text-slate-500 dark:bg-surface dark:text-slate-500"
                        }`}
                      >
                        {a.is_active ? "On" : "Off"}
                      </button>
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="btn-ghost text-xs px-2 py-1 text-mono-red hover:text-mono-red"
                      >
                        remove
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
