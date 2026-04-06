# Olivia Arcana — Social Media Content Pipeline
## TikTok + Instagram + YouTube Shorts → Website + Telegram Bot

**Date:** April 7, 2026
**Status:** Pipeline designed. Ready for implementation.
**Goal:** Automated omnichannel content engine driving traffic to olivia-arcana.netlify.app + t.me/OliviaArcanaBot

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Traffic Architecture](#2-traffic-architecture)
3. [Platform-Specific Strategy](#3-platform-specific-strategy)
4. [Content Types & Templates](#4-content-types--templates)
5. [Automation Pipeline (End-to-End)](#5-automation-pipeline-end-to-end)
6. [Script Generation System](#6-script-generation-system)
7. [Video Production Pipeline](#7-video-production-pipeline)
8. [Cross-Posting & Repurposing Matrix](#8-cross-posting--repurposing-matrix)
9. [Posting Schedule](#9-posting-schedule)
10. [Hook Library](#10-hook-library)
11. [Hashtag Strategy](#11-hashtag-strategy)
12. [CTA Framework](#12-cta-framework)
13. [Traffic Funnel Design](#13-traffic-funnel-design)
14. [Account Setup & Branding](#14-account-setup--branding)
15. [Engagement Playbook](#15-engagement-playbook)
16. [Growth Tactics](#16-growth-tactics)
17. [UGC & Viral Loop Integration](#17-ugc--viral-loop-integration)
18. [Analytics & KPIs](#18-analytics--kpis)
19. [Budget & Cost Structure](#19-budget--cost-structure)
20. [Technical Implementation](#20-technical-implementation)
21. [30-60-90 Day Launch Plan](#21-30-60-90-day-launch-plan)
22. [Content Calendar Templates](#22-content-calendar-templates)
23. [Reference Documents](#23-reference-documents)

---

## 1. Executive Summary

### The Mission
Build a fully automated content engine that produces 15-20 pieces of social media content daily across TikTok, Instagram, and YouTube Shorts — all driving traffic to two destinations:

1. **Website:** https://olivia-arcana.netlify.app (WebGL astrology experience, birth chart tools, VIP subscriptions via Stripe)
2. **Telegram Bot:** t.me/OliviaArcanaBot (daily readings, personalized charts, VIP subscriptions via Telegram Stars / CryptoBot)

### The Funnel
```
Social Media Content (TikTok/IG/YT Shorts)
    |
    ├── "Link in bio" → Linktree
    |     ├── olivia-arcana.netlify.app (website)
    |     ├── t.me/OliviaArcanaBot?start=social (bot with tracking)
    |     └── t.me/OliviaArcanaDaily (public channel)
    |
    ├── Comments → persona engagement → "DM me for a free reading"
    |
    └── Shares/Duets/Stitches → organic reach amplification
```

### Daily Output Target
| Platform | Daily Output | Weekly Total |
|----------|-------------|-------------|
| TikTok | 12 daily zodiac clips + 1-2 skits | 90-98 videos |
| Instagram Reels | 3-5 cross-posts from TikTok | 21-35 reels |
| Instagram Stories | 12 zodiac cards + tarot + polls | 98+ stories |
| Instagram Feed | 1 carousel or aesthetic post | 7 posts |
| YouTube Shorts | 2-3 cross-posts from TikTok | 14-21 shorts |
| **Total** | **~30 pieces/day** | **~230/week** |

### Monthly Cost: $120-180 (fully automated)
### Revenue Target: $975/mo by Month 3, $4,875/mo by Month 6

---

## 2. Traffic Architecture

### The Omnichannel Flywheel

```
                        ┌──────────────────────────────┐
                        │     OLIVIA ARCANA BRAND       │
                        │   "Your personal astrologer"  │
                        └──────────────┬───────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            │                          │                          │
     ┌──────▼──────┐           ┌──────▼──────┐           ┌──────▼──────┐
     │   TIKTOK    │           │  INSTAGRAM  │           │  YOUTUBE    │
     │  (Acquire)  │           │  (Nurture)  │           │  (Authority)│
     │  12+2/day   │           │  Stories+   │           │  2-3 Shorts │
     │             │           │  Reels+Feed │           │  /day       │
     └──────┬──────┘           └──────┬──────┘           └──────┬──────┘
            │                          │                          │
            └──────────────────────────┼──────────────────────────┘
                                       │
                              ┌────────▼────────┐
                              │   LINKTREE      │
                              │   (Router)      │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                                     │
             ┌──────▼──────┐                       ┌──────▼──────┐
             │   WEBSITE   │                       │  TELEGRAM   │
             │ (Convert)   │                       │   BOT       │
             │ WebGL+Chart │                       │ (Engage)    │
             │ Stripe pay  │                       │ Stars pay   │
             └──────┬──────┘                       └──────┬──────┘
                    │                                     │
                    └──────────────────┼──────────────────┘
                                       │
                              ┌────────▼────────┐
                              │  VIP SUBSCRIBER │
                              │  $6.50/mo       │
                              │  Lifetime: $65+ │
                              └─────────────────┘
```

### Platform Roles

| Platform | Role | Primary Metric | Traffic Destination |
|----------|------|---------------|-------------------|
| **TikTok** | Discovery engine. Viral reach. Acquire cold audience. | Views, shares, profile visits | Bio link → Linktree |
| **Instagram** | Brand building. Nurture warm audience. Visual identity. | Saves, link clicks, story engagement | Bio link → Linktree |
| **YouTube Shorts** | SEO authority. Evergreen discovery. Secondary reach. | Subscribers, watch time | Description link |
| **Website** | Premium conversion. WebGL experience. Stripe payments. | Signups, chart generations, VIP conversions | Direct monetization |
| **Telegram Bot** | Daily engagement. Personalized readings. Stars payments. | DAU, messages, VIP conversions | Direct monetization |
| **Telegram Channel** | Retention. Push content. No algorithm. | Views, forwards, reactions | CTA → Bot DM |

### Tracking Parameters

Every link includes UTM-style tracking via bot `start` parameter:

| Source | Link Format | Tracking |
|--------|------------|----------|
| TikTok bio | `t.me/OliviaArcanaBot?start=tiktok` | `source=tiktok` |
| Instagram bio | `t.me/OliviaArcanaBot?start=instagram` | `source=instagram` |
| YouTube description | `t.me/OliviaArcanaBot?start=youtube` | `source=youtube` |
| Website CTA | `t.me/OliviaArcanaBot?start=website` | `source=website` |
| Specific video | `t.me/OliviaArcanaBot?start=tt_scorpio_roast_0407` | `source=tiktok, content=scorpio_roast, date=0407` |

Website tracking: `olivia-arcana.netlify.app?utm_source=tiktok&utm_medium=social&utm_campaign=daily_zodiac`

---

## 3. Platform-Specific Strategy

### 3.1 TikTok — The Growth Engine

**Why TikTok is #1 priority:** 73% of astrology content consumers are on TikTok. Highest viral coefficient. Algorithm favors new accounts with consistent posting. Astrology is a top-10 content category.

**Account:** @oliviaarcana
**Category:** Education or Entertainment
**Content mix:**

| Content Type | Format | Duration | Frequency | % of Content |
|-------------|--------|----------|-----------|-------------|
| Daily zodiac clips | AI voiceover + animated visual | 15-30s | 12/day | 70% |
| Zodiac roasts | Olivia roasting a sign | 30-60s | 2/week | 8% |
| Compatibility duets | "Are [Sign A] and [Sign B] soulmates?" | 30-45s | 2/week | 8% |
| Celebrity breakdowns | "[Celebrity]'s chart explains everything" | 45-60s | 1-2/week | 5% |
| Transit alerts | "Mercury retrograde hits YOUR sign" | 15-30s | As needed | 4% |
| "What your sign does when..." | Relatable zodiac behavior | 15-30s | 2-3/week | 5% |

**Key TikTok behaviors:**
- Enable duets on all videos
- Enable stitches on all videos
- Reply to comments as Olivia persona
- Use original audio for daily clips (builds brand recognition)
- Use trending audio for weekly skits (algorithm boost)
- Pin comment with Telegram bot link on every video

### 3.2 Instagram — The Brand Builder

**Why Instagram matters:** Visual identity showcase. Older demographic (25-40) with higher purchasing intent. Carousel saves = algorithmic gold. Stories build daily habit.

**Account:** @oliviaarcana
**Category:** Personal Blog or Astrologer

| Content Type | Format | Dimensions | Frequency | Purpose |
|-------------|--------|------------|-----------|---------|
| Story horoscopes | Static image | 1080x1920 | 12/day | Daily habit, retention |
| Tarot card of day | Story card reveal | 1080x1920 | 1/day | Mystique + engagement |
| Reels (TikTok cross-post) | Video | 1080x1920 | 3-5/week | Reach via algorithm |
| Carousels | 5-10 slide set | 1080x1080 | 2-3/week | Saves + shares |
| Birth chart cards | Single image | 1080x1080 | On demand (UGC) | UGC sharing |
| Aesthetic brand posts | Single image | 1080x1080 | 1-2/week | Brand building |
| Weekly cosmic weather | Vertical infographic | 1080x1350 | 1/week (Mon) | Authority + saves |
| Polls/Quizzes | Story interactive | 1080x1920 | 2-3/week | Engagement boost |

**Key Instagram behaviors:**
- Reply to every comment in first hour (algorithm boost)
- Use Story engagement features (polls, quizzes, emoji sliders)
- Post at optimal times (Instagram Insights)
- 15-20 hashtags per feed post
- Use Story Highlights for organization

### 3.3 YouTube Shorts — The SEO Play

**Why YouTube Shorts:** Evergreen discovery. SEO indexing. Higher monetization potential long-term. Cross-posts from TikTok require zero extra effort.

**Channel:** Olivia Arcana
**Category:** Education > Astrology

| Content Type | Format | Duration | Frequency | Purpose |
|-------------|--------|----------|-----------|---------|
| Daily zodiac shorts | TikTok cross-post | 15-30s | 2-3/day | Reach + discovery |
| Transit explainers | TikTok cross-post | 30-60s | 2-3/week | SEO authority |
| Celebrity charts | TikTok cross-post | 45-60s | 1-2/week | Algorithm boost |
| Monthly forecasts | Original long-form | 10-15 min | 1/month per sign | SEO + authority |

**Key YouTube behaviors:**
- Titles optimized for search ("Scorpio Daily Horoscope April 7 2026")
- Description includes keywords + bot link + website link
- End screens point to bot
- Community tab for polls and engagement
- Shorts watermark removed (TikTok logo → re-render without watermark)

---

## 4. Content Types & Templates

### 4.1 Daily Zodiac Clip (Bread & Butter — 12/day)

**Purpose:** Volume play. One per sign per day. Drives daily visits and builds brand recognition.

**Structure (15-30 seconds):**
```
[0-3s]  HOOK: "If you're a Scorpio, the stars have something urgent for you today."
[3-20s] BODY: 2-3 sentences about today's energy. Reference actual transit.
         "Mars entering your 7th house means relationships are about to get intense.
          Someone from your past might reach out — but the stars say: be careful."
[20-25s] CTA: "Follow for your daily reading. Link in bio for your personal chart."
[25-30s] BRANDING: Olivia Arcana logo + zodiac glyph
```

**Visual template (CapCut):**
- Background: Dark gradient (#0D0D1A → #1A1A3E) with subtle star particles
- Large zodiac glyph (gold, centered, pulsing gently)
- Sign name in Playfair Display Bold, gold
- Captions: Bold white, centered, 2-3 words at a time, synced to audio
- OA watermark: bottom-right corner, small, gold

**Audio:** ElevenLabs "Olivia" voice (warm, mystical, feminine)

### 4.2 Zodiac Roast (Viral Engine — 2/week)

**Purpose:** Most shareable format. Screenshots go viral. Drives organic reach.

**Structure (30-60 seconds):**
```
[0-3s]  HOOK: "Oh, Gemini. We need to talk."
[3-40s] BODY: 3-4 roast lines, each targeting a different trait.
         "You have the attention span of a TikTok scroll,
          your browser has 47 tabs open right now,
          and you've already planned 3 different lives this week alone."
[40-50s] REDEMPTION: "But here's what nobody tells you —
          your Mercury placement means you process information faster
          than most people dream. That chaos? It's genius with a bad schedule."
[50-60s] CTA: "Think you can handle YOUR cosmic truth? Link in bio."
```

**Visual:** Same dark template but with sign-specific accent color. More dynamic transitions. Text overlays for the roast lines.

### 4.3 Compatibility Duet (Viral Pair — 2/week)

**Purpose:** Triggers sharing between couples/friends. Each share = potential new user.

**Structure (30-45 seconds):**
```
[0-3s]  HOOK: "Are Leo and Scorpio actually soulmates? Let's find out."
[3-30s] BODY: Quick synastry breakdown.
         "Venus in fire meets Mars in water — intense attraction but WATCH OUT.
          Your communication styles are literally opposite signs."
[30-40s] VERDICT: "Compatibility score: 73%. Passionate but volatile."
[40-45s] CTA: "Tag your Leo/Scorpio partner. Get your REAL compatibility at the link in bio."
```

**Visual:** Split-screen with both zodiac glyphs. Compatibility percentage animates in.

### 4.4 Celebrity Chart Breakdown (Algorithm Boost — 1-2/week)

**Purpose:** Ride trending topics. Celebrity content gets algorithmic push.

**Structure (45-60 seconds):**
```
[0-3s]  HOOK: "I looked up [Celebrity]'s birth chart and everything makes sense now."
[3-20s] REVEAL 1: Sun sign → public persona
[20-35s] REVEAL 2: Moon sign → emotional core
[35-50s] REVEAL 3: Surprising aspect → explains specific behavior/event
[50-60s] CTA: "Want to see YOUR chart? Link in bio."
```

**Timing:** Post within 24-48 hours of celebrity trending moment.

### 4.5 Transit Alert (Urgency Play — as needed)

**Purpose:** Time-sensitive content. Creates urgency and FOMO.

**Structure (15-30 seconds):**
```
[0-3s]  HOOK: "Mercury retrograde starts in 3 days. Here's what you NEED to do NOW."
[3-25s] BODY: Quick practical advice per sign category.
[25-30s] CTA: "Get your personal retrograde survival guide — link in bio."
```

**Timing:** Post 3-5 days before major transits (retrograde, eclipse, full moon, new moon).

### 4.6 "What Your Sign Does When..." (Relatable Content — 2-3/week)

**Purpose:** Identity-based humor. Extremely shareable. Tags and duets.

**Structure (15-30 seconds):**
```
[0-3s]  HOOK: "What each sign does when they get a text from their ex..."
[3-25s] BODY: Quick rundown of 4-6 signs (rotate which signs are featured).
[25-30s] CTA: "Which sign are YOU? Comment below. Follow for daily readings."
```

### 4.7 Instagram Carousel (Save Magnet — 2-3/week)

**Purpose:** Carousels get the highest save rate on Instagram. Saves = algorithmic gold.

**Carousel Topics (rotating):**
1. "Your Big 3 Explained" (Sun + Moon + Rising)
2. "Mercury Retrograde Survival Guide by Sign"
3. "The 4 Most Compatible Sign Pairs (According to Actual Charts)"
4. "What Your Moon Sign Says About Your Love Language"
5. "5 Things Only [Sign] Understands"
6. "Your Sign's Biggest Strength (and Secret Weakness)"
7. "Weekly Cosmic Weather Forecast"

**Slide structure (5-10 slides, 1080x1080):**
```
Slide 1: Cover — Bold title, zodiac imagery, Celestial Noir palette
Slide 2-8: Content — One key insight per slide, clear typography
Slide 9: Summary/Recap
Slide 10: CTA — "Get your personal reading: Link in bio → @OliviaArcanaBot"
```

### 4.8 Story Horoscope Card (Daily Retention — 12/day)

**Purpose:** Daily touch point. Builds habit of checking Olivia's content.

**Template (1080x1920):**
```
[Top zone - 80px padding]
Zodiac glyph (400px, centered, gold #D4AF37)
SIGN NAME (Playfair Display 700, 48px, gold)
Date range (Inter 400, 16px, muted lavender #9B96A8)
------- gold divider (60% width) -------
Reading text (3-4 lines, Inter 400, 22px, warm ivory #F5F0E8)
------- gold divider -------
"Swipe up for your personal reading" (Inter 500, 16px, slate blue #7B68EE)
OA logo (small, bottom center, gold)
[Bottom zone - 100px padding]
```

---

## 5. Automation Pipeline (End-to-End)

### Master Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DAILY AUTOMATION PIPELINE                        │
│                    (runs at 04:00 UTC daily)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Step 1: TRANSIT DATA                                               │
│  ┌─────────────────────┐                                           │
│  │ kerykeion (Python)   │ → Current planetary positions             │
│  │ NASA JPL ephemeris   │ → Active aspects for each sign            │
│  └──────────┬──────────┘ → Transit-to-sign impact scores            │
│             │                                                       │
│  Step 2: SCRIPT GENERATION                                          │
│  ┌──────────▼──────────┐                                           │
│  │ Claude API           │ → 12 daily zodiac scripts (TikTok)        │
│  │ (batch, one call)    │ → 12 daily zodiac texts (Story cards)     │
│  │                      │ → 12 daily zodiac texts (Telegram)        │
│  │                      │ → 1 weekly skit script                    │
│  └──────────┬──────────┘                                           │
│             │                                                       │
│  Step 3: VOICEOVER                                                  │
│  ┌──────────▼──────────┐                                           │
│  │ ElevenLabs API       │ → 12 daily MP3 audio files                │
│  │ "Olivia" voice       │ → 1 weekly skit MP3                       │
│  └──────────┬──────────┘                                           │
│             │                                                       │
│  Step 4: VIDEO GENERATION                                           │
│  ┌──────────▼──────────┐                                           │
│  │ CapCut (template)    │ → 12 daily zodiac MP4 videos (15-30s)     │
│  │ OR FFmpeg pipeline   │ → Burned-in captions (Whisper + ffmpeg)   │
│  └──────────┬──────────┘                                           │
│             │                                                       │
│  Step 5: IMAGE GENERATION                                           │
│  ┌──────────▼──────────┐                                           │
│  │ Python Pillow        │ → 12 Story horoscope cards (1080x1920)    │
│  │ Template engine      │ → 12 feed horoscope cards (1080x1080)     │
│  │                      │ → 1 carousel set (5-10 slides)            │
│  └──────────┬──────────┘                                           │
│             │                                                       │
│  Step 6: DISTRIBUTE                                                 │
│  ┌──────────▼──────────┐                                           │
│  │ TikTok API / Later   │ → Schedule TikTok posts (staggered)       │
│  │ Meta Business Suite  │ → Schedule IG Stories + Reels + Feed       │
│  │ YouTube API          │ → Upload Shorts                           │
│  │ Telegram Bot API     │ → Post to 8 language channels              │
│  └─────────────────────┘                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Execution Timeline (Daily)

| Time (UTC) | Step | Action | Tool | Output |
|------------|------|--------|------|--------|
| 04:00 | 1 | Compute today's transits | kerykeion (Python) | Transit data JSON |
| 04:05 | 2 | Generate 12 TikTok scripts + 12 Story texts + 12 Telegram texts | Claude API (1 batch call) | 36 text outputs |
| 04:15 | 3 | Generate 12 voiceover audio files | ElevenLabs API (batch) | 12 MP3 files |
| 04:30 | 4 | Render 12 videos from template + audio | CapCut API or FFmpeg | 12 MP4 files |
| 04:45 | 4b | Add captions to all videos | Whisper + FFmpeg | 12 captioned MP4s |
| 05:00 | 5 | Generate 12 Story cards + 12 feed cards | Python Pillow | 24 PNG files |
| 05:15 | 6a | Post to 8 Telegram channels | Bot API | 96 channel posts |
| 05:30 | 6b | Upload to Instagram Stories (12 cards) | Meta Business Suite | 12 stories |
| 06:00 | 6c | First TikTok post (Aries) | TikTok API / Later | 1 video live |
| 07:00-17:00 | 6d | Stagger remaining TikTok posts (hourly) | Scheduled | 11 more videos |
| 07:00 | 6e | First YouTube Short | YouTube API | 1 short live |
| 12:00 | 6f | Instagram Reel (best TikTok of the day) | Cross-post | 1 reel live |
| 15:00 | 6g | Instagram feed post (carousel or aesthetic) | Buffer/Later | 1 feed post |

### Weekly Additions (on top of daily)

| Day | Extra Content | Pipeline |
|-----|-------------|----------|
| Monday | Zodiac roast video (30-60s) | Claude script → ElevenLabs → CapCut → TikTok + IG Reel + YT Short |
| Tuesday | Compatibility duet video (30-45s) | Claude script → ElevenLabs → CapCut → TikTok + IG Reel |
| Wednesday | Celebrity chart breakdown (45-60s) | Research trending celeb → Claude script → ElevenLabs → CapCut → All platforms |
| Thursday | "What your sign does when..." (15-30s) | Claude script → ElevenLabs → CapCut → TikTok + IG Reel |
| Friday | Birth chart reveal video (30-45s) | Claude script → ElevenLabs → CapCut → TikTok + IG Reel |
| Monday | Weekly cosmic weather carousel (IG) | Claude text → Pillow 10-slide carousel → Instagram feed |
| Wednesday | Educational carousel (IG) | Claude text → Pillow → Instagram feed |
| Friday | Aesthetic brand post (IG) | Designed image → Instagram feed |

---

## 6. Script Generation System

### 6.1 Transit Data Input

```python
# scripts/compute_transits.py
from kerykeion import AstrologicalSubject
from datetime import datetime, timezone

def get_daily_transits():
    """Compute today's planetary positions and sign impacts."""
    now = datetime.now(timezone.utc)
    sky = AstrologicalSubject("Transit", now.year, now.month, now.day,
                               now.hour, now.minute, "Greenwich", "GB")

    transits = {
        "sun": {"sign": sky.sun.sign, "degree": sky.sun.position},
        "moon": {"sign": sky.moon.sign, "degree": sky.moon.position},
        "mercury": {"sign": sky.mercury.sign, "degree": sky.mercury.position},
        "venus": {"sign": sky.venus.sign, "degree": sky.venus.position},
        "mars": {"sign": sky.mars.sign, "degree": sky.mars.position},
        "jupiter": {"sign": sky.jupiter.sign, "degree": sky.jupiter.position},
        "saturn": {"sign": sky.saturn.sign, "degree": sky.saturn.position},
    }

    # Compute aspects affecting each sign
    sign_impacts = compute_sign_aspects(transits)
    return transits, sign_impacts
```

### 6.2 Claude API Script Generation (Batch)

**Daily Zodiac Script Prompt:**
```
You are Olivia Arcana, writing 12 TikTok scripts (one per zodiac sign) for today.

Today's transits:
{transit_data_json}

For EACH of the 12 signs, write a 15-second script in this EXACT format:

SIGN: [sign name]
HOOK (3 seconds, must grab attention — use fear, curiosity, or specificity):
[One punchy opening line that makes the viewer stop scrolling]

BODY (8-10 seconds, reference the ACTUAL transit affecting this sign):
[2-3 sentences about today's energy. Use "you" language. Be specific, not generic.
Reference the real planetary movement. Create emotional resonance.]

CTA (2 seconds):
[Rotate between: "Follow for your daily reading" / "Link in bio for your full chart" / "Comment your sign below"]

Rules:
- Olivia's voice: warm, mystical, empowering. Never condescending.
- Reference ACTUAL transits (e.g., "Mars entering your 7th house") — never generic
- "Today is a good day" = BANNED. Be specific or be quiet.
- Create urgency OR emotional resonance in every script
- Under 80 words per script
- Each sign's script must feel UNIQUE — no copy-paste with sign names swapped

Output as JSON array with 12 objects: [{sign, hook, body, cta}, ...]
```

**Zodiac Roast Prompt:**
```
You are Olivia Arcana, writing a 30-second TikTok zodiac roast for {sign}.

Current transits affecting {sign}: {transit_data}

Write a brutally honest but ultimately loving roast. Reference their actual planetary
placements to make it feel personal and scarily accurate.

Format:
HOOK: "Oh, {sign}. We need to talk."
ROAST_1: Target their communication style
ROAST_2: Target their relationship patterns
ROAST_3: Target their most annoying habit (make it uncomfortably specific)
REDEMPTION: One genuinely kind observation about their greatest strength
CTA: "Think you can handle YOUR cosmic truth? Link in bio."

Rules:
- Sharp, funny, specific (NOT generic zodiac stereotypes)
- Reference real planetary energy from current transits
- Never cruel, always loving underneath
- The kind of roast that makes people say "HOW DID SHE KNOW"
- Under 120 words total
```

**Celebrity Chart Prompt:**
```
You are Olivia Arcana, breaking down {celebrity_name}'s birth chart for a 45-second TikTok.

Celebrity birth data: {celebrity_chart_data}
(Sun: {sun}, Moon: {moon}, Rising: {rising}, Venus: {venus}, Mars: {mars})

Write a script that explains WHY they are the way they are, using their ACTUAL chart data.

Format:
HOOK: "I looked up {celebrity_name}'s birth chart and everything makes sense now."
REVEAL_1: Sun sign → what it means for their public persona. Connect to a known behavior.
REVEAL_2: Moon sign → their emotional core. Reference a specific public moment.
REVEAL_3: One surprising aspect that explains something unexpected about them.
CTA: "Want to see YOUR chart? Link in bio."

Rules:
- Reference REAL chart data, not generic descriptions
- Connect placements to known public behaviors or events
- Entertaining AND insightful — not just fun facts
- Under 150 words
```

**Compatibility Script Prompt:**
```
You are Olivia Arcana, analyzing {sign_a} and {sign_b} compatibility for a 30-second TikTok.

Synastry data:
{synastry_analysis}

Format:
HOOK: "Are {sign_a} and {sign_b} actually soulmates? Let's check the stars."
ATTRACTION: What draws them together (Venus/Mars interplay)
WARNING: The biggest tension point (Saturn/Pluto aspects)
VERDICT: Compatibility score (X%) with one-line summary
CTA: "Tag your {sign_a}/{sign_b} partner. Get your REAL compatibility: link in bio."

Rules:
- Reference actual synastry dynamics, not stereotypes
- Be honest — if it's a tough pairing, say so (with nuance)
- Create emotional stakes: the viewer should NEED to know their own score
- Under 100 words
```

### 6.3 Story Card Text Prompt

```
You are Olivia Arcana. Write 12 daily Story horoscope texts (one per sign).

Today's transits: {transit_data}

For each sign, write 3-4 lines (under 60 words) in Olivia's warm, mystical voice.
Reference the actual transit. End each with a subtle CTA direction.

Format: JSON array [{sign, text}, ...]

Rules:
- More intimate tone than TikTok (Stories feel personal)
- "Dear Scorpio, the stars are asking you to..." not "Hey Scorpio!"
- Specific, never generic
```

---

## 7. Video Production Pipeline

### 7.1 Option A: CapCut Template Pipeline (Recommended for daily clips)

**Setup:**
1. Create 12 CapCut templates (one base per zodiac element: Fire, Earth, Air, Water)
2. Each template: dark background + zodiac glyph + caption area + OA branding
3. Templates accept: audio file + caption text

**Daily production:**
```
Input: 12 MP3 audio files + 12 scripts
Process: CapCut batch processing or CapCut API
Output: 12 MP4 files (1080x1920, 30fps, H.264)
Time: ~15-20 minutes for all 12
Cost: $8/mo (CapCut Pro)
```

### 7.2 Option B: FFmpeg Custom Pipeline (Zero marginal cost)

For maximum control and zero ongoing cost, build a Python + FFmpeg pipeline:

```python
# scripts/generate_video.py
import subprocess
import json

def generate_zodiac_video(sign, audio_path, script_text, output_path):
    """Generate a 9:16 video with background, text overlay, and audio."""

    # 1. Base video: dark gradient background with zodiac glyph
    bg_path = f"templates/backgrounds/{sign}_bg.mp4"  # Pre-rendered 30s loop

    # 2. Add audio
    # 3. Add word-by-word captions (using Whisper timestamps)
    # 4. Add OA branding watermark
    # 5. Export as H.264 MP4

    cmd = [
        "ffmpeg", "-i", bg_path, "-i", audio_path,
        "-filter_complex", build_caption_filter(script_text),
        "-c:v", "libx264", "-preset", "medium",
        "-c:a", "aac", "-b:a", "128k",
        "-shortest", output_path
    ]
    subprocess.run(cmd, check=True)
```

### 7.3 Caption Generation

```python
# scripts/add_captions.py
import whisper

def generate_captions(audio_path):
    """Use Whisper to generate word-level timestamps for captions."""
    model = whisper.load_model("base")
    result = model.transcribe(audio_path, word_timestamps=True)

    captions = []
    for segment in result["segments"]:
        for word in segment["words"]:
            captions.append({
                "text": word["word"].strip(),
                "start": word["start"],
                "end": word["end"]
            })
    return captions
```

**Caption style spec:**
- Font: Bold sans-serif (Inter Bold or similar)
- Color: White (#FFFFFF) with black outline (2px stroke) + drop shadow
- Position: Center of frame, lower third (y=1200-1500 in 1920px frame)
- Size: 72px (readable on phone)
- Animation: Word-by-word reveal, synced to audio timestamps
- Groups: 2-3 words at a time (not single words, not full sentences)

### 7.4 Video Specifications (All Platforms)

| Spec | Value |
|------|-------|
| Aspect ratio | 9:16 (vertical) |
| Resolution | 1080 x 1920 px |
| Duration | 15-60 seconds |
| FPS | 30 fps |
| Codec | H.264 |
| Audio | AAC, stereo, 44.1kHz |
| File size | Under 500MB (TikTok) / 100MB (IG Reels) |
| Safe zone | 80% of frame (avoid edges for platform UI overlays) |
| No watermarks | Re-render without TikTok logo for IG/YT cross-posts |

---

## 8. Cross-Posting & Repurposing Matrix

### Content Repurposing Flow

```
               SINGLE SOURCE OF TRUTH
               (Claude + kerykeion transit data)
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
    ▼                    ▼                    ▼
  TEXT                 AUDIO               IMAGE
  (Scripts)           (Voiceover)         (Cards)
    │                    │                    │
    ├─→ Telegram post    ├─→ TikTok video    ├─→ IG Story card
    ├─→ IG caption       ├─→ IG Reel         ├─→ IG Feed card
    ├─→ YT description   ├─→ YT Short        ├─→ IG Carousel slide
    └─→ Blog post (SEO)  └─→ Podcast clip    └─→ Pinterest pin
```

### Cross-Post Matrix

| Original Content | TikTok | IG Reels | IG Stories | IG Feed | YT Shorts | Telegram |
|-----------------|--------|----------|------------|---------|-----------|----------|
| Daily zodiac video (15-30s) | PRIMARY | Cross-post (remove TT watermark) | 15s clip | — | Cross-post | Audio as voice message |
| Zodiac roast (30-60s) | PRIMARY | Cross-post | Teaser clip | — | Cross-post | Screenshot quote |
| Compatibility (30-45s) | PRIMARY | Cross-post | — | — | Cross-post | Text version |
| Celebrity chart (45-60s) | PRIMARY | Cross-post | — | — | Cross-post | Text version |
| Story horoscope card | — | — | PRIMARY | Repurpose as feed card | — | Text version |
| Carousel content | — | — | Slide previews | PRIMARY | — | Text summary |
| Tarot card of day | Short reveal video | Reel | PRIMARY | — | Short | Card image + text |
| Weekly cosmic weather | Slideshow with VO | — | Highlight clips | PRIMARY carousel | — | Full text post |

### Watermark Removal for Cross-Posts

TikTok adds a watermark. For IG Reels and YT Shorts:
- **Option 1:** Render the video twice — once for TikTok, once without watermark
- **Option 2:** Use SnapTik or similar (not recommended for quality)
- **Option 3 (Best):** Upload the raw video to all platforms simultaneously from the pipeline, before TikTok processes it

**Recommended:** Render once, upload native to each platform. Slight difference in captions/CTAs per platform.

---

## 9. Posting Schedule

### Daily Schedule (All Platforms)

| Time (UTC) | Time (EST) | Platform | Content | Notes |
|------------|------------|----------|---------|-------|
| 05:15 | 12:15 AM | Telegram | 12 zodiac posts + tarot | Batch upload |
| 05:30 | 12:30 AM | Instagram | 12 Story horoscope cards | Batch upload |
| 06:00 | 1:00 AM | TikTok | Aries daily zodiac | Staggered posting begins |
| 07:00 | 2:00 AM | TikTok + YT | Taurus + first YT Short | |
| 08:00 | 3:00 AM | TikTok | Gemini | |
| 09:00 | 4:00 AM | TikTok + IG | Cancer + Tarot Story | |
| 10:00 | 5:00 AM | TikTok | Leo | |
| 11:00 | 6:00 AM | TikTok | Virgo | |
| 12:00 | 7:00 AM | TikTok + IG | **Libra + Weekly skit (peak)** + IG Reel | **PEAK HOUR** |
| 13:00 | 8:00 AM | TikTok + IG | Scorpio + Engagement Story (poll) | **PEAK HOUR** |
| 14:00 | 9:00 AM | TikTok + YT | Sagittarius + YT Short | **PEAK HOUR** |
| 15:00 | 10:00 AM | TikTok + IG | **Capricorn + Afternoon skit** + IG Feed post | **PEAK HOUR** |
| 16:00 | 11:00 AM | TikTok | Aquarius | |
| 17:00 | 12:00 PM | TikTok | Pisces | |
| 18:00 | 1:00 PM | Telegram + IG | Evening teaser + optional IG Reel | |

**Peak hours (12:00-15:00 UTC / 7-10 AM EST):** Schedule the BEST content here — weekly skits, roasts, celebrity breakdowns.

### Weekly Skit Schedule

| Day | Skit Type | Platform | Time (UTC) |
|-----|----------|----------|------------|
| Monday | Zodiac roast | TikTok + IG Reel + YT Short | 12:00 |
| Tuesday | Compatibility duet | TikTok + IG Reel | 15:00 |
| Wednesday | Celebrity chart breakdown | TikTok + IG Reel + YT Short | 12:00 |
| Thursday | "What your sign does when..." | TikTok + IG Reel | 15:00 |
| Friday | Birth chart reveal | TikTok + IG Reel + YT Short | 12:00 |
| Saturday | Banked content | All platforms | Various |
| Sunday | "3 signs this week" preview | TikTok + IG Reel | 12:00 |

### Instagram-Specific Weekly Schedule

| Day | Feed Post | Stories (beyond daily 12) | Reels |
|-----|-----------|--------------------------|-------|
| Mon | Weekly cosmic weather carousel | Poll: "Best week for which sign?" | TikTok roast cross-post |
| Tue | — | Quiz: "What element is Scorpio?" | TikTok compatibility cross-post |
| Wed | Educational carousel | Engagement Q&A box | TikTok celebrity cross-post |
| Thu | — | Emoji slider: "How accurate?" | TikTok relatable cross-post |
| Fri | Aesthetic brand post | Countdown to next transit | TikTok reveal cross-post |
| Sat | — | User-submitted chart cards repost | Banked content |
| Sun | Week-ahead preview carousel | "Add Yours" template: Big 3 | Preview cross-post |

---

## 10. Hook Library

The first 3 seconds determine everything. Rotate through these categories:

### Fear/Curiosity Hooks
1. "If you're a [Sign], do NOT ignore this week's forecast..."
2. "Something is about to happen to [3 signs] and nobody is talking about it."
3. "I have bad news for [Sign]. The stars are NOT on your side today."
4. "[Sign], I need you to sit down for this one."
5. "The next 48 hours are going to change EVERYTHING for [3 signs]."

### Specificity Hooks
6. "Born between [date range]? The stars have a WARNING for you."
7. "If your birthday is in [month], you need to hear this right now."
8. "Your [planet] placement reveals something most astrologers won't tell you."
9. "I calculated the EXACT degree of your [planet]. Here's what it means."
10. "There's a transit happening RIGHT NOW that only affects [2-3 signs]."

### Identity Hooks
11. "Things only a [Sign] would understand..."
12. "POV: you're a [Sign] and you just found out [transit event]..."
13. "Tell me your sign and I'll tell you your biggest flaw. Starting with [Sign]."
14. "I can guess your zodiac sign in 3 questions. Try me."
15. "The most [trait] signs, ranked. And [Sign], we need to talk."

### Comparison Hooks
16. "[Sign A] vs [Sign B] -- who's having the better month?"
17. "I ranked all 12 signs from most to least [trait]. You're NOT ready."
18. "The most compatible zodiac pairs, according to actual birth chart data."
19. "Which sign is winning April? The answer surprised even me."
20. "Your sign vs your Rising sign — which one is running your life?"

### Authority Hooks
21. "I calculated your EXACT planetary positions. Here's what I found for [Sign]."
22. "Using real NASA data, here's why [Sign] is struggling right now."
23. "Most horoscope apps won't tell you this about [transit]. Let me explain."
24. "I've read 12,000+ birth charts. [Sign] always has THIS in common."
25. "The difference between a generic horoscope and YOUR actual chart is insane."

### FOMO Hooks
26. "Everyone's talking about [transit] but nobody is explaining HOW it affects YOU."
27. "3 signs are about to have the best week of their LIFE. Is yours one of them?"
28. "Mercury retrograde starts in [X days]. Here's what you need to do NOW."
29. "This transit only happens once every [X years]. And it's hitting [3 signs] hardest."
30. "You're missing something BIG in your chart. Let me show you."

### Reaction Hooks
31. "I looked up my friend's birth chart and... I have questions."
32. "When I read [Sign]'s chart today, I literally gasped."
33. "Someone asked me to roast [Sign] and I can't hold back anymore."
34. "A [Sign] sent me their chart and said 'be honest.' So I was."

### Controversy Hooks (High engagement, use sparingly)
35. "Unpopular opinion: [Sign] is actually the most [trait] sign."
36. "I'm sorry but [Sign] needs to hear this."
37. "The most overrated zodiac sign, according to birth chart data."
38. "Why [Sign] gets a bad reputation — and whether it's deserved."

---

## 11. Hashtag Strategy

### TikTok Hashtag Formula (5-8 per post)

```
Formula:
2 broad astrology tags + 1-2 sign-specific + 1 trending/seasonal + 1-2 discovery

Example (Scorpio daily):
#astrology #zodiacsigns #scorpio #scorpioseason #mercuryretrograde #fyp #astrologytok
```

**Core (always include 2-3):**
`#astrology` `#zodiac` `#horoscope` `#zodiacsigns` `#birthchart`

**Sign-specific:**
`#aries` `#taurus` `#gemini` `#cancer` `#leo` `#virgo`
`#libra` `#scorpio` `#sagittarius` `#capricorn` `#aquarius` `#pisces`

**Trending/Seasonal:**
`#mercuryretrograde` `#eclipseseason` `#fullmoon` `#newmoon`
`#ariesseason` `#taurusseason` (rotate with current season)

**Discovery:**
`#fyp` `#foryou` `#astrologytiktok` `#astrologytok` `#zodiacmemes`

### Instagram Hashtag Formula (15-20 per feed post)

```
Formula:
3 broad + 2-3 sign-specific + 2-3 content-type + 2-3 trending + 2-3 engagement + 2-3 niche

Example (Scorpio carousel):
#astrology #zodiac #horoscope #scorpio #scorpioseason #zodiacfacts
#astrologyfacts #dailyhoroscope #learnastrology #mercuryretrograde
#spirituality #mystic #cosmic #astrologycommunity #zodiacmemes
```

**Instagram Stories:** 3-5 hashtags only (use hashtag sticker or small text)
**Instagram Reels:** 8-12 hashtags

### YouTube Shorts Tags (in description)

```
Scorpio daily horoscope April 7 2026, scorpio horoscope today, scorpio zodiac,
astrology today, daily horoscope, zodiac signs, birth chart, olivia arcana
```

YouTube relies more on title/description SEO than hashtags.

### Monthly Hashtag Audit
- Review Instagram Insights → which hashtags drove the most reach
- Replace bottom 5 performing hashtags monthly
- Track trending astrology hashtags weekly
- Create a branded hashtag: `#OliviaArcana` or `#CosmicTruth`

---

## 12. CTA Framework

### CTA Rotation System

Avoid CTA fatigue by rotating between 5 types:

| CTA Type | Text | Best For | Frequency |
|----------|------|----------|-----------|
| **Follow** | "Follow for your daily reading" | New viewers, daily clips | 40% of content |
| **Link** | "Link in bio for your FREE birth chart" | Conversion-focused | 30% of content |
| **Comment** | "Comment your sign below" | Engagement boost | 15% of content |
| **Share** | "Tag your [Sign] friend" | Viral amplification | 10% of content |
| **Save** | "Save this for when [transit] hits" | Instagram carousels | 5% of content |

### Platform-Specific CTAs

**TikTok:**
- Voice CTA: "Follow for your daily reading" (end of video)
- Text CTA: "Link in bio for your FREE birth chart" (on-screen text, last 3s)
- Comment CTA: Pinned comment → "Get your personal reading: [bot link]"

**Instagram:**
- Reel CTA: Same as TikTok (cross-posted)
- Story CTA: "Swipe up for your personal reading" (if >10K followers) or "Link in bio"
- Feed CTA: Last slide of carousel → "Get your free reading → Link in bio"
- Caption CTA: "Save this post. You'll need it when [transit] hits."

**YouTube Shorts:**
- Voice CTA: "Subscribe for daily cosmic guidance"
- Description CTA: Full links to website + bot
- End screen: Subscribe button + bot link

### Website-Specific CTAs (in videos)

When driving to the website specifically:
- "See your birth chart come alive → olivia-arcana.com"
- "Our chart visualization is unlike anything you've seen → link in bio"
- "Experience your stars in 3D → website link in bio"

### Telegram-Specific CTAs (in videos)

When driving to the bot specifically:
- "Get your FREE personal birth chart reading → link in bio"
- "DM Olivia on Telegram for your daily reading"
- "12,000+ people get their reading from Olivia every morning. Join them."

---

## 13. Traffic Funnel Design

### Funnel Stage 1: Discovery (Social Media)

**Goal:** Get viewed. Get followed.

```
Viewer sees video on FYP/Explore/Shorts
    ↓
Hook grabs attention (first 3 seconds)
    ↓
Content delivers value (zodiac insight)
    ↓
CTA drives action:
    ├── Follow (builds audience for future content)
    ├── Comment (boosts algorithm, engagement)
    ├── Share (expands reach organically)
    └── Profile visit (gateway to bio link)
```

### Funnel Stage 2: Interest (Profile Visit)

**Goal:** Click bio link.

```
User visits @oliviaarcana profile
    ↓
Bio text:
"Your personal astrologer
 NASA-grade birth charts in 8 languages
 Free chart reading below"
    ↓
Linktree link in bio
```

### Funnel Stage 3: Consideration (Linktree)

**Goal:** Choose destination.

```
Linktree page (branded, Celestial Noir theme):

1. "Get Your FREE Birth Chart" → t.me/OliviaArcanaBot?start=social
   (Primary CTA, top of page, biggest button)

2. "Explore Your Stars" → olivia-arcana.netlify.app?utm_source=social
   (For users who prefer web experience)

3. "Daily Horoscope Channel" → t.me/OliviaArcanaDaily
   (For users who want passive content consumption)

4. "TikTok" → tiktok.com/@oliviaarcana
   (Cross-platform discovery)
```

### Funnel Stage 4: Activation (Website or Bot)

**Website path:**
```
olivia-arcana.netlify.app
    ↓
WebGL cosmos experience (wow factor)
    ↓
Birthday input in Hero section → zodiac activation
    ↓
Horoscope card appears → "Get your full reading"
    ↓
→ "Start on Telegram" button → Bot
OR
→ Onboarding flow (when built) → Birth chart → VIP upsell
```

**Telegram Bot path:**
```
t.me/OliviaArcanaBot?start=social
    ↓
Olivia welcomes user, asks for birthday
    ↓
Free birth chart summary (Sun/Moon/Rising)
    ↓
Daily readings begin (5 free messages/day)
    ↓
Day 3: "Unlock your full chart" nudge
    ↓
VIP upsell: $6.50/mo for unlimited readings
```

### Funnel Stage 5: Monetization

```
Free user ($0, engagement + UGC generation)
    ↓
Reading buyer ($1.95-6.50, one-time unlock)
    ↓
VIP subscriber ($6.50/mo or $65/yr)
    ↓
Premium buyer ($39.99 video reading)
```

### Funnel Metrics to Track

| Stage | Metric | Target | Tool |
|-------|--------|--------|------|
| Discovery → Follow | Follow rate | >2% of viewers | TikTok/IG Analytics |
| Follow → Profile visit | Profile visit rate | >5% of followers | TikTok/IG Analytics |
| Profile → Link click | Link click rate | >10% of profile visitors | Linktree analytics |
| Link → Bot start | Bot activation rate | >40% of link clicks | Bot DB |
| Bot start → Birth data | Onboarding completion | >60% | Bot DB |
| Birth data → Free reading | Reading generation | >90% | Bot DB |
| Free → Paid (any) | Conversion rate | >5% | Bot DB / Stripe |
| Free → VIP | VIP conversion | >3% | Bot DB / Stripe |

---

## 14. Account Setup & Branding

### 14.1 TikTok Account

**Registration:**
- Android emulator (BlueStacks or LDPlayer) for anonymous registration
- eSIM from Airalo for phone verification
- Account: @oliviaarcana
- Switch to Creator Account → Category: Education

**Profile:**
- **Display name:** Olivia Arcana
- **Bio:** "Your personal astrologer. NASA-grade charts. 8 languages. FREE birth chart reading below."
- **Profile picture:** OA monogram (gold ✦ on void black #0D0D1A, circular crop)
- **Link:** Linktree → `linktr.ee/oliviaarcana`

**Settings:**
- Enable Duets: ON
- Enable Stitches: ON
- Enable Downloads: ON
- Analytics: ON
- TikTok Shop: Enable when available

### 14.2 Instagram Account

**Registration:**
- Create via Meta Business Suite
- Convert to Creator Account → Category: Astrologer
- Link to Facebook Page (for scheduling + ads)

**Profile:**
- **Username:** @oliviaarcana
- **Display name:** Olivia Arcana
- **Bio:**
  ```
  Your personal astrologer
  NASA-grade birth charts
  Daily readings in 8 languages
  Free chart reading below
  ```
- **Profile picture:** Same OA monogram as TikTok
- **Link:** Same Linktree
- **Contact:** email button (olivia@olivia-arcana.com)
- **Category:** Personal Blog or Astrologer

**Story Highlights (5 permanent, custom covers):**

| Highlight | Icon | Content |
|-----------|------|---------|
| Daily | Crescent moon | Best daily horoscope Stories (rotate weekly) |
| Tarot | Tarot card | Tarot card of the day Stories |
| VIP | Star | VIP benefit previews, sample readings |
| Transits | Planet orbit | Transit alert Stories, retrograde info |
| About | OA monogram | Brand intro, how Olivia works, testimonials |

### 14.3 YouTube Channel

**Setup:**
- Channel name: Olivia Arcana
- Handle: @oliviaarcana
- Category: Education > Astrology
- Channel art: Celestial Noir themed banner (2560x1440)
- Description: SEO-optimized with keywords

**Description template:**
```
Olivia Arcana — Your personal astrologer. Daily horoscopes calculated from
real NASA planetary data (JPL DE440 Ephemeris), not templates.

Get your FREE birth chart reading:
Telegram: t.me/OliviaArcanaBot
Website: olivia-arcana.netlify.app

Daily readings for all 12 zodiac signs.
Transit alerts, compatibility analysis, and personalized guidance.

#astrology #horoscope #zodiac #birthchart
```

### 14.4 Linktree Configuration

**Plan:** Linktree Pro ($5/mo) for analytics + custom branding

**Appearance:**
- Theme: Custom dark (#0D0D1A background, #D4AF37 gold accents)
- Profile photo: OA monogram
- Title: "Olivia Arcana"
- Bio: "Your cosmic guide"

**Links (in order):**

| # | Title | URL | Tracking |
|---|-------|-----|----------|
| 1 | Get Your FREE Birth Chart | `t.me/OliviaArcanaBot?start=linktree` | Primary CTA |
| 2 | Explore Your Stars (Website) | `olivia-arcana.netlify.app?utm_source=linktree` | Website traffic |
| 3 | Daily Horoscope Channel | `t.me/OliviaArcanaDaily` | Channel growth |
| 4 | Follow on TikTok | `tiktok.com/@oliviaarcana` | Cross-platform |
| 5 | Follow on Instagram | `instagram.com/oliviaarcana` | Cross-platform |

---

## 15. Engagement Playbook

### 15.1 Comment Strategy (All Platforms)

**Daily time investment:** 20-30 minutes total

| Platform | Action | Frequency | Olivia's Voice |
|----------|--------|-----------|---------------|
| TikTok | Reply to top 5 comments per video | After each post | Warm, mystical, slightly teasing |
| Instagram | Reply to every comment in first hour | After each feed post | Same, but more intimate |
| YouTube | Reply to top 3 comments | Daily batch | Informative, authoritative |

**Comment reply templates (as Olivia):**

*When someone says "This is SO accurate":*
"The stars don't lie, dear. But this is just a glimpse — your full chart tells the complete story."

*When someone tags a friend:*
"Oh, tell them to check their chart. I have a feeling they need to hear this today."

*When someone asks "What about [other sign]?":*
"That one's coming tomorrow. Follow so you don't miss it."

*When someone is skeptical:*
"I use NASA's own planetary data, not templates. But I understand — the stars reveal themselves when you're ready."

### 15.2 Pinned Comment Strategy

Pin a comment on EVERY TikTok and Instagram Reel:

**Standard pinned comment:**
"Get your FREE personal birth chart reading: link in bio"

**Engagement pinned comment (alternate):**
"Comment your sign and I'll tell you what the stars say for you today"

### 15.3 Instagram Story Engagement

| Feature | Usage | Frequency |
|---------|-------|-----------|
| Polls | "Which sign is having the BEST week?" (4 sign options) | 2-3/week |
| Questions | "Ask Olivia anything about your chart" | 1-2/week |
| Quizzes | "What element is Scorpio?" (Water/Fire/Earth/Air) | 1/week |
| Emoji slider | "How accurate was today's reading?" (star emoji) | Daily |
| Countdown | Countdown to next eclipse/retrograde/new moon | As needed |
| Add Yours | "Share your Big 3" sticker template | Monthly |

### 15.4 DM Automation

**Instagram DMs:** Set up auto-reply:
"Hey! Thanks for reaching out. For your personal birth chart reading, visit the link in my bio — Olivia will calculate your chart instantly."

**TikTok DMs:** Same auto-reply structure.

---

## 16. Growth Tactics

### 16.1 Organic Growth (Month 1-2, $0 spend)

**TikTok-specific:**
1. Post consistently at same times daily (trains algorithm)
2. Use trending sounds on weekly skits (algorithm boost)
3. Duet trending astrology creators
4. Stitch trending zodiac content with Olivia's take
5. Create "duet bait": "Duet this with YOUR sign's reaction"
6. Reply to comments with video ("Someone asked about Scorpio Rising...")
7. Join TikTok creator groups for cross-promotion

**Instagram-specific:**
1. Collaborate with astrology accounts via Collab posts (shared reach)
2. Feature user-generated chart cards in Stories (weekly)
3. Run "Feature Friday" — repost best user chart cards
4. Use Explore page targeting via hashtags + geotags
5. Engage genuinely with 5-10 accounts daily in astrology niche

**YouTube-specific:**
1. SEO-optimize titles: "Scorpio Daily Horoscope April 7 2026"
2. Use Shorts shelf for discovery
3. Community tab polls for engagement
4. Consistent daily Shorts uploads

**Cross-platform:**
1. Every TikTok → IG Reel → YT Short (maximize each piece of content)
2. Every Telegram channel post → IG Story card
3. Website content → Social media snippets
4. Bot-generated content → Social media templates

### 16.2 Paid Growth (Month 3+)

| Channel | Monthly Budget | Tactic | Expected ROI |
|---------|---------------|--------|-------------|
| TikTok Spark Ads | $50-100 | Boost top-performing organic videos | 5K-20K additional views → 50-200 bot signups |
| Instagram boost | $30-50 | Boost best carousel/reel | 2K-10K additional reach |
| Direct channel buys | $100-200 | Sponsored posts in astrology Telegram channels | 100-500 new subs, $0.50-2/sub |
| **Total** | **$180-350** | | |

**Rule:** Never spend more than 50% of last month's revenue on ads.

### 16.3 Viral Loops (Built into Product)

These features in the Telegram bot generate organic social media content:

| Feature | Viral Mechanic | Social Media Output |
|---------|---------------|-------------------|
| **Compatibility Link** | Partner MUST use bot to complete reading | Screenshots of results → IG Stories/TikTok |
| **Birth Chart Card** | Beautiful 1080x1080 shareable image | Users post on IG/TikTok/dating apps with OA branding |
| **Zodiac Roast** | Brutally accurate roasts are screenshot bait | "Look what Olivia said about me" → shares |
| **Celebrity Lookup** | "I'm 87% compatible with Harry Styles" | Irresistible social media content |
| **Referral System** | Both referrer + new user get free reading | Direct link sharing in DMs |

---

## 17. UGC & Viral Loop Integration

### 17.1 Birth Chart Card → Social Media Loop

```
User requests chart card via Telegram bot (/card)
    ↓
Bot generates beautiful 1080x1080 image:
    - User's name
    - Sun + Moon + Rising signs with glyphs
    - Dominant element
    - Claude-generated "cosmic tagline"
    - Olivia Arcana branding (watermark + URL)
    ↓
User shares on:
    - Instagram Stories (with @oliviaarcana tag)
    - Instagram Feed
    - TikTok (screenshot or video reaction)
    - Dating apps (Tinder, Hinge, Bumble bio)
    - WhatsApp / Telegram group chats
    ↓
Friends see the card → "Where did you get this?" → Link in image/tag
    ↓
New user activates bot → Cycle repeats
```

**Target:** 30-40% of users generate and share their card.
**Each shared card reaches 50-500 people.**

### 17.2 Roast → TikTok Content Loop

```
User gets roasted by Olivia (/roast command)
    ↓
Roast is SO accurate it's screenshot-worthy
    ↓
User shares screenshot to:
    - TikTok: "POV: Olivia just read me for filth"
    - IG Stories: with shocked reaction
    - Group chats: "you NEED to see what she said about Geminis"
    ↓
Viewers ask "Who is Olivia?" → Find @oliviaarcana → Follow → Bot
    ↓
TikTok content opportunity:
    Film REACTIONS to Olivia's roasts → viral format
```

### 17.3 Compatibility → Dual Acquisition Loop

```
User A requests compatibility reading
    ↓
Bot generates unique link: t.me/OliviaArcanaBot?start=match_abc123
    ↓
User A sends link to User B (partner/crush/friend)
    ↓
User B MUST open bot and provide birth data
    = 1 GUARANTEED new user per compatibility request
    ↓
Both users receive dramatic synastry reveal
    ↓
Both users screenshot results → Share on social media
    = Organic advertising with OA branding
    ↓
Viral coefficient: 1.5-2.5x per request
```

### 17.4 Content From UGC (Feeding Social Media)

| UGC Source | Social Media Use |
|-----------|-----------------|
| Shared chart cards | "Feature Friday" — repost on IG Stories |
| Roast screenshots | Reaction compilations on TikTok |
| Compatibility results | "Best compatibility this week" TikTok |
| User questions (Ask Olivia) | "Someone asked about..." response videos |
| Testimonials | Social proof posts on IG Feed |
| Group chat results | "This group's chart analysis was WILD" TikTok |

---

## 18. Analytics & KPIs

### 18.1 Daily Metrics (5-minute daily check)

| Metric | Platform | Target | Action if Below |
|--------|----------|--------|-----------------|
| Views per TikTok (4-hour mark) | TikTok Analytics | >1,000 | Hook isn't working → test different format |
| Average watch time | TikTok Analytics | >50% of duration | Content too long or boring in middle |
| Profile visits from videos | TikTok Analytics | >2% of views | CTA needs strengthening |
| IG Story views | Instagram Insights | >5% of followers | Content or timing issue |
| Bot /start activations | Bot DB | >3/day | CTA not converting → test different messaging |

### 18.2 Weekly Metrics (Monday morning review)

| Metric | Target (Month 1) | Target (Month 3) | Target (Month 6) |
|--------|-------------------|-------------------|-------------------|
| TikTok weekly views | 50,000 | 500,000 | 2,000,000 |
| TikTok new followers | 200 | 2,000 | 5,000 |
| Instagram reach | 5,000 | 50,000 | 200,000 |
| Instagram new followers | 50 | 500 | 2,000 |
| YouTube Shorts views | 10,000 | 100,000 | 500,000 |
| Linktree link clicks | 50 | 500 | 2,000 |
| Bot signups from social | 20 | 200 | 800 |
| Website visits from social | 30 | 300 | 1,200 |
| VIP conversions from social | 1-2 | 10-20 | 40-80 |

### 18.3 Monthly Dashboard

| KPI | Formula | Month 3 Target | Month 6 Target |
|-----|---------|---------------|----------------|
| Total followers (all platforms) | TT + IG + YT combined | 7,000 | 60,000 |
| Total monthly views | All platforms combined | 2,000,000 | 10,000,000 |
| Social → Bot conversion rate | Bot signups / link clicks | >20% | >25% |
| Social → Website conversion rate | Site visits / link clicks | >15% | >20% |
| Cost per acquisition (social → VIP) | Ad spend / VIP from social | <$5 | <$3 |
| Social content ROI | Revenue from social users / content cost | >3x | >10x |

### 18.4 Content Performance Tracking

Track per content TYPE across all platforms:

| Content Type | Key Metric | What to Optimize |
|-------------|-----------|-----------------|
| Daily zodiac | Views, watch time | Hook effectiveness |
| Roasts | Shares, comments | Humor + accuracy balance |
| Compatibility | Profile visits, link clicks | CTA + emotional stakes |
| Celebrity | Views, shares | Timing (trending relevance) |
| Carousels (IG) | Saves, shares | Topic selection, slide design |
| Story cards (IG) | Views, replies | Design, text length |

**Weekly content audit:**
- Which sign's daily clips performed best? (Adjust hook style)
- Which skit format got most shares? (Double down)
- Which hook category converted best? (Prioritize)
- Which posting time got most reach? (Adjust schedule)

---

## 19. Budget & Cost Structure

### 19.1 Monthly Costs

| Service | Plan | Monthly Cost | What It Does |
|---------|------|-------------|-------------|
| **Claude API** | Pay-per-use | ~$20-30 | Script generation (400+ scripts/mo) |
| **ElevenLabs** | Starter ($5) or Creator ($22) | $5-22 | Voiceover audio. Starter = 30K chars (200 clips) |
| **CapCut Pro** | Pro plan | $8 | Template-based video editing, batch processing |
| **Linktree Pro** | Pro plan | $5 | Link-in-bio with analytics |
| **Buffer** or **Later** | Starter plan | $15-25 | Cross-platform scheduling |
| **HeyGen** | Creator plan (optional) | $29 | AI avatar for weekly skits only |
| **Canva Pro** (optional) | Pro plan | $13 | Carousel/image design |

| Budget Tier | Monthly Total | Includes |
|------------|-------------|----------|
| **Minimal** | **$53-90** | Daily clips only (Claude + ElevenLabs Starter + CapCut + Linktree + Buffer) |
| **Standard** | **$90-130** | Daily + weekly skits (add HeyGen for avatar content) |
| **Full** | **$130-180** | All content types (add Canva Pro for carousels) |

### 19.2 Per-Video Cost Breakdown

| Component | Cost per Daily Clip | Cost per Weekly Skit |
|-----------|-------------------|---------------------|
| Script (Claude API) | $0.04-0.06 | $0.06-0.10 |
| Voiceover (ElevenLabs) | $0.01-0.05 | $0.05-0.10 |
| Video (CapCut) | ~$0.02 | ~$0.05 |
| **Total per video** | **~$0.07-0.13** | **~$0.16-0.25** |

**Monthly video cost at scale:**
- 400 daily clips × $0.10 = $40
- 16 weekly skits × $0.20 = $3.20
- **Total content production: ~$43/month**

### 19.3 Revenue vs Cost Projection

| Month | Content Cost | Ad Spend | Total Cost | Revenue | Profit |
|-------|------------|----------|-----------|---------|--------|
| 1 | $90 | $0 | $90 | $163 | $73 |
| 3 | $120 | $150 | $270 | $975 | $705 |
| 6 | $150 | $300 | $450 | $4,875 | $4,425 |
| 12 | $180 | $600 | $780 | $16,250 | $15,470 |

---

## 20. Technical Implementation

### 20.1 Project Structure

```
social-media-pipeline/
├── scripts/
│   ├── compute_transits.py          -- kerykeion: today's transits → JSON
│   ├── generate_scripts.py          -- Claude API: transit data → 12+ scripts
│   ├── generate_audio.py            -- ElevenLabs API: scripts → MP3 files
│   ├── generate_video.py            -- CapCut/FFmpeg: audio + template → MP4
│   ├── add_captions.py              -- Whisper: audio → word timestamps → burn-in
│   ├── generate_images.py           -- Pillow: scripts → Story/Feed cards (PNG)
│   ├── generate_carousel.py         -- Pillow: weekly content → carousel slides
│   ├── post_tiktok.py               -- TikTok API: upload + schedule
│   ├── post_instagram.py            -- Meta Business Suite API: Stories + Reels + Feed
│   ├── post_youtube.py              -- YouTube Data API: upload Shorts
│   ├── post_telegram.py             -- Bot API: channel posts
│   ├── daily_pipeline.py            -- Orchestrator: runs all steps in sequence
│   └── weekly_skit_pipeline.py      -- Weekly skit generation orchestrator
├── templates/
│   ├── video/
│   │   ├── daily_zodiac/            -- 12 CapCut templates (by element)
│   │   ├── roast/                   -- Roast video template
│   │   └── compatibility/           -- Split-screen template
│   ├── image/
│   │   ├── story_daily.py           -- 1080x1920 Story template (Pillow)
│   │   ├── card_daily.py            -- 1080x1080 feed card template
│   │   ├── carousel_slide.py        -- 1080x1080 carousel slide template
│   │   └── weekly_weather.py        -- 1080x1350 infographic template
│   └── video_bg/
│       ├── fire_signs_bg.mp4        -- Pre-rendered 30s loop (Aries, Leo, Sagittarius)
│       ├── earth_signs_bg.mp4       -- Pre-rendered 30s loop (Taurus, Virgo, Capricorn)
│       ├── air_signs_bg.mp4         -- Pre-rendered 30s loop (Gemini, Libra, Aquarius)
│       └── water_signs_bg.mp4       -- Pre-rendered 30s loop (Cancer, Scorpio, Pisces)
├── prompts/
│   ├── daily_script.txt             -- Claude prompt: daily zodiac scripts
│   ├── roast_script.txt             -- Claude prompt: zodiac roasts
│   ├── celebrity_script.txt         -- Claude prompt: celebrity breakdowns
│   ├── compatibility_script.txt     -- Claude prompt: compatibility duets
│   ├── relatable_script.txt         -- Claude prompt: "What your sign does when..."
│   ├── story_text.txt               -- Claude prompt: Story card texts
│   └── carousel_text.txt            -- Claude prompt: carousel slide content
├── fonts/
│   ├── PlayfairDisplay-Bold.ttf
│   ├── Inter-Regular.ttf
│   ├── Inter-Bold.ttf
│   └── CormorantGaramond-Medium.ttf
├── assets/
│   ├── zodiac_glyphs/               -- 12 zodiac glyph PNGs (gold on transparent)
│   ├── backgrounds/                 -- Dark nebula textures for images
│   ├── elements/                    -- Stars, dividers, borders
│   └── oa_logo.png                  -- Olivia Arcana watermark
├── output/
│   └── YYYY-MM-DD/                  -- Daily output directory
│       ├── videos/                  -- MP4 files
│       ├── stories/                 -- Story card PNGs
│       ├── feed/                    -- Feed card PNGs
│       ├── carousel/                -- Carousel slide PNGs
│       └── audio/                   -- MP3 voiceover files
├── config.py                         -- API keys, voice IDs, template IDs
├── requirements.txt                  -- Python dependencies
└── README.md                         -- Setup instructions
```

### 20.2 Configuration

```python
# config.py
import os

# API Keys
CLAUDE_API_KEY = os.environ["ANTHROPIC_API_KEY"]
ELEVENLABS_API_KEY = os.environ["ELEVENLABS_API_KEY"]
TIKTOK_ACCESS_TOKEN = os.environ.get("TIKTOK_ACCESS_TOKEN")

# ElevenLabs
OLIVIA_VOICE_ID = "..."  # Custom cloned voice or selected preset
VOICE_SETTINGS = {
    "stability": 0.6,
    "similarity_boost": 0.8,
    "style": 0.3,
}

# Posting
TIKTOK_USERNAME = "oliviaarcana"
INSTAGRAM_ACCOUNT_ID = "..."
YOUTUBE_CHANNEL_ID = "..."
TELEGRAM_CHANNEL = "@OliviaArcanaDaily"
TELEGRAM_BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]

# Linktree
LINKTREE_URL = "https://linktr.ee/oliviaarcana"
WEBSITE_URL = "https://olivia-arcana.netlify.app"
BOT_URL = "https://t.me/OliviaArcanaBot"

# Design
COLORS = {
    "void_black": "#0D0D1A",
    "deep_cosmos": "#1A1A3E",
    "celestial_gold": "#D4AF37",
    "slate_blue": "#7B68EE",
    "warm_ivory": "#F5F0E8",
    "muted_lavender": "#9B96A8",
    "cosmic_teal": "#4ECDC4",
    "mars_red": "#E8524A",
}
```

### 20.3 Orchestrator Script

```python
# scripts/daily_pipeline.py
"""
Master orchestrator. Run daily at 04:00 UTC via cron.

crontab entry:
0 4 * * * cd /path/to/social-media-pipeline && python scripts/daily_pipeline.py
"""
import asyncio
from datetime import date

from compute_transits import get_daily_transits
from generate_scripts import generate_all_scripts
from generate_audio import generate_all_audio
from generate_video import generate_all_videos
from add_captions import add_captions_to_all
from generate_images import generate_story_cards, generate_feed_cards
from post_telegram import post_to_channels
from post_tiktok import schedule_tiktok_posts
from post_instagram import upload_stories, schedule_reels, schedule_feed
from post_youtube import upload_shorts

async def run_daily_pipeline():
    today = date.today().isoformat()
    print(f"[{today}] Starting daily content pipeline...")

    # Step 1: Transits
    transits, sign_impacts = get_daily_transits()

    # Step 2: Scripts (Claude API)
    scripts = await generate_all_scripts(transits, sign_impacts)

    # Step 3: Audio (ElevenLabs) + Images (Pillow) — in parallel
    audio_files, story_cards, feed_cards = await asyncio.gather(
        generate_all_audio(scripts["tiktok"]),
        generate_story_cards(scripts["stories"]),
        generate_feed_cards(scripts["feed"]),
    )

    # Step 4: Videos (CapCut/FFmpeg)
    video_files = await generate_all_videos(audio_files, scripts["tiktok"])

    # Step 5: Captions
    captioned_videos = await add_captions_to_all(video_files, audio_files)

    # Step 6: Distribute — in parallel
    await asyncio.gather(
        post_to_channels(scripts["telegram"]),
        upload_stories(story_cards),
        schedule_tiktok_posts(captioned_videos),
        schedule_reels(captioned_videos[:3]),   # Top 3 as Reels
        upload_shorts(captioned_videos[:3]),      # Top 3 as Shorts
    )

    print(f"[{today}] Pipeline complete. {len(captioned_videos)} videos, "
          f"{len(story_cards)} stories, {len(feed_cards)} feed cards generated.")

if __name__ == "__main__":
    asyncio.run(run_daily_pipeline())
```

### 20.4 Deployment

**Option A: VPS Cron (Recommended)**
Run on the existing Njalla VPS that hosts the Telegram bot.

```bash
# crontab -e
# Daily pipeline at 04:00 UTC
0 4 * * * cd /opt/social-media-pipeline && /usr/bin/python3 scripts/daily_pipeline.py >> /var/log/social-pipeline.log 2>&1

# Weekly skit pipeline at 03:00 UTC on Mondays
0 3 * * 1 cd /opt/social-media-pipeline && /usr/bin/python3 scripts/weekly_skit_pipeline.py >> /var/log/social-pipeline.log 2>&1
```

**Option B: GitHub Actions (Free alternative)**
Use GitHub Actions scheduled workflow. Free tier includes 2,000 minutes/month.

---

## 21. 30-60-90 Day Launch Plan

### Days 1-7: Foundation

- [ ] Create TikTok account (@oliviaarcana)
- [ ] Create Instagram account (@oliviaarcana)
- [ ] Create YouTube channel (Olivia Arcana)
- [ ] Set up Linktree with branded theme + links
- [ ] Install fonts + design assets
- [ ] Create 4 video background loops (fire/earth/air/water elements)
- [ ] Write and test Claude prompts for all 7 content types
- [ ] Set up ElevenLabs with "Olivia" voice
- [ ] Create Pillow templates for Story cards (1080x1920) and Feed cards (1080x1080)
- [ ] Build `daily_pipeline.py` orchestrator (Steps 1-5)
- [ ] Generate first batch of 12 daily zodiac videos manually
- [ ] Post first 3 days of content manually to establish rhythm

### Days 8-14: Automation

- [ ] Complete TikTok posting automation (TikTok API or Later.com)
- [ ] Complete Instagram posting automation (Meta Business Suite or Buffer)
- [ ] Complete YouTube Shorts upload automation
- [ ] Set up daily cron job on VPS
- [ ] Generate first zodiac roast video
- [ ] Generate first compatibility duet video
- [ ] Generate first carousel for Instagram
- [ ] Begin daily posting at full cadence (12 TikTok + Stories + Reels)

### Days 15-30: Rhythm + Optimization

- [ ] Full daily pipeline running automatically
- [ ] Weekly skit pipeline running (Monday roast, Wednesday celebrity, etc.)
- [ ] First cross-promotion outreach (DM 10 astrology channel admins)
- [ ] Join 10 astrology Telegram groups, provide value
- [ ] Submit to 5 Telegram directories
- [ ] Review first 2 weeks of analytics
- [ ] A/B test hooks: fear vs curiosity vs identity (which gets most views?)
- [ ] A/B test CTAs: "Follow" vs "Link in bio" vs "Comment your sign"
- [ ] A/B test posting times: adjust based on analytics
- [ ] Hit milestone: 500 TikTok followers, 200 IG followers

### Days 31-60: Growth

- [ ] Optimize based on Week 1-4 data: double down on winning formats
- [ ] Start Instagram carousel series (weekly educational content)
- [ ] Start monthly YouTube forecast (long-form, 10-15 minutes per sign)
- [ ] First paid boost: $50 on top-performing TikTok video
- [ ] First Telegram channel buy: $100 for sponsored posts
- [ ] Launch referral tracking in bot (social media → bot conversion data)
- [ ] Enable birth chart card sharing (UGC engine)
- [ ] Enable zodiac roast sharing (viral engine)
- [ ] Hit milestone: 3,000 TikTok followers, 1,000 IG followers
- [ ] Hit milestone: 200 Telegram signups from social media

### Days 61-90: Scale

- [ ] 90 days of consistent daily content
- [ ] All automation running reliably
- [ ] Content performance data sufficient for optimization
- [ ] Paid ads: $150-300/month across TikTok boost + channel buys
- [ ] Launch multi-language TikTok content (Ukrainian, Russian)
- [ ] Celebrity chart content timed to trending moments
- [ ] Transit alert content for major astrological events
- [ ] Monthly content performance review + strategy adjustment
- [ ] Hit milestone: 7,000 TikTok followers, 3,000 IG, 1,000 YT
- [ ] Hit milestone: $975/month revenue from social media funnel

---

## 22. Content Calendar Templates

### Weekly Template

| Day | TikTok (12 daily + skit) | IG Stories | IG Reels | IG Feed | YT Shorts | Telegram |
|-----|--------------------------|------------|----------|---------|-----------|----------|
| Mon | 12 daily + **Zodiac Roast** | 12 cards + tarot + poll | Roast cross-post | Weekly weather carousel | 2-3 shorts | 12 zodiac + tarot |
| Tue | 12 daily + **Compatibility** | 12 cards + tarot + quiz | Compat cross-post | — | 2-3 shorts | 12 zodiac + tarot |
| Wed | 12 daily + **Celebrity** | 12 cards + tarot + Q&A | Celebrity cross-post | Educational carousel | 2-3 shorts | 12 zodiac + tarot + deep content |
| Thu | 12 daily + **Relatable** | 12 cards + tarot + poll | Relatable cross-post | — | 2-3 shorts | 12 zodiac + tarot + VIP sample |
| Fri | 12 daily + **Birth chart** | 12 cards + tarot + countdown | Reveal cross-post | Aesthetic brand post | 2-3 shorts | 12 zodiac + tarot + Q&A |
| Sat | 12 daily + banked | 12 cards + tarot | Banked | — | 2-3 shorts | 12 zodiac + tarot + weekend energy |
| Sun | 12 daily + **Week preview** | 12 cards + tarot + "Add Yours" | Preview cross-post | Week-ahead carousel | 2-3 shorts | 12 zodiac + tarot + week preview |

### Monthly Calendar (Example: April 2026)

**Key astrological events this month:**
- Aries season continues (new beginnings energy)
- Mercury retrograde recovery period
- New Moon in Aries (April 12)
- Full Moon in Scorpio (April 27)

**Special content tied to events:**

| Date | Event | Special Content |
|------|-------|----------------|
| Apr 8-12 | Pre-new moon | "5 things to manifest before the New Moon" carousel |
| Apr 12 | New Moon in Aries | "New Moon Ritual for YOUR sign" TikTok series (12 videos) |
| Apr 15 | Tax day (US) | "What your sign does with their tax refund" relatable content |
| Apr 22-27 | Pre-full moon | "Full Moon in Scorpio will EXPOSE these 3 signs" fear hook series |
| Apr 27 | Full Moon in Scorpio | "Full Moon Release Ritual" content across all platforms |

---

## 23. Reference Documents

| Document | Path | Contains |
|----------|------|----------|
| TikTok Handoff | `handoffs/HANDOFF_TIKTOK.md` | TikTok-specific pipeline, hooks, account setup, scripts |
| Instagram Handoff | `handoffs/HANDOFF_INSTAGRAM.md` | IG-specific pipeline, visual templates, engagement strategy |
| Website Handoff | `handoffs/HANDOFF_WEBSITE.md` | Next.js + Three.js website architecture, WebGL pipeline |
| Business Architecture | `docs/BUSINESS_ARCHITECTURE.md` | Revenue model, pricing, unit economics, launch phases |
| Growth Playbook | `docs/GROWTH_PLAYBOOK.md` | Daily/weekly/monthly routines, KPIs, paid strategy |
| Viral Features | `docs/VIRAL_FEATURES.md` | 7 viral feature concepts for organic sharing |
| Design System | `docs/DESIGN_SYSTEM.md` | Celestial Noir palette, typography, visual rules |
| Asset Specifications | `docs/ASSET_SPECIFICATIONS.md` | 14 marketing asset templates with exact dimensions |
| Session Handoff V3 | `SESSION_HANDOFF_V3.md` | Latest website development state |
| **This Document** | `docs/SOCIAL_MEDIA_CONTENT_PIPELINE.md` | **Master pipeline for all social media content** |

---

## Appendix A: Brand Voice Quick Reference

**Olivia's personality:**
- Warm, mystical, empowering
- Speaks with cosmic authority but personal intimacy
- "Dear soul" not "Hey guys"
- "The stars suggest" not "This WILL happen"
- Never condescending about skeptics
- Sharp humor in roasts, always loving underneath
- References real planetary data, never generic

**Visual identity:**
- Celestial Noir palette (#0D0D1A background, #D4AF37 gold accents)
- Fonts: Playfair Display (headlines), Inter (body), Cormorant Garamond (labels)
- 1px gold borders, subtle star elements, no bright/neon colors
- Never looks like a Canva default template
- No stock photos of people — cosmic imagery only

---

## Appendix B: Quick Start Checklist

For the first person/session implementing this pipeline:

1. [ ] `pip install anthropic elevenlabs pillow openai-whisper`
2. [ ] Set environment variables: `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`
3. [ ] Download fonts to `fonts/` directory
4. [ ] Create zodiac glyph PNGs in `assets/zodiac_glyphs/`
5. [ ] Build the 4 element-themed video background loops
6. [ ] Test `compute_transits.py` → verify transit data output
7. [ ] Test `generate_scripts.py` → verify Claude generates all 12 scripts
8. [ ] Test `generate_audio.py` → verify ElevenLabs produces 12 MP3s
9. [ ] Test `generate_images.py` → verify Pillow produces 24 PNG cards
10. [ ] Test `generate_video.py` → verify 12 captioned MP4s
11. [ ] Create all social media accounts
12. [ ] Configure Linktree
13. [ ] Post first batch manually → verify everything looks correct
14. [ ] Set up cron job → verify daily automation
15. [ ] Monitor for 3 days → fix any issues
16. [ ] Begin weekly skit production
17. [ ] Start engagement routine (15-20 min/day)

---

*This pipeline produces ~230 pieces of content per week across 4 platforms, all from a single daily transit computation, for under $180/month. Every piece drives traffic to olivia-arcana.netlify.app and t.me/OliviaArcanaBot.*
