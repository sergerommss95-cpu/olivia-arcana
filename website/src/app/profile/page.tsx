"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import { getUser, getSession, signOut } from "../../lib/supabase";
import type { User } from "@supabase/supabase-js";

// DeckStats reads localStorage so client-only render avoids SSR mismatch.
const DeckStats = dynamic(() => import("../../components/DeckStats"), { ssr: false });

const QUICK_LINKS = [
  { href: "/portrait", label: "Celestial Portrait", icon: "✦" },
  { href: "/chart", label: "Birth Chart", icon: "◎" },
  { href: "/daily", label: "Daily Reading", icon: "☉" },
  { href: "/cosmos", label: "Living Cosmos", icon: "◈" },
];

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

  const name = user?.user_metadata?.name || user?.user_metadata?.full_name || "";
  const email = user?.email || "";
  const avatar = user?.user_metadata?.avatar_url || "";

  return (
    <AlmanacShell narrow>
      <div className="profile">
        {loading ? (
          <p className="profile-wait">Loading your cosmic profile...</p>
        ) : signedOut ? (
          <div className="gate">
            <p className="gate-orn" aria-hidden>
              ✦
            </p>
            <h1 className="gate-title">Your profile lives here</h1>
            <p className="gate-body">
              Sign in to see your sun sign, draw history, daily streak, and the readings Olivia has written for you.
            </p>
            <div className="gate-actions">
              <Link href="/login" className="alm-btn">
                Sign in
              </Link>
              <Link href="/register" className="gate-alt">
                Create account
              </Link>
            </div>
            <div>
              <Link href="/" className="gate-back">
                &larr; Back home
              </Link>
            </div>
          </div>
        ) : user ? (
          <>
            <header className="profile-head">
              <Link href="/" className="profile-home">
                &larr; Home
              </Link>
              <p className="press-standing" style={{ margin: 0, fontFamily: "var(--font-mono, monospace)", fontSize: "0.58rem", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(232, 233, 255, 0.45)" }}>
                Your standing with the press
              </p>
              <h1 className="profile-title">{name ? `${name}'s Profile` : "Your Profile"}</h1>
            </header>

            {/* User card */}
            <section className="alm-card user-card">
              <div className="user-row">
                {avatar ? (
                  <Image src={avatar} alt="" width={56} height={56} className="user-avatar" />
                ) : (
                  <div className="user-initial">{(name || email)[0]?.toUpperCase() || "✦"}</div>
                )}
                <div>
                  <div className="user-name">{name || "Cosmic Traveler"}</div>
                  <div className="user-email">{email}</div>
                  <div className="user-provider">
                    {user.app_metadata?.provider === "google" ? "Signed in with Google" : "Email account"}
                  </div>
                </div>
              </div>

              {/* Get started CTA */}
              <p className="alm-caption">Your Cosmic Journey</p>
              <p className="user-cta-body">Generate your celestial portrait to unlock personalized readings.</p>
              <Link href="/portrait" className="alm-link">
                Generate Your Portrait →
              </Link>
            </section>

            {/* Quick links */}
            <div className="quick-grid">
              {QUICK_LINKS.map(({ href, label, icon }) => (
                <Link key={href} href={href} className="quick-card">
                  <span className="quick-icon" aria-hidden>
                    {icon}
                  </span>
                  <span className="quick-label">{label}</span>
                </Link>
              ))}
            </div>

            {/* Living deck — most-drawn cards + draw history */}
            <div className="deck-wrap">
              <DeckStats />
            </div>

            {/* Sign out */}
            <div className="profile-signout">
              <button
                type="button"
                className="signout-btn"
                onClick={async () => {
                  await signOut();
                  window.location.href = "/";
                }}
              >
                Sign Out
              </button>
            </div>
          </>
        ) : null}
      </div>

      <style jsx>{`
        .profile-wait {
          margin: 0;
          padding: 6rem 0;
          text-align: center;
          color: var(--ink-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.68rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        /* ── Signed-out gate ─────────────────────────────────── */
        .gate {
          padding: clamp(2rem, 6vw, 4rem) 0;
          text-align: center;
        }

        .gate-orn {
          margin: 0 0 0.8rem;
          color: var(--ox);
          font-size: 1.4rem;
        }

        .gate-title {
          margin: 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: clamp(1.8rem, 5vw, 2.6rem);
          font-weight: 400;
          line-height: 1.15;
          color: var(--ink);
          text-wrap: balance;
        }

        .gate-body {
          margin: 1rem auto 0;
          max-width: 42ch;
          color: var(--ink-soft);
          font-size: 0.95rem;
          line-height: 1.65;
        }

        .gate-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.8rem;
          margin-top: 1.75rem;
        }

        .profile :global(.gate-alt) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 3rem;
          padding: 0.75rem 1.9rem;
          border: 1px solid var(--hairline);
          border-radius: 999px;
          color: var(--ink-soft);
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 250ms var(--ease), border-color 250ms var(--ease);
        }

        .profile :global(.gate-alt:hover),
        .profile :global(.gate-alt:focus-visible) {
          color: var(--ox);
          border-color: var(--ox);
        }

        .profile :global(.gate-back) {
          display: inline-block;
          margin-top: 1.6rem;
          color: var(--ink-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.64rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 200ms var(--ease);
        }

        .profile :global(.gate-back:hover) {
          color: var(--ox);
        }

        /* ── Profile proper ──────────────────────────────────── */
        .profile-head {
          text-align: center;
          margin-bottom: 2rem;
        }

        .profile :global(.profile-home) {
          color: var(--ink-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 200ms var(--ease);
        }

        .profile :global(.profile-home:hover) {
          color: var(--ox);
        }

        .profile-title {
          margin: 0.75rem 0 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: clamp(1.8rem, 4.6vw, 2.5rem);
          font-weight: 400;
          line-height: 1.1;
          color: var(--ink);
          text-wrap: balance;
        }

        .user-card {
          background: #0f1240;
          margin-bottom: 1.5rem;
        }

        .user-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding-bottom: 1.4rem;
          margin-bottom: 1.2rem;
          border-bottom: 1px solid var(--hairline);
          text-align: left;
        }

        .profile :global(.user-avatar) {
          border-radius: 50%;
          border: 1px solid var(--hairline);
        }

        .user-initial {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          flex: 0 0 auto;
          border-radius: 50%;
          background: var(--paper);
          border: 1px solid var(--hairline);
          color: var(--ox);
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.5rem;
        }

        .user-name {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--ink);
        }

        .user-email {
          margin-top: 0.1rem;
          color: var(--ink-soft);
          font-size: 0.78rem;
        }

        .user-provider {
          margin-top: 0.2rem;
          color: var(--ink-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.58rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .user-cta-body {
          margin: 0.5rem 0 1rem;
          color: var(--ink-soft);
          font-size: 0.9rem;
          line-height: 1.6;
        }

        /* ── Quick links ─────────────────────────────────────── */
        .quick-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .profile :global(.quick-card) {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 1.15rem 1.25rem;
          border: 1px solid var(--hairline);
          background: rgba(250, 246, 236, 0.6);
          text-decoration: none;
          transition: border-color 250ms var(--ease);
        }

        .profile :global(.quick-card:hover),
        .profile :global(.quick-card:focus-visible) {
          border-color: var(--ox);
        }

        .quick-icon {
          color: var(--ox);
          font-size: 1.1rem;
        }

        .quick-label {
          color: var(--ink-soft);
          font-size: 0.84rem;
          font-weight: 500;
        }

        .deck-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .profile-signout {
          text-align: center;
        }

        .signout-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem 0.8rem;
          color: var(--ox);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          border-bottom: 1px solid rgba(224, 183, 104, 0.3);
          transition: border-color 250ms var(--ease);
        }

        .signout-btn:hover,
        .signout-btn:focus-visible {
          border-color: var(--ox);
        }

        @media (max-width: 520px) {
          .quick-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .signout-btn,
          .profile :global(.gate-alt),
          .profile :global(.gate-back),
          .profile :global(.profile-home),
          .profile :global(.quick-card) {
            transition: none !important;
          }
        }
      `}</style>
    </AlmanacShell>
  );
}
