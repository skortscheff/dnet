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
