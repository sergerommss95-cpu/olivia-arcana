# Legal Protection System — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete legal foundation for oliviaarcana.com — legal pages, cookie consent, age gate, checkout consent logging, footer update, and security headers — so the site is legally protected before payments go live.

**Architecture:** Client-side protection modules in `lib/legal/` (pure TS, no React) consumed by UI components in `components/legal/`. Legal pages are static Next.js pages. Backend (FastAPI) handles consent logging and IP extraction. All frontend runs client-side (static export, no SSR/middleware).

**Tech Stack:** Next.js 16 (static export), React 19, Tailwind 4, TypeScript, FastAPI, SQLAlchemy async, Stripe

**Spec:** `docs/superpowers/specs/2026-04-13-legal-protection-design.md`

**Existing patterns to follow:**
- All interactive components use `"use client"` directive
- Use `useLocale()` hook for translations: `const { locale, t } = useLocale()`
- Styling: Tailwind classes + CSS variables (`--c-void`, `--c-gold`, `--c-text-primary`, `--c-text-muted`)
- Glass morphism: `.glass-card` class
- Internal links: `TransitionLink` (default export from `@/components/transitions/TransitionLink`). For external-tab links use raw `<a>` tags.
- Fonts: Cormorant Garamond (`--font-heading`), DM Sans (`--font-body`)
- Footer uses `useLocale()`, all text from translations
- CheckoutButton uses `MagneticButton` for styling

---

## File Map

### Files to Create

| File | Responsibility |
|------|---------------|
| `website/src/lib/legal/constants.ts` | All legal copy, disclaimer text, prohibited phrases, replacement map |
| `website/src/lib/legal/cookie-utils.ts` | Shared getCookie/setCookie/deleteCookie helpers |
| `website/src/lib/legal/cookie-consent.ts` | Cookie consent read/write/check engine |
| `website/src/lib/legal/age-gate.ts` | Age verification cookie logic + route list |
| `website/src/lib/legal/checkout-consent.ts` | Consent record builder + POST to backend |
| `website/src/lib/legal/jurisdiction.ts` | Locale → jurisdiction mapping |
| `website/src/lib/legal/index.ts` | Re-exports all modules |
| `website/src/components/legal/LegalPageLayout.tsx` | Shared layout for all 5 legal pages |
| `website/src/components/legal/BindingLanguageBanner.tsx` | "English is binding" translated banner |
| `website/src/components/legal/CookieBanner.tsx` | GDPR consent banner UI |
| `website/src/components/legal/AgeGate.tsx` | Full-screen 18+ overlay |
| `website/src/components/legal/CheckoutConsent.tsx` | Two-checkbox consent block |
| `website/src/components/legal/SafeDisclaimer.tsx` | Reusable disclaimer component |
| `website/src/components/legal/ProtectedLayout.tsx` | Wrapper that gates content behind age check |
| `website/src/app/terms/page.tsx` | Terms of Service page |
| `website/src/app/privacy/page.tsx` | Privacy Policy page |
| `website/src/app/cookies/page.tsx` | Cookie Policy page |
| `website/src/app/disclaimer/page.tsx` | Disclaimer page |
| `website/src/app/dmca/page.tsx` | DMCA Policy page |
| `website/public/robots.txt` | Crawler directives |
| `website/public/sitemap.xml` | Public page sitemap |
| `backend/api/consent.py` | POST /api/payments/consent-log endpoint |

### Files to Modify

| File | Change |
|------|--------|
| `website/src/components/Footer.tsx` | Add legal links row, cookie settings link, updated copyright |
| `website/src/lib/i18n/translations.ts` | Add legal translation keys (footer links, binding banner, age gate, consent labels) |
| `website/src/components/ClientShell.tsx` | Add CookieBanner to global overlays |
| `website/src/app/layout.tsx` | Add copyright/author meta tags |
| `website/src/components/Pricing.tsx` | Wrap CheckoutButton with CheckoutConsent |
| `website/src/components/CheckoutButton.tsx` | Accept `disabled` prop from CheckoutConsent |
| `website/netlify.toml` | Add security headers |
| `backend/db/models.py` | Add ConsentLog model |
| `backend/main.py` | Register consent router |

---

## Task 1: Legal Constants Module

**Files:**
- Create: `website/src/lib/legal/constants.ts`

This is the foundation — all other tasks depend on it. Contains legal copy, cookie names, route lists, disclaimer text.

- [ ] **Step 1: Create the constants file with legal copy**

Create `website/src/lib/legal/constants.ts` with:

```typescript
// Legal entity info
export const ENTITY_NAME = "Olivia Arcana LLC"
export const ENTITY_STATE = "Wyoming, USA"
export const SUPPORT_EMAIL = "support@oliviaarcana.com"
export const PRIVACY_EMAIL = "privacy@oliviaarcana.com"
export const LAST_UPDATED = "2026-04-13"

// Cookie names
export const COOKIE_CONSENT = "oa_consent"
export const COOKIE_CONSENT_DETAIL = "oa_consent_detail"
export const COOKIE_AGE_VERIFIED = "oa_age_verified"
export const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 // 365 days in seconds

// Routes that require age gate
export const AGE_GATE_ROUTES = [
  "/ask", "/chart", "/oracle", "/cosmos", "/daily",
  "/journal", "/portrait", "/profile", "/synastry",
  "/timing", "/transits", "/account", "/checkout",
]

// Routes exempt from age gate
export const AGE_GATE_EXEMPT = [
  "/", "/about", "/contact", "/terms", "/privacy",
  "/cookies", "/disclaimer", "/dmca", "/unsubscribe",
  "/signs", "/login", "/register", "/onboarding",
  "/academy", "/story", "/oracle-letter",
]

// Standard disclaimer (compact)
export const DISCLAIMER_COMPACT =
  "All readings are for entertainment purposes only."

// Standard disclaimer (full)
export const DISCLAIMER_FULL =
  "This reading is for entertainment and personal reflection only. It does not constitute medical, legal, financial, or psychological advice. Individual experiences vary. Always trust your own judgment and consult a qualified professional for important decisions."

// Entertainment disclaimer (Terms Clause 1)
export const ENTERTAINMENT_DISCLAIMER =
  "All services provided on oliviaarcana.com, including but not limited to tarot readings, astrology consultations, oracle guidance, and spiritual coaching, are provided for ENTERTAINMENT AND PERSONAL INSIGHT PURPOSES ONLY. They do not constitute and should not be interpreted as professional medical, psychological, financial, legal, or any other licensed professional advice. Individual results may vary and no specific outcome is guaranteed."

// Binding language banner translations
export const BINDING_LANGUAGE_BANNERS: Record<string, string> = {
  uk: "Цей документ доступний лише англійською мовою. Англійська версія є юридично обов'язковою.",
  ru: "Этот документ доступен только на английском языке. Английская версия является юридически обязательной.",
  de: "Dieses Dokument ist nur auf Englisch verfügbar. Die englische Version ist rechtlich bindend.",
  fr: "Ce document est disponible uniquement en anglais. La version anglaise fait foi.",
  ar: "هذا المستند متاح باللغة الإنجليزية فقط. النسخة الإنجليزية هي النسخة الملزمة قانونياً.",
  es: "Este documento está disponible solo en inglés. La versión en inglés es la legalmente vinculante.",
  zh: "本文件仅提供英文版本。英文版本为具有法律约束力的版本。",
  pt: "Este documento está disponível apenas em inglês. A versão em inglês é a legalmente vinculante.",
}
```

- [ ] **Step 2: Commit**

```bash
git add website/src/lib/legal/constants.ts
git commit -m "feat(legal): add constants module with legal copy, cookie names, route lists"
```

---

## Task 2: Shared Cookie Utilities

**Files:**
- Create: `website/src/lib/legal/cookie-utils.ts`

Shared cookie read/write/delete helpers used by both cookie-consent and age-gate modules.

- [ ] **Step 1: Create cookie-utils.ts**

```typescript
export function setCookie(name: string, value: string, maxAge: number): void {
  const secure = window.location.protocol === "https:" ? ";Secure" : ""
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax${secure}`
}

export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function deleteCookie(name: string): void {
  document.cookie = `${name}=;path=/;max-age=0`
}
```

- [ ] **Step 2: Commit**

```bash
git add website/src/lib/legal/cookie-utils.ts
git commit -m "feat(legal): add shared cookie utility functions"
```

---

## Task 3: Cookie Consent Engine

**Files:**
- Create: `website/src/lib/legal/cookie-consent.ts`

Pure TypeScript module — no React. Reads/writes cookies, checks consent state.

- [ ] **Step 1: Create cookie-consent.ts**

```typescript
import { COOKIE_CONSENT, COOKIE_CONSENT_DETAIL, COOKIE_MAX_AGE } from "./constants"
import { getCookie, setCookie, deleteCookie } from "./cookie-utils"

export type ConsentState = "accepted" | "rejected" | "custom"
export type ConsentDetail = { analytics: boolean; preferences: boolean }

export function getConsent(): ConsentState | null {
  const value = getCookie(COOKIE_CONSENT)
  if (value === "accepted" || value === "rejected" || value === "custom") return value
  return null
}

export function getConsentDetail(): ConsentDetail {
  const raw = getCookie(COOKIE_CONSENT_DETAIL)
  if (!raw) return { analytics: false, preferences: false }
  try {
    return JSON.parse(raw)
  } catch {
    return { analytics: false, preferences: false }
  }
}

export function setConsent(state: ConsentState, detail?: ConsentDetail): void {
  setCookie(COOKIE_CONSENT, state, COOKIE_MAX_AGE)
  if (detail) {
    setCookie(COOKIE_CONSENT_DETAIL, JSON.stringify(detail), COOKIE_MAX_AGE)
  } else if (state === "accepted") {
    setCookie(COOKIE_CONSENT_DETAIL, JSON.stringify({ analytics: true, preferences: true }), COOKIE_MAX_AGE)
  } else if (state === "rejected") {
    setCookie(COOKIE_CONSENT_DETAIL, JSON.stringify({ analytics: false, preferences: false }), COOKIE_MAX_AGE)
  }
}

export function hasConsent(category: keyof ConsentDetail): boolean {
  const detail = getConsentDetail()
  return detail[category] === true
}

export function resetConsent(): void {
  deleteCookie(COOKIE_CONSENT)
  deleteCookie(COOKIE_CONSENT_DETAIL)
}

export function loadGoogleAnalytics(measurementId: string): void {
  if (document.querySelector(`script[src*="googletagmanager"]`)) return
  const script = document.createElement("script")
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  script.async = true
  document.head.appendChild(script)
  const inline = document.createElement("script")
  inline.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${measurementId}');`
  document.head.appendChild(inline)
}
```

- [ ] **Step 2: Commit**

```bash
git add website/src/lib/legal/cookie-consent.ts
git commit -m "feat(legal): add cookie consent engine with read/write/check/reset"
```

---

## Task 3: Age Gate Module

**Files:**
- Create: `website/src/lib/legal/age-gate.ts`

- [ ] **Step 1: Create age-gate.ts**

```typescript
import { COOKIE_AGE_VERIFIED, COOKIE_MAX_AGE, AGE_GATE_ROUTES } from "./constants"
import { getCookie, setCookie } from "./cookie-utils"

export function isAgeVerified(): boolean {
  return getCookie(COOKIE_AGE_VERIFIED) === "true"
}

export function setAgeVerified(): void {
  setCookie(COOKIE_AGE_VERIFIED, "true", COOKIE_MAX_AGE)
}

export function needsAgeGate(pathname: string): boolean {
  const clean = pathname.replace(/\/$/, "") || "/"
  return AGE_GATE_ROUTES.some(
    (route) => clean === route || clean.startsWith(route + "/")
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add website/src/lib/legal/age-gate.ts
git commit -m "feat(legal): add age gate module with cookie check and route matching"
```

---

## Task 4: Checkout Consent Logger

**Files:**
- Create: `website/src/lib/legal/checkout-consent.ts`

- [ ] **Step 1: Create checkout-consent.ts**

```typescript
export interface ConsentRecord {
  timestamp: string
  checkbox_age: boolean
  checkbox_terms: boolean
  user_agent: string
  product_id: string
  stripe_session_id: string
}

export function buildConsentRecord(
  product_id: string,
  stripe_session_id: string
): ConsentRecord {
  return {
    timestamp: new Date().toISOString(),
    checkbox_age: true,
    checkbox_terms: true,
    user_agent: navigator.userAgent,
    product_id,
    stripe_session_id,
  }
}

export async function logConsent(
  record: ConsentRecord,
  apiUrl: string
): Promise<void> {
  try {
    await fetch(`${apiUrl}/api/payments/consent-log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    })
  } catch (err) {
    // Consent logging should not block checkout — log error silently
    console.error("Failed to log consent:", err)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add website/src/lib/legal/checkout-consent.ts
git commit -m "feat(legal): add checkout consent logger with record builder and API call"
```

---

## Task 5: Jurisdiction Detector

**Files:**
- Create: `website/src/lib/legal/jurisdiction.ts`

- [ ] **Step 1: Create jurisdiction.ts**

```typescript
export type Jurisdiction =
  | "gdpr"
  | "lgpd"
  | "pipl"
  | "general"

const LOCALE_JURISDICTION_MAP: Record<string, Jurisdiction> = {
  de: "gdpr",
  fr: "gdpr",
  es: "gdpr",
  pt: "lgpd",
  zh: "pipl",
  en: "general",
  uk: "general",
  ru: "general",
  ar: "general",
}

export function detectJurisdiction(locale: string): Jurisdiction {
  return LOCALE_JURISDICTION_MAP[locale] ?? "general"
}

export function getJurisdictionLabel(jurisdiction: Jurisdiction): string {
  switch (jurisdiction) {
    case "gdpr": return "EU General Data Protection Regulation (GDPR)"
    case "lgpd": return "Brazil Lei Geral de Proteção de Dados (LGPD)"
    case "pipl": return "China Personal Information Protection Law (PIPL)"
    case "general": return "Global Data Protection Rights"
  }
}

// Returns section IDs to highlight on the Privacy Policy page
export function getApplicableRights(jurisdiction: Jurisdiction): string[] {
  switch (jurisdiction) {
    case "gdpr": return ["gdpr-rights"]
    case "lgpd": return ["lgpd-rights"]
    case "pipl": return ["pipl-rights"]
    case "general": return [] // Show all equally, no highlight
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add website/src/lib/legal/jurisdiction.ts
git commit -m "feat(legal): add jurisdiction detector mapping locale to privacy regime"
```

---

## Task 6: Index Re-export

**Files:**
- Create: `website/src/lib/legal/index.ts`

- [ ] **Step 1: Create index.ts**

```typescript
export * from "./constants"
export * from "./cookie-utils"
export * from "./cookie-consent"
export * from "./age-gate"
export * from "./checkout-consent"
export * from "./jurisdiction"
```

- [ ] **Step 2: Commit**

```bash
git add website/src/lib/legal/index.ts
git commit -m "feat(legal): add barrel export for legal modules"
```

---

## Task 7: i18n Translation Keys

**Files:**
- Modify: `website/src/lib/i18n/translations.ts`

Add legal-related translation keys to all 9 locales. These are needed by Footer, CookieBanner, AgeGate, and CheckoutConsent.

- [ ] **Step 1: Add legal keys to the English translation object**

Find the `en` translation object and add these keys at the end (before the closing brace):

```typescript
// Legal
legal_terms: "Terms of Service",
legal_privacy: "Privacy Policy",
legal_cookies: "Cookie Policy",
legal_disclaimer: "Disclaimer",
legal_dmca: "DMCA",
legal_contact: "Contact",
legal_cookie_settings: "Cookie Settings",
legal_copyright: "All rights reserved.",
legal_entertainment: "All readings are for entertainment purposes only.",
// Cookie Banner
cookie_title: "We use cookies",
cookie_description: "We use cookies to improve your experience. You can manage your preferences at any time.",
cookie_accept: "Accept All",
cookie_reject: "Reject Non-Essential",
cookie_manage: "Manage Preferences",
cookie_analytics: "Analytics",
cookie_preferences: "Preferences",
cookie_save: "Save Preferences",
// Age Gate
age_title: "This content is for adults aged 18 and over.",
age_enter: "I am 18 or older — Enter",
age_exit: "I am under 18 — Exit",
// Checkout Consent
consent_age: "I confirm I am 18 years of age or older.",
consent_terms: "I have read and agree to the Terms of Service, Privacy Policy, and Disclaimer, and I understand that all services are for entertainment purposes only.",
```

- [ ] **Step 2: Add the same keys (translated) to all 8 other locale objects**

Add equivalent translated keys to `uk`, `ru`, `de`, `fr`, `ar`, `es`, `zh`, `pt` objects. Use appropriate translations for each language. The key names stay the same — only values change.

- [ ] **Step 3: Commit**

```bash
git add website/src/lib/i18n/translations.ts
git commit -m "feat(i18n): add legal, cookie, age gate, consent translation keys for all 9 locales"
```

---

## Task 8: BindingLanguageBanner Component

**Files:**
- Create: `website/src/components/legal/BindingLanguageBanner.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client"

import { useLocale } from "@/lib/i18n/useLocale"
import { BINDING_LANGUAGE_BANNERS } from "@/lib/legal/constants"

export function BindingLanguageBanner() {
  const { locale } = useLocale()

  if (locale === "en") return null

  const message = BINDING_LANGUAGE_BANNERS[locale]
  if (!message) return null

  return (
    <div className="mb-8 rounded-lg border border-[var(--c-gold)]/20 bg-[var(--c-gold)]/5 px-4 py-3">
      <p className="text-sm text-[var(--c-text-muted)]">
        <span className="mr-2">ℹ</span>
        {message}
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add website/src/components/legal/BindingLanguageBanner.tsx
git commit -m "feat(legal): add BindingLanguageBanner component with 8-locale translations"
```

---

## Task 9: LegalPageLayout Component

**Files:**
- Create: `website/src/components/legal/LegalPageLayout.tsx`

- [ ] **Step 1: Create the shared legal page layout**

```tsx
"use client"

import { useState } from "react"
import { useLocale } from "@/lib/i18n/useLocale"
import { BindingLanguageBanner } from "./BindingLanguageBanner"
import { LAST_UPDATED } from "@/lib/legal/constants"
import TransitionLink from "@/components/transitions/TransitionLink"

interface TocItem {
  id: string
  label: string
}

interface LegalPageLayoutProps {
  title: string
  children: React.ReactNode
  lastUpdated?: string
  toc?: TocItem[]  // Table of contents entries — pass [{id: "clause-1", label: "Entertainment Disclaimer"}, ...]
}

export function LegalPageLayout({ title, children, lastUpdated = LAST_UPDATED, toc }: LegalPageLayoutProps) {
  const { t } = useLocale()
  const [tocOpen, setTocOpen] = useState(false)

  return (
    <main className="min-h-screen bg-[var(--c-void)] pt-24 pb-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:flex lg:gap-8">

        {/* Table of Contents — sticky sidebar on desktop, collapsible on mobile */}
        {toc && toc.length > 0 && (
          <>
            {/* Mobile: collapsible */}
            <div className="mb-6 lg:hidden">
              <button
                onClick={() => setTocOpen(!tocOpen)}
                className="flex items-center gap-2 text-sm text-[var(--c-gold)]"
              >
                <span>{tocOpen ? "▾" : "▸"}</span> Table of Contents
              </button>
              {tocOpen && (
                <nav className="mt-2 space-y-1 border-l border-[var(--c-gold)]/20 pl-3">
                  {toc.map((item) => (
                    <a key={item.id} href={`#${item.id}`}
                      className="block text-xs text-[var(--c-text-muted)] hover:text-[var(--c-gold)]"
                      onClick={() => setTocOpen(false)}>
                      {item.label}
                    </a>
                  ))}
                </nav>
              )}
            </div>

            {/* Desktop: sticky sidebar */}
            <nav className="hidden lg:block lg:w-56 lg:shrink-0">
              <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto space-y-1 border-l border-[var(--c-gold)]/20 pl-3">
                <p className="mb-2 text-xs font-medium text-[var(--c-gold)]">Contents</p>
                {toc.map((item) => (
                  <a key={item.id} href={`#${item.id}`}
                    className="block text-xs text-[var(--c-text-muted)] hover:text-[var(--c-gold)] py-0.5">
                    {item.label}
                  </a>
                ))}
              </div>
            </nav>
          </>
        )}

        <div className={toc ? "lg:flex-1 lg:min-w-0" : "max-w-3xl mx-auto"}>
        <BindingLanguageBanner />

        <h1 className="mb-8 font-[family-name:var(--font-heading)] text-3xl sm:text-4xl text-[var(--c-gold)]">
          {title}
        </h1>

        <div className="prose prose-invert prose-gold max-w-none space-y-6 text-[var(--c-text-primary)]
          [&_h2]:font-[family-name:var(--font-heading)] [&_h2]:text-xl [&_h2]:text-[var(--c-gold)] [&_h2]:mt-10 [&_h2]:mb-4
          [&_h3]:text-lg [&_h3]:text-[var(--c-text-primary)] [&_h3]:mt-6 [&_h3]:mb-2
          [&_a]:text-[var(--c-gold)] [&_a]:underline [&_a]:underline-offset-2
          [&_ul]:list-disc [&_ul]:pl-6 [&_li]:text-[var(--c-text-muted)]
          [&_strong]:text-[var(--c-text-primary)]
          [&_p]:text-[var(--c-text-muted)] [&_p]:leading-relaxed">
          {children}
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <p className="text-xs text-[var(--c-text-muted)]">
            Last updated: {lastUpdated}
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-[var(--c-gold)]">
            <TransitionLink href="/terms">{t("legal_terms")}</TransitionLink>
            <TransitionLink href="/privacy">{t("legal_privacy")}</TransitionLink>
            <TransitionLink href="/cookies">{t("legal_cookies")}</TransitionLink>
            <TransitionLink href="/disclaimer">{t("legal_disclaimer")}</TransitionLink>
            <TransitionLink href="/dmca">{t("legal_dmca")}</TransitionLink>
            <TransitionLink href="/contact">{t("legal_contact")}</TransitionLink>
          </div>
          <div className="mt-2">
            <TransitionLink href="/" className="text-xs text-[var(--c-text-muted)] hover:text-[var(--c-gold)]">
              ← Back to home
            </TransitionLink>
          </div>
        </div>
        </div>{/* close conditional content wrapper */}
      </div>
    </main>
  )
}
```

Each legal page passes a `toc` array. Example for Terms: `toc={[{id: "entertainment-disclaimer", label: "1. Entertainment Disclaimer"}, {id: "acceptance", label: "2. Acceptance"}, ...]}`. Each `<h2>` in the page content should have a matching `id` attribute.

- [ ] **Step 2: Commit**

```bash
git add website/src/components/legal/LegalPageLayout.tsx
git commit -m "feat(legal): add LegalPageLayout with TOC sidebar, binding banner, prose styling"
```

---

## Task 10: Terms of Service Page

**Files:**
- Create: `website/src/app/terms/page.tsx`

- [ ] **Step 1: Create the Terms page**

Write a full `"use client"` page component that uses `LegalPageLayout` and renders all 12 clauses from the spec (Section 3.1). Each clause is an `<h2>` with body text. Clause 1 (Entertainment Disclaimer) should be in a highlighted box with larger text. All email addresses should be `<a href="mailto:...">` links. Document links (Privacy Policy, Disclaimer) should use `TransitionLink`.

The full clause content comes from the spec — write it all out inline in JSX. This is a long file but it's just static content.

- [ ] **Step 2: Verify the page renders**

```bash
cd /Users/macbookpro/olivia-arcana/website && npm run dev
```

Open `http://localhost:3000/terms/` in browser. Verify:
- Page renders with dark background, gold heading
- All 12 clauses visible
- Links work
- BindingLanguageBanner shows when switching locale

- [ ] **Step 3: Commit**

```bash
git add website/src/app/terms/page.tsx
git commit -m "feat(legal): add Terms of Service page with 12 clauses"
```

---

## Task 11: Privacy Policy Page

**Files:**
- Create: `website/src/app/privacy/page.tsx`

- [ ] **Step 1: Create the Privacy Policy page**

Full `"use client"` page using `LegalPageLayout`. Render all 12 sections from spec Section 3.2. Use `useLocale()` to get the locale, pass it to `detectJurisdiction()`, and show a highlighted callout on the relevant rights section. Import from `@/lib/legal`.

- [ ] **Step 2: Verify renders correctly**

- [ ] **Step 3: Commit**

```bash
git add website/src/app/privacy/page.tsx
git commit -m "feat(legal): add Privacy Policy page with jurisdiction-aware rights callouts"
```

---

## Task 12: Cookie Policy Page

**Files:**
- Create: `website/src/app/cookies/page.tsx`

- [ ] **Step 1: Create the Cookie Policy page**

`"use client"` page using `LegalPageLayout`. Render the cookie table from spec Section 3.3 as an HTML `<table>` with columns: Cookie, Category, Purpose, Duration, Consent Required. Include opt-out instructions.

- [ ] **Step 2: Commit**

```bash
git add website/src/app/cookies/page.tsx
git commit -m "feat(legal): add Cookie Policy page with cookie inventory table"
```

---

## Task 13: Disclaimer Page

**Files:**
- Create: `website/src/app/disclaimer/page.tsx`

- [ ] **Step 1: Create the Disclaimer page**

`"use client"` page using `LegalPageLayout`. Render all 7 sections from spec Section 3.4. Section 1 (Entertainment Only) uses the `ENTERTAINMENT_DISCLAIMER` constant from `constants.ts`. Section 4 (Age Restriction) uses bold, large text.

- [ ] **Step 2: Commit**

```bash
git add website/src/app/disclaimer/page.tsx
git commit -m "feat(legal): add Disclaimer page with 7 sections"
```

---

## Task 14: DMCA Policy Page

**Files:**
- Create: `website/src/app/dmca/page.tsx`

- [ ] **Step 1: Create the DMCA page**

`"use client"` page using `LegalPageLayout`. Content from spec Section 3.5: DMCA 512(c) statement, takedown notice requirements, counter-notification, repeat infringer policy.

- [ ] **Step 2: Commit**

```bash
git add website/src/app/dmca/page.tsx
git commit -m "feat(legal): add DMCA Policy page"
```

---

## Task 15: CookieBanner Component

**Files:**
- Create: `website/src/components/legal/CookieBanner.tsx`

- [ ] **Step 1: Create CookieBanner**

```tsx
"use client"

import { useEffect, useState } from "react"
import { useLocale } from "@/lib/i18n/useLocale"
import { getConsent, setConsent, hasConsent, loadGoogleAnalytics, type ConsentDetail } from "@/lib/legal/cookie-consent"
import TransitionLink from "@/components/transitions/TransitionLink"

export function CookieBanner() {
  const { t } = useLocale()
  const [visible, setVisible] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [preferences, setPreferences] = useState(false)

  useEffect(() => {
    const consent = getConsent()
    if (consent === null) {
      setVisible(true)
    } else if (consent === "accepted" || (consent === "custom" && hasConsent("analytics"))) {
      loadGoogleAnalytics(process.env.NEXT_PUBLIC_GA_ID ?? "")
    }

    // Register global function for footer "Cookie Settings" link
    ;(window as any).openCookieBanner = () => {
      setVisible(true)
      setShowPreferences(false)
    }

    return () => {
      delete (window as any).openCookieBanner
    }
  }, [])

  if (!visible) return null

  const handleAccept = () => {
    setConsent("accepted")
    loadGoogleAnalytics(process.env.NEXT_PUBLIC_GA_ID ?? "")
    setVisible(false)
  }

  const handleReject = () => {
    setConsent("rejected")
    setVisible(false)
  }

  const handleSavePreferences = () => {
    const detail: ConsentDetail = { analytics, preferences }
    setConsent("custom", detail)
    if (analytics) loadGoogleAnalytics(process.env.NEXT_PUBLIC_GA_ID ?? "")
    setVisible(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-[var(--c-gold)]/30 bg-[var(--c-void)]/95 backdrop-blur-md p-4 sm:p-6"
      role="dialog" aria-label="Cookie consent">
      <div className="mx-auto max-w-4xl">
        <p className="mb-4 text-sm text-[var(--c-text-muted)]">
          {t("cookie_description")}{" "}
          <TransitionLink href="/privacy" className="text-[var(--c-gold)] underline">{t("legal_privacy")}</TransitionLink>
          {" · "}
          <TransitionLink href="/cookies" className="text-[var(--c-gold)] underline">{t("legal_cookies")}</TransitionLink>
        </p>

        {showPreferences && (
          <div className="mb-4 space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
            <label className="flex items-center gap-3 text-sm text-[var(--c-text-primary)] cursor-pointer">
              <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)}
                className="accent-[var(--c-gold)] h-4 w-4" />
              {t("cookie_analytics")}
            </label>
            <label className="flex items-center gap-3 text-sm text-[var(--c-text-primary)] cursor-pointer">
              <input type="checkbox" checked={preferences} onChange={(e) => setPreferences(e.target.checked)}
                className="accent-[var(--c-gold)] h-4 w-4" />
              {t("cookie_preferences")}
            </label>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {showPreferences ? (
            <button onClick={handleSavePreferences}
              className="rounded-full bg-[var(--c-gold)] px-6 py-2 text-sm font-medium text-[var(--c-void)]">
              {t("cookie_save")}
            </button>
          ) : (
            <>
              <button onClick={handleAccept}
                className="rounded-full bg-[var(--c-gold)] px-6 py-2 text-sm font-medium text-[var(--c-void)]">
                {t("cookie_accept")}
              </button>
              <button onClick={handleReject}
                className="rounded-full border border-[var(--c-gold)] px-6 py-2 text-sm font-medium text-[var(--c-gold)]">
                {t("cookie_reject")}
              </button>
              <button onClick={() => setShowPreferences(true)}
                className="px-6 py-2 text-sm text-[var(--c-gold)] underline underline-offset-2">
                {t("cookie_manage")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add website/src/components/legal/CookieBanner.tsx
git commit -m "feat(legal): add CookieBanner with accept/reject/manage preferences"
```

---

## Task 16: AgeGate Component

**Files:**
- Create: `website/src/components/legal/AgeGate.tsx`

- [ ] **Step 1: Create AgeGate**

```tsx
"use client"

import { useEffect, useCallback } from "react"
import { useLocale } from "@/lib/i18n/useLocale"
import { setAgeVerified } from "@/lib/legal/age-gate"

interface AgeGateProps {
  onVerified: () => void
}

export function AgeGate({ onVerified }: AgeGateProps) {
  const { t } = useLocale()

  const handleEnter = useCallback(() => {
    setAgeVerified()
    onVerified()
  }, [onVerified])

  const handleExit = useCallback(() => {
    window.location.href = "https://www.google.com"
  }, [])

  // Block Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") e.preventDefault()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[rgba(5,4,20,0.97)] animate-in fade-in duration-300">
      <div className="mx-4 max-w-md rounded-2xl border border-[var(--c-gold)]/30 bg-[var(--c-void)] p-8 text-center shadow-2xl">
        <div className="mb-6 font-[family-name:var(--font-heading)] text-2xl text-[var(--c-gold)]">
          Olivia Arcana
        </div>
        <p className="mb-8 text-[var(--c-text-primary)]">
          {t("age_title")}
        </p>
        <div className="flex flex-col gap-3">
          <button onClick={handleEnter}
            className="rounded-full bg-[var(--c-gold)] px-8 py-3 font-medium text-[var(--c-void)] transition-opacity hover:opacity-90">
            {t("age_enter")}
          </button>
          <button onClick={handleExit}
            className="rounded-full border border-[var(--c-gold)] px-8 py-3 font-medium text-[var(--c-gold)] transition-opacity hover:opacity-90">
            {t("age_exit")}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add website/src/components/legal/AgeGate.tsx
git commit -m "feat(legal): add AgeGate full-screen overlay component"
```

---

## Task 17: ProtectedLayout Component

**Files:**
- Create: `website/src/components/legal/ProtectedLayout.tsx`

This wraps protected route content and gates it behind age verification.

- [ ] **Step 1: Create ProtectedLayout**

```tsx
"use client"

import { useEffect, useState } from "react"
import { isAgeVerified, needsAgeGate } from "@/lib/legal/age-gate"
import { AgeGate } from "./AgeGate"
import { usePathname } from "next/navigation"

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [verified, setVerified] = useState<boolean | null>(null)

  useEffect(() => {
    if (needsAgeGate(pathname)) {
      setVerified(isAgeVerified())
    } else {
      setVerified(true)
    }
  }, [pathname])

  // Loading state — don't flash content
  if (verified === null) return null

  if (!verified) {
    return <AgeGate onVerified={() => setVerified(true)} />
  }

  return <>{children}</>
}
```

- [ ] **Step 2: Commit**

```bash
git add website/src/components/legal/ProtectedLayout.tsx
git commit -m "feat(legal): add ProtectedLayout wrapper for age-gated routes"
```

---

## Task 18: SafeDisclaimer Component

**Files:**
- Create: `website/src/components/legal/SafeDisclaimer.tsx`

- [ ] **Step 1: Create SafeDisclaimer**

```tsx
import { DISCLAIMER_COMPACT, DISCLAIMER_FULL } from "@/lib/legal/constants"

interface SafeDisclaimerProps {
  variant?: "compact" | "full"
}

export function SafeDisclaimer({ variant = "compact" }: SafeDisclaimerProps) {
  if (variant === "compact") {
    return (
      <p className="text-xs text-[var(--c-text-muted)]/60">
        {DISCLAIMER_COMPACT}
      </p>
    )
  }

  return (
    <div className="mt-6 border-l-2 border-[var(--c-gold)]/30 pl-4 py-2">
      <p className="text-sm text-[var(--c-text-muted)] leading-relaxed">
        {DISCLAIMER_FULL}
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add website/src/components/legal/SafeDisclaimer.tsx
git commit -m "feat(legal): add SafeDisclaimer component with compact/full variants"
```

---

## Task 19: CheckoutConsent Component

**Files:**
- Create: `website/src/components/legal/CheckoutConsent.tsx`

- [ ] **Step 1: Create CheckoutConsent**

```tsx
"use client"

import { useState } from "react"
import { useLocale } from "@/lib/i18n/useLocale"

interface CheckoutConsentProps {
  children: (props: { disabled: boolean }) => React.ReactNode
}

export function CheckoutConsent({ children }: CheckoutConsentProps) {
  const { t } = useLocale()
  const [ageChecked, setAgeChecked] = useState(false)
  const [termsChecked, setTermsChecked] = useState(false)

  const disabled = !ageChecked || !termsChecked

  return (
    <div>
      <div className="mb-4 space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={ageChecked}
            onChange={(e) => setAgeChecked(e.target.checked)}
            className="mt-0.5 accent-[var(--c-gold)] h-4 w-4 shrink-0"
          />
          <span className="text-sm text-[var(--c-text-muted)]">
            {t("consent_age")}
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={termsChecked}
            onChange={(e) => setTermsChecked(e.target.checked)}
            className="mt-0.5 accent-[var(--c-gold)] h-4 w-4 shrink-0"
          />
          <span className="text-sm text-[var(--c-text-muted)]">
            I have read and agree to the{" "}
            <a href="/terms" target="_blank" rel="noopener" className="text-[var(--c-gold)] underline">
              Terms of Service
            </a>
            ,{" "}
            <a href="/privacy" target="_blank" rel="noopener" className="text-[var(--c-gold)] underline">
              Privacy Policy
            </a>
            , and{" "}
            <a href="/disclaimer" target="_blank" rel="noopener" className="text-[var(--c-gold)] underline">
              Disclaimer
            </a>
            , and I understand that all services are for entertainment purposes only.
          </span>
        </label>
      </div>

      <div style={{ opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? "none" : "auto" }}>
        {children({ disabled })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add website/src/components/legal/CheckoutConsent.tsx
git commit -m "feat(legal): add CheckoutConsent two-checkbox component with render prop"
```

---

## Task 20: Integrate CookieBanner into ClientShell

**Files:**
- Modify: `website/src/components/ClientShell.tsx`

- [ ] **Step 1: Add CookieBanner import and render**

Add `import { CookieBanner } from "@/components/legal/CookieBanner"` at the top.

Add `<CookieBanner />` inside the ClientShell JSX, after all other overlays (before the closing fragment/wrapper). It should be the last child so it renders on top.

- [ ] **Step 2: Commit**

```bash
git add website/src/components/ClientShell.tsx
git commit -m "feat(legal): integrate CookieBanner into ClientShell global overlays"
```

---

## Task 21: Integrate ProtectedLayout into ClientShell

**Files:**
- Modify: `website/src/components/ClientShell.tsx`

- [ ] **Step 1: Wrap children with ProtectedLayout**

Add `import { ProtectedLayout } from "@/components/legal/ProtectedLayout"` at the top.

Find where `{children}` is rendered in ClientShell. It appears in two places:

1. Inside `<PageTransition>` (when `mounted` is true):
```tsx
<PageTransition>
  <ProtectedLayout>{children}</ProtectedLayout>
</PageTransition>
```

2. In the non-mounted fallback:
```tsx
<ProtectedLayout>{children}</ProtectedLayout>
```

Wrap `{children}` in BOTH places. `ProtectedLayout` must be inside `PageTransition`, not outside it — the age gate replaces page content, not the transition animation.

- [ ] **Step 2: Verify age gate works**

Navigate to `/ask/` — should see the age gate overlay. Click "Enter" — should see the ask page. Navigate to `/terms/` — should NOT see the age gate.

- [ ] **Step 3: Commit**

```bash
git add website/src/components/ClientShell.tsx
git commit -m "feat(legal): integrate ProtectedLayout age gate into ClientShell"
```

---

## Task 22: Update Footer with Legal Links

**Files:**
- Modify: `website/src/components/Footer.tsx`

- [ ] **Step 1: Add legal links row**

Between the existing 4-column grid and the bottom copyright bar, add a new row:

```tsx
{/* Legal Links */}
<div className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-[var(--c-gold)]">
  <TransitionLink href="/terms">{t("legal_terms")}</TransitionLink>
  <span className="text-white/20">|</span>
  <TransitionLink href="/privacy">{t("legal_privacy")}</TransitionLink>
  <span className="text-white/20">|</span>
  <TransitionLink href="/cookies">{t("legal_cookies")}</TransitionLink>
  <span className="text-white/20">|</span>
  <TransitionLink href="/disclaimer">{t("legal_disclaimer")}</TransitionLink>
  <span className="text-white/20">|</span>
  <TransitionLink href="/dmca">{t("legal_dmca")}</TransitionLink>
  <span className="text-white/20">|</span>
  <TransitionLink href="/contact">{t("legal_contact")}</TransitionLink>
</div>
<div className="mt-2 text-center">
  <button
    onClick={() => (window as any).openCookieBanner?.()}
    className="text-xs text-[var(--c-gold)]/60 hover:text-[var(--c-gold)] transition-colors cursor-pointer"
  >
    🍪 {t("legal_cookie_settings")}
  </button>
</div>
```

- [ ] **Step 2: Update copyright bar**

Replace the existing copyright text with:

```tsx
<p className="text-xs text-[var(--c-text-muted)]">
  © 2025–{new Date().getFullYear()} Olivia Arcana LLC. {t("legal_copyright")}
</p>
<p className="text-xs text-[var(--c-text-muted)]/60">
  {t("legal_entertainment")}
</p>
```

- [ ] **Step 3: Commit**

```bash
git add website/src/components/Footer.tsx
git commit -m "feat(legal): add legal links row, cookie settings button, updated copyright to Footer"
```

---

## Task 23: Add Copyright Meta Tags to Layout

**Files:**
- Modify: `website/src/app/layout.tsx`

- [ ] **Step 1: Add metadata**

In the `metadata` export object in `layout.tsx`, add these fields:

```typescript
authors: [{ name: "Olivia Arcana LLC" }],
other: {
  "copyright": "© 2025-2026 Olivia Arcana LLC",
},
openGraph: {
  // ... existing OG fields ...
  siteName: "Olivia Arcana",
},
```

- [ ] **Step 2: Commit**

```bash
git add website/src/app/layout.tsx
git commit -m "feat(legal): add copyright and author meta tags to root layout"
```

---

## Task 24: Integrate CheckoutConsent into Pricing

**Files:**
- Modify: `website/src/components/Pricing.tsx`

- [ ] **Step 1: Wrap subscription CheckoutButton with CheckoutConsent**

Import `CheckoutConsent` from `@/components/legal/CheckoutConsent`.

Find the `<CheckoutButton>` in the VIP tier card and wrap it:

```tsx
<CheckoutConsent>
  {({ disabled }) => (
    <CheckoutButton
      priceKey={billingPeriod === "monthly" ? "vip_monthly" : "vip_annual"}
      disabled={disabled}
    />
  )}
</CheckoutConsent>
```

- [ ] **Step 2: Also wrap one-time purchase buttons**

The a-la-carte section has buttons that trigger `handleAlaCartePurchase`. Wrap the purchase action area with CheckoutConsent similarly — disable the button while consent isn't given.

- [ ] **Step 3: Add disabled prop to CheckoutButton**

The existing `CheckoutButtonProps` does NOT have a `disabled` prop. Add it:
- Add `disabled?: boolean` to the `CheckoutButtonProps` interface
- In the click handler, add an early return: `if (disabled) return`
- Pass `disabled` to the underlying `MagneticButton` or `<button>` element as the HTML `disabled` attribute
- The visual disabling (opacity, pointer-events) is handled by the parent `CheckoutConsent` wrapper, so no extra styles needed on the button itself

- [ ] **Step 4: Commit**

```bash
git add website/src/components/Pricing.tsx website/src/components/CheckoutButton.tsx website/src/components/legal/CheckoutConsent.tsx
git commit -m "feat(legal): integrate CheckoutConsent into Pricing and CheckoutButton"
```

---

## Task 25: Backend — ConsentLog Model

**Files:**
- Modify: `backend/db/models.py`

- [ ] **Step 1: Add ConsentLog model**

Add to `models.py` after the existing models:

```python
class ConsentLog(Base):
    __tablename__ = "consent_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_ip = Column(String, nullable=False)
    user_agent = Column(String, nullable=False)
    checkbox_age = Column(Boolean, nullable=False)
    checkbox_terms = Column(Boolean, nullable=False)
    product_id = Column(String, nullable=False)
    stripe_session_id = Column(String, nullable=False, index=True)
    created_at = Column(DateTime, default=func.now())
```

Make sure `func` is imported from `sqlalchemy` (`from sqlalchemy import func` — likely already imported).

- [ ] **Step 2: Commit**

```bash
git add backend/db/models.py
git commit -m "feat(legal): add ConsentLog model for chargeback defense evidence"
```

---

## Task 26: Backend — Consent Log Endpoint

**Files:**
- Create: `backend/api/consent.py`
- Modify: `backend/main.py`

- [ ] **Step 1: Create consent.py**

```python
from fastapi import APIRouter, Request, Depends
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import get_db
from db.models import ConsentLog

router = APIRouter()

class ConsentLogRequest(BaseModel):
    timestamp: str
    checkbox_age: bool
    checkbox_terms: bool
    user_agent: str
    product_id: str
    stripe_session_id: str

@router.post("/consent-log")
async def log_consent(
    body: ConsentLogRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    # Extract IP from request headers (X-Forwarded-For for proxied requests)
    forwarded = request.headers.get("X-Forwarded-For")
    user_ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")

    log = ConsentLog(
        timestamp=datetime.fromisoformat(body.timestamp),
        user_ip=user_ip,
        user_agent=body.user_agent,
        checkbox_age=body.checkbox_age,
        checkbox_terms=body.checkbox_terms,
        product_id=body.product_id,
        stripe_session_id=body.stripe_session_id,
    )
    db.add(log)
    await db.commit()

    return {"status": "ok"}
```

- [ ] **Step 2: Register router in main.py**

Add to `main.py`:

```python
from api.consent import router as consent_router

app.include_router(consent_router, prefix="/api/payments")
```

- [ ] **Step 3: Commit**

```bash
git add backend/api/consent.py backend/main.py
git commit -m "feat(legal): add POST /api/payments/consent-log endpoint with IP extraction"
```

---

## Task 27: Security Headers in netlify.toml

**Files:**
- Modify: `website/netlify.toml`

- [ ] **Step 1: Add security headers**

Append to `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
```

Note: Skip CSP for now — it requires knowing the exact backend domain and can break things if misconfigured. Add it in Phase 3 after testing.

- [ ] **Step 2: Commit**

```bash
git add website/netlify.toml
git commit -m "feat(security): add HSTS, X-Frame-Options, nosniff, referrer, permissions headers"
```

---

## Task 28: robots.txt and sitemap.xml

**Files:**
- Create: `website/public/robots.txt`
- Create: `website/public/sitemap.xml`

- [ ] **Step 1: Create robots.txt**

```
User-agent: *
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/
Disallow: /_internal/
Allow: /
Sitemap: https://oliviaarcana.com/sitemap.xml
```

- [ ] **Step 2: Create sitemap.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://oliviaarcana.com/</loc></url>
  <url><loc>https://oliviaarcana.com/about/</loc></url>
  <url><loc>https://oliviaarcana.com/oracle/</loc></url>
  <url><loc>https://oliviaarcana.com/signs/</loc></url>
  <url><loc>https://oliviaarcana.com/cosmos/</loc></url>
  <url><loc>https://oliviaarcana.com/daily/</loc></url>
  <url><loc>https://oliviaarcana.com/ask/</loc></url>
  <url><loc>https://oliviaarcana.com/terms/</loc></url>
  <url><loc>https://oliviaarcana.com/privacy/</loc></url>
  <url><loc>https://oliviaarcana.com/cookies/</loc></url>
  <url><loc>https://oliviaarcana.com/disclaimer/</loc></url>
  <url><loc>https://oliviaarcana.com/dmca/</loc></url>
  <url><loc>https://oliviaarcana.com/contact/</loc></url>
</urlset>
```

- [ ] **Step 3: Commit**

```bash
git add website/public/robots.txt website/public/sitemap.xml
git commit -m "feat(seo): add robots.txt and sitemap.xml for legal and public pages"
```

---

## Task 29: Final Verification

- [ ] **Step 1: Build the project**

```bash
cd /Users/macbookpro/olivia-arcana/website && npm run build
```

Verify no build errors. All new pages should appear in the `out/` directory.

- [ ] **Step 2: Run dev server and verify all pages**

```bash
npm run dev
```

Check each URL renders correctly:
- `/terms/` — all 12 clauses visible
- `/privacy/` — all 12 sections, jurisdiction callout works
- `/cookies/` — cookie table renders
- `/disclaimer/` — 7 sections, bold age restriction
- `/dmca/` — DMCA content visible

- [ ] **Step 3: Verify cookie banner**

- Clear all cookies
- Visit homepage — banner should appear at bottom
- Click "Reject" — banner disappears, no GA scripts loaded
- Clear cookies, revisit — click "Accept All" — banner disappears
- Refresh — banner should NOT reappear

- [ ] **Step 4: Verify age gate**

- Clear `oa_age_verified` cookie
- Visit `/ask/` — age gate should appear
- Click "I am 18 or older" — page content should render
- Navigate to `/terms/` — no age gate
- Navigate back to `/oracle/` — no age gate (cookie persists)

- [ ] **Step 5: Verify checkout consent**

- Visit pricing section
- Checkboxes should be unchecked
- Payment button should be grayed out
- Check both boxes — button should enable

- [ ] **Step 6: Verify footer**

- Legal links row visible on every page
- "Cookie Settings" link re-opens banner
- Copyright shows current year
- "Entertainment purposes only" text visible

- [ ] **Step 7: Commit verification notes**

No code changes needed — this is a manual verification step. If any issues found, fix them and commit the fixes individually.

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Legal constants module | `lib/legal/constants.ts` |
| 2 | Shared cookie utilities | `lib/legal/cookie-utils.ts` |
| 3 | Cookie consent engine | `lib/legal/cookie-consent.ts` |
| 4 | Age gate module | `lib/legal/age-gate.ts` |
| 5 | Checkout consent logger | `lib/legal/checkout-consent.ts` |
| 6 | Jurisdiction detector | `lib/legal/jurisdiction.ts` |
| 7 | Index re-export | `lib/legal/index.ts` |
| 8 | i18n translation keys | `translations.ts` (modify) |
| 9 | BindingLanguageBanner | `components/legal/BindingLanguageBanner.tsx` |
| 10 | LegalPageLayout (with TOC) | `components/legal/LegalPageLayout.tsx` |
| 11 | Terms of Service page | `app/terms/page.tsx` |
| 12 | Privacy Policy page | `app/privacy/page.tsx` |
| 13 | Cookie Policy page | `app/cookies/page.tsx` |
| 14 | Disclaimer page | `app/disclaimer/page.tsx` |
| 15 | DMCA page | `app/dmca/page.tsx` |
| 16 | CookieBanner | `components/legal/CookieBanner.tsx` |
| 17 | AgeGate | `components/legal/AgeGate.tsx` |
| 18 | ProtectedLayout | `components/legal/ProtectedLayout.tsx` |
| 19 | SafeDisclaimer | `components/legal/SafeDisclaimer.tsx` |
| 20 | CheckoutConsent | `components/legal/CheckoutConsent.tsx` |
| 21 | CookieBanner → ClientShell | `ClientShell.tsx` (modify) |
| 22 | ProtectedLayout → ClientShell | `ClientShell.tsx` (modify) |
| 23 | Footer legal links | `Footer.tsx` (modify) |
| 24 | Layout meta tags | `layout.tsx` (modify) |
| 25 | Pricing + CheckoutButton consent | `Pricing.tsx`, `CheckoutButton.tsx` (modify) |
| 26 | ConsentLog model | `models.py` (modify) |
| 27 | Consent log endpoint | `consent.py` (create), `main.py` (modify) |
| 28 | Security headers | `netlify.toml` (modify) |
| 29 | robots.txt + sitemap | `public/` (create) |
| 30 | Final verification | Manual testing |
