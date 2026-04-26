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
          No charge — and no worries
        </h1>

        <p className="text-muted-lavender text-sm mb-6 leading-relaxed">
          Your card was not charged. The free tier is still here for you, and you can come back to upgrade any time.
        </p>

        <ul className="text-left text-muted-lavender/80 text-xs space-y-2 mb-7 max-w-xs mx-auto">
          <li className="flex items-start gap-2"><span className="text-celestial-gold mt-0.5">✦</span><span>14-day refund on subscriptions, no questions</span></li>
          <li className="flex items-start gap-2"><span className="text-celestial-gold mt-0.5">✦</span><span>Cancel any time from <a href="/account/billing" className="underline">/account/billing</a></span></li>
          <li className="flex items-start gap-2"><span className="text-celestial-gold mt-0.5">✦</span><span>Pay via Paddle (web) or Telegram Stars</span></li>
        </ul>

        <div className="space-y-3">
          <MagneticButton href="/#pricing" variant="gold" size="md" className="w-full justify-center">
            See plans again
          </MagneticButton>
          <MagneticButton href="/" variant="glass" size="md" className="w-full justify-center">
            Back to home
          </MagneticButton>
        </div>

        <p className="text-muted-lavender/40 text-xs mt-6">
          Questions? <a href="/contact" className="hover:text-celestial-gold/70 transition-colors">Contact us</a> or <a href="https://t.me/OliviaArcanaBot" target="_blank" rel="noopener noreferrer" className="hover:text-celestial-gold/70 transition-colors">message us on Telegram</a>.
        </p>
      </motion.div>
    </main>
  );
}
