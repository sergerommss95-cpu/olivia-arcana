"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
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

  const refresh = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
      if (!token) {
        setData(null);
        setIsLoading(false);
        return;
      }
      const status = await getSubscriptionStatus();
      setData(status);
      setError(null);
    } catch {
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

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

  const tier: Tier = data?.tier ?? "free";
  const isPaid = tier !== "free";
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
