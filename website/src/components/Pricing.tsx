"use client";

import { useEffect, useRef, useState } from "react";

export default function Pricing() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="pricing" className="relative py-32 px-6" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <p className="font-[family-name:var(--font-accent)] text-celestial-gold text-sm tracking-[0.3em] uppercase mb-4">
            Pricing
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-warm-ivory mb-6">
            Unlock Your Full Chart
          </h2>
          <div className="star-divider max-w-xs mx-auto">&#10022;</div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div
            className={`glass-card p-8 transition-all duration-700 ${
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
          >
            <div className="mb-6">
              <h3 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-warm-ivory mb-2">
                Free
              </h3>
              <p className="text-muted-lavender text-sm">Start exploring the cosmos</p>
            </div>

            <div className="mb-8">
              <span className="text-4xl font-[family-name:var(--font-heading)] font-bold text-warm-ivory">$0</span>
              <span className="text-muted-lavender text-sm ml-2">forever</span>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                "5 messages per day with Olivia",
                "Daily zodiac forecast (all 12 signs)",
                "Tarot card of the day",
                "3-card tarot spread (once daily)",
                "Basic compatibility summary",
                "Weekly cosmic weather",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted-lavender">
                  <span className="text-cosmic-teal mt-0.5">&#10003;</span>
                  {item}
                </li>
              ))}
            </ul>

            <a
              href="/onboarding"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center py-3 rounded-full border border-muted-lavender/30 text-muted-lavender hover:border-celestial-gold/50 hover:text-celestial-gold transition-all duration-300"
            >
              Start Free
            </a>
          </div>

          {/* VIP Tier */}
          <div
            className={`relative glass-card p-8 transition-all duration-700 animate-pulse-glow ${
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
            style={{ transitionDelay: "100ms", border: "1px solid rgba(212, 175, 55, 0.3)" }}
          >
            {/* Popular badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-celestial-gold text-void-black text-xs font-semibold">
              Most Popular
            </div>

            <div className="mb-6">
              <h3 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-celestial-gold mb-2">
                VIP
              </h3>
              <p className="text-muted-lavender text-sm">The full cosmic experience</p>
            </div>

            <div className="mb-8">
              <span className="text-4xl font-[family-name:var(--font-heading)] font-bold text-celestial-gold">$6.50</span>
              <span className="text-muted-lavender text-sm ml-2">/month</span>
              <p className="text-xs text-muted-lavender/60 mt-1">
                or $65/year (2 months free)
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                "Unlimited chat with Olivia",
                "Daily personal reading (YOUR chart + today's transits)",
                "Real-time transit alerts on your natal points",
                "Weekly personalized tarot pull",
                "Monthly Celtic Cross reading included",
                "Full compatibility/synastry reports",
                "Eclipse & retrograde impact reports",
                "Birthday Solar Return reading",
                "Priority response — never wait in line",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-warm-ivory">
                  <span className="text-celestial-gold mt-0.5">&#10022;</span>
                  {item}
                </li>
              ))}
            </ul>

            <a
              href="/portrait"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center py-3 rounded-full bg-gradient-to-r from-celestial-gold to-[#F5E6A3] text-void-black font-semibold hover:scale-[1.02] transition-all duration-300"
            >
              Start VIP
            </a>

            <p className="text-center text-xs text-muted-lavender/60 mt-3">
              Pay with Telegram Stars or Crypto (TON/USDT)
            </p>
          </div>
        </div>

        {/* One-time purchases */}
        <div className="mt-16 text-center">
          <p className="text-muted-lavender text-sm mb-6">
            Or try individual premium readings:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { name: "Birth Chart", price: "$3.90" },
              { name: "Compatibility", price: "$3.90" },
              { name: "Celtic Cross", price: "$1.95" },
              { name: "Year-Ahead", price: "$6.50" },
              { name: "Video Reading", price: "$39.99" },
            ].map((item) => (
              <span
                key={item.name}
                className="px-4 py-2 rounded-full glass-card text-sm text-muted-lavender"
              >
                {item.name}{" "}
                <span className="text-celestial-gold">{item.price}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
