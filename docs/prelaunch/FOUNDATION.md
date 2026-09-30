# Prelaunch foundation — review draft, not permission to sell

## Current implementation and dependency
Branch codex/prelaunch-foundation is stacked on PR15 at 71b09611692754dcb1746c7bd35ddf660c783729. Main remains f6ac41c. PR16 (42ddaef) changes palette and is intentionally excluded. Review this PR against PR15; retarget to main only after PR15 lands. No artwork identities, journal schemas, astrology calculations or palette were changed.

The Next site is statically exported. Local tarot records and follow-ups are in browser storage; astrology birth details use olivia:birth-profile and the legacy olivia-arcana-user. Subscription code currently references a separate Railway API, with legacy Paddle/Telegram contracts and multiple auth token sources. That is not an approved entitlement system. Existing prices/tier/addon types are historical migration data, not the proposed offer.

Coded: source locks keep account/payment UI disabled even with public flags true; direct legacy auth, birth-upload, billing status, checkout, portal and Stars helpers fail before network access. Both birth-data delete entry points remove both stores and report incomplete deletion. BirthChart shows failure instead of claiming success. Deletion never touches journal keys. Birth export is a pure lossless helper, not a new export UI. Existing journal export/delete remains intact.

Tested: public-flag combinations, missing individual release approvals, repeated direct requests with zero network calls, two-source repeated birth deletion, journal preservation, blocked storage and lossless birth export; existing journal/export/recovery/generation suites are run separately. Tests use mocked browser storage and fetch. Native browser/mobile/WebGL QA remains a separate release gate.

Not implemented: backend identity, credits, processor integration, webhook endpoint, charge creation, server refunds, iOS purchase integration, journal synchronization. No accounts/access provisioned; no payment events simulated as real; no production publication.

## Release blockers (owner + professional review)
- Actual seller identity, registration/tax status, address and support contact. Founder is a Ukrainian tax resident; the Wyoming LLC does not exist. Do not replace it with another invented entity.
- Provider written approval for the actual product and seller. Paddle is prohibited and must not be used. No alternative provider is approved. Validate any chosen provider's current terms professionally before implementation.
- Offer approval: proposed EUR9.99/month and ten paid readings; taxes, trial, renewal, credit expiry/rollover, refund rules and what constitutes one paid reading remain undecided.
- Reviewed EN/UK seller, privacy, terms, cancellation/refund disclosures and consent; reviewed iOS distribution/purchase requirements if a native app is pursued.
- Secure backend review, migration consent, production monitoring, restore/support procedures, native mobile/accessibility and WebGL/fallback QA.
- Public client locks are containment only, never backend authorization. Existing external API is not audited by this repository; block its own purchase routes before launch and verify independently.

## Implementation specification and acceptance backlog

P0 — One identity (backend owner)
Create opaque customer_id UUID; unique verified auth subject mapping (issuer, subject), plus separately verified provider customer and platform transaction associations. Never trust localStorage tokens or arbitrary Supabase projects to identify purchases. API validates issuer/audience/expiry server-side. Account linking requires proof of both identities, explicit confirmation and audit trail; do not merge by unverified email. Session revocation, account export/delete and support recovery must work. Test cross-user access and duplicate-link conflicts.

P0 — Server ledger (backend owner)
Persist immutable ledger entries: id, customer_id, operation_id, kind [grant,reserve,consume,release,refund,adjustment], quantity integer, grant_id, provider_event_id nullable, occurred_at, reason. Unique operation and provider-event constraints; transactionally reserve against eligible balance, never a browser counter. Subscription entitlement separate from consumable credits. EUR price and ten-credit offer remain configuration drafts until terms approved. No expiry timestamp or forfeiture logic until policy approved. Balance derives from ledger; preserve adjustment audit history. Test concurrent requests, last-credit races, idempotent retries and invalid quantities.

P0 — Reading operation / failure contract (backend + product)
POST reading operation with authenticated identity and client idempotency key; store question/consent version/minimal inputs, chosen card IDs, orientation and artwork edition, immutable request digest and state [reserved,generating,completed,failed,reversed]. Repeated key + same digest returns same operation/result; differing digest returns409. Reserve once. Durable completion stores result then consumes once in a transaction. Provider timeout/partial generation never returns a paid success; release reservation exactly once on failure, with retry/reconciliation for crashes. A disconnected UI resumes GET operation without redraw/recharge. Late success after reversal must not silently debit again. Never charge local free curated readings. Test crash after every state boundary, repeated click, timeout, late callback and interrupted reload.

P0 — Verified payment event inbox (after provider approval)
Provider adapter verifies signature over raw payload, replay window and expected environment; saves unique (provider,event_id) with payload digest before processing. Reject tampering and collisions. Reconcile authoritative transaction/customer/product/currency/amount before grant. Redirect/success URL is never payment evidence. Handle duplicate and out-of-order events with transaction version/status rules and an auditable retry/dead-letter queue. Grant approved allowance once per paid billing period or verified purchase. No entitlement from client claims. Test duplicate events, wrong customer, test/live mismatch, reversal-before-payment, forged payload and replay.

P0 — Cancellation, refunds and purchase restoration
Cancellation records verified end-of-renewal state and approved access policy; UI displays confirmed effective date, never promises an unapproved policy. Refund links original payment and grants; append reversal, retain audit trail and enforce approved treatment of used credits (professional/product decision, no silent negative charges). Web restoration queries verified customer ledger. Native iOS only if pursued: verified App Store transaction/original transaction and server notifications, explicit restore action, account binding and duplicate-grant prevention across platforms. No web-to-native billing workaround. Test cancel retries, refund duplicate, chargeback, renewal and restore on new device.

P1 — AI consent and private data
Keep curated/local flow available. Explicit per-operation consent names selected AI processor, exact fields sent, purpose and retention; no journal, follow-up, birth data or private response by default. Snapshot consent version/time with operation; withdrawal stops future sends. Processor failure does not erase local work or consume credits. Avoid forecasts, diagnoses and compatibility scores. Separate optional analytics consent; no raw question/birth/journal telemetry. Acceptance: inspect outgoing payload and prove absence of unrelated private fields; consent-off has zero AI requests.

P1 — Opt-in local journal migration
Default remains local. Present inventory and preview, explicit upload consent, account destination and export-first option. Stable reading IDs + content digest provide idempotent import; preserve original words, dated follow-ups, card/orientation/deck and artwork edition. Conflict keeps both revisions for user resolution. Transactional receipt identifies uploaded IDs; never erase local copy automatically. Reload/interruption resumes checkpoint. Birth data requires separate consent; importing journal does not authorize birth upload. Remote delete and local delete are separate choices. Test unknown versions/corruption, repeated import, lost connection and account switch.

P1 — Operations and launch rehearsal
Provider sandbox only after approval; end-to-end paid-operation retry/reversal/refund/restore tests using explicit test fixtures. Release manifest ties reviewed seller/offer/consent/provider configuration to commit. Separate staging/live secrets and server-side feature gates; audit support actions, monitor failed reservations/webhooks, reconcile ledger daily without logging private prompts. Rollback disables new purchases while preserving existing paid access and journal export. Owner signs release checklist; this draft does not approve production.

## Product helper brief
Prepare EN/UK first-purchase and restore journeys with honest paused states. Gather seller/provider decisions, renewal and credit rules, then write consent and cancellation copy for review. Ten readings should mean ten reliably delivered paid results: failed results restore allowance. Preserve free reflection, artwork editions, local journal and astrology continuity. Make balance, renewal date and restore action clear without pressure, streaks or unsolicited notifications. Never imply that prototype billing or a proposed price is already available.
