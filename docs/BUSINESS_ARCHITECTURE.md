# Olivia Arcana — Business Architecture

**Date:** April 6, 2026

---

## Platform Strategy: Omnichannel Astrology

```
                    ┌──────────────────────┐
                    │    OLIVIA ARCANA      │
                    │    Brand / Persona    │
                    │  "Your cosmic guide"  │
                    └──────────┬───────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
     ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
     │ ACQUISITION │   │  PRODUCT    │   │ MONETIZATION│
     │  Channels   │   │  Platforms  │   │   Rails     │
     └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
            │                  │                  │
    ┌───────┼───────┐  ┌──────┼──────┐   ┌──────┼──────┐
    │       │       │  │      │      │   │      │      │
 TikTok  Insta  YouTube Web  Telegram App  Stars Crypto  IAP
```

---

## 1. ACQUISITION CHANNELS (How Users Find You)

### TikTok (Primary Growth Engine)
**Why:** 73% of astrology content consumers are on TikTok. Highest viral coefficient.

| Content Type | Frequency | Purpose |
|---|---|---|
| Daily zodiac clips (15s) | 12/day (one per sign) | Reach + brand awareness |
| "Your sign when..." skits | 3-4/week | Engagement + shares |
| Birth chart reveals | 2-3/week | Drive app downloads |
| Zodiac roasts | 2/week | Viral shares |
| Celebrity chart breakdowns | 1-2/week | Algorithm boost |
| Transit alerts ("Mercury retrograde hits YOUR sign") | As needed | Urgency + relevance |
| Compatibility duets | 1-2/week | User-generated content trigger |

**Pipeline:** Claude writes script → ElevenLabs voice → HeyGen avatar or CapCut template → Auto-post via TikTok API

**Metrics to track:** Views, shares, profile visits, link clicks, follower growth rate

### Instagram (Brand + Community)
**Why:** Visual identity showcase. Older demo (25-40). Higher purchasing intent.

| Content Type | Frequency | Purpose |
|---|---|---|
| Story horoscopes (daily) | 12/day | Retention, daily habit |
| Carousel: "Your Big 3 explained" | 2-3/week | Save + share |
| Reel: same content as TikTok | Cross-post | Reach |
| Birth chart card graphics | On demand | UGC sharing |
| Aesthetic brand posts | 1-2/week | Brand building |
| Live readings (monthly) | 1/month | Community + conversion |

**Pipeline:** Midjourney/DALL-E templates → Pillow/Canvas auto-generation → Buffer/Later scheduling

### YouTube (Long-form Authority)
**Why:** SEO, evergreen content, builds trust for premium conversions.

| Content Type | Frequency | Purpose |
|---|---|---|
| Monthly forecast (10-15 min) | 1/month per sign | SEO + authority |
| "How to read your birth chart" | Evergreen series | Education funnel |
| Celebrity chart analysis | 2/month | Algorithm + discovery |
| Shorts (repurposed TikToks) | Daily | Reach |

### Telegram Channels (Retention Engine)
**Why:** Direct push to subscribers. No algorithm gatekeeping. 8 language channels.

| Channel | Content | Frequency |
|---|---|---|
| @OliviaArcana (EN) | Daily horoscope + transit alerts | Daily |
| @OliviaArcanaUA (UK) | Same, Ukrainian | Daily |
| + 6 more languages | Localized content | Daily |

**Funnel:** Channel post → "Get YOUR personal reading" CTA → Bot DM → Free reading → VIP upsell

---

## 2. PRODUCT PLATFORMS (Where Users Engage)

### A. Website (olivia-arcana.com)

**Role:** Premium brand showcase + web app + SEO landing

| Page | Function | Revenue |
|---|---|---|
| `/` | Hero + nebula animation + birthday input | Brand impression |
| `/chart` | Interactive birth chart wheel | Free (drives registration) |
| `/daily` | Personalized daily reading | Free tier (teaser) → VIP |
| `/compatibility` | Two-chart synastry analysis | Free summary → paid full report |
| `/ask` | "Ask the Stars" Q&A | Pay-per-question ($0.99-2.99) |
| `/reading/[type]` | Deep readings (solar return, year ahead) | One-time purchase ($3.90-39.99) |
| `/blog` | SEO content (horoscope articles) | Ad revenue + organic traffic |
| `/pricing` | VIP subscription plans | Subscription conversion |

**Tech:** Next.js + Three.js (WebGL) + FastAPI backend + SQLite/Postgres

### B. Telegram Bot (8 language instances)

**Role:** Daily engagement + payments + conversational AI

| Feature | Tier | Revenue |
|---|---|---|
| Free chat (5 msg/day) | Free | — |
| Daily zodiac (all 12 signs) | Free | Retention |
| 3-card tarot spread | Free | Engagement |
| Birth chart reading | Free teaser → $3.90 unlock | Per-reading |
| Compatibility report | Free summary → $3.90 full | Per-reading |
| Celtic Cross tarot | $1.95 | Per-reading |
| Year-ahead forecast | $6.50 | Per-reading |
| Video reading (AI avatar) | $39.99 | Per-reading |
| VIP subscription | $6.50/mo or $65/yr | Recurring |

**Payment rails:** Telegram Stars (default) + @CryptoBot (TON/USDT/BTC)

**Tech:** Python + Aiogram 3 + Claude API + kerykeion + SQLAlchemy

### C. iOS App (Phase 2 — after web + bot proven)

**Role:** Premium experience + push notifications + higher LTV

| Feature | Priority |
|---|---|
| Birth chart (interactive wheel) | P0 |
| Daily personalized reading | P0 |
| Transit alerts (push notifications) | P0 |
| Compatibility checker | P1 |
| Ask the Stars | P1 |
| Social (add friends) | P2 |
| Apple Watch complications | P3 |

**Tech options:**

| Approach | Effort | Quality | Cost |
|---|---|---|---|
| **React Native / Expo** | 4-6 weeks | Good | Low (reuse web code) |
| **Swift native** | 8-12 weeks | Best | High |
| **PWA (web wrapper)** | 1-2 weeks | Acceptable | Minimal |

**Recommended:** Start with PWA for validation, then React Native for full app.

**Revenue:** Apple IAP (30% cut) for subscriptions + one-time readings

### D. Android App (Phase 2 — parallel with iOS)

**Same as iOS, React Native shares 90% of code.**

**Revenue:** Google Play Billing (15-30% cut)

**Note:** Android users have lower average spend but higher volume in target markets (CIS, MENA, LATAM).

---

## 3. MONETIZATION ARCHITECTURE

### Revenue Streams

```
┌─────────────────────────────────────────────────────────┐
│                     REVENUE MIX                         │
│                                                         │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐ │
│  │ SUBSCRIPTIONS │  │  PER-READING  │  │   ASK THE   │ │
│  │  (recurring)  │  │  (one-time)   │  │    STARS    │ │
│  │               │  │               │  │  (credits)  │ │
│  │  $6.50/mo     │  │  $1.95-39.99  │  │  $0.99/q    │ │
│  │  $65/yr       │  │              │  │  3 for $1.99│ │
│  │               │  │              │  │  10 for $4.99│ │
│  │  Target: 60%  │  │  Target: 25% │  │  Target: 15%│ │
│  │  of revenue   │  │  of revenue  │  │  of revenue │ │
│  └───────────────┘  └───────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Payment Rails by Platform

| Platform | Primary Payment | Secondary | Apple/Google Cut |
|---|---|---|---|
| Website | Stripe | Crypto (TON/USDT) | 0% |
| Telegram | Telegram Stars | @CryptoBot | 0% |
| iOS | Apple IAP | — | 30% (15% after Y1) |
| Android | Google Play Billing | — | 15% |

**Strategy:** Drive conversions through Telegram + Web (0% platform fee) rather than app stores (15-30% cut). Use apps for retention + notifications.

### Pricing Tiers

| Tier | Price | Includes |
|---|---|---|
| **Free** | $0 | 5 chat msgs/day, daily zodiac, basic horoscope, 3-card tarot |
| **VIP Monthly** | $6.50/mo | Unlimited chat, daily personal reading, transit alerts, Celtic Cross, compatibility, priority response |
| **VIP Annual** | $65/yr (~$5.42/mo) | Same as monthly + 2 months free + birthday solar return reading |
| **Readings (à la carte)** | $1.95-39.99 | Birth chart ($3.90), compatibility ($3.90), year-ahead ($6.50), video ($39.99) |

---

## 4. UNIT ECONOMICS

### Per-User Economics (Projected)

| Metric | Free User | VIP Subscriber | Reading Buyer |
|---|---|---|---|
| Acquisition cost | $0.50-2.00 (organic) | $3-8 (paid) | $1-3 |
| Monthly revenue | $0 | $6.50 | ~$2/mo avg |
| Monthly cost (Claude API) | $0.02 | $0.15 | $0.05 |
| Monthly cost (ElevenLabs) | $0 | $0 | $0.30/video |
| Gross margin | — | ~97% | ~90% |
| LTV (12 months) | $0 (converts 5-8%) | $65-78 | $15-25 |

### Cost Structure

| Cost | Monthly (at 10K users) | Monthly (at 100K users) |
|---|---|---|
| Claude API | $150 | $1,200 |
| ElevenLabs | $50 | $400 |
| HeyGen | $30 | $250 |
| VPS (Njalla) | $15 | $80 |
| Domain + eSIMs | $5 | $5 |
| **Total** | **~$250** | **~$1,935** |

### Revenue Projection (Conservative)

| Month | Users | VIP (5%) | Revenue | Cost | Profit |
|---|---|---|---|---|---|
| 1 | 500 | 25 | $163 | $50 | $113 |
| 3 | 3,000 | 150 | $975 | $150 | $825 |
| 6 | 15,000 | 750 | $4,875 | $500 | $4,375 |
| 12 | 50,000 | 2,500 | $16,250 | $1,200 | $15,050 |
| 24 | 200,000 | 10,000 | $65,000 | $3,500 | $61,500 |

---

## 5. CONTENT AUTOMATION PIPELINE

### Daily Operations (Fully Automated)

```
04:00 UTC  ─→  Compute today's transits (kerykeion)
04:05 UTC  ─→  Generate 12 daily horoscopes (Claude API)
04:15 UTC  ─→  Generate 12 TikTok scripts + 12 Instagram cards
04:30 UTC  ─→  ElevenLabs: generate 12 voice clips
04:45 UTC  ─→  HeyGen/CapCut: render 12 short videos
05:00 UTC  ─→  Post to 8 Telegram channels
05:30 UTC  ─→  Post to TikTok (staggered, 2-hour intervals)
06:00 UTC  ─→  Post to Instagram Stories
07:00 UTC  ─→  Generate VIP daily readings (personalized per user)
```

### Weekly Operations
- Monday: Generate weekly forecasts (12 signs × 8 languages)
- Wednesday: Celebrity chart analysis (trending person)
- Friday: Compatibility content (viral format)

### Monthly Operations
- Generate monthly forecast articles (SEO)
- Update transit calendar
- Analyze conversion metrics
- A/B test pricing

---

## 6. TECHNOLOGY STACK

| Layer | Technology | Why |
|---|---|---|
| **Frontend (Web)** | Next.js 16 + Three.js + Tailwind | SSR, WebGL, performance |
| **Frontend (Mobile)** | React Native / Expo | Code sharing with web, fast iteration |
| **Backend** | FastAPI (Python) | Shares astrology engine with bot |
| **AI** | Claude API (Anthropic) | Best for persona + long-form readings |
| **Voice** | ElevenLabs | Natural voice for video readings |
| **Video** | HeyGen | AI avatar for video readings |
| **Astrology** | kerykeion (NASA JPL) | Industry-standard ephemeris |
| **Database** | SQLite → PostgreSQL | Start simple, scale when needed |
| **Bot Framework** | Aiogram 3 | Best async Telegram framework |
| **Payments** | Telegram Stars + Stripe + CryptoBot | Multi-rail, low fees |
| **Hosting** | Njalla VPS (anonymous) | Privacy-first infrastructure |
| **CDN** | Cloudflare | Performance + DDoS protection |
| **Analytics** | Plausible / PostHog | Privacy-respecting analytics |

---

## 7. LAUNCH SEQUENCE

### Phase 0: Now → Week 2
- [x] Website hero with WebGL animation
- [x] Birthday → zodiac activation
- [ ] FastAPI backend (connect astrology engine)
- [ ] Birth chart page with interactive wheel

### Phase 1: Weeks 3-4 (Soft Launch)
- [ ] Full onboarding flow (website)
- [ ] Daily personalized readings (website)
- [ ] English Telegram bot live
- [ ] First TikTok content batch (30 videos)

### Phase 2: Weeks 5-8 (Growth)
- [ ] Compatibility checker
- [ ] "Ask the Stars" pay-per-question
- [ ] Ukrainian + Russian bot instances
- [ ] Instagram content pipeline
- [ ] VIP subscription live

### Phase 3: Weeks 9-12 (Scale)
- [ ] PWA (installable web app)
- [ ] Push notifications
- [ ] Remaining 5 language bots
- [ ] YouTube channel launch
- [ ] Referral system

### Phase 4: Months 4-6 (Mobile)
- [ ] React Native app (iOS + Android)
- [ ] App Store optimization
- [ ] Apple/Google IAP integration
- [ ] Video readings pipeline
- [ ] Paid acquisition (TikTok Ads)

---

## 8. COMPETITIVE ADVANTAGES

| Advantage | Why It Matters |
|---|---|
| **WebGL cinematic experience** | No competitor has premium web design. First-mover in visual quality. |
| **8 languages from day 1** | Co-Star is English-only. MENA + CIS markets are underserved. |
| **Telegram-native** | 900M MAU platform, zero app store fees, instant payments via Stars. |
| **Crypto payments** | Access unbanked users + privacy-conscious market. |
| **Anonymous by design** | No email required. Njalla VPS. Mullvad VPN. Counter-positioned vs data-hungry competitors. |
| **AI persona (Olivia)** | Warm, mystical character vs Co-Star's impersonal bluntness. |
| **Full automation** | 12 daily horoscopes, TikTok videos, Instagram cards — all generated without human intervention. |
| **NASA-grade data** | Same JPL ephemeris as Co-Star, but with better AI interpretation (Claude > GPT for persona). |
