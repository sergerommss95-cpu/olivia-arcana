/**
 * payments.ts — API client for payment endpoints.
 *
 * All payment logic runs server-side in FastAPI.
 * This client handles the frontend→backend communication.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** Price keys that match backend PRICE_MAP */
export type PriceKey =
  | "vip_monthly"
  | "vip_annual"
  | "birth_chart"
  | "compatibility"
  | "celtic_cross"
  | "year_ahead"
  | "video_reading";

export interface SubscriptionStatus {
  tier: "free" | "vip";
  status: "none" | "active" | "trialing" | "past_due" | "canceled";
  is_vip: boolean;
  period_end: string | null;
  cancel_at_period_end: boolean;
  purchases: Array<{
    id: number;
    reading_type: string;
    has_content: boolean;
    created_at: string | null;
  }>;
}

/** Get the stored JWT token. */
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("olivia_token");
}

/** Authenticated fetch helper. */
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
 * Create a Stripe Checkout session and redirect the user.
 * Returns the checkout URL (caller should do window.location.href = url).
 */
export async function createCheckoutSession(priceKey: PriceKey): Promise<string> {
  const { checkout_url } = await apiFetch<{ checkout_url: string }>("/api/payments/checkout", {
    method: "POST",
    body: JSON.stringify({
      price_key: priceKey,
      success_url: `${window.location.origin}/checkout/success/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${window.location.origin}/checkout/cancel/`,
    }),
  });
  return checkout_url;
}

/**
 * Get current subscription status.
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  return apiFetch<SubscriptionStatus>("/api/payments/status");
}

/**
 * Create a Stripe Customer Portal session for billing management.
 * Returns the portal URL.
 */
export async function createPortalSession(): Promise<string> {
  const { portal_url } = await apiFetch<{ portal_url: string }>("/api/payments/portal", {
    method: "POST",
  });
  return portal_url;
}

/**
 * Check if user has purchased a specific reading type.
 */
export function hasPurchased(status: SubscriptionStatus, readingType: string): boolean {
  return status.purchases.some((p) => p.reading_type === readingType && p.has_content);
}

/**
 * Human-readable tier display.
 */
export function tierLabel(tier: string): string {
  return tier === "vip" ? "VIP" : "Free";
}

/**
 * Human-readable status display.
 */
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
