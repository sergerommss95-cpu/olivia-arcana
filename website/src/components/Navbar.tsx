"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSession } from "../lib/supabase";

const navLinks = [
  { label: "Cosmos", href: "/cosmos" },
  { label: "Portrait", href: "/portrait" },
  { label: "Ask the Stars", href: "/ask" },
  { label: "Birth Chart", href: "/chart" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => { getSession().then(s => setLoggedIn(!!s)); }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="glass-card px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-celestial-gold text-xl">&#10022;</span>
            <span
              className="font-[family-name:var(--font-heading)] text-lg font-semibold tracking-wide text-celestial-gold"
            >
              Olivia Arcana
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-muted-lavender hover:text-celestial-gold transition-colors duration-300"
              >
                {link.label}
              </a>
            ))}
            <a
              href={loggedIn ? "/profile" : "/register"}
              className="px-5 py-2 rounded-full bg-celestial-gold/10 border border-celestial-gold/30 text-celestial-gold text-sm font-medium hover:bg-celestial-gold/20 transition-all duration-300"
            >
              {loggedIn ? "My Profile" : "Sign Up"}
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-muted-lavender hover:text-celestial-gold transition-colors"
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

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden mt-2 glass-card p-4 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block text-muted-lavender hover:text-celestial-gold transition-colors py-2"
              >
                {link.label}
              </a>
            ))}
            <a
              href={loggedIn ? "/profile" : "/register"}
              className="block text-center px-5 py-3 rounded-full bg-celestial-gold/10 border border-celestial-gold/30 text-celestial-gold font-medium"
            >
              {loggedIn ? "My Profile" : "Sign Up"}
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}
