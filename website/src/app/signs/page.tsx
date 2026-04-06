/**
 * /signs — Zodiac sign index page
 * Grid of all 12 signs linking to their detail pages.
 */

import Link from "next/link";
import { SIGN_PAGES } from "../../lib/sign-data";

export const metadata = {
  title: "All 12 Zodiac Signs — Complete Guide | Olivia Arcana",
  description: "Explore all 12 zodiac signs with detailed personality profiles, compatibility, career guidance, and more. Aries through Pisces — your complete astrological reference.",
};

const ELEMENT_COLORS: Record<string, string> = {
  Fire: "rgba(255,107,53,0.15)", Earth: "rgba(124,179,66,0.12)",
  Air: "rgba(200,200,220,0.1)", Water: "rgba(79,195,247,0.12)",
};

export default function SignsIndex() {
  const signs = Object.values(SIGN_PAGES);

  return (
    <div style={{
      minHeight: "100vh", position: "relative", zIndex: 1,
      maxWidth: "900px", margin: "0 auto", padding: "2rem 1.5rem 4rem",
    }}>
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <Link href="/" style={{
          fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 400,
          letterSpacing: "0.15em", textTransform: "uppercase",
          color: "rgba(180,170,210,0.4)", textDecoration: "none",
        }}>← Home</Link>
        <h1 style={{
          fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
          fontWeight: 400, marginTop: "0.75rem",
        }}>
          <span className="text-gold-gradient">The 12 Zodiac Signs</span>
        </h1>
        <p style={{
          fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300,
          color: "rgba(196,185,228,0.5)", marginTop: "0.4rem",
        }}>Your complete astrological reference</p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "0.75rem",
      }}>
        {signs.map(sign => (
          <Link
            key={sign.name}
            href={`/signs/${sign.name.toLowerCase()}`}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: "0.5rem", padding: "1.5rem 1rem",
              background: ELEMENT_COLORS[sign.element] || "rgba(255,255,255,0.03)",
              border: "1px solid rgba(200,185,255,0.06)",
              borderRadius: "1rem",
              textDecoration: "none",
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <span style={{ fontSize: "2rem" }}>{sign.glyph}</span>
            <span style={{
              fontFamily: "var(--font-accent)", fontSize: "1rem", fontWeight: 500,
              color: "rgba(240,236,255,0.88)", letterSpacing: "0.06em",
            }}>{sign.name}</span>
            <span style={{
              fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 400,
              color: "rgba(180,170,210,0.45)", letterSpacing: "0.04em",
            }}>{sign.dateRange}</span>
            <span style={{
              fontFamily: "var(--font-body)", fontSize: "0.55rem", fontWeight: 500,
              letterSpacing: "0.12em", textTransform: "uppercase",
              color: "rgba(180,170,210,0.3)",
            }}>{sign.element} &middot; {sign.modality}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
