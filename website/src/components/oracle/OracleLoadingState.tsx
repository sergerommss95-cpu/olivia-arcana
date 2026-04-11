"use client"

export default function OracleLoadingState() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--c-void, #04020d)",
        borderRadius: "inherit",
        zIndex: 2,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontSize: "2rem",
          color: "var(--color-celestial-gold, #D4AF37)",
          animation: "float 3s ease-in-out infinite",
          marginBottom: "1rem",
        }}
      >
        ✦
      </div>
      <p
        style={{
          fontFamily: "var(--font-accent, 'Cormorant Garamond', serif)",
          fontSize: "0.8rem",
          letterSpacing: "0.35em",
          textTransform: "uppercase" as const,
          color: "var(--c-text-muted, rgba(155,145,190,0.6))",
        }}
      >
        Summoning the Oracle…
      </p>
    </div>
  )
}
