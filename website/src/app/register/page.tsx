"use client";

import { useLocale } from "@/lib/i18n/useLocale";

import { useState } from "react";
import Link from "next/link";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import { signInWithGoogle } from "../../lib/supabase";
import ServicePaused from "../../components/ServicePaused";
import { ACCOUNTS_ENABLED } from "../../lib/service-status";

export default function RegisterPage() {
  const { locale } = useLocale();
  const isUk = locale === "uk";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!ACCOUNTS_ENABLED) {
    return (
      <ServicePaused
        title={isUk ? "Нові облікові записи призупинено" : "New accounts are paused"}
        body={isUk ? "Ми перебудовуємо систему облікових записів. Усе нижче працює без нього." : "We're rebuilding the account system. Everything below works without one."}
      />
    );
  }

  const handleGoogle = async () => {
    setError(""); setLoading(true);
    try { await signInWithGoogle(); }
    catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <AlmanacShell narrow>
      <section className="auth">
        <div className="auth-sheet">
          <div className="auth-oxford" aria-hidden />
          <p className="auth-orn" aria-hidden>
            ✦
          </p>
          <h1 className="auth-title">Begin Your Journey</h1>
          <p className="auth-sub">One tap. Your chart, your readings, your stars.</p>

          <button type="button" className="auth-google" onClick={handleGoogle} disabled={loading}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {loading ? "Connecting…" : "Sign up with Google"}
          </button>

          {error && <p className="auth-error">{error}</p>}

          <p className="auth-fine">
            By continuing you agree to our{" "}
            <Link href="/terms" className="auth-fine-link">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="auth-fine-link">
              Privacy
            </Link>
            .
          </p>
        </div>
      </section>

      <style jsx>{`
        .auth {
          display: flex;
          justify-content: center;
          padding: clamp(1rem, 4vw, 3rem) 0;
        }

        .auth-sheet {
          width: 100%;
          max-width: 24rem;
          padding: 0 2rem 2.2rem;
          text-align: center;
          background: #0f1240;
          border: 1px solid var(--hairline);
          box-shadow: 0 1.4rem 2.8rem rgba(4, 6, 32, 0.1);
        }

        .auth-oxford {
          height: 6px;
          margin: 0 -2rem;
          background: linear-gradient(180deg, var(--ink) 0 3px, transparent 3px 4.5px, var(--ink) 4.5px 5.5px, transparent 5.5px);
        }

        .auth-orn {
          margin: 1.9rem 0 0.7rem;
          color: var(--ox);
          font-size: 1.1rem;
        }

        .auth-title {
          margin: 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 2rem;
          font-weight: 400;
          line-height: 1.15;
          color: var(--ink);
          text-wrap: balance;
        }

        .auth-sub {
          margin: 0.5rem 0 0;
          color: var(--ink-soft);
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .auth-google {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.7rem;
          width: 100%;
          min-height: 3.1rem;
          margin-top: 1.7rem;
          padding: 0.85rem 1.4rem;
          background: var(--paper);
          border: 1px solid var(--hairline);
          border-radius: 999px;
          color: var(--ink);
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 250ms var(--ease), color 250ms var(--ease);
        }

        .auth-google:hover,
        .auth-google:focus-visible {
          border-color: var(--ox);
          color: var(--ox);
        }

        .auth-google:disabled {
          opacity: 0.55;
          cursor: wait;
        }

        .auth-error {
          margin: 0.9rem 0 0;
          color: var(--ox);
          font-size: 0.78rem;
        }

        .auth-fine {
          margin: 1.5rem auto 0;
          max-width: 32ch;
          color: var(--ink-faint);
          font-size: 0.72rem;
          line-height: 1.7;
        }

        .auth :global(.auth-fine-link) {
          color: var(--ox);
          text-decoration: none;
          border-bottom: 1px solid rgba(224, 183, 104, 0.3);
          transition: border-color 250ms var(--ease);
        }

        .auth :global(.auth-fine-link:hover),
        .auth :global(.auth-fine-link:focus-visible) {
          border-color: var(--ox);
        }

        @media (prefers-reduced-motion: reduce) {
          .auth-google,
          .auth :global(.auth-fine-link) {
            transition: none !important;
          }
        }
      `}</style>
    </AlmanacShell>
  );
}
