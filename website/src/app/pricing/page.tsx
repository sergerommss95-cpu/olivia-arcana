import React, { Suspense } from "react";
import type { Metadata } from "next";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";
import { PRICING } from "@/lib/payments";

export const metadata: Metadata = {
  title: "Pricing — Free, Insight, Premium, VIP | Olivia Arcana",
  description:
    "Choose your orbit. Free forever, or unlock the full chart from $3.25/month (Insight Annual). Real astrology, real AI oracle, 14-day refund, billed via Paddle.",
  alternates: { canonical: "https://oliviaarcana.com/pricing" },
  openGraph: {
    title: "Olivia Arcana — Pricing",
    description: "Free forever or unlock the full chart from $3.25/mo. 14-day refund.",
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
      "Premium astrology + tarot platform. NASA-grade astronomy, AI oracle, 78-card cinematic deck, 207-lesson academy, 8 languages.",
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
