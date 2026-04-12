"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import {
  getSubscriptionStatus,
  createCheckoutSession,
  createPortalSession,
  type PriceKey,
  type SubscriptionStatus,
} from "@/lib/payments";

interface SubscriptionContext {
  /** Current subscription data. Null while loading. */
  data: SubscriptionStatus | null;
  /** True while the initial fetch is in progress. */
  isLoading: boolean;
  /** True if the user has an active VIP subscription. */
  isVip: boolean;
  /** Current tier string. */
  tier: "free" | "vip";
  /** Start a checkout flow for a given price. Redirects to Stripe. */
  subscribe: (priceKey: PriceKey) => Promise<void>;
  /** Open Stripe Customer Portal for billing management. */
  manageSubscription: () => Promise<void>;
  /** Re-fetch subscription status (e.g., after returning from checkout). */
  refresh: () => Promise<void>;
  /** Error message if the last operation failed. */
  error: string | null;
}

const defaultContext: SubscriptionContext = {
  data: null,
  isLoading: true,
  isVip: false,
  tier: "free",
  subscribe: async () => {},
  manageSubscription: async () => {},
  refresh: async () => {},
  error: null,
};

const SubCtx = createContext<SubscriptionContext>(defaultContext);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("olivia_token") : null;
      if (!token) {
        setData(null);
        setIsLoading(false);
        return;
      }
      const status = await getSubscriptionStatus();
      setData(status);
      setError(null);
    } catch (e) {
      // Not logged in or network error — treat as free
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const subscribe = useCallback(async (priceKey: PriceKey) => {
    setError(null);
    try {
      const url = await createCheckoutSession(priceKey);
      window.location.href = url;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Checkout failed";
      setError(msg);
    }
  }, []);

  const manageSubscription = useCallback(async () => {
    setError(null);
    try {
      const url = await createPortalSession();
      window.location.href = url;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not open billing portal";
      setError(msg);
    }
  }, []);

  const value: SubscriptionContext = {
    data,
    isLoading,
    isVip: data?.is_vip ?? false,
    tier: data?.tier ?? "free",
    subscribe,
    manageSubscription,
    refresh,
    error,
  };

  return <SubCtx.Provider value={value}>{children}</SubCtx.Provider>;
}

export function useSubscription() {
  return useContext(SubCtx);
}
