# Olivia Arcana — brand and design rules

Current as of 28 September 2026. This page replaces the astrology-era documents `website/DESIGN.md`, `website/DESIGN_BRIEF.md` and `docs/DESIGN_SYSTEM.md`, which are kept only as history. When a rule here and the product disagree, the approved product wins and this page should be corrected.

## What Olivia is

A personal practice of tarot. You bring a question, choose your own cards from the full 78-card deck, turn them yourself, read what they suggest (with an optional AI-assisted reading of your question), and keep it in a private almanac to return to.

It is not fortune-telling or a human psychic. It does not predict, promise or count streaks.

**Olivia Astrology** (owner decision, 28 September 2026) is the second practice, read the same way as the cards: reflection and self-knowledge, never forecasts. It lives at `/astrology/` and `/uk/astrology/`:

- Every sign and planet is shown with its Major Arcana card (Golden Dawn correspondences, as in `tarot-cards.ts`), so the sky and the deck speak one language.
- The birth chart is computed on the reader's device (`website/src/lib/astrology/chart.js`, checked against Swiss Ephemeris). Birth details stay in the browser and are kept only if the reader asks.
- Whole-sign houses. No horoscopes, compatibility scores, fate, luck or "what's coming". Outer planets are described honestly as generational.
- Astrology is free. (Paddle does not allow horoscopes; nothing here is sold as one.)

**The promise, in one line**

- EN: *Bring a question. Choose your cards. Keep what you notice, and return to see what changed.*
- UK: *Поставте запитання. Оберіть карти. Збережіть те, що помітили, і поверніться, щоб побачити, що змінилося.*

## Identity assets (preserve exactly)

| Asset | Source |
|---|---|
| The 78-card deck: ivory relief on lapis | `experience/work/hero-v12/assets/public/cards-portal/`, `experience/work/olivia-product/assets/minor-arcana/` |
| Olive Lattice card back | `experience/outputs/olivia-card-back.webp` |
| Approved hero motion (96 s) | `experience/outputs/olivia-approved-motion-2026-09-24.html`; `hero.js` is hash-locked |
| Wordmark | "Olivia" in Cormorant Garamond, "ARCANA" in small tracked capitals |

No logo or app icon has been chosen. The current icon files (`website/public/icon-*.png`, `apple-touch-icon.png`) are the earlier violet-and-bright-gold olive sprig; replace them once a mark is approved. Do not promote the rejected sculptural emblem to a logo.

## Colour

| Role | Value |
|---|---|
| Ground (lapis) | `#0b192a`; deeper surfaces `#091725`, `#071522` |
| Lifted surface | `#10273a`, `#12283d` |
| Ink (ivory) | `#ede4d2` |
| Muted text | `#c6c2b7`, `#b7c4ce` |
| Restrained gold | `#b69a65` (accents, rules, small marks — never large fills) |
| Hairline | `#d8c49c4a` |
| Primary action | gradient `#f2e5c8 → #dccaab`, text `#183043` |

Do not use violet or indigo grounds (`#10134d`, `#0f1240`), bright gold (`#d4af37`), copper, or black.

## Type

- Display and card names: Cormorant Garamond (Latin and Cyrillic).
- Body and interface: DM Sans for Latin; Onest for Cyrillic, declared in the same font stack so Ukrainian never falls back to a system face.
- Small tracked capitals for eyebrows and labels. Keep body and interface text at 12 px or more on phones.

## Actions

One vocabulary everywhere (the v4 rules):

- **Primary:** ivory filled, 14 px radius, at least 44 px tall — "Begin a reading", "Keep this reading".
- **Secondary:** filled lapis rows.
- **Disclosure:** filled row with a +/− chip.
- Saved state shows ✓ and a quieter surface; an unkept reading is never "updated".
- No animated perimeter frames, no outlined gold buttons, no underlined text used as a primary button.

## Motion

- Use the tokens in `experience/work/olivia-product/motion-tokens.css`: `--ease-settle` (arrivals), `--ease-glide` (longer travel), `--ease-control` (press and hover), and the press, control, arrive and ritual durations.
- A card is revealed once, never with a double-back flip. After it turns, one soft pass of light crosses the face.
- Pages inside the product fade in (opacity only). The deck, card flights and the hero keep their own choreography.
- Reduced motion makes everything instant. The hero keeps its own authored timing and is not governed by these tokens.

## Voice

- **English:** warm, precise and reflective. A card "invites", "draws attention to", "asks". Never predict, promise or warn; no "the universe", fate or luck. Card content uses British spelling.
- **Ukrainian:** always the formal «ви», with the same stance, in natural Ukrainian rather than calques. Use «запитання» for the reader's question and the typographic apostrophe ’. Full guide: `experience/work/olivia-product/UK-VOICE.md`.
- **AI:** a personal reading says where it is shown that it was prepared with AI and can be mistaken. Never imply a person wrote it.
- **Safety:** when a question speaks of self-harm or danger, the reading shows local crisis lines (`support-note.js`), whatever the AI does.

## Surfaces

- The homepage (the reading experience) is the reference for every other page.
- Inner pages use `AlmanacShell` or `LegalShell` with the shared `AlmanacMasthead`.
- Link previews: `website/public/og-image.jpg` and `og-image-uk.jpg`, rendered from `website/scripts/og/og.html`.

## Decisions still open (owner)

The logo and app icon; what happens to the older astrology pages (signs, compatibility, daily, synastry, transits, timing, cosmos), which predate Olivia Astrology; the paid offer and payment provider; how people are invited back (email, Telegram or push); and whether a named editor stands behind the readings.
