// ===========================================================================
// CIVORA — Auth API Service
// Connects to genesis-engine backend at http://127.0.0.1:8000
// ===========================================================================

const BASE_URL = 'http://127.0.0.1:8000/api/v1/auth';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface ApiError {
  detail: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err: ApiError = await res.json().catch(() => ({ detail: 'Network error' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function apiRegister(
  username: string,
  email: string,
  password: string
): Promise<AuthTokenResponse> {
  const res = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  return handleResponse<AuthTokenResponse>(res);
}

export async function apiLogin(
  username: string,
  password: string
): Promise<AuthTokenResponse> {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse<AuthTokenResponse>(res);
}

export async function apiGetMe(token: string): Promise<AuthUser> {
  const res = await fetch(`${BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<AuthUser>(res);
}

export async function apiLogout(token: string): Promise<void> {
  await fetch(`${BASE_URL}/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

