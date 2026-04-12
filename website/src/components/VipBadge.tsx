"use client";

import { useSubscription } from "@/hooks/useSubscription";

interface VipBadgeProps {
  className?: string;
  showFree?: boolean;
}

export default function VipBadge({ className = "", showFree = false }: VipBadgeProps) {
  const { tier, isLoading, data } = useSubscription();

  if (isLoading) return null;

  if (tier === "vip") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-celestial-gold/20 text-celestial-gold border border-celestial-gold/30 ${className}`}
      >
        <span>&#10022;</span> VIP
        {data?.status === "trialing" && (
          <span className="text-celestial-gold/60 ml-1">(trial)</span>
        )}
      </span>
    );
  }

  if (showFree) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 text-muted-lavender border border-white/10 ${className}`}
      >
        Free
      </span>
    );
  }

  return null;
}
