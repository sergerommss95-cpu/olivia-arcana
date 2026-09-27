import type { Tier } from "./payments";

export type ExperienceSubscriptionState = {
  status: "loading" | "ready" | "unavailable";
  paid: boolean;
  tier: Tier;
};

/** The iframe receives entitlements, never session tokens or payment details. */
export function subscriptionState(data: unknown, loading: boolean, error: unknown): ExperienceSubscriptionState {
  if (loading) return { status: "loading", paid: false, tier: "free" };
  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    return { status: "unavailable", paid: false, tier: "free" };
  }
  const value = data as Record<string, unknown>;
  const tiers = ["free", "insight", "premium", "vip"];
  const statuses = ["none", "active", "trialing", "past_due", "canceled"];
  if (!tiers.includes(value.tier as string) || !statuses.includes(value.status as string) || typeof value.is_paid !== "boolean") {
    return { status: "unavailable", paid: false, tier: "free" };
  }
  // The server owns expiry and grace-period policy. A stored tier alone is not an entitlement.
  const paid = value.is_paid === true && value.tier !== "free";
  return { status: "ready", paid, tier: paid ? value.tier as Tier : "free" };
}

export function subscriptionRequestId(
  event: { origin: string; source: unknown; data: unknown },
  origin: string,
  iframeWindow: unknown,
): string | null {
  if (!iframeWindow || event.source !== iframeWindow || event.origin !== origin) return null;
  const value = event.data;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const request = value as Record<string, unknown>;
  if (request.type !== "olivia:subscription:request" || typeof request.requestId !== "string") return null;
  if (!request.requestId.trim() || request.requestId.length > 128) return null;
  return request.requestId;
}

/** The provider owns the initial check; subsequent distinct requests ask for fresh data. */
export function shouldRefreshSubscription(previousId: string | null, requestId: string, loading: boolean): boolean {
  return previousId !== null && previousId !== requestId && !loading;
}

/** Only named experience destinations may change the iframe's fragment. */
export function experienceEntryHash(search: string): string {
  const entry = new URLSearchParams(search).get("experience");
  return entry === "spreads" || entry === "journal" || entry === "question" || entry === "today" ? `#${entry}` : "";
}
