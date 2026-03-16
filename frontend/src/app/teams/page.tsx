"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { listTeams, createTeam, deleteTeam, listTeamMembers, inviteTeamMember, removeTeamMember } from "@/lib/api";
import type { TeamOut, TeamMemberOut } from "@/lib/types";
import Sidebar from "@/components/Sidebar";

function MemberAvatar({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent/10 text-accent font-mono text-xs font-semibold shrink-0 select-none">
      {label.charAt(0).toUpperCase()}
    </span>
  );
}

const fieldClass = "input-field text-sm";

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
  const [inviteSuccess, setInviteSuccess] = useState(false);

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
    if (!window.confirm("Delete this team? This cannot be undone.")) return;
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
    setInviteSuccess(false);
    try {
      const member = await inviteTeamMember(token, selectedTeam.id, inviteEmail);
      setMembers((prev) => [...prev, member]);
      setInviteEmail("");
      setInviteSuccess(true);
      setTimeout(() => setInviteSuccess(false), 3000);
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

  // Display a shortened ID with a title tooltip so the full UUID is accessible
  function shortId(id: string) {
    return id.slice(0, 8) + "…";
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex gap-8">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="section-title">Teams</p>
            {!fetching && (
              <p className="text-slate-400 text-sm mono mt-1">
                {teams.length} {teams.length === 1 ? "team" : "teams"}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowCreateForm((v) => !v)}
            className="btn-primary text-sm py-1.5 px-4"
          >
            {showCreateForm ? "Cancel" : "+ New Team"}
          </button>
        </div>

        {showCreateForm && (
          <div className="card p-4 mb-6">
            <p className="data-label mb-3">New Team</p>
            <form onSubmit={handleCreateTeam} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="data-label block mb-1">Team name</label>
                <input
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  required
                  className={fieldClass}
                  placeholder="e.g. NOC Team"
                  autoFocus
                />
              </div>
              <button type="submit" disabled={creating} className="btn-primary disabled:opacity-50 text-sm">
                {creating ? "Creating…" : "Create"}
              </button>
            </form>
          </div>
        )}

        {error && <div className="card p-4 text-mono-red text-sm mono mb-4">{error}</div>}

        {fetching ? (
          <div className="space-y-2">
            {[0, 1].map((i) => <div key={i} className="h-12 bg-surface rounded animate-pulse" />)}
          </div>
        ) : teams.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="font-mono text-slate-900 dark:text-slate-200 mb-2">No teams yet</p>
            <p className="text-sm text-slate-500 mb-5">
              Teams let you share watchlists and collaborate with your colleagues.
            </p>
            <button onClick={() => setShowCreateForm(true)} className="btn-primary text-sm">
              Create your first team
            </button>
          </div>
        ) : (
          <div className="flex gap-6">
            {/* Team list */}
            <nav className="w-44 shrink-0 space-y-1">
              {teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTeam(t)}
                  className={`w-full text-left px-3 py-2 rounded text-sm font-mono transition-colors ${
                    selectedTeam?.id === t.id
                      ? "bg-surface text-accent"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-surface-hover"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </nav>

            {/* Team detail */}
            {selectedTeam && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-mono text-slate-900 dark:text-slate-100 font-semibold">{selectedTeam.name}</h2>
                    <p className="text-xs text-slate-500 mono mt-0.5">
                      {members.length} {members.length === 1 ? "member" : "members"}
                      {isOwner && <span className="ml-2 text-accent">· you are the owner</span>}
                    </p>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => handleDeleteTeam(selectedTeam.id)}
                      className="btn-ghost text-xs px-2 py-1 text-mono-red hover:text-mono-red"
                    >
                      delete team
                    </button>
                  )}
                </div>

                {isOwner && (
                  <div className="card p-4 mb-4">
                    <p className="data-label mb-3">Invite member</p>
                    <form onSubmit={handleInvite} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          required
                          className={fieldClass}
                          placeholder="colleague@example.com"
                        />
                      </div>
                      <button type="submit" disabled={inviting} className="btn-primary text-sm disabled:opacity-50">
                        {inviting ? "Inviting…" : "Invite"}
                      </button>
                    </form>
                    {inviteError && <p className="font-mono text-xs text-mono-red mt-2">✕ {inviteError}</p>}
                    {inviteSuccess && <p className="font-mono text-xs text-mono-green mt-2">✓ Member added</p>}
                  </div>
                )}

                <div className="card overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-surface-border">
                        <th className="table-cell text-left data-label">Member</th>
                        <th className="table-cell text-left data-label">Role</th>
                        {isOwner && <th className="table-cell text-left data-label">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m) => {
                        const isMe = user && m.user_id === user.id;
                        return (
                          <tr key={m.id} className="table-row">
                            <td className="table-cell">
                              <div className="flex items-center gap-2">
                                <MemberAvatar label={m.user_id} />
                                <span className="font-mono text-xs text-slate-500 dark:text-slate-400" title={m.user_id}>
                                  {isMe ? (
                                    <span className="text-accent">you ({shortId(m.user_id)})</span>
                                  ) : (
                                    shortId(m.user_id)
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="table-cell">
                              <span className={`badge ${m.role === "owner" ? "badge-blue" : "badge-gray"}`}>
                                {m.role}
                              </span>
                            </td>
                            {isOwner && (
                              <td className="table-cell">
                                {m.role !== "owner" && (
                                  <button
                                    onClick={() => handleRemoveMember(m.user_id)}
                                    className="btn-ghost text-xs px-2 py-1 text-mono-red hover:text-mono-red"
                                  >
                                    remove
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
