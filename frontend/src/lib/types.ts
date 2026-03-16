export interface LookupResponse {
  input: string;
  input_type: string;
  normalized: string;
  timestamp: string;
  result: Record<string, unknown>;
  pivots: string[];
  error: string | null;
  permalink_id: string | null;
}

export interface UserOut {
  id: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface ApiKeyOut {
  id: string;
  name: string;
  prefix: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export interface ApiKeyCreated extends ApiKeyOut {
  raw_key: string;
}

export interface SavedResultOut {
  id: string;
  permalink_id: string;
  label: string | null;
  input: string;
  input_type: string;
  created_at: string;
}

export interface WatchlistOut {
  id: string;
  user_id: string;
  team_id: string | null;
  label: string;
  input: string;
  input_type: string;
  check_interval_minutes: number;
  last_checked_at: string | null;
  created_at: string;
}

export interface AlertOut {
  id: string;
  user_id: string;
  watchlist_id: string;
  name: string;
  channel_type: string;
  channel_url: string;
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
}

export interface SnapshotOut {
  id: string;
  watchlist_id: string;
  result_data: Record<string, unknown>;
  taken_at: string;
}

export interface TeamOut {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface TeamMemberOut {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}
