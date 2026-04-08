"use client";

import React, { useState } from "react";
import { signUpWithEmail, signInWithGoogle } from "../../lib/supabase";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const glass: React.CSSProperties = {
  background: "rgba(8,6,20,0.45)", backdropFilter: "blur(20px) saturate(1.2)",
  WebkitBackdropFilter: "blur(20px) saturate(1.2)",
  border: "1px solid rgba(200,185,255,0.08)", borderRadius: "1.5rem",
  boxShadow: "0 8px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
};
const inputSt: React.CSSProperties = {
  width: "100%", padding: "0.7rem 1rem",
  fontFamily: "var(--font-body)", fontSize: "0.9rem",
  color: "rgba(240,236,255,0.9)", background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(200,185,255,0.12)", borderRadius: "0.75rem",
  outline: "none",
};
const labelSt: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 500,
  letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(180,170,210,0.4)",
};

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(""); setLoading(true);
    try {
      await signUpWithEmail(email, password, name || undefined);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError("");
    try { await signInWithGoogle(); } catch (err: any) { setError(err.message); }
  };

  if (success) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1, padding: "2rem" }}>
      <div style={{ ...glass, padding: "2.5rem 2rem", maxWidth: "380px", textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>✦</div>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.3rem", fontWeight: 400 }}>
          <span className="text-gold-gradient">Check Your Email</span>
        </h2>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300, color: "rgba(196,185,228,0.6)", marginTop: "0.5rem", lineHeight: 1.6 }}>
          We sent a confirmation link to <strong style={{ color: "rgba(240,236,255,0.8)" }}>{email}</strong>. Click it to activate your account.
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1, padding: "2rem 1.5rem" }}>
      <div style={{ ...glass, padding: "2.5rem 2rem", width: "100%", maxWidth: "380px", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.5rem", color: "rgba(212,175,55,0.5)", marginBottom: "0.5rem" }}>✦</div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 400, margin: 0 }}>
            <span className="text-gold-gradient">Create Account</span>
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 300, color: "rgba(196,185,228,0.5)", marginTop: "0.3rem" }}>
            Save your chart and get daily readings
          </p>
        </div>

        {/* Google sign-in */}
        <button onClick={handleGoogle} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem",
          padding: "0.75rem", borderRadius: "0.75rem",
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(240,236,255,0.9)", fontSize: "0.85rem", fontWeight: 500,
          cursor: "pointer", transition: `all 0.3s ${EASE}`,
          fontFamily: "var(--font-body)",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(200,185,255,0.06)" }} />
          <span style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", color: "rgba(180,170,210,0.3)", letterSpacing: "0.1em" }}>OR</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(200,185,255,0.06)" }} />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmail} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <span style={labelSt}>Name (optional)</span>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inputSt} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <span style={labelSt}>Email *</span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={inputSt} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <span style={labelSt}>Password *</span>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} style={inputSt} />
          </div>

          {error && <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "rgba(232,82,74,0.8)", margin: 0, textAlign: "center" }}>{error}</p>}

          <button type="submit" disabled={loading} style={{
            padding: "0.75rem", borderRadius: "100px",
            background: "linear-gradient(135deg, rgba(160,120,255,0.22), rgba(100,80,220,0.18))",
            border: "1px solid rgba(200,180,255,0.22)",
            color: "rgba(240,235,255,0.95)", fontSize: "0.82rem", fontWeight: 500,
            letterSpacing: "0.06em", textTransform: "uppercase",
            cursor: loading ? "wait" : "pointer", opacity: loading ? 0.5 : 1,
            transition: `all 0.3s ${EASE}`,
          }}>{loading ? "Creating..." : "Create Account"}</button>
        </form>

        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "rgba(180,170,210,0.4)", textAlign: "center", margin: 0 }}>
          Already have an account? <a href="/login" style={{ color: "rgba(212,175,55,0.6)", textDecoration: "none" }}>Sign in</a>
        </p>
      </div>
    </div>
  );
}
