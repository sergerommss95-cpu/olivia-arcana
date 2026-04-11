"use client"

export default function OracleStaticFallback() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "1.5rem",
        width: "100%",
        maxWidth: 600,
      }}
    >
      {[
        { src: "/liquid-mask/base.png", label: "Your Marble Self" },
        { src: "/liquid-mask/reveal.png", label: "Your Cosmic Self" },
      ].map(({ src, label }) => (
        <div key={label} style={{ textAlign: "center" }}>
          <div
            style={{
              borderRadius: "var(--radius-card, 1.25rem)",
              overflow: "hidden",
              border: "1px solid var(--c-border, rgba(255,255,255,0.08))",
              background: "var(--glass-bg, rgba(255,255,255,0.05))",
            }}
          >
            <img
              src={src}
              alt={label}
              style={{
                width: "100%",
                height: "auto",
                display: "block",
              }}
            />
          </div>
          <p
            style={{
              marginTop: "0.75rem",
              fontFamily: "var(--font-accent, 'Cormorant Garamond', serif)",
              fontSize: "0.85rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase" as const,
              color: "var(--c-text-muted, rgba(155,145,190,0.6))",
            }}
          >
            {label}
          </p>
        </div>
      ))}
    </div>
  )
}
