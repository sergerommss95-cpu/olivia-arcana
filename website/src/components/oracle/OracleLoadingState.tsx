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
        background: "var(--c-void, #06041a)",
        borderRadius: "inherit",
        zIndex: 2,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontSize: "2.5rem",
          color: "var(--color-celestial-gold, #D4AF37)",
          textShadow: "0 0 40px rgba(212,175,55,0.4)",
          animation: "float 3s ease-in-out infinite",
          marginBottom: "1.5rem",
        }}
      >
        ✦
      </div>
      <p
        style={{
          fontFamily: "var(--font-accent, 'Cormorant Garamond', serif)",
          fontSize: "0.75rem",
          letterSpacing: "0.45em",
          textTransform: "uppercase" as const,
          color: "rgba(196,185,228,0.35)",
          textAlign: "center",
        }}
      >
        Calibrating the stars…
      </p>
      <div style={{
        marginTop: "2rem",
        width: "60px",
        height: "1px",
        background: "linear-gradient(to right, transparent, rgba(212,175,55,0.3), transparent)"
      }} />
    </div>
  )
}
