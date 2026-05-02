/**
 * Navbar.tsx — Ghost Navigation System.
 * 
 * Re-engineered for high-end precision (Linear/Apple style).
 * Features: Sub-pixel borders, magnetic interactions, and dynamic peeks.
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
  const pagePath = typeof window !== "undefined" ? window.location.pathname : pathname;

  const isOracle = pagePath?.startsWith("/oracle");

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
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 px-6 sm:px-12 pt-6 sm:pt-8 ${
        isScrolled ? "translate-y-[-10px] opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
        {/* ── BRAND: THE MARK ── */}
        <TransitionLink href="/" className="group flex items-center gap-4 no-underline">
          <div className="relative">
             <div className="absolute inset-0 bg-celestial-gold/20 blur-xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-700" />
             <LivingOliveMark size={24} className="relative z-10 text-celestial-gold" />
          </div>
          <span className="font-[family-name:var(--font-heading)] text-xl tracking-tight text-warm-ivory group-hover:text-celestial-gold transition-colors duration-500">
            Olivia Arcana
          </span>
        </TransitionLink>

        {/* ── CENTER: NAVIGATION ── */}
        <div className="hidden md:flex items-center gap-1 bg-white/5 backdrop-blur-2xl px-2 py-1.5 rounded-full celestial-border">
          {navLinks.map((link) => (
            <TransitionLink
              key={link.href}
              href={link.href}
              className="px-6 py-2 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase text-warm-ivory/50 hover:text-warm-ivory hover:bg-white/5 transition-all duration-300"
            >
              {link.label}
            </TransitionLink>
          ))}
          
          <div className="w-[1px] h-4 bg-white/10 mx-2" />
          
          <button
            onClick={openCommandPalette}
            aria-label="Open search"
            className="px-6 py-2 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase text-celestial-gold/60 hover:text-celestial-gold hover:bg-celestial-gold/5 transition-all duration-300 flex items-center gap-2"
          >
            Search <span className="opacity-30">⌘K</span>
          </button>
        </div>

        {/* ── RIGHT: USER / CTA ── */}
        <div className="flex items-center gap-4">
          <TransitionLink
            href="/oracle"
            className="group relative px-8 py-3 rounded-full overflow-hidden transition-all duration-500 hover:scale-[1.05] active:scale-[0.98]"
          >
             <div className="absolute inset-0 bg-celestial-gold/10 group-hover:bg-celestial-gold transition-colors duration-500" />
             <div className="absolute inset-0 border border-celestial-gold/20 group-hover:border-celestial-gold/0 rounded-full" />
             <span className="relative z-10 text-[9px] font-bold tracking-[0.3em] uppercase text-celestial-gold group-hover:text-void-black transition-colors duration-500">
               Enter Oracle
             </span>
          </TransitionLink>

          {profile && (
            <TransitionLink
              href={`/signs/${profile.signSlug}`}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-celestial-gold text-lg hover:bg-white/10 transition-colors"
            >
              {profile.signGlyph}
            </TransitionLink>
          )}
        </div>
      </div>
    </nav>
  );
}
