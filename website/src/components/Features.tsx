"use client";

import { useEffect, useRef, useState } from "react";
import TiltCard from "./TiltCard";
import { useLocale } from "../lib/i18n/useLocale";

interface FeatureItem {
  icon: string;
  title: string;
  description: string;
  color: string;
}

function FeatureCard({
  feature,
  index,
}: {
  feature: FeatureItem;
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
    <TiltCard maxTilt={3}>
    <div
      ref={ref}
      className={`glass-card p-8 transition-all duration-700 hover:border-celestial-gold/30 ${
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
    </TiltCard>
  );
}

export default function Features() {
  const { t } = useLocale();

  const features: FeatureItem[] = [
    {
      icon: "☉",
      title: t("feat_1_title"),
      description: t("feat_1_desc"),
      color: "#D4AF37",
    },
    {
      icon: "☽",
      title: t("feat_2_title"),
      description: t("feat_2_desc"),
      color: "#7B68EE",
    },
    {
      icon: "🃏",
      title: t("feat_3_title"),
      description: t("feat_3_desc"),
      color: "#4ECDC4",
    },
    {
      icon: "💕",
      title: t("feat_4_title"),
      description: t("feat_4_desc"),
      color: "#E8524A",
    },
    {
      icon: "⚡",
      title: t("feat_5_title"),
      description: t("feat_5_desc"),
      color: "#D4AF37",
    },
    {
      icon: "🎬",
      title: t("feat_6_title"),
      description: t("feat_6_desc"),
      color: "#7B68EE",
    },
  ];

  return (
    <section id="features" className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-20">
          <p className="font-[family-name:var(--font-accent)] text-celestial-gold text-sm tracking-[0.3em] uppercase mb-4">
            {t("feat_eyebrow")}
          </p>
          <h2 className="font-[family-name:var(--font-heading)] text-4xl md:text-5xl font-bold text-warm-ivory mb-6">
            {t("feat_title")}
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
