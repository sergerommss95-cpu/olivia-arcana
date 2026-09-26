# Olivia Arcana — product evolution and release plan

24 September 2026. Implemented locally; no production deployment or live payment changes.

## Product promise

Olivia is a considered tarot practice: bring a question, choose your cards, keep a useful thought, and return to see what changed. The artwork and cinematic experience introduce that practice. Continuing usefulness must earn the next visit and, eventually, the subscription.

The [competitor study](./olivia-competitive-study.md) separates documented features from our hypotheses. Co–Star suggests a personal artifact worth sharing; CHANI suggests a dependable editorial relationship and recurring value; The Pattern suggests an understandable first thought with optional depth. These mechanisms are worth testing, but copying them does not establish product-market fit.

## Delivered in this pass

| Need | Working change |
|---|---|
| A reason to return | Today offers a manually chosen daily card that remains stable for the local day, a recent reading, and due follow-ups. Returning readers can bypass the long hero journey. |
| Continuity after the reveal | Single and spread readings accept a next step, a topic, an optional revisit date, and a later reflection. Topics group existing readings in the almanac. |
| Clearer reading language | Single-card readings open with a short reflection; the remaining meaning is available on demand. A method page explains the prepared meanings, full 78-card upright deck, artwork, and actual limits of personalization. |
| Discovery with privacy | A single-card reading can produce a composed image or shared text containing its public artwork and general reflection. Private questions and notes are excluded. The owner initiates any sharing. |
| A complete free experience | All 78 cards, personal one-card and three-card readings, local saving, follow-ups, export, and sharing are free. Five/eight-card personal spreads retain verified membership gates and usable samples. |
| Recovery and dependable local records | Selected single-card drafts and notes survive reload. Recovered edits take precedence over older saved notes. Follow-up removal and undo are connected to the reading. Storage failures remain visible. |
| A practical hosted edition | The hosted entry is about 22 KB, with separately cacheable, content-hashed artwork, fonts, styles and scripts. The approximately 30 MB self-contained edition remains available offline. This is not a claim that the total initial download is small: the approved hero still loads its Major Arcana artwork. |

The approved card artwork, Olive Lattice back, hero choreography and slow cinematic timing are preserved. No speculative glow or new motion effects were added.

## Where to review

- Integrated local preview: http://localhost:8780/?revision=personal-practice
- Direct Today view: http://localhost:8780/experience/index.html#today
- Hosted delivery folder: `outputs/olivia-experience/`
- Offline delivery: `outputs/olivia-almanac.html`
- Source: `work/olivia-product/`

The generated hosted edition is installed in the website's `public/experience/` and local export's `out/experience/`. Previous entry files are retained in `snapshots/product-evolution-site-before/`. This does not change the deployed website.

## Important boundaries

Journal data remains local to its browser and origin. There is no cloud sync or JSON import yet. Existing single/spread stores each allow 100 saved records. Completed single-card drafts persist, while unsaved follow-up form edits are held for internal navigation and warn before closing; save them to make those follow-up fields durable. Revisit dates surface inside Today; there is no email or push reminder service.

Current meanings and spread connections are prepared reflections. The user's question is not semantically interpreted by a model. No expert authorship is claimed. Sharing is a local export/native share action, not a hosted reading link or functioning referral attribution system.

The free/paid explanation describes available local features and deeper spread access. It does not activate checkout or promise cloud memory, unlimited generation, or unpublished editorial programming. Pricing remains unvalidated.

## What must happen before a paid launch

The [launch audit](./olivia-launch-readiness.md) records the evidence and source locations. Its decisive findings are an unreachable configured sign-in service, an account/payment API returning “Application not found,” device-only journals, competing entitlement definitions, and unverified payment lifecycle behavior.

1. **One dependable account and private almanac.** Restore the chosen identity service, implement owner-scoped storage, opt-in import, visible synchronization state, conflict recovery, export and deletion. Demonstrate isolation between accounts, second-device access, and restore from backup.
2. **One real paid offer.** Consolidate plan names and entitlements. Verify one provider in sandbox, enforce paid services on the server, and cover purchase, restoration, duplicate/delayed webhooks, cancellation, refund and expiry. Existing writing stays accessible after cancellation.
3. **Substantially better guidance.** Have a real tarot editor review the 78-card meanings and spread positions. Build question-aware synthesis only with explicit context controls and a quality evaluation set. Additional card count alone is a weak recurring-value proposition.
4. **A credible weekly commitment.** Pilot one authored weekly reflection with a named responsible editor. Publish a cadence that can actually be maintained. Do not invent an expert persona or a content library.
5. **Operational quality.** Measure cold loading and interaction responsiveness on a midrange phone, compress and stage hero assets where possible, verify accessibility, establish a monitored support channel, and add privacy-conscious product events that exclude private text.

## How to earn confidence in the business

Begin with a small observed pilot of intended readers, rather than broad paid acquisition. Watch their first reading without coaching, then invite a return after several days and a revisit of a real question. A successful session ends with something useful in the person's own words.

Measure first-reading completion, saved thoughts, meaningful seven/thirty-day returns, completed revisits, shared artifacts leading to completed readings, and cancellation reasons. A meaningful return is a completed reading with reflection or a revisited prior entry, not simply an app open. Track interpretation cost and support burden before promising unlimited use.

Test the proposed paid experience against the free one for usefulness and willingness to pay. Set the pilot's success criteria before observing the results. If readers admire the visuals but cannot name a useful perspective or choose to return, improve the content and practice before adding spectacle.

## Verification

- 52 automated tests passed across card selection, record validation, spread behavior, access boundaries, daily stability, metadata and draft storage.
- Generated scripts passed syntax checks; hosted references and all current asset hashes validated in both installed copies.
- Browser checks covered manual daily selection, stable return, local saving/reload, recovered edits, topic grouping, revisit completion, deletion/undo, private-safe PNG export, free manual three-card selection, and paid five/eight-card boundaries.
- Desktop and 390 × 844 mobile views were checked, including reduced motion and horizontal overflow. The original hero journey renders with the hosted assets.
- The isolated experience produced no runtime errors during these flows. The integrated wrapper emitted one unattributed MutationObserver error on its first load; it did not recur on reload, and the direct experience did not reproduce it. Retain this as a monitoring item rather than claiming a completely clean production environment.
- Live account, cloud synchronization and payment workflows were not verified. This delivery is a stronger local beta, not a certified paid launch.
