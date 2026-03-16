const BASE = "/api/v1";

function authHeader(token?: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function search(q: string): Promise<import("./types").LookupResponse> {
  const res = await fetch(`${BASE}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q }),
  });
  return handle(res);
}

export async function getPermalink(id: string): Promise<import("./types").LookupResponse> {
  const res = await fetch(`${BASE}/lookup/${id}`);
  return handle(res);
}

export async function getMyIp(): Promise<import("./types").LookupResponse> {
  const res = await fetch(`${BASE}/ip/me`);
  return handle(res);
}

export async function register(email: string, password: string): Promise<import("./types").UserOut> {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handle(res);
}

export async function login(email: string, password: string): Promise<import("./types").Token> {
  const body = new URLSearchParams({ username: email, password });
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  return handle(res);
}

export async function getMe(token: string): Promise<import("./types").UserOut> {
  const res = await fetch(`${BASE}/auth/me`, { headers: authHeader(token) });
  return handle(res);
}

export async function listApiKeys(token: string): Promise<import("./types").ApiKeyOut[]> {
  const res = await fetch(`${BASE}/api-keys`, { headers: authHeader(token) });
  return handle(res);
}

export async function createApiKey(token: string, name: string): Promise<import("./types").ApiKeyCreated> {
  const res = await fetch(`${BASE}/api-keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify({ name }),
  });
  return handle(res);
}

export async function deleteApiKey(token: string, id: string): Promise<void> {
  const res = await fetch(`${BASE}/api-keys/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  return handle(res);
}

export async function listSavedResults(token: string): Promise<import("./types").SavedResultOut[]> {
  const res = await fetch(`${BASE}/saved-results`, { headers: authHeader(token) });
  return handle(res);
}

export async function saveResult(token: string, data: { permalink_id: string; input: string; input_type: string; label?: string }): Promise<import("./types").SavedResultOut> {
  const res = await fetch(`${BASE}/saved-results`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(data),
  });
  return handle(res);
}

export async function deleteSavedResult(token: string, id: string): Promise<void> {
  const res = await fetch(`${BASE}/saved-results/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  return handle(res);
}

// --- Watchlists ---

export async function listWatchlists(token: string): Promise<import("./types").WatchlistOut[]> {
  const res = await fetch(`${BASE}/watchlists`, { headers: authHeader(token) });
  return handle(res);
}

export async function createWatchlist(
  token: string,
  data: { label: string; input: string; input_type: string; check_interval_minutes: number; team_id?: string }
): Promise<import("./types").WatchlistOut> {
  const res = await fetch(`${BASE}/watchlists`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(data),
  });
  return handle(res);
}

export async function deleteWatchlist(token: string, id: string): Promise<void> {
  const res = await fetch(`${BASE}/watchlists/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  return handle(res);
}

export async function listSnapshots(token: string, watchlistId: string): Promise<import("./types").SnapshotOut[]> {
  const res = await fetch(`${BASE}/watchlists/${watchlistId}/snapshots`, { headers: authHeader(token) });
  return handle(res);
}

// --- Alerts ---

export async function listAlerts(token: string, watchlistId?: string): Promise<import("./types").AlertOut[]> {
  const url = watchlistId ? `${BASE}/alerts?watchlist_id=${watchlistId}` : `${BASE}/alerts`;
  const res = await fetch(url, { headers: authHeader(token) });
  return handle(res);
}

export async function createAlert(
  token: string,
  data: { watchlist_id: string; name: string; channel_url: string; channel_type?: string; is_active?: boolean }
): Promise<import("./types").AlertOut> {
  const res = await fetch(`${BASE}/alerts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(data),
  });
  return handle(res);
}

export async function updateAlert(
  token: string,
  id: string,
  data: { name?: string; channel_url?: string; is_active?: boolean }
): Promise<import("./types").AlertOut> {
  const res = await fetch(`${BASE}/alerts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(data),
  });
  return handle(res);
}

export async function deleteAlert(token: string, id: string): Promise<void> {
  const res = await fetch(`${BASE}/alerts/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  return handle(res);
}

// --- Teams ---

export async function listTeams(token: string): Promise<import("./types").TeamOut[]> {
  const res = await fetch(`${BASE}/teams`, { headers: authHeader(token) });
  return handle(res);
}

export async function createTeam(token: string, name: string): Promise<import("./types").TeamOut> {
  const res = await fetch(`${BASE}/teams`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify({ name }),
  });
  return handle(res);
}

export async function deleteTeam(token: string, id: string): Promise<void> {
  const res = await fetch(`${BASE}/teams/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  return handle(res);
}

export async function listTeamMembers(token: string, teamId: string): Promise<import("./types").TeamMemberOut[]> {
  const res = await fetch(`${BASE}/teams/${teamId}/members`, { headers: authHeader(token) });
  return handle(res);
}

export async function inviteTeamMember(token: string, teamId: string, email: string): Promise<import("./types").TeamMemberOut> {
  const res = await fetch(`${BASE}/teams/${teamId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify({ email }),
  });
  return handle(res);
}

export async function removeTeamMember(token: string, teamId: string, userId: string): Promise<void> {
  const res = await fetch(`${BASE}/teams/${teamId}/members/${userId}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  return handle(res);
}
