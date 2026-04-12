"use client";

import { motion } from "framer-motion";
import MagneticButton from "@/components/MagneticButton";

export default function CheckoutCancelPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-10 max-w-md w-full text-center"
      >
        <div className="text-4xl mb-6">&#9790;</div>

        <h1 className="font-[family-name:var(--font-heading)] text-2xl text-warm-ivory mb-3">
          No worries
        </h1>

        <p className="text-muted-lavender text-sm mb-6 leading-relaxed">
          Your free features are still waiting for you. Come back anytime when you&apos;re ready to unlock the full cosmic experience.
        </p>

        <div className="space-y-3">
          <MagneticButton href="/#pricing" variant="glass" size="md" className="w-full justify-center">
            Back to Pricing
          </MagneticButton>
          <MagneticButton href="/" variant="glass" size="md" className="w-full justify-center">
            Back to Home
          </MagneticButton>
        </div>

        <p className="text-muted-lavender/40 text-xs mt-6">
          Questions? Message us on Telegram.
        </p>
      </motion.div>
    </main>
  );
}
