# Olivia Arcana — TikTok Content Pipeline Handoff

**Date:** April 6, 2026
**Status:** Not started. Pipeline designed, no content created yet.
**Goal:** 12 daily zodiac clips + 3-4 weekly skits, fully automated

---

## 1. Content Types

### Daily Content (12 per day)
| Type | Format | Duration | Frequency | Purpose |
|------|--------|----------|-----------|---------|
| Daily zodiac clips | AI voiceover + animated zodiac visual | 15-30s | 12/day (one per sign) | Reach + brand awareness |
| Tarot card reveal | Card flip animation + interpretation | 15-20s | 1/day | Mystique + engagement |

### Weekly Content (3-4 per week)
| Type | Format | Duration | Frequency | Purpose |
|------|--------|----------|-----------|---------|
| Zodiac roasts | Olivia roasting a sign with personality | 30-60s | 2/week | Viral shares |
| Birth chart reveals | "I looked up YOUR chart and..." | 30-45s | 2-3/week | Drive bot downloads |
| Celebrity breakdowns | "[Celebrity]'s chart explains everything" | 45-60s | 1-2/week | Algorithm boost |
| Compatibility duets | "Are [Sign A] and [Sign B] soulmates?" | 30-45s | 1-2/week | UGC trigger |
| Transit alerts | "Mercury retrograde hits YOUR sign" | 15-30s | As needed | Urgency + relevance |
| "What your sign does when..." | Relatable zodiac behavior | 15-30s | 2-3/week | Shares + identity |

---

## 2. Automation Pipeline

### Full Pipeline (End to End)

```
Step 1: Generate Scripts (Claude API)
  |
  Input: Today's transit data (kerykeion) + content type + sign
  Output: 15-60 second script with hook, body, CTA
  Tool: Claude API with custom prompt template
  Time: ~30 seconds per script
  |
Step 2: Generate Voiceover (ElevenLabs)
  |
  Input: Script text
  Output: MP3 audio file
  Voice: Custom "Olivia" voice (warm, mystical, feminine)
  Tool: ElevenLabs API (Text-to-Speech)
  Time: ~10 seconds per clip
  Cost: ~$0.03-0.08 per clip (depends on length)
  |
Step 3: Generate Video (HeyGen or CapCut)
  |
  Option A — HeyGen (AI avatar):
    Input: Audio file + avatar selection
    Output: MP4 with AI-generated talking head
    Time: ~2-5 minutes per clip
    Cost: ~$0.15-0.30 per clip
    Best for: Birth chart reveals, roasts, celebrity breakdowns
  |
  Option B — CapCut (template-based):
    Input: Audio file + zodiac visual template
    Output: MP4 with animated graphics + voiceover
    Time: ~1-2 minutes per clip (batch processing)
    Cost: Free (CapCut Pro subscription ~$8/mo)
    Best for: Daily zodiac clips, transit alerts, tarot reveals
  |
Step 4: Add Captions (CapCut or Whisper)
  |
  Tool: CapCut auto-captions or OpenAI Whisper
  Style: Bold white text, centered, 2-3 words at a time
  Time: ~30 seconds per clip
  |
Step 5: Post to TikTok (TikTok API or manual)
  |
  Option A — TikTok Content Posting API:
    Requires TikTok Developer account + app approval
    Rate limit: 20 posts per day
    Auto-scheduling supported
  |
  Option B — Manual posting via Android emulator:
    Use Android emulator (BlueStacks/LDPlayer)
    Upload via TikTok app
    Schedule with built-in TikTok scheduler
  |
  Option C — Third-party scheduler:
    Later.com or Buffer
    $15-25/mo for TikTok scheduling
    Handles cross-posting to Instagram Reels
```

### Daily Automation Schedule

```
04:00 UTC  Compute today's transits (kerykeion Python script)
04:05 UTC  Generate 12 daily zodiac scripts (Claude API, batch)
04:15 UTC  Generate 12 voiceover audio files (ElevenLabs API, batch)
04:30 UTC  Generate 12 video files (CapCut template batch or HeyGen)
05:00 UTC  Add captions to all 12 videos
05:30 UTC  Queue for staggered posting throughout the day
```

### Automation Script Structure

```
tiktok-pipeline/
  scripts/
    generate_scripts.py       -- Claude API: transit data -> 12 scripts
    generate_audio.py          -- ElevenLabs API: scripts -> MP3 files
    generate_video.py          -- HeyGen/CapCut API: audio + template -> MP4
    add_captions.py            -- Whisper transcription -> burn-in captions
    post_to_tiktok.py          -- TikTok API: upload + schedule
    daily_pipeline.py          -- Orchestrator: runs all steps in sequence
  templates/
    daily_zodiac.json          -- CapCut template config for daily clips
    roast.json                 -- Template for roast videos
    compatibility.json         -- Template for compatibility duets
  prompts/
    daily_script.txt           -- Claude prompt for daily zodiac scripts
    roast_script.txt           -- Claude prompt for roast scripts
    celebrity_script.txt       -- Claude prompt for celebrity breakdowns
  output/
    YYYY-MM-DD/                -- Daily output folder
      aries_daily.mp4
      taurus_daily.mp4
      ...
  config.py                    -- API keys, voice IDs, template IDs
```

---

## 3. Posting Schedule

### Daily Posting Times (staggered for maximum reach)

| Time (UTC) | Time (EST) | Content | Sign Focus |
|------------|------------|---------|------------|
| 06:00 | 01:00 AM | Daily zodiac | Aries |
| 07:00 | 02:00 AM | Daily zodiac | Taurus |
| 08:00 | 03:00 AM | Daily zodiac | Gemini |
| 09:00 | 04:00 AM | Daily zodiac | Cancer |
| 10:00 | 05:00 AM | Daily zodiac | Leo |
| 11:00 | 06:00 AM | Daily zodiac | Virgo |
| 12:00 | 07:00 AM | Daily zodiac + Weekly skit | Libra |
| 13:00 | 08:00 AM | Daily zodiac | Scorpio |
| 14:00 | 09:00 AM | Daily zodiac | Sagittarius |
| 15:00 | 10:00 AM | Daily zodiac + Afternoon skit | Capricorn |
| 16:00 | 11:00 AM | Daily zodiac | Aquarius |
| 17:00 | 12:00 PM | Daily zodiac | Pisces |

**Peak hours** (highest engagement): 12:00-15:00 UTC (7-10 AM EST). Schedule the best content here.

### Weekly Skit Schedule
| Day | Content Type | Notes |
|-----|-------------|-------|
| Monday | Zodiac roast | Most viral format, peak Monday engagement |
| Tuesday | Compatibility duet | "Are [Sign] and [Sign] soulmates?" |
| Wednesday | Celebrity chart breakdown | Trending celebrity = algorithm boost |
| Thursday | "What your sign does when..." | Relatable, shareable |
| Friday | Birth chart reveal | Drive weekend bot signups |
| Saturday | Batch content from bank | Pre-recorded, lighter tone |
| Sunday | Weekly preview | "Your week ahead: 3 signs need to watch out" |

---

## 4. Hook Templates (First 3 Seconds)

The first 3 seconds determine whether a viewer stays or scrolls. These patterns work for astrology content:

### Fear/Curiosity
- "If you're a [Sign], do NOT ignore this week's forecast..."
- "Something is about to happen to [3 signs] and nobody is talking about it."
- "I have bad news for [Sign]. The stars are NOT on your side today."

### Specificity
- "Born between [date range]? The stars have a WARNING for you."
- "If your birthday is in [month], you need to hear this right now."
- "Your [planet] placement reveals something most astrologers won't tell you."

### Identity
- "Things only a [Sign] would understand..."
- "POV: you're a [Sign] and you just found out [transit event]..."
- "Tell me your sign and I'll tell you your biggest flaw. Starting with [Sign]."

### Comparison
- "[Sign A] vs [Sign B] -- who's having the better month?"
- "I ranked all 12 signs from most to least [trait]. You're NOT ready."
- "The most compatible zodiac pairs, according to actual birth chart data."

### Authority
- "I calculated your EXACT planetary positions. Here's what I found for [Sign]."
- "Using real NASA data, here's why [Sign] is struggling right now."
- "Most horoscope apps won't tell you this about [transit]. Let me explain."

### FOMO
- "Everyone's talking about [transit event] but nobody is explaining HOW it affects YOU."
- "3 signs are about to have the best week of their LIFE. Is yours one of them?"
- "Mercury retrograde starts in [X days]. Here's what you need to do NOW."

### Reaction
- "I looked up my friend's birth chart and... I have questions."
- "When Olivia read my chart, I literally gasped. Here's what she said about [Sign]."

---

## 5. Hashtag Strategy

### Primary Hashtags (always include 3-5)
```
#astrology #zodiac #horoscope #birthchart #zodiacsigns
```

### Sign-Specific (include for targeted content)
```
#aries #taurus #gemini #cancer #leo #virgo
#libra #scorpio #sagittarius #capricorn #aquarius #pisces
```

### Trending/Seasonal
```
#mercuryretrograde #eclipseseason #fullmoon #newmoon
#astrologytiktok #zodiacmemes #astrologytok
```

### Engagement-Driving
```
#fyp #foryou #viral #astrologyfacts
```

### Formula Per Post
5-8 hashtags total:
1. 2 broad astrology tags (#astrology, #zodiacsigns)
2. 1-2 sign-specific tags (#scorpio, #scorpioseason)
3. 1 trending/seasonal tag (#mercuryretrograde)
4. 1-2 discovery tags (#fyp, #astrologytok)

---

## 6. Account Setup

### Registration (Anonymous)
TikTok requires a phone number for creator accounts. Use an anonymous approach:

1. **Android emulator** (BlueStacks or LDPlayer) on desktop
2. **eSIM** from services like eSIM.me or Airalo for phone verification
3. **Account name:** @oliviaarcana
4. **Display name:** Olivia Arcana
5. **Bio:** "Your personal astrologer. NASA-grade charts. 8 languages. Link below for your FREE birth chart reading."
6. **Profile picture:** OA monogram (gold on void black, circular crop)
7. **Link in bio:** Linktree or direct link to `t.me/OliviaArcanaBot?start=tiktok`

### Creator Account Setup
- Switch to Creator Account (Settings -> Account -> Switch to Creator Account)
- Category: Education or Entertainment
- Enable TikTok Analytics
- Enable TikTok Shop (future: sell readings directly)

### Multiple Language Accounts (Phase 2)
For non-English markets, consider separate accounts:
- @oliviaarcana (English, primary)
- @oliviaarcana.ua (Ukrainian)
- @oliviaarcana.ru (Russian)
- @oliviaarcana.ar (Arabic)
- etc.

Alternatively, post all languages on one account and let TikTok's algorithm sort by language.

---

## 7. Metrics to Track

### Daily Metrics
| Metric | Tool | Target | Action if Below |
|--------|------|--------|-----------------|
| Views per video (first 4 hours) | TikTok Analytics | >1,000 | Hook isn't working, test different format |
| Average watch time | TikTok Analytics | >50% of video length | Content is too long or boring in middle |
| Profile visits from videos | TikTok Analytics | >2% of views | CTA needs strengthening |

### Weekly Metrics
| Metric | Tool | Target | Action if Below |
|--------|------|--------|-----------------|
| Total views (week) | TikTok Analytics | >50,000 (month 1), >500,000 (month 3) | Content format change needed |
| New followers (week) | TikTok Analytics | >200/week (month 1), >2,000/week (month 3) | Hooks or content quality issue |
| Shares per video (avg) | TikTok Analytics | >10 shares/video | Content isn't shareable enough |
| Link clicks (bio) | Linktree/tracking | >50/week | CTA or bio optimization needed |
| Telegram signups from TikTok | Bot analytics | >20/week | Funnel from TikTok->Telegram broken |

### Monthly Metrics
| Metric | Tool | Target (Month 3) | Target (Month 6) |
|--------|------|-------------------|-------------------|
| Total followers | TikTok Analytics | 5,000 | 50,000 |
| Total views (month) | TikTok Analytics | 500,000 | 5,000,000 |
| Telegram signups from TikTok | Bot DB | 200 | 2,000 |
| Cost per Telegram signup | Calculated | <$0.50 (organic) | <$0.50 |

---

## 8. Content Calendar Template

### Week of [DATE]

| Day | 06:00-11:00 UTC | 12:00-15:00 UTC (Peak) | 16:00-17:00 UTC | Weekly Skit |
|-----|-----------------|------------------------|------------------|-------------|
| Mon | Aries-Virgo daily | Libra daily + **Zodiac Roast: Gemini** | Aquarius-Pisces daily | Roast |
| Tue | Aries-Virgo daily | Libra daily + **Compatibility: Leo x Scorpio** | Aquarius-Pisces daily | Compatibility |
| Wed | Aries-Virgo daily | Libra daily + **Celebrity: [trending person]** | Aquarius-Pisces daily | Celebrity |
| Thu | Aries-Virgo daily | Libra daily + **"What [Sign] does when..."** | Aquarius-Pisces daily | Relatable |
| Fri | Aries-Virgo daily | Libra daily + **Birth chart reveal** | Aquarius-Pisces daily | Reveal |
| Sat | Aries-Virgo daily | Libra daily + banked content | Aquarius-Pisces daily | Banked |
| Sun | Aries-Virgo daily | Libra daily + **"3 signs this week"** | Aquarius-Pisces daily | Preview |

**Notes column:** Track which hooks worked, which signs got most engagement, any trending audios to use.

---

## 9. Video Specifications

| Spec | Value |
|------|-------|
| Aspect ratio | 9:16 (vertical) |
| Resolution | 1080 x 1920 px |
| Duration | 15-60 seconds (15-30s for daily, 30-60s for skits) |
| FPS | 30 fps |
| Format | MP4 (H.264) |
| Audio | AAC, stereo, 44.1kHz |
| Captions | Burned-in, bold white, 2-3 words at a time, centered |
| Safe zone | Keep text within 80% of frame (avoid edges hidden by UI) |
| File size | Under 500MB (TikTok limit) |

### Caption Style
- Font: Bold sans-serif (CapCut default or custom)
- Color: White with black outline/shadow
- Position: Center of frame, lower third
- Size: Large enough to read on phone without squinting
- Animation: Word-by-word or phrase-by-phrase reveal (synced to audio)

---

## 10. Growth Tactics

### Duets and Stitches
- Enable duets on all videos (Settings -> Privacy -> Allow Duet)
- Create "duet bait" content: "Duet this with YOUR sign's reaction"
- Stitch trending astrology videos with Olivia's take

### Trending Audio
- Monitor TikTok's trending sounds weekly
- Map trending audio to astrology content: e.g., dramatic reveal sound -> birth chart reveal
- Use original audio for daily clips (builds brand recognition)

### Comment Engagement
- Reply to top 5 comments on every video (as Olivia persona)
- Pin the best comment that asks a question (drives more comments)
- Reply with a video to high-engagement comments ("Someone asked about Scorpio Rising...")

### Cross-Promotion
- Cross-post every video to Instagram Reels and YouTube Shorts
- Add "Full reading in bio" CTA to every video
- Mention Telegram bot in pinned comment: "Get your FREE birth chart: link in bio"

### Collaboration
- Duet with other astrology creators (shared audience)
- React to other creators' zodiac content
- Join TikTok astrology creator groups for cross-promotion

---

## 11. Claude API Script Generation

### Daily Zodiac Script Prompt Template

```
You are writing a 15-second TikTok script for {sign} ({date_range}).

Today's transits:
{transit_data}

Key transit affecting {sign}: {specific_transit}

Format:
HOOK (first 3 seconds, must grab attention):
[Write a punchy, curiosity-driven opening line]

BODY (8-10 seconds):
[Write 2-3 sentences about today's energy for this sign, referencing the actual transit. Be specific, not generic. Use "you" language.]

CTA (last 2 seconds):
[End with: "Follow for your daily reading" or "Link in bio for your full chart"]

Rules:
- Conversational, warm tone (Olivia's voice: mystical but approachable)
- Reference the ACTUAL transit (e.g., "Mars entering your 7th house")
- Never generic ("Today is a good day" = BAD)
- Create urgency or emotional resonance
- Under 80 words total
```

### Zodiac Roast Prompt Template

```
You are Olivia Arcana, writing a 30-second TikTok zodiac roast for {sign}.

The user's actual chart placements (if available):
{chart_data}

Write a brutally honest but ultimately loving roast of {sign}. Reference their actual planetary placements to make it feel personal and scarily accurate.

Format:
HOOK: "Oh, {sign}. We need to talk."
BODY: 3-4 roast lines, each targeting a different trait. Mix humor with uncomfortable accuracy.
REDEMPTION: End with ONE genuinely kind observation about their strength.
CTA: "Think you can handle YOUR cosmic truth? Link in bio."

Rules:
- Sharp, funny, specific (not generic zodiac stereotypes)
- Reference real planetary placements
- Never cruel, always loving underneath
- Under 120 words total
```

### Celebrity Breakdown Prompt Template

```
You are Olivia Arcana, breaking down {celebrity_name}'s birth chart for TikTok.

Celebrity birth data:
{celebrity_chart}

Write a 45-second script explaining why {celebrity_name} is the way they are, based on their actual chart.

Format:
HOOK: "I looked up {celebrity_name}'s birth chart and everything makes sense now."
REVEAL 1: Their Sun sign and what it means for their public persona
REVEAL 2: Their Moon sign and what it means for their private emotions
REVEAL 3: One surprising aspect that explains a specific behavior or event
CTA: "Want to see YOUR chart? Link in bio."

Rules:
- Reference real chart data, not generic sign descriptions
- Connect chart placements to known public behaviors/events
- Entertaining and insightful
- Under 150 words total
```

---

## 12. Budget Estimate

### Monthly Costs (at 12 daily + 4 weekly = ~400 videos/month)

| Service | Plan | Monthly Cost | Per Video | Notes |
|---------|------|-------------|-----------|-------|
| Claude API | Pay-per-use | ~$15-25 | ~$0.04-0.06 | Script generation (400 scripts/mo) |
| ElevenLabs | Starter ($5) or Creator ($22) | $5-22 | ~$0.01-0.05 | Voiceover audio. Starter = 30K chars/mo (enough for ~200 clips). Creator for full volume. |
| HeyGen | Creator ($29/mo) | $29 | ~$0.15-0.30 | AI avatar videos. Only needed for avatar-style content (weekly skits). Skip for daily clips. |
| CapCut | Pro ($8/mo) | $8 | ~$0.02 | Template-based video editing for daily clips. Batch processing. |
| TikTok scheduler | Later/Buffer | $15-25 | — | Optional. Can post manually instead. |
| **Total (minimal)** | | **~$50-60** | | Daily clips only, CapCut + ElevenLabs Starter |
| **Total (full)** | | **~$100-120** | | Daily + weekly skits with HeyGen avatar |

### Cost Optimization
- **Daily clips:** Use CapCut templates (not HeyGen). ElevenLabs Starter plan. Cost: ~$0.05/clip.
- **Weekly skits:** Use HeyGen for avatar-style content only (4-8 per month). Cost: ~$0.30/clip.
- **Scripts:** Claude API is the cheapest component. Batch generate all 12 daily scripts in one API call.
- **Free alternatives:** Use CapCut's free tier (watermark) for testing. Use TikTok's built-in text-to-speech instead of ElevenLabs for daily clips (lower quality but free).

---

## 13. Reference Documents

| Document | Path | Relevant Sections |
|----------|------|-------------------|
| Business Architecture | `docs/BUSINESS_ARCHITECTURE.md` | Section 1 (Acquisition Channels), Section 5 (Content Automation Pipeline) |
| Growth Playbook | `docs/GROWTH_PLAYBOOK.md` | TikTok hook templates, posting schedule, content calendar, KPIs |
| Asset Specifications | `docs/ASSET_SPECIFICATIONS.md` | Story templates, video card layouts |
| Design System | `docs/DESIGN_SYSTEM.md` | Variant C (Mystic Indigo) recommended for TikTok visual style |
| Viral Features | `docs/VIRAL_FEATURES.md` | Zodiac roast, compatibility link, chart card (all TikTok content sources) |
