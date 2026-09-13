/**
 * Navbar — The Arrival masthead.
 *
 * A printed header, not a floating widget: serif wordmark with the ray
 * mark, plain nav links whose hairline draws on hover, and the one gilt
 * action. Flat on the night; no pills, no blur, no magnetism.
 */

"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import LivingOliveMark from "./LivingOliveMark";
import TransitionLink from "@/components/transitions/TransitionLink";
import { openCommandPalette } from "./CommandPalette";
import { useProfile } from "../lib/user/profile-store";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { profile } = useProfile();
  const pathname = usePathname();

  const isOracle = pathname?.startsWith("/oracle");

  const navLinks = [
    { label: "Academy", href: "/academy" },
    { label: "Cosmos", href: "/cosmos" },
    { label: "Story", href: "/story" },
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isOracle) return null;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        isScrolled ? "-translate-y-3 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="mx-auto flex h-[100px] max-w-screen-2xl items-center justify-between px-6 sm:px-[clamp(24px,5.25vw,104px)]">
        {/* ── Brand ── */}
        <TransitionLink href="/" className="group flex min-h-[44px] items-center gap-3 no-underline">
          <LivingOliveMark size={26} className="shrink-0 text-[#e8e9ff]" />
          <span className="font-[family-name:var(--font-heading)] text-xl sm:text-[25px] font-medium tracking-[0.105em] text-[#e8e9ff] whitespace-nowrap">
            OLIVIA ARCANA
          </span>
        </TransitionLink>

        {/* ── Navigation ── */}
        <div className="hidden lg:flex items-center gap-9">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
            return (
              <TransitionLink
                key={link.href}
                href={link.href}
                className={`arr-nav-link relative py-3 text-sm text-[#e8e9ff] no-underline ${isActive ? "is-active" : ""}`}
              >
                {link.label}
              </TransitionLink>
            );
          })}
          <button
            onClick={openCommandPalette}
            aria-label="Open search"
            className="arr-nav-link relative flex items-center gap-2 py-3 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.14em] uppercase text-[#b7bce9] hover:text-[#e8e9ff] transition-colors"
          >
            Search <span className="opacity-40 text-[9px]">⌘K</span>
          </button>
        </div>

        {/* ── The one warm action ── */}
        <div className="flex items-center gap-5">
          <TransitionLink
            href="/oracle"
            className="hidden sm:inline-flex min-h-[44px] items-center rounded-[2px] bg-[#e0b768] px-5 text-sm font-medium text-[#15174c] no-underline transition-all duration-300 hover:bg-[#edca8b] hover:-translate-y-0.5"
          >
            Ask the Oracle
          </TransitionLink>

          {profile && (
            <TransitionLink
              href={`/signs/${profile.signSlug}`}
              className="flex h-10 w-10 items-center justify-center border border-[rgba(232,233,255,0.24)] text-lg text-[#e0b768] transition-colors duration-300 hover:border-[rgba(232,233,255,0.5)]"
            >
              {profile.signGlyph}
            </TransitionLink>
          )}
        </div>
      </div>

      <style jsx global>{`
        .arr-nav-link::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 6px;
          height: 1px;
          background: currentColor;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .arr-nav-link:hover::after,
        .arr-nav-link.is-active::after {
          transform: scaleX(1);
        }
      `}</style>
    </nav>
  );
}
