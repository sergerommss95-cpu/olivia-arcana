# Olivia Arcana — Project Admin & Management Handoff

**Date:** April 6, 2026
**Status:** Telegram bots built (31 Python files). Website hero + WebGL done. Everything else planned.
**Project Root:** `/Users/macbookpro/olivia-arcana/`

---

## 1. Master Task List by Platform

### WEBSITE (Next.js + Three.js)

| # | Task | Priority | Status | Effort | Dependencies |
|---|------|----------|--------|--------|-------------|
| W1 | WebGL cosmos engine (nebula, flowmap, stars, zodiac) | P0 | DONE | -- | -- |
| W2 | Hero section (birthday input, horoscope display) | P0 | DONE | -- | -- |
| W3 | Landing page sections (Navbar, Features, Pricing, etc.) | P0 | DONE | -- | -- |
| W4 | FastAPI backend (connect astrology engine to website) | P0 | NOT STARTED | 3-4 days | -- |
| W5 | Onboarding flow (name, date, time, city -> chart) | P0 | NOT STARTED | 2-3 days | W4 |
| W6 | Birth chart wheel page (/chart, SVG visualization) | P0 | NOT STARTED | 3-4 days | W4 |
| W7 | Daily reading page (/daily, Power/Pressure/Trouble) | P1 | NOT STARTED | 2-3 days | W4 |
| W8 | Planet-in-sign readings ("Your Sun in Pisces") | P1 | NOT STARTED | 2-3 days | W4 |
| W9 | Compatibility page (/compatibility, synastry scores) | P1 | NOT STARTED | 2-3 days | W4 |
| W10 | Ask the Stars page (/ask, pay-per-question) | P1 | NOT STARTED | 2-3 days | W4, W14 |
| W11 | User accounts (anonymous, optional Telegram link) | P1 | NOT STARTED | 3-4 days | W4 |
| W12 | Shareable birth chart card (image generation) | P2 | NOT STARTED | 1-2 days | W4 |
| W13 | Mobile optimization (reduce stars, disable flowmap) | P2 | NOT STARTED | 2-3 days | -- |
| W14 | Stripe payment integration | P2 | NOT STARTED | 2-3 days | W11 |
| W15 | Post-processing (bloom, chromatic aberration) | P3 | NOT STARTED | 1-2 days | -- |
| W16 | Zodiac-specific constellation animations (12 unique) | P3 | NOT STARTED | 3-5 days | -- |
| W17 | Rare celestial events (meteors, flares) | P3 | NOT STARTED | 1-2 days | -- |
| W18 | Glass refraction layer (SVG displacement) | P3 | NOT STARTED | 2-3 days | -- |

### TELEGRAM BOT (Python + Aiogram 3)

| # | Task | Priority | Status | Effort | Dependencies |
|---|------|----------|--------|--------|-------------|
| B1 | Core bot framework (Aiogram 3, handlers, middlewares) | P0 | DONE | -- | -- |
| B2 | Chat handler (Claude API persona engine) | P0 | DONE | -- | -- |
| B3 | Natal chart computation (kerykeion) | P0 | DONE | -- | -- |
| B4 | Transit computation | P0 | DONE | -- | -- |
| B5 | Synastry/compatibility computation | P0 | DONE | -- | -- |
| B6 | Geocoding (city -> lat/lng + timezone) | P0 | DONE | -- | -- |
| B7 | Tarot readings handler | P0 | DONE | -- | -- |
| B8 | Payment system (Telegram Stars + CryptoBot) | P0 | DONE | -- | -- |
| B9 | Database models (9 models, SQLAlchemy) | P0 | DONE | -- | -- |
| B10 | Daily content scheduler (APScheduler) | P0 | DONE | -- | -- |
| B11 | Reading prompts (4 prompts for different reading types) | P0 | DONE | -- | -- |
| B12 | VIP subscription management | P0 | DONE | -- | -- |
| B13 | Deploy bot to VPS | P1 | NOT STARTED | 1 day | -- |
| B14 | Set up 8 language bot instances via BotFather | P1 | NOT STARTED | 1 day | B13 |
| B15 | Create 8 public Telegram channels | P1 | NOT STARTED | 1 day | B14 |
| B16 | Zodiac roast feature (/roast) | P1 | NOT STARTED | 1 day | -- |
| B17 | Birth chart identity card generation (Pillow) | P1 | NOT STARTED | 1-2 days | -- |
| B18 | Cosmic compatibility link (viral mechanic) | P1 | NOT STARTED | 2 days | -- |
| B19 | Celebrity chart database + /lookup command | P2 | NOT STARTED | 2-3 days | -- |
| B20 | Re-engagement messages (7-day inactive users) | P2 | NOT STARTED | 1 day | B13 |
| B21 | Group chat handler (cosmic group analysis) | P3 | NOT STARTED | 3-4 days | -- |
| B22 | Video readings pipeline (ElevenLabs + HeyGen) | P3 | NOT STARTED | 3-4 days | -- |

### MOBILE APP (React Native / Expo)

| # | Task | Priority | Status | Effort | Dependencies |
|---|------|----------|--------|--------|-------------|
| M1 | PWA wrapper (manifest.json, service worker) | P2 | NOT STARTED | 1-2 weeks | W4, W6, W7 |
| M2 | React Native / Expo project setup | P2 | NOT STARTED | 1 day | W4 |
| M3 | Onboarding flow (birth data collection) | P2 | NOT STARTED | 3-4 days | W4 |
| M4 | Birth chart wheel (react-native-svg) | P2 | NOT STARTED | 3-4 days | W4 |
| M5 | Daily reading page | P2 | NOT STARTED | 2-3 days | W4 |
| M6 | Push notifications (expo-notifications) | P2 | NOT STARTED | 2 days | W4 |
| M7 | Apple IAP + Google Play Billing | P2 | NOT STARTED | 3-4 days | M2 |
| M8 | App Store / Play Store submission | P2 | NOT STARTED | 2-3 days | M2-M7 |
| M9 | Apple Watch complications | P3 | NOT STARTED | 2-3 weeks | M8 |

### TIKTOK

| # | Task | Priority | Status | Effort | Dependencies |
|---|------|----------|--------|--------|-------------|
| T1 | Account registration (emulator + eSIM) | P1 | NOT STARTED | 1 day | -- |
| T2 | Script generation pipeline (Claude API prompts) | P1 | NOT STARTED | 2 days | -- |
| T3 | ElevenLabs voice setup ("Olivia" voice) | P1 | NOT STARTED | 1 day | -- |
| T4 | CapCut video templates (daily zodiac) | P1 | NOT STARTED | 2-3 days | T3 |
| T5 | First batch: 30 test videos | P1 | NOT STARTED | 3-4 days | T2, T3, T4 |
| T6 | HeyGen avatar setup (weekly skits) | P2 | NOT STARTED | 1-2 days | -- |
| T7 | Auto-posting pipeline (TikTok API or scheduler) | P2 | NOT STARTED | 2 days | T1 |
| T8 | Daily automation (12 clips/day, fully automated) | P2 | NOT STARTED | 2-3 days | T2-T7 |

### INSTAGRAM

| # | Task | Priority | Status | Effort | Dependencies |
|---|------|----------|--------|--------|-------------|
| I1 | Account setup (@oliviaarcana) | P1 | NOT STARTED | 1 day | -- |
| I2 | Pillow image generation templates (daily cards) | P1 | NOT STARTED | 2-3 days | -- |
| I3 | Story template generation (12 daily horoscopes) | P1 | NOT STARTED | 2 days | I2 |
| I4 | Bio + Linktree setup | P1 | NOT STARTED | 1 day | I1 |
| I5 | Buffer/Later scheduling setup | P1 | NOT STARTED | 1 day | I1 |
| I6 | First week of content (7 days preloaded) | P1 | NOT STARTED | 3-4 days | I2, I3 |
| I7 | Carousel templates (Big 3, compatibility, transits) | P2 | NOT STARTED | 2-3 days | I2 |
| I8 | Cross-posting pipeline from TikTok to Reels | P2 | NOT STARTED | 1 day | T5 |

### INFRASTRUCTURE

| # | Task | Priority | Status | Effort | Dependencies |
|---|------|----------|--------|--------|-------------|
| X1 | VPS setup (Njalla, anonymous) | P0 | NOT STARTED | 1 day | -- |
| X2 | Domain registration (olivia-arcana.com) | P0 | NOT STARTED | 1 day | -- |
| X3 | SSL certificate (Cloudflare) | P0 | NOT STARTED | 1 day | X2 |
| X4 | Deploy website to VPS / Vercel | P0 | NOT STARTED | 1 day | X1, X2 |
| X5 | Database setup (SQLite -> Postgres migration plan) | P1 | NOT STARTED | 1 day | X1 |
| X6 | Analytics setup (Plausible or PostHog, self-hosted) | P2 | NOT STARTED | 1 day | X1 |
| X7 | Monitoring + alerts (uptime, error tracking) | P2 | NOT STARTED | 1 day | X1 |
| X8 | Backup strategy (daily DB dumps) | P2 | NOT STARTED | 1 day | X1 |

---

## 2. Priority Tier Definitions

| Tier | Meaning | Timeframe |
|------|---------|-----------|
| **P0** | Blocking. Cannot launch without this. | This week |
| **P1** | This sprint. Important for launch or early growth. | Next 2 weeks |
| **P2** | Next sprint. Important but not blocking. | Weeks 3-4 |
| **P3** | Backlog. Nice to have. Build when bandwidth allows. | Month 2+ |

---

## 3. Current Status Summary

| Component | Status | Details |
|-----------|--------|---------|
| Telegram bot (code) | DONE | 31 Python files, all handlers, payments, scheduler |
| Telegram bot (deployed) | NOT STARTED | Code ready, needs VPS deployment |
| Website (hero + WebGL) | DONE | Full cosmos engine, birthday activation |
| Website (backend) | NOT STARTED | FastAPI endpoints designed, not built |
| Website (product pages) | NOT STARTED | Chart, daily, compatibility pages |
| Mobile app | NOT STARTED | Planning only |
| TikTok | NOT STARTED | Pipeline designed |
| Instagram | NOT STARTED | Pipeline designed |
| Infrastructure | NOT STARTED | VPS, domain, SSL |
| Documentation | DONE | 8 spec docs, 5 handoff docs |

---

## 4. Sprint Plan Template

### Sprint [N]: [Name] — [Start Date] to [End Date]

**Goal:** [One sentence describing what this sprint delivers]

**Capacity:** [X days of dev time available]

| Task | Owner | Est. | Status | Notes |
|------|-------|------|--------|-------|
| [Task ID] [Description] | [Person] | [Days] | Not started | |
| [Task ID] [Description] | [Person] | [Days] | Not started | |

**Demo/Review:** [Date]
**Retrospective:** [Date]

**Definition of Done:**
- [ ] Feature works locally
- [ ] Tested on target device/browser
- [ ] No console errors
- [ ] Code reviewed (or Claude Code review)
- [ ] Deployed to staging

### Recommended Sprint 1: Foundation (Week 1-2)

**Goal:** FastAPI backend live, birth chart page functional, bot deployed to VPS.

| Task | Est. | Status |
|------|------|--------|
| X1: VPS setup | 1 day | |
| X2: Domain registration | 1 day | |
| B13: Deploy bot to VPS | 1 day | |
| W4: FastAPI backend | 3-4 days | |
| W5: Onboarding flow | 2-3 days | |
| W6: Birth chart wheel | 3-4 days | |

### Recommended Sprint 2: Daily Engine + Content (Week 3-4)

**Goal:** Daily readings working, first TikTok content batch, Instagram account live.

| Task | Est. | Status |
|------|------|--------|
| W7: Daily reading page | 2-3 days | |
| W8: Planet-in-sign readings | 2-3 days | |
| T1: TikTok account | 1 day | |
| T2-T5: TikTok first batch | 5-7 days | |
| I1-I6: Instagram setup + first week | 5-7 days | |
| B14-B15: 8 language bot instances + channels | 2 days | |

---

## 5. KPI Dashboard Structure

### Metrics to Track (Weekly)

#### Telegram Bot
| Metric | Source | Target (M1) | Target (M3) | Target (M6) |
|--------|--------|-------------|-------------|-------------|
| Total bot users (all languages) | Bot DB | 500 | 3,000 | 15,000 |
| Daily active users | Bot DB | 50 | 300 | 1,500 |
| VIP subscribers | Bot DB | 25 | 150 | 750 |
| Monthly revenue (Stars + Crypto) | Payment DB | $163 | $975 | $4,875 |
| Free-to-VIP conversion rate | Calculated | 3% | 5% | 5% |
| VIP retention (monthly) | Calculated | 70% | 75% | 80% |

#### Website
| Metric | Source | Target (M1) | Target (M3) | Target (M6) |
|--------|--------|-------------|-------------|-------------|
| Monthly visitors | Plausible/PostHog | 1,000 | 10,000 | 50,000 |
| Onboarding completion rate | Analytics | -- | 60% | 70% |
| Chart calculations (total) | Backend logs | -- | 2,000 | 15,000 |

#### TikTok
| Metric | Source | Target (M1) | Target (M3) | Target (M6) |
|--------|--------|-------------|-------------|-------------|
| Followers | TikTok Analytics | 500 | 5,000 | 50,000 |
| Monthly views | TikTok Analytics | 50,000 | 500,000 | 5,000,000 |
| Avg views per video | TikTok Analytics | 500 | 5,000 | 20,000 |
| Telegram signups from TikTok | Bot DB (tracking) | 20 | 200 | 2,000 |

#### Instagram
| Metric | Source | Target (M1) | Target (M3) | Target (M6) |
|--------|--------|-------------|-------------|-------------|
| Followers | IG Insights | 200 | 2,000 | 15,000 |
| Engagement rate | IG Insights | 5% | 4% | 3% |
| Link clicks (weekly) | Linktree | 30 | 200 | 1,000 |

#### Financial
| Metric | Source | Target (M1) | Target (M3) | Target (M6) |
|--------|--------|-------------|-------------|-------------|
| Total revenue | All payment rails | $163 | $975 | $4,875 |
| Total costs | Tracking sheet | $50 | $150 | $500 |
| Net profit | Calculated | $113 | $825 | $4,375 |
| CAC (cost per acquisition) | Calculated | $0 (organic) | <$2 | <$3 |
| LTV (lifetime value) | Calculated | -- | $20 | $40 |

---

## 6. Team Roles Needed (If Hiring)

| Role | Responsibility | When | Type |
|------|---------------|------|------|
| **Solo founder** (current) | Everything | Now | Full-time |
| **Content creator** | TikTok + Instagram daily content | Month 2 | Part-time, $500-1000/mo |
| **Backend developer** | FastAPI, database, scaling | Month 3 (if scaling fast) | Contract, $3-5K/mo |
| **Mobile developer** | React Native app | Month 4 | Contract, $4-6K/mo |
| **Community manager** | Telegram groups, comment replies, DMs | Month 3 | Part-time, $500-800/mo |
| **Astrology consultant** | Content quality review, special readings | As needed | Freelance, $25-50/hr |

**Advice:** Stay solo as long as possible. The bot + content pipeline is fully automated. Only hire when a specific bottleneck can't be solved with more automation.

---

## 7. Daily / Weekly Routines Checklist

### Daily Routine (20-30 minutes)

- [ ] **Check bot health** -- Is the bot responding? Any error logs? (SSH into VPS, check systemd service)
- [ ] **Check analytics** -- New users, VIP conversions, revenue (Bot DB dashboard)
- [ ] **Reply to flagged DMs** -- Bot auto-handles most; check for edge cases
- [ ] **Reply to 5+ Telegram channel comments** (Olivia's voice)
- [ ] **Reply to 3-5 TikTok comments** (Olivia's voice)
- [ ] **Check TikTok video performance** -- Did today's videos hit >1000 views in 4 hours?
- [ ] **Review daily content generation** -- Did all 12 horoscopes generate correctly?

### Weekly Routine (Monday, 1 hour)

- [ ] **Pull KPI dashboard** -- All metrics from Section 5
- [ ] **Review conversion funnel** -- Where are users dropping off?
- [ ] **Plan this week's content** -- 7 TikTok hooks, 3 carousel topics
- [ ] **Check astrological events** -- Any transits worth a special post this week?
- [ ] **Cross-promotion outreach** -- DM 3-5 astrology channel admins
- [ ] **Review and adjust** -- What worked last week? Double down. What didn't? Stop.

### Monthly Routine (First Monday, 2 hours)

- [ ] **Full KPI review** -- See Growth Playbook Section 6
- [ ] **Subscriber audit** -- Growth rate, churn, per-language breakdown
- [ ] **Content audit** -- Read 10 random bot readings for quality
- [ ] **Revenue review** -- Stars vs Crypto split, pricing effectiveness
- [ ] **Competitive check** -- What are Co-Star, Pattern, Sanctuary doing?
- [ ] **Plan next month's special content** -- Eclipse/retrograde campaigns
- [ ] **Budget review** -- API costs, VPS, tools
- [ ] **A/B test pricing** if conversion is below target

---

## 8. Infrastructure Status

| Component | Service | Status | Account | Monthly Cost |
|-----------|---------|--------|---------|-------------|
| VPS | Njalla (anonymous hosting) | NOT SET UP | -- | ~$15/mo |
| Domain | Njalla or Cloudflare Registrar | NOT SET UP | -- | ~$12/yr |
| CDN | Cloudflare (free tier) | NOT SET UP | -- | Free |
| Database | SQLite (start) -> PostgreSQL (scale) | PLANNED | -- | Free (SQLite) |
| Bot hosting | Systemd service on VPS | NOT SET UP | -- | Included in VPS |
| Website hosting | VPS or Vercel (free tier) | NOT SET UP | -- | Free (Vercel) |
| Analytics | Plausible or PostHog (self-hosted) | NOT SET UP | -- | Free (self-hosted) |
| Email | Proton Mail or similar | NOT SET UP | -- | Free-$5/mo |

### API Keys Needed
| Service | Purpose | Status | Estimated Cost |
|---------|---------|--------|----------------|
| Anthropic (Claude API) | AI readings, persona engine | HAVE KEY (bot uses it) | ~$150/mo at 10K users |
| Telegram Bot API | Bot framework | HAVE KEY (via BotFather) | Free |
| ElevenLabs | TikTok voiceovers | NEED KEY | $5-22/mo |
| HeyGen | AI avatar videos | NEED KEY | $29/mo |
| Stripe | Website payments | NEED KEY | 2.9% + $0.30/txn |
| TikTok Developer | Auto-posting API | NEED KEY | Free (requires app approval) |

### Accounts Needed
| Account | Purpose | Status |
|---------|---------|--------|
| TikTok (@oliviaarcana) | Content posting | NOT CREATED |
| Instagram (@oliviaarcana) | Content posting | NOT CREATED |
| Linktree | Link-in-bio hub | NOT CREATED |
| Buffer or Later | Social scheduling | NOT CREATED |
| Cloudflare | CDN + DNS | NOT CREATED |
| eSIM provider | Phone verification for social accounts | NOT CREATED |

---

## 9. Budget Tracking Template

### Monthly Budget

| Category | Item | Budget | Actual | Notes |
|----------|------|--------|--------|-------|
| **Infrastructure** | VPS (Njalla) | $15 | | |
| | Domain | $1 | | ($12/yr) |
| | Cloudflare | $0 | | Free tier |
| **APIs** | Claude API | $150 | | Scales with users |
| | ElevenLabs | $22 | | Creator plan |
| | HeyGen | $29 | | Creator plan |
| **Tools** | Buffer/Later | $20 | | Social scheduling |
| | Linktree Pro | $5 | | Analytics |
| | CapCut Pro | $8 | | Video templates |
| **Marketing** | Paid ads (Month 3+) | $0-300 | | Start at $0 |
| | Cross-promo buys | $0-200 | | Channel shoutouts |
| **Total** | | **~$250-550** | | |

### Revenue vs Cost Tracker

| Month | Revenue | Costs | Profit | Notes |
|-------|---------|-------|--------|-------|
| Month 1 | | | | Launch month, expect minimal revenue |
| Month 2 | | | | |
| Month 3 | | | | Start paid ads if revenue > $500 |
| Month 4 | | | | |
| Month 5 | | | | |
| Month 6 | | | | Target: $4,875 revenue |

**Rule:** Never spend more on ads than 50% of previous month's proven revenue.

---

## 10. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Claude API costs spike** | Medium | High | Set daily API budget limits. Cache readings. Pre-generate daily horoscopes in batch at 04:00 UTC instead of on-demand. |
| **TikTok account banned** | Medium | High | Use anonymous registration. Don't hard-sell. Follow community guidelines. Have backup account ready. |
| **Telegram bot rate-limited** | Low | High | Implement proper throttling in Aiogram middleware. Queue messages during high volume. |
| **Competitor copies viral features** | Medium | Low | Move fast. Features are easy to copy but execution + persona are not. Olivia's voice is the moat. |
| **kerykeion library breaks in update** | Low | Medium | Pin exact version in requirements.txt. Test before upgrading. |
| **VPS goes down** | Low | High | Daily automated backups. Document recovery procedure. Secondary VPS as failover. |
| **Content quality degrades** | Medium | Medium | Monthly content audit. Read 10 random readings. A/B test Claude prompts. |
| **Apple/Google reject app** | Medium | Medium | Follow all App Store guidelines. No in-app purchase workarounds. Privacy-first. |
| **GDPR complaint** | Low | High | No email required. Data export endpoint. Data deletion endpoint. Privacy policy. |
| **Claude API changes pricing** | Low | High | Abstract AI layer. Could switch to other providers if needed. Cache aggressively. |
| **User data breach** | Low | Critical | Encrypt birth data at rest. No PII beyond birth date/time/city. Anonymous accounts. |
| **Burnout (solo founder)** | High | High | Automate everything possible. Only manual work: content review + community engagement. |

---

## 11. Decision Log

| Date | Decision | Why | Alternatives Considered |
|------|----------|-----|------------------------|
| Apr 6, 2026 | Primary brand: Celestial Noir (gold on black) | Highest perceived value, works across all markets | Ethereal Dawn, Mystic Indigo, Terracotta Oracle, Minimal Cosmos |
| Apr 6, 2026 | Three.js WebGL for website cosmos | Premium visual quality, no competitor has WebGL | Canvas 2D (too basic), Lottie (not interactive enough), CSS-only (not immersive) |
| Apr 6, 2026 | Telegram-first launch (before website product pages) | 900M MAU, zero app store fees, instant payments | Website-first, app-first |
| Apr 6, 2026 | Anonymous by design (no email required) | Privacy differentiator vs data-hungry competitors | Email-required accounts |
| Apr 6, 2026 | kerykeion for astrology engine | NASA JPL ephemeris, Python, free, battle-tested | Swiss Ephemeris (C, more complex), Starcrab (Rust, immature) |
| Apr 6, 2026 | Claude API for readings (not GPT) | Better persona adherence, superior long-form, warmer tone | GPT-4o (cheaper but worse persona), Gemini (worse for creative) |
| Apr 6, 2026 | 8 languages from launch | CIS + MENA markets underserved, Co-Star is English-only | English-only then expand |
| Apr 6, 2026 | PWA before React Native | Validate mobile UX with minimal effort before investing in native | React Native first, Flutter |
| Apr 6, 2026 | Telegram Stars + CryptoBot for payments | Zero platform fee, instant settlement | Stripe only (higher fees), Apple IAP only (30% cut) |

---

## 12. File Index (Where Everything Lives)

### Project Root: `/Users/macbookpro/olivia-arcana/`

```
olivia-arcana/
  |
  +-- src/                              # TELEGRAM BOT (Python)
  |   +-- astrology/
  |   |   +-- charts.py                 # Natal chart computation (kerykeion + NASA JPL)
  |   |   +-- transits.py               # Current transit positions
  |   |   +-- synastry.py               # Compatibility scores
  |   |   +-- geocode.py                # City -> lat/lng + timezone
  |   +-- bot/
  |   |   +-- handlers/
  |   |   |   +-- start.py              # /start command, onboarding
  |   |   |   +-- chat.py               # Free chat handler (Claude API)
  |   |   |   +-- readings.py           # Birth chart + reading handlers
  |   |   |   +-- tarot.py              # Tarot spread handlers
  |   |   |   +-- compatibility.py      # Compatibility handler
  |   |   |   +-- subscribe.py          # VIP subscription handler
  |   |   +-- keyboards.py              # Inline keyboard layouts
  |   |   +-- middlewares.py             # Rate limiting, user tracking
  |   +-- persona/
  |   |   +-- engine.py                  # Claude API persona engine (Olivia's voice)
  |   |   +-- context.py                # Conversation context management
  |   +-- payments/
  |   |   +-- stars.py                   # Telegram Stars integration
  |   |   +-- cryptobot.py              # @CryptoBot (TON/USDT/BTC)
  |   |   +-- manager.py                # Payment routing logic
  |   +-- content/
  |   |   +-- scheduler.py              # APScheduler daily content generation
  |   +-- db/
  |   |   +-- models.py                  # SQLAlchemy models (9 models)
  |   |   +-- repository.py             # Database queries
  |   +-- config.py                      # API keys, bot tokens, settings
  |   +-- crm/                           # CRM placeholder
  |   +-- video/                         # Video reading placeholder
  |
  +-- website/                           # WEBSITE (Next.js)
  |   +-- src/
  |   |   +-- app/
  |   |   |   +-- layout.tsx             # Root layout
  |   |   |   +-- page.tsx               # Landing page
  |   |   +-- components/
  |   |   |   +-- Starfield.tsx          # WebGL engine mount
  |   |   |   +-- Hero.tsx               # Birthday input + horoscope
  |   |   |   +-- Navbar.tsx             # Navigation
  |   |   |   +-- Features.tsx           # Feature cards
  |   |   |   +-- HowItWorks.tsx         # Process explanation
  |   |   |   +-- DailyHoroscope.tsx     # Sample reading
  |   |   |   +-- Pricing.tsx            # Subscription plans
  |   |   |   +-- Testimonials.tsx       # User testimonials
  |   |   |   +-- CTA.tsx               # Call to action
  |   |   |   +-- Footer.tsx             # Footer
  |   |   |   +-- cosmos/
  |   |   |       +-- data/constellations.ts    # 12 zodiac sign data
  |   |   |       +-- engine/WebGLEngine.ts     # Three.js core
  |   |   |       +-- engine/NebulaPlane.ts     # GLSL nebula shader
  |   |   |       +-- engine/StarSystem.ts      # GPU star particles
  |   |   |       +-- engine/FlowmapSystem.ts   # Mouse displacement
  |   |   |       +-- engine/ZodiacGL.ts        # Constellation renderer
  |   |   |       +-- engine/zodiac-renderer.ts # OLD Canvas 2D (unused)
  |   |   +-- lib/
  |   |       +-- zodiac-utils.ts        # Sun sign calculator + horoscopes
  |   +-- public/
  |   |   +-- nebula-bg.jpg              # 5K nebula photo (681KB)
  |   +-- package.json
  |   +-- next.config.ts
  |   +-- tailwind.config.ts
  |   +-- tsconfig.json
  |
  +-- docs/                              # DOCUMENTATION
  |   +-- COSTAR_FEATURE_SPEC.md         # 21 features, 4 tiers, architecture
  |   +-- BUSINESS_ARCHITECTURE.md       # Revenue model, pricing, unit economics
  |   +-- MOTION_DIRECTION.md            # Animation spec, zodiac motion concepts
  |   +-- DESIGN_SYSTEM.md               # 5 visual variants, typography, colors
  |   +-- ASSET_SPECIFICATIONS.md        # 14 marketing asset templates
  |   +-- GROWTH_PLAYBOOK.md             # Daily/weekly/monthly routines, KPIs
  |   +-- VIRAL_FEATURES.md              # 7 viral feature concepts
  |
  +-- handoffs/                          # SESSION HANDOFF DOCS
  |   +-- HANDOFF_WEBSITE.md             # Website development handoff
  |   +-- HANDOFF_MOBILE.md              # Mobile app handoff
  |   +-- HANDOFF_TIKTOK.md              # TikTok content pipeline handoff
  |   +-- HANDOFF_INSTAGRAM.md           # Instagram content pipeline handoff
  |   +-- HANDOFF_ADMIN.md               # This file
  |
  +-- SESSION_HANDOFF_V3.md              # Latest session state
  +-- SESSION_HANDOFF_V2.md              # Previous session state
```

---

## 13. How to Start a New Claude Code Session

When starting a new Claude Code session to work on this project, provide the following context:

### Minimal Context (Copy-Paste This)

```
I'm working on the Olivia Arcana project at ~/olivia-arcana/.

Key context files to read:
- SESSION_HANDOFF_V3.md (current state)
- handoffs/HANDOFF_[RELEVANT].md (for the specific area you're working on)

[Then describe what you want to build/fix]
```

### Full Context (For Major Work)

```
I'm working on the Olivia Arcana project at ~/olivia-arcana/.

Read these files for full context:
1. SESSION_HANDOFF_V3.md — what's built, what's next
2. docs/COSTAR_FEATURE_SPEC.md — full feature spec with architecture
3. docs/BUSINESS_ARCHITECTURE.md — business model and pricing
4. docs/DESIGN_SYSTEM.md — visual design tokens and patterns
5. handoffs/HANDOFF_[RELEVANT].md — specific area handoff

The project is an AI astrology platform with:
- Telegram bots (8 languages, Python, Aiogram 3, kerykeion, Claude API) — BUILT
- Website (Next.js 16, Three.js WebGL cosmos engine) — Hero done, backend needed
- Mobile app (planned, React Native/Expo)
- TikTok + Instagram content pipelines (planned, fully designed)

[Then describe what you want to build/fix]
```

### Tips for Effective Sessions
1. **Be specific** about which component you're working on (bot, website, TikTok, etc.)
2. **Reference the handoff doc** for that component -- it has file paths, commands, and technical details
3. **Mention known issues** if relevant (e.g., "Hero.tsx has hydration warnings")
4. **State the end goal** clearly (e.g., "I need the FastAPI backend running with /api/chart returning natal chart data")
5. **If running the website:** remind Claude about the PATH fix and --webpack flag
