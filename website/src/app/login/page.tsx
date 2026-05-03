"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signInWithGoogle } from "../../lib/supabase";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const glass: React.CSSProperties = {
  background: "rgba(8,6,20,0.45)", backdropFilter: "blur(8px) ",
  WebkitBackdropFilter: "blur(8px) ",
  border: "1px solid rgba(200,185,255,0.08)", borderRadius: "1.5rem",
  boxShadow: "0 8px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
};

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setError(""); setLoading(true);
    try { await signInWithGoogle(); }
    catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1, padding: "2rem 1.5rem" }}>
      <div style={{ ...glass, padding: "2.75rem 2rem", width: "100%", maxWidth: "380px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.5rem", color: "rgba(212,175,55,0.5)", marginBottom: "0.5rem" }}>✦</div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.6rem", fontWeight: 400, margin: 0 }}>
            <span className="text-gold-gradient">Welcome Back</span>
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300, color: "rgba(196,185,228,0.55)", marginTop: "0.4rem", lineHeight: 1.5 }}>
            Your stars are waiting.
          </p>
        </div>

        <button onClick={handleGoogle} disabled={loading} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.7rem",
          padding: "0.95rem", borderRadius: "0.85rem",
          background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
          color: "rgba(240,236,255,0.95)", fontSize: "0.92rem", fontWeight: 500,
          cursor: loading ? "wait" : "pointer", opacity: loading ? 0.5 : 1,
          transition: `all 0.3s ${EASE}`, fontFamily: "var(--font-body)",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {loading ? "Connecting…" : "Continue with Google"}
        </button>

        {error && <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "rgba(232,82,74,0.85)", margin: 0, textAlign: "center" }}>{error}</p>}

        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.7rem", color: "rgba(180,170,210,0.45)", textAlign: "center", margin: 0, lineHeight: 1.6 }}>
          Sign in or create account in one tap.<br />
          By continuing you agree to our <Link href="/terms" style={{ color: "rgba(212,175,55,0.65)", textDecoration: "none" }}>Terms</Link> and <Link href="/privacy" style={{ color: "rgba(212,175,55,0.65)", textDecoration: "none" }}>Privacy</Link>.
        </p>
      </div>
    </div>
  );
}
