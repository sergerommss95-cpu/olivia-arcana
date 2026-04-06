/**
 * 404 — Lost in the Cosmos
 */

import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "3rem 1.5rem",
      textAlign: "center",
      background: "#04020d",
    }}>
      <div style={{
        fontSize: "4rem",
        color: "rgba(212,175,55,0.3)",
        textShadow: "0 0 60px rgba(212,175,55,0.15)",
        marginBottom: "1.5rem",
      }}>✦</div>

      <h1 style={{
        fontFamily: "var(--font-heading)",
        fontSize: "clamp(2rem, 6vw, 4rem)",
        fontWeight: 400,
        backgroundImage: "linear-gradient(165deg, #f0ecff 0%, #c4b4f0 50%, #a08de0 100%)",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
        margin: "0 0 0.75rem",
      }}>Lost in the Cosmos</h1>

      <p style={{
        fontFamily: "var(--font-body)",
        fontSize: "1rem",
        fontWeight: 300,
        color: "rgba(196,185,228,0.6)",
        maxWidth: "400px",
        lineHeight: 1.7,
        marginBottom: "2rem",
      }}>
        The stars couldn&apos;t find this page. Perhaps it exists in another dimension.
      </p>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/" style={{
          padding: "0.75rem 2rem",
          borderRadius: "100px",
          background: "linear-gradient(135deg, rgba(160,120,255,0.2), rgba(100,80,220,0.15))",
          border: "1px solid rgba(200,180,255,0.2)",
          color: "rgba(240,235,255,0.9)",
          fontSize: "0.82rem",
          fontWeight: 500,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          textDecoration: "none",
        }}>Return Home</Link>
        <Link href="/portrait" style={{
          padding: "0.75rem 2rem",
          borderRadius: "100px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(200,185,255,0.1)",
          color: "rgba(200,185,240,0.7)",
          fontSize: "0.82rem",
          fontWeight: 400,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          textDecoration: "none",
        }}>Celestial Portrait</Link>
      </div>
    </div>
  );
}
