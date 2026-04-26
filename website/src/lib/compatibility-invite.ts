/**
 * compatibility-invite.ts — Cosmic Compatibility Link viral mechanic.
 *
 * Static-export friendly: the entire invite payload is base64-encoded in
 * the URL fragment / query string. No server token storage required.
 *
 * Format: oblique base64-url of a JSON `{ n, y, m, d, h, mi, lat, lon, tz, c }`
 * — only the fields synastry-engine needs. We deliberately do NOT include
 * full birth chart, only birth input, so the receiver's browser does the
 * computation locally.
 *
 * Field names are 1-2 chars to keep the URL short.
 */

import type { BirthInput } from "./natal-chart";

interface CompactInvite {
  n: string;       // name
  y: number;
  m: number;
  d: number;
  h: number;
  mi: number;
  lat: number;
  lon: number;
  tz: number;
  c?: string;      // city display name
}

function base64UrlEncode(s: string): string {
  // Browser-safe URL-safe base64 — strip padding, swap +/ → -_
  const b = typeof btoa === "function"
    ? btoa(s)
    : Buffer.from(s, "utf-8").toString("base64");
  return b.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(b: string): string {
  const padded = b.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (b.length % 4)) % 4);
  return typeof atob === "function"
    ? atob(padded)
    : Buffer.from(padded, "base64").toString("utf-8");
}

export function encodeInvite(input: BirthInput): string {
  const compact: CompactInvite = {
    n: input.name || "",
    y: input.year, m: input.month, d: input.day,
    h: input.hour, mi: input.minute,
    lat: Math.round(input.latitude * 1000) / 1000,
    lon: Math.round(input.longitude * 1000) / 1000,
    tz: input.timezone,
    c: input.city,
  };
  return base64UrlEncode(JSON.stringify(compact));
}

export function decodeInvite(token: string): BirthInput | null {
  try {
    const raw = base64UrlDecode(token);
    const c = JSON.parse(raw) as CompactInvite;
    if (typeof c.y !== "number" || typeof c.m !== "number" || typeof c.d !== "number") return null;
    return {
      name: c.n || undefined,
      year: c.y, month: c.m, day: c.d,
      hour: c.h ?? 12, minute: c.mi ?? 0,
      latitude: c.lat ?? 0, longitude: c.lon ?? 0, timezone: c.tz ?? 0,
      city: c.c,
    };
  } catch {
    return null;
  }
}

/**
 * Build the shareable invite URL the user pastes into Telegram/WhatsApp/iMessage.
 * Always rooted at the production domain so it works from any context.
 */
export function buildInviteUrl(input: BirthInput, origin?: string): string {
  const root = origin || (typeof window !== "undefined" ? window.location.origin : "https://oliviaarcana.com");
  const token = encodeInvite(input);
  return `${root}/synastry/?invite=${token}`;
}

/**
 * Read invite from current URL, if present.
 */
export function readInviteFromUrl(): BirthInput | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const token = params.get("invite");
  if (!token) return null;
  return decodeInvite(token);
}
