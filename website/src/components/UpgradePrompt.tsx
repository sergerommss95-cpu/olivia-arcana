"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CheckoutButton from "@/components/CheckoutButton";

interface UpgradePromptProps {
  /** What triggered the prompt — shown in the message. */
  reason?: "message_limit" | "locked_reading" | "locked_feature" | "general";
  /** Whether to show as a modal overlay or inline banner. */
  variant?: "modal" | "banner" | "inline";
  /** Callback when user dismisses the prompt. */
  onDismiss?: () => void;
}

const MESSAGES: Record<string, { title: string; subtitle: string }> = {
  message_limit: {
    title: "You've reached your daily limit",
    subtitle: "Free accounts get 5 messages per day. Upgrade to VIP for unlimited conversations with Olivia.",
  },
  locked_reading: {
    title: "This reading is for VIP members",
    subtitle: "Unlock full birth charts, compatibility reports, and personalized transit alerts.",
  },
  locked_feature: {
    title: "VIP Feature",
    subtitle: "This feature is available to VIP subscribers. Upgrade to access your full cosmic toolkit.",
  },
  general: {
    title: "Unlock Your Full Chart",
    subtitle: "Get unlimited readings, daily personal forecasts, and priority access to Olivia.",
  },
};

export default function UpgradePrompt({
  reason = "general",
  variant = "modal",
  onDismiss,
}: UpgradePromptProps) {
  const [visible, setVisible] = useState(true);
  const msg = MESSAGES[reason];

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  if (!visible) return null;

  // ── Inline variant ──
  if (variant === "inline") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 text-center"
        style={{ border: "1px solid rgba(212, 175, 55, 0.2)" }}
      >
        <p className="text-celestial-gold text-sm font-medium mb-1">{msg.title}</p>
        <p className="text-muted-lavender text-xs mb-4">{msg.subtitle}</p>
        <CheckoutButton priceKey="premium_monthly" variant="gold" size="sm">
          Start Premium &mdash; $14.99/mo
        </CheckoutButton>
      </motion.div>
    );
  }

  // ── Banner variant ──
  if (variant === "banner") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
          style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(90,50,150,0.15))", backdropFilter: "blur(4px)" }}
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-warm-ivory text-sm font-medium">{msg.title}</p>
              <p className="text-muted-lavender text-xs">{msg.subtitle}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <CheckoutButton priceKey="premium_monthly" variant="gold" size="sm">
                Upgrade
              </CheckoutButton>
              <button
                onClick={handleDismiss}
                className="text-muted-lavender/60 hover:text-warm-ivory transition-colors text-lg"
                aria-label="Dismiss"
              >
                &times;
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── Modal variant (default) ──
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        onClick={handleDismiss}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-void-black/80 backdrop-blur-sm" />

        {/* Dialog */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative glass-card p-8 max-w-md w-full text-center"
          style={{ border: "1px solid rgba(212, 175, 55, 0.3)" }}
        >
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-muted-lavender/60 hover:text-warm-ivory transition-colors text-xl"
            aria-label="Close"
          >
            &times;
          </button>

          <div className="text-4xl mb-4">&#10022;</div>
          <h3 className="font-[family-name:var(--font-heading)] text-2xl text-celestial-gold mb-3">
            {msg.title}
          </h3>
          <p className="text-muted-lavender text-sm mb-6 leading-relaxed">
            {msg.subtitle}
          </p>

          {/* Value props */}
          <ul className="text-left space-y-2 mb-6">
            {[
              "Unlimited chat with Olivia",
              "Daily personal reading",
              "Real-time transit alerts",
              "Full compatibility reports",
              "Monthly Celtic Cross included",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-lavender">
                <span className="text-celestial-gold mt-0.5 shrink-0">&#10022;</span>
                {item}
              </li>
            ))}
          </ul>

          <CheckoutButton priceKey="premium_monthly" variant="gold" size="md" className="w-full justify-center">
            Start Premium &mdash; $14.99/mo
          </CheckoutButton>
          <p className="text-muted-lavender/50 text-xs mt-3">
            14-day refund &middot; Cancel anytime
          </p>

          <button
            onClick={handleDismiss}
            className="text-muted-lavender/40 hover:text-muted-lavender text-xs mt-4 transition-colors"
          >
            Maybe later
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
