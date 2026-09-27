"use client";

import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import { ACCOUNTS_ENABLED } from "@/lib/service-status";
import {
  getSubscriptionStatus,
  createCheckoutSession,
  createPortalSession,
  type PriceKey,
  type SubscriptionStatus,
  type Tier,
} from "@/lib/payments";

interface SubscriptionContext {
  data: SubscriptionStatus | null;
  isLoading: boolean;
  /** True if user has any paid tier (insight/premium/vip). */
  isPaid: boolean;
  /** True only on VIP tier. */
  isVip: boolean;
  /** True on premium or vip. */
  isPremiumOrAbove: boolean;
  tier: Tier;
  /** Start a Paddle checkout flow for a given price. */
  subscribe: (priceKey: PriceKey) => Promise<void>;
  /** Open Paddle billing portal. */
  manageSubscription: () => Promise<void>;
  refresh: () => Promise<void>;
  error: string | null;
}

const defaultContext: SubscriptionContext = {
  data: null,
  isLoading: true,
  isPaid: false,
  isVip: false,
  isPremiumOrAbove: false,
  tier: "free",
  subscribe: async () => {},
  manageSubscription: async () => {},
  refresh: async () => {},
  error: null,
};

const SubCtx = createContext<SubscriptionContext>(defaultContext);

const TOKEN_KEY = "olivia-token";

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestSequence = useRef({ value: 0 });

  const refresh = useCallback(async () => {
    const requestId = ++requestSequence.current.value;
    setIsLoading(true);
    setError(null);
    try {
      // No accounts, no membership to verify: every visitor is on the free tier,
      // and the Supabase client is never downloaded.
      if (!ACCOUNTS_ENABLED) {
        setData(null);
        return;
      }
      const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
      const session = token ? null : await (await import("@/lib/supabase")).getSession();
      if (requestId !== requestSequence.current.value) return;
      if (!token && !session?.access_token) {
        setData(null);
        return;
      }
      const status = await getSubscriptionStatus();
      if (requestId !== requestSequence.current.value) return;
      setData(status);
      setError(null);
    } catch (err: unknown) {
      if (requestId !== requestSequence.current.value) return;
      setData(null);
      setError(err instanceof Error ? err.message : "Could not verify membership");
    } finally {
      if (requestId === requestSequence.current.value) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const requests = requestSequence.current;
    const onFocus = () => { void refresh(); };
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === TOKEN_KEY || (event.key.startsWith("sb-") && event.key.endsWith("-auth-token"))) {
        void refresh();
      }
    };
    void refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    return () => {
      ++requests.value;
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  const subscribe = useCallback(async (priceKey: PriceKey) => {
    setError(null);
    try {
      const url = await createCheckoutSession(priceKey);
      window.location.href = url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    }
  }, []);

  const manageSubscription = useCallback(async () => {
    setError(null);
    try {
      const url = await createPortalSession();
      window.location.href = url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not open billing portal");
    }
  }, []);

  const paidTier = data?.tier === "insight" || data?.tier === "premium" || data?.tier === "vip";
  const isPaid = !isLoading && !error && data?.is_paid === true && paidTier;
  const tier: Tier = isPaid ? data!.tier : "free";
  const isVip = tier === "vip";
  const isPremiumOrAbove = tier === "premium" || tier === "vip";

  const value: SubscriptionContext = {
    data, isLoading, isPaid, isVip, isPremiumOrAbove, tier,
    subscribe, manageSubscription, refresh, error,
  };

  return <SubCtx.Provider value={value}>{children}</SubCtx.Provider>;
}

export function useSubscription() {
  return useContext(SubCtx);
}
