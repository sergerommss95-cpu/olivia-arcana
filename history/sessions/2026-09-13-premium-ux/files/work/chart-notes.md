# Olivia Arcana · Birth-chart audit and implementation

Scope: `/chart`, a new chart-specific `NatalAtlas` component, scoped styles, and pure geometry utilities/tests. Primary source: SESSION_2026-09-13.md; confirmed against the fetched repository and `website/DESIGN_BRIEF.md`, `website/.impeccable.md`, and `website/AGENTS.md`. Read the installed Next 16.2.2 client-component and CSS-module documentation before implementation. No calculation library, city/timezone logic, shared birth form, paywall contract, or storage API was modified.

## Findings, ranked by impact

Baseline references below refer to the repository HEAD before this upgrade (`git show HEAD:website/src/app/chart/page.tsx`), not the rewritten page.

| Priority | Evidence in baseline | Customer consequence | Implemented response |
|---|---|---|---|
| P0 · correctness | `/chart/page.tsx:294`, `:379`, `:881`: zodiac ring rotates independently every 240 seconds while planetary longitudes stay fixed | A planet visually changes zodiac sector without the birth data changing. This undermines the instrument itself. | One fixed, counterclockwise projection for signs, house cusps, planet anchors and aspect endpoints. ASC appears left; untimed view uses zero Aries left. No perpetual ring animation. |
| P1 · accessibility | `/chart/page.tsx:288`, `:382`: chart declared a single image with click-only SVG groups, no keyboard interaction or names | Keyboard and assistive-technology users cannot operate the visible wheel directly. | Group-labelled SVG; named, focusable planet buttons with Enter/Space, pressed state and reading relationships. Equivalent named HTML controls are 60px high and at least 44px wide on the verified mobile layout. A real positions table supplies column and row headers. |
| P1 · legibility | `/chart/page.tsx:379`, `:400`: every planet occupies the same radius at exact longitude, with 10-unit discs | Close conjunctions obscure one another and make selection difficult. | Separate labels only, retain exact anchors, connect them with leader lines. Circular separation handles conjunctions across zero Aries. |
| P1 · interpretation | `/chart/page.tsx:355`, `:511`: wheel truncates to 15 aspects; selected reading truncates to 5 | An aspect mentioned in the inspector may be absent from the wheel; arbitrary omissions look like missing data. | Show all relationships for the selected planet, a deliberate all-aspects option, and direct synchronization between a chosen relationship, both endpoints, its chord and its explanation. No arbitrary slice limits. |
| P1 · unknown birth time | Baseline hides rising/houses but never displays the calculation’s `moonSignNote`. `src/lib/natal-chart.ts:605` already computes a Moon-ingress caveat | A provisional noon Moon sign looks definitive, especially on a date with a sign change. | Visible partial-chart notice, local-noon label, Moon-sign asterisk and caveat, repeated in the Moon chapter; houses/ASC/MC remain omitted. |
| P2 · first useful response | `/chart/page.tsx:169`, `:252`, `:261`, `:529`: artificial 1.3-second delay followed by multi-second control reveals and an empty reading panel | Customers wait and then face a blank interpretation, despite a fully computed chart. | 80ms yield to paint the busy state, then compute; default Sun chapter is immediately useful. 900ms ink arrival never gates controls. |
| P2 · hierarchy/mobile | `/chart/page.tsx:763` sets mobile signature labels to 0.52rem; cards and content are narrow/fixed | A visually intricate wheel is paired with text that is difficult to read and little guidance. | Wider editorial composition; three useful introductory chapters; stacked signature rows and full-width wheel on small screens; explicit read/return controls connect the mobile wheel with the explanation. |

## Design rationale: from a diagram to a living atlas

The chart now follows one reusable sequence: **orient → select → trace → interpret**. Its engraved rules and gilt selection inherit the existing deck and personal-almanac language. Meaning determines motion: a chapter change inks in its text; a relationship reveals its geometry; the zodiac itself remains still. The larger title, open editorial margins, plain-language captions and selective gilt keep the data legible rather than layering additional glow or effects on it.

The initial three signatures are working controls, not summary decorations. Sun introduces identity, Moon introduces emotional life, and Rising introduces the orientation of the wheel. Planet meanings and sign/house interpretations reuse the existing content. Aspect explanations are concise descriptions of traditional astrological relationships and are explicitly distinct from calculated positions.

The accessible positions table and full planet index remain available. Selecting a relationship from table view returns the visualization to the atlas. On mobile, “Read [planet]” and “Trace this relationship on the atlas” move focus and scroll directly between the two related areas without a forced animated journey.

## Astrological integrity

- `src/lib/natal-chart.ts`, `src/lib/celestial.ts`, `src/lib/cities.ts`, `src/lib/user-store.ts` and the shared `BirthDataForm` are unchanged.
- Projection changes only the presentation. All zodiac sectors, whole-sign house cusps, ASC/MC markers, exact planet anchors and aspect endpoints use the same `wheelAngle` function.
- Label collision resolution receives a separate array, returns a new array and never changes input longitudes. Aspect chords use original longitudes, never display-label angles.
- A whole-sign cusp is not the same as the exact ascendant degree. They are drawn separately and this distinction is explained in the Rising chapter.
- Existing unknown-time behavior supplies local noon. The UI now says this clearly. It does not claim that untimed planetary degrees or aspects are independent of the hour.
- The existing Moon-ingress flag is surfaced; the noon Moon interpretation remains visible with the qualification. This work does not replace the underlying approximation with a time range or invent an ascendant.
- Current library types expose an existing mismatch: `NatalChart` requires houses/angles even though an untimed runtime result omits them. The component checks `timeKnown !== false` and the presence of the ascendant before accessing these fields. A broader type-model migration is separate work.

## Research informing these decisions

[W3C SVG accessibility support](https://www.w3.org/TR/SVG/access) documents focus, group semantics, keyboard events and relationships between controls and controlled content. Applied here to the wheel and synchronized reading.

[W3C SVG scripting and interactivity](https://www.w3.org/TR/SVG/interact.html) requires explicit support rather than relying on browsers to infer focus for scripted shapes. Applied as focusable SVG buttons with visible focus and explicit keyboard handling.

[WCAG 2.2 Keyboard guidance](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html) supports an equivalent keyboard path for every pointer action. Applied through both the directly operable SVG and native named controls.

[Astrodienst’s chart-type overview](https://www.astro.com/faq/fq_fh_owtype_e.htm) presents chart wheels alongside tables and aspect information. The transferable product principle is complementary visual and tabular access. Its default Placidus configuration was not copied: Olivia’s existing whole-sign system is preserved.

## Verification completed

1. `node --test src/components/chart/natal-atlas-geometry.test.mjs`: **6 tests pass**. Tests assert the expected 0/90/180/270 coordinate directions; arbitrary ASC orientation; shared rays for signs, houses and planets; geometric chord lengths for conjunction, sextile, square, trine and opposition; immutable anchors when conjunction labels move; zero-Aries wrap; unchanged already-spaced labels; and **2,000 deterministic crowded-sky fixtures** with no label overlap. Node 25 emits only its existing typeless-ESM package warning; no package configuration was changed for a test.
2. `npx tsc --noEmit --pretty false`: **passes**.
3. Focused ESLint on the chart page, new component, geometry and tests: **passes**.
4. Real-engine static rendering check in `work/chart-runtime-check.cjs`: timed 1995-06-15 London gives ten anchors, houses, ASC/MC and a default Sun reading. Untimed 1995-06-02 London includes the Moon-ingress warning and local-noon label, and no houses or angle marks. Rendering leaves both complete chart objects unchanged.
5. Root-agent browser verification: **2000-01-01, London, 12:00** renders Sun Capricorn, Moon Scorpio and Aries rising. Sun–Saturn trine highlights and displays its explanation.
6. Root-agent browser verification at **390×844**: wheel and named controls remain clear. Untimed **1995-06-02 London** resolves UTC+1; houses/ASC/MC remain absent; Cancer→Leo Moon caveat and local-noon estimate display correctly.

## Remaining punch-list

- **P1 before broad release:** real screen-reader walkthrough (VoiceOver/Safari and NVDA/Firefox or Chrome), keyboard-only end-to-end form → chart → relationship → new chart, and 200% zoom. Implemented semantics and browser checks do not constitute a formal accessibility audit.
- **P1 before broad release:** regression fixtures for the shared engine around historical timezone reforms, DST ambiguity/nonexistent times, high latitude and unknown-time Moon ingress. This presentation patch preserves the engine rather than asserting that every existing calculation edge case is independently certified.
- **P2:** preserve form edits on calculation errors; the current shared form remounts after an error as it did before. Reusing a last-submitted form model should be addressed with the shared birth-form owner.
- **P2:** ranged visualization for unknown-time Moon motion, if desired; it must derive a real daily longitude interval and keep interpretations explicitly provisional.
- **P2:** a print/export edition and richer cross-planet narrative can build on the fixed atlas. They should reuse computed facts and avoid inventing certainty.

## Files delivered

- `website/src/app/chart/page.tsx` — clear entry, preserved computation, reduced delay, focus on result, new atlas integration.
- `website/src/components/chart/NatalAtlas.tsx` — coherent exploration, storytelling, real table, uncertainty and methodology.
- `website/src/components/chart/NatalAtlas.module.css` — responsive engraved presentation and reduced-motion behavior.
- `website/src/components/chart/natal-atlas-geometry.ts` — shared fixed projection and label separation.
- `website/src/components/chart/natal-atlas-geometry.test.mjs` — executable geometric regression assertions.
