"use client";

import { useState, useEffect } from "react";
import { getSession } from "../lib/supabase";
import LanguageSwitcher from "./LanguageSwitcher";
import TransitionLink from "@/components/transitions/TransitionLink";
import MagneticButton from "@/components/MagneticButton";
import { useLocale } from "../lib/i18n/useLocale";
import { openCommandPalette } from "./CommandPalette";
import { useProfile } from "../lib/user/profile-store";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isMac, setIsMac] = useState(false);
  // Sticky "Draw today's card" CTA: hidden while Hero is in viewport,
  // fades in once the hero section has fully scrolled out. On pages other
  // than home (no #main-content > section:first-child), stays hidden.
  const [heroVisible, setHeroVisible] = useState(true);
  const { t } = useLocale();
  const { profile } = useProfile();

  const navLinks = [
    { label: t("nav_academy"), href: "/academy" },
    { label: t("nav_portrait"), href: "/portrait" },
    { label: t("nav_cosmos"), href: "/cosmos" },
    { label: t("nav_daily"), href: "/daily" },
    { label: "Story", href: "/story" },
  ];

  useEffect(() => { getSession().then(s => setLoggedIn(!!s)); }, []);
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- platform detection, client-only
      setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform));
    }
  }, []);

  // Observe the first section inside <main id="main-content"> (the Hero)
  // so we know when the user has scrolled past it. When absent (non-home
  // pages), the sticky CTA simply stays hidden — safe fallback.
  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return;
    const target = document.querySelector<HTMLElement>("#main-content > section:first-child");
    if (!target) return;
    const obs = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry.isIntersecting),
      { threshold: 0, rootMargin: "0px" }
    );
    obs.observe(target);
    return () => obs.disconnect();
  }, []);

  const showStickyCta = !heroVisible;

  const searchLabel = t("search_open");
  const shortcut = isMac ? "\u2318K" : "Ctrl K";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4">
        <div className="glass-card px-6 py-3 flex items-center justify-between">
          {/* Logo — olive mark (brand) + wordmark */}
          <TransitionLink href="/" className="flex items-center gap-2 group" aria-label="Olivia Arcana — home">
            <img
              src="/olive-mark.svg"
              alt=""
              aria-hidden
              width={22}
              height={22}
              className="shrink-0"
              style={{ display: "block" }}
            />
            <span
              className="font-[family-name:var(--font-heading)] text-lg font-semibold tracking-wide text-celestial-gold"
            >
              Olivia Arcana
            </span>
          </TransitionLink>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <TransitionLink
                key={link.href}
                href={link.href}
                className="text-sm text-muted-lavender hover:text-celestial-gold transition-colors duration-300"
              >
                {link.label}
              </TransitionLink>
            ))}
            <button
              type="button"
              onClick={openCommandPalette}
              aria-label={searchLabel}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-full border border-celestial-gold/15 bg-celestial-gold/5 text-muted-lavender hover:text-celestial-gold hover:border-celestial-gold/35 transition-all duration-300"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <span className="text-xs tracking-[0.14em] uppercase">{searchLabel}</span>
              <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded border border-celestial-gold/25 bg-black/30 text-[10px] tracking-[0.1em] text-celestial-gold/70">
                {shortcut}
              </kbd>
            </button>
            {/* Sticky CTA — fades in once the Hero section leaves the viewport */}
            <div
              className="sticky-cta"
              aria-hidden={!showStickyCta}
              style={{
                opacity: showStickyCta ? 1 : 0,
                transform: showStickyCta ? "translateY(0)" : "translateY(-6px)",
                pointerEvents: showStickyCta ? "auto" : "none",
                transition:
                  "opacity 400ms var(--ease-ritual, cubic-bezier(0.16,1,0.3,1)), transform 400ms var(--ease-ritual, cubic-bezier(0.16,1,0.3,1))",
              }}
            >
              <MagneticButton
                variant="gold"
                size="sm"
                href="/academy/card-of-the-day"
              >
                Draw today&rsquo;s card →
              </MagneticButton>
            </div>
            {profile && (
              <TransitionLink
                href={`/signs/${profile.signSlug}`}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-celestial-gold/25 bg-celestial-gold/5 hover:bg-celestial-gold/10 transition-colors duration-300"
                aria-label={`Your sign: ${profile.signName}`}
              >
                <span aria-hidden className="text-celestial-gold text-base leading-none">
                  {profile.signGlyph}
                </span>
                <span className="font-[family-name:var(--font-heading)] italic text-sm text-celestial-gold">
                  {profile.signName}
                </span>
              </TransitionLink>
            )}
            <LanguageSwitcher />
            <TransitionLink
              href={loggedIn ? "/profile" : "/register"}
              className="px-5 py-2 rounded-full bg-celestial-gold/10 border border-celestial-gold/30 text-celestial-gold text-sm font-medium hover:bg-celestial-gold/20 transition-all duration-300"
            >
              {loggedIn ? t("nav_profile") : t("nav_signup")}
            </TransitionLink>
          </div>

          {/* Mobile right cluster — search icon + hamburger */}
          <div className="md:hidden flex items-center gap-3">
            <button
              type="button"
              onClick={openCommandPalette}
              aria-label={searchLabel}
              className="text-muted-lavender hover:text-celestial-gold transition-colors p-1"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
            <button
              onClick={() => setOpen(!open)}
              className="text-muted-lavender hover:text-celestial-gold transition-colors"
              aria-label="Toggle menu"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                {open ? (
                  <path d="M6 6l12 12M6 18L18 6" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div
            className="md:hidden mt-2 glass-card p-4 space-y-3"
            style={{
              maxHeight: "calc(100dvh - 5rem)",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
            }}
          >
            {navLinks.map((link) => (
              <TransitionLink
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block text-muted-lavender hover:text-celestial-gold transition-colors py-3"
              >
                {link.label}
              </TransitionLink>
            ))}
            <TransitionLink
              href={loggedIn ? "/profile" : "/register"}
              onClick={() => setOpen(false)}
              className="block text-center px-5 py-3 rounded-full bg-celestial-gold/10 border border-celestial-gold/30 text-celestial-gold font-medium"
            >
              {loggedIn ? t("nav_profile") : t("nav_signup")}
            </TransitionLink>
          </div>
        )}
      </div>
    </nav>
  );
}
