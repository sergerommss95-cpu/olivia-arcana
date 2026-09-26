# Olivia Arcana — premium product audit and redesign

**Latest implementation:** the creator's motion/transition feedback is addressed in [Motion and Design Upgrade](Motion-and-Design-Upgrade.md). That addendum supersedes earlier decorative-background and motion scheduling descriptions.

14 September 2026 · Implementation review against September 14 upstream `7ba2cfa`

## Outcome and scope

The proposed design is a **living engraved atlas**: the existing carved deck and plotted sky become the recognizable objects of the product. Its three acts are **arrive, reveal, understand**. The implementation combines the September 14 full-deck Riffle and Flattened Sky with immediate homepage entry, staged tarot interpretation, an accessible natal atlas, native navigation and one optional sound system.

This is a local implementation and review package. It has not been deployed. “Customer-ready” requires more than visual polish: production service configuration, supported-device testing and measured performance remain explicit launch gates below. No conversion uplift or field performance score is claimed.

**14 September 2026 correction — Arrival restored:** the user identified that making the opening opt-in had lost the default experience of Olivia zooming and levitating over the water. The original scroll-driven sequence is restored by default, with a full-screen stage and the original pacing of 3.2 viewports on desktop and 2.5 on mobile. Direct Tarot and Birth Chart actions remain immediately available. Desktop (1280×720) and mobile (390×844) normal scrolling have been visually verified, together with pause, chapter navigation and skip. The production build passes.

## Implementation sources

- `SESSION_2026-09-13.md` is the original supplied architecture and implementation record.
- The newer shared conversation supplied `SESSION_2026-09-14.md`, including THE RIFFLE, THE FLATTENED SKY, the Ephemeris motion spine and THE PARLOR.
- The repository was inspected at `06f6be7`, then refreshed to `7ba2cfa`. Local changes were checkpointed before integrating the newer work. This avoids replacing the newer signatures with the earlier implementation.
- The shared chat’s review was treated as a set of hypotheses. Source inspection confirmed the card-flight handoff, pointer-cancel ambiguity, simplified sky coordinates, reduced-motion hero return problem and overlapping motion/audio systems.
- The live site and local implementation were visually reviewed separately. Reference sites below supply design mechanisms, not measured competitors’ usability scores.

## Findings ranked by customer impact

| Rank | Severity | Verified problem and consequence | Implemented response | Status |
|---|---|---|---|---|
| 1 | P0 | New dome derives observed sky from zodiac longitude alone; this loses the body’s true latitude and observer geometry. | Compute the observational dome from Astronomy Engine’s topocentric coordinates; retain the existing natal calculation model and exact zodiac anchors. Label daytime stars and schematic below-horizon placement. | Implemented; numerical and browser verification |
| 2 | P0 | Picking a card immediately hands it to the parent; the original node is hidden before its flight ends. Cancelled pointer gestures can also commit a card. | Flight owns its node until landing; pull commits on release; pointer cancellation returns it; explicit draw controls and strict shared-reading parsing preserve identity/orientation. | Implemented; focused verification |
| 3 | P0 | Separate sound engines can disagree about mute state and attempt mobile playback before an AudioContext finishes resuming. | One engine, one persisted preference, visible enable/mute/resume control and cancellation-safe async activation. | Implemented; lifecycle regressions |
| 4 | P1 | The original first screen gives the scene more room than the useful actions; mobile navigation hides services. An initial redesign also removed the default scroll-driven Arrival. | Immediate Tarot and Birth Chart actions, two-line headline and complete More navigation, alongside the restored default sequence of Olivia approaching over the water. | Implemented; restored sequence checked on desktop; earlier mobile/Ukrainian entry checks recorded separately |
| 5 | P1 | A moving zodiac scale and dense crossing lines make a chart difficult to interpret. | Stationary scale, exact longitude dots, displaced labels with leader lines, Sun/Moon/Rising chapters, selected relationships and a position table. | Implemented; geometry regressions and browser checks |
| 6 | P1 | Independent decorative waits and globally forced smooth scrolling add friction to the journey. | Route begins on activation; one 240ms visual transition; native scroll with a brief event-driven drift. Remove redundant shell effects. | Implemented; route and source review |
| 7 | P1 | A revealed spread is hard to connect to its positions and reading, especially on a phone. | Individual reveals, Reveal all, numbered/position-aware result navigation and a focused card inspector. | Implemented; focused verification |
| 8 | P1 | Hidden or decorative content can retain focus, labels and hit areas compete with floating controls, and reduced-motion skip can leave the hero inert. | Preserve visible hero after skipping, prevent focus in hidden content, improve focus rings/44px controls, expose native language selection and keep controls clear of the atlas opener. | Implemented; manual and source review |
| 9 | P1 | Repeated background loops spend rendering time even while the view rests. | Background sky redraws on interaction/route changes and settles; native scroll writes stop at rest; remove global liquid shader and redundant cursor/magnet/shader mounts. | Implemented; lifecycle inspection. Device trace still required |
| 10 | P2 | Generic glass/low-contrast panels weaken the engraved hierarchy; locale controls are absent from main paths. | Clear navy/ivory/gilt surfaces, stronger paywall text contrast and an accessible native locale selector. | Implemented; core EN/UK review |

## Before → after, by journey

### Arrival

Before: a cinematic opening, tall stacked title, many decorative layers and service links that can fall below the first screen. After: the two-line title and direct service actions establish the product immediately, while normal scrolling advances the original Olivia approach, living water and opening sequence. The full-screen stage restores the artwork's scale, with 3.2 viewports of scroll on desktop and 2.5 on mobile. The assisted ride remains available; it is no longer required to activate the scene.

The assisted ride now calculates its position in the document correctly. Pausing or hiding the tab cancels that ride so returning cannot jump ahead. The static artwork and working service actions remain available when WebGL is unavailable or reduced motion is requested. Earlier mobile checks confirmed readable copy and Ukrainian action wrapping; the restored mobile sequence still requires its own check.

A clipped editorial reveal now uses responsive React markup rather than rewriting text into measured lines. One gilt accent marks action or selection; it is never a reason to keep a working button invisible for an extra second.

### Tarot

Before: the full-deck riffle is impressive but its card flight, selection state, reversal overrides and parent stage are insufficiently coordinated. After: browse, grip, pull and landing have explicit boundaries. Every card remains part of the same seeded full deck. Drawing upright or reversed is possible without a drag. The reading unfolds card by card, with its spread position visible, then becomes a stable document that can be inspected and shared.

The single sound control expresses actual playback state, including an explicit Resume state after reload. An old enabled preference does not start sound without a fresh interaction. Sound and haptics remain optional enhancements.

### Birth chart

Before: a rich diagram provides little guidance about what to read, and the new sky scene uses an incomplete coordinate model. After: the sky above the birthplace and the astrological wheel have visibly different roles, and the fold explains the change in representation. The same atlas SVG stays underneath the transformation; final longitudes and scale do not drift.

Sun, Moon and Rising offer approachable entry points. Selecting a body or aspect joins a precise mark to an explanatory passage. The position list carries the same data. Unknown birth time remains an explicitly labelled local-noon estimate without fabricated Ascendant, Midheaven or houses; Moon uncertainty remains visible.

### Navigation, mobile and resilience

Before: separate clocks, broad smooth-scroll interception and redundant visual controllers can interfere with fixed reading rooms. After: native browser navigation and scrolling retain control; a brief shared gesture gives immediate feedback. Route transitions preserve the page tree and avoid remounting children for theatrical staging. Dialogs and hidden surfaces have explicit focus boundaries. Long labels wrap, native controls work with keyboard and touch, and the same content remains available without motion.

## Commercial launch gates

1. **Service readiness:** `service-status.ts` keeps accounts and payments disabled unless their build flags are explicitly enabled. The existing Telegram fallback remains. This redesign does not establish that account creation, paid entitlement, billing or delivery are operational; validate the real service environment and purchase/refund flow before a commercial launch.
2. **Device performance:** collect production-preview traces on a representative iPhone and Android device. Confirm no idle/offscreen work, correct texture selection, stable layout and responsive 78-card interaction. Field Web Vitals targets below are targets, not measured results.
3. **Accessibility acceptance:** complete screen-reader and keyboard tasks, 320px/high-zoom reflow and live reduced-motion changes on supported browsers. Automated rules alone cannot certify the experience.
4. **Dependencies:** npm audit reported 12 findings in the installed lockfile (1 critical, 7 high, 3 moderate, 1 low). The app exports static files and disables image optimization; many listed Next advisories concern server-only facilities. That is an exposure distinction, not a clean security bill. Review affected build/development/runtime paths and update dependencies in a separately validated change before adopting a server deployment.
5. **Content/locales:** core English/Ukrainian paths are part of this pass; the existing eight-language selector is preserved. It does not mean every long reading is newly translated. Review pricing promises, legal copy, long card interpretations and full locale coverage before sale.
6. **Production rollout:** review this local build, then authorize deployment. Recheck canonical links, hosting rules, cache behavior, service flags and the real customer journeys on the deployed preview before promoting it.

## Research and design specification

The following reference study supplies the rationale, interaction specification and measurable acceptance criteria. Its older implementation references describe the original September 13 starting point; the implementation findings above incorporate September 14.


## Decision

Olivia Arcana should become a **living engraved atlas**: a useful personal reading whose objects respond like carefully handled instruments. The ownable material is already present in the carved lapis-and-marble deck, the real astronomical calculations, the nocturnal palette and the almanac vocabulary. The redesign should concentrate these assets into three recognizable acts: **arrive, reveal, understand**.

The strongest improvement is to make beauty explain a useful action. A first visit needs a clear choice between a tarot reading and a birth chart. A tarot reveal needs to establish which card belongs to which position. A birth chart needs to turn a specific planet and relationship into an understandable interpretation. The same restrained light, engraved line and settling motion should connect those acts.

This is a design recommendation drawn from the evidence below, not a claim that any reference proves a conversion uplift. The research establishes transferable mechanisms and acceptance criteria; it does not rank competitor performance or certify Olivia Arcana's accessibility.

## Source hierarchy and current architecture

`SESSION_2026-09-13.md`, opening through “What shipped, by pillar,” is the primary implementation record. It describes the Arrival edition through commit `06f6be7`: a tide opening followed directly by Oracle and Birth Chart plates; all 78 tarot cards with seeded shuffle and reversals; repaired astronomy, Ascendant and timezones; unknown-time handling; fitted spread formations; a shared birth form; staged chart reveal; route transition choreography; and a homepage table that deals and turns real card faces. These are reported shipped capabilities, not recommendations to rebuild.

`DESIGN_BRIEF.md` supplies useful material, palette and type constraints, but parts predate the session. Its three-card feature page, day plate, tariff and older opening sequence are superseded by the simpler homepage described in the session. Its warning that planetary longitudes are unreliable is superseded by the session's astronomy-engine rebuild. These older passages must not be used as fresh audit findings.

`.impeccable.md` is the current design context: newcomers should understand the first visit; useful actions belong in the first screen; chart geometry follows computed data; labels alone may move; native scrolling and equivalent touch/keyboard paths are required; seeded readings, reversals, sharing, unknown-time handling, locales and service contracts must survive the redesign. This report does not independently recalculate the production ephemeris or visually test competitor motion. Live and local product findings should be kept separate from the external research evidence.

## Reference evidence and transferable decisions

| Reference | What the primary source establishes | Transfer to Olivia Arcana | Boundary |
|---|---|---|---|
| **Cartier, Watchmaking Savoir-Faire** | The official page organizes its story around distinct craft subjects, with imagery, compact explanation and optional videos. Form and proportion recur as organizing ideas. | Let the true card face or chart wheel carry the composition. Put short explanatory text beside a meaningful object. Detail should be discovered by opening the object, not by introducing another decorative section. | Do not transplant Cartier's typography, marks or layout; its physical-product authority is not evidence that ornamental delay improves a reading. [Source](https://www.cartier.com/en-us/la-maison/savoir-faire-%26-transmission/savoir-faire/watchmaking-savoir-faire/) |
| **Hermès, Bespoke Objects** | The official story moves from a personal wish through sketch, materials and making. It includes object-specific stories and explicit audio controls. | Make the reading feel personally assembled through the entered question, selected spread and precise birth context. Use first-person warmth in editorial copy and real details of the deck; let the visitor decide when to hear sound. | The attraction is meaningful specificity, not a reason to add grandiose prose. [Source](https://www.hermes.com/th/en/content/186736-institutional-campaign-2019/) |
| **Aesop, Greenwich Connecticut** | Aesop describes a particular architectural setting through its materials, joins, counter and a welcoming pause. | Describe the actual carved image and the object's symbolic detail. A single generous resting area around a reading can provide warmth; another color or moving backdrop is unnecessary. | This is a material and hospitality reference from an official store story, not a tested digital interaction benchmark. [Source](https://shop.aesop.com/fr/en/r/aesop-greenwich-connecticut/) |
| **Cartier Watches and Wonders, Mooders' production case study** | A production participant describes a scroll-based sequence of watch-specific worlds, synchronized with distinct soundscapes and transitions. | Compose one scene at a time. Give arrival, dealing and interpretation different energy while using one transition vocabulary. Optional sound can correspond to the card landing or a page settling, instead of playing continuously. | The case study's award and experience claims are promotional. It provides production evidence, not independent usability or mobile performance measurements. [Source](https://mooders.net/en/works/cartier-watches-and-wonders/) |
| **NASA Eyes** | NASA presents interactive scenes built from real data, direct exploration, named historical events, time controls and explanatory scrollytelling. | Pair the chart overview with named starting points. Selecting Sun, Moon or an aspect should preserve spatial context and explain what is highlighted. The scene should invite exploration without requiring astronomical literacy. | NASA's spatial universe is not an astrology model. Borrow its relationship between data, guidance and exploration; do not import 3D planetary orbits into a geocentric longitude wheel. [Source](https://science.nasa.gov/eyes/) |
| **Shneiderman, The Eyes Have It** | The original visualization paper organizes interaction around overview, zoom, filtering, detail, relationships, history and extraction. | A birth-chart overview remains the anchor. Focus one planet, show only relevant links, explain it alongside, and allow reset to the full chart. Preserve an accessible placement list and exported result. | This is a foundational framework, published in 1996, not recent evidence about this audience's preferred visual style. [Original paper](https://www.cs.umd.edu/users/ben/papers/Shneiderman1996eyes.pdf) |
| **Labyrinthos, official app description and release notes** | Labyrinthos offers card meanings, questions, journals, manual or automatic card selection, configurable readings and freeform placement. Its web announcement explicitly confirms card dragging and a mobile-oriented layout. | Treat handling the cards and understanding them as one experience. Offer a simple selection path with an optional richer tactile path. After the reveal, position labels, card meaning and personal reflection deserve as much attention as the flip. | These sources establish features, not the exact current timing or feel of their animation. Do not copy their artwork or claim their UX was measured here. [App](https://labyrinthos.co/pages/app), [web release note](https://feedback.labyrinthos.co/announcements/22-mirror-updates-web) |
| **Labyrinthos, Digital Tarot Workbook** | The publisher uses card-specific prompts, upright/reversed understanding, brief daily entries and periodic review. | End the reading with a usable reflection prompt grounded in the existing selected cards. The lasting product is a reading the person can revisit, not a one-time animation. | Preserve Olivia's current reading engine and reversal semantics. Journaling expansion can follow the core interaction work. [Source](https://labyrinthos.co/products/digital-tarot-workbook-and-journal) |

## The living engraved atlas system

### 1. Objects lead; ornament follows

The carved card and the plotted chart are the two hero objects. Show them at a scale that makes their distinguishing content visible. The site should not need star dust, several glows, a glass panel and a rotating background to signal atmosphere at the same time. Use the existing ivory type, lapis ground, cold structural lines and single warm gilt. Gilt indicates what has become relevant: the selected card, exact position marker, active chapter or next action.

Use bare night for reading and structural rhythm; reserve translucent surfaces for temporary overlays such as the loupe or navigation drawer. This makes the difference between a page and a tool perceptible. It also makes the ornament hierarchy simple: one fine rule establishes a register; a stronger illuminated mark establishes the current point of attention.

### 2. Three verbs govern motion

**Arrive:** an object approaches a defined resting place, then stops. **Reveal:** an obscured thing becomes available, and its label follows. **Understand:** selecting one part reduces competition from unrelated content and connects it to explanation. These verbs should govern homepage plates, card choreography, chart focus and navigation.

Use the existing house ease for editorial entrances. Tactile objects may have a small physical settling spring, but body copy should remain stable. Motion must end in a readable state. An effect should have an owner, a start event, a completion condition, a cancellation path and a reduced-motion outcome. Decorative animation should never be a prerequisite for using a service.

### 3. Personality comes from specificity

Keep figure numbering and the engraved register where they add a sense of the edition, but lead with ordinary names: Tarot reading, Birth chart, Explore a planet, Your question. Pair metaphor with function. A poetic chapter title can sit beside a plain instruction rather than replacing it. Use a warm, assured voice, with no suggestion that the software is sensing the visitor's energy or conducting a computation that it is not performing.

### 4. Data and interpretation have visibly different roles

The input context and computed placements form the factual plate. The interpretation is a reading based on an astrological or tarot tradition. A precise longitude should remain precise; a reflective passage should not acquire false scientific authority from being placed next to it. The design can make both compelling without blending their evidentiary status.

## Homepage: first impression and the useful invitation

**Before, according to the session:** the homepage is a tide opening leading to two working plates, with mobile texture reductions and a compressed masthead already shipped. Its interactive deck and true astronomical details are strong assets. The remaining audit question is whether a new visitor can identify and begin either service immediately, without learning the opening's controls or scrolling through its choreography.

**Recommended after, updated for the user's 14 September correction:** a single first-screen composition communicates the product and presents two useful actions while retaining the default scroll-driven Arrival. Keep the figure and sky art, but place the headline and actions in an intentionally quiet part of the image. The service names need to be plainly readable before any scene advances. The visitor can start a tarot reading or birth chart directly, or scroll naturally to bring Olivia closer over the water and continue through the opening. Pause and skip controls remain available, with complete static content for reduced motion or an unavailable renderer.

Carry the art into the next screen through a subtle line or light continuity, not a succession of unrelated reveal effects. The Oracle plate should display a small, comprehensible spread using real deck faces. The Birth Chart plate should expose a real input and explain that time and birthplace improve the full chart. On a phone, the two services should become a clear vertical reading order rather than competing miniatures.

**Acceptance:** both service actions are discoverable without advancing an animation at 390×844 and 1440×900. The artwork never reduces the heading or button below its measured contrast target. Native scroll remains available at all times. The reduced-motion first screen communicates the same product with complete art and working actions. No metric such as “five-second understanding” should be reported as passed without a small human task test.

## Tarot: choreography that belongs to a reading

A tactile tarot table should make state changes legible. The sequence is **choose a spread → bring a question → select the cards → reveal → read**. Existing seeded shuffle, all 78 cards, reversal rate, restored shares and formation geometry should stay in place. Improve the experience around those contracts.

The spread chooser should explain the question each spread helps explore and show its positions. While drawing, the next position and the selected count should be visible. A selected card leaves the source fan, arrives at a stable berth and receives its readable position label. The layout should not repeatedly rescale in a way that makes the whole spread feel slippery.

A deliberate reveal can travel through the formation. Large spreads need a short overall duration rather than twelve identical long waits. Keep a visible way to reveal or continue immediately. The interpretation sheet should arrive once the viewer can identify the cards, leaving the active card in context. Selecting a card should couple its place on the table with its corresponding reading passage, and the loupe should make the real artwork large enough to study.

Tactility should have local scale: small pointer tilt, a light edge responding to lift, modest press compression and a controlled landing. Vertical phone scrolling must not be captured by an incidental card touch. A tap/button must accomplish every action whose enhanced version involves dragging. WCAG 2.2's dragging criterion expressly requires a single-pointer alternative when dragging is not essential. [W3C: Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)

**Recommended timing hypotheses:** press feedback in roughly 100–150ms; card travel around 450–650ms; face reveal around 450–600ms; modest stagger between cards; no mandatory theatrical waiting once the result is ready. These are proposed house values to tune against the current rig and actual devices, not values prescribed by a cited standard. Reduced motion should settle cards immediately and reveal their faces without rotation while retaining position labels, selection feedback and announced progress.

**Acceptance:** repeated fast taps never select twice; every spread is usable at 320px and 390px; drawing works using a keyboard and using taps alone; the complete interpretation is reachable with browser zoom and the phone keyboard open; card backs never replace revealed faces; restored URLs reproduce card identity and orientation; closing a loupe restores focus to its opener. Modal keyboard and focus behavior should follow the WAI dialog pattern. [W3C: Modal Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

## Birth chart: a true diagram with a guided reading

The chart should open as a meaningful overview with a human entry point. The initial interpretation can explain the role of Sun and Moon and, when the birth time is known, the Ascendant. An accessible list of named placements provides a second way to operate the same chart. Selecting a placement should emphasize its true location, show its relevant aspect lines and couple it with one explanatory passage. A clear “whole chart” control restores the overview.

The diagram's angular data must never be nudged to make it prettier. To avoid collisions, move glyph labels outside the true anchor and join them with leader lines. Aspect endpoints remain attached to computed longitudes. Keep the sign ring and directional orientation stable while exploring. Use line weight, dash and explicit aspect names as well as color so the meaning survives monochrome and low vision.

Story layers can disclose complexity: first the central placements, then planetary relationships, then the full technical list. A reader can choose any layer immediately. The drawing sequence should establish rings and graduations before anchoring planets; labels appear after their positions. Once complete, the chart rests. Large automatic spins, tilts or revolving planets would make it harder to understand angular relationships.

**Unknown birth time requires more than omitting the Ascendant.** Astrodienst's data guidance omits a Moon degree when time is unknown and displays both Moon signs if the sign changes on that birth date. Olivia's current handling should be inspected for exact-looking Moon storytelling. Do not silently imply that a noon estimate is a known birth instant. Keep the session's existing absent Ascendant/houses behavior and label estimates; any expansion of interval calculations should be reviewed as calculation work rather than slipped into a visual refactor. [Astrodienst: Astro data](https://www.astro.com/astro-databank/Help%3AAstro_data), [Astrodienst: Birth time](https://www.astro.com/faq/fq_de_time_e.htm)

**Acceptance:** the graphic and text list agree on planet identity, sign, degree, retrograde status and available houses; leader lines end at original coordinates; selecting and clearing a planet does not change the data; unknown-time results show no inferred Ascendant or houses; English and Ukrainian names fit; the same placement is reachable through a control outside the SVG. WAI recommends descriptions that convey the information represented by complex diagrams, not merely a visual label. [W3C: Complex Images](https://www.w3.org/WAI/tutorials/images/complex/)

## Navigation, reading and mobile behavior

Navigation should give immediate feedback and preserve orientation. One short overlay can bridge a route change, but the destination must remain responsible for content readiness. Avoid stacking exit, loading and entrance delays. For in-page movement, keep the destination visible and respect reduced motion. Browser Back should return to a sensible state and scroll position, with no modal overlay left behind.

The drawer and loupe need an obvious close action, keyboard containment when modal, Escape support, an accessible name and restored focus. Skip navigation should land on meaningful content. Persistent chrome must not cover focused controls, page headings or the top of a reading.

Compose mobile around a normal reading column. The chart can retain its two-dimensional geometry inside a bounded view while its controls and interpretation reflow below it. A dense twelve-card spread can offer an overview plus a selected-card reading strip; it should not force every card to become illegible. Essential diagram geometry is treated differently from surrounding text in WCAG's reflow guidance, but that exception does not excuse overflowing forms or body copy. [W3C: Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)

## Performance and accessibility acceptance targets

These targets are release gates, not claims of current results. The numerical performance thresholds come from Google's Web Vitals guidance; the house targets are explicitly recommendations.

| Area | Acceptance target | How to judge it |
|---|---|---|
| Loading | LCP ≤2.5 seconds at the 75th percentile, segmented by mobile/desktop | Use real-user data when available; lab runs diagnose but do not prove field compliance. |
| Responsiveness | INP ≤200ms at the 75th percentile | Measure actual selections, form submission and navigation. A lighthouse loading score alone does not establish this. |
| Stability | CLS ≤0.1 at the 75th percentile | Reserve artwork, card-table and chart space; avoid late font or results-panel jumps. |
| Contrast | Text ≥4.5:1; large text ≥3:1 under WCAG criteria | Measure composited colors over the actual artwork and every active state, not isolated token values. |
| Touch targets | Meet WCAG 2.2 AA 24×24 CSS px or its stated exceptions; use 44px as a house target for frequent controls | Check hit areas rather than glyph dimensions. Do not enlarge chart data marks by displacing their real coordinates. |
| Motion choice | Same final content with reduced motion; user control over qualifying automatic motion | Test on first load and after preference changes. Animation from interactions is AAA; the project adopts it as a design requirement. |
| Keyboard | Complete core journeys with clear focus and usable dialog behavior | Manual task completion in addition to an automated scan. |
| Reflow | Reading and controls remain usable at 320 CSS px and high browser zoom | Allow bounded two-dimensional charts only where necessary; provide text/control equivalents. |
| Render cost | No perpetual decorative work when offscreen, hidden, paused or reduced-motion | Profile the homepage, table, chart and route transitions; avoid simultaneous full-screen effect loops. |

Sources: [Google: Web Vitals](https://web.dev/articles/vitals); [W3C: Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html); [W3C: Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html); [W3C: Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html); [W3C: Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html).

For motion, prefer transform and opacity, and profile paint-heavy line drawing, shadows and blur. Google specifically cautions against indiscriminate layer promotion and recommends measuring before adding `will-change`. The site's existing WebGL and 3D chains make this more relevant than importing a new animation library. Keep a static first-screen image available independently of shader initialization. Preserve the session's mobile image variants and avoid eagerly loading the whole deck. [Google: High-performance CSS Animations](https://web.dev/articles/animations-guide)

## Punch-list ranked by impact

The status of each item must be attached after implementation and verification; this is the research priority order.

| Rank | Priority | Improvement | Before → after rationale | Primary acceptance evidence |
|---|---|---|---|---|
| 1 | P0 | Establish two immediate homepage service actions | Scene controls and visual atmosphere may dominate → the value and next step are understandable on arrival | Desktop/mobile first screen and keyboard entry |
| 2 | P0 | Preserve and regression-check data contracts | A redesign can silently alter cards or chart claims → known inputs and shared URLs retain their meaning | Seed/reversal/share checks; known/unknown-time chart fixtures |
| 3 | P0 | Complete touch, keyboard and reduced-motion journeys | Attractive interactions may rely on precise gestures or timing → every visitor can finish the same reading | Manual end-to-end journeys; dialog focus and escape; taps alone |
| 4 | P1 | Couple tarot card, position and passage | A beautiful spread can still leave the user unsure what to read → a focused card explains its role in the reading | All four spread sizes; active selection/text correspondence |
| 5 | P1 | Make the birth chart explorable through a guided focus | Dense glyphs and crossing lines demand prior knowledge → a named planet reveals its place, relationships and explanation | Graphic/list synchronization; collisions; stable true anchors |
| 6 | P1 | Unify timing and eliminate redundant waits | Several separately polished effects can compete → one meaningful act leads to one readable resting state | Click-to-result review on a representative phone; reduced-motion parity |
| 7 | P1 | Improve mobile composition and type contrast | Desktop diagrams and tiny labels shrink → clear reading order, touchable controls and legible copy | 320/390/768px, landscape, zoom, both locales |
| 8 | P1 | Gate decorative rendering and expensive assets | Idle animation can consume time and battery → effects run only while contributing to the visible experience | Performance trace, network waterfall, hidden-tab and offscreen checks |
| 9 | P2 | Make loupe and chart details materially distinctive | Generic glow carries “mystical” identity → close study of carving, engraved marks and true coordinates carries the brand | Consistent object treatment across the two services |
| 10 | P2 | Strengthen revisiting and reflection | The reveal is the memorable endpoint → the customer can preserve and reflect on the reading | Existing share/export path works and gives clear completion feedback |

## Implementation boundaries

The current stack already contains the relevant mechanisms: the Arrival scene, `SpreadTheater`, the Framer tarot engine and chooser, `BirthDataForm`, chart rendering, sky atlas and shared transition components. Consolidate their behavior before adding new dependencies. Prefer small shared timing/token improvements and semantic controls over another global animation framework.

Do not change the seeded shuffle, reversal rate, card meanings, astrology calculation model, historical timezone conversion or external-service contracts as an incidental design edit. Any discovered correctness issue should have its own evidence and regression case. Do not claim a redesigned screen is “customer-ready” solely because the build succeeds: production preview, actual task completion, mobile checks, accessibility checks and performance evidence are separate parts of that conclusion.

## Source inventory

Research accessed 14 September 2026. Several official product pages are undated; dates below are included only when established by the source.

1. Olivia Arcana. `SESSION_2026-09-13.md`, introduction and “What shipped, by pillar.” Supplied project record, 13 September 2026.
2. Olivia Arcana. `website/DESIGN_BRIEF.md` and `website/.impeccable.md`. Local design context; brief contains explicitly superseded implementation descriptions.
3. Cartier. [Watchmaking Savoir-Faire](https://www.cartier.com/en-us/la-maison/savoir-faire-%26-transmission/savoir-faire/watchmaking-savoir-faire/). Official craft and product editorial.
4. Hermès. [Bespoke Objects](https://www.hermes.com/th/en/content/186736-institutional-campaign-2019/). Official object storytelling.
5. Aesop. [Aesop Greenwich Connecticut](https://shop.aesop.com/fr/en/r/aesop-greenwich-connecticut/). Official material and spatial design account.
6. Mooders. [Cartier Watches and Wonders](https://mooders.net/en/works/cartier-watches-and-wonders/). First-party production participant case study.
7. NASA. [Eyes](https://science.nasa.gov/eyes/). Official application descriptions and guided examples.
8. Ben Shneiderman. [The Eyes Have It: A Task by Data Type Taxonomy for Information Visualizations](https://www.cs.umd.edu/users/ben/papers/Shneiderman1996eyes.pdf). IEEE Symposium on Visual Languages, 1996, pp. 336–343, DOI 10.1109/VL.1996.545307.
9. Labyrinthos. [Tarot Reading App](https://labyrinthos.co/pages/app). Developer-provided feature description.
10. Labyrinthos. [2.2 – Mirror Updates & Web](https://feedback.labyrinthos.co/announcements/22-mirror-updates-web). Developer release note, 1 November 2024.
11. Labyrinthos. [Digital Tarot Workbook and Journal](https://labyrinthos.co/products/digital-tarot-workbook-and-journal). Publisher description.
12. Astrodienst. [Astro data](https://www.astro.com/astro-databank/Help%3AAstro_data) and [Birth time](https://www.astro.com/faq/fq_de_time_e.htm). Official input and uncertainty guidance.
13. Google/web.dev, Philip Walton. [Web Vitals](https://web.dev/articles/vitals). Updated 31 October 2024.
14. Google/web.dev, Kayce Basques and Rachel Andrew. [How to create high-performance CSS animations](https://web.dev/articles/animations-guide). Updated 6 October 2020.
15. W3C WAI. [Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html), WCAG 2.2 SC 2.5.7 (AA).
16. W3C WAI. [Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), SC 2.5.8 (AA).
17. W3C WAI. [Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), SC 1.4.3 (AA).
18. W3C WAI. [Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), SC 1.4.10 (AA).
19. W3C WAI. [Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html), SC 2.3.3 (AAA).
20. W3C WAI. [Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html), SC 2.2.2 (A).
21. W3C WAI. [Modal Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) and [Complex Images](https://www.w3.org/WAI/tutorials/images/complex/). Authoring guidance.
