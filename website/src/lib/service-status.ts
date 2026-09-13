/**
 * service-status.ts — which backends are actually reachable.
 *
 * The account backend (Supabase) and the reading/payments API (olivia-engine
 * on Railway) were both torn down while the project was dormant. Until they
 * are back, the flows that depend on them say so instead of failing at the
 * network layer — a Supabase OAuth redirect against a deleted project lands
 * the user on a browser DNS error page, which reads as a dead site.
 *
 * Flip these on by setting the env vars at build time; no code change needed.
 */

export const ACCOUNTS_ENABLED = process.env.NEXT_PUBLIC_ACCOUNTS_ENABLED === "true";
export const PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";

/** Live and unaffected — the bot runs on its own infrastructure. */
export const TELEGRAM_BOT_URL = "https://t.me/OliviaArcanaBot";
