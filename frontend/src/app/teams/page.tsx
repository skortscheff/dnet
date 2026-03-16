"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  listTeams,
  createTeam,
  deleteTeam,
  listTeamMembers,
  inviteTeamMember,
  removeTeamMember,
} from "@/lib/api";
import type { TeamOut, TeamMemberOut } from "@/lib/types";
import Sidebar from "@/components/Sidebar";

export default function TeamsPage() {
  const { token, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<TeamOut[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamOut | null>(null);
  const [members, setMembers] = useState<TeamMemberOut[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [creating, setCreating] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.replace("/login"); return; }
    setFetching(true);
    listTeams(token)
      .then((t) => { setTeams(t); if (t.length > 0) setSelectedTeam(t[0]); })
      .catch(() => setError("Failed to load teams."))
      .finally(() => setFetching(false));
  }, [token, authLoading, router]);

  useEffect(() => {
    if (!token || !selectedTeam) return;
    listTeamMembers(token, selectedTeam.id)
      .then(setMembers)
      .catch(() => setError("Failed to load members."));
  }, [token, selectedTeam]);

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    try {
      const team = await createTeam(token, newTeamName);
      setTeams((prev) => [team, ...prev]);
      setSelectedTeam(team);
      setNewTeamName("");
      setShowCreateForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create team.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteTeam(id: string) {
    if (!token) return;
    try {
      await deleteTeam(token, id);
      const remaining = teams.filter((t) => t.id !== id);
      setTeams(remaining);
      setSelectedTeam(remaining[0] ?? null);
      setMembers([]);
    } catch {
      setError("Failed to delete team.");
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !selectedTeam) return;
    setInviting(true);
    setInviteError(null);
    try {
      const member = await inviteTeamMember(token, selectedTeam.id, inviteEmail);
      setMembers((prev) => [...prev, member]);
      setInviteEmail("");
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : "Failed to invite member.");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!token || !selectedTeam) return;
    try {
      await removeTeamMember(token, selectedTeam.id, userId);
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch {
      setError("Failed to remove member.");
    }
  }

  const isOwner = selectedTeam && user && selectedTeam.owner_id === user.id;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900 text-slate-900 dark:text-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-8">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-mono font-semibold text-slate-900 dark:text-slate-100">Teams</h1>
            <button
              onClick={() => setShowCreateForm((v) => !v)}
              className="px-3 py-1.5 rounded bg-accent text-black text-sm font-mono font-medium hover:bg-accent/80 transition-colors"
            >
              {showCreateForm ? "Cancel" : "+ New Team"}
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreateTeam} className="mb-6 p-4 rounded border border-surface-border bg-surface flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs text-slate-400 mb-1">Team name</label>
                <input
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded bg-background border border-surface-border text-sm font-mono text-slate-200 focus:outline-none focus:border-accent"
                  placeholder="e.g. NOC Team"
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-1.5 rounded bg-accent text-black text-sm font-mono font-medium disabled:opacity-50"
              >
                {creating ? "Creating…" : "Create"}
              </button>
            </form>
          )}

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          {fetching ? (
            <div className="space-y-2">{[0, 1].map((i) => <div key={i} className="h-12 bg-surface rounded animate-pulse" />)}</div>
          ) : teams.length === 0 ? (
            <p className="text-slate-500 text-sm font-mono">No teams yet. Create one to collaborate.</p>
          ) : (
            <div className="flex gap-6">
              {/* Team list */}
              <div className="w-48 shrink-0 space-y-1">
                {teams.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTeam(t)}
                    className={`w-full text-left px-3 py-2 rounded text-sm font-mono transition-colors ${
                      selectedTeam?.id === t.id
                        ? "bg-surface text-accent"
                        : "text-slate-400 hover:text-slate-200 hover:bg-surface-hover"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>

              {/* Team detail */}
              {selectedTeam && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-mono text-slate-900 dark:text-slate-100 font-semibold">{selectedTeam.name}</h2>
                    {isOwner && (
                      <button
                        onClick={() => handleDeleteTeam(selectedTeam.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Delete team
                      </button>
                    )}
                  </div>

                  {isOwner && (
                    <form onSubmit={handleInvite} className="mb-4 flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="block text-xs text-slate-400 mb-1">Invite by email</label>
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          required
                          className="w-full px-3 py-1.5 rounded bg-background border border-surface-border text-sm font-mono text-slate-200 focus:outline-none focus:border-accent"
                          placeholder="user@example.com"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={inviting}
                        className="px-3 py-1.5 rounded border border-surface-border text-sm font-mono text-slate-300 hover:text-slate-100 disabled:opacity-50"
                      >
                        {inviting ? "Inviting…" : "Invite"}
                      </button>
                    </form>
                  )}
                  {inviteError && <p className="text-red-400 text-xs mb-3">{inviteError}</p>}

                  <div className="border border-surface-border rounded overflow-hidden">
                    <table className="w-full text-sm font-mono">
                      <thead>
                        <tr className="border-b border-surface-border bg-surface">
                          <th className="text-left px-4 py-2 text-slate-400 font-normal">User ID</th>
                          <th className="text-left px-4 py-2 text-slate-400 font-normal">Role</th>
                          {isOwner && <th className="px-4 py-2" />}
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((m) => (
                          <tr key={m.id} className="border-b border-surface-border last:border-0">
                            <td className="px-4 py-3 text-slate-400 text-xs">{m.user_id}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded ${m.role === "owner" ? "bg-accent/20 text-accent" : "bg-surface text-slate-400"}`}>
                                {m.role}
                              </span>
                            </td>
                            {isOwner && m.role !== "owner" && (
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => handleRemoveMember(m.user_id)}
                                  className="text-xs text-red-400 hover:text-red-300"
                                >
                                  Remove
                                </button>
                              </td>
                            )}
                            {isOwner && m.role === "owner" && <td />}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
