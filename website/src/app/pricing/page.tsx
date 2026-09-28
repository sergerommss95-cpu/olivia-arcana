import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "@/components/legal/LegalShell";
import TariffActions from "@/components/almanac/TariffActions";
import { ACCOUNTS_ENABLED, PAYMENTS_ENABLED } from "@/lib/service-status";
import { socialImages, socialImageUrls } from "@/lib/social-images";

export const metadata: Metadata = {
  title: "Free readings & membership — Olivia Arcana",
  description: "Every Olivia reading is free for now: one card, three cards, and the five- and eight-card spreads, plus a personal almanac on your device.",
  alternates: { canonical: "https://oliviaarcana.com/pricing" },
  openGraph: {
    title: "Free readings & membership — Olivia Arcana",
    description: "Start with a free reading. See what you can use today and how deeper member spreads work.",
    url: "https://oliviaarcana.com/pricing",
    type: "website",
    siteName: "Olivia Arcana",
    images: socialImages("en"),
  },
  twitter: { card: "summary_large_image", title: "Free readings & membership — Olivia Arcana", description: "Start with a free reading. See what you can use today and how deeper member spreads work.", images: socialImageUrls("en") },
};

const membershipReady = ACCOUNTS_ENABLED && PAYMENTS_ENABLED;

export default function PricingPage() {
  return (
    <LegalShell title="Room to begin. Room to go deeper." updated="September 25, 2026">
      <p>
        Begin with a question and the full 78-card Olivia deck. A useful first
        reading, and a place to keep your own reflections, are free.
      </p>

      <h2>Free, with no account required</h2>
      <ul>
        <li>One-card readings for a single focus.</li>
        <li>The three-card “A little clarity” spread.</li>
        {!membershipReady && (
          <li>The five-card “At a crossroads” and eight-card “The inner compass” spreads, while membership is being prepared.</li>
        )}
        <li>Your choice of cards, with optional reversed meanings.</li>
        <li>The card library, with all 78 Major and Minor Arcana.</li>
        <li>A personal almanac saved in this browser, with reflections and reading downloads.</li>
      </ul>
      <p>
        <Link href="/?experience=question" className="alm-btn">Begin a free reading ↗</Link>
      </p>
      <p>
        Your almanac is stored on this device. It does not require a subscription
        and does not automatically sync between devices. Download anything you
        want to keep outside this browser.
      </p>

      <h2>{membershipReady ? "Deeper spreads for members" : "Deeper spreads, free for now"}</h2>
      <p>
        “At a crossroads” uses five cards to explore two named options.
        “The inner compass” uses eight cards to examine a situation’s roots,
        influences, tension, support and next step.{" "}
        {membershipReady
          ? "Personal readings with these spreads require a verified paid membership; sample spreads are available to explore before deciding."
          : "Both are open to everyone until membership is ready."}
      </p>
      {membershipReady ? (
        <>
          <p>Choose a billing option below. The checkout shows the price and renewal terms before you pay.</p>
          <TariffActions />
        </>
      ) : (
        <>
          <h2>Membership is not open for purchase yet</h2>
          <p>
            New subscriptions are currently unavailable. Until they are, every
            reading is free, including the five- and eight-card spreads. We will
            show confirmed pricing and working checkout here when membership is ready.
          </p>
        </>
      )}
      <p>
        <Link href="/?experience=spreads" className="alm-link">Explore the spreads ↗</Link>
      </p>

      <h2>Clear expectations</h2>
      <p>
        AI guidance is identified where offered. It is not a promise of prediction,
        and availability is shown in the reading flow. Physical products, automatic
        daily notifications and Telegram service are not included in the membership
        described here.
      </p>
      <p>
        For a billing question, <Link href="/contact">contact us</Link>. The{" "}
        <Link href="/refund">refund policy</Link> and <Link href="/terms">terms</Link>{" "}
        explain the conditions that apply to purchases.
      </p>
    </LegalShell>
  );
}
