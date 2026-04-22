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
            inset: "-3rem -4rem",
            background:
              "radial-gradient(ellipse at center, rgba(8,6,20,0.68) 0%, rgba(8,6,20,0.4) 55%, rgba(8,6,20,0) 95%)",
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
            {t("test_eyebrow")}
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
          font-weight: 400;
          font-size: clamp(1.2rem, 2.1vw, 1.45rem);
          line-height: 1.45;
          color: rgba(245, 240, 232, 0.95);
          margin: 0;
          padding: 0;
          letter-spacing: 0.003em;
        }
        .testimonial-attr {
          display: inline-flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 0.55em;
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(196, 185, 228, 0.78);
        }
        .testimonial-rule {
          display: inline-block;
          width: 28px;
          height: 1px;
          background: rgba(232, 201, 106, 0.55);
          margin-right: 0.4em;
          vertical-align: middle;
        }
        .testimonial-name {
          color: rgba(232, 201, 106, 0.92);
        }
        .testimonial-dot {
          opacity: 0.5;
          font-size: 0.82rem;
        }
        .testimonial-sign {
          color: rgba(220, 212, 240, 0.78);
        }
      `}</style>
    </section>
  );
}
