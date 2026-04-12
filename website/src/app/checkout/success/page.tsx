"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSubscription } from "@/hooks/useSubscription";
import MagneticButton from "@/components/MagneticButton";
import VipBadge from "@/components/VipBadge";

export default function CheckoutSuccessPage() {
  const { refresh, isVip, tier } = useSubscription();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Refresh subscription status after returning from Stripe
    const timer = setTimeout(async () => {
      await refresh();
      setLoaded(true);
    }, 1500); // Small delay for webhook to process
    return () => clearTimeout(timer);
  }, [refresh]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="glass-card p-10 max-w-md w-full text-center"
        style={{ border: "1px solid rgba(212, 175, 55, 0.3)" }}
      >
        {/* Animated star */}
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="text-5xl text-celestial-gold mb-6"
        >
          &#10022;
        </motion.div>

        <h1 className="font-[family-name:var(--font-heading)] text-3xl text-celestial-gold mb-3">
          Welcome to VIP
        </h1>

        <p className="text-muted-lavender text-sm mb-6 leading-relaxed">
          Your cosmic journey just leveled up. All premium features are now unlocked.
        </p>

        {loaded && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <VipBadge showFree />
          </motion.div>
        )}

        {!loaded && (
          <div className="flex justify-center mb-8">
            <svg className="animate-spin h-5 w-5 text-celestial-gold" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
        )}

        {/* What's unlocked */}
        <ul className="text-left space-y-3 mb-8">
          {[
            "Unlimited conversations with Olivia",
            "Daily personalized readings",
            "Real-time transit alerts",
            "Full compatibility reports",
            "Monthly Celtic Cross reading",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-muted-lavender">
              <span className="text-celestial-gold mt-0.5">&#10003;</span>
              {item}
            </li>
          ))}
        </ul>

        <div className="space-y-3">
          <MagneticButton href="/portrait" variant="gold" size="md" className="w-full justify-center">
            Get Your Personal Reading
          </MagneticButton>
          <MagneticButton href="/" variant="glass" size="md" className="w-full justify-center">
            Back to Home
          </MagneticButton>
        </div>
      </motion.div>
    </main>
  );
}
