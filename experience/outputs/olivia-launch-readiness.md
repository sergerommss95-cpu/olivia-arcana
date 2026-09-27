# Olivia Arcana — launch readiness audit

Read-only audit, 24 September 2026. Scope: current `work/olivia-product` experience, `/Users/macbookpro/olivia-arcana/website`, and the related backend source. No credentials were printed, no accounts created, no payments initiated, and no production changes made.

**Implementation update later the same day:** Today, stable daily cards, next steps/revisits, topic grouping, local sharing, persisted single-card drafts, and the free three-card flow are now implemented and browser-tested. A separate hosted build now uses cacheable assets; the approximately 30 MB file remains the offline edition. The observations below about in-memory drafts and the original hosted packaging describe the earlier audit snapshot. Account, cloud-storage and billing blockers are unchanged. See [the delivered changes and verification](./olivia-product-evolution.md).

## Decision

The current 78-card reading experience is a useful local product prototype. It is **not ready to sell as a reliable account-backed subscription product**. The primary blockers are identity, durable private storage, provider verification, payment lifecycle reliability, and a tested personalized service—not the visual presentation.

## Observed service status

| Service | Observation | What this establishes |
|---|---|---|
| Configured Supabase project | Configured hostname failed DNS resolution | The configured account service could not be reached from this environment. Sign-in cannot be represented as verified. |
| Legacy account/payment API | `https://olivia-api.up.railway.app/api/health` returned 404 with “Application not found” | The URL used by the frontend account/payment client is not a functioning deployment at audit time. |
| Astronomy engine | `https://olivia-engine-production.up.railway.app/health` returned 200, `status: ok`, version `0.8.0` | A separate engine deployment is reachable. Its health response alone does not verify any paid, private, or AI workflow. |
| Public site | Request to `https://oliviaarcana.com/` timed out after 15 seconds | Inconclusive; this check does not establish a site outage. |
| Local configuration | Account/payment enable flags are absent from `.env.local`; both default to false | The local build intentionally pauses account/billing flows. Remote build configuration was not inspected. |

The engine's public API description lists chart, reading, sharing and subscription-related routes. It declares no security schemes. This is not proof that every route is unauthenticated, but it is insufficient evidence to entrust it with private journal data. No private data endpoints were called.

## What already exists and can be reused

- Complete 78-card catalogue and artwork, manual selection, three/five/eight-card spread positions, a coherent reveal flow, and browser-local reading records.
- Validated reading schemas with stable IDs, creation/update dates, immutable card assignments and exported JSON. These give a good starting point for import and cloud persistence.
- The embedded experience receives only membership state from its parent; it does not receive bearer tokens. Both sides validate message origin/source and request ID. Preserve that boundary.
- The subscription provider clears paid access on verification failure. Preserve its fail-closed behavior.
- Backend code contains payment status, checkout, billing portal, webhook and provider ledger concepts. These are implemented source paths, not proven live services.
- Honest local-storage descriptions in the new experience. Keep these until cloud sync really works.

Relevant files:

- `work/olivia-product/core.js`, `spread-core.js`, `spread-ui.js`
- `website/src/lib/experience-subscription.ts`
- `website/src/components/almanac/PersonalAlmanacHome.tsx`
- `website/src/hooks/useSubscription.tsx`
- `backend/api/payments.py`, `backend/db/models.py`

## Paid launch blockers

### 1. Choose and restore one account path

Google login/profile use Supabase; older API calls use a separate `olivia-token`. The payment helper scans browser storage for any Supabase session, while `CheckoutButton.tsx:57` checks only the legacy token. A valid Google user can therefore be forced through sign-in again. This should become one shared session adapter with refresh and sign-out behavior.

The backend's `api/auth.py:217` and `:230` accept `authorization` as a plain function parameter, not a `Header` dependency. The browser sends an HTTP header, so these `/me` routes will not read it as intended. The Supabase token verifier is HS256-only; compatibility with the restored project's actual signing configuration must be verified.

Minimum acceptance: sign in, refresh, expire/refresh session, sign out, sign in again, and open the same account on a second device. An unauthenticated or different user must not read another person's records.

### 2. Implement private cloud records and recovery

All three journal systems are browser-local: single readings, spreads, and the older moon journal. No reading/journal tables or routes exist in the audited account/payment backend. Single/spread stores each limit saved records to 100. Draft changes are currently held in memory.

The older `website/src/lib/journal-store.ts:40` swallows write errors, allowing its UI to present “Saved” after a failed write. The newer reading stores surface errors; reuse that stronger behavior.

Minimum implementation: owner-scoped reading records, notes, question threads and revisit dates; local drafts with explicit sync state; opt-in import of existing browser records; idempotent upsert by existing UUID; conflict handling; export and deletion. Do not upload private existing notes silently. Preserve offline access and copies while migrating.

For the current architecture, either place private journal tables behind Supabase Auth with owner-based database policies, or expose equivalent owner-checked routes in the restored backend. Choose one system of record. Keep account credentials in the parent and communicate narrow save/load commands to the iframe, or remove the iframe during a planned integration rather than passing tokens through messages.

### 3. Verify one payment provider and consolidate the offer

The handoff document describes Stripe, two tiers and old prices. Actual code uses Paddle, Telegram Stars, four tiers and a la carte products; public plan labels also differ (`Premium` vs `Astronomer`, `VIP` vs `Patron`). These need one offer and one entitlement model before paid release.

Repository comments about provider eligibility are not verified provider approval. Verify merchant acceptance and actual sandbox credentials independently before making availability claims. Do not enable billing simply by setting its flag.

The current `CheckoutButton.tsx:45` redirects to Telegram when web payments are disabled. That creates a second purchase path with unverified account reconciliation. Hide purchasing or label it unavailable until one end-to-end purchase flow is verified; never imply the web subscription was activated from an unverified external payment.

### 4. Harden payment lifecycle before taking money

- `backend/services/paddle_service.py:191`: signature verification lacks timestamp freshness checks; malformed signature parsing can raise an exception. Use a verified SDK or implement validated parsing and replay protection.
- `paddle_service.py:233`: transaction handling creates rows without a duplicate-event check. A unique ledger ID may prevent duplicate rows by raising an error, but repeated webhook deliveries must succeed idempotently rather than repeatedly fail.
- Subscription updates need stale/out-of-order event protection and explicit coverage for cancellation, pause, failed payment, refund and reinstatement.
- The purchase handler sets `has_content=True` before generating or storing content. A receipt must not claim a purchased reading is ready when no reading exists.
- `website/src/app/checkout/success/page.tsx:158` says “Payment Received” after its confirmation polling expires, even if the API could not verify payment. Replace it with an honest pending/unverified state.
- Checkout success/cancel destinations should be server-controlled/allowlisted. Test the provider request format against current official documentation rather than trusting the existing comments.
- Backend initialization uses `create_all`, which does not migrate existing tables. Add explicit versioned migrations before changing a live schema.

Minimum acceptance in sandbox: purchase, duplicate webhook delivery, delayed webhook, missed/out-of-order event, cancellation with access through paid period, refund, subscription expiry, customer portal, and reconciliation after interruption. Do not use real purchases to test routine correctness.

### 5. Make any paid personalization real

The current tarot experience displays the user's question beside curated card/position text; it does not semantically interpret that question. This is clearly disclosed in `spread-ui.js` and should remain disclosed.

An old backend `api/ask.py` contains generic prewritten astrology responses and an optional model request, but it is not mounted by that backend's `main.py`. The separate reachable engine also advertises `/ask` and `/reading`; this audit did not submit personal data or paid model requests, so their quality and privacy behavior remain unverified.

A new contextual reading service needs authenticated requests, server-side entitlements, usage limits, reliable failure states, editorial evaluations, and explicit controls over prior notes used as context. Static client-side access gates are presentation controls and cannot secure costly paid generation.

## Important improvements that can proceed without live accounts

1. A returning visitor home, stable daily card, durable local drafts, question threads and scheduled revisit UI can be delivered locally with truthful device-only labels.
2. A shareable image containing only selected card art and an explicitly selected public insight can be exported locally. Avoid including private questions or notes by default.
3. A single membership comparison can be developed as a non-purchasing preview while infrastructure is restored. Existing paid users, if any, need a mapping/migration rather than silently changing their access.
4. The current standalone HTML is approximately 30 MB. Preserve it as an offline download, but make the hosted edition use cacheable fonts/runtime and card artwork loaded when needed. Test cold-load performance on a midrange phone.
5. Add privacy-conscious measurement of first reading completion, saving, voluntary return, and paid conversion. The audited frontend contains no operational product analytics integration. Do not send journal text or questions as event properties.
6. Establish an identifiable editorial voice and review process. New motion should preserve reading comprehension, keyboard/touch access, and reduced-motion behavior.

## Minimum release sequence

1. **Local product beta:** improve continuity, recovery, sharing and copy; retain device-only disclosure; no payment promise.
2. **Account beta:** restore one identity service, private cloud persistence and local import; test two-device sync, user isolation, deletion/export and backup restoration.
3. **Paid sandbox:** one membership, verified provider setup, server-side entitlement enforcement and complete billing lifecycle tests.
4. **Controlled release:** production configuration and monitoring verified, clear support path, editorial quality checks, cold mobile performance measured; invite a small cohort and inspect completion/return behavior before wider acquisition.

This audit changes no launch flags and does not certify commercial readiness. Restoring services and validating the full customer journey are required before that claim is appropriate.
