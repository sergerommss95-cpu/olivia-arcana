/**
 * supabase.ts — Supabase client for auth
 *
 * Safe for static export: only initializes client-side.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ghyzkpcxlnlfjzitdxkk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_z-zV4pjfHRSkIEbqwxUykA_4lW9zkd7";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _client;
}

export async function signUpWithEmail(email: string, password: string, name?: string) {
  const { data, error } = await getClient().auth.signUp({
    email, password,
    options: { data: { name: name || "" } },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await getClient().auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await getClient().auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/profile` : undefined,
    },
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function signOut() {
  await getClient().auth.signOut();
}

export async function getSession() {
  const { data: { session } } = await getClient().auth.getSession();
  return session;
}

export async function getUser() {
  const { data: { user } } = await getClient().auth.getUser();
  return user;
}
