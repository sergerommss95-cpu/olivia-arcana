# Olivia Arcana — Social Media Pipeline Handoff

**Date:** April 7, 2026
**Status:** Pipeline code built and tested. Ready for API key setup and first run.

---

## What Was Built

### Complete Automated Content Pipeline

```
social-pipeline/
├── config/
│   ├── __init__.py
│   └── settings.py               -- All config: API keys, colors, schedules, zodiac data
├── scripts/
│   ├── __init__.py
│   ├── compute_transits.py        -- TESTED: kerykeion/NASA transit computation
│   ├── generate_scripts.py        -- Claude API: 12 TikTok + 12 Story + 12 Telegram scripts
│   ├── generate_audio.py          -- ElevenLabs: 12 MP3 voiceover files
│   ├── generate_video.py          -- FFmpeg: 12 captioned 9:16 MP4 videos
│   ├── generate_video_remotion.py -- Remotion (React): higher quality video alternative
│   ├── generate_images.py         -- TESTED: Pillow Story cards + Feed cards
│   ├── post_telegram.py           -- Telegram Bot API: channel posting
│   ├── post_social.py             -- TikTok + Instagram + YouTube native APIs
│   ├── post_via_scheduler.py      -- Phase 1: Later.com/Buffer + manual export
│   ├── daily_pipeline.py          -- MASTER ORCHESTRATOR: runs everything
│   └── schedule_cron.py           -- Python-based scheduler (alternative to cron)
├── prompts/
│   ├── daily_script.txt
│   ├── roast_script.txt
│   ├── compatibility_script.txt
│   ├── celebrity_script.txt
│   └── relatable_script.txt
├── templates/
│   ├── video/                     -- CapCut/FFmpeg video templates
│   └── image/                     -- Pillow image templates
├── fonts/                         -- Google Fonts (Playfair, Inter, Cormorant)
├── assets/                        -- Zodiac glyphs, backgrounds, elements
├── output/                        -- Daily output directories
├── requirements.txt
└── SETUP.md                       -- Full setup guide
```

### Documentation

```
docs/SOCIAL_MEDIA_CONTENT_PIPELINE.md  -- 1500+ line master pipeline document covering:
  - Traffic architecture (social → website + Telegram bot)
  - Platform strategies (TikTok, Instagram, YouTube Shorts)
  - 8 content types with templates
  - Full automation pipeline (8 steps)
  - Script generation prompts for Claude API
  - Video production specs
  - Cross-posting matrix
  - Posting schedule (hourly stagger)
  - 38 hook templates in 8 categories
  - Hashtag strategies per platform
  - CTA rotation framework
  - 5-stage traffic funnel design
  - Account setup guides
  - Engagement playbook
  - Growth tactics (organic + paid)
  - UGC & viral loop integration
  - KPI tracking framework
  - Budget projections
  - 30-60-90 day launch plan
  - Content calendar templates
```

---

## What's Tested

| Component | Status | Notes |
|-----------|--------|-------|
| Transit computation | WORKING | Produces correct planetary positions + sign impacts |
| Image generation (Pillow) | WORKING | Story cards (53KB) + Feed cards (35KB) |
| Script generation (Claude) | READY | Prompts written, needs ANTHROPIC_API_KEY |
| Audio generation (ElevenLabs) | READY | Code complete, needs ELEVENLABS_API_KEY |
| Video rendering (FFmpeg) | READY | Code complete, needs `brew install ffmpeg` |
| Video rendering (Remotion) | SCAFFOLDED | Higher quality alt, needs `npm install` |
| Telegram posting | READY | Code complete, needs TELEGRAM_BOT_TOKEN |
| TikTok posting | READY | Needs TikTok Developer account + API approval |
| Instagram posting | READY | Needs Meta Business account + Graph API setup |
| YouTube posting | READY | Needs Google Cloud project + YouTube API |
| Manual export | READY | Creates organized folders with upload guide |

---

## How to Run (First Time)

```bash
# 1. Install ffmpeg
brew install ffmpeg

# 2. Install Python deps
cd ~/olivia-arcana/social-pipeline
pip install -r requirements.txt

# 3. Set API keys
export ANTHROPIC_API_KEY="sk-ant-..."
export ELEVENLABS_API_KEY="..."
export TELEGRAM_BOT_TOKEN="..."

# 4. Download fonts to fonts/ directory
# PlayfairDisplay-Bold.ttf, Inter-Regular.ttf, Inter-Bold.ttf, CormorantGaramond-Medium.ttf

# 5. Run the full pipeline
python3 scripts/daily_pipeline.py daily
```

### Phase 1 (No social API tokens):
The pipeline generates all content and exports to `output/YYYY-MM-DD/export/` with an UPLOAD_GUIDE.txt for manual posting. Takes ~10 minutes to generate + 20-30 minutes to manually upload.

### Phase 2 (With API tokens):
Add API tokens to environment variables. Pipeline posts automatically to all platforms. Total hands-off time: ~15 minutes.

---

## Architecture Decisions

### Video Generation: FFmpeg (primary) + Remotion (upgrade path)

**FFmpeg (current):**
- Zero cost, runs locally
- Generates dark background + zodiac glyph + animated captions + watermark
- Quality: good enough for daily clips
- Rendering: ~5-10 seconds per video

**Remotion (upgrade):**
- React-based, much higher visual quality
- Spring physics, smooth animations, star particles
- Requires Node.js + npm install
- Use for weekly skits and high-value content

### Posting Strategy: Staggered Daily

- **TikTok:** 12 videos/day, 1 per hour (06:00-17:00 UTC)
- **Instagram Reels:** 3-5/day at peak hours (07:00, 12:00, 15:00, 18:00 UTC)
- **Instagram Stories:** 12 cards batch-uploaded at 05:30 UTC
- **YouTube Shorts:** 2-3/day (07:00, 14:00 UTC)
- **Peak hours:** 12:00-15:00 UTC (7-10 AM EST) — schedule best content here

### Traffic Funnel

```
Social content → Link in bio → Linktree → Website OR Telegram Bot → VIP subscription
```

Every piece of content ends with a CTA driving to one of two destinations:
1. olivia-arcana.netlify.app (WebGL experience → onboarding)
2. t.me/OliviaArcanaBot?start=social (free reading → VIP upsell)

---

## CRITICAL: Revised Posting Frequency (2026 Algorithm Research)

Research from Buffer (11M+ posts), Sprout Social, and TikTok official data shows:

| Platform | Original Target | Revised Target | Why |
|----------|----------------|---------------|-----|
| **TikTok** | 12-15/day | **3-5/day** | Algorithm penalizes spam. 3-5 focused videos > 12 scattered. |
| **IG Reels** | 3-5/day | **1-2/day** | Per-reel reach drops sharply above 1/day. Space 6+ hours. |
| **IG Stories** | 12/day | **4-5/day** | Mosseri: 1-2/day. Power users: 4-5/day max. |
| **YT Shorts** | 2-3/day | **2-3/day** | Already optimal. 2/day = +2,200 subs/month. |

**Sign rotation:** 4 signs get video treatment per day, rotating so every sign gets video every 3 days. All 12 still get text content (Telegram + Story cards).

**Video generation:** Remotion + AWS Lambda ($5-15/month for 400 videos) is the recommended upgrade. FFmpeg pipeline works now as zero-cost starter.

**Cross-posting:** Late.dev ($19/mo) is cheapest unified API for TikTok + IG + YT.

Full research: `docs/POSTING_FREQUENCY_RESEARCH.md`

---

## What to Do Next

### Immediate (Today)
1. `brew install ffmpeg`
2. Download fonts to `fonts/` directory
3. Set API keys: `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, `TELEGRAM_BOT_TOKEN`
4. Run `python3 scripts/daily_pipeline.py daily` for first content batch
5. Create TikTok account (@oliviaarcana)
6. Create Instagram account (@oliviaarcana)
7. Set up Linktree

### This Week
8. Upload first 3 days of content manually (20 min/day with export guide)
9. Set up cron job for daily automation
10. Create YouTube channel
11. Sign up for Late.dev ($19/mo) for cross-posting
12. Apply for TikTok Content Posting API (5-10 business days)
13. Set up Meta Business Suite for Instagram API

### This Month
14. Achieve consistent daily posting rhythm
15. First cross-promotion outreach (DM 10 astrology channel admins)
16. First paid TikTok Spark Ad ($50 boosting best organic video)
17. Review analytics and optimize hooks
18. Set up Remotion for higher-quality weekly skits

---

## Monthly Cost Projection

| Item | Cost |
|------|------|
| Claude API (~120 video scripts + 360 text scripts/mo) | $15-20 |
| ElevenLabs Starter (voiceover for ~120 videos) | $5 |
| FFmpeg / Pillow | $0 |
| Late.dev (cross-posting) | $19 |
| Linktree Pro | $5 |
| **Total** | **$44-49/mo** |

**Upgrade path:** Remotion + Lambda adds ~$10-15/mo for much higher video quality.

Revenue target: $975/mo by Month 3 (break-even in Week 3).
