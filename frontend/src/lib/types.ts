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
