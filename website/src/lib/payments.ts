/**
 * payments.ts — Paddle (web) + Telegram Stars (in-bot) payment client.
 *
 * Stripe is BANNED for tarot/psychic/occult per Paddle MoR strategy
 * documented in the LLC guide. All web checkout goes through Paddle;
 * in-Telegram-bot purchases use Telegram Stars.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://olivia-api.up.railway.app";

/** Subscription tiers (4-tier model) */
export type Tier = "free" | "insight" | "premium" | "vip";

/** Price keys — subscriptions + addons */
export type PriceKey =
  | "insight_monthly" | "insight_annual"
  | "premium_monthly" | "premium_annual"
  | "vip_monthly" | "vip_annual"
  | "addon_birth_chart"
  | "addon_compatibility"
  | "addon_celtic_cross"
  | "addon_year_ahead"
  | "addon_video_reading"
  | "addon_solar_return";

/** Pricing in USD — single source of truth (matches business plan PDF) */
export const PRICING = {
  free:    { monthly: 0,     annual: 0 },
  insight: { monthly: 4.99,  annual: 39 },
  premium: { monthly: 14.99, annual: 119 },
  vip:     { monthly: 34.99, annual: 299 },
} as const;

/** One-time addon prices (USD) */
export const ADDONS = {
  addon_birth_chart:    { name: "Full Natal Chart Reading",  price: 9.99 },
  addon_compatibility:  { name: "Synastry Report",           price: 9.99 },
  addon_celtic_cross:   { name: "Celtic Cross Tarot",        price: 4.99 },
  addon_year_ahead:     { name: "Year-Ahead Forecast",       price: 19.99 },
  addon_solar_return:   { name: "Solar Return Reading",      price: 14.99 },
  addon_video_reading:  { name: "30-min Video Reading",      price: 49.99 },
} as const;

export interface SubscriptionStatus {
  tier: Tier;
  status: "none" | "active" | "trialing" | "past_due" | "canceled";
  is_paid: boolean;
  period_end: string | null;
  cancel_at_period_end: boolean;
  provider: "paddle" | "telegram_stars" | null;
  purchases: Array<{
    id: number;
    reading_type: string;
    has_content: boolean;
    created_at: string | null;
  }>;
}

const TOKEN_KEY = "olivia-token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `API error ${res.status}`);
  }

  return res.json();
}

/**
 * Create a Paddle checkout session and redirect the user.
 * Backend creates Paddle transaction, returns hosted-checkout URL.
 */
export async function createCheckoutSession(priceKey: PriceKey): Promise<string> {
  const { checkout_url } = await apiFetch<{ checkout_url: string }>("/api/payments/paddle/checkout", {
    method: "POST",
    body: JSON.stringify({
      price_key: priceKey,
      success_url: `${window.location.origin}/checkout/success/`,
      cancel_url: `${window.location.origin}/checkout/cancel/`,
    }),
  });
  return checkout_url;
}

/**
 * Generate a Telegram deep-link to pay with Stars in @OliviaArcanaBot.
 * Used by users who prefer crypto-adjacent / no-card flow.
 */
export function telegramStarsLink(priceKey: PriceKey): string {
  return `https://t.me/OliviaArcanaBot?start=pay_${priceKey}`;
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  return apiFetch<SubscriptionStatus>("/api/payments/status");
}

/** Paddle's customer portal for managing billing / cancellation. */
export async function createPortalSession(): Promise<string> {
  const { portal_url } = await apiFetch<{ portal_url: string }>("/api/payments/paddle/portal", {
    method: "POST",
  });
  return portal_url;
}

export function hasPurchased(status: SubscriptionStatus, readingType: string): boolean {
  return status.purchases.some((p) => p.reading_type === readingType && p.has_content);
}

export function tierLabel(tier: Tier): string {
  return { free: "Free", insight: "Insight", premium: "Premium", vip: "VIP" }[tier];
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    none: "No subscription",
    active: "Active",
    trialing: "Free trial",
    past_due: "Payment overdue",
    canceled: "Canceled",
  };
  return labels[status] || status;
}
