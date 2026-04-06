# Olivia Arcana — Co-Star Feature Parity Spec

**Date:** April 6, 2026
**Goal:** Map every Co-Star feature to our implementation, with effort estimates and priority tiers.

---

## Co-Star Feature Inventory → Olivia Arcana Implementation

### TIER 1 — Core Product (Must-Have, Build First)
*These define what the product IS. Without them, there's no product.*

| # | Co-Star Feature | Our Implementation | Effort | Status |
|---|---|---|---|---|
| 1 | **Birth Chart Computation** | Kerykeion engine already built (`src/astrology/charts.py`). Computes all planet positions, houses, aspects from NASA JPL ephemeris. | ✅ Done (bot) | Needs FastAPI endpoint |
| 2 | **Birth Chart Wheel Visualization** | Interactive SVG/Canvas chart wheel showing houses, planet positions, aspect lines. Reference: Co-Star's table + circular toggle view. | 3-4 days | Not started |
| 3 | **Onboarding Flow** | Multi-step form: name → birth date → birth time (optional) → birth city (geocode) → compute chart → show result. 4-5 screens. | 2-3 days | Birthday input exists in Hero |
| 4 | **Daily Personalized Horoscope** | Claude API generates reading based on today's transits overlaid on user's natal chart. Categorized into Power / Pressure / Trouble (Co-Star's format). | 2-3 days | Static horoscopes exist |
| 5 | **Planet-in-Sign Readings** | For each planet in user's chart, show what that placement means. "Your Sun in Pisces means..." × 10 planets + Rising. Pre-written or Claude-generated. | 2-3 days | Not started |
| 6 | **Shared FastAPI Backend** | Python API serving both website and Telegram bot. Endpoints: `/chart`, `/daily`, `/compatibility`, `/transits`. SQLite → user chart storage. | 3-4 days | Designed in spec, not built |

**Tier 1 Total Effort: ~15-20 days**

---

### TIER 2 — Social & Engagement (Differentiators)
*These make users come back daily and invite friends.*

| # | Co-Star Feature | Our Implementation | Effort | Status |
|---|---|---|---|---|
| 7 | **Compatibility / Synastry** | Enter two birth charts → compute synastry scores (already built in `src/astrology/synastry.py`). Show compatibility in: Love, Communication, Conflict, Trust. | 2-3 days | Engine exists, needs UI |
| 8 | **Add Friends** | User accounts (email or Telegram auth). Friend list. See friends' sun signs and daily readings. | 3-4 days | Not started |
| 9 | **Daily Push Notifications** | Web push via Service Worker + Notification API. "Your cosmic weather today: ☀️ Power in communication, ⚠️ tension in finances." | 2 days | Not started |
| 10 | **Transit Alerts** | "Mercury enters your 7th house today" — real-time transit monitoring against user's natal chart. APScheduler + push. | 2-3 days | Transit engine exists (`transits.py`) |
| 11 | **Weekly & Monthly Readings** | Longer-form Claude-generated readings. Weekly: 3-4 paragraphs. Monthly: full forecast with key dates. | 1-2 days | Not started |

**Tier 2 Total Effort: ~12-15 days**

---

### TIER 3 — Premium / Monetization
*Revenue features. Build after Tier 1-2 establish user base.*

| # | Co-Star Feature | Our Implementation | Effort | Status |
|---|---|---|---|---|
| 12 | **"Ask the Stars" (The Void)** | Pay-per-question: user types a question → Claude generates an astrologically-informed answer based on their chart + current transits. Bundle pricing (3 questions / $2.99). | 2-3 days | Not started |
| 13 | **Eros Relationship Reports** | Premium deep-dive compatibility report (2000+ words). Claude-generated from synastry data. One-time purchase ($4.99). | 2 days | Not started |
| 14 | **Chart for Non-Users** | Enter someone else's birth data → see their chart without them needing an account. Premium feature ($1.99). | 1 day | Not started |
| 15 | **Video Readings** | Claude script → ElevenLabs voice → HeyGen avatar. Personal video of Olivia reading your chart. ($39.99). | 3-4 days | Designed, not built |
| 16 | **Annual Forecast** | Year-ahead reading based on solar return chart. Premium one-time ($9.99). | 1-2 days | Not started |

**Tier 3 Total Effort: ~10-14 days**

---

### TIER 4 — Polish & Viral
*Growth mechanics and UX refinements.*

| # | Co-Star Feature | Our Implementation | Effort | Status |
|---|---|---|---|---|
| 17 | **Birth Chart Card (Shareable)** | Generate an image card showing user's big 3 (Sun/Moon/Rising) in a beautiful design. Shareable to Instagram/TikTok. | 1-2 days | Not started |
| 18 | **Zodiac Roast** | Humorous personality roast based on chart placements. Highly shareable. | 1 day | Prompt exists |
| 19 | **Cosmic Compatibility Link** | Share a URL → friend enters their data → instant compatibility result. No account needed. Viral mechanic. | 2 days | Designed in VIRAL_FEATURES.md |
| 20 | **Celestial Event Calendar** | Upcoming eclipses, retrogrades, full moons with personalized impact. | 1-2 days | Not started |
| 21 | **8-Language Support** | EN, UK, RU, AR, DE, ES, PT-BR, FR. All readings + UI translated. | 3-5 days | Config structure exists |

**Tier 4 Total Effort: ~8-12 days**

---

## Architecture Required

```
┌─────────────────────────────────────────────────┐
│                    FRONTEND                      │
│  Next.js Website (React + Three.js + Tailwind)  │
│                                                   │
│  /                    → Hero + Starfield          │
│  /chart               → Birth Chart Wheel         │
│  /daily               → Daily Reading             │
│  /compatibility       → Synastry Checker          │
│  /ask                 → Ask the Stars (premium)    │
│  /profile             → User Profile + Settings   │
│  /onboarding          → Multi-step birth data      │
└──────────────┬──────────────────────────────────┘
               │ REST API calls
               ▼
┌─────────────────────────────────────────────────┐
│               SHARED BACKEND                     │
│         FastAPI (Python 3.9+)                    │
│                                                   │
│  POST /api/chart      → Compute natal chart       │
│  POST /api/daily      → Generate daily reading    │
│  POST /api/compat     → Synastry analysis         │
│  GET  /api/transits   → Current transit positions  │
│  POST /api/ask        → Ask the Stars (Claude)    │
│  POST /api/auth       → Telegram Stars auth       │
│                                                   │
│  Dependencies:                                    │
│  - kerykeion (NASA ephemeris)                     │
│  - anthropic (Claude API for readings)            │
│  - SQLAlchemy (user data)                         │
│  - FastAPI + uvicorn                              │
└──────────────┬──────────────────────────────────┘
               │ Shared engine
               ▼
┌─────────────────────────────────────────────────┐
│            ASTROLOGY ENGINE                      │
│  src/astrology/ (already built)                  │
│                                                   │
│  charts.py    → NatalChart (10 planets + houses)  │
│  transits.py  → Current positions + overlays      │
│  synastry.py  → Compatibility scores              │
│  geocode.py   → City → lat/lng + timezone         │
└─────────────────────────────────────────────────┘
```

---

## What Already Exists (Reusable)

| Component | Location | Status |
|---|---|---|
| Natal chart computation | `src/astrology/charts.py` | ✅ Working, tested |
| Transit computation | `src/astrology/transits.py` | ✅ Working, tested |
| Synastry computation | `src/astrology/synastry.py` | ✅ Working |
| Geocoding | `src/astrology/geocode.py` | ✅ Working |
| Claude persona engine | `src/persona/engine.py` | ✅ Working |
| Reading prompts | `src/persona/prompts/` | ✅ 4 prompts done |
| Database models | `src/db/models.py` | ✅ 9 models |
| Payment system | `src/payments/` | ✅ Stars + CryptoBot |
| Daily scheduler | `src/content/scheduler.py` | ✅ APScheduler |
| Website (Next.js) | `website/` | ✅ 10 components + WebGL |
| Birthday → sign calculator | `website/src/lib/zodiac-utils.ts` | ✅ Just built |
| Design system | `docs/DESIGN_SYSTEM.md` | ✅ 5 variants |
| Growth playbook | `docs/GROWTH_PLAYBOOK.md` | ✅ Complete |

---

## Recommended Build Order

### Sprint 1 (Week 1): Foundation
1. **FastAPI backend** — `/api/chart` endpoint wrapping `charts.py`
2. **Onboarding flow** — Multi-step form: name → date → time → city → result
3. **Birth chart page** — SVG wheel visualization of natal chart

### Sprint 2 (Week 2): Daily Engine
4. **Daily reading API** — Claude generates personalized reading from transits × natal chart
5. **Daily reading page** — Power / Pressure / Trouble format
6. **Planet readings** — "Your Sun in Pisces" × all placements

### Sprint 3 (Week 3): Social
7. **Compatibility checker** — Two charts → synastry scores
8. **Shareable chart card** — Generate image, share URL
9. **Basic user accounts** — Save chart, return to readings

### Sprint 4 (Week 4): Monetization
10. **Ask the Stars** — Pay-per-question Claude Q&A
11. **Premium readings** — Eros reports, annual forecast
12. **Payment integration** — Telegram Stars + crypto

---

## Key Differences: Olivia Arcana vs Co-Star

| Aspect | Co-Star | Olivia Arcana |
|---|---|---|
| **Personality** | Blunt, Gen-Z tone, meme-ish | Warm, mystical, intimate oracle |
| **Data source** | NASA ephemeris | NASA JPL DE440/DE441 (same quality) |
| **AI** | Proprietary + human astrologers | Claude API with custom prompts |
| **Platform** | Native iOS/Android app | Telegram bot + Web app (8 languages) |
| **Visual style** | Minimalist black/white | Cinematic cosmic nebula (WebGL) |
| **Monetization** | Freemium subscriptions | Stars + CryptoBot + per-unlock |
| **Differentiator** | Social graph | Anonymous, privacy-first, multilingual |

---

## Total Effort Estimate

| Tier | Features | Days |
|---|---|---|
| Tier 1 (Core) | Chart, daily reading, onboarding, API | 15-20 |
| Tier 2 (Social) | Compatibility, friends, notifications | 12-15 |
| Tier 3 (Premium) | Ask the Stars, Eros, video readings | 10-14 |
| Tier 4 (Viral) | Share cards, roasts, compatibility links | 8-12 |
| **Total** | **21 features** | **~45-60 days** |

With focused sprints, an MVP (Tier 1) is deliverable in ~2-3 weeks.
