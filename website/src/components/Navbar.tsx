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
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 px-5 sm:px-12 pt-6 sm:pt-10 ${
        isScrolled ? "translate-y-[-10px] opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
        {/* ── BRAND: THE MARK ── */}
        <TransitionLink href="/" className="group flex min-h-[44px] items-center gap-3 sm:gap-4 no-underline">
          <div className="relative">
             <div className="absolute inset-0 bg-celestial-gold/30 blur-xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-700" />
             <LivingOliveMark size={22} className="relative z-10 text-celestial-gold" />
          </div>
          <span className="font-[family-name:var(--font-heading)] text-lg sm:text-xl tracking-tight text-warm-ivory group-hover:text-celestial-gold transition-colors duration-500 font-medium">
            Olivia Arcana
          </span>
        </TransitionLink>

        {/* ── CENTER: NAVIGATION (Desktop Only) ── */}
        <div className="hidden lg:flex items-center gap-1 bg-void-black/40 backdrop-blur-xl px-2 py-1.5 rounded-full border border-white/5 shadow-2xl">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
            return (
              <TransitionLink
                key={link.href}
                href={link.href}
                className={`min-h-[40px] px-6 py-2 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-300 flex items-center ${
                  isActive ? "text-celestial-gold bg-white/5 shadow-inner" : "text-warm-ivory/80 hover:text-warm-ivory hover:bg-white/5"
                }`}
              >
                {link.label}
              </TransitionLink>
            );
          })}
          
          <div className="w-[1px] h-3 bg-white/10 mx-2" />
          
          <button
            onClick={openCommandPalette}
            aria-label="Open search"
            className="min-h-[40px] px-6 py-2 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase text-celestial-gold/80 hover:text-celestial-gold hover:bg-celestial-gold/5 transition-all duration-300 flex items-center gap-2"
          >
            Search <span className="opacity-30 font-mono text-[9px]">⌘K</span>
          </button>
        </div>

        {/* ── RIGHT: USER / CTA ── */}
        <div className="flex items-center gap-3 sm:gap-6">
          <TransitionLink
            href="/oracle"
            className="hidden sm:flex group relative min-h-[44px] px-8 py-3 rounded-full overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] shadow-xl items-center"
          >
             <div className="absolute inset-0 bg-celestial-gold/10 group-hover:bg-celestial-gold/20 transition-colors duration-500" />
             <div className="absolute inset-0 border border-celestial-gold/30 group-hover:border-celestial-gold/50 rounded-full" />
             <span className="relative z-10 text-[9px] font-black tracking-[0.3em] uppercase text-celestial-gold group-hover:text-warm-ivory transition-colors duration-500">
               Ask the Oracle
             </span>
          </TransitionLink>

          {profile && (
            <TransitionLink
              href={`/signs/${profile.signSlug}`}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-void-black/60 border border-white/10 text-celestial-gold text-lg hover:bg-white/10 transition-all duration-300 shadow-lg"
            >
              <span className="drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">{profile.signGlyph}</span>
            </TransitionLink>
          )}
        </div>
      </div>
    </nav>
  );
}
