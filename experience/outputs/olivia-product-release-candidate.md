# Olivia Arcana — personal practice release candidate

Preview: https://6ab679587ca6658783263ba5--olivia-arcana.netlify.app

Built 25 September 2026. This is a working first product release candidate, not a claim that every proposed roadmap feature is complete.

## The complete journey

1. Bring a question, or leave it open. The optional guide offers understanding, decision and conversation directions. Review the three positions before approving; keep or edit your own wording.
2. Choose the cards yourself. The approved plan, original context, cards, positions and orientations stay attached to the reading.
3. Explore prepared card meanings. Request an explicitly labelled question-aware AI interpretation when wanted, and keep it with the reading.
4. Write one practical step, name a topic and choose a date to return. Download a private calendar check-in if desired.
5. Return to Today or Your journey. Record what happened and how your view changed. Each topic gathers readings, actions and outcomes chronologically.
6. Mark a meaningful moment. Your living deck shows encounters and personal meanings, with links back to original readings. Marking never changes card selection or probabilities.
7. Log a physical card by name and orientation. It joins the same almanac without requiring a camera or a digital draw.

## Design and continuity

The new views use continuous lapis/navy, ivory typography, original card artwork and restrained antique gold. The selected hero choreography is unchanged. Its exact source hash is recorded below.

Question preparation, timelines, personal card meanings, physical entry and calendar instructions are available in English and Ukrainian. The Ukrainian question conversation has its own `/uk/ask/` route. On the hosted site, questions move between the conversation and reading form within the same browser tab and origin, never in URL parameters. The draft survives the page transition/reload and expires after 30 minutes. The portable HTML cannot transfer tab storage to a different website origin.

## Keeping the work

Saved records remain local to this browser. An almanac backup includes single cards, spreads, approved plans, saved AI interpretations, follow-ups and personal card meanings. Import previews the change, preserves existing records and refuses conflicting draw identities. Validation happens before writing; interrupted writes attempt full rollback. Corrupt stores can be exported as recovery copies without overwriting them.

Daily reminders and check-in reminders are calendar files, not server notifications. Import them and confirm calendar alerts yourself.

## Free now / paid later

Free: daily card, individual readings, three-card plans, journal, follow-ups, physical entry, personal meanings, backups and reduced motion. The current AI access is a limited launch-preview service, not an unlimited paid promise.

Five/eight-card personal readings remain gated behind verified membership. Sample experiences remain available. No payment success is fabricated.

## Release gates still open

- Account service: the configured Railway account API returns Application not found. The old Supabase hostname does not resolve. A real restored database/project and reachable API are required for accounts, sync and entitlements.
- Billing: narrow token-handling repairs are prepared, but authenticated checkout and webhook-driven membership need end-to-end verification against restored services before selling access.
- Ukrainian AI: provider routing works; linguistic quality is being evaluated separately from HTTP success. The current model candidate uses Sonnet 5. Live English/Ukrainian tests preserved cards, reversals and approved positions; the specific unsupported-motive failures were improved. Ukrainian grammar and occasional overconfident framing still require editorial review before a paid launch. The labelled AI service remains a preview.
- Live shared spreads, voice ritual, learning practice room, reader reviews, camera recognition and annual recaps are later releases, not included here.

## Code and packaging

Product sources: `work/olivia-product/`. Native site: `/Users/macbookpro/olivia-arcana/website`.

Build the product with `python3 work/olivia-product/build.py`, copy `outputs/olivia-experience/` into the site's `public/experience/`, then run the native site build. Server handlers under `website/netlify/edge-functions/` are required for optional AI. The self-contained HTML runs the local practice features; optional AI needs the hosted service.

Approved hero SHA-256: `413304f1cea159c67fee3f8542cf5f95ebb6358891f2c08b91c38f76a965a5b2`.
Archived reference SHA-256: `100608f7d72a8e94f021983b47ab4d601ef1e3ee4fe6b1a697685380de0a2a12`.

## Validation evidence

- 107 product tests and 45 native-site/service tests passed; production build completed successfully.
- 13 targeted account-header/token backend tests passed. Account infrastructure remains unreachable, so this does not certify end-to-end sign-in or billing.
- Browser checks covered manual three-card selection, plan continuity, saving follow-ups, a topic journey, meaningful marks and personal meanings, physical-card entry, and AI interpretation persistence after reload.
- The exact Ukrainian question survived reading form → optional conversation → reading form. The navigation guard now allows form handlers to preserve or cancel before leaving.
- Desktop and 390px mobile layouts were inspected; new journey views retain the navy ground with no horizontal overflow in the checked view.
- Live AI checks used synthetic questions. English and Ukrainian requests returned labelled interpretations with selected card IDs/orientations unchanged. These are bounded checks, not a guarantee that every generated answer meets the editorial standard.
- The approved hero source hash is unchanged. Generated artwork bytes and resource paths passed the builder checks.

This release was uploaded as a separate preview. Production was not replaced in this task.
