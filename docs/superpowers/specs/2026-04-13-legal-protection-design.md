# Olivia Arcana — Legal Protection System Design

**Date:** 2026-04-13
**Status:** Approved
**Scope:** Complete legal, compliance, payment protection, content safety, and security hardening for oliviaarcana.com

---

## 1. Context

### 1.1 Current State

oliviaarcana.com is a live Next.js 16 + FastAPI tarot/astrology app with:
- Stripe payments (subscriptions $6.50/mo, one-time readings $1.95–$39.99)
- Supabase auth (Google OAuth + email/password)
- 9-language i18n (en, uk, ru, de, fr, ar, es, zh, pt)
- Telegram bot + social pipeline
- Deployed on Netlify (static export) + Docker backend

**What's missing:** ALL legal/compliance infrastructure — zero legal pages, no cookie consent, no age gate, no checkout consent logging, no safe language filtering, no security headers.

### 1.2 Entity

Olivia Arcana LLC — Wyoming LLC, registering within days. Registered agent and EIN pending. Mercury bank account to be opened. Until registration completes, legal pages will use "Olivia Arcana LLC" as the entity name with a placeholder for the registered agent address.

### 1.3 Design Decisions

| Decision | Choice |
|----------|--------|
| Architecture | Middleware + Pages (modular, swappable) |
| Compliance approach | Hybrid: self-hosted now, iubenda-ready swap points |
| Jurisdictions | Global maximum: GDPR, CCPA, LGPD, PIPL, UK GDPR, PIPEDA + locale-matched |
| Legal page language | English binding + translated summary banner per locale |
| Dispute resolution | Arbitration (US) + EU/UK consumer rights preserved + support escalation |
| Support channels | support@ + privacy@ + contact form + Telegram, AI-handled, 24hr SLA |
| Chargeback defense | Auto-refund <$5, 48hr easy refund window, fight abuse only, full consent logging |
| Content safety | Static copy audit + AI output guardrails (phrase filter + disclaimer injection) |

---

## 2. File Architecture

```
website/src/
├── app/
│   ├── terms/page.tsx              # Terms of Service
│   ├── privacy/page.tsx            # Privacy Policy
│   ├── cookies/page.tsx            # Cookie Policy
│   ├── disclaimer/page.tsx         # Disclaimer
│   ├── dmca/page.tsx               # DMCA Policy
│   ├── contact/page.tsx            # Contact form with consent checkbox
│   └── unsubscribe/page.tsx        # Email unsubscribe handler
│
├── lib/
│   └── legal/
│       ├── index.ts                # Re-exports all modules
│       ├── cookie-consent.ts       # Consent engine (read/write/check)
│       ├── age-gate.ts             # Age verification logic
│       ├── checkout-consent.ts     # Consent logger (timestamp, IP, UA, checkboxes)
│       ├── safe-language.ts        # Prohibited phrase filter + replacements
│       ├── ai-output-wrapper.ts    # Wraps AI responses with disclaimer + filter
│       ├── jurisdiction.ts         # Detects user jurisdiction from locale
│       └── constants.ts            # All legal copy, disclaimer text, prohibited phrases
│
├── components/
│   └── legal/
│       ├── CookieBanner.tsx        # GDPR consent banner
│       ├── AgeGate.tsx             # Full-screen 18+ verification overlay
│       ├── CheckoutConsent.tsx     # Two-checkbox consent block for payment flows
│       ├── SafeDisclaimer.tsx      # Reusable disclaimer injection component
│       ├── LegalPageLayout.tsx     # Shared layout for all legal pages
│       └── BindingLanguageBanner.tsx # "English is the binding version" translated banner
```

**Principle:** `lib/legal/` is pure logic (no React, testable standalone). `components/legal/` is UI that consumes it. Legal page content lives in `constants.ts` for easy audit and future iubenda swap.

---

## 3. Legal Pages

All 5 pages share `LegalPageLayout.tsx` — dark background (#0a0a12), gold accents (#C9A84C), Cinzel headings, `BindingLanguageBanner` at top for non-English users, table of contents sidebar (desktop) / accordion (mobile), `lastUpdated` date at bottom.

### 3.1 Terms of Service (`/terms`) — 12 Clauses

**Clause 1 — Entertainment Disclaimer (most prominent, top of page, large text):**
All services provided on oliviaarcana.com, including but not limited to tarot readings, astrology consultations, oracle guidance, and spiritual coaching, are provided for ENTERTAINMENT AND PERSONAL INSIGHT PURPOSES ONLY. They do not constitute and should not be interpreted as professional medical, psychological, financial, legal, or any other licensed professional advice. Individual results may vary and no specific outcome is guaranteed.

**Clause 2 — Acceptance of Terms:**
User must accept terms by using the site. Date of last update shown. Right to modify terms at any time. Continued use = acceptance.

**Clause 3 — Age Requirement:**
Must be 18 years or older. No exceptions. Services not directed at minors.

**Clause 4 — Service Description:**
Digital entertainment content, tarot-inspired reflections, astrology-based personal insight. Explicitly state: NOT psychic prediction, NOT fortune-telling, NOT guaranteed accuracy.

**Clause 5 — Payment & Refund Policy:**
- 48-hour easy refund window from delivery — contact support@oliviaarcana.com
- Auto-refund for purchases under $5 (AI-handled, instant)
- Outside 48hr window: store credits at company discretion, no cash refunds on digital services
- Must contact support@ before filing any chargeback — failure to do so constitutes material breach
- Subscription cancellation: effective at end of current billing period, no partial refunds
- 3-day free trial: cancel before trial ends to avoid charge

**Clause 6 — Limitation of Liability:**
- Total liability capped at amount paid for the specific service in question
- Excludes all consequential, indirect, special, and punitive damages
- Services provided "as-is" and "as-available" with no warranty of any kind
- User assumes full responsibility for all decisions made based on any reading or content

**Clause 7 — Intellectual Property:**
All content, designs, brand assets, card imagery, animations, and copy on oliviaarcana.com are the exclusive property of Olivia Arcana LLC. No reproduction, distribution, or commercial use without written permission.

**Clause 8 — User Conduct:**
Users may not: scrape content, reverse-engineer features, impersonate the brand, use services for illegal purposes, resell or redistribute readings.

**Clause 9 — Account Termination:**
Company reserves right to terminate any account for any reason without notice or refund.

**Clause 10 — Dispute Resolution (dual-track):**
- **All users:** Must contact support@oliviaarcana.com first. 24-hour response SLA. Good-faith resolution attempted before any formal proceedings.
- **US users:** Disputes not resolved via support are subject to binding arbitration under JAMS or AAA rules. Class action waiver. Venue: Cheyenne, Wyoming, USA. Governing law: State of Wyoming.
- **EU/UK users:** Nothing in these Terms limits your statutory consumer rights under applicable EU/UK consumer protection law. You may bring claims in your local courts as permitted by law.
- **All other jurisdictions:** Governing law is State of Wyoming. Users consent to jurisdiction of Wyoming courts for any disputes not subject to arbitration.

**Clause 11 — Global Privacy Compliance:**
References Privacy Policy at /privacy. Acknowledges compliance with GDPR, CCPA, LGPD, PIPL, UK GDPR, PIPEDA, and other applicable data protection laws.

**Clause 12 — Contact:**
- General support: support@oliviaarcana.com
- Data privacy: privacy@oliviaarcana.com
- Contact form: oliviaarcana.com/contact
- Telegram: t.me/OliviaArcanaBot

### 3.2 Privacy Policy (`/privacy`) — 12 Sections

**Section 1 — Who We Are:**
Olivia Arcana LLC, operating oliviaarcana.com. Contact: privacy@oliviaarcana.com.

**Section 2 — Data We Collect:**
- Name and email address (account creation, contact forms)
- Birth date, time, and location (astrology features — provided voluntarily)
- Payment method last 4 digits only — full card data never stored or seen by us (Stripe handles all card processing)
- Session and reading history
- IP address and device type (automatically via server logs)
- Browser and referring URL
- Cookies and analytics data (with consent only)

**Section 3 — Legal Basis (GDPR):**
- Service delivery (contractual necessity)
- Fraud prevention and security (legitimate interest)
- Email marketing (explicit consent only — can be withdrawn at any time)
- Legal compliance (legal obligation)
- Astrology calculations from birth data (explicit consent at point of collection)

**Section 4 — Third Parties:**
- Stripe (payment processing) — stripe.com/privacy
- Supabase (authentication and database) — supabase.com/privacy
- Email provider / Mailchimp / Klaviyo (email delivery) — used only with consent
- Google Analytics (site analytics) — only loaded after cookie consent given
- We never sell, rent, or share personal data for advertising purposes

**Section 5 — Your Rights (Global, with jurisdiction-specific callouts):**

*GDPR (EU — de, fr, es locales):* Access, correction, deletion, portability, restriction, objection. Right to lodge complaint with supervisory authority.

*UK GDPR (en locale, UK visitors):* Same as EU GDPR. ICO is the supervisory authority.

*CCPA (California, US):* Right to know, delete, opt-out of data sale. "Do Not Sell My Personal Information" — we do not sell data.

*LGPD (Brazil — pt locale):* Access, correction, deletion, anonymization, portability, consent withdrawal.

*PIPL (China — zh locale):* Consent withdrawal, access, correction, deletion, portability, explanation of processing rules.

*PIPEDA (Canada — fr locale, Canadian visitors):* Access, correction. Privacy Commissioner complaints.

*All jurisdictions:* Email privacy@oliviaarcana.com. Response within 30 days.

The `jurisdiction.ts` module highlights the most relevant section based on user's locale with a "This applies to you" visual callout. All rights are always listed.

**Section 6 — Data Retention:**
- Account data: 3 years after last account activity
- Payment/transaction records: 7 years (tax law requirement)
- Consent logs: 7 years (matches transaction retention, chargeback defense)
- Email marketing: until unsubscribed or deletion requested
- Birth data: deleted on account deletion or upon request

**Section 7 — Cookies:**
Session cookies (required), analytics cookies (consent only), preference cookies (consent only). Full details at /cookies.

**Section 8 — Children's Privacy:**
Services for adults 18+ only. We do not knowingly collect data from minors. If you believe a minor has provided us data, contact privacy@oliviaarcana.com immediately.

**Section 9 — Data Breach Notification:**
Notify affected users within 72 hours as required by GDPR Article 33. Notification via email and site banner.

**Section 10 — International Data Transfers:**
Data may be processed in the United States. We ensure adequate safeguards are in place for international transfers, including compliance with applicable data protection frameworks.

**Section 11 — Changes to Policy:**
We may update this policy. Material changes notified via email to registered users. Continued use after changes constitutes acceptance. Last updated date shown at bottom.

**Section 12 — Contact:**
privacy@oliviaarcana.com

### 3.3 Cookie Policy (`/cookies`)

Three cookie categories:

| Cookie | Category | Purpose | Duration | Consent Required |
|--------|----------|---------|----------|-----------------|
| `SESS_ID` (Supabase) | Strictly necessary | Login state | Session | No |
| `__stripe_mid` | Strictly necessary | Stripe fraud prevention | 1 year | No |
| `__stripe_sid` | Strictly necessary | Stripe fraud prevention | 30 min | No |
| `oa_consent` | Strictly necessary | Stores consent decision | 365 days | No |
| `oa_consent_detail` | Strictly necessary | Stores granular consent choices | 365 days | No |
| `oa_age_verified` | Strictly necessary | Age verification state | 365 days | No |
| `_ga` | Analytics | Google Analytics user ID | 2 years | Yes |
| `_gid` | Analytics | Google Analytics session ID | 24 hours | Yes |
| `oa_locale` | Preferences | Language preference | 365 days | Yes |

How to opt out: browser settings, Google Analytics opt-out tool, Cookie Settings link in footer.

### 3.4 Disclaimer (`/disclaimer`) — 7 Sections

1. **Entertainment Only Statement** — same wording as Terms Clause 1, large prominent heading
2. **No Professional Advice** — explicitly lists: medical/psychiatric, legal, financial/investment/tax, psychological therapy, any other licensed professional service. "Always consult a qualified professional."
3. **Accuracy Disclaimer** — readings are subjective, symbolic, reflective. Not predictions. No guaranteed outcomes.
4. **Age Restriction** — bold: "ALL SERVICES ARE FOR ADULTS AGED 18 AND OVER ONLY."
5. **Results Disclaimer** — individual experiences vary. Testimonials reflect individual experiences only, not typical or guaranteed results.
6. **Third-Party Links** — not responsible for third-party site content or practices.
7. **Affiliate Disclosure** — future-proofing: "Some links may be affiliate links."

### 3.5 DMCA Policy (`/dmca`)

- DMCA Section 512(c) compliance statement
- How to file a takedown notice (required elements: identification of work, infringing material URL, contact info, good faith statement, accuracy under perjury, signature)
- Send to: support@oliviaarcana.com
- Counter-notification process
- Repeat infringer policy: accounts terminated

---

## 4. Protection Middleware — `lib/legal/`

### 4.1 Cookie Consent Engine (`cookie-consent.ts`)

**Exports:**
```typescript
getConsent(): ConsentState | null        // Reads oa_consent cookie
setConsent(state: ConsentState): void    // Writes both cookies
hasConsent(category: string): boolean    // Checks specific category
resetConsent(): void                     // Clears cookies (for "Cookie Settings" re-open)
```

**Behavior:**
- Reads/writes `oa_consent` cookie: `accepted|rejected|custom`
- Reads/writes `oa_consent_detail` cookie: JSON `{"analytics": bool, "preferences": bool}`
- 365-day expiry, SameSite=Lax, Secure in production
- Uses cookies only — no localStorage
- `hasConsent("analytics")` returns true only if explicit acceptance

**iubenda swap point:** Replace `CookieBanner.tsx` + this module with iubenda Cookie Solution. The rest of the app calls `hasConsent()` — that interface stays stable.

### 4.2 Age Gate (`age-gate.ts`)

**Exports:**
```typescript
isAgeVerified(): boolean                 // Checks oa_age_verified cookie
setAgeVerified(): void                   // Sets cookie (365 days)
AGE_GATE_ROUTES: string[]                // List of protected route prefixes
needsAgeGate(pathname: string): boolean  // Checks if route requires gate
```

**Protected routes:** `/readings`, `/subscribe`, `/cards`, `/oracle`, `/account`, any route starting with `/reading/`
**Unprotected:** `/`, `/about`, `/contact`, `/terms`, `/privacy`, `/cookies`, `/disclaimer`, `/dmca`, `/unsubscribe`

**Cookie:** `oa_age_verified=true`, 365 days, SameSite=Lax, Secure in production.

### 4.3 Checkout Consent Logger (`checkout-consent.ts`)

**Frontend exports:**
```typescript
interface ConsentRecord {
  timestamp: string          // ISO 8601
  checkbox_age: boolean
  checkbox_terms: boolean
  user_ip: string
  user_agent: string
  product_id: string
  stripe_session_id: string
}

logConsent(record: ConsentRecord): Promise<void>  // POST to backend
```

**Backend:**
- New endpoint: `POST /api/payments/consent-log`
- New SQLAlchemy model: `ConsentLog` table
  - `id` (primary key)
  - `timestamp` (datetime, indexed)
  - `user_id` (foreign key to users, nullable for guest checkout)
  - `user_ip` (string)
  - `user_agent` (string)
  - `checkbox_age` (boolean)
  - `checkbox_terms` (boolean)
  - `product_id` (string)
  - `stripe_session_id` (string, indexed)
  - `created_at` (datetime, auto)
- Retention: 7 years
- Admin export includes consent logs

**This is the primary chargeback defense evidence.** Every dispute response attaches the consent record for that transaction.

### 4.4 Safe Language Filter (`safe-language.ts`)

**Exports:**
```typescript
auditStaticCopy(text: string): string     // Applies replacement map
filterAIOutput(text: string): string      // Same filter for runtime AI text
PROHIBITED_PHRASES: string[]              // For grep/audit tooling
REPLACEMENT_MAP: Record<string, string>   // Unsafe → safe mappings
```

**Replacement map:**

| Unsafe Pattern | Replacement |
|---------------|-------------|
| "will happen" | "may suggest" |
| "will change" | "invites reflection on" |
| "will improve" | "offers perspective on" |
| "this means" (reading context) | "this may indicate" |
| "I predict" | "the cards invite you to consider" |
| "I guarantee" | *removed* |
| "100% accurate" | *removed* |
| "definitely" (outcome context) | "possibly" |
| "guaranteed results" | *removed* |
| "fortune telling" | "tarot-inspired insight" |
| "psychic" (service claim) | "intuitive" |
| "predict your future" | "explore possibilities" |
| "contact the deceased" | *removed* |
| "this will heal you" | *removed* |

**Implementation:** Case-insensitive regex matching. Each pattern has a word-boundary guard to avoid false positives (e.g., "psychic" in "psychic" but not in "psychical research" unless used as service claim).

### 4.5 AI Output Wrapper (`ai-output-wrapper.ts`)

**Exports:**
```typescript
wrapReading(rawOutput: string): string
STANDARD_DISCLAIMER: string
```

**Behavior:**
1. Runs `filterAIOutput(rawOutput)` — catches prohibited phrases
2. Appends `STANDARD_DISCLAIMER`:
   > "This reading is for entertainment and personal reflection only. It does not constitute medical, legal, financial, or psychological advice. Individual experiences vary. Always trust your own judgment and consult a qualified professional for important decisions."
3. Returns wrapped output

**Integration points:**
- Backend: wraps all `/api/readings/*` and `/api/chat` responses
- Telegram bot: wraps bot responses before sending to user
- Any future AI output endpoint

### 4.6 Jurisdiction Detector (`jurisdiction.ts`)

**Exports:**
```typescript
type Jurisdiction = 'gdpr' | 'ccpa' | 'lgpd' | 'pipl' | 'uk_gdpr' | 'pipeda' | 'general'

detectJurisdiction(locale: string): Jurisdiction
getApplicableRights(jurisdiction: Jurisdiction): string[]
```

**Mapping:**

| Locale | Jurisdiction | Primary Privacy Law |
|--------|-------------|---------------------|
| `de`, `fr`, `es` | `gdpr` | EU GDPR |
| `en` | `ccpa` | California CCPA (default for English) |
| `pt` | `lgpd` | Brazil LGPD |
| `zh` | `pipl` | China PIPL |
| `uk` | `general` | UA Data Protection (general treatment) |
| `ru` | `general` | Russian 152-FZ (general treatment) |
| `ar` | `general` | Saudi PDPL / UAE (general treatment) |

**Used by:** Privacy Policy page — highlights the most relevant rights section with a "This applies to you" visual callout based on locale. All rights always visible.

---

## 5. UI Components

### 5.1 `CookieBanner.tsx`

- Fixed bottom bar, `z-index: 9999`
- Dark background with gold border-top
- Three buttons: "Accept All" (gold fill, dark text), "Reject Non-Essential" (gold outline), "Manage Preferences" (text link)
- "Manage Preferences" expands panel with toggle switches: Analytics (off by default), Preferences (off by default)
- Inline links to /privacy and /cookies
- Mobile: stacks vertically, full-width buttons
- Footer "Cookie Settings" link calls `window.openCookieBanner()` to re-show

### 5.2 `AgeGate.tsx`

- Full-screen overlay: `background: rgba(5, 4, 20, 0.97)`
- Centered card with gold border
- Olivia Arcana logo at top
- Text: "This content is for adults aged 18 and over."
- "I am 18 or older — Enter": gold fill, dark text → sets cookie, 300ms fade-out, page renders
- "I am under 18 — Exit": transparent, gold border → redirects to google.com
- Not dismissible: Escape key blocked, click-outside blocked
- Content does NOT mount until verification passes (gate renders instead of page content, not as overlay)

### 5.3 `CheckoutConsent.tsx`

- Renders directly above existing `CheckoutButton.tsx`
- Two unchecked checkboxes:
  - `[ ]` "I confirm I am 18 years of age or older."
  - `[ ]` "I have read and agree to the [Terms of Service](/terms), [Privacy Policy](/privacy), and [Disclaimer](/disclaimer), and I understand that all services are for entertainment purposes only."
- Gold accent on checked state, 14px label text
- Document names are gold links, open in new tab
- Payment button: `opacity: 0.4` + `pointer-events: none` until both checked
- Instant enable/disable on state change

### 5.4 `SafeDisclaimer.tsx`

Two variants via `variant` prop:

- **`compact`**: Single line, small text (12px), muted gold. Injected into: pricing cards, service descriptions, blog sidebar.
- **`full`**: Multi-line box with gold left border, padded. Full disclaimer text. Injected into: bottom of every delivered reading, below AI output display, top of disclaimer page.

### 5.5 `LegalPageLayout.tsx`

- Dark background (#0a0a12), gold headings in Cinzel, sans-serif body
- `BindingLanguageBanner` at top when `locale !== 'en'`
- Table of contents: sticky sidebar on desktop, collapsed accordion on mobile
- `lastUpdated` date at bottom
- Navigation: back-to-home link + footer legal links row

### 5.6 `BindingLanguageBanner.tsx`

Translated message per locale:

| Locale | Message |
|--------|---------|
| `uk` | "Цей документ доступний лише англійською мовою. Англійська версія є юридично обов'язковою." |
| `ru` | "Этот документ доступен только на английском языке. Английская версия является юридически обязательной." |
| `de` | "Dieses Dokument ist nur auf Englisch verfügbar. Die englische Version ist rechtlich bindend." |
| `fr` | "Ce document est disponible uniquement en anglais. La version anglaise fait foi." |
| `ar` | "هذا المستند متاح باللغة الإنجليزية فقط. النسخة الإنجليزية هي النسخة الملزمة قانونياً." |
| `es` | "Este documento está disponible solo en inglés. La versión en inglés es la legalmente vinculante." |
| `zh` | "本文件仅提供英文版本。英文版本为具有法律约束力的版本。" |
| `pt` | "Este documento está disponível apenas em inglês. A versão em inglês é a legalmente vinculante." |

Styled: subtle background, info icon, small text, link to English version anchor.

---

## 6. Integration Map

### 6.1 Component Placement

| Component | Location |
|-----------|----------|
| `CookieBanner` | `app/layout.tsx` — renders on every page |
| `AgeGate` | Protected route layout wrapper — readings, subscribe, cards, oracle, account |
| `CheckoutConsent` | Wraps every `CheckoutButton` instance (pricing, reading purchase, subscription) |
| `SafeDisclaimer` (compact) | Pricing component, service description cards, blog/oracle sidebar |
| `SafeDisclaimer` (full) | Reading delivery pages, AI output display, disclaimer page top |
| `BindingLanguageBanner` | Inside `LegalPageLayout` (auto-shows for non-English locales) |
| Footer legal links | `Footer.tsx` — new row between grid and copyright |
| Copyright update | `Footer.tsx` bottom bar |
| `<meta>` copyright tags | `app/layout.tsx` `<head>` |

### 6.2 Backend Integration

| Addition | Location | Purpose |
|----------|----------|---------|
| `POST /api/payments/consent-log` | `backend/api/payments.py` | Store checkout consent records |
| `ConsentLog` model | `backend/db/models.py` | consent_logs table |
| AI wrapper middleware | `backend/api/readings.py` + chat endpoints | Wrap all AI output through `wrapReading()` |
| `GET /admin/export-data` | `backend/api/admin.py` (new) | Admin-only CSV export, protected by ADMIN_TOKEN |

### 6.3 Footer Update

```
├── Zodiac Signs Strip (existing)
├── Four-Column Grid (existing — add legal links to a new column or row)
├── Legal Links Row (NEW)
│   Terms | Privacy | Cookies | Disclaimer | DMCA | Contact
│   🍪 Cookie Settings
├── Copyright Bar (UPDATED)
│   "© 2025–{currentYear} Olivia Arcana LLC. All rights reserved."
│   "All readings are for entertainment purposes only."
```

---

## 7. Security Hardening

### 7.1 HTTP Headers (via `netlify.toml`)

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Content-Security-Policy = "default-src 'self'; script-src 'self' https://js.stripe.com https://www.googletagmanager.com 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self' https://api.stripe.com https://*.supabase.co; frame-src https://js.stripe.com https://hooks.stripe.com; font-src 'self' https://fonts.gstatic.com"
```

### 7.2 `robots.txt`

```
User-agent: *
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/
Disallow: /_internal/
Allow: /
Sitemap: https://oliviaarcana.com/sitemap.xml
```

### 7.3 `sitemap.xml`

Public pages only: `/`, `/about`, `/cards`, `/oracle`, `/subscribe`, `/terms`, `/privacy`, `/cookies`, `/disclaimer`, `/dmca`, `/contact`.
Exclude: `/admin/*`, `/api/*`, `/dashboard/*`, `/account/*`, `/reading/*`.

### 7.4 Copyright Metadata

Added to `app/layout.tsx` `<head>`:
```html
<meta name="copyright" content="© 2025-2026 Olivia Arcana LLC" />
<meta name="author" content="Olivia Arcana LLC" />
<meta property="og:site_name" content="Olivia Arcana" />
```

### 7.5 Environment Variable Audit

- Scan all source files for hardcoded API keys (sk_, pk_, api_key, secret patterns)
- Confirm .env in .gitignore
- Create .env.example with variable names, no values
- Backend admin routes protected by ADMIN_TOKEN env var

### 7.6 Image Watermark

CSS-based watermark for original card imagery and artwork:
- Diagonal text "© Olivia Arcana" at 12% opacity white, rotated 30 degrees
- Applied via CSS pseudo-element on content images only (not UI elements)
- Class-based: `.watermarked` applied to card images and original artwork

---

## 8. Email Compliance

### 8.1 Receipt Email Template

Branded HTML email sent within 5 minutes of every purchase:
- Header: Olivia Arcana wordmark, gold on dark
- Body: order summary (ID, date, product, amount, payment method last-4)
- Delivery note (dynamic: digital reading delivery time / subscription activation / download link)
- Entertainment disclaimer paragraph
- Support contact: support@oliviaarcana.com, 48-hour window reminder
- Footer: unsubscribe link, registered address (Wyoming), Terms | Privacy | Disclaimer links, copyright

### 8.2 Contact Form (`/contact`)

- Standard fields: name, email, subject, message
- Required consent checkbox: "I consent to Olivia Arcana LLC processing my personal data to respond to my inquiry, in accordance with the Privacy Policy."
- Honeypot field (hidden `website` field) — silently reject if filled
- Client-side email validation
- Success message: "Thank you! We'll respond within 24 hours."
- Sends to support@oliviaarcana.com

### 8.3 Email Signup Consent

Any email signup/waitlist form includes:
- Required checkbox: "I agree to receive emails from Olivia Arcana about readings, astrology insights, and offers. I can unsubscribe at any time."
- Text below: "We respect your privacy. No spam, ever. Unsubscribe at any time."

### 8.4 Unsubscribe (`/unsubscribe`)

- Accepts `?email=` query parameter
- Shows confirmation: "You have been unsubscribed from Olivia Arcana marketing emails."
- Triggers unsubscribe via email provider API (env var for API key)
- CAN-SPAM: processed within 10 business days

### 8.5 Every Marketing/Transactional Email Footer

```
To unsubscribe from marketing emails: [Unsubscribe Link]
To delete your account and data: email privacy@oliviaarcana.com

© {year} Olivia Arcana LLC | Entertainment purposes only
Terms | Privacy | Disclaimer
[Registered Agent Address, Wyoming]
```

---

## 9. Dispute Response System

### 9.1 Evidence Package (for Stripe disputes)

When a chargeback is filed, AI support assembles:

1. **Consent record** from `consent_logs` table (timestamp, IP, both checkboxes confirmed)
2. **Terms of Service** excerpt (refund policy clause)
3. **Delivery confirmation** (reading delivery timestamp, email sent confirmation)
4. **Receipt email** copy (sent timestamp, recipient)
5. **Customer communication history** (all support@ exchanges)

### 9.2 Dispute Response Template

A `dispute-response-template.txt` file in the repo with:
- Merchant identification (Olivia Arcana LLC)
- Statement that service was delivered and customer agreed to terms
- Evidence checklist with attachment slots
- Conclusion requesting decision in merchant's favor

### 9.3 Auto-Resolution Policy

| Condition | Action |
|-----------|--------|
| Purchase < $5, first dispute | Auto-refund, no contest |
| Within 48hr window, any amount | AI offers refund or store credit |
| Outside 48hr, contacted support | AI attempts resolution, escalates if needed |
| Chargeback filed without support contact | Contest with full evidence package |
| Repeat offender (2+ disputes) | Contest + account termination |

---

## 10. Content Safety

### 10.1 Static Copy Audit

One-time scan of all files in `website/src/` and i18n translations for prohibited phrases. Apply replacement map from `safe-language.ts`. This is a codebase-wide find-and-replace during implementation.

### 10.2 AI Output Guardrails

All AI-generated content (readings, chat responses, Telegram bot output) passes through `wrapReading()`:
1. Filter prohibited phrases via regex
2. Append standard entertainment disclaimer

### 10.3 Missing Safe Language Additions

Inject where currently absent:
- "for entertainment purposes only" on ALL service description blocks
- "for adults 18 and over" on ALL reading and subscription pages
- "individual experiences vary" on any page showing testimonials
- "consult a qualified professional for important decisions" on all reading delivery pages

---

## 11. Security Checklist (generated as `SECURITY_CHECKLIST.md`)

```markdown
- [ ] SSL active on all pages (Netlify provides)
- [ ] HSTS header configured (netlify.toml)
- [ ] All API keys in .env (not in source)
- [ ] .env in .gitignore
- [ ] .env.example created with variable names only
- [ ] No raw card data handled by our code (Stripe Elements only)
- [ ] Admin routes protected by ADMIN_TOKEN
- [ ] Rate limiting active (contact form: 3/hr, auth: 5/15min, readings: 10/day free tier)
- [ ] Security headers in netlify.toml
- [ ] robots.txt blocking admin/api routes
- [ ] sitemap.xml listing only public pages
- [ ] 2FA enabled: Stripe account
- [ ] 2FA enabled: Supabase account
- [ ] 2FA enabled: Domain registrar
- [ ] 2FA enabled: Mercury bank account
- [ ] 2FA enabled: Google account (Analytics)
- [ ] 2FA enabled: Netlify account
- [ ] Domain auto-renewal enabled
- [ ] Monthly customer data export scheduled
- [ ] Registered agent renewal calendar reminder set (annual)
- [ ] Wyoming Annual Report calendar reminder set (January each year)
- [ ] IRS Form 5472 reminder set (January each year) — $25,000 penalty if missed
```

---

## 12. iubenda Swap Points

When ready to integrate iubenda:

| Current | Replace With |
|---------|-------------|
| `privacy/page.tsx` content | iubenda Privacy Policy embed widget |
| `cookies/page.tsx` content | iubenda Cookie Policy embed widget |
| `CookieBanner.tsx` + `cookie-consent.ts` | iubenda Cookie Solution script |

**What stays unchanged:** Terms of Service, Disclaimer, DMCA (custom business documents). CheckoutConsent, AgeGate, SafeDisclaimer, AI output wrapper (business logic, not privacy compliance). The `hasConsent()` interface remains stable — iubenda's CS exposes equivalent checks.

---

## 13. Implementation Phases

**Phase 1 — Legal Foundation (must complete before payments go live):**
- Legal pages (Terms, Privacy, Cookies, Disclaimer, DMCA)
- LegalPageLayout + BindingLanguageBanner
- Footer update with legal links + copyright
- Cookie consent banner
- Age gate
- Checkout consent checkboxes + backend logging
- Security headers + robots.txt + sitemap.xml
- Copyright metadata

**Phase 2 — Payment & Content Protection:**
- Receipt email template
- Dispute response template
- Contact form with consent
- Email signup consent
- Unsubscribe page
- Safe language static audit
- AI output wrapper integration
- SafeDisclaimer injection across site

**Phase 3 — Hardening & Operations:**
- Environment variable audit
- Admin export endpoint
- Image watermark
- Security checklist document
- Rate limiting on API endpoints
- Backend consent_logs table + endpoint
