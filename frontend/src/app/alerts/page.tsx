"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  listAlerts,
  listWatchlists,
  createAlert,
  updateAlert,
  deleteAlert,
} from "@/lib/api";
import type { AlertOut, WatchlistOut } from "@/lib/types";
import Sidebar from "@/components/Sidebar";

function formatDate(s: string | null) {
  if (!s) return "Never";
  return new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

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
      const alert = await createAlert(token, {
        watchlist_id: watchlistId,
        name,
        channel_url: channelUrl,
      });
      setAlerts((prev) => [alert, ...prev]);
      setName(""); setChannelUrl("");
      setShowForm(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create alert");
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
    <div className="min-h-screen bg-background text-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-8">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-mono font-semibold text-slate-100">Alerts</h1>
            <button
              onClick={() => setShowForm((v) => !v)}
              disabled={watchlists.length === 0}
              className="px-3 py-1.5 rounded bg-accent text-black text-sm font-mono font-medium hover:bg-accent/80 transition-colors disabled:opacity-40"
            >
              {showForm ? "Cancel" : "+ New Alert"}
            </button>
          </div>

          {watchlists.length === 0 && !fetching && (
            <p className="text-yellow-400 text-sm font-mono mb-4">
              Create a watchlist first before adding alerts.
            </p>
          )}

          {showForm && (
            <form onSubmit={handleCreate} className="mb-6 p-4 rounded border border-surface-border bg-surface space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Alert name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded bg-background border border-surface-border text-sm font-mono text-slate-200 focus:outline-none focus:border-accent"
                    placeholder="e.g. DNS change alert"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Watchlist</label>
                  <select
                    value={watchlistId}
                    onChange={(e) => setWatchlistId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded bg-background border border-surface-border text-sm font-mono text-slate-200 focus:outline-none focus:border-accent"
                  >
                    {watchlists.map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Webhook URL</label>
                  <input
                    value={channelUrl}
                    onChange={(e) => setChannelUrl(e.target.value)}
                    required
                    type="url"
                    className="w-full px-3 py-1.5 rounded bg-background border border-surface-border text-sm font-mono text-slate-200 focus:outline-none focus:border-accent"
                    placeholder="https://hooks.example.com/..."
                  />
                </div>
              </div>
              {formError && <p className="text-red-400 text-xs">{formError}</p>}
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-1.5 rounded bg-accent text-black text-sm font-mono font-medium disabled:opacity-50"
              >
                {creating ? "Creating…" : "Create Alert"}
              </button>
            </form>
          )}

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          {fetching ? (
            <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-14 bg-surface rounded animate-pulse" />)}</div>
          ) : alerts.length === 0 ? (
            <p className="text-slate-500 text-sm font-mono">No alerts configured.</p>
          ) : (
            <div className="border border-surface-border rounded overflow-hidden">
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="border-b border-surface-border bg-surface">
                    <th className="text-left px-4 py-2 text-slate-400 font-normal">Name</th>
                    <th className="text-left px-4 py-2 text-slate-400 font-normal">Watchlist</th>
                    <th className="text-left px-4 py-2 text-slate-400 font-normal">Webhook</th>
                    <th className="text-left px-4 py-2 text-slate-400 font-normal">Last fired</th>
                    <th className="text-left px-4 py-2 text-slate-400 font-normal">Active</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((a) => (
                    <tr key={a.id} className="border-b border-surface-border last:border-0 hover:bg-surface/50 transition-colors">
                      <td className="px-4 py-3 text-slate-200">{a.name}</td>
                      <td className="px-4 py-3 text-accent text-xs">{watchlistLabel(a.watchlist_id)}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs truncate max-w-xs">{a.channel_url}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(a.last_triggered_at)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggle(a)}
                          className={`text-xs px-2 py-0.5 rounded ${a.is_active ? "bg-green-900 text-green-300" : "bg-surface text-slate-500"}`}
                        >
                          {a.is_active ? "On" : "Off"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Remove
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
