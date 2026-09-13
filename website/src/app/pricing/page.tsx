import React from "react";
import type { Metadata } from "next";
import { PRICING } from "@/lib/payments";
import LegalShell from "@/components/legal/LegalShell";
import TariffTable from "@/components/almanac/TariffTable";

export const metadata: Metadata = {
  title: "The Tariff — Free, Insight, Astronomer, Patron | Olivia Arcana",
  description:
    "Start free, then choose a paid plan when you want fuller chart readings, compatibility, transits, and deeper tarot spreads.",
  alternates: { canonical: "https://oliviaarcana.com/pricing" },
  openGraph: {
    title: "Olivia Arcana — Pricing",
    description: "Start free. Upgrade when you want deeper readings, compatibility, transits, and more Oracle access.",
    url: "https://oliviaarcana.com/pricing",
    type: "website",
  },
};

export default function PricingPage() {
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Olivia Arcana — Astrology & Tarot Subscription",
    description:
      "Personal astrology and tarot subscriptions with free starter access and optional deeper reading plans.",
    brand: { "@type": "Brand", name: "Olivia Arcana" },
    offers: [
      { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD", availability: "https://schema.org/InStock" },
      { "@type": "Offer", name: "Insight Monthly", price: PRICING.insight.monthly.toFixed(2), priceCurrency: "USD" },
      { "@type": "Offer", name: "Insight Annual", price: PRICING.insight.annual.toFixed(2), priceCurrency: "USD" },
      { "@type": "Offer", name: "Astronomer Monthly", price: PRICING.premium.monthly.toFixed(2), priceCurrency: "USD" },
      { "@type": "Offer", name: "Astronomer Annual", price: PRICING.premium.annual.toFixed(2), priceCurrency: "USD" },
      { "@type": "Offer", name: "Patron Monthly", price: PRICING.vip.monthly.toFixed(2), priceCurrency: "USD" },
      { "@type": "Offer", name: "Patron Annual", price: PRICING.vip.annual.toFixed(2), priceCurrency: "USD" },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <LegalShell title="The Tariff" updated="August 19, 2026">
        <p>
          Begin for nothing. The daily card and basic chart context are free, forever. Paid plans add full
          readings, compatibility, transits, and the deeper spreads — priced plainly, cancelled any time,
          never sold with fear.
        </p>
        <TariffTable />
        <blockquote>
          <strong>Every leaf is open right now.</strong> While the press is stopped, nothing is charged
          for and nothing is withheld — full readings, compatibility, transits and the deeper spreads
          are yours to use. The table above is what they will cost when it turns again.
        </blockquote>
        <h2>What the plans hold</h2>
        <p>
          <strong>Free</strong> — the daily card, basic chart context, and the academy. Enough to decide
          whether this almanac is for you.
        </p>
        <p>
          <strong>Insight</strong> — full oracle readings and the journal: every reading kept, dated, and
          returnable, like entries in a commonplace book.
        </p>
        <p>
          <strong>Astronomer</strong> — everything in Insight, with synastry (two charts read together),
          transit timing, and the deep spreads.
        </p>
        <p>
          <strong>Patron</strong> — everything above, first in line for new rooms of the almanac as they
          open, and the yearly reading.
        </p>
        <blockquote>Cancel any time from your account. The current period stays yours until its end.</blockquote>
        <h2>While the press is stopped</h2>
        <p>
          The instruments are cooled and hooded; no payment is taken while the press rests. If you want
          to be first served when it turns again, <a href="/oracle-letter">leave your letter in the
          ledger</a> — a standing subscription to your own sky, held in your name until the type is set.
        </p>
        <p>
          Billing questions are answered in the <a href="/refund">refund policy</a>; the fine print lives
          in the <a href="/terms">terms</a>.
        </p>
      </LegalShell>
    </>
  );
}
