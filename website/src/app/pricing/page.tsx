import React, { Suspense } from "react";
import type { Metadata } from "next";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";
import { PRICING } from "@/lib/payments";

export const metadata: Metadata = {
  title: "Pricing — Free, Insight, Premium, VIP | Olivia Arcana",
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
      { "@type": "Offer", name: "Premium Monthly", price: PRICING.premium.monthly.toFixed(2), priceCurrency: "USD" },
      { "@type": "Offer", name: "Premium Annual", price: PRICING.premium.annual.toFixed(2), priceCurrency: "USD" },
      { "@type": "Offer", name: "VIP Monthly", price: PRICING.vip.monthly.toFixed(2), priceCurrency: "USD" },
      { "@type": "Offer", name: "VIP Annual", price: PRICING.vip.annual.toFixed(2), priceCurrency: "USD" },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <main id="main-content" className="relative z-10 pt-20">
        <h1 className="sr-only">Olivia Arcana pricing</h1>
        <Suspense fallback={<div className="min-h-screen bg-[#08061a]" />}>
          <Pricing />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
