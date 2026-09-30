"use client";

import { useEffect, useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { getPaymentSessionToken, type PriceKey } from "@/lib/payments";
import { isNativeShell, externalUpgradeUrl } from "@/lib/platform";
import MagneticButton from "@/components/MagneticButton";
import { useLocale } from "@/lib/i18n/useLocale";
import { PAYMENTS_ENABLED } from "@/lib/service-status";

/**
 * Cross-lane contract: a buyer who is not signed in gets their intent
 * parked here, then goes to /login. Profile + billing read and clear it
 * (it expires after 60 minutes).
 */
export const PENDING_CHECKOUT_KEY = "oa-pending-checkout";

interface CheckoutButtonProps {
  priceKey: PriceKey;
  variant?: "gold" | "glass";
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
}

export default function CheckoutButton({
  priceKey,
  variant = "gold",
  size = "md",
  className = "",
  children,
}: CheckoutButtonProps) {
  const { locale } = useLocale();
  const { subscribe, isVip, manageSubscription, error } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [native, setNative] = useState(false);

  // Hydrate native-shell flag on the client only — keeps SSR + static export
  // outputs identical for Safari and the native app.
  useEffect(() => { setNative(isNativeShell()); }, []);

  const handleClick = async () => {
    if (!PAYMENTS_ENABLED) return;

    // Inside iOS/Android native shell: Apple/Google bills 30% of any digital
    // sale. Send the user to the open web to subscribe via Paddle (5%).
    if (native) {
      window.location.href = externalUpgradeUrl();
      return;
    }

    const token = getPaymentSessionToken();
    if (!token) {
      // Park the purchase intent, then sign in — profile/billing resume it.
      try {
        localStorage.setItem(
          PENDING_CHECKOUT_KEY,
          JSON.stringify({ price: priceKey, ts: Date.now() })
        );
      } catch {
        // Storage unavailable (private mode etc.) — still send them to login.
      }
      window.location.href = "/login/?reason=checkout";
      return;
    }

    setLoading(true);
    try {
      await subscribe(priceKey);
    } finally {
      setLoading(false);
    }
  };

  const isSubscriptionKey = priceKey.endsWith("_monthly") || priceKey.endsWith("_annual");
  if (PAYMENTS_ENABLED && isVip && isSubscriptionKey) {
    return (
      <MagneticButton
        variant={variant}
        size={size}
        className={className}
        onClick={() => manageSubscription()}
      >
        Manage Subscription
      </MagneticButton>
    );
  }

  const label = !PAYMENTS_ENABLED ? (locale === "uk" ? "Платні послуги поки недоступні" : "Paid services are not available yet") : native ? "Continue on web →" : null;

  return (
    <>
      <MagneticButton
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
        disabled={loading || !PAYMENTS_ENABLED}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Processing...
          </span>
        ) : (
          label || children
        )}
      </MagneticButton>
      {error && (
        <p className="text-red-400 text-xs mt-2 text-center">{error}</p>
      )}
    </>
  );
}
