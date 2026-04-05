# Olivia Arcana — Marketing Asset Specifications

> Complete specification for every visual asset needed to launch and grow the bot. All assets use **Variant A (Celestial Noir)** as the primary design system unless noted. Each spec is implementation-ready — hand to a designer or feed to an image generation tool.

---

## Design System Reference (Variant A — Celestial Noir)

| Token | Value |
|-------|-------|
| Primary BG | `#0D0D1A` (Void Black) |
| Secondary BG | `#1A1A3E` (Deep Cosmos) |
| Gold accent | `#D4AF37` (Celestial Gold) |
| Blue accent | `#7B68EE` (Medium Slate Blue) |
| Text primary | `#F5F0E8` (Warm Ivory) |
| Text secondary | `#9B96A8` (Muted Lavender) |
| Heading font | Playfair Display 700 |
| Body font | Inter 400 |
| Label font | Cormorant Garamond 500 |
| Noise overlay | 2-3% opacity grain texture on all backgrounds |

---

## Asset 1: Telegram Channel Cover Banner

**Dimensions:** 1280 x 512 px
**Where used:** Top of each Telegram public channel (8 language variants)

### Layout

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  [Subtle star field gradient bg]                │
│  [#0D0D1A → #1A1A3E diagonal]                  │
│                                                 │
│         ✦ OA monogram (gold, centered)          │
│                                                 │
│       OLIVIA ARCANA                             │  ← Playfair Display 700, 48px, gold
│                                                 │
│    Your Personal Astrologer & Tarot Reader      │  ← Inter 400, 22px, warm ivory
│                                                 │
│  ☽ Daily Horoscopes  ·  Tarot  ·  Birth Charts  │  ← Cormorant Garamond, 16px, muted lavender
│                                                 │
│  [Thin gold line, 1px, 60% width, centered]     │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Copy (per language)

| Language | Tagline | Features line |
|----------|---------|--------------|
| EN | Your Personal Astrologer & Tarot Reader | Daily Horoscopes · Tarot · Birth Charts |
| UK | Ваш Особистий Астролог та Таролог | Щоденні Гороскопи · Таро · Натальні Карти |
| RU | Ваш Личный Астролог и Таролог | Ежедневные Гороскопы · Таро · Натальные Карты |
| AR | منجمتك الشخصية وقارئة التاروت | أبراج يومية · تاروت · خرائط الميلاد |
| DE | Ihre Persönliche Astrologin & Tarot-Beraterin | Tageshoroskope · Tarot · Geburtshoroskope |
| ES | Tu Astróloga Personal y Lectora de Tarot | Horóscopos Diarios · Tarot · Cartas Natales |
| PT | Sua Astróloga Pessoal e Taróloga | Horóscopos Diários · Tarot · Mapa Astral |
| FR | Votre Astrologue Personnelle & Tarologue | Horoscopes Quotidiens · Tarot · Thème Astral |

### Image Generation Prompt
```
Elegant banner design for astrology Telegram channel, 1280x512px, dark cosmic background gradient from #0D0D1A to #1A1A3E, subtle gold star particles, gold "OA" monogram logo at center with crescent moon in O and star on A peak, "OLIVIA ARCANA" in gold serif font below, thin gold horizontal line, premium luxury aesthetic, no people, celestial noir style, minimal and sophisticated --ar 5:2
```

---

## Asset 2: Bot Welcome Message Card

**Dimensions:** 1080 x 1080 px
**Where used:** First image sent when a user starts the bot via /start

### Layout

```
┌─────────────────────────────┐
│                             │
│  [Star field gradient bg]   │
│                             │
│      ✦ OA monogram ✦       │  ← Gold, 80px, centered
│                             │
│   Welcome, dear soul.       │  ← Playfair Display, 36px, gold
│                             │
│   I'm Olivia Arcana,       │  ← Inter, 20px, warm ivory
│   your personal guide       │
│   to the stars.             │
│                             │
│   Share your birth date     │  ← Inter, 18px, muted lavender
│   and I'll cast your        │
│   chart — free.             │
│                             │
│  ─────── ✦ ───────          │  ← Gold divider
│                             │
│  🌙 Personalized Readings  │  ← 3 feature icons
│  ✦ Real Planetary Data     │     Cormorant Garamond, 16px
│  🔮 Tarot & Compatibility  │     Muted lavender, left-aligned
│                             │
│  [Gold border, 1px]        │
└─────────────────────────────┘
```

### Copy (EN)
- Headline: "Welcome, dear soul."
- Body: "I'm Olivia Arcana, your personal guide to the stars. Share your birth date and I'll cast your chart — free."
- Features: "Personalized Readings · Real Planetary Data · Tarot & Compatibility"

### Image Generation Prompt
```
Elegant welcome card for astrology bot, 1080x1080px square, dark cosmic background #0D0D1A with subtle star particles, gold "OA" monogram centered top, "Welcome, dear soul" in elegant gold serif font, warm ivory body text about astrology readings, thin gold border, celestial noir luxury aesthetic, crescent moon and star decorative elements, no people, sophisticated and inviting --ar 1:1
```

---

## Asset 3: Daily Horoscope Post Template

**Dimensions:** 1080 x 1080 px
**Where used:** Daily zodiac forecast on public channels (12 sign variants per day)

### Layout (showing Scorpio as example — repeat structure for all 12)

```
┌─────────────────────────────┐
│  [Gold border, 1px]         │
│                             │
│  ✦ DAILY HOROSCOPE ✦       │  ← Cormorant Garamond, 18px, gold, caps
│       April 6, 2026         │  ← Inter, 14px, muted lavender
│                             │
│       ♏                     │  ← Zodiac glyph, 120px, slate blue
│                             │
│     SCORPIO                 │  ← Playfair Display, 42px, gold
│     October 23 – Nov 21    │  ← Inter, 14px, muted lavender
│                             │
│  ─────── ✦ ───────          │
│                             │
│  [4-6 lines of reading     │  ← Inter, 18px, warm ivory
│   text. Personal, warm,     │     Line height: 1.6
│   referencing today's        │     Left-aligned, 40px margins
│   real planetary transits.   │
│   Never generic.]           │
│                             │
│  ─────── ✦ ───────          │
│                             │
│  🔑 VIP: Your PERSONAL     │  ← Inter 500, 14px, slate blue
│  reading is in your DMs     │
│                             │
│  OLIVIA ARCANA ✦            │  ← Cormorant Garamond, 12px, gold
│  [Gold border, 1px]         │
└─────────────────────────────┘
```

### Sign-Specific Colors (glyph color accent)
Each zodiac sign's glyph uses its elemental color for the glyph only (rest of card stays consistent):

| Element | Signs | Glyph Color |
|---------|-------|-------------|
| Fire | Aries, Leo, Sagittarius | `#E8524A` (Mars Red) |
| Earth | Taurus, Virgo, Capricorn | `#4ECDC4` (Cosmic Teal) |
| Air | Gemini, Libra, Aquarius | `#7B68EE` (Slate Blue) |
| Water | Cancer, Scorpio, Pisces | `#6B8DD6` (Ocean Blue) |

### Image Generation Prompt (Scorpio example)
```
Astrology daily horoscope card design, 1080x1080px square, dark cosmic background #0D0D1A, thin gold border, "DAILY HOROSCOPE" label in small gold caps at top, large Scorpio zodiac symbol ♏ in blue center, "SCORPIO" in elegant gold serif below, horizontal gold divider lines with star ornament, space for reading text in warm white, "OLIVIA ARCANA" wordmark at bottom in small gold, celestial noir luxury style, no people --ar 1:1
```

---

## Asset 4: Tarot Card of the Day Post Template

**Dimensions:** 1080 x 1080 px
**Where used:** Daily tarot post on public channels

### Layout

```
┌─────────────────────────────┐
│  [Gold border, 1px]         │
│                             │
│  ✦ CARD OF THE DAY ✦       │  ← Cormorant Garamond, 18px, gold
│       April 6, 2026         │  ← Inter, 14px, muted lavender
│                             │
│  ┌───────────────────┐      │
│  │                   │      │
│  │  [Tarot card      │      │  ← Arcana Aurea deck card image
│  │   image from      │      │     Centered, 400x700px
│  │   the deck]       │      │     With 4px gold border
│  │                   │      │
│  └───────────────────┘      │
│                             │
│     THE HIGH PRIESTESS      │  ← Playfair Display, 28px, gold
│                             │
│  "Trust your inner knowing  │  ← Inter italic, 16px, warm ivory
│   today. The answers you    │     2-3 sentence interpretation
│   seek are already within." │
│                             │
│  OLIVIA ARCANA ✦            │  ← Cormorant Garamond, 12px, gold
│  [Gold border, 1px]         │
└─────────────────────────────┘
```

### Image Generation Prompt
```
Tarot card of the day social media post, 1080x1080px square, dark cosmic background #0D0D1A, gold border, "CARD OF THE DAY" in small gold caps, centered tarot card image (The High Priestess in gold Art Deco style on black), card name in gold serif below, short interpretation text in warm white, "OLIVIA ARCANA" at bottom, elegant mystical design, celestial noir luxury --ar 1:1
```

---

## Asset 5: Weekly Cosmic Weather Banner

**Dimensions:** 1080 x 1350 px (vertical)
**Where used:** Weekly forecast posted every Monday

### Layout

```
┌─────────────────────────────┐
│  [Gold border, 1px]         │
│                             │
│  ✦ WEEKLY COSMIC WEATHER ✦ │  ← Cormorant Garamond, 18px, gold
│     April 6 – 12, 2026     │  ← Inter, 14px, muted lavender
│                             │
│  [Planetary alignment       │  ← Decorative: planets in a row
│   illustration — Sun,       │     Gold line art, minimal
│   Moon, Mercury, Venus,     │     ~200px tall strip
│   Mars positions]           │
│                             │
│  ─────── ✦ ───────          │
│                             │
│  KEY TRANSITS THIS WEEK     │  ← Playfair Display, 22px, gold
│                             │
│  ☿ Mercury in Aries         │  ← Inter 500, 16px, slate blue
│  Communication gets bold    │  ← Inter, 14px, warm ivory
│  and direct...              │
│                             │
│  ♀ Venus square Saturn      │  ← Repeat format for 3-4 transits
│  Relationships face a       │
│  reality check...           │
│                             │
│  ♃ Jupiter trine Moon       │
│  Emotional expansion and    │
│  generosity flow...         │
│                             │
│  ─────── ✦ ───────          │
│                             │
│  SIGNS MOST AFFECTED        │  ← Playfair Display, 18px, gold
│                             │
│  ♈ Aries  ♎ Libra  ♑ Cap  │  ← 3 signs highlighted
│                             │
│  🔑 VIP: Get your personal │
│  weekly forecast in DMs     │
│                             │
│  OLIVIA ARCANA ✦            │
│  [Gold border, 1px]         │
└─────────────────────────────┘
```

### Image Generation Prompt
```
Weekly cosmic weather banner for astrology channel, 1080x1350px vertical, dark cosmic background #0D0D1A, gold border, "WEEKLY COSMIC WEATHER" in small gold caps, planetary alignment illustration in gold line art, sections for key transits with planet symbols, "SIGNS MOST AFFECTED" section, elegant celestial noir design, sophisticated and informative, gold and ivory text on dark background --ar 4:5
```

---

## Asset 6: VIP Upgrade CTA Card

**Dimensions:** 1080 x 1080 px
**Where used:** The upsell moment — shown when a free user hits the paywall or during conversion push

### Layout

```
┌─────────────────────────────┐
│  [Gold border, 2px]         │
│  [Gradient: #0D0D1A→#1A1A3E]│
│                             │
│     ✦ UNLOCK YOUR STARS ✦   │  ← Playfair Display, 32px, gold
│                             │
│  Your chart reveals so much │  ← Inter, 18px, warm ivory
│  more than your sun sign.   │
│                             │
│  ─────── ✦ ───────          │
│                             │
│  VIP INCLUDES:              │  ← Cormorant Garamond, 16px, gold
│                             │
│  ☽ Daily personal readings  │  ← Inter, 15px, warm ivory
│    based on YOUR birth chart│     Each line has gold bullet
│                             │
│  ✦ Real-time transit alerts │
│    when planets hit your    │
│    natal points             │
│                             │
│  🔮 Weekly tarot pulls      │
│    personalized to you      │
│                             │
│  💫 Compatibility reports   │
│    with partner analysis    │
│                             │
│  ─────── ✦ ───────          │
│                             │
│  [CTA BUTTON VISUAL]        │  ← Rounded rect, gold fill
│  ⭐ Start VIP — 500 Stars  │     Playfair, 20px, void black text
│                             │
│  That's just $6.50/month    │  ← Inter, 13px, muted lavender
│                             │
│  OLIVIA ARCANA ✦            │
│  [Gold border, 2px]         │
└─────────────────────────────┘
```

### Image Generation Prompt
```
VIP upgrade card for premium astrology bot, 1080x1080px, dark cosmic gradient background, thick gold border, "UNLOCK YOUR STARS" in large gold serif, feature list with celestial icons (moon, star, crystal ball), gold CTA button "Start VIP", price below, celestial noir luxury design, compelling and premium, gold on dark --ar 1:1
```

---

## Asset 7: Birthday Reading Card

**Dimensions:** 1080 x 1080 px
**Where used:** Sent to user on their birthday via DM

### Layout

```
┌─────────────────────────────┐
│  [Star field bg, extra      │
│   dense — celebratory]      │
│  [Gold border, 2px]         │
│                             │
│        ✦ ☽ ✦               │  ← Decorative: star moon star
│                             │
│    Happy Solar Return,      │  ← Playfair Display, 32px, gold
│         {Name}!             │  ← Dynamic name insertion
│                             │
│   The Sun returns to the    │  ← Inter, 18px, warm ivory
│   exact position it held    │
│   at the moment of your     │
│   birth. This is YOUR       │
│   cosmic new year.          │
│                             │
│  ─────── ✦ ───────          │
│                             │
│  Your free birthday         │  ← Inter, 16px, muted lavender
│  reading awaits below ↓     │
│                             │
│  ─────── ✦ ───────          │
│                             │
│  💫 Want the FULL Solar     │  ← Inter 500, 15px, slate blue
│  Return Report? Discover    │
│  what this year holds →     │
│                             │
│  OLIVIA ARCANA ✦            │
│  [Gold border, 2px]         │
└─────────────────────────────┘
```

### Image Generation Prompt
```
Birthday astrology card for personal reading, 1080x1080px, rich dark cosmic background with extra gold star particles, thick gold border, crescent moon decoration, "Happy Solar Return" in large gold serif font with space for personalized name, warm ivory body text about sun returning to birth position, gold dividers, celestial celebration feeling, premium luxury design --ar 1:1
```

---

## Asset 8: Synastry / Compatibility Report Cover

**Dimensions:** 1080 x 1350 px (vertical)
**Where used:** Header image for compatibility readings in DMs

### Layout

```
┌─────────────────────────────┐
│  [Gold border, 1px]         │
│                             │
│  ✦ COSMIC COMPATIBILITY ✦  │  ← Cormorant Garamond, 18px, gold
│                             │
│       ♏         ♓          │  ← Two zodiac glyphs
│    SCORPIO   PISCES         │     120px each, slate blue
│                             │     Connected by thin gold arc
│     ─── ♡ ───               │     Heart in gold at center of arc
│                             │
│   {Name 1} & {Name 2}      │  ← Playfair Display, 28px, gold
│                             │
│  ─────── ✦ ───────          │
│                             │
│  YOUR COSMIC CONNECTION     │  ← Cormorant Garamond, 16px, gold
│                             │
│  Sun Harmony: ████████░░ 82%│  ← Progress bars in slate blue
│  Moon Bond:   ██████░░░░ 65%│     Inter, 14px, warm ivory labels
│  Venus Match: █████████░ 91%│     Visual + percentage
│  Mars Energy: ███████░░░ 74%│
│                             │
│  ─────── ✦ ───────          │
│                             │
│  Overall: 78% Compatible    │  ← Playfair Display, 24px, gold
│                             │
│  Full report below ↓        │  ← Inter, 14px, muted lavender
│                             │
│  OLIVIA ARCANA ✦            │
│  [Gold border, 1px]         │
└─────────────────────────────┘
```

### Image Generation Prompt
```
Astrology compatibility report cover card, 1080x1350px vertical, dark cosmic background, gold border, "COSMIC COMPATIBILITY" header, two zodiac symbols connected by golden arc with heart, space for names in gold serif, compatibility progress bars in blue, overall percentage score, elegant celestial noir design, romantic and premium --ar 4:5
```

---

## Asset 9: Eclipse Season Special Report Banner

**Dimensions:** 1080 x 1080 px
**Where used:** Promotional post before eclipse events (4-6x/year)

### Layout

```
┌─────────────────────────────┐
│  [Dark bg with dramatic     │
│   eclipse visual — dark     │
│   circle with gold corona]  │
│                             │
│  ✦ ECLIPSE SEASON ✦        │  ← Cormorant Garamond, 18px, gold
│                             │
│     [Eclipse illustration:  │  ← Central: 300px dark circle
│      black circle with      │     with gold ring/corona
│      gold light corona      │     radiating gold rays
│      radiating outward]     │
│                             │
│   SOLAR ECLIPSE IN LEO     │  ← Playfair Display, 28px, gold
│     August 12, 2026         │  ← Inter, 16px, warm ivory
│                             │
│  ─────── ✦ ───────          │
│                             │
│  This eclipse activates     │  ← Inter, 16px, warm ivory
│  your house of creativity.  │
│  Major shifts incoming.     │
│                             │
│  🔮 Get your personal       │  ← Inter 500, 15px, slate blue
│  Eclipse Impact Report →    │
│                             │
│  OLIVIA ARCANA ✦            │
│  [Gold border, 1px]         │
└─────────────────────────────┘
```

### Image Generation Prompt
```
Eclipse season astrology banner, 1080x1080px, dramatic dark cosmic background, central eclipse illustration — dark moon circle with brilliant gold corona and radiating light rays, "ECLIPSE SEASON" in small gold caps, "SOLAR ECLIPSE IN LEO" in large gold serif, date and brief description in warm white, gold border and dividers, dramatic and awe-inspiring, celestial noir luxury --ar 1:1
```

---

## Asset 10: Re-engagement Message Card

**Dimensions:** 1080 x 1080 px
**Where used:** Sent to users after 7 days of inactivity

### Layout

```
┌─────────────────────────────┐
│  [Star field bg, soft]      │
│  [Gold border, 1px]         │
│                             │
│        ☽                    │  ← Crescent moon, gold, 80px
│                             │
│  The stars have shifted     │  ← Playfair Display, 28px, gold
│  since we last spoke...     │
│                             │
│  ─────── ✦ ───────          │
│                             │
│  While you were away,       │  ← Inter, 17px, warm ivory
│  {transit_event} moved      │     Dynamic: current transit
│  into a powerful position   │
│  in your chart.             │
│                             │
│  I have something           │  ← Inter, 17px, warm ivory
│  important to share         │
│  with you.                  │
│                             │
│  ─────── ✦ ───────          │
│                             │
│  💫 See what changed →      │  ← Inter 500, 16px, slate blue
│                             │
│  OLIVIA ARCANA ✦            │
│  [Gold border, 1px]         │
└─────────────────────────────┘
```

### Image Generation Prompt
```
Re-engagement astrology card, 1080x1080px, soft dark cosmic background with subtle star field, gold crescent moon centered top, "The stars have shifted since we last spoke" in gold serif font, warm ivory body text about cosmic changes, gold dividers, gentle and inviting tone, celestial noir design, draws the viewer back in --ar 1:1
```

---

## Asset 11: Pricing / Subscription Info Card

**Dimensions:** 1080 x 1350 px (vertical)
**Where used:** VIP offer card — full pricing breakdown

### Layout

```
┌─────────────────────────────┐
│  [Gold border, 2px]         │
│  [Gradient bg]              │
│                             │
│  ✦ OLIVIA ARCANA VIP ✦     │  ← Cormorant Garamond, 20px, gold
│                             │
│  Your Stars, Your Way       │  ← Playfair Display, 30px, gold
│                             │
│  ─────── ✦ ───────          │
│                             │
│  WHAT YOU GET:              │  ← Cormorant Garamond, 16px, gold
│                             │
│  ☽ Daily personal reading   │  ← Inter, 15px, warm ivory
│  ✦ Real-time transit alerts │     Each with gold bullet icon
│  🔮 Weekly tarot pull       │
│  💫 Compatibility reports   │
│  🌙 Eclipse & retrograde   │
│     impact reports          │
│  ✨ Birthday Solar Return   │
│  ♾️ Unlimited chat with     │
│     Olivia                  │
│                             │
│  ─────── ✦ ───────          │
│                             │
│  ┌───────────────────────┐  │
│  │  MONTHLY              │  │  ← Card: #1A1A3E bg
│  │  ⭐ 500 Stars/month   │  │     Gold text, centered
│  │  ~$6.50               │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │  ANNUAL ★ BEST VALUE  │  │  ← Card: gold border highlight
│  │  ⭐ 5,000 Stars/year  │  │     "BEST VALUE" badge
│  │  ~$65 (2 months free) │  │
│  └───────────────────────┘  │
│                             │
│  ─────── ✦ ───────          │
│                             │
│  💎 Also available in       │  ← Inter, 13px, muted lavender
│  USDT / TON / BTC           │
│                             │
│  OLIVIA ARCANA ✦            │
│  [Gold border, 2px]         │
└─────────────────────────────┘
```

### Image Generation Prompt
```
Premium subscription pricing card for astrology bot, 1080x1350px vertical, dark cosmic gradient background, thick gold border, "OLIVIA ARCANA VIP" header in gold, feature list with celestial icons, two pricing tier cards (monthly and annual with "BEST VALUE" badge), gold on dark luxury design, compelling premium offer layout, celestial noir style --ar 4:5
```

---

## Asset 12: Telegram Stories / Highlight Covers

**Dimensions:** 1080 x 1920 px (9:16 vertical)
**Where used:** Telegram channel stories, Instagram story highlights

### Set of 5 Story Templates

**Story 1: Daily Zodiac Story**
```
[Full-screen dark gradient bg]
[Large zodiac glyph, 400px, centered, gold]
[Sign name below, Playfair 48px, gold]
[2-3 line teaser from today's reading, Inter 22px, warm ivory]
[Swipe up → Full reading on channel]
[OA logo, bottom center, small]
```

**Story 2: Tarot Reveal Story**
```
[Full-screen dark bg]
["Today's Card" label, top, small gold text]
[Tarot card image, centered, 500x875px]
[Card name below, Playfair 36px, gold]
[1-line interpretation, Inter 20px, warm ivory]
[OA logo, bottom center]
```

**Story 3: Poll/Engagement Story**
```
[Full-screen dark bg with star field]
[Question in large text: "Which sign is having the BEST week?"]
[Playfair 36px, gold, centered]
[4 zodiac sign options below as styled buttons]
[OA logo, bottom center]
```

**Story 4: VIP Promo Story**
```
[Full-screen gradient bg]
["Your personal reading is waiting" — Playfair 32px, gold]
[Sample reading snippet (3 lines) — Inter 20px, warm ivory]
[Blurred/faded text below suggesting more content locked]
["Unlock VIP →" CTA button visual, gold]
[OA logo, bottom center]
```

**Story 5: Transit Alert Story**
```
[Full-screen dark bg]
[Planet symbol (e.g., ♄ Saturn), 200px, gold, centered]
[Transit name: "Saturn enters your 10th House" — Playfair 28px, gold]
["Major career shifts ahead for [signs]" — Inter 20px, warm ivory]
["Get your personal impact report →"]
[OA logo, bottom center]
```

### Highlight Cover Icons (5 circles, 400x400px each)
Small circular icons for Instagram/Telegram story highlights:

1. **Daily** — Crescent moon icon, gold on void black
2. **Tarot** — Single tarot card icon, gold on void black
3. **VIP** — Star icon, gold on void black
4. **Transit** — Planet orbit rings icon, gold on void black
5. **About** — OA monogram, gold on void black

### Image Generation Prompt (Story 1 example)
```
Astrology story template for Telegram/Instagram, 1080x1920px, 9:16 vertical, dark cosmic background, large gold Scorpio zodiac symbol centered, "SCORPIO" in large gold serif font below, 2-3 lines of horoscope teaser text in warm white, "Swipe up for full reading" at bottom, small gold "OA" logo, celestial noir luxury style, immersive full-screen design --ar 9:16
```

---

---

## Asset 13: Birth Chart Identity Card (Viral Feature)

**Dimensions:** 1080 x 1080 px
**Where used:** Generated on-demand per user, shared on social media as identity content

### Layout

```
┌─────────────────────────────┐
│  [Gold border, 2px]         │
│  [Star field gradient bg]   │
│                             │
│  ✦ COSMIC IDENTITY ✦       │  ← Cormorant Garamond, 16px, gold
│                             │
│       {User Name}           │  ← Playfair Display, 36px, gold
│                             │
│  ─────── ✦ ───────          │
│                             │
│  ☉ SUN                      │  ← Cormorant Garamond, 14px, muted lavender
│     SCORPIO ♏               │  ← Playfair Display, 28px, gold
│                             │
│  ☽ MOON                     │
│     PISCES ♓                │  ← Playfair Display, 28px, slate blue
│                             │
│  ↑ RISING                   │
│     LEO ♌                   │  ← Playfair Display, 28px, mars red
│                             │
│  ─────── ✦ ───────          │
│                             │
│  DOMINANT ELEMENT: WATER 💧 │  ← Inter, 14px, warm ivory
│                             │
│  "A fire that burns beneath │  ← Cormorant Garamond italic, 18px
│   still water"              │     Warm ivory, Claude-generated tagline
│                             │
│  OLIVIA ARCANA ✦            │  ← Watermark, small
│  oliviaarcana.com           │  ← URL for attribution
│  [Gold border, 2px]         │
└─────────────────────────────┘
```

### Image Generation Prompt
```
Cosmic identity card for astrology, 1080x1080px, dark cosmic background with gold star particles, thick gold border, "COSMIC IDENTITY" label, large name in gold serif, three zodiac sections (Sun Moon Rising) with glyphs and sign names, dominant element indicator, poetic cosmic tagline in italic, "OLIVIA ARCANA" watermark at bottom, shareable social media card, celestial noir luxury design --ar 1:1
```

---

## Asset 14: Zodiac Roast Result Card (Viral Feature)

**Dimensions:** 1080 x 1350 px (vertical)
**Where used:** Delivered after /roast command, designed to be screenshotted and shared

### Layout

```
┌─────────────────────────────┐
│  [Gold border, 1px]         │
│  [Dark bg]                  │
│                             │
│  ✦ COSMIC ROAST ✦          │  ← Cormorant Garamond, 18px, gold
│                             │
│       ♏ SCORPIO             │  ← Large glyph + name, gold
│                             │
│  ─────── 🔥 ───────         │  ← Fire emoji divider
│                             │
│  [3-4 paragraphs of the    │  ← Inter, 17px, warm ivory
│   roast text. Brutally      │     Left-aligned, generous margins
│   honest, funny, specific   │
│   to their actual chart.    │
│   References real planetary  │
│   positions that make       │
│   their shadow side worse.  │
│   Ends with a redemption    │
│   line.]                    │
│                             │
│  ─────── ✦ ───────          │
│                             │
│  Think you can handle YOUR  │  ← Inter 500, 15px, slate blue
│  cosmic truth?              │
│  → @OliviaArcanaBot         │
│                             │
│  OLIVIA ARCANA ✦            │
│  [Gold border, 1px]         │
└─────────────────────────────┘
```

---

## Production Notes

### Asset Generation Priority
1. **Must-have for launch:** Assets 1-3 (channel banner, welcome card, daily horoscope template)
2. **Must-have for monetization:** Assets 6, 11 (VIP CTA, pricing card)
3. **Must-have for engagement:** Assets 4, 5, 10 (tarot daily, weekly, re-engagement)
4. **Must-have for premium features:** Assets 7, 8, 9 (birthday, compatibility, eclipse)
5. **Nice-to-have:** Asset 12 (stories — can launch without these)

### Template System
Assets 3, 4, 5 are templates that get regenerated daily/weekly with fresh content. The layout stays fixed; only the text content changes. Build these as programmatic templates (Python + Pillow or HTML/CSS → screenshot) rather than hand-designing each day.

### Localization
All text-containing assets need 8 language variants. The layout stays identical; only the text strings change. Use the copy tables provided in each asset spec. RTL layout adjustment needed for Arabic (mirror the layout horizontally, right-align text).
