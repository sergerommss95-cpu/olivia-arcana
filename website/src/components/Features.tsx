"use client";

import TiltCard from "./TiltCard";
import ScrollFloat from "@/components/ScrollFloat";
import { useLocale } from "../lib/i18n/useLocale";

interface FeatureItem {
  icon: string;
  title: string;
  description: string;
  color: string;
}

function FeatureCard({ feature }: { feature: FeatureItem }) {
  return (
    <TiltCard maxTilt={3}>
    <div className="glass-card p-4 md:p-8 transition-all duration-700 hover:border-celestial-gold/30">
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
            <ScrollFloat key={feature.title} index={i} intensity="subtle" disableRotate>
              <FeatureCard feature={feature} />
            </ScrollFloat>
          ))}
        </div>
      </div>
    </section>
  );
}
