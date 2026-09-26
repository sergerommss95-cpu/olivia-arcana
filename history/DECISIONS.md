# Olivia Arcana — decisions and iteration history

Compiled 26 September 2026 from the current Olivia task, available earlier task summaries, saved deliverables and source/release records. This is an editorial project summary, not a verbatim transcript. Date ranges group related work; they do not assign an exact timestamp to every unsaved edit.

## The product's direction

Olivia is intended to feel cinematic, mysterious, beautiful and personal while making a reading easy to begin and complete. The visual promise must lead into an actual useful experience: bring a question, choose the cards yourself, reveal deliberately, receive a reading of the cards together in relation to your question, and keep what matters.

Visual quality and reliable function are both required. Repeatedly, passing tests was followed by valid user criticism of the actual presentation. A new AI should inspect the rendered result, especially on a real phone, before declaring a design finished.

## Earlier visual world: September 11–15

The early brand world used a celestial Olivia figure, blue water, classical architecture, stars, ivory and gold. Initial hero work explored an approach/levitation scene and a water gateway, **The Tide Opens**. The user rejected a switch between an original still figure and a regenerated animated figure, then rejected the softness, artificial portal rim and weak transition execution.

The premium UX pass worked on performance, simpler backgrounds, continuous section transitions, birth-chart and sky interactions, and physical tarot selection. It delivered separate tarot/sky study pages and code/Claude handoffs. These studies are useful historical material, but their layout and hero are not the later approved card-led experience.

Related changes appear in the repository's September 13–20 commit history. Separate workspace artifacts are archived because a code package or generated concept was not necessarily committed at the time it was made.

## Card identity and reverse: September 20–22

The user explored a carved double arch with drapery (“The Veiled Threshold”), an inlaid O/A monogram, flowing/interlocking forms (“The Living Weave”), and a richly engraved reverse. The reference study included Legrain, katagami, Moser, damask and contemporary card engraving. These were explorations, not an instruction to reuse all their motifs.

The isolated sculptural emblem was questioned as a logo. The flowing card-back pattern was liked, but the user asked for a stronger connection to Olivia Arcana and more substantial changes. The selected outcome was **Olive Lattice**: interwoven ivory olive branches/leaves over lapis/navy, restrained gold olives and edging.

**Preserve:** the selected reverse and actual card artwork. **Do not infer:** that a rejected sculptural emblem is the approved primary logo, or that the early architectural reverse should replace Olive Lattice.

## Hero choreography: September 22–24

Many saved revisions explored card scale, a wave, more space, emission/glow, staging and Moon reveal. The user's constraints became clear:

- Give the sequence enough time to be enjoyed; earlier versions were too fast.
- Make cards large and spatially convincing.
- Avoid ugly tails, arbitrary glow and chaotic choreography.
- Lead with **cinematic and mysterious**, the user's explicit preference.
- Give cards clean edges and credible material; badly cut-looking silhouettes were rejected.

The approved reference is the September 24 **Light Leaks / card-palette** file. Its cinematic structure is a compressed deck, staggered S-wave departure, shared turn, Moon reveal between two wings, and gathering. The full journey is 96 seconds.

Canonical reference: `experience/outputs/olivia-approved-motion-2026-09-24.html`.

SHA-256: `100608f7d72a8e94f021983b47ab4d601ef1e3ee4fe6b1a697685380de0a2a12`.

The user repeatedly reported that later integrations/deployments had restored the wrong animation. Treat reference preservation as a requirement. Current runtime authority and regression checks are explained in `SESSION_HANDOFF.md`; a historical folder called `hero-v12` is not, by itself, proof of the correct runtime.

## Atmosphere and editorial identity: September 24

The user selected the Shaders **Light Leaks 1** preset (`14ca0e55-b724-455f-b2d8-126e1e38bb80`) and asked for colors matched to the deck: deep lapis, ivory and muted antique gold. The editorial typography/layout was reworked, but the previously selected card animation had to carry forward.

The user disliked a stark cream section immediately beneath the navy hero. Later sections should belong to the same visual world. The user's screenshots of the deployed page also showed an old indigo loading strip and embedded-page mismatch; native EN/UK homepage integration superseded that earlier iframe approach.

## Turning a hero into a reading product: September 24–25

The site evolved from a cinematic presentation into a reading flow, then into guided 3/5/8-card spreads and a complete 78-card catalogue. The user wanted paid options for deeper/complex situations, but the eventual offer allows a free three-card experience and reserves larger personal spreads for verified membership.

Repeated interaction decisions:

1. The person chooses their cards. Automatic selection is an explicit alternative, not the default.
2. Hover/focus should identify one card predictably; drawing it should feel connected to holding and placing it.
3. Avoid abrupt page replacement immediately after a click.
4. Larger spread cards and a spacious deck should show the art clearly. A dense strip of repeated tiny backs was rejected.
5. A reveal should turn from back to artwork once, without showing a back-looking face in between.
6. A spread must accept the visitor's own question; a sample question must remain clearly a sample.
7. The route to an answer must be understandable without knowing tarot terminology.

The catalogue grew from 22 Major Arcana to 78 cards, including the 56 Minor Arcana. Preserve stable IDs and saved-record compatibility when changing the deck.

## Personal practice and reasons to return: September 24–25

The competitor research emphasized Co–Star for sharing/discovery, CHANI for trust/recurring value, and The Pattern for accessible personal language. The decision was to improve the entire loop around a reading, not rely only on a spectacular first page.

The session developed daily practice, an almanac, next steps, revisits/outcomes, continuing topics/questions, personal meanings, local history and sharing. Later suggestions from other assistants were assessed as product ideas; neither uniqueness nor commercial success was established by a suggestion alone.

Current implementation and future proposals must be kept distinct:

| Area | Current meaning for continuation |
| --- | --- |
| Question preparation and custom positions | Implemented flows exist; inspect current source for constraints and approval steps. |
| Personal readings | Question-aware service uses selected cards, positions and orientations; prepared meanings remain a fallback. |
| Outcome loop / personal meanings / living deck | Local follow-up/history/marks features exist; do not claim predictive accuracy or cloud-backed learning. |
| Physical deck support | Manual card entry exists; camera recognition does not. |
| Follow-up reminders | Calendar-file export exists; server push notifications do not. |
| Accounts / paid membership | Source and gates exist; account sync, durable private cloud records and billing lifecycle still need end-to-end verification. |
| Shared live spreads, narrated ritual, simulated clients, human second opinions | Discussed future ideas; not shipped by this handoff. |
| Sealed readings, collective city statistics, annual recap | Discussed future ideas; not shipped by this handoff. |
| Cast of characters, automatic life-map placement, several traditions, combined predictive timing | Proposals are not evidence of a completed feature or validated claim. Re-evaluate against actual source before presenting them as available. |

The current handoff and dated product audit contain the operational release gates. “Ready product” was the goal; it should not be misreported as proof that payment/account infrastructure or market fit is solved.

## Reading voice and presentation: September 25

The user rejected generic astrology text and readings that did not use the question. They also rejected repeated caveats that interrupted the symbolic experience. The requested voice is a warm, coherent personal consultation: explain what the selected cards mean together, then relate that pattern to the actual question.

The interface should not claim an automated reading was written by a human. Method, AI assistance and limitations remain accessible in FAQ/method/terms rather than interrupting every paragraph. Avoid unsupported certainty about another person's thoughts or a guaranteed real-world outcome.

Large unbroken text was replaced with a concise opening, clear thematic sections and a practical ending. During personal-reading generation, **hide the interpretation text, including individual card meanings**, show Olivia's logo and progress, and reveal the reading when ready. Preserve this gate when editing rendering or streaming behavior.

The user asked for a complete Ukrainian experience, not a browser-only text toggle. Native `/uk/` routes and translated product flows were subsequently integrated. Both languages need ongoing editorial and layout review.

## Homepage and mobile: September 25–26

The user wanted sections below the hero to demonstrate the offer visually: the question, deck selection, sample reveal, different spread sizes and saved practice. Product illustrations and interactive previews were added. Their presence alone did not establish quality on mobile.

The first phone adaptation was rejected as a poorly reduced website. Screenshots showed clipped/swapped carousel panels, artwork crossing rectangular frames, captions colliding with images, thin outlined text controls, and weak separation from browser/bottom navigation.

The user originally requested moving liquid/glass perimeter highlighting for actionable elements. After seeing it, they repeatedly rejected the blanket thin-frame result. **The later feedback supersedes the earlier implementation:** use recognizably filled actions, stable artwork boundaries, explicit selected/pressed/focus states and adequate touch targets. Do not restore a rectangle around every link, card scene and navigation item to satisfy an obsolete request literally.

Mobile v2 introduced contained practice panels and phone-specific question/selection/reading layouts. The screenshots that prompted the latest repair were still from older production while v2 was only on a separate preview. Mobile v3 then removed automatic perimeter decoration throughout, improved sample/spread/almanac/symbol sections and went to production.

As of this archive pass, **physical iPhone feedback on v3 is still pending**. Browser checks are recorded, but they do not prove real-device keyboard, safe-area, browser-toolbar and gesture quality. Preserve the approved desktop hero while fixing actual phone issues.

## What the next AI should do first

1. Check out the handoff branch and read the current source/deployment authority.
2. Confirm which deployed release the user is viewing before diagnosing a screenshot as current.
3. Review the current mobile flow on a physical phone in English and Ukrainian; fix concrete issues without replacing the approved hero or artwork.
4. Keep documentation, source, release evidence and GitHub synchronized. A local fix, preview deployment, production deployment and Git commit are different states.
5. Verify real account/private-storage/payment operations before a paid launch claim. Avoid adding speculative features ahead of a satisfying first reading and reliable saved history.
