/**
 * Testimonials.tsx — editorial pull-quote triptych.
 *
 * Replaces the previous glass-card grid with three full-italic Cormorant
 * pull-quotes set in an almanac-style triptych. No avatars, no cards, no
 * gold-star rating row. Each quote sits on a soft radial scrim (so it reads
 * on the nebula background) with monospace attribution below.
 *
 * This is the "Voices from the Stars" moment — it should feel like a
 * magazine callout page, not a consumer-app social-proof grid.
 */

"use client";

import SmoothReveal from "@/components/SmoothReveal";
import { useLocale } from "../lib/i18n/useLocale";

export default function Testimonials() {
  const { t } = useLocale();

  const testimonials = [
    {
      quote: t("test_1_quote"),
      name: t("test_1_name"),
      sign: t("test_1_sign"),
    },
    {
      quote: t("test_2_quote"),
      name: t("test_2_name"),
      sign: t("test_2_sign"),
    },
    {
      quote: t("test_3_quote"),
      name: t("test_3_name"),
      sign: t("test_3_sign"),
    },
  ];

  return (
    <section className="relative py-32 px-6">
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Scrim behind the triptych so body text reads over the nebula */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: "-4rem -6rem",
            background:
              "radial-gradient(ellipse at center, rgba(5,3,20,0.85) 0%, rgba(5,3,20,0.5) 65%, transparent 100%)",
            pointerEvents: "none",
            zIndex: -1,
          }}
        />

        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: "clamp(3rem, 6vw, 5rem)" }}>
          <p className="readable-label mb-3">
            {t("test_eyebrow")}
          </p>
          <h2
            style={{
              fontFamily: "var(--font-heading, 'Cormorant Garamond'), serif",
              fontSize: "clamp(2.2rem, 4.4vw, 3.2rem)",
              fontWeight: 500,
              fontStyle: "italic",
              color: "#f5f2e1",
              lineHeight: 1.1,
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            {t("test_title")}
          </h2>
        </div>

        {/* Triptych of pull quotes */}
        <SmoothReveal
          stagger={140}
          duration={800}
          direction="up"
          distance={30}
          blur
          className="testimonials-grid"
        >
          {testimonials.map((item) => (
            <figure key={item.name} className="testimonial-item">
              <blockquote className="testimonial-quote">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <figcaption className="testimonial-attr">
                <span className="testimonial-rule" aria-hidden />
                <span className="testimonial-name">{item.name}</span>
                <span className="testimonial-dot" aria-hidden>
                  ·
                </span>
                <span className="testimonial-sign">{item.sign}</span>
              </figcaption>
            </figure>
          ))}
        </SmoothReveal>
      </div>

      <style>{`
        .testimonials-grid {
          display: grid;
          gap: clamp(2.5rem, 4vw, 4rem);
          grid-template-columns: 1fr;
        }
        @media (min-width: 820px) {
          .testimonials-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: clamp(2rem, 3.5vw, 3.2rem);
          }
        }
        .testimonial-item {
          display: grid;
          gap: 1.5rem;
          margin: 0;
          padding: 0;
          text-align: center;
        }
        .testimonial-quote {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-weight: 500;
          font-size: clamp(1.45rem, 2.1vw, 1.8rem);
          line-height: 1.6;
          color: #f5f2e1;
          margin: 0;
          padding: 0;
          letter-spacing: 0.005em;
          text-shadow: 0 0 20px rgba(255,255,255,0.05);
        }
        .testimonial-attr {
          display: inline-flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 0.65em;
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--c-text-secondary);
        }
        .testimonial-rule {
          display: inline-block;
          width: 32px;
          height: 1px;
          background: rgba(212, 175, 55, 0.4);
          margin-right: 0.5em;
          vertical-align: middle;
        }
        .testimonial-name {
          color: var(--c-gold);
          opacity: 1;
        }
        .testimonial-dot {
          opacity: 0.4;
          font-size: 0.9rem;
        }
        .testimonial-sign {
          color: var(--c-text-secondary);
          opacity: 0.85;
        }
      `}</style>
    </section>
  );
}
