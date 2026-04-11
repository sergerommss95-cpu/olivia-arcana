"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import OracleLoadingState from "@/components/oracle/OracleLoadingState"

const LiquidMaskCanvas = dynamic(
  () => import("@/components/oracle/LiquidMaskCanvas"),
  {
    ssr: false,
    loading: () => (
      <div style={{
        width: "min(600px, 100%)",
        aspectRatio: "1 / 1",
        position: "relative",
        borderRadius: "var(--radius-card, 1.25rem)",
        border: "1px solid var(--c-border, rgba(255,255,255,0.08))",
        background: "var(--c-void, #04020d)",
        overflow: "hidden",
      }}>
        <OracleLoadingState />
      </div>
    ),
  }
)

export default function OraclePage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* ─── Minimal glass nav ─── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          display: "flex",
          alignItems: "center",
          padding: "0 1.5rem",
          background: "var(--glass-bg, rgba(255,255,255,0.05))",
          backdropFilter: "var(--glass-blur, blur(18px) saturate(1.25))",
          WebkitBackdropFilter: "var(--glass-blur, blur(18px) saturate(1.25))",
          borderBottom: "1px solid var(--glass-border, rgba(255,255,255,0.06))",
          zIndex: 50,
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
            color: "var(--color-celestial-gold, #D4AF37)",
            fontFamily: "var(--font-heading, 'Playfair Display', serif)",
            fontSize: "1rem",
            fontWeight: 500,
          }}
        >
          <span style={{ fontSize: "0.85rem" }}>←</span>
          <span>Olivia Arcana</span>
        </Link>

        <span
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-accent, 'Cormorant Garamond', serif)",
            fontSize: "0.7rem",
            letterSpacing: "0.35em",
            textTransform: "uppercase" as const,
            color: "var(--c-text-muted, rgba(155,145,190,0.6))",
          }}
        >
          Oracle
        </span>
      </nav>

      {/* ─── Main content ─── */}
      <main
        id="main-content"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "calc(60px + 2rem)",
          paddingBottom: "3rem",
          paddingLeft: "1.5rem",
          paddingRight: "1.5rem",
          width: "100%",
          maxWidth: 700,
        }}
      >
        {/* Liquid mask canvas */}
        <LiquidMaskCanvas
          style={{
            width: "min(600px, 100%)",
            aspectRatio: "1 / 1",
          }}
        />

        {/* Below-canvas content */}
        <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
          <h1
            style={{
              fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
              fontSize: "clamp(1.8rem, 4vw, 3rem)",
              fontWeight: 400,
              lineHeight: 1.2,
              color: "var(--c-text-primary, rgba(240,236,255,0.95))",
              margin: 0,
            }}
          >
            Discover Your{" "}
            <span className="text-gold-gradient" style={{ fontWeight: 600 }}>
              Cosmic
            </span>{" "}
            Self
          </h1>

          <p
            style={{
              fontFamily: "var(--font-body, Inter, sans-serif)",
              fontSize: "0.95rem",
              fontWeight: 300,
              lineHeight: 1.6,
              color: "var(--c-text-mid, rgba(196,185,228,0.80))",
              maxWidth: 440,
              margin: "1rem auto 0",
            }}
          >
            Move your cursor to peel back the marble. Beneath the surface lies
            your true cosmic self — the one the stars have always known.
          </p>

          {/* CTA */}
          <Link
            href="/portrait"
            style={{
              display: "inline-block",
              marginTop: "1.8rem",
              padding: "0.9rem 2.4rem",
              borderRadius: "9999px",
              background: "linear-gradient(135deg, rgba(160,122,224,0.25), rgba(78,205,196,0.15))",
              border: "1px solid rgba(160,122,224,0.35)",
              backdropFilter: "blur(8px)",
              color: "var(--c-text-primary, rgba(240,236,255,0.95))",
              fontFamily: "var(--font-body, Inter, sans-serif)",
              fontSize: "0.8rem",
              fontWeight: 500,
              letterSpacing: "0.15em",
              textTransform: "uppercase" as const,
              textDecoration: "none",
              transition: "all 0.3s ease",
            }}
          >
            Begin Your Cosmic Portrait
          </Link>

          {/* Trust signal */}
          <p
            style={{
              marginTop: "1.2rem",
              fontSize: "0.7rem",
              letterSpacing: "0.12em",
              color: "var(--c-text-muted, rgba(155,145,190,0.6))",
              fontFamily: "var(--font-body, Inter, sans-serif)",
            }}
          >
            ✦ Powered by real NASA planetary data
          </p>
        </div>
      </main>
    </div>
  )
}
