/**
 * /signs/[sign] — Individual zodiac sign detail page
 * Rich SEO content per sign.
 */

import React from "react";
import { notFound } from "next/navigation";
import { SIGN_PAGES, type SignPage } from "../../../lib/sign-data";
import ShareSignButton from "../../../components/ShareSignButton";
import Surface, { Eyebrow, Rule } from "../../../components/design/Surface";

// Element decoration for the share card. Kept here (not in sign-data) so the
// data file stays purely textual.
const ELEMENT_EMOJI: Record<string, string> = {
  Fire: "🔥",
  Earth: "🌿",
  Air: "💨",
  Water: "💧",
};
const ELEMENT_COLOR: Record<string, string> = {
  Fire: "#E8524A",
  Earth: "#9CB37A",
  Air: "#C9C0E0",
  Water: "#4FC3F7",
};

// Generate static params for all 12 signs
export function generateStaticParams() {
  return Object.keys(SIGN_PAGES).map(sign => ({ sign }));
}

export async function generateMetadata({ params }: { params: Promise<{ sign: string }> }) {
  const { sign } = await params;
  const data = SIGN_PAGES[sign?.toLowerCase()];
  if (!data) return {};
  const url = `https://oliviaarcana.com/signs/${sign.toLowerCase()}/`;
  const title = `${data.name} ${data.glyph} — Zodiac Sign Guide | Olivia Arcana`;
  const description = data.description.slice(0, 155) + "…";
  return {
    title,
    description,
    keywords: [
      `${data.name} zodiac`,
      `${data.name} sign`,
      `${data.name} astrology`,
      `${data.name} ${data.element}`,
      `${data.name} ${data.modality}`,
      `${data.name} traits`,
      `${data.name} compatibility`,
    ],
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      siteName: "Olivia Arcana",
      images: [
        {
          // Per-sign social card. Falls back to the site OG until a per-sign
          // image generator ships. Once generated, store at
          // /og/signs/<sign>.png (1200x630).
          url: `https://oliviaarcana.com/og/signs/${sign.toLowerCase()}.png`,
          secureUrl: `https://oliviaarcana.com/og/signs/${sign.toLowerCase()}.png`,
          width: 1200,
          height: 630,
          alt: `${data.name} ${data.glyph} — ${data.motto}. ${data.element} ${data.modality} sign ruled by ${data.ruler}.`,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`https://oliviaarcana.com/og/signs/${sign.toLowerCase()}.png`],
    },
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "2.5rem" }}>
      <h2 style={{
        fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "1.45rem", fontWeight: 400,
        color: "rgba(240,236,255,0.95)", marginBottom: "1rem",
        letterSpacing: "-0.01em",
      }}>{title}</h2>
      {children}
    </div>
  );
}

function TagList({ items, color = "rgba(200,185,255,0.15)" }: { items: string[]; color?: string }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
      {items.map(item => (
        <Surface key={item} variant="solid" radius="pill" pad="none" style={{
          padding: "0.4rem 0.85rem",
          background: color,
          borderColor: "rgba(200,185,255,0.1)",
        }}>
          <span style={{
            fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 400,
            color: "rgba(240,235,255,0.85)", letterSpacing: "0.02em",
          }}>{item}</span>
        </Surface>
      ))}
    </div>
  );
}

export default async function SignDetailPage({ params }: { params: Promise<{ sign: string }> }) {
  const { sign } = await params;
  const data = SIGN_PAGES[sign?.toLowerCase()];
  if (!data) return notFound();

  const glass = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,185,255,0.08)",
    borderRadius: "1rem",
    padding: "1.25rem",
  };

  const label = {
    fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 500,
    letterSpacing: "0.18em", textTransform: "uppercase" as const,
    color: "rgba(180,170,210,0.4)",
  };

  // ── Facts rendered as a typographic list, not a card grid ──
  const facts: { l: string; v: string }[] = [
    { l: "Element", v: data.element },
    { l: "Modality", v: data.modality },
    { l: "Ruler", v: `${data.rulerGlyph} ${data.ruler}` },
    { l: "Season", v: data.season },
    { l: "Tarot", v: data.tarotCard },
    { l: "Crystal", v: data.crystal },
  ];

  return (
    <div style={{
      minHeight: "100vh", position: "relative", zIndex: 1,
      maxWidth: "820px", margin: "0 auto",
      padding: "calc(var(--nav-height, 5rem) + 2rem) clamp(1.25rem, 4vw, 2rem) 4rem",
    }}>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: "2rem" }}>
        <ol style={{
          listStyle: "none", display: "flex", gap: "0.5rem", alignItems: "center",
          padding: 0, margin: 0, flexWrap: "wrap",
          fontFamily: "var(--font-body, system-ui), sans-serif",
          fontSize: "0.7rem", fontWeight: 500,
          letterSpacing: "0.16em", textTransform: "uppercase",
          color: "rgba(180,170,210,0.55)",
        }}>
          <li><a href="/" style={{ color: "inherit", textDecoration: "none" }}>Home</a></li>
          <li aria-hidden style={{ color: "rgba(180,170,210,0.3)" }}>/</li>
          <li><a href="/signs" style={{ color: "inherit", textDecoration: "none" }}>Signs</a></li>
          <li aria-hidden style={{ color: "rgba(180,170,210,0.3)" }}>/</li>
          <li aria-current="page" style={{ color: "rgba(232, 201, 106, 0.92)" }}>{data.name}</li>
        </ol>
      </nav>

      {/* Editorial hero — glyph as background composition */}
      <header style={{ position: "relative", marginBottom: "4rem", isolation: "isolate" }}>
        {/* Oversized glyph as background */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: "-40px",
            right: "-30px",
            fontSize: "clamp(12rem, 32vw, 26rem)",
            lineHeight: 1,
            fontFamily: "var(--font-heading, 'Cormorant Garamond'), serif",
            color: "rgba(232, 201, 106, 0.06)",
            userSelect: "none",
            zIndex: -1,
            pointerEvents: "none",
            filter: "blur(2px)",
          }}
        >
          {data.glyph}
        </span>

        <Eyebrow tone="gold" style={{ marginBottom: "1rem" }}>
          {data.dateRange}
        </Eyebrow>

        <h1
          style={{
            fontFamily: "var(--font-heading, 'Cormorant Garamond'), serif",
            fontStyle: "italic",
            fontSize: "clamp(3.5rem, 9vw, 7.5rem)",
            fontWeight: 400,
            color: "#F5F0E8",
            letterSpacing: "-0.03em",
            lineHeight: 0.9,
            margin: "0 0 1.5rem",
          }}
        >
          {data.name}
        </h1>

        <p
          style={{
            fontFamily: "var(--font-heading, 'Cormorant Garamond'), serif",
            fontStyle: "italic",
            fontSize: "clamp(1.3rem, 2.2vw, 1.7rem)",
            fontWeight: 400,
            color: "rgba(232, 201, 106, 0.95)",
            margin: "0 0 2rem",
            maxWidth: "540px",
            lineHeight: 1.35,
            position: "relative",
            paddingLeft: "1.5rem",
            borderLeft: "1px solid rgba(232, 201, 106, 0.35)",
          }}
        >
          {data.motto}
        </p>

        <Rule tone="gold" style={{ margin: "2rem 0", maxWidth: "540px" }} />

        {/* Facts as a prose-style flow, not a grid */}
        <dl
          style={{
            display: "grid",
            gridTemplateColumns: "max-content 1fr",
            columnGap: "1.25rem",
            rowGap: "0.55rem",
            margin: 0,
            maxWidth: "520px",
          }}
        >
          {facts.map(({ l, v }) => (
            <React.Fragment key={l}>
              <dt
                style={{
                  fontFamily: "var(--font-body, system-ui), sans-serif",
                  fontSize: "0.66rem", fontWeight: 500,
                  letterSpacing: "0.22em", textTransform: "uppercase",
                  color: "rgba(180, 170, 210, 0.55)",
                  alignSelf: "baseline",
                  paddingTop: "0.35rem",
                }}
              >
                {l}
              </dt>
              <dd
                style={{
                  margin: 0,
                  fontFamily: "var(--font-heading, 'Cormorant Garamond'), serif",
                  fontStyle: "italic",
                  fontSize: "1.15rem", fontWeight: 400,
                  color: "rgba(240, 232, 220, 0.92)",
                  paddingBottom: "0.55rem",
                  borderBottom: "1px solid rgba(200, 185, 255, 0.08)",
                }}
              >
                {v}
              </dd>
            </React.Fragment>
          ))}
        </dl>

        {/* Share — surfaces ShareCardModal (square / story / twitter card) */}
        <div style={{ marginTop: "2rem" }}>
          <ShareSignButton
            signName={data.name}
            signGlyph={data.glyph}
            element={data.element}
            elementEmoji={ELEMENT_EMOJI[data.element] || "✦"}
            dateRange={data.dateRange}
            traits={data.lightTraits.slice(0, 4)}
            horoscope={data.description}
            luckyColor={data.crystal}
            luckyColorHex={ELEMENT_COLOR[data.element] || "#D4AF37"}
          />
        </div>
      </header>

      {/* Description */}
      <Section title="Overview">
        <p style={{
          fontFamily: "var(--font-body)", fontSize: "0.9rem", fontWeight: 300,
          lineHeight: 1.8, color: "rgba(196,185,228,0.75)",
        }}>{data.description}</p>
      </Section>

      <Section title={`${data.element} Element`}>
        <p style={{
          fontFamily: "var(--font-body)", fontSize: "0.88rem", fontWeight: 300,
          lineHeight: 1.8, color: "rgba(196,185,228,0.72)",
        }}>{data.elementAnalysis}</p>
      </Section>

      <Section title={`Ruling Planet: ${data.ruler} ${data.rulerGlyph}`}>
        <p style={{
          fontFamily: "var(--font-body)", fontSize: "0.88rem", fontWeight: 300,
          lineHeight: 1.8, color: "rgba(196,185,228,0.72)",
        }}>{data.rulerDeepDive}</p>
      </Section>

      {/* Light & Shadow */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "3rem" }}>
        <Surface variant="solid" raised>
          <Eyebrow tone="muted" style={{ marginBottom: "1rem", color: "rgba(78,205,196,0.7)" }}>Light Traits</Eyebrow>
          {data.lightTraits.map((t, i) => (
            <p key={i} style={{
              fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300,
              color: "rgba(210,210,240,0.85)", lineHeight: 1.7,
              padding: "0.25rem 0 0.25rem 1rem", position: "relative",
              margin: 0,
            }}>
              <span style={{ position: "absolute", left: 0, color: "rgba(78,205,196,0.6)", fontSize: "0.55rem", top: "0.3em" }}>✦</span>
              {t}
            </p>
          ))}
        </Surface>
        <Surface variant="solid" raised>
          <Eyebrow tone="muted" style={{ marginBottom: "1rem", color: "rgba(232,82,74,0.7)" }}>Shadow Traits</Eyebrow>
          {data.shadowTraits.map((t, i) => (
            <p key={i} style={{
              fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300,
              color: "rgba(210,210,240,0.8)", lineHeight: 1.7,
              padding: "0.25rem 0 0.25rem 1rem", position: "relative",
              margin: 0,
            }}>
              <span style={{ position: "absolute", left: 0, color: "rgba(232,82,74,0.5)", fontSize: "0.55rem", top: "0.3em" }}>✦</span>
              {t}
            </p>
          ))}
        </Surface>
      </div>

      <Section title="Best Careers">
        <TagList items={data.bestCareers} />
      </Section>

      <Section title="Compatibility">
        <div style={{ ...label, marginBottom: "0.4rem", color: "rgba(78,205,196,0.5)" }}>Best Matches</div>
        <TagList items={data.compatBest} color="rgba(78,205,196,0.1)" />
        <div style={{ ...label, marginTop: "0.75rem", marginBottom: "0.4rem", color: "rgba(232,82,74,0.4)" }}>Growth Pairings</div>
        <TagList items={data.compatChallenge} color="rgba(232,82,74,0.08)" />
      </Section>

      <Section title={`Famous ${data.name} People`}>
        <TagList items={data.famousPeople} color="rgba(212,175,55,0.1)" />
      </Section>

      {/* CTAs */}
      <div style={{ textAlign: "center", marginTop: "2rem", display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
        <a href="/portrait" style={{
          padding: "0.75rem 2rem", borderRadius: "100px",
          background: "linear-gradient(135deg, rgba(160,120,255,0.2), rgba(100,80,220,0.15))",
          border: "1px solid rgba(200,180,255,0.2)",
          color: "rgba(240,235,255,0.9)", fontSize: "0.78rem", fontWeight: 500,
          letterSpacing: "0.06em", textTransform: "uppercase", textDecoration: "none",
        }}>Get Your {data.name} Portrait</a>
        <a href="/daily" style={{
          padding: "0.75rem 2rem", borderRadius: "100px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(200,185,255,0.1)",
          color: "rgba(200,185,240,0.7)", fontSize: "0.78rem", fontWeight: 400,
          letterSpacing: "0.06em", textTransform: "uppercase", textDecoration: "none",
        }}>Daily {data.name} Reading</a>
      </div>
    </div>
  );
}
