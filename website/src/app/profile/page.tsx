"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { getUser, getSession, signOut } from "../../lib/supabase";
import type { User } from "@supabase/supabase-js";

// DeckStats reads localStorage so client-only render avoids SSR mismatch.
const DeckStats = dynamic(() => import("../../components/DeckStats"), { ssr: false });

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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    (async () => {
      const session = await getSession();
      if (!session) {
        setTimeout(() => {
          setSignedOut(true);
          setLoading(false);
        }, 0);
        return;
      }
      const u = await getUser();
      setTimeout(() => {
        setUser(u);
        setLoading(false);
      }, 0);
    })();
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "rgba(180,170,210,0.4)" }}>Loading your cosmic profile...</p>
    </div>
  );

  if (signedOut) return (
    <div style={{ minHeight: "100vh", position: "relative", zIndex: 1, padding: "2rem 1.5rem 4rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ maxWidth: "440px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", color: "rgba(232,201,106,0.55)", marginBottom: "1rem" }}>✦</div>
        <h1 style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "clamp(1.6rem, 5vw, 2.4rem)", fontWeight: 400, color: "rgba(245,240,232,0.96)", margin: 0 }}>
          Your profile lives here
        </h1>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "0.92rem", fontWeight: 300, color: "rgba(220,212,240,0.72)", marginTop: "1rem", lineHeight: 1.6 }}>
          Sign in to see your sun sign, draw history, daily streak, and the readings Olivia has written for you.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "1.75rem", flexWrap: "wrap" }}>
          <Link href="/login" style={{
            display: "inline-block", padding: "0.75rem 1.75rem", borderRadius: "100px",
            background: "linear-gradient(135deg, #E8C96A, #D4AF37)",
            color: "var(--c-void, #06041a)", fontSize: "0.78rem", fontWeight: 600,
            letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none",
          }}>Sign in</Link>
          <Link href="/register" style={{
            display: "inline-block", padding: "0.75rem 1.75rem", borderRadius: "100px",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(200,185,255,0.12)",
            color: "rgba(220,210,240,0.85)", fontSize: "0.78rem", fontWeight: 500,
            letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none",
          }}>Create account</Link>
        </div>
        <Link href="/" style={{
          display: "inline-block", marginTop: "1.5rem",
          fontFamily: "var(--font-body)", fontSize: "0.7rem", color: "rgba(180,170,210,0.5)",
          textDecoration: "none", letterSpacing: "0.16em", textTransform: "uppercase",
        }}>&larr; Back home</Link>
      </div>
    </div>
  );

  if (!user) return null;

  const name = user.user_metadata?.name || user.user_metadata?.full_name || "";
  const email = user.email || "";
  const avatar = user.user_metadata?.avatar_url || "";

  return (
    <div style={{ minHeight: "100vh", position: "relative", zIndex: 1, padding: "2rem 1.5rem 4rem" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link href="/" style={{ ...labelSt, textDecoration: "none", color: "rgba(180,170,210,0.4)" }}>&larr; Home</Link>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 400, marginTop: "0.75rem" }}>
            <span className="text-gold-gradient">{name ? `${name}'s Profile` : "Your Profile"}</span>
          </h1>
        </div>

        {/* User card */}
        <div style={{ ...glass, padding: "2rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
            {avatar ? (
              <Image src={avatar} alt="" width={56} height={56} style={{ borderRadius: "50%", border: "2px solid rgba(200,180,255,0.15)" }} />
            ) : (
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(160,120,255,0.2), rgba(100,80,220,0.15))",
                border: "2px solid rgba(200,180,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-accent)", fontSize: "1.5rem", color: "rgba(240,236,255,0.9)",
              }}>
                {(name || email)[0]?.toUpperCase() || "✦"}
              </div>
            )}
            <div>
              <div style={{ fontFamily: "var(--font-accent)", fontSize: "1.2rem", fontWeight: 500, color: "rgba(240,236,255,0.9)" }}>
                {name || "Cosmic Traveler"}
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "rgba(180,170,210,0.45)" }}>{email}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "0.6rem", color: "rgba(78,205,196,0.5)", marginTop: "0.15rem" }}>
                {user.app_metadata?.provider === "google" ? "Signed in with Google" : "Email account"}
              </div>
            </div>
          </div>

          {/* Get started CTA */}
          <div style={labelSt}>Your Cosmic Journey</div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 300, color: "rgba(196,185,228,0.6)", margin: "0.4rem 0 0.75rem", lineHeight: 1.6 }}>
            Generate your celestial portrait to unlock personalized readings.
          </p>
          <Link href="/portrait" style={{
            display: "inline-block", padding: "0.6rem 1.5rem", borderRadius: "100px",
            background: "linear-gradient(135deg, rgba(160,120,255,0.2), rgba(100,80,220,0.15))",
            border: "1px solid rgba(200,180,255,0.2)",
            color: "rgba(240,235,255,0.9)", fontSize: "0.76rem", fontWeight: 500,
            letterSpacing: "0.06em", textTransform: "uppercase", textDecoration: "none",
          }}>Generate Your Portrait</Link>
        </div>

        {/* Quick links */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {[
            { href: "/portrait", label: "Celestial Portrait", icon: "✦" },
            { href: "/chart", label: "Birth Chart", icon: "◎" },
            { href: "/daily", label: "Daily Reading", icon: "☉" },
            { href: "/cosmos", label: "Living Cosmos", icon: "◈" },
          ].map(({ href, label, icon }) => (
            <Link key={href} href={href} style={{ ...glass, padding: "1.25rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ fontSize: "1.2rem", color: "rgba(212,175,55,0.5)" }}>{icon}</span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", fontWeight: 400, color: "rgba(220,210,240,0.75)" }}>{label}</span>
            </Link>
          ))}
        </div>

        {/* Living deck — most-drawn cards + draw history */}
        <div style={{ marginBottom: "1.5rem" }}>
          <DeckStats />
        </div>

        {/* Sign out */}
        <div style={{ textAlign: "center" }}>
          <button onClick={async () => { await signOut(); window.location.href = "/"; }} style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "var(--font-body)", fontSize: "0.68rem",
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: "rgba(232,82,74,0.5)",
          }}>Sign Out</button>
        </div>
      </div>
    </div>
  );
}
