/**
 * api.ts — API client for backend auth + data
 *
 * Handles JWT token storage, auth requests, and protected endpoints.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://olivia-api.up.railway.app";

// ── Token management ──
const TOKEN_KEY = "olivia-token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

// ── Types ──
export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  sun_sign: string | null;
  moon_sign: string | null;
  rising_sign: string | null;
  birth_year: number | null;
  birth_month: number | null;
  birth_day: number | null;
  birth_city: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

// ── Auth endpoints ──

export async function register(email: string, password: string, name?: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Registration failed" }));
    throw new Error(err.detail || "Registration failed");
  }
  const data: AuthResponse = await res.json();
  setToken(data.access_token);
  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Invalid credentials" }));
    throw new Error(err.detail || "Invalid credentials");
  }
  const data: AuthResponse = await res.json();
  setToken(data.access_token);
  return data;
}

export async function getMe(): Promise<AuthUser> {
  const token = getToken();
  if (!token) throw new Error("Not logged in");
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
}

export async function updateBirthData(data: Record<string, unknown>): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("Not logged in");
  const res = await fetch(`${API_URL}/api/auth/me/birth-data`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update");
}

export function logout(): void {
  clearToken();
}
