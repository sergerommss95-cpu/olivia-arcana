/**
 * Service availability gates. These are deployment switches, not health checks.
 * Enable a service only after its complete user flow has been verified. A live
 * astronomy health endpoint does not verify accounts, billing or Telegram.
 */
import { launchAvailability } from "./launch-policy.js";
const launch = launchAvailability({ accounts: process.env.NEXT_PUBLIC_ACCOUNTS_ENABLED, payments: process.env.NEXT_PUBLIC_PAYMENTS_ENABLED });
export const ACCOUNTS_ENABLED = launch.accounts;
export const PAYMENTS_ENABLED = launch.payments;
export const TELEGRAM_BOT_ENABLED = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ENABLED === "true";
export const TELEGRAM_CHANNEL_ENABLED = process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_ENABLED === "true";

export const TELEGRAM_BOT_URL = "https://t.me/OliviaArcanaBot";
export const TELEGRAM_CHANNEL_URL = "https://t.me/OliviaArcanaDaily";
