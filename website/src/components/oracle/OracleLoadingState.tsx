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
        background: "var(--c-void, #10134d)",
        borderRadius: "inherit",
        zIndex: 2,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontSize: "2.5rem",
          color: "var(--color-celestial-gold, #e0b768)",
          textShadow: "0 0 40px rgba(224,183,104,0.4)",
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
          color: "rgba(183,188,233,0.7)",
          textAlign: "center",
        }}
      >
        Calibrating the stars…
      </p>
      <div style={{
        marginTop: "2rem",
        width: "60px",
        height: "1px",
        background: "linear-gradient(to right, transparent, rgba(224,183,104,0.3), transparent)"
      }} />
    </div>
  )
}
