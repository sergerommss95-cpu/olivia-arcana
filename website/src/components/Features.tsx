/**
 * Features.tsx — typographic almanac catalog.
 *
 * Replaces the previous glass-card emoji grid with an editorial, typography-
 * first layout: a vertical list of four differentiators, each numbered in
 * muted italic Cormorant, titled in gold italic, and set with DM Sans body
 * copy. Hairline dividers between rows. No glass, no emoji, no color icons —
 * the typography IS the product.
 *
 * Reduced from 6 items to 4 so the page can breathe. "Cosmic Compatibility"
 * already has its own dedicated section on the homepage; "Personal Video
 * Reading" is a premium a-la-carte item that lives in /pricing. Keeping the
 * four strongest daily-driver features here.
 */

"use client";

import SmoothReveal from "@/components/SmoothReveal";
import { useLocale } from "../lib/i18n/useLocale";

interface FeatureItem {
  number: string;
  title: string;
  description: string;
}

export default function Features() {
  const { t } = useLocale();

  const features: FeatureItem[] = [
    {
      number: "I",
      title: t("feat_1_title"),
      description: t("feat_1_desc"),
    },
    {
      number: "II",
      title: t("feat_2_title"),
      description: t("feat_2_desc"),
    },
    {
      number: "III",
      title: t("feat_3_title"),
      description: t("feat_3_desc"),
    },
    {
      number: "IV",
      title: t("feat_5_title"),
      description: t("feat_5_desc"),
    },
  ];

  return (
    <section id="features" className="relative py-32 px-6">
      <div
        style={{
          maxWidth: "780px",
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Soft scrim behind the feature list so copy reads cleanly on the nebula */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: "-4rem -6rem",
            background:
              "radial-gradient(ellipse at center, rgba(8,6,20,0.7) 0%, rgba(8,6,20,0.45) 55%, rgba(8,6,20,0) 95%)",
            pointerEvents: "none",
            zIndex: -1,
          }}
        />

        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: "clamp(3rem, 6vw, 5rem)" }}>
          <p
            style={{
              fontFamily: "var(--font-body, system-ui), sans-serif",
              fontSize: "0.72rem",
              fontWeight: 500,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "rgba(232, 201, 106, 0.82)",
              margin: 0,
              marginBottom: "0.9rem",
            }}
          >
            {t("feat_eyebrow")}
          </p>
          <h2
            style={{
              fontFamily: "var(--font-heading, 'Cormorant Garamond'), serif",
              fontSize: "clamp(2rem, 4.6vw, 3rem)",
              fontWeight: 500,
              fontStyle: "italic",
              color: "rgba(245, 240, 232, 0.98)",
              lineHeight: 1.1,
              margin: 0,
              letterSpacing: "-0.005em",
            }}
          >
            {t("feat_title")}
          </h2>
        </div>

        {/* Feature list */}
        <SmoothReveal
          stagger={110}
          duration={700}
          direction="up"
          distance={28}
          blur
          className="feature-list"
        >
          {features.map((feature, i) => (
            <article
              key={feature.title}
              className="feature-row"
              style={{
                borderTop:
                  i === 0
                    ? "1px solid rgba(200, 185, 255, 0.12)"
                    : "1px solid rgba(200, 185, 255, 0.08)",
                borderBottom:
                  i === features.length - 1
                    ? "1px solid rgba(200, 185, 255, 0.12)"
                    : "none",
              }}
            >
              <span className="feature-num" aria-hidden>
                {feature.number}
              </span>
              <div className="feature-body">
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.description}</p>
              </div>
            </article>
          ))}
        </SmoothReveal>
      </div>

      <style>{`
        .feature-row {
          display: grid;
          grid-template-columns: 4.5rem 1fr;
          gap: clamp(1rem, 3vw, 2.2rem);
          align-items: baseline;
          padding: clamp(1.75rem, 3.4vw, 2.6rem) 0.25rem;
        }
        .feature-num {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-weight: 500;
          font-size: clamp(1.6rem, 2.8vw, 2.1rem);
          color: rgba(232, 201, 106, 0.6);
          line-height: 1;
          text-align: left;
          letter-spacing: 0.02em;
        }
        .feature-title {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-weight: 500;
          font-size: clamp(1.45rem, 2.6vw, 1.85rem);
          color: rgba(245, 240, 232, 0.98);
          line-height: 1.2;
          margin: 0 0 0.75rem 0;
          letter-spacing: -0.002em;
        }
        .feature-desc {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 1rem;
          line-height: 1.7;
          color: rgba(220, 212, 240, 0.82);
          margin: 0;
          max-width: 52ch;
        }
        @media (max-width: 520px) {
          .feature-row {
            grid-template-columns: 3rem 1fr;
            gap: 0.9rem;
          }
        }
      `}</style>
    </section>
  );
}
