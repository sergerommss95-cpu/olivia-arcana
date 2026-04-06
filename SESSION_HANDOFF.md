# Olivia Arcana — Session Handoff Document

**Date:** April 6, 2026
**Project:** `/Users/macbookpro/olivia-arcana/`
**Git branch:** `main` (6 commits)

---

## What Was Built

### 1. Complete Design Spec (DONE)
**File:** `docs/superpowers/specs/2026-04-06-olivia-arcana-design.md`

Full product specification covering:
- Persona: Olivia Arcana — warm, mystical AI astrologer + tarot reader
- 8 languages: EN, UK, RU, AR, DE, ES, PT-BR, FR
- Architecture: Single Python codebase, Aiogram 3, multi-dispatcher
- Products: Free tier (5 msg/day) + VIP subscription + per-unlock readings + video readings ($39.99)
- Payments: Telegram Stars (default) + @CryptoBot (TON/USDT/BTC) dual-rail
- Astrology engine: kerykeion (NASA JPL DE440/DE441 ephemeris)
- AI: Claude API for persona conversations + reading generation
- Database: SQLite per language, SQLAlchemy ORM, WAL mode, migration-ready
- Content automation: APScheduler — daily zodiac, tarot, VIP readings, re-engagement, birthdays
- Conversion funnel: Public channel → bot DM → free reading → behavioral triggers → VIP
- Anonymity: Njalla VPS (XMR), Silent.link eSIM, Mullvad VPN, Android emulator registration
- Website: Next.js landing page + web app + shared FastAPI astrology API
- Video readings: Claude script → ElevenLabs voice → HeyGen avatar video (fully automated)

Spec was reviewed by automated reviewer — 18 issues found and fixed.

### 2. Marketing Deliverables (5 Documents, DONE)

| Document | File | Contents |
|----------|------|----------|
| Growth Playbook | `docs/GROWTH_PLAYBOOK.md` | Daily/weekly/monthly routines, 10 Telegram growth tactics, TikTok content pipeline, paid ad strategy phases, KPI dashboard (15 metrics), 2026 astrological event calendar, cold start playbook (first 30 days), TikTok hook templates |
| Brand Design System | `docs/DESIGN_SYSTEM.md` | 5 brand variants with full hex palettes, Google Fonts typography, visual motifs, card templates. Variants: Celestial Noir (primary), Ethereal Dawn, Mystic Indigo, Terracotta Oracle, Minimal Cosmos |
| Tarot Deck Concepts | `docs/TAROT_DECK_CONCEPTS.md` | 5 deck designs: Arcana Aurea (Art Deco gold), Celestial Watercolor, Neon Oracle (cyberpunk), Terra Mystica (woodcut), Astral Minimal. 4 sample cards each (Fool, High Priestess, Tower, Star) with full visual descriptions + Midjourney/DALL-E prompts |
| Asset Specifications | `docs/ASSET_SPECIFICATIONS.md` | 14 marketing assets fully specified: channel banner, welcome card, daily horoscope template, tarot card template, weekly forecast, VIP CTA, birthday card, compatibility cover, eclipse banner, re-engagement card, pricing card, story templates, birth chart identity card, zodiac roast card. All with dimensions, layouts, copy, generation prompts |
| Viral Features | `docs/VIRAL_FEATURES.md` | 7 features: Cosmic Compatibility Link, Birth Chart Card, Zodiac Roast, Cosmic Clock, Cosmic Year Wrapped, Celebrity Chart Lookup, Cosmic Group Chat. Each with mechanics, psychology, complexity rating, monetization angle, viral coefficient estimate |

### 3. Telegram Bot (DONE — Verified Working)

**31 Python files** across 8 modules. All imports verified. Astrology engine tested computing real planetary positions.

#### Module Map

| Module | Files | Status | What it does |
|--------|-------|--------|-------------|
| `src/config.py` | 1 | DONE | YAML config loader, per-language overrides, env var mapping |
| `src/db/models.py` | 1 | DONE | 9 SQLAlchemy models: User, Profile, Conversation, ConversationSummary, Reading, Payment, Subscription, Analytics, GeocodeCache |
| `src/db/repository.py` | 1 | DONE | Async data access layer (60+ methods). Abstracts all DB ops for future Postgres migration |
| `src/astrology/charts.py` | 1 | DONE, TESTED | Kerykeion wrapper — natal chart computation. Returns structured NatalChart with planets, houses, aspects, dominant element |
| `src/astrology/transits.py` | 1 | DONE, TESTED | Current transit positions, transit-to-natal overlay, cosmic weather score (green/yellow/red) |
| `src/astrology/synastry.py` | 1 | DONE | Synastry computation between two charts. Category scores (Sun Harmony, Moon Bond, Venus Match, Mars Energy) |
| `src/astrology/geocode.py` | 1 | DONE | Nominatim geocoding (async) + TimezoneFinder + cache layer |
| `src/persona/engine.py` | 1 | DONE | Claude API wrapper: chat(), generate_reading(), generate_daily_horoscope(), generate_roast(), summarize_conversation() |
| `src/persona/context.py` | 1 | DONE | Builds user context + conversation context + chart context for each Claude call |
| `src/persona/prompts/` | 4 files | DONE | System prompts: base_personality, reading_birth_chart, reading_compatibility, reading_tarot |
| `src/payments/stars.py` | 1 | DONE | Telegram Stars invoice creation for readings + subscriptions |
| `src/payments/cryptobot.py` | 1 | DONE | CryptoBot API client: create_invoice, get_invoices, check_invoice_paid |
| `src/payments/manager.py` | 1 | DONE | Unified PaymentManager: dual-rail checkout, payment processing, subscription activation |
| `src/bot/handlers/start.py` | 1 | DONE | /start onboarding FSM: birth date → birth time → location → geocode → chart computation → free mini-reading |
| `src/bot/handlers/chat.py` | 1 | DONE | Free-text conversation handler with context management + auto-summarization at 50 messages |
| `src/bot/handlers/readings.py` | 1 | DONE | Reading requests: birth_chart, year_ahead, solar_return, roast. Generates → locks → teaser → paywall |
| `src/bot/handlers/tarot.py` | 1 | DONE | Tarot: 3-card spread (free), Celtic Cross (premium). Full 78-card deck, reversed cards, Claude interpretation |
| `src/bot/handlers/compatibility.py` | 1 | DONE | Full synastry flow: collect partner data → geocode → compute charts → synastry → free summary + locked full report |
| `src/bot/handlers/subscribe.py` | 1 | DONE | VIP subscription flow, Stars payment callbacks (pre_checkout + successful_payment), cancel, profile view, cosmic clock |
| `src/bot/keyboards.py` | 1 | DONE | All inline keyboards: main menu, reading types, tarot types, subscription, payment methods |
| `src/bot/middlewares.py` | 1 | DONE | UserTrackingMiddleware, RateLimitMiddleware (5 msg/day free), AnalyticsMiddleware |
| `src/content/scheduler.py` | 1 | DONE | APScheduler: daily_zodiac (12 signs), daily_tarot, weekly_forecast, vip_daily_readings, reengagement, birthdays |
| `run.py` | 1 | DONE | Entry point: launches all configured language bots in one async process. Supports `python run.py en` for single language |

#### Verified Working
```
✅ All imports successful (tested)
✅ Config loading: 8 languages configured
✅ Database: create user, add messages, query — all working
✅ Astrology: natal chart computation returns real planetary positions (NASA JPL)
✅ Transits: current planetary positions computed correctly
✅ Dependencies: all installed in .venv (Python 3.9)
```

#### Config Files Created
- `config/base.yaml` — shared settings (Claude model, scheduling times, conversation limits)
- `config/en.yaml` — English pricing + persona name + VIP teaser text
- `config/uk.yaml` — Ukrainian pricing + localized text
- `locales/en/messages.yaml` — English UI strings
- `.env.example` — template for all required env vars
- `requirements.txt` — 12 Python dependencies

### 4. Website (IN PROGRESS — Components Built, Server Issue)

**File:** `website/` (Next.js 16.2.2 + Tailwind CSS v4 + Framer Motion)

#### What's Built
- `src/app/layout.tsx` — Root layout with Playfair Display + Inter + Cormorant Garamond fonts
- `src/app/globals.css` — Complete Celestial Noir design system in CSS: colors, glass morphism, gold gradient text, glow effects, star divider, custom scrollbar, float/pulse/shimmer animations
- `src/app/page.tsx` — Page composition with all 10 components
- `src/components/Starfield.tsx` — Canvas-based starfield with twinkling stars + shooting stars (gold trails)
- `src/components/Hero.tsx` — Full hero with rotating zodiac glyphs, staggered text reveal, gold gradient headline, dual CTA buttons, social proof
- `src/components/Navbar.tsx` — Navigation
- `src/components/Features.tsx` — Feature grid
- `src/components/HowItWorks.tsx` — 3-step explainer
- `src/components/DailyHoroscope.tsx` — Daily zodiac preview (12 signs)
- `src/components/Pricing.tsx` — VIP pricing cards
- `src/components/Testimonials.tsx` — User quotes
- `src/components/CTA.tsx` — Bottom call-to-action
- `src/components/Footer.tsx` — Footer

#### The Server Issue (UNRESOLVED)
Next.js 16.2.2 uses Turbopack by default. Turbopack spawns child processes to handle CSS (PostCSS/Tailwind). These child processes look for `node` via the system PATH. On this Mac:
- Node v24.13.1 exists at `/usr/local/bin/node`
- BUT `/usr/local/bin` is NOT on the default PATH that Turbopack's subprocess spawner inherits
- The Claude Code preview server and shell environments don't have `/usr/local/bin` in PATH
- Result: Turbopack panics with "spawning node pooled process — No such file or directory (os error 2)"

**Attempted fixes:**
1. Set PATH in launch.json bash wrapper — didn't propagate to Turbopack subprocesses
2. Set `turbopack.root` in next.config.ts — didn't fix the node PATH issue
3. Symlinked node to `~/.local/bin` — same issue
4. Running via `PATH="/usr/local/bin:$PATH" node next dev` in bash — works in terminal but the preview tool's spawner still has the old environment

**To fix (next session):**
- Option A: Add `/usr/local/bin` to the system PATH permanently via `/etc/paths` (requires sudo)
- Option B: Downgrade to Next.js 14 which uses webpack (no Turbopack subprocess spawning)
- Option C: Install Homebrew, then install node via Homebrew which adds it to PATH properly
- Option D: Create a symlink `ln -s /usr/local/bin/node /usr/bin/node` (requires sudo)
- Option E: Start the dev server from a regular terminal (not Claude Code preview) where PATH is set via .zshrc

---

## What's NOT Built Yet

### Bot — Missing Pieces
1. **Video reading pipeline** (`src/video/`) — HeyGen + ElevenLabs integration. Files are empty `__init__.py` only.
2. **Remaining language configs** — Only `en.yaml` and `uk.yaml` created. Need: `ru.yaml`, `ar.yaml`, `de.yaml`, `es.yaml`, `pt.yaml`, `fr.yaml` (copy en.yaml pattern, adjust pricing)
3. **Remaining locale strings** — Only `locales/en/messages.yaml` created. Need 7 more languages.
4. **CRM/analytics** (`src/crm/`) — Empty. Dashboard deferred (use SQL queries for now).
5. **Referral system** — Logic designed in spec but not coded. Need: unique referral links, reward tracking, cap enforcement.
6. **Viral features** — Cosmic Compatibility Link, Birth Chart Card generator, Celebrity Lookup, Group Chat handler. All designed in VIRAL_FEATURES.md but not coded.
7. **Missing prompts** — `reading_solar_return.txt`, `reading_eclipse.txt`, `reading_retrograde.txt`, `reading_video_script.txt` not created yet.
8. **Image generation** — Birth chart card (Pillow), daily horoscope post images — not built.

### Website — Missing Pieces
1. **Dev server doesn't run** — Turbopack PATH issue (see above)
2. **No verification** — Components were never visually verified. May have runtime errors.
3. **Chat widget** — Web chat with Olivia (separate from Telegram)
4. **Payment integration** — TON Connect + Stars deep link flows
5. **i18n** — 8-language routing and translation
6. **SEO pages** — Daily horoscope pages, blog
7. **Shared FastAPI backend** — Python API that serves both bot and website
8. **Additional pages** — `/reading`, `/compatibility`, `/tarot`, `/pricing`, `/blog`

### Infrastructure — Not Started
1. Anonymous VPS setup (Njalla)
2. eSIM acquisition (Silent.link)
3. Telegram account registration
4. Bot creation via BotFather (8 bots)
5. Public channels creation (8 channels)
6. Domain registration (Njalla)
7. Deployment scripts

---

## How to Run

### Bot (local testing)
```bash
cd /Users/macbookpro/olivia-arcana
source .venv/bin/activate

# Set up .env (copy from .env.example, fill in tokens)
cp .env.example .env
# Edit .env with your bot token + Claude API key

# Run English bot only
python run.py en

# Run all configured bots
python run.py
```

### Verify astrology engine
```bash
source .venv/bin/activate
python3 -c "
from src.astrology.charts import compute_natal_chart
chart = compute_natal_chart('Test', 1995, 3, 15, 14, 30, lat=50.45, lng=30.52, tz_str='Europe/Kyiv')
print(chart.to_summary())
"
```

### Website (when PATH is fixed)
```bash
cd /Users/macbookpro/olivia-arcana/website
PATH="/usr/local/bin:$PATH" node node_modules/.bin/next dev --port 3333
```

---

## Key Files Quick Reference

| What | Where |
|------|-------|
| Full spec | `docs/superpowers/specs/2026-04-06-olivia-arcana-design.md` |
| Growth playbook | `docs/GROWTH_PLAYBOOK.md` |
| Brand design system | `docs/DESIGN_SYSTEM.md` |
| Tarot deck concepts | `docs/TAROT_DECK_CONCEPTS.md` |
| Asset specifications | `docs/ASSET_SPECIFICATIONS.md` |
| Viral features | `docs/VIRAL_FEATURES.md` |
| Bot entry point | `run.py` |
| Olivia's personality | `src/persona/prompts/base_personality.txt` |
| Database schema | `src/db/models.py` |
| Astrology engine | `src/astrology/charts.py` |
| Base config | `config/base.yaml` |
| English config | `config/en.yaml` |
| Website globals | `website/src/app/globals.css` |
| Website page | `website/src/app/page.tsx` |
| Starfield effect | `website/src/components/Starfield.tsx` |

---

## Priority Order for Next Session

1. **Fix website dev server** (Option B or E above — quickest path)
2. **Verify and polish website** — screenshot each section, fix visual issues
3. **Create remaining language configs** (6 YAML files — mechanical task)
4. **Write missing persona prompts** (4 prompt files)
5. **Build video reading pipeline** (HeyGen + ElevenLabs API integration)
6. **Code viral features** (compatibility link is highest priority — it's the viral engine)
7. **Build shared FastAPI backend** (for website ↔ bot shared logic)
8. **Test full bot flow** end-to-end with a real Telegram test bot token

---

## Dependencies & Versions

| Dependency | Version | Location |
|-----------|---------|----------|
| Python | 3.9 | System |
| Node.js | 24.13.1 | `/usr/local/bin/node` |
| Next.js | 16.2.2 | `website/node_modules` |
| Tailwind CSS | v4 | `website/node_modules` |
| Framer Motion | latest | `website/node_modules` |
| aiogram | 3.22.0 | `.venv` |
| anthropic | 0.89.0 | `.venv` |
| kerykeion | 5.12.7 | `.venv` |
| sqlalchemy | 2.0.49 | `.venv` |
