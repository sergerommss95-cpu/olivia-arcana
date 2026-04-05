# Olivia Arcana — AI Astrologer & Tarot Telegram Stars Bot

## Overview

Olivia Arcana is a fully automated AI-powered astrologer and tarot reader running as a Telegram bot across 8 languages. She engages users via warm, mystical DM conversations, delivers personalized readings based on real planetary data (NASA JPL ephemeris), and monetizes through Telegram Stars and CryptoBot payments. The operator remains fully anonymous via crypto-paid infrastructure.

**Target:** $20,000-$30,000/month across 8 language markets at scale (month 12).

**Automation level:** 95%. The operator's only manual input: review CRM analytics monthly, adjust pricing/prompts as needed.

---

## 1. Persona

**Name:** Olivia Arcana (Олівія Аркана / Оливия Аркана / أوليفيا أركانا)

**Personality:** Warm, mystical, caring. Speaks like a wise astrologer friend — uses celestial metaphors, gentle guidance, emotionally supportive. Maintains mystique without being pretentious. Covers both astrology and tarot.

**Voice per language:**
- **English:** Warm, approachable, slightly poetic
- **Ukrainian / Russian:** Same warmth, natural conversational tone
- **Arabic:** Warm but slightly more formal, leans into "cosmic wisdom" (روحانية) framing for cultural sensitivity
- **German:** Warm but structured — Germans appreciate thoroughness in readings
- **Spanish:** Warm, expressive, slightly more emotional
- **Portuguese (BR):** Informal warmth, Brazilian conversational style
- **French:** Elegant warmth, slightly literary tone

**Conversation modes:**
1. **Free chat** — Responds to general astro/tarot questions, gives generic zodiac insights. Limited to 5 messages/day for non-subscribers.
2. **Personalized reading** — Uses user's birth chart (date/time/location) + real transits via kerykeion. Delivered as locked message requiring Stars/crypto to unlock.
3. **VIP chat** — Unlimited conversation, daily personalized insights pushed proactively, transit alerts, priority responses.

**Context management:**
- Database retains last 50 messages per user. On message 51, oldest 40 are batch-summarized by Claude into a conversation_summary, then pruned.
- Each Claude API call receives: system prompt + conversation summaries + last 10 messages + user profile (birth data, zodiac, past reading themes).
- This keeps token usage low while maintaining long-term memory.

**Content safety:**
- Olivia's system prompt includes strict guardrails: she stays in character as an astrologer/tarot reader, does not provide medical/legal/financial advice, and gently redirects off-topic or abusive messages.
- Claude's built-in content filtering handles explicit/harmful content.
- Rate limiting (5 msg/day free tier) prevents abuse. Repeated abusive messages trigger a 24-hour cooldown.
- Prompt injection attempts are mitigated by separating user input from system context (user messages are never interpolated into system prompts).

---

## 2. Architecture

### 2.1 System Overview

Single Python codebase powering 8 bot instances (one per language). All run within one Python process using Aiogram 3's multi-dispatcher support (simplest for single VPS). Can be split into separate processes later if needed.

```
olivia-arcana/
├── config/                     # Per-language YAML configs
│   ├── base.yaml               # Shared: API keys, model params, feature flags
│   ├── en.yaml                 # English: pricing, channel IDs, persona prompt
│   ├── uk.yaml
│   ├── ru.yaml
│   ├── ar.yaml
│   ├── de.yaml
│   ├── es.yaml
│   ├── pt.yaml
│   └── fr.yaml
├── locales/                    # UI strings, button labels, system messages
│   ├── en/messages.yaml
│   ├── uk/messages.yaml
│   ├── ru/messages.yaml
│   ├── ar/messages.yaml
│   ├── de/messages.yaml
│   ├── es/messages.yaml
│   ├── pt/messages.yaml
│   └── fr/messages.yaml
├── src/
│   ├── bot/
│   │   ├── handlers/
│   │   │   ├── start.py         # /start onboarding flow
│   │   │   ├── chat.py          # Free chat with Olivia
│   │   │   ├── readings.py      # Reading requests + delivery
│   │   │   ├── tarot.py         # Tarot spreads (daily, 3-card, Celtic Cross)
│   │   │   ├── compatibility.py # Synastry flow (collect 2nd person's data)
│   │   │   ├── video.py         # Video reading request + delivery
│   │   │   ├── subscribe.py     # VIP subscription flow
│   │   │   └── payments.py      # Stars + CryptoBot callbacks
│   │   ├── keyboards.py         # Inline keyboards / buttons
│   │   ├── middlewares.py       # Rate limiting, subscription check, analytics
│   │   └── filters.py          # Custom Aiogram filters
│   ├── persona/
│   │   ├── engine.py            # Claude API wrapper
│   │   ├── prompts/
│   │   │   ├── base_personality.txt
│   │   │   ├── reading_birth_chart.txt
│   │   │   ├── reading_compatibility.txt
│   │   │   ├── reading_tarot.txt
│   │   │   ├── reading_solar_return.txt
│   │   │   ├── reading_eclipse.txt
│   │   │   ├── reading_retrograde.txt
│   │   │   └── reading_video_script.txt
│   │   └── context.py           # Builds user context for each Claude call
│   ├── astrology/
│   │   ├── charts.py            # Kerykeion wrapper — natal charts
│   │   ├── synastry.py          # Compatibility calculations
│   │   ├── transits.py          # Current transit computation
│   │   ├── events.py            # Eclipse/retrograde date detection
│   │   └── alerts.py            # Transit alert checker for VIP users
│   ├── payments/
│   │   ├── stars.py             # Telegram Stars integration
│   │   ├── cryptobot.py         # @CryptoBot API (TON/USDT/BTC)
│   │   └── manager.py           # Unified payment interface
│   ├── video/
│   │   ├── generator.py         # Orchestrates script → voice → video
│   │   ├── heygen_client.py     # HeyGen API wrapper
│   │   ├── elevenlabs_client.py # Voice generation
│   │   └── avatar.py            # Olivia avatar config per language
│   ├── content/
│   │   ├── scheduler.py         # APScheduler — all automated content
│   │   ├── daily_zodiac.py      # 12-sign daily forecast generator
│   │   ├── daily_tarot.py       # Card of the day
│   │   ├── weekly_forecast.py   # Monday cosmic weather
│   │   ├── vip_readings.py      # Daily personal readings for VIPs
│   │   ├── event_reports.py     # Eclipse/retrograde special reports
│   │   └── reengagement.py      # Inactive user win-back
│   ├── crm/
│   │   ├── analytics.py         # Event tracking + funnel metrics
│   │   ├── referrals.py         # Referral source tracking
│   │   └── dashboard.py         # CLI dashboard for operator
│   └── db/
│       ├── models.py            # SQLAlchemy models
│       ├── repository.py        # Data access layer (abstraction for DB swap)
│       └── migrations.py        # Schema versioning
├── data/                        # SQLite databases (gitignored)
├── tests/
├── run.py                       # Entry point — launches bot(s)
├── requirements.txt
└── .env.example
```

### 2.2 Error Handling & Degraded Mode

| Dependency | Failure Behavior |
|-----------|-----------------|
| **Claude API down** | Queue the message, retry 3x with exponential backoff. If still failing, send: "The stars are momentarily obscured... I'll respond shortly." Retry via background task. |
| **Claude API rate-limited** | Queue and process in order. VIP messages get priority queue position. |
| **Kerykeion computation error** | Log error, inform user: "I need a bit more detail about your birth location to cast your chart accurately." Prompt for correction. |
| **HeyGen API error/timeout** | Notify user: "Your video reading is taking longer than usual. I'll send it as soon as it's ready." Retry up to 3x. If fails, offer text reading as alternative + refund. |
| **ElevenLabs error** | Fall back to HeyGen's built-in TTS. Lower quality voice but video still delivers. |
| **CryptoBot API error** | Show only Stars payment option. Log error for operator review. |
| **SQLite write lock** | WAL mode enabled by default. Async writes with retry. Acceptable for MVP; migrate to PostgreSQL before 500 concurrent users per instance. |

All external API calls use async with timeout (30s for text APIs, 300s for video generation). Failed operations are logged to analytics with error metadata.

### 2.3 Runtime Flow

```
User sends DM
  → Aiogram middleware: check rate limit, log analytics event
  → Route to handler:
      /start           → onboarding (collect birth data, free mini-reading)
      /reading [type]  → generate reading → lock behind paywall
      /tarot [spread]  → tarot spread → lock premium spreads
      /compatibility   → collect 2nd person data → synastry report
      /video           → video reading flow → payment → generate → deliver
      /subscribe       → VIP subscription checkout
      /profile         → manage profiles (add partner/family)
      free text        → Olivia persona chat (Claude API)
  → Payment callback (Stars or CryptoBot) → unlock content / activate sub
```

### 2.3 Key Dependencies

```
aiogram>=3.4            # Telegram bot framework (async, Stars support)
anthropic               # Claude API — persona conversations + reading generation
kerykeion               # Astrology calculations (NASA JPL DE440/DE441 ephemeris)
sqlalchemy[asyncio]     # ORM + async data access layer
aiosqlite               # Async SQLite driver
apscheduler             # Content scheduling (daily posts, VIP readings, alerts)
aiohttp                 # Async HTTP (CryptoBot API, HeyGen API, ElevenLabs API)
pyyaml                  # Config loading
python-dotenv           # Environment variables
```

---

## 3. Products & Pricing

### 3.1 Two Tiers Only (Free + VIP)

Research shows 3+ tiers cause decision paralysis. Two tiers maximize conversion.

**Free tier:**
- 5 messages/day with Olivia
- Daily zodiac forecast (public channel — all 12 signs)
- Tarot card of the day (public channel)
- Weekly cosmic weather (public channel)
- One free mini-reading on first birth data submission
- 3-card tarot spread via `/tarot` command (once per day, does not count against 5-message chat limit)
- 3-line compatibility summary (Sun + Moon + Rising)

**VIP tier (monthly subscription):**
- Unlimited chat with Olivia
- Daily personalized horoscope pushed to DM (based on birth chart + real transits)
- Weekly personalized 3-card tarot pull in DM
- One Celtic Cross (10-card) reading per month included
- Cosmic transit alerts (major planets hitting natal points)
- Full compatibility/synastry report (1 partner profile stored)
- Eclipse/retrograde personalized impact reports (auto-delivered before events)
- Birthday Solar Return teaser (full report is separate purchase)
- Priority response: VIP messages skip the rate-limit queue and are processed first when multiple requests are pending

### 3.2 Premium One-Time Unlocks (Stars or CryptoBot)

Available to all users (free and VIP). VIP users get some of these included.

| Product | EN | UK | RU | AR | DE | ES | PT-BR | FR |
|---------|----|----|----|----|----|----|-------|-----|
| Full birth chart reading | 300 Stars | 150 | 200 | 350 | 330 | 250 | 200 | 300 |
| Full synastry/compatibility | 300 Stars | 150 | 200 | 350 | 300 | 250 | 200 | 300 |
| Celtic Cross tarot (10 cards) | 150 Stars | 75 | 100 | 175 | 150 | 125 | 100 | 150 |
| Solar Return report | 300 Stars | 150 | 200 | 350 | 300 | 250 | 200 | 300 |
| Eclipse impact report | 200 Stars | 100 | 150 | 250 | 200 | 175 | 125 | 200 |
| Retrograde survival guide | 150 Stars | 75 | 100 | 175 | 150 | 125 | 100 | 150 |
| Year-ahead forecast | 500 Stars | 250 | 350 | 550 | 530 | 400 | 300 | 500 |

### 3.3 VIP Subscription Pricing

| | EN | UK | RU | AR | DE | ES | PT-BR | FR |
|---|---|---|---|---|---|---|---|---|
| Monthly | 500 Stars ($6.50) | 250 ($3.25) | 350 ($4.55) | 600 ($7.80) | 550 ($7.15) | 400 ($5.20) | 300 ($3.90) | 500 ($6.50) |
| Annual | 5,000 Stars ($65) | 2,500 ($32.50) | 3,500 ($45.50) | 6,000 ($78) | 5,500 ($71.50) | 4,000 ($52) | 3,000 ($39) | 5,000 ($65) |

Annual = ~2 months free discount (45% of astrology subscribers choose annual when discount is visible).

### 3.4 Subscription Lifecycle

**Activation:**
- User selects monthly or annual plan → pays via Stars or CryptoBot → subscription_status set to "vip", expires_at set accordingly.
- Stars subscriptions use Telegram's native recurring Stars Subscription feature (auto-renews unless cancelled).
- CryptoBot subscriptions: bot sends renewal invoice 3 days before expiry. If unpaid by expiry, downgrade to free.

**Renewal:**
- Stars: automatic via Telegram (bot receives `pre_checkout_query` → confirms → renewed).
- CryptoBot: invoice sent at expiry -3 days, reminder at -1 day. On payment, extends expires_at.

**Expiry/Grace:**
- 3-day grace period after expiry. User keeps VIP access but sees: "Your VIP access expires in [X] days. Renew to keep your daily personal readings."
- After grace period: downgrade to free tier. Existing readings remain accessible. No data deleted.

**Cancellation:**
- User sends `/cancel` → subscription marked cancelled, auto_renew disabled. Access continues until expires_at.
- Olivia responds warmly: "I understand. Your VIP access will continue until [date]. The stars will always be here for you."

**Dunning messages (CryptoBot only):**
- Expiry -3 days: "Your VIP subscription renews in 3 days. [Pay now]"
- Expiry -1 day: "Last chance to keep your daily personal readings flowing."
- Expiry +1 day (grace): "Your VIP access is still active for 2 more days. Renew anytime."
- Expiry +3 days: "Your VIP access has ended. You can resubscribe anytime — I've saved all your chart data."

### 3.5 Paywall / Lock UX

When a user requests a paid reading:
1. Claude generates the full reading and stores it in the `readings` table with `is_locked = true`.
2. User sees: the first 2-3 sentences of the reading as a teaser, followed by "✨ *[reading continues...]*" and a payment button.
3. On payment: `is_locked = false`, `unlocked_at` set, full reading delivered immediately in the same chat.
4. If user doesn't pay: reading remains stored and available to unlock later (no regeneration needed).

### 3.6 Premium Video Reading

**"Personal Video Reading by Olivia" — highest-tier product.**

| | EN | UK | RU | AR | DE | ES | PT-BR | FR |
|---|---|---|---|---|---|---|---|---|
| Price | 3,075 Stars ($39.99) | 1,500 ($19.50) | 2,000 ($26.00) | 3,500 ($45.50) | 3,075 ($39.99) | 2,500 ($32.50) | 1,750 ($22.75) | 3,075 ($39.99) |

**What the user receives:** 5-8 minute personalized video of Olivia performing their tarot reading on camera. She speaks directly to the user by name, references their birth chart, pulls and interprets cards for their specific situation.

**Production pipeline (fully automated):**
1. User describes their situation + pays
2. Claude generates personalized reading script (~800-1200 words) using user's chart data + current transits + their question
3. ElevenLabs generates Olivia's voice speaking the script (fallback: HeyGen built-in TTS)
4. HeyGen generates video with Olivia avatar + voice
5. Bot delivers video to user's DM
6. **Turnaround: up to 1 hour.** User sees: "I'm preparing your personal video reading now. I'll send it to you as soon as it's ready — usually within 30-60 minutes." Bot sends a notification when video is ready. If generation fails after 3 retries, user is offered a full text reading as alternative + refund.

**Cost per video:** ~$1-3 (ElevenLabs ~$0.30, HeyGen ~$0.50-2.00, Claude ~$0.03). **Margin: 90%+.**

### 3.5 Payment Rails

Two payment methods, same unlock logic:

| Rail | Use Case | Anonymity |
|------|----------|-----------|
| **Telegram Stars** | Default for all users. One tap, no crypto knowledge needed. | Full — payouts via Fragment → TON wallet |
| **@CryptoBot** | Alternative for crypto-native users. TON, USDT, BTC. | Full — direct to wallet |

At checkout, user sees:
```
[⭐ Pay with Stars — 500 Stars]
[💎 Pay with Crypto — $6.50 USDT/TON]
```

---

## 4. Birth Data & Onboarding

### 4.1 Birth Data Collection

Olivia collects birth data conversationally during onboarding:

1. **Birth date** (required) — Validated as a real date. Olivia asks: "When were you born? (e.g., March 15, 1995)"
2. **Birth time** (optional) — "Do you know what time you were born? Even approximate is helpful. If not, no worries — I can still read your chart." Without birth time: Moon sign and Rising sign cannot be computed. Readings degrade gracefully — Sun-sign-only readings with a note that adding birth time unlocks deeper insight.
3. **Birth location** (required) — "Where were you born? City and country is perfect."

### 4.2 Geocoding

City name → lat/lng via **Nominatim API** (OpenStreetMap, free, no API key, no KYC). Rate limited to 1 req/sec.

- If ambiguous (e.g., "Springfield"), Olivia asks: "There are a few places called Springfield — which country/state?"
- Results cached in a local geocode_cache table to avoid repeated lookups.
- Fallback: if Nominatim is down, use a bundled cities database (GeoNames, ~50K major cities).

### 4.3 Timezone Detection

User timezone determined from birth location (for chart computation) and Telegram's `language_code` (for content delivery scheduling). Stored as `timezone` field on the user record (IANA format, e.g., "America/New_York"). Editable via `/settings`.

### 4.4 Reading Quality by Data Completeness

| Data Available | Reading Quality | Features Available |
|---------------|----------------|-------------------|
| Birth date + location | Good — Sun sign + planetary positions, no houses/rising | Daily zodiac, basic readings, tarot, compatibility (partial) |
| Birth date + time + location | Full — complete natal chart with houses, rising, Moon | All features including transit alerts, full synastry, solar return |

---

## 5. Astrology Engine

### 4.1 Kerykeion Integration

All astrological calculations use the kerykeion library, which computes positions from NASA JPL DE440/DE441 ephemerides — the same data used for interplanetary navigation.

**Capabilities used:**
- Natal chart computation (planets, houses, aspects)
- Synastry (bi-wheel comparison of two charts)
- Current transit positions (daily, for overlaying onto natal charts)
- Solar Return chart (cast for exact Sun return to natal position)
- Eclipse date computation
- Retrograde period detection
- Aspect orb detection (for transit alerts)

**Competitive moat:** Generic LLM-only competitors generate content for ~660M people sharing a sun sign (20-30% perceived accuracy). Birth-chart-level readings using real ephemeris data achieve 70-90% perceived accuracy. Marketing claim: "Your reading is calculated from your exact planetary positions at the moment of your birth."

### 4.2 How Readings Are Generated

1. Kerykeion computes the astrological data (natal chart, current transits, aspects)
2. Data is formatted into a structured summary (planets in signs/houses, active aspects, transit overlays)
3. Claude receives: Olivia's personality prompt + astrological data summary + user context (name, past readings, their question)
4. Claude generates the reading in Olivia's voice, grounded in the real astrological data
5. The reading is never pure LLM hallucination — it's always anchored to computed planetary positions

---

## 5. Content Automation

### 5.1 Scheduled Content

| Content | Schedule | Target | Generator |
|---------|----------|--------|-----------|
| Daily zodiac forecast (12 signs) | 06:00 per timezone | Public channel | Claude + daily transits from kerykeion |
| VIP daily personal reading | 08:00 | VIP subscriber DMs | Claude + user's natal chart + daily transits |
| VIP transit alerts | 08:30 | VIP subscriber DMs (triggered) | Kerykeion detects major aspects → Claude writes alert |
| Tarot card of the day | 09:00 | Public channel | Claude interprets randomly drawn card |
| Weekly cosmic weather | Monday 07:00 | Public channel | Claude + week's transit summary |
| VIP weekly 3-card pull | Monday 08:30 | VIP subscriber DMs | Claude generates personalized spread |
| Event pre-launch (eclipse/retro) | Event -3 days | All users | Claude + kerykeion event detection → promo push |
| Birthday reading | User's birthday | Bot DM | Claude + Solar Return data → free reading + upsell |
| Re-engagement | 7-day inactive trigger | Bot DM | Claude + recent transits affecting user's chart |

### 5.2 Public Channel Strategy

Each language has a public Telegram channel (e.g., @OliviaArcanaDaily, @OliviaArcanaUA, etc.).

Every public zodiac post ends with a VIP teaser line:
> "🔑 VIP subscribers: Your personalized reading based on YOUR exact chart is in your DMs right now."

One "sample VIP reading" (generic chart, details redacted) posted publicly per week to demonstrate depth difference.

---

## 6. Conversion Funnel

### 6.1 Four-Stage Funnel

```
Stage 1: Discovery
  TikTok/Reels/Shorts (faceless astro content) → link to Telegram channel
  Cross-promotion swaps with other astrology channels
  Telegram search optimization

Stage 2: Public Channel (free value)
  Daily zodiac, tarot, cosmic weather → builds habit
  VIP teaser lines create FOMO

Stage 3: Bot DM (relationship + conversion)
  New user → warmly greeted → asked for birth data
  Free mini-reading → impressive enough to build trust
  Behavioral trigger sequences drive upgrade (see 6.2)

Stage 4: Retention
  Daily VIP content pushed proactively
  Transit alerts keep engagement high
  Birthday readings re-engage lapsed users
  Event-driven upsells (eclipse, retrograde, Valentine's)
```

### 6.2 Behavioral Trigger Sequences

| Trigger | Timing | Message Strategy |
|---------|--------|-----------------|
| New subscriber joins channel | Immediately | Bot DM: "Welcome! What's your birth date and time? I'll calculate your chart and send you a free personal transit snapshot." |
| User provides birth data, doesn't upgrade | Day 3 | "Mercury is making a powerful aspect to your natal [planet] this week. VIP members are receiving a full breakdown in their DMs." |
| 7-day inactivity | Day 7 | "The stars have shifted — Jupiter just moved into a new position that's hitting your chart directly. Here's a quick preview..." |
| Major astrological event | Event -3 days | "A major cosmic event is coming that hits [user's rising sign] especially hard. Your personal impact report is ready for VIP members." |
| Birthday approaching | Birthday -7 days | "Your solar return is in 7 days. Your free birthday reading will be sent automatically — and there's something especially significant in your chart this year." |

### 6.3 Referral Tracking

Each acquisition source gets a unique start link: `t.me/OliviaArcanaBot?start=source_xyz`

Bot tracks: source → bot user → free reading → first payment → VIP conversion → LTV. Operator sees which channels/ads/content are profitable via CLI dashboard.

### 6.4 Referral Program

"Share Olivia with a friend — you both get a free reading." Unique referral link per user (`t.me/OliviaArcanaBot?start=ref_USERID`). Reward: one free full birth chart reading (normally 300 Stars) for both referrer and referee. One reward per unique referral, capped at 5 rewards per user. Tracked in analytics.

---

## 7. User Acquisition Channels

| Channel | Method | Cost | Expected Scale |
|---------|--------|------|----------------|
| TikTok (faceless) | Short astro videos, AI voiceover, zodiac visuals. Link in bio → Telegram. | Free | Highest — viral potential |
| Instagram Reels | Repurposed TikTok content | Free | High |
| YouTube Shorts | Repurposed TikTok content | Free | High |
| Telegram search | Optimize channel name, description, posts | Free | Medium, passive |
| Cross-promotion | Shoutout swaps with similar-sized astro channels | Free | Medium |
| Direct channel buys | Pay astro channel owners for sponsored post | $0.50-$2/sub | Medium-high, targeted |
| Telegram Official Ads | CPM ads in relevant channels | $0.50-$8 CPM | Scalable (Month 3+) |
| Reddit/forums | Value posts in r/astrology, r/tarot with subtle mention | Free | Slow but high quality |

**Ad spend strategy:** No paid ads Month 1-2. Organic only to prove funnel converts. Month 3+: reinvest 30-50% of revenue into proven channels.

---

## 8. Database Schema

One SQLite database per bot instance (8 total). Same schema, separate files.

### users
| Column | Type | Notes |
|--------|------|-------|
| user_id | INTEGER PK | Telegram user ID |
| language | TEXT | en/uk/ru/ar/de/es/pt/fr |
| name | TEXT | |
| birth_date | DATE | |
| birth_time | TIME | nullable — some users don't know |
| birth_location | TEXT | city name |
| birth_lat | REAL | latitude |
| birth_lng | REAL | longitude |
| timezone | TEXT | IANA format (e.g., "America/New_York"), derived from birth location, editable via /settings |
| zodiac_sun | TEXT | computed from birth data |
| zodiac_moon | TEXT | computed |
| zodiac_rising | TEXT | computed (requires birth_time) |
| subscription_status | TEXT | free / vip |
| subscription_expires_at | DATETIME | |
| subscription_method | TEXT | stars / cryptobot |
| referral_source | TEXT | which link/channel brought them |
| referred_by_user_id | INTEGER | FK to users, nullable |
| free_messages_today | INTEGER | resets daily |
| created_at | DATETIME | |
| last_active_at | DATETIME | |

### profiles
| Column | Type | Notes |
|--------|------|-------|
| profile_id | INTEGER PK | auto |
| user_id | INTEGER FK | |
| name | TEXT | |
| birth_date | DATE | |
| birth_time | TIME | nullable |
| birth_location | TEXT | |
| birth_lat | REAL | |
| birth_lng | REAL | |
| zodiac_sun | TEXT | |
| zodiac_moon | TEXT | |
| zodiac_rising | TEXT | |
| relationship | TEXT | partner / child / parent / friend |
| created_at | DATETIME | |

### conversations
| Column | Type | Notes |
|--------|------|-------|
| message_id | INTEGER PK | auto |
| user_id | INTEGER FK | |
| role | TEXT | user / olivia |
| content | TEXT | |
| tokens_used | INTEGER | for cost tracking |
| created_at | DATETIME | |

Retains last 50 messages per user. On message 51, oldest 40 are batch-summarized by Claude into conversation_summaries, then pruned from this table.

### conversation_summaries
| Column | Type | Notes |
|--------|------|-------|
| summary_id | INTEGER PK | |
| user_id | INTEGER FK | |
| summary_text | TEXT | Claude-generated summary |
| messages_covered | TEXT | range, e.g., "1-50" |
| created_at | DATETIME | |

### readings
| Column | Type | Notes |
|--------|------|-------|
| reading_id | INTEGER PK | |
| user_id | INTEGER FK | |
| profile_id | INTEGER FK | nullable — null = user's own chart |
| type | TEXT | daily / compatibility / celtic_cross / solar_return / eclipse / retrograde / transit_alert / video |
| content | TEXT | generated reading text (or video script for video type) |
| video_url | TEXT | nullable — local path or URL for video readings |
| is_locked | BOOLEAN | awaiting payment |
| price_stars | INTEGER | |
| price_crypto_usd | REAL | |
| created_at | DATETIME | |
| unlocked_at | DATETIME | |

### payments
| Column | Type | Notes |
|--------|------|-------|
| payment_id | INTEGER PK | |
| user_id | INTEGER FK | |
| reading_id | INTEGER FK | nullable (null for subscriptions) |
| type | TEXT | subscription / one_time |
| method | TEXT | stars / cryptobot |
| amount_stars | INTEGER | nullable |
| amount_crypto | REAL | nullable |
| crypto_currency | TEXT | TON / USDT / BTC |
| status | TEXT | pending / completed / failed / refunded |
| telegram_charge_id | TEXT | |
| cryptobot_invoice_id | TEXT | |
| created_at | DATETIME | |

### subscriptions
| Column | Type | Notes |
|--------|------|-------|
| subscription_id | INTEGER PK | |
| user_id | INTEGER FK | |
| tier | TEXT | vip |
| method | TEXT | stars / cryptobot |
| period | TEXT | monthly / annual |
| amount_stars | INTEGER | |
| amount_crypto | REAL | |
| started_at | DATETIME | |
| expires_at | DATETIME | |
| auto_renew | BOOLEAN | |
| cancelled_at | DATETIME | nullable |

### analytics
| Column | Type | Notes |
|--------|------|-------|
| event_id | INTEGER PK | |
| user_id | INTEGER FK | |
| event_type | TEXT | message_sent / reading_requested / reading_unlocked / subscription_started / subscription_cancelled / referral_click / video_requested / video_delivered |
| metadata | TEXT | JSON payload for flexible data |
| created_at | DATETIME | |

**Data access layer:** All DB operations go through a Repository class (SQLAlchemy ORM). No raw SQL in handlers. This abstraction enables SQLite → PostgreSQL migration without rewriting business logic.

**SQLite configuration:** WAL mode enabled for concurrent read/write safety. SQLite is MVP-only — migrate to PostgreSQL before exceeding ~500 concurrent users per instance.

---

## 9. Anonymity Architecture

### 9.1 Identity Isolation

| Layer | Solution | Identity Exposure |
|-------|----------|-------------------|
| Payment for infra | Monero (XMR) via no-KYC exchange | None |
| VPS hosting | Njalla (registers server in their name, paid with XMR) | None — Njalla is the legal entity |
| VPN on VPS | Mullvad (paid with XMR, no email required) | Telegram sees VPN IP, not server IP |
| Phone number | Silent.link eSIM (paid with crypto) | Anonymous number, not linked to identity |
| Telegram account | Registered via Android emulator over VPN | No device or IP linkage |
| Bot creation | @BotFather on anonymous Telegram account | Isolated from personal account |
| Claude API | Account via ProtonMail, paid with privacy-preserving method | Minimal exposure |
| Revenue collection | Stars → Fragment → TON wallet / CryptoBot → TON/USDT wallet | Anonymous wallets |

### 9.2 Registration Procedure

1. Acquire XMR via no-KYC exchange (TradeOgre, Haveno) or BTC→XMR atomic swap
2. Use separate XMR wallets for each purchase (prevent correlation)
3. Buy Silent.link eSIM with XMR → get anonymous phone number
4. Install Mullvad VPN (paid with XMR)
5. Run Android emulator locally (Android Studio AVD) over Mullvad
6. Register Telegram account on emulator with eSIM number
7. Set 2FA cloud password immediately
8. Create bot via @BotFather
9. Log into Telegram on VPS (creates persistent session)
10. Delete local emulator — VPS session persists indefinitely
11. Keep eSIM topped up for emergency re-verification

### 9.3 Ongoing OpSec

- Never access the anonymous Telegram account from personal devices/network
- VPS administration only via SSH over VPN
- eSIM profile saved securely (reinstallable on any eSIM device if needed)
- Separate TON wallets for receiving Stars payouts vs CryptoBot payouts
- No cross-contamination between anonymous and personal Telegram accounts

---

## 10. Revenue Projections

### 10.1 Per-Market Targets (Month 12)

| Market | VIP Subs | One-Time Purchases/mo | Video Readings/mo | Monthly Revenue |
|--------|----------|----------------------|-------------------|-----------------|
| English | 800 | 250 | 20 | ~$8,000 |
| Arabic | 500 | 150 | 10 | ~$5,500 |
| German | 400 | 120 | 8 | ~$4,200 |
| Spanish | 600 | 180 | 12 | ~$4,000 |
| French | 350 | 100 | 8 | ~$3,400 |
| Russian | 500 | 150 | 8 | ~$3,100 |
| Portuguese (BR) | 400 | 120 | 6 | ~$2,300 |
| Ukrainian | 300 | 80 | 4 | ~$1,500 |
| **Total** | **3,850** | **1,150** | **76** | **~$32,000/month** |

### 10.2 Growth Timeline (All Languages Combined)

| Month | Channel Subs | Bot Users | Paying Subs | Revenue |
|-------|-------------|-----------|-------------|---------|
| 1 | 400 | 100 | 5 | ~$50 |
| 3 | 3,000 | 800 | 80 | ~$800 |
| 6 | 12,000 | 3,500 | 500 | ~$5,000 |
| 9 | 30,000 | 10,000 | 1,500 | ~$14,000 |
| 12 | 60,000 | 20,000 | 3,850 | ~$32,000 |

### 10.3 Cost Structure (Monthly at Scale)

| Cost | Amount | Notes |
|------|--------|-------|
| Claude API | ~$200-400 | Conversations + reading generation |
| HeyGen API | ~$200-500 | Video readings (~76/month, 5-8 min each) |
| ElevenLabs API | ~$30-50 | Voice for video readings |
| VPS (Njalla) | ~$15 | Single server |
| Mullvad VPN | ~$5 | |
| Silent.link eSIM | ~$5 | Top-up |
| **Total** | **~$500-1,000** | **~97% margin** |

---

## 11. Website (oliviaarcana.com)

### 11.1 Overview

A Next.js website serving two purposes: marketing landing page (SEO, traffic capture) and web app (readings for non-Telegram users). Hosted on the same anonymous VPS as the bots.

### 11.2 Architecture

```
website/
├── src/
│   ├── app/
│   │   ├── [locale]/              # i18n routing (en/uk/ru/ar/de/es/pt/fr)
│   │   │   ├── page.tsx           # Landing page — hero, features, testimonials, CTA
│   │   │   ├── reading/
│   │   │   │   └── page.tsx       # Web app — get a reading (onboarding + chat)
│   │   │   ├── compatibility/
│   │   │   │   └── page.tsx       # Synastry reading flow
│   │   │   ├── daily/
│   │   │   │   └── page.tsx       # Free daily horoscope (12 signs — SEO magnet)
│   │   │   ├── tarot/
│   │   │   │   └── page.tsx       # Free daily tarot + premium spreads
│   │   │   ├── pricing/
│   │   │   │   └── page.tsx       # VIP plans + one-time purchases
│   │   │   └── blog/
│   │   │       └── [slug]/page.tsx # SEO content: "Mercury retrograde guide", etc.
│   │   └── api/
│   │       ├── chat/route.ts      # Olivia chat endpoint (Claude API)
│   │       ├── reading/route.ts   # Generate reading
│   │       ├── chart/route.ts     # Compute natal chart (kerykeion via Python API)
│   │       └── payment/
│   │           ├── ton/route.ts   # TON Connect payment verification
│   │           └── stars/route.ts # Telegram Stars deep link callback
│   ├── components/
│   │   ├── ChatWidget.tsx         # Olivia chat interface
│   │   ├── ChartVisual.tsx        # Birth chart visualization (SVG)
│   │   ├── TarotCard.tsx          # Animated tarot card reveal
│   │   ├── PaymentModal.tsx       # TON Connect + Stars deep link
│   │   └── LanguageSwitcher.tsx
│   ├── lib/
│   │   ├── anthropic.ts           # Claude API client
│   │   ├── tonconnect.ts          # TON wallet integration
│   │   └── i18n.ts                # Internationalization config
│   └── styles/
│       └── globals.css            # Tailwind CSS
├── public/
│   ├── images/                    # Olivia avatar, zodiac icons, tarot cards
│   └── og/                        # Open Graph images per language
├── next.config.js
├── tailwind.config.js
├── package.json
└── messages/                      # i18n translation files per locale
    ├── en.json
    ├── uk.json
    ├── ru.json
    ├── ar.json
    ├── de.json
    ├── es.json
    ├── pt.json
    └── fr.json
```

### 11.3 Landing Page

**Purpose:** SEO capture + convert visitors to either Telegram bot or web app users.

**Sections:**
1. Hero — "Meet Olivia Arcana — Your Personal Astrologer & Tarot Reader" + animated starfield/zodiac background
2. Free daily horoscope preview — today's reading for all 12 signs (drives organic SEO traffic)
3. Features — personalized readings, compatibility, tarot, transit alerts, video readings
4. How it works — 3 steps: share your birth data → get your chart → receive daily guidance
5. Testimonials — curated user quotes (start with placeholder, replace with real ones)
6. Pricing — VIP plans + one-time purchase cards
7. CTA — two buttons: "Start on Telegram" (deep link) / "Get Your Reading Now" (web app)
8. Blog — SEO articles: "Mercury Retrograde 2026 Guide", "Your Year-Ahead Forecast", "How to Read Your Birth Chart"

**SEO strategy:**
- Daily horoscope pages auto-generated (same Claude content as Telegram channels) — 12 pages updated daily = fresh content for search engines
- Blog posts timed to astrological events (retrograde, eclipses) for search spike capture
- Localized URLs: `oliviaarcana.com/de/daily`, `oliviaarcana.com/ar/reading`, etc.
- Structured data (JSON-LD) for horoscope content

### 11.4 Web App

**Purpose:** Full reading experience for users who don't use Telegram.

**Features (mirror of bot):**
- Chat with Olivia (same Claude persona, same prompts)
- Birth data collection → chart computation → free mini-reading
- Paid readings: birth chart, compatibility, tarot, solar return, video
- VIP subscription (monthly/annual)
- Daily personalized readings (for VIP, delivered via email or web push notifications)

**Shared backend:** The website's API routes call the same Python astrology engine (kerykeion) via an internal HTTP API running on the same VPS. Claude prompts are shared between bot and website.

```
[Next.js API routes] → HTTP → [Python astrology API (FastAPI)]
                                  ├── kerykeion (charts, transits)
                                  ├── Claude API (readings)
                                  └── SQLite (shared user DB per language)
```

### 11.5 Web Payments

| Rail | Method | Flow |
|------|--------|------|
| **TON Connect** | User connects TON wallet in browser → pays TON/USDT ��� on-chain verification → content unlocks | Native web crypto payment, fully anonymous |
| **Telegram Stars (deep link)** | User clicks "Pay with Stars" → deep links to `t.me/OliviaArcanaBot?start=web_reading_XYZ` → pays in bot → webhook notifies web app → content unlocks | Bridges web users to Telegram, adds them to bot funnel too |

TON Connect is primary for web. Stars deep link is secondary but has a bonus: every web user who pays via Stars becomes a Telegram bot user too (double conversion).

### 11.6 Domain & Anonymity

- Domain registered via Njalla (they register in their name, paid with XMR)
- SSL via Let's Encrypt (automatic, no identity required)
- No analytics that leak identity (no Google Analytics — use self-hosted Plausible or Umami, or simple server-side event logging)
- No Cloudflare (requires account) — direct HTTPS on VPS, or use anonymous CDN if needed later

### 11.7 Shared Python Astrology API

A lightweight FastAPI service running on the same VPS, consumed by both the Telegram bots and the Next.js website:

```
astrology-api/
├── main.py              # FastAPI app
├── routes/
│   ├── chart.py         # POST /chart — compute natal chart
│   ├── synastry.py      # POST /synastry — compatibility
│   ├─�� transits.py      # GET /transits — current transits
│   ├── reading.py       # POST /reading — generate Claude reading
│   └── video.py         # POST /video — trigger video generation
└── auth.py              # Simple API key auth (internal only, not exposed)
```

This means the kerykeion + Claude logic is written once in Python and shared. The Next.js website and the Telegram bots are both clients of this API.

**Updated project structure:**
```
olivia-arcana/
├── bot/                 # Telegram bots (Aiogram 3, Python)
├── api/                 # Shared astrology API (FastAPI, Python)
├── website/             # Next.js marketing site + web app
├── config/              # Shared YAML configs
├─��� locales/             # Shared locale strings
└── docs/
```

---

## 12. Testing Strategy

### 11.1 Local Development

- Use Telegram's test environment (test.telegram.org) for bot testing
- Telegram provides test Stars payment provider — no real money during development
- CryptoBot has testnet mode for crypto payment testing
- All 8 bots can run locally against test bot tokens

### 11.2 Test Coverage

| Area | What to test |
|------|-------------|
| Onboarding | Birth data collection, chart computation, free mini-reading |
| Persona | Claude responses stay in character, respect language, handle edge cases |
| Astrology | Kerykeion chart accuracy, transit detection, synastry computation |
| Payments | Stars checkout flow, CryptoBot invoice creation, unlock logic, subscription lifecycle |
| Video | Script generation, HeyGen API integration, delivery to user |
| Scheduler | Daily content generation, VIP reading push, re-engagement triggers |
| Rate limiting | Free tier 5 msg/day enforcement, reset logic |
| Multi-language | All handlers work correctly in each language |
| Funnel | Referral tracking, analytics events logged correctly |
| Website | Landing page renders all locales, chat widget works, payment flows complete, SEO pages generate |
| Shared API | FastAPI endpoints return correct chart data, bot and website both consume API successfully |

---

## 12. Launch Strategy

### Staggered Rollout

| Week | Action |
|------|--------|
| 1-2 | Build shared Python astrology API (FastAPI) + core bot (EN only): onboarding, chat, readings, payments |
| 3 | Add tarot, compatibility, scheduler, content automation |
| 4 | Add video reading pipeline |
| 5 | Build website: Next.js landing page + web app chat + TON Connect payments |
| 6 | Add remaining 7 languages (config + locales + prompts for bot + website) |
| 7 | Testing: Telegram test environment + website local testing |
| 8 | Deploy to anonymous VPS (bots + API + website), launch EN + UA |
| 9 | Launch RU + AR |
| 10 | Launch DE + ES |
| 11 | Launch PT + FR |
| Ongoing | TikTok content grind, cross-promotion, SEO content, analytics review |

Languages staggered by 1-2 weeks to manage content quality and catch issues early.

**MVP scope note:** Shared astrology API + core bot (onboarding, chat, readings, payments, tarot, compatibility, scheduler) built in EN first (weeks 1-3). Video pipeline in week 4. Website in week 5. Multi-language in week 6. This sequencing means core product is testable in EN before adding complexity. The operator dashboard is deferred — use direct SQL queries for MVP analytics.
