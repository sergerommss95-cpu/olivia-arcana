# Olivia Arcana — Instagram Content Pipeline Handoff

**Date:** April 6, 2026
**Status:** Not started. Pipeline designed, no content created yet.
**Goal:** Daily Stories, 2-3 Reels/week (cross-posted from TikTok), 2-3 carousels/week, 1-2 aesthetic posts/week

---

## 1. Content Types

### Daily Content
| Type | Format | Dimensions | Frequency | Purpose |
|------|--------|------------|-----------|---------|
| Story horoscopes | Static image or short video | 1080 x 1920 | 12/day (one per sign) | Retention, daily habit |
| Tarot card of the day | Story card reveal | 1080 x 1920 | 1/day | Mystique + engagement |

### Weekly Content
| Type | Format | Dimensions | Frequency | Purpose |
|------|--------|------------|-----------|---------|
| Reels (cross-post TikTok) | Video | 1080 x 1920 | 3-5/week | Reach via algorithm |
| Carousels | 5-10 slide image set | 1080 x 1080 | 2-3/week | Saves + shares |
| Birth chart cards | Single image | 1080 x 1080 | On demand (user-generated) | UGC sharing |
| Aesthetic brand posts | Single image | 1080 x 1080 | 1-2/week | Brand building |
| Weekly cosmic weather | Vertical infographic | 1080 x 1350 | 1/week (Monday) | Authority + saves |

### Monthly Content
| Type | Format | Dimensions | Frequency | Purpose |
|------|--------|------------|-----------|---------|
| Live readings | Instagram Live | N/A | 1/month | Community + conversion |
| Monthly forecast carousel | 10-slide carousel | 1080 x 1080 | 1/month | SEO saves |

---

## 2. Automation Pipeline

### Image Generation Pipeline

```
Step 1: Generate Content (Claude API + kerykeion)
  |
  Input: Today's transit data + sign + content type
  Output: Reading text, card copy, carousel slide content
  |
Step 2: Generate Images (Python + Pillow)
  |
  Input: Text content + template specification
  Output: PNG images (1080x1080 or 1080x1920)
  Tool: Python Pillow library with pre-built templates
  |
  Alternative: Canva API or Figma API for more complex designs
  |
Step 3: Schedule Posts (Buffer or Later)
  |
  Tool: Buffer ($15/mo) or Later ($25/mo)
  Features: Auto-scheduling, optimal time detection, cross-posting
  |
  Alternative: Meta Business Suite (free, native scheduling)
```

### Python Image Generation Script

```python
# templates/daily_horoscope.py
from PIL import Image, ImageDraw, ImageFont

def generate_daily_card(sign, date, reading_text, output_path):
    """Generate a 1080x1080 daily horoscope card."""
    # Background
    img = Image.new('RGB', (1080, 1080), color='#0D0D1A')
    draw = ImageDraw.Draw(img)

    # Fonts (pre-loaded)
    playfair = ImageFont.truetype('fonts/PlayfairDisplay-Bold.ttf', 42)
    inter = ImageFont.truetype('fonts/Inter-Regular.ttf', 18)
    cormorant = ImageFont.truetype('fonts/CormorantGaramond-Medium.ttf', 18)

    # Gold border (1px)
    draw.rectangle([10, 10, 1070, 1070], outline='#D4AF37', width=1)

    # Header: "DAILY HOROSCOPE"
    draw.text((540, 60), "DAILY HOROSCOPE", font=cormorant,
              fill='#D4AF37', anchor='mt')

    # Sign name
    draw.text((540, 200), sign.upper(), font=playfair,
              fill='#D4AF37', anchor='mt')

    # Reading text (word-wrapped)
    # ... wrap text to fit within margins ...

    # Footer: "OLIVIA ARCANA"
    draw.text((540, 1020), "OLIVIA ARCANA", font=cormorant,
              fill='#D4AF37', anchor='mb')

    img.save(output_path, 'PNG', quality=95)
```

### Template Files Structure

```
instagram-pipeline/
  scripts/
    generate_daily_stories.py     -- 12 Story images per day
    generate_daily_cards.py       -- 12 feed post cards per day
    generate_carousel.py          -- Multi-slide carousel generator
    generate_chart_card.py        -- User birth chart identity card
    generate_weekly_weather.py    -- Weekly cosmic weather infographic
    schedule_posts.py             -- Buffer/Later API integration
    daily_pipeline.py             -- Orchestrator
  templates/
    story_daily.py                -- 1080x1920 Story template
    card_daily.py                 -- 1080x1080 daily horoscope template
    carousel_slide.py             -- 1080x1080 carousel slide template
    chart_card.py                 -- 1080x1080 birth chart identity card
    weekly_weather.py             -- 1080x1350 weekly infographic
  fonts/
    PlayfairDisplay-Bold.ttf
    Inter-Regular.ttf
    Inter-Medium.ttf
    CormorantGaramond-Medium.ttf
    CormorantGaramond-MediumItalic.ttf
  assets/
    zodiac_glyphs/                -- 12 zodiac glyph PNGs (gold on transparent)
    backgrounds/                  -- Nebula/star field background textures
    elements/                     -- Decorative elements (stars, dividers, borders)
  output/
    YYYY-MM-DD/
      stories/
        aries_story.png
        ...
      feed/
        aries_daily.png
        ...
      carousel/
        big3_explained_01.png
        big3_explained_02.png
        ...
```

---

## 3. Posting Schedule

### Daily Schedule
| Time (UTC) | Content | Platform Feature |
|------------|---------|------------------|
| 06:00 | 12 Story horoscopes (batch upload) | Instagram Stories |
| 07:00 | Morning Reel (cross-posted from TikTok) | Instagram Reels |
| 09:00 | Tarot card of the day (Story) | Instagram Stories |
| 12:00 | Engagement Story (poll/quiz) | Instagram Stories |
| 15:00 | Feed post (carousel or aesthetic) | Instagram Feed |
| 18:00 | Evening Reel (if applicable) | Instagram Reels |

### Weekly Schedule
| Day | Feed Post | Stories | Reels |
|-----|-----------|---------|-------|
| Mon | Weekly cosmic weather (carousel) | 12 daily + tarot + poll | TikTok cross-post |
| Tue | Carousel: "Your Big 3 explained" | 12 daily + tarot | TikTok cross-post |
| Wed | Aesthetic brand post | 12 daily + tarot + quiz | TikTok cross-post |
| Thu | Carousel: compatibility or transit | 12 daily + tarot + poll | TikTok cross-post |
| Fri | Birth chart card examples | 12 daily + tarot | TikTok cross-post |
| Sat | Quote or meme post | 12 daily + tarot | Banked content |
| Sun | Week-ahead preview carousel | 12 daily + tarot + Q&A | Banked content |

---

## 4. Visual Templates

### 4.1 Story Template — Daily Horoscope (1080 x 1920)

```
Full-screen dark gradient (#0D0D1A -> #1A1A3E, diagonal)

  [Top safe zone: 80px padding]

  Zodiac glyph (400px, centered, gold #D4AF37)

  SIGN NAME
  Playfair Display 700, 48px, gold
  Centered

  Date range (Inter 400, 16px, muted lavender #9B96A8)

  ------- gold divider line (60% width) -------

  Reading text (3-4 lines)
  Inter 400, 22px, warm ivory #F5F0E8
  Centered, line-height 1.6

  ------- gold divider line -------

  "Swipe up for your personal reading"
  Inter 500, 16px, slate blue #7B68EE

  OA logo (small, bottom center, gold)

  [Bottom safe zone: 100px padding for Stories UI]
```

### 4.2 Feed Card Template — Daily Horoscope (1080 x 1080)
See Asset Spec document, Asset 3. Exact layout at `/Users/macbookpro/olivia-arcana/docs/ASSET_SPECIFICATIONS.md`.

Key elements:
- 1px gold border with 20px inset
- "DAILY HOROSCOPE" header in Cormorant Garamond 18px gold
- Large zodiac glyph (120px) in elemental color
- Sign name in Playfair Display 42px gold
- Reading text in Inter 18px warm ivory, left-aligned, 40px margins
- Gold star dividers
- VIP CTA in slate blue
- "OLIVIA ARCANA" footer

### 4.3 Carousel Template — "Your Big 3 Explained" (1080 x 1080, 5-10 slides)

**Slide 1 (Cover):**
```
Dark gradient background
"YOUR BIG 3 EXPLAINED" (Playfair 36px, gold)
Subtitle: "Sun + Moon + Rising = You" (Inter 20px, warm ivory)
Three zodiac glyphs in a row (gold)
```

**Slide 2 (Sun):**
```
"YOUR SUN SIGN" (Cormorant 24px, gold)
"What the world sees" (Inter 16px, muted lavender)
Large sun glyph (gold)
3-4 lines explaining what Sun sign means (Inter 18px, warm ivory)
```

**Slide 3 (Moon):**
```
Same layout as Slide 2 but for Moon sign
"YOUR MOON SIGN" + "Your emotional core"
Moon glyph in slate blue
```

**Slide 4 (Rising):**
```
Same layout for Rising sign
"YOUR RISING SIGN" + "Your first impression"
Rising arrow glyph in cosmic teal
```

**Slide 5 (CTA):**
```
"Want to know YOUR Big 3?"
"Get your free birth chart reading"
"Link in bio -> @OliviaArcanaBot"
OA logo
```

### 4.4 Birth Chart Identity Card (1080 x 1080)
See Asset Spec document, Asset 13. This is the viral shareable card showing user's Big 3 + cosmic tagline. Full layout at `/Users/macbookpro/olivia-arcana/docs/ASSET_SPECIFICATIONS.md`.

---

## 5. Hashtag Strategy

### Core Hashtags (every post, pick 5-8)
```
#astrology #zodiac #horoscope #birthchart #zodiacsigns
#astrologytiktok #dailyhoroscope #cosmicguidance
```

### Sign-Specific (include for targeted content)
```
#aries #taurus #gemini #cancer #leo #virgo
#libra #scorpio #sagittarius #capricorn #aquarius #pisces
#ariessseason #scorpioseason (etc., when in season)
```

### Content-Type Hashtags
| Content Type | Additional Hashtags |
|-------------|-------------------|
| Daily horoscope | #dailyhoroscope #todayshoroscope #horoscopetoday |
| Tarot | #tarot #tarotreading #tarotcardoftheday #dailytarot |
| Compatibility | #zodiaccompatibility #loveastrology #synastry |
| Birth chart | #birthchart #natalchart #astrologychart |
| Transit | #mercuryretrograde #fullmoon #newmoon #eclipseseason |
| Carousel | #astrologyfacts #zodiacfacts #learnastrology |

### Engagement Tags
```
#astrologymemes #zodiacmemes #astrologycommunity
#spirituality #mystic #cosmic #starsign
```

### Formula Per Post
- Feed posts: 15-20 hashtags (Instagram allows up to 30, but 15-20 performs better)
- Stories: 3-5 hashtags (use hashtag sticker or small text)
- Reels: 8-12 hashtags

### Monthly Hashtag Audit
Review which hashtags drive the most reach in Instagram Insights. Replace underperformers monthly.

---

## 6. Bio and Link-in-Bio

### Bio Text
```
Olivia Arcana
Your personal astrologer

NASA-grade birth charts
Daily readings in 8 languages
Free chart reading below
```

### Link-in-Bio Structure (Linktree or similar)

| Link | Destination | Priority |
|------|-------------|----------|
| Get Your FREE Birth Chart | `t.me/OliviaArcanaBot?start=instagram` | Top (primary CTA) |
| Daily Horoscope Channel | `t.me/OliviaArcana` | Second |
| Website | `olivia-arcana.com` | Third |
| TikTok | `tiktok.com/@oliviaarcana` | Fourth |

### Profile Settings
- **Profile picture:** OA monogram (gold on void black, works in circular crop)
- **Category:** Personal Blog or Astrologer
- **Contact:** Email button (olivia@olivia-arcana.com or similar)
- **Action button:** None initially (add "Book" when video readings launch)
- **Highlights:** See Section 9

---

## 7. Engagement Strategy

### Story Engagement Features
| Feature | Usage | Frequency |
|---------|-------|-----------|
| **Polls** | "Which sign is having the BEST week?" with 4 sign options | 2-3/week |
| **Questions** | "Ask Olivia anything about your chart" -> screenshot answers as Stories | 1-2/week |
| **Quizzes** | "What element is Scorpio?" (Water/Fire/Earth/Air) | 1/week |
| **Emoji slider** | "How accurate was today's reading?" (star emoji slider) | Daily |
| **Countdown** | Countdown to next eclipse/retrograde/new moon | As needed |
| **Add Yours** | "Add your Big 3" template (Sun/Moon/Rising) | Monthly |

### Comment Strategy
- Reply to every comment in the first hour after posting (algorithm boost)
- Reply as Olivia's persona (warm, mystical, personal)
- Pin the best question comment to drive more engagement
- Heart/like every comment (signals engagement to algorithm)

### DM Strategy
- Auto-reply to DMs with link to Telegram bot for free reading
- Respond to genuine questions personally (or via Claude API)
- Never hard-sell in DMs

### Engagement Time Blocks
- 15 minutes after each feed post: reply to comments
- 10 minutes morning: engage with 5-10 accounts in astrology niche
- 10 minutes evening: respond to DMs and Story replies

---

## 8. Cross-Promotion with Telegram

### Telegram -> Instagram
- Every Telegram channel post ends with: "Follow us on Instagram for daily zodiac visuals: @oliviaarcana"
- Share Instagram carousel previews in Telegram channel
- Weekly "best of Instagram" roundup in Telegram

### Instagram -> Telegram
- Every Instagram post includes CTA: "Get your FREE personal reading: link in bio"
- Stories mention: "Your personal reading is waiting in DMs -> @OliviaArcanaBot on Telegram"
- Bio link goes to Telegram bot

### Content Repurposing Flow
```
Telegram daily horoscope text
  |
  +-> Instagram Story (text -> image template via Pillow)
  +-> Instagram Feed card (same text, formatted as 1080x1080 image)

TikTok video
  |
  +-> Instagram Reel (direct cross-post, same video)
  +-> Instagram Story (15s clip of the best moment)

Telegram weekly cosmic weather
  |
  +-> Instagram carousel (weather text -> 5-slide carousel)
  +-> Instagram Story (highlight version)
```

---

## 9. UGC Strategy (User-Generated Content)

### Birth Chart Identity Card (Primary UGC Vehicle)
- Users request their card via Telegram bot (`/card` command)
- Bot generates a beautiful 1080x1080 image with their Big 3 + cosmic tagline
- Card has Olivia Arcana branding (watermark + URL)
- Users share on Instagram Stories/Feed, dating app profiles
- **Every shared card = free branded advertising**

### How to Encourage Sharing
1. After generating card: "Share your Cosmic Identity Card on Instagram and tag @oliviaarcana for a feature!"
2. Weekly "Feature Friday": repost the best user-shared chart cards to Stories
3. Monthly giveaway: "Share your chart card, tag us, and win a free VIP month"

### Zodiac Roast Screenshots
- Roast results are formatted as shareable images
- Users screenshot and post to Stories with reactions
- Each screenshot shows Olivia Arcana branding

### Compatibility Results
- Compatibility scores formatted as shareable images
- "Share your compatibility result with your partner"
- Both users need to use the bot = viral acquisition

---

## 10. Brand Consistency Rules

### Celestial Noir Palette (Primary for Instagram)
| Element | Color | Hex |
|---------|-------|-----|
| Background | Void Black | #0D0D1A |
| Secondary background | Deep Cosmos | #1A1A3E |
| Accent / headlines | Celestial Gold | #D4AF37 |
| Interactive / links | Slate Blue | #7B68EE |
| Body text | Warm Ivory | #F5F0E8 |
| Secondary text | Muted Lavender | #9B96A8 |
| Positive | Cosmic Teal | #4ECDC4 |
| Negative | Mars Red | #E8524A |

### Typography Rules
- Headlines: Playfair Display Bold (never regular weight)
- Body: Inter Regular (never bold for body text)
- Labels/accents: Cormorant Garamond Medium
- Never use more than these 3 fonts in any single piece
- All-caps only for short labels (2-3 words max), never for body text

### Visual Rules
- Gold borders: 1px thin, never thick or gaudy
- Background noise/grain: 2-3% opacity overlay on all dark backgrounds
- Star elements: small, scattered, never overwhelming
- No emojis in formal posts (Stories can use emojis sparingly)
- Photography: never stock photos of people. Use cosmic/nebula imagery only.
- Zodiac glyphs: use the standard Unicode symbols, not custom illustrations (at launch)

### Tone of Voice
- Warm, mystical, empowering
- "Dear soul" not "Hey guys"
- Speak with cosmic authority but personal intimacy
- Never condescending about astrology skeptics
- Use "the stars suggest" not "this WILL happen"

### Do NOT
- Use generic zodiac memes from the internet
- Post content with visible watermarks from other tools
- Use bright/neon colors that break the Celestial Noir palette
- Post anything that looks like a Canva default template
- Use Comic Sans, Papyrus, or any "mystical" novelty fonts

---

## 11. Story Highlights Structure

Set up these 5 permanent Story Highlights with custom covers (400x400, gold icon on void black):

| Highlight | Icon | Contains |
|-----------|------|----------|
| Daily | Crescent moon | Best daily horoscope Stories (rotate weekly) |
| Tarot | Single tarot card | Tarot card of the day Stories |
| VIP | Star | VIP benefit previews, sample readings |
| Transits | Planet orbit rings | Transit alert Stories, retrograde info |
| About | OA monogram | Brand intro, how Olivia works, testimonials |

---

## 12. Metrics to Track

### Weekly Metrics
| Metric | Tool | Target (Month 1) | Target (Month 3) |
|--------|------|-------------------|-------------------|
| Followers gained | Instagram Insights | +100/week | +500/week |
| Reach (accounts reached) | Instagram Insights | 5,000/week | 50,000/week |
| Engagement rate | Instagram Insights | >5% | >4% |
| Story views (avg) | Instagram Insights | 50 per Story | 500 per Story |
| Saves per carousel | Instagram Insights | >20 | >100 |
| Link clicks (bio) | Linktree analytics | >30/week | >200/week |
| Telegram signups from IG | Bot DB (tracking param) | 10/week | 50/week |

### Content Performance
- Track which carousel topics get the most saves (saves = algorithmic gold)
- Track which Reel hooks get the most shares
- Track which Story poll topics get the most votes
- A/B test posting times weekly

---

## 13. Budget Estimate

| Item | Monthly Cost | Notes |
|------|-------------|-------|
| Buffer or Later (scheduling) | $15-25 | Auto-scheduling + analytics |
| Pillow image generation | $0 | Python library, free |
| Claude API (carousel copy) | ~$5-10 | Script generation for carousel text |
| Font licenses | $0 | Google Fonts (free) |
| Linktree Pro | $5 | Analytics + custom branding |
| **Total** | **~$25-40/mo** | |

Note: Most Instagram content is cross-posted from TikTok (Reels) or generated from Telegram content (Stories/cards). The marginal cost of Instagram over TikTok is minimal -- mainly the scheduling tool.

---

## 14. Reference Documents

| Document | Path | Relevant Sections |
|----------|------|-------------------|
| Design System | `docs/DESIGN_SYSTEM.md` | Variant A (Celestial Noir) primary, Variant B (Ethereal Dawn) for Instagram alt |
| Asset Specifications | `docs/ASSET_SPECIFICATIONS.md` | All 14 asset templates with exact dimensions and layouts |
| Growth Playbook | `docs/GROWTH_PLAYBOOK.md` | Content repurposing pipeline, posting schedule, KPIs |
| Business Architecture | `docs/BUSINESS_ARCHITECTURE.md` | Instagram channel strategy, content types |
| Viral Features | `docs/VIRAL_FEATURES.md` | Birth chart card, compatibility link (UGC sources) |
