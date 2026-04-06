"use client";

import { useEffect, useRef, useState } from "react";

const features = [
  {
    icon: "☉",
    title: "Personal Birth Chart",
    description: "Your natal chart calculated from NASA JPL ephemeris — real planetary positions at the exact moment of your birth. Not a sun-sign template.",
    color: "#D4AF37",
  },
  {
    icon: "☽",
    title: "Daily Cosmic Guidance",
    description: "Every morning, a reading crafted specifically for YOUR chart based on today's real planetary transits. Not generic — deeply personal.",
    color: "#7B68EE",
  },
  {
    icon: "🃏",
    title: "Tarot Readings",
    description: "From daily single-card pulls to deep Celtic Cross spreads. Each interpretation woven with your astrological data for layered insight.",
    color: "#4ECDC4",
  },
  {
    icon: "💕",
    title: "Cosmic Compatibility",
    description: "Full synastry analysis between two birth charts. Venus/Mars dynamics, Moon compatibility, and where the sparks — and friction — live.",
    color: "#E8524A",
  },
  {
    icon: "⚡",
    title: "Transit Alerts",
    description: "Real-time notifications when major planets cross sensitive points in YOUR chart. Saturn hitting your 10th house? You'll know first.",
    color: "#D4AF37",
  },
  {
    icon: "🎬",
    title: "Personal Video Reading",
    description: "A 5-8 minute video of Olivia reading your chart and cards — filmed just for you. The most intimate reading experience available.",
    color: "#7B68EE",
  },
];

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`glass-card p-8 transition-all duration-700 hover:scale-[1.02] hover:border-celestial-gold/30 ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Icon with glow */}
      <div
        className="text-4xl mb-5 w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{
          background: `${feature.color}15`,
          boxShadow: `0 0 30px ${feature.color}10`,
        }}
      >
        {feature.icon}
      </div>

      <h3 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-warm-ivory mb-3">
        {feature.title}
      </h3>

      <p className="text-muted-lavender text-sm leading-relaxed">
        {feature.description}
      </p>
    </div>
  );
}

export default function Features() {
  return (
    <section id="features" className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-20">
          <p className="font-[family-name:var(--font-accent)] text-celestial-gold text-sm tracking-[0.3em] uppercase mb-4">
            What Olivia Offers
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-warm-ivory mb-6">
            Your Chart, Decoded
          </h2>
          <div className="star-divider max-w-xs mx-auto">&#10022;</div>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
