# Running Code Bundle — Current Deployed State

**Complement to `05-design-review-packet.md` — verbatim source for the key files, as currently running on https://oliviaarcana.com**

Commit: `29237c0` · Branch: `main` · Auto-deployed to Netlify on push.

---

## Table of Contents
1. [Config — `next.config.ts`](#next-configts)
2. [Config — `netlify.toml`](#netlifytoml)
3. [Config — `public/manifest.json`](#publicmanifestjson)
4. [Layout — `src/app/layout.tsx`](#srcapplayouttsx)
5. [Global styles — `src/app/globals.css` (tokens + utilities)](#srcappglobalscss)
6. [Client shell — `src/components/ClientShell.tsx`](#srccomponentsclientshelltsx)
7. [Home page — `src/app/page.tsx`](#srcapppagetsx)
8. [Hero — `src/components/Hero.tsx` (excerpt)](#srccomponentsherotsx)
9. [Navbar — `src/components/Navbar.tsx`](#srccomponentsnavbartsx)
10. [Footer — `src/components/Footer.tsx`](#srccomponentsfootertsx)
11. [Pricing — `src/components/Pricing.tsx`](#srccomponentspricingtsx)
12. [Magnetic button — `src/components/MagneticButton.tsx`](#srccomponentsmagneticbuttontsx)
13. [Scroll float — `src/components/ScrollFloat.tsx`](#srccomponentsscrollfloattsx)
14. [Card of the Day — `src/app/academy/card-of-the-day/page.tsx`](#srcappacademycard-of-the-daypagetsx)

---

## `next.config.ts`

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
```

---

## `netlify.toml`

```toml
[build]
  command = "npx next build"
  publish = "out"

[[edge_functions]]
  path = "/api/chat"
  function = "chat"

[[headers]]
  for = "/*"
  [headers.values]
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
```

---

## `public/manifest.json`

```json
{
  "name": "Olivia Arcana — Written in Your Stars",
  "short_name": "Olivia Arcana",
  "description": "Personalized astrology readings from your exact planetary positions",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#04020d",
  "theme_color": "#04020d",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/favicon.ico", "sizes": "16x16", "type": "image/x-icon" }
  ],
  "categories": ["lifestyle", "entertainment"]
}
```

---

## `src/app/layout.tsx`

```tsx
import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, IBM_Plex_Mono } from "next/font/google";
import ClientShell from "@/components/ClientShell";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  preload: true,
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
  preload: true,
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Olivia Arcana — Your Personal Astrologer & Tarot Reader",
  description:
    "Get personalized astrology readings based on real NASA planetary data. Daily horoscopes, tarot, compatibility reports, and transit alerts — powered by your exact birth chart.",
  keywords: [
    "astrology", "tarot", "horoscope", "birth chart", "natal chart",
    "compatibility", "zodiac", "daily horoscope", "personalized astrology",
  ],
  metadataBase: new URL("https://oliviaarcana.com"),
  openGraph: {
    title: "Olivia Arcana — Written in Your Stars",
    description: "Personalized astrology readings calculated from your exact planetary positions. Not templates — real cosmic guidance.",
    type: "website",
    siteName: "Olivia Arcana",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Olivia Arcana — Written in Your Stars",
    description: "Personalized cosmic readings from your exact planetary positions.",
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
  other: {
    "theme-color": "#060810",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmSans.variable} ${ibmPlexMono.variable} antialiased`}
    >
      <body className="min-h-screen">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
```

---

## `src/app/globals.css`

**Full token system + utilities — the entire `globals.css` file**. See `design-review-packet.md` §2 for a guided tour. The raw file is at `/Users/macbookpro/olivia-arcana/website/src/app/globals.css` (lines 1–505). Key sections:

```css
/* Font imports (Google Fonts) */
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&family=IBM+Plex+Mono:wght@400&display=swap');
@import "tailwindcss";

/* Lenis smooth scroll hooks */
html.lenis, html.lenis body { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
.lenis.lenis-stopped { overflow: hidden; }

/* Tailwind v4 theme — brand color palette */
@theme inline {
  --color-void-black: #04020d;
  --color-deep-cosmos: #090615;
  --color-nebula: #120c28;
  --color-celestial-gold: #D4AF37;
  --color-slate-blue: #7B68EE;
  --color-warm-ivory: #F5F0E8;
  --color-muted-lavender: #9B96A8;
  --color-cosmic-teal: #4ECDC4;
  --color-mars-red: #E8524A;

  --font-heading: var(--font-heading);
  --font-accent: "Cormorant Garamond", serif;
  --font-display: var(--font-heading, "Cormorant Garamond"), "IM Fell English", Georgia, serif;
}

/* Cosmic color tokens */
:root {
  --c-void: #06041a;
  --c-deep-space: #0b081e;
  --c-nebula: #160e32;
  --c-surface: rgba(255,255,255,0.04);
  --c-surface-2: rgba(255,255,255,0.07);
  --c-border: rgba(200,185,255,0.10);
  --c-border-2: rgba(200,185,255,0.18);
  --c-text-primary: rgba(240,236,255,0.95);
  --c-text-mid: rgba(196,185,228,0.80);
  --c-text-muted: rgba(155,145,190,0.60);
  --c-accent: #a07ae0;
  --c-accent-glow: rgba(130,90,220,0.22);
  --glass-bg: rgba(255,255,255,0.05);
  --glass-border: rgba(255,255,255,0.09);
  --glass-blur: blur(18px) saturate(1.25);
  --scrim-soft: radial-gradient(ellipse at center, rgba(8,6,20,0.62) 0%, rgba(8,6,20,0.25) 60%, transparent 95%);
  --scrim-strong: linear-gradient(180deg, rgba(8,6,20,0.75), rgba(8,6,20,0.55));
  --surface-solid: #0e0b24;
  --surface-raised: #151230;
  --radius-pill: 9999px;
  --radius-card: 1.25rem;
  --radius-sm: 0.5rem;
  --nav-height: 5rem;
}

/* Glass card */
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  box-shadow: 0 2px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05);
}

/* Gold gradient text */
.text-gold-gradient {
  background: linear-gradient(135deg, #D4AF37 0%, #F5E6A3 50%, #D4AF37 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Focus ring */
:focus-visible {
  outline: 2px solid #E8C96A;
  outline-offset: 3px;
  border-radius: 4px;
  box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.18);
}

/* Motion tokens */
:root {
  --ease-ritual:    cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth:    cubic-bezier(0.25, 0.1, 0.25, 1);
  --ease-dramatic:  cubic-bezier(0.075, 0.82, 0.165, 1);
  --ease-snap:      cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --c-gold:         #D4AF37;
  --tod-accent:       #E8C96A;
  --tod-accent-soft:  rgba(232, 201, 106, 0.18);
  --tod-bg-bias:      transparent;
  --tod-greeting:     "evening";
}

/* Time-of-day palettes */
html[data-tod="dawn"]  { --tod-accent: #F6B98A; --tod-greeting: "morning"; }
html[data-tod="day"]   { --tod-accent: #E8C96A; --tod-greeting: "afternoon"; }
html[data-tod="dusk"]  { --tod-accent: #D8B3E8; --tod-greeting: "evening"; }
html[data-tod="night"] { --tod-accent: #B8C4F0; --tod-greeting: "night"; }

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Mobile touch targets */
@media (max-width: 640px) {
  button, a, [role="button"], input[type="checkbox"], input[type="radio"] {
    min-height: 44px;
    min-width: 44px;
  }
}
```

---

## `src/components/ClientShell.tsx`

```tsx
"use client";

import React, { useEffect, useState } from "react";
import GlobalBackground from "@/components/GlobalBackground";
import EclipseOverlay from "@/components/EclipseOverlay";
import CosmicCursor from "@/components/CosmicCursor";
import SoundEngine from "@/components/SoundEngine";
import AmbientSound from "@/components/AmbientSound";
import CosmicIndicators from "@/components/CosmicIndicators";
import CosmicToast from "@/components/CosmicToast";
import InstallPrompt from "@/components/InstallPrompt";
import SmoothScroll from "@/components/SmoothScroll";
import FilmGrain from "@/components/FilmGrain";
import PageTransition from "@/components/transitions/PageTransition";
import CommandPalette from "@/components/CommandPalette";
import TimeOfDayTheme from "@/components/TimeOfDayTheme";
import MobileBottomNav from "@/components/MobileBottomNav";
import { SubscriptionProvider } from "@/hooks/useSubscription";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      {mounted && (
        <>
          <GlobalBackground />     {/* Layer 0 — persistent WebGL void */}
          <EclipseOverlay />       {/* Astronomical event overlay */}
          <CosmicCursor />         {/* Custom cursor (desktop) */}
          <SoundEngine />          {/* Procedural audio routing */}
          <AmbientSound />         {/* Background ambient audio */}
          <CosmicIndicators />     {/* Moon phase + planetary hour */}
          <CosmicToast />          {/* Daily cosmic toasts */}
          <InstallPrompt />        {/* PWA install */}
          <SmoothScroll />         {/* Lenis */}
          <FilmGrain opacity={0.03} vignetteIntensity={0.35} />
          <CommandPalette />       {/* Cmd+K */}
          <TimeOfDayTheme />       {/* dawn/day/dusk/night swap */}
          <MobileBottomNav />      {/* Thumb-reach bottom nav */}
        </>
      )}

      <SubscriptionProvider>
        {mounted ? <PageTransition>{children}</PageTransition> : <>{children}</>}
      </SubscriptionProvider>
    </>
  );
}
```

---

## `src/app/page.tsx`

```tsx
"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import SignLabel from "@/components/SignLabel";
import ConstellationOverlay from "@/components/ConstellationOverlay";
import MagneticGlow from "@/components/MagneticGlow";
import CosmicStatus from "@/components/CosmicStatus";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import DailyHoroscope from "@/components/DailyHoroscope";
import CompatibilityChecker from "@/components/CompatibilityChecker";
import ScrollFloat from "@/components/ScrollFloat";
import InfiniteMarquee from "@/components/InfiniteMarquee";
import CosmicSelfie from "@/components/CosmicSelfie";

const CinematicLoader = dynamic(() => import("@/components/CinematicLoader"), { ssr: false });

export default function Home() {
  const sectionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFade = (e: Event) => {
      const fade = (e as CustomEvent).detail?.fade;
      if (!sectionsRef.current) return;
      sectionsRef.current.style.transition = "opacity 0.6s var(--ease-ritual)";
      sectionsRef.current.style.opacity = fade ? "0" : "1";
      sectionsRef.current.style.pointerEvents = fade ? "none" : "auto";
    };
    window.addEventListener("cosmos:sections-fade", handleFade as EventListener);
    return () => window.removeEventListener("cosmos:sections-fade", handleFade as EventListener);
  }, []);

  return (
    <>
      <CinematicLoader />
      <SignLabel />
      <ConstellationOverlay />
      <MagneticGlow />
      <Navbar />
      <CosmicStatus />

      <main id="main-content" className="relative z-10">
        <Hero />
        <div ref={sectionsRef}>
          <ScrollFloat index={0}><DailyHoroscope /></ScrollFloat>
          <ScrollFloat index={1}><CompatibilityChecker /></ScrollFloat>
          <div style={{ padding: "3rem 0" }}>
            <InfiniteMarquee speed={30} gap={56}>
              {["Birth Charts", "✦", "Daily Readings", "✦", "Tarot Oracle", "✦", "Synastry", "✦",
                "Transit Alerts", "✦", "Moon Journal", "✦", "AI Astrologer", "✦"].map((item, i) => (
                <span key={i} style={{
                  fontFamily: item === "✦" ? "inherit" : "'Cormorant Garamond', Georgia, serif",
                  fontSize: item === "✦" ? "0.75rem" : "clamp(1rem, 2vw, 1.5rem)",
                  fontWeight: 300,
                  letterSpacing: "0.05em",
                  color: item === "✦" ? "rgba(212,175,55,0.35)" : "rgba(240,236,255,0.2)",
                  whiteSpace: "nowrap",
                }}>{item}</span>
              ))}
            </InfiniteMarquee>
          </div>
          <ScrollFloat index={2}><Features /></ScrollFloat>
          <ScrollFloat index={3}><HowItWorks /></ScrollFloat>
          <ScrollFloat index={4}><Testimonials /></ScrollFloat>
          <ScrollFloat index={5}><CosmicSelfie /></ScrollFloat>
          <ScrollFloat index={6}><Pricing /></ScrollFloat>
          <ScrollFloat index={7}><CTA /></ScrollFloat>
        </div>
      </main>

      <Footer />
    </>
  );
}
```

---

## `src/components/Hero.tsx` (core structure — full file 442 lines)

```tsx
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { getSunSign, getCosmicProfile } from "../lib/zodiac-utils";
import CosmicProfile from "./CosmicProfile";
import MagneticButton from "@/components/MagneticButton";
import AnimatedCounter from "@/components/AnimatedCounter";
import { useLocale } from "../lib/i18n/useLocale";
import { useProfile } from "../lib/user/profile-store";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export default function Hero() {
  const headRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const { t } = useLocale();
  const { saveFromBirthday } = useProfile();

  const [birthday, setBirthday] = useState("");
  const [cosmicProfile, setCosmicProfile] = useState(null);
  const [phase, setPhase] = useState<"idle" | "activating" | "revealed">("idle");

  // Word-by-word stagger entrance via Web Animations API (no GSAP)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const words = headRef.current?.querySelectorAll<HTMLSpanElement>("[data-word]");
    words?.forEach((w, i) => {
      w.animate(
        [
          { opacity: "0", transform: "translateY(22px)", clipPath: "inset(0 0 100% 0)" },
          { opacity: "1", transform: "translateY(0)", clipPath: "inset(0 0 0% 0)" },
        ],
        { duration: 900, delay: 320 + i * 120, easing: EASE, fill: "forwards" }
      );
    });
  }, []);

  return (
    <section style={{
      position: "relative",
      minHeight: "100svh",
      padding: "clamp(6rem, 12vw, 9rem) clamp(1.25rem, 6vw, 6rem) clamp(4rem, 10vw, 6rem)",
      display: "flex", alignItems: "center",
    }}>
      {/* Eyebrow */}
      <span style={{
        fontFamily: "var(--font-body), sans-serif",
        fontSize: "0.72rem",
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        color: "rgba(232, 201, 106, 0.78)",
      }}>
        ✦ An editorial cosmic almanac
      </span>

      {/* Headline — italic Cormorant, massive scale */}
      <h1 ref={headRef} style={{
        fontFamily: "var(--font-heading, 'Cormorant Garamond'), serif",
        fontStyle: "italic",
        fontSize: "clamp(2.9rem, 7.2vw, 6.8rem)",
        lineHeight: 1.02,
        letterSpacing: "-0.02em",
        color: "#F5F0E8",
        textShadow: "0 2px 24px rgba(4,2,13,0.55)",
      }}>
        {["Written", "in", "Your", "Stars"].map((w) => (
          <span key={w} data-word style={{
            display: "inline-block",
            opacity: 0,
            clipPath: "inset(0 0 100% 0)",
          }}>{w}</span>
        ))}
      </h1>

      {/* Sub-copy with scrim */}
      <p className="scrim-text" style={{
        fontSize: "clamp(1rem, 1.5vw, 1.18rem)",
        maxWidth: "520px",
        color: "rgba(238, 232, 220, 0.92)",
      }}>
        Readings calculated from the exact positions of the planets the moment
        you were born. <em>Not templates</em> — real cosmic guidance, written by hand.
      </p>

      {/* Birthday input + CTAs */}
      <form>
        <input type="text" placeholder="MM / DD" /* ... */ />
        <MagneticButton href="/portrait" variant="gold" size="md">Portrait →</MagneticButton>
        <MagneticButton href="/ask" variant="outline" size="md">Ask Olivia</MagneticButton>
      </form>

      {/* Trust line */}
      <p>
        <AnimatedCounter value={12400} suffix="+" /> readings given ·
        <AnimatedCounter value={4.9} decimals={1} suffix=" ★" /> average rating ·
        9 languages
      </p>
    </section>
  );
}
```

---

## `src/components/Navbar.tsx`

Full file — sticky glass navbar with desktop/mobile variants, logged-in profile chip, command palette launcher (Cmd+K), language switcher, mobile drawer. See `05-design-review-packet.md` §4 for component inventory.

---

## `src/components/Footer.tsx`

Full file — zodiac glyph strip (12 signs), 4-column grid (brand / explore / connect / bottom bar), gold divider borders. Uses `TransitionLink` for internal nav to preserve the page-transition choreography.

---

## `src/components/Pricing.tsx`

Full file (217 lines) in `03-pricing-payments.md`. Highlights:
- `ScrollFloat` wraps both tier cards (index 0, 1 — subtle intensity)
- Monthly/Annual toggle with "Save 17%" cosmic-teal badge
- VIP tier has `animate-pulse-glow` class + gold border + "POPULAR" chip
- À la carte: `flex-wrap` of 5 pills with `glass-card` treatment, price in celestial-gold
- Guest checkout redirects to `/onboarding/?redirect=checkout&price=...`
- If `isVip` → shows "Manage Subscription" → portal flow

---

## `src/components/MagneticButton.tsx` — the signature CTA

```tsx
"use client";

import React, { useEffect, useState } from "react";
import { useMagnetic } from "@/hooks/useMagnetic";

const HOLO_CONIC =
  "conic-gradient(from 0deg at 50% 50%, " +
  "rgba(212,175,55,0.0) 0deg, rgba(212,175,55,0.35) 40deg, " +
  "rgba(255,220,170,0.28) 80deg, rgba(160,120,255,0.30) 140deg, " +
  "rgba(120,200,255,0.22) 200deg, rgba(220,170,255,0.28) 260deg, " +
  "rgba(212,175,55,0.32) 320deg, rgba(212,175,55,0.0) 360deg)";

const FOIL_STRIPE =
  "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.22) 50%, transparent 60%)";

const VARIANTS = {
  gold: {
    bg: "linear-gradient(135deg, #D4AF37 0%, #F5E6A3 50%, #D4AF37 100%)",
    text: "var(--c-void)",
    shadowHover: "0 0 30px rgba(212,175,55,0.4), 0 0 60px rgba(212,175,55,0.15)",
  },
  glass: {
    bg: "linear-gradient(135deg, rgba(160,120,255,0.18) 0%, rgba(100,80,220,0.14) 100%)",
    text: "rgba(240,235,255,0.95)",
    border: "1px solid rgba(200,180,255,0.22)",
    shadowHover: "0 0 25px rgba(160,120,255,0.3), 0 0 50px rgba(160,120,255,0.1)",
  },
  outline: {
    bg: "transparent",
    text: "var(--c-accent)",
    border: "1px solid rgba(160,120,255,0.3)",
    shadowHover: "0 0 20px rgba(160,120,255,0.2)",
  },
};

export default function MagneticButton({
  children, href, onClick, variant = "glass", size = "md",
  veil /* holographic + foil sweep — defaults true for gold/glass */,
}) {
  const { ref, x, y, active, pressed } = useMagnetic(60, 0.3);
  // x, y: normalized cursor offset. active: within magnetic radius. pressed: mousedown.
  
  const scale = pressed ? 0.97 : active ? 1.06 : 1;
  const translateX = x * 12;
  const translateY = y * 12;

  // 3 layered effects:
  // 1. Radial glow — follows cursor relative position
  // 2. Holographic conic — rotates 9s linear infinite, mix-blend-mode overlay
  // 3. Foil sweep — linear stripe at 105deg, 2.2s linear infinite, mix-blend soft-light/screen

  return (
    <a href={href} onClick={() => {
      window.dispatchEvent(new CustomEvent("cosmos:chime"));  // sound
      onClick?.();
    }}>
      {/* ...layered effects + children */}
    </a>
  );
}
```

**Key details:**
- 60px magnetic radius, strength 0.3 (from `useMagnetic` hook)
- 12px max translate, 1.06 max scale, 0.97 press scale
- `transition: 400ms cubic-bezier(0.16, 1, 0.3, 1)` when releasing, 100ms when pressing
- Touch devices return `{x:0, y:0, active:false}` — no magnetic, just press state
- Dispatches `cosmos:chime` for procedural sound on click

---

## `src/components/ScrollFloat.tsx` — scroll-scrubbed reveals

```tsx
"use client";
import { useMemo, useState, useEffect } from "react";
import { useScrollProgress } from "@/hooks/useScrollProgress";

const INTENSITY = {
  subtle:   { rotate: 1.5, scale: 0.03, parallax: 15, opacity: 0.15 },
  medium:   { rotate: 3,   scale: 0.06, parallax: 30, opacity: 0.3  },
  dramatic: { rotate: 5,   scale: 0.10, parallax: 50, opacity: 0.5  },
};

export default function ScrollFloat({ children, index = 0, intensity = "medium" }) {
  const { ref, progress } = useScrollProgress("100px", "0px");
  const cfg = INTENSITY[intensity];

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Exponential ease-out with per-index stagger delay
  const eased = useMemo(() => {
    if (reducedMotion) return 1;
    const staggerDelay = index * 0.04;
    const adjusted = Math.max(0, Math.min(1, (progress - staggerDelay) / (1 - staggerDelay)));
    return 1 - Math.pow(2, -10 * adjusted);
  }, [progress, index, reducedMotion]);

  const rotateX = (1 - eased) * cfg.rotate;
  const rotateY = (1 - eased) * cfg.rotate * 0.5;
  const scale   = 1 - (1 - eased) * cfg.scale;
  const translateY = (1 - eased) * cfg.parallax;
  const opacity = 1 - (1 - eased) * cfg.opacity;
  const clipInset = (1 - eased) * 100;

  return (
    <div ref={ref} style={{
      transform: `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale}) translateY(${translateY}px)`,
      clipPath: eased < 0.99 ? `inset(${clipInset}% 0 0 0)` : "none",
      opacity,
      transformOrigin: "center bottom",
    }}>
      {children}
    </div>
  );
}
```

**Behavior**: Each section gets a unique scroll-scrubbed 3D float-in. The `index` prop staggers when each starts (`index * 0.04` progress offset). Combines 5 effects: rotateX/Y, scale, translateY, opacity, clip-path reveal from top.

---

## `src/app/academy/card-of-the-day/page.tsx` — flagship

```tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import VeilRevealWrapper from "../../../components/veil-reveal/VeilRevealWrapper";
import CardInfoPanel from "../../../components/veil-reveal/CardInfoPanel";
import { ALL_CARDS, type TarotCard } from "../../../lib/academy/tarot-cards";
import { getCardImagePath } from "../../../lib/academy/card-images";
import { recordDraw } from "../../../lib/deck-memory";

const EASE = [0.16, 1, 0.3, 1] as const;

function getDailyCard(): { card: TarotCard; reversed: boolean } {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const seed = dayOfYear * 2654435761;
  const idx = Math.abs(seed) % ALL_CARDS.length;
  const reversed = (Math.abs(seed >> 8) % 3) === 0;
  return { card: ALL_CARDS[idx], reversed };
}

function getCardNumeral(card: TarotCard): string {
  if (card.arcana === "major") {
    const n = ["0","I","II","III","IV","V","VI","VII","VIII","IX","X",
               "XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX","XXI"];
    return n[card.number] ?? String(card.number);
  }
  const ranks = ["","Ace","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Page","Knight","Queen","King"];
  return ranks[card.number] ?? String(card.number);
}

export default function CardOfTheDayPage() {
  const [mounted, setMounted] = useState(false);
  const [card, setCard] = useState<TarotCard>(ALL_CARDS[0]);
  const [reversed, setReversed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const infoPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const daily = getDailyCard();
    setCard(daily.card);
    setReversed(daily.reversed);
    setMounted(true);
  }, []);

  const handleRevealComplete = useCallback(() => {
    setRevealed(true);
    recordDraw(card.name);
    setTimeout(() => {
      infoPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 1000);
  }, [card.name]);

  const handleDrawAgain = useCallback(() => {
    setRevealed(false);
    let newIdx: number;
    const currentIdx = ALL_CARDS.indexOf(card);
    do {
      newIdx = Math.floor(Math.random() * ALL_CARDS.length);
    } while (newIdx === currentIdx);
    setCard(ALL_CARDS[newIdx]);
    setReversed(Math.random() < 0.33);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [card]);

  if (!mounted) return <div style={{ minHeight: "100vh", background: "var(--c-void, #04020d)" }} />;

  return (
    <div style={{ background: "var(--c-void, #04020d)" }}>
      <VeilRevealWrapper
        cardImagePath={getCardImagePath(card)}
        cardName={card.name}
        cardNumeral={getCardNumeral(card)}
        onRevealComplete={handleRevealComplete}
        onDrawAgain={handleDrawAgain}
      />

      <AnimatePresence>
        {revealed && (
          <motion.div
            ref={infoPanelRef}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.3 }}
            style={{ padding: "2rem 1rem 6rem", background: "var(--c-void, #04020d)" }}
          >
            <CardInfoPanel card={card} reversed={reversed} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

For the `VeilRevealWrapper` → `VeilRevealScene` engine (1,926 lines total — Three.js PBD cloth, 4 GLSL shaders, 7-second choreography), see `01-veil-card-of-the-day.md`.

---

## Environment

```bash
# Required env vars (.env.local)
NEXT_PUBLIC_API_URL=https://<railway-fastapi-url>
NEXT_PUBLIC_SUPABASE_URL=<supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

## Package versions (key)

```json
{
  "dependencies": {
    "next": "16.2.2",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "three": "^0.183.2",
    "@react-three/fiber": "^9.5.0",
    "@react-three/drei": "^10.7.7",
    "framer-motion": "^12.38.0",
    "@supabase/supabase-js": "^2.102.1",
    "lenis": "^1.3.21",
    "3dsvg": "^0.2.1",
    "html2canvas": "^1.4.1",
    "@fontsource/cormorant-garamond": "^5.2.11",
    "@fontsource/inter": "^5.2.8",
    "@fontsource/playfair-display": "^5.2.8"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```
