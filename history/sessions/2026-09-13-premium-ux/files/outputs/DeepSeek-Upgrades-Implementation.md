# Olivia Arcana — the DeepSeek ideas, rebuilt

15 September 2026 · Source `1aee01e223209a84557d57c5e0d0073d84180f74`

## Assessment

The two concepts are worth developing: **7/10 for their ideas**. Their strongest choices are a card treated as an object and a sky treated as an engraved instrument. Customer readiness is much lower: **2/10 for the supplied tarot implementation, 3/10 for the supplied sky implementation**, assessed subjectively against the working product's requirements. The first visual/source pass estimated around 4/10; the deeper review established additional timing, cancellation and coordinate-catalog faults.

The originals were opened in the browser and their source inspected. The independent source review is in [DeepSeek-Prototype-Review.md](./DeepSeek-Prototype-Review.md), including exact source lines and primary references. Ratings are judgments, not benchmark results. No literal tenfold quality, award or frame-rate improvement is claimed.

## Working previews

- [The collection](http://127.0.0.1:3002/studies/)
- [The Living Tarot](http://127.0.0.1:3002/studies/tarot/)
- [The Celestial Atlas](http://127.0.0.1:3002/studies/sky/)

These are implemented routes in the existing Olivia Arcana project. They use its artwork, typography, card data and astronomy geometry. They are local, marked noindex, and have links back to the established Oracle and birth chart. The original HTML attachments remain unchanged. The signature homepage Olivia zoom, levitation and water sequence remain unchanged in this pass.

## Before / after, ranked by impact

| Priority | Supplied prototype | Implemented improvement | Why it matters |
|---|---|---|---|
| 1 | Tarot shuffle moves meshes without reordering cards. | A fresh cryptographic seed drives the existing 78-card deterministic shuffle and independent reversal stream. | The ritual now changes the actual reading and preserves its identity during interaction. |
| 2 | A double-sampled animation clock and invalid object comparison undermine movement and hover. | Transient CSS/Motion choreography with separate hover and keyboard state, shared card travel, a deliberate flip, and no continuous 3D renderer. | Motion describes selection and reveal, and settles between actions. |
| 3 | Tarot ends at a generated name/number face. | Olivia's real illustrations, one- or three-card spreads, position names, meanings, upright/reversed interpretation, an intention prompt and a next step. | The experience delivers reflection after the visual gesture. |
| 4 | Invalid dates can silently become a different day's sky. | Strict calendar, leap-day, coordinate and UTC-minute validation; errors preserve the last valid observation. | The displayed sky corresponds to what was accepted, with no silent rollover. |
| 5 | Anonymous fixed-epoch stars, a duplicate and an unverified northern entry. | Existing named bright-star catalog and Astronomy Engine geometry: epoch transformation, topocentric planets and Moon, geometric horizon, look-up orientation. | The study uses the reviewed calculation pipeline rather than a new approximate formula. |
| 6 | A diagram with little explanation. | Selectable Sun, Moon and planets, altitude/direction, horizon state, Moon phase, visibility context and a numerical table. | Each selected light becomes understandable. |
| 7 | Desktop-pointer assumptions and unreachable canvas cards. | Named buttons, keyboard browsing across all 78 cards, focus handoffs, pager controls, touch selection, reduced-motion outcomes and mobile stage navigation. | The interaction works beyond a mouse demo. |
| 8 | Similar dark-purple backgrounds and generic generated faces. | Warm paper, lapis, gilt, asymmetrical editorial type, real carved artwork, a quiet tabletop and a finite circular sky instrument. | Both experiences share Olivia's own materials without becoming decorative wallpaper. |
| 9 | Controls and result compete for attention. | Optional tarot question opens on request; first-screen actions are explicit; valid sky submissions return to the updated instrument. | People can reach the next action and see its result. |

## The implemented system

### Living Tarot

The reading moves through intention → shuffle → choose → turn → reflect. The fan shows a browseable hand of 13 cards, with all 78 positions accessible by paging or the arrow/Home/End keys. A card's seeded identity and orientation are fixed for the sitting. Its illustration is loaded only when selected; the entire face deck is not uploaded to GPU textures at entry.

Cards travel into named positions, then wait for the reader to turn them. The final reveal hands keyboard focus to **Read your cards** after the flip settles, unless the user has moved focus elsewhere. Revealed controls use `aria-disabled` without causing the browser's native disabled-button blur. Restart cancels preparation, clears the reading, returns to setup and focuses Begin. A stale shuffle completion cannot reopen an abandoned sitting.

The reading section uses a warm-paper editorial layout with each position's interpretation and a reflection prompt tied to the chosen intention. English and Ukrainian copy use the existing card translation source. The studies hub and sky study currently use English.

### Celestial Atlas

This is an observer's sky, with north up, east left, the zenith at the centre and the geometric horizon at the edge. It is explicitly distinguished from the site's astrological birth chart. The default Kyiv observation is labeled as an example.

The user can set a UTC date and minute, choose a city or enter coordinates, change chart layers, select any of the ten bodies and explore an hour earlier/later. Time controls preserve unfinished form edits. Applying a valid form focuses and scrolls to the updated chart; invalid input stays at the form with an alert.

Only label positions can be displaced. On phones the selected body's larger caption takes priority; the full body directory and numerical table remain available. Below-horizon bodies are described without false above-horizon markers. Daylight and twilight are called out.

The calculation notes disclose the selected star catalog, lack of individual stellar proper motion, geometric rather than refracted horizon, sea-level observer and approximate Moon icon. The icon expresses illuminated fraction and waxing/waning; it does not claim the local tilt seen by an observer. This route uses explicit UTC rather than guessing a civil time zone. The established birth-chart form retains its own time-zone and unknown-time workflow.

## Verification

- **Production build passed**, including all three new static routes.
- **41 automated checks passed**: the 30 established chart/tarot/audio checks, 5 new sky-input/label checks and 6 new sitting/state/cancellation checks.
- Focused lint and whitespace checks passed.
- Production-browser checks covered the three-card draw/reveal/interpretation, reversed artwork, one-card flow, card 78 via keyboard, final reveal focus, reading-section focus and clean restart.
- Desktop entry was inspected at 1280 × 720 and the finished spread/reading at 1280 × 800. Phone layouts were inspected at 390 × 844 and 320 × 667.
- Sky checks covered hour exploration, Saturn selection and announcement, Sydney daylight, Tokyo horizon changes, a rejected latitude of 100°, layer toggling and valid-submit focus/scroll.
- The initial development sky hydration mismatch was corrected by rendering its SVG title as a single string. Final production checks showed no captured browser errors.
- At 320px, both tested study routes reported zero horizontal page overflow and zero canvas elements. The rendered tarot artwork reported no broken images.

Build/test/lint output is saved under `outputs/verification/studies-*`. These are local checks, not a physical-device or deployed field-performance audit. Reduced-motion paths were checked in source and state tests; no OS-wide motion preference was changed during browser QA. No new animation or astronomy package was installed.

## Remaining work, ranked

1. **Evaluate these studies with customers before replacing the main service flows.** The existing Oracle still owns its broader spread catalog, sharing and established service behavior; the study is a complete one/three-card reflection experience, not a migration of every Oracle feature.
2. **Integrate accepted interaction choices into the main services deliberately.** Reuse the state/data contracts and preserve sharing, payment gates, localization and saved-reading behavior. The homepage arrival needs no replacement to use these ideas.
3. **Complete localization and physical-device validation.** Test touch hit areas and sustained interaction on Safari/iPhone and midrange Android, plus screen readers and reduced-motion settings.
4. **Measure deployed loading and interaction performance.** The new routes avoid continuous renderers; that does not establish an FPS or Core Web Vitals guarantee for the entire site.
5. **Keep the existing launch gates visible.** Payments/accounts, translation completeness, dependency review and end-to-end deployed service checks remain outside this study pass.

## Source delivery

[Olivia-Arcana-DeepSeek-Upgrades-Code.md](./Olivia-Arcana-DeepSeek-Upgrades-Code.md) contains every complete file changed in this pass. [Olivia-Arcana-Complete-Code.md](./Olivia-Arcana-Complete-Code.md) contains the cumulative source changes from the earlier upgrade through this pass. Both require the existing repository, dependencies and artwork; they are not standalone HTML files.
