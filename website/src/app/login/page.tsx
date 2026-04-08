"use client";

import React, { useState } from "react";
import { login } from "../../lib/api";

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
  outline: "none", transition: "border-color 0.3s",
};
const labelSt: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 500,
  letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(180,170,210,0.4)",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      window.location.href = "/profile";
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1, padding: "2rem 1.5rem" }}>
      <form onSubmit={handleSubmit} style={{ ...glass, padding: "2.5rem 2rem", width: "100%", maxWidth: "380px", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.5rem", color: "rgba(212,175,55,0.5)", marginBottom: "0.5rem" }}>✦</div>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.5rem", fontWeight: 400, margin: 0 }}>
            <span className="text-gold-gradient">Welcome Back</span>
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", fontWeight: 300, color: "rgba(196,185,228,0.5)", marginTop: "0.3rem" }}>
            Sign in to your cosmic account
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <span style={labelSt}>Email</span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={inputSt} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <span style={labelSt}>Password</span>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" required style={inputSt} />
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
        }}>{loading ? "Signing in..." : "Sign In"}</button>

        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "rgba(180,170,210,0.4)", textAlign: "center", margin: 0 }}>
          Don&apos;t have an account? <a href="/register" style={{ color: "rgba(212,175,55,0.6)", textDecoration: "none" }}>Create one</a>
        </p>
      </form>
    </div>
  );
}
