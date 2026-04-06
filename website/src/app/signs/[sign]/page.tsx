/**
 * /signs/[sign] — Individual zodiac sign detail page
 * Rich SEO content per sign.
 */

import { notFound } from "next/navigation";
import { SIGN_PAGES, type SignPage } from "../../../lib/sign-data";

// Generate static params for all 12 signs
export function generateStaticParams() {
  return Object.keys(SIGN_PAGES).map(sign => ({ sign }));
}

export function generateMetadata({ params }: { params: { sign: string } }) {
  const data = SIGN_PAGES[params.sign?.toLowerCase()];
  if (!data) return {};
  return {
    title: `${data.name} ${data.glyph} — Zodiac Sign Guide | Olivia Arcana`,
    description: data.description.slice(0, 155) + "...",
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <h2 style={{
        fontFamily: "var(--font-heading)", fontSize: "1.2rem", fontWeight: 400,
        color: "rgba(240,236,255,0.9)", marginBottom: "0.75rem",
      }}>{title}</h2>
      {children}
    </div>
  );
}

function TagList({ items, color = "rgba(200,185,255,0.15)" }: { items: string[]; color?: string }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
      {items.map(item => (
        <span key={item} style={{
          padding: "0.3rem 0.75rem", borderRadius: "100px",
          background: color, border: "1px solid rgba(200,185,255,0.1)",
          fontFamily: "var(--font-body)", fontSize: "0.72rem", fontWeight: 400,
          color: "rgba(200,190,235,0.75)",
        }}>{item}</span>
      ))}
    </div>
  );
}

export default function SignDetailPage({ params }: { params: { sign: string } }) {
  const data = SIGN_PAGES[params.sign?.toLowerCase()];
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

  return (
    <div style={{
      minHeight: "100vh", position: "relative", zIndex: 1,
      maxWidth: "750px", margin: "0 auto", padding: "2rem 1.5rem 4rem",
    }}>
      {/* Header */}
      <div style={{ marginBottom: "2.5rem" }}>
        <a href="/" style={{
          fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 400,
          letterSpacing: "0.15em", textTransform: "uppercase",
          color: "rgba(180,170,210,0.4)", textDecoration: "none",
        }}>← Home</a>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <div style={{
            fontSize: "4rem", lineHeight: 1, marginBottom: "0.75rem",
            textShadow: "0 0 40px rgba(200,180,255,0.2)",
          }}>{data.glyph}</div>
          <h1 style={{
            fontFamily: "var(--font-accent)", fontSize: "2.5rem", fontWeight: 400,
            letterSpacing: "0.12em", color: "rgba(240,236,255,0.92)",
            textTransform: "uppercase", margin: "0 0 0.3rem",
          }}>{data.name}</h1>
          <p style={label}>{data.dateRange}</p>
          <p style={{
            fontFamily: "var(--font-accent)", fontSize: "1.1rem", fontWeight: 400,
            fontStyle: "italic", color: "rgba(212,175,55,0.6)", marginTop: "0.5rem",
          }}>&ldquo;{data.motto}&rdquo;</p>
        </div>

        {/* Quick stats */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: "0.5rem", marginTop: "1.5rem",
        }}>
          {[
            { l: "Element", v: data.element },
            { l: "Modality", v: data.modality },
            { l: "Ruler", v: `${data.rulerGlyph} ${data.ruler}` },
            { l: "Season", v: data.season },
            { l: "Tarot Card", v: data.tarotCard },
            { l: "Crystal", v: data.crystal },
          ].map(({ l, v }) => (
            <div key={l} style={glass}>
              <div style={label}>{l}</div>
              <div style={{
                fontFamily: "var(--font-accent)", fontSize: "0.9rem", fontWeight: 500,
                color: "rgba(230,220,255,0.85)", marginTop: "0.2rem",
              }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="star-divider" style={{ marginBottom: "2rem" }}>&#10022;</div>

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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
        <div style={glass}>
          <div style={{ ...label, marginBottom: "0.5rem", color: "rgba(78,205,196,0.5)" }}>Light Traits</div>
          {data.lightTraits.map((t, i) => (
            <p key={i} style={{
              fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 300,
              color: "rgba(196,185,228,0.7)", lineHeight: 1.6,
              padding: "0.2rem 0 0.2rem 0.8rem", position: "relative",
            }}>
              <span style={{ position: "absolute", left: 0, color: "rgba(78,205,196,0.4)", fontSize: "0.5rem", top: "0.3em" }}>▸</span>
              {t}
            </p>
          ))}
        </div>
        <div style={glass}>
          <div style={{ ...label, marginBottom: "0.5rem", color: "rgba(232,82,74,0.5)" }}>Shadow Traits</div>
          {data.shadowTraits.map((t, i) => (
            <p key={i} style={{
              fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 300,
              color: "rgba(196,185,228,0.7)", lineHeight: 1.6,
              padding: "0.2rem 0 0.2rem 0.8rem", position: "relative",
            }}>
              <span style={{ position: "absolute", left: 0, color: "rgba(232,82,74,0.4)", fontSize: "0.5rem", top: "0.3em" }}>▸</span>
              {t}
            </p>
          ))}
        </div>
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
