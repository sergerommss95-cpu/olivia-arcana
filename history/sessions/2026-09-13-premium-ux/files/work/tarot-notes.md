# Tarot audit and implementation notes

Primary evidence: `SESSION_2026-09-13.md` and the matching current repository source; design context read from `.impeccable.md`, `DESIGN_BRIEF.md` and `DESIGN.md`. This work deliberately preserves the Arrival deck artwork and mathematical spread coordinates.

## Ranked findings and before/after decisions

| Impact | Evidence before | Improvement implemented | Reason |
|---|---|---|---|
| P0 — reading integrity | URL restoration filtered invalid indices then accepted a count; duplicate indices were legal. Desktop card indices 7–10 could outlive the shorter mobile pool and refer to missing cards after resize. | Strict shared-draw parser rejects duplicates, blank/noninteger/out-of-range tokens and wrong counts. The active pool always includes selected indices. | A shared reading must retain its exact cards and reversals across device sizes. |
| P0 — state integrity | The 2.4-second preparation timeout was not stored or canceled. Starting over while it ran could reopen an empty spread. Router updates and timers also lived inside a React state updater. | A sitting owns one cancellable transition. Selection side effects run outside state updaters. Reset/unmount cancel preparation or final-reveal callbacks. | Prevent phantom transitions and preserve restart reliability. |
| P1 — mobile completeness | Mobile arc radius 800 and span .35π positioned outer cards ~418px from center, before card width. The fan was clipped inside a fixed viewport. Desktop fixed radius 1300 was also too wide at common desktop sizes. | Mobile now has a numbered, horizontally scrollable touch tray, clear selection/deselection state and native scrolling. Desktop fan radius derives from available viewport width. | Every choice is reachable. The complete spread remains visible in its true formation after selection. |
| P1 — first impression | Entry was a centered title, two lines and a pill in a large blank field. | An asymmetric frontispiece displays actual High Priestess, Star and Sun deck specimens beside a large editorial title, useful CTA and three-part process rail. | Show the product's own distinctive carved artwork before asking for a commitment. Specimens are clearly labeled as studies, not the forthcoming draw. |
| P1 — choreography | All cards turned together after an imposed listening pause. The full sheet then appeared; individual turning had no deliberate input. | The 850ms arrangement beat leads to a true next-card sequence, card-by-card activation, current position/name/keywords, progress, and an always-available Reveal all action. The final card leads into the complete reading. | Motion expresses meaningful changes: chosen → placed → turned → interpreted. The reader controls pace. |
| P1 — equal information | Face-down controls included each card's hidden name in their accessible label. The face's text remained in the accessibility tree. | Anonymous numbered face-down labels, hidden decorative face contents, localized live progress/reversal announcements, focus-visible and focus/hover equivalence. | Keyboard and screen-reader users receive the same information at the same point as visual users. |
| P1 — reading/loupe usability | The result's name grid was static; tiny dense spread targets were the main route to the loupe. The dialog declared modal status without trapping or returning focus. | The result index is made of full-size inspect buttons. Dialog focus enters on Close, loops within controls, and returns to the originating card or index. Arrow navigation and zoom remain available. | Small chart-like formations retain equivalent accessible controls. The loupe behaves like a complete modal. |
| P2 — responsive hierarchy | Spread descriptions vanished on mobile, leaving names/counts to explain differing products. Nested glass surrounded the reading prose. | Descriptions remain at a readable small-screen size; section labels gain contrast; the reading uses editorial rules and a quiet synthesis field. | Retain decision-making context and improve reading hierarchy. |
| P2 — performance and agency | Selected or *any result-state* cards fetched art, including unchosen cards. Audio initialized during mount. Some animations ignored reduced-motion settings. | Art loads only for selected cards; AudioContext starts after user interaction; MotionConfig plus direct spring jumps, no drift/3D drag under reduced motion, optional reveals, and reduced-motion loupe/reading behavior. | Avoid unnecessary images/audio setup and preserve full outcomes with less motion. |
| P2 — saved reading | The URL encoded readings, but the result supplied no explicit copy action. | Copy reading link, clear success feedback, and a manual-address fallback. | Make existing shareability discoverable without changing URL contracts. |

## Scope and invariants

Changed only `/oracle` and its components. The tarot database, Ukrainian deck, spread definition coordinates, reading synthesis, card reversal meanings, seeded shuffle algorithm and reversal probability remain unchanged. The shuffle/orientation routines were extracted verbatim into `ritual.ts` so their contracts can be regression tested. The full deck is still 78 cards; the smaller visible hand is sampled from that shuffled deck, as before.

No asteroid, house, timezone, ephemeris, transit or astrological interpretation logic changed here. No animation library or dependency was added. No deployment was performed.

## Verification

- `node --test src/components/oracle/ritual.test.mjs`: **6/6 passed**. Covers fixed seed cards and reversals, full-deck uniqueness and source immutability, pool resizing, long-spread link restoration, invalid/duplicate URLs, reset cancellation during preparation/final reveal, replacement transitions and zero-delay reduced-motion timing.
- TypeScript `tsc --noEmit`: passed after the structural edits and helper extraction. Root can include this in the final integrated check.
- Focused ESLint over all changed tarot components, helper, tests and oracle page: pending final poll after one React-compiler inline-factory correction.
- Root owns live browser QA. Requested scenarios: first impression; mobile long-spread tray; desktop fit; individual turning + Reveal all; reset during preparation; valid/invalid URLs; loupe Tab/Shift-Tab/Escape; reduced motion.

## Remaining verification limits / follow-up

Automated timer tests exercise the same transition helper used by the component; browser QA is still needed to verify the visual state of an interrupted animation. Browser checks should cover 390×844 and short landscape views, because the existing route is an intentionally fixed-height theater with internally scrolling reading content. Dense spreads still use faithful small formation cards, with larger controls supplied by the reveal action and result index. A full VoiceOver session and real iOS pinch/gyro session are separate from desktop automation.
