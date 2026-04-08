"use client";

import React, { useState, useEffect } from "react";
import { getMe, logout, isLoggedIn, type AuthUser } from "../../lib/api";

const glass: React.CSSProperties = {
  background: "rgba(8,6,20,0.45)", backdropFilter: "blur(20px) saturate(1.2)",
  WebkitBackdropFilter: "blur(20px) saturate(1.2)",
  border: "1px solid rgba(200,185,255,0.08)", borderRadius: "1.25rem",
  boxShadow: "0 8px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
};
const labelSt: React.CSSProperties = {
  fontFamily: "var(--font-body)", fontSize: "0.6rem", fontWeight: 500,
  letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(180,170,210,0.4)",
};

export default function ProfilePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) {
      window.location.href = "/login";
      return;
    }
    getMe()
      .then(setUser)
      .catch(() => { setError("Session expired"); logout(); window.location.href = "/login"; })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "rgba(180,170,210,0.4)" }}>Loading your cosmic profile...</p>
    </div>
  );

  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", position: "relative", zIndex: 1, padding: "2rem 1.5rem 4rem" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <a href="/" style={{ ...labelSt, textDecoration: "none", color: "rgba(180,170,210,0.4)" }}>← Home</a>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 400, marginTop: "0.75rem" }}>
            <span className="text-gold-gradient">{user.name ? `${user.name}'s Profile` : "Your Profile"}</span>
          </h1>
        </div>

        {/* User info card */}
        <div style={{ ...glass, padding: "2rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(160,120,255,0.2), rgba(100,80,220,0.15))",
              border: "2px solid rgba(200,180,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-accent)", fontSize: "1.5rem",
              color: "rgba(240,236,255,0.9)",
            }}>
              {(user.name || user.email)[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-accent)", fontSize: "1.2rem", fontWeight: 500, color: "rgba(240,236,255,0.9)" }}>
                {user.name || "Cosmic Traveler"}
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "rgba(180,170,210,0.45)" }}>{user.email}</div>
            </div>
          </div>

          {/* Chart info */}
          {user.sun_sign ? (
            <div>
              <div style={labelSt}>Your Chart</div>
              <div style={{
                fontFamily: "var(--font-accent)", fontSize: "1.1rem", fontWeight: 400,
                color: "rgba(240,236,255,0.85)", marginTop: "0.4rem",
              }}>
                Sun in {user.sun_sign}, Moon in {user.moon_sign}, {user.rising_sign} Rising
              </div>
              {user.birth_city && (
                <div style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "rgba(180,170,210,0.4)", marginTop: "0.2rem" }}>
                  Born in {user.birth_city} · {user.birth_day}/{user.birth_month}/{user.birth_year}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div style={labelSt}>No birth data yet</div>
              <a href="/portrait" style={{
                display: "inline-block", marginTop: "0.5rem",
                padding: "0.5rem 1.2rem", borderRadius: "100px",
                background: "rgba(160,120,255,0.12)", border: "1px solid rgba(200,180,255,0.15)",
                color: "rgba(240,235,255,0.85)", fontSize: "0.72rem", fontWeight: 500,
                letterSpacing: "0.06em", textTransform: "uppercase", textDecoration: "none",
              }}>Generate Your Portrait</a>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {[
            { href: "/portrait", label: "Celestial Portrait", icon: "✦" },
            { href: "/chart", label: "Birth Chart", icon: "◎" },
            { href: "/daily", label: "Daily Reading", icon: "☉" },
            { href: "/cosmos", label: "Living Cosmos", icon: "◈" },
          ].map(({ href, label, icon }) => (
            <a key={href} href={href} style={{
              ...glass, padding: "1.25rem", textDecoration: "none",
              display: "flex", alignItems: "center", gap: "0.6rem",
              transition: "border-color 0.3s",
            }}>
              <span style={{ fontSize: "1.2rem", color: "rgba(212,175,55,0.5)" }}>{icon}</span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 400, color: "rgba(220,210,240,0.75)" }}>{label}</span>
            </a>
          ))}
        </div>

        {/* Logout */}
        <div style={{ textAlign: "center" }}>
          <button onClick={() => { logout(); window.location.href = "/"; }} style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "var(--font-body)", fontSize: "0.68rem", fontWeight: 400,
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: "rgba(232,82,74,0.5)", transition: "color 0.2s",
          }}>Sign Out</button>
        </div>
      </div>
    </div>
  );
}
