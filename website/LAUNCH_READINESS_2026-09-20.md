# Paid-Launch Readiness Audit — 2026-09-20

**Verdict: NOT launchable as paid product. Web monetization is structurally dead, not just switched off. Zero dollars can be charged today, and the payment processor the whole stack targets (Paddle) bans the tarot/astrology vertical outright.**

Audit method: 6 parallel agents over disjoint scopes (auth frontend, payments/gating, backend reality incl. live curl checks + Netlify env, feature completeness vs tier promises, legal/ops, external market research). 141 tool calls, all findings file-verified.

---

## The three questions, answered

**1. Are we ready with features — paid access, sign-in, customer profiles?**
UI: built. Function: no. Sign-in is Supabase Google OAuth pointed at a **deleted Supabase project** (hardcoded `https://ghyzkpcxlnlfjzitdxkk.supabase.co` in `src/lib/supabase.ts` — DNS-dead, verified). Profile page works but reads localStorage only — a paying customer's birth data and history do not survive a device change. Billing page renders `ServicePaused`. And even if all backends were live: **auth split-brain** — sign-in produces a Supabase session, but every payment call authenticates with a JWT in localStorage `olivia-token` that is written ONLY by `src/lib/api.ts`, which **zero files import** (dead code). No exchange between the two exists. Every user is permanently tier "free" by construction.

**2. Have we developed paid-specific features that are fully working?**
No. Not one paid flow has ever processed a transaction end-to-end, even in sandbox. Frontend paywall machinery (Paywall, PlanGate, CheckoutButton, pricing, billing, checkout success/cancel) is complete and coherent — and functionally dead. Worse, several SKUs are vapor:
- **VIP $34.99/mo / $299/yr** promises voice-reading + early access — **zero implementation** of either (feature ids exist only in `plans.ts`).
- **Video reading $49.99** — price card + refund clause exist; no booking, no scheduling, no fulfillment of any kind. Chargeback machine.
- **Solar return $14.99 addon** — only implementation is a birthday countdown on /daily.
- **All 6 addons** — `hasPurchased()` is imported by zero files; a paid addon unlocks nothing.
- **"Unlimited draws" (Insight)** — no limit enforced for anyone, so the perk is hollow.

**3. What's lacking to launch paid?** Everything below.

---

## P0 — cannot charge a dollar until fixed

1. **Paddle bans the vertical.** Paddle AUP prohibited category 14: "Digital services associated with pseudo-science, including… clairvoyance, horoscopes, fortune-telling" (paddle.com/help — hard ban, not restricted). Code comments say "Stripe banned → Paddle MoR strategy" — Paddle bans it too. Entire payment architecture targets an impossible processor. Alternatives (researched):
   - **Gumroad** — explicitly ALLOWS astrology/tarot/divination for "insight, reflection or entertainment", incl. one-off personalized readings; bans concrete-outcome predictions + medical/legal/financial framing. Weak subscription UX.
   - **Lemon Squeezy** — no pseudo-science clause, but bans all "services" (kills video readings) and is Stripe-owned (policy convergence risk).
   - **Telegram Stars** — rail partially coded already (bot + `telegramStarsLink`); viable secondary.
   - **High-risk gateways** (CCBill/PaymentCloud class) — the vertical's usual home for subscriptions; fees higher, you own VAT.
2. **Backend not deployed.** `olivia-api.up.railway.app` → 404 "Application not found" (verified). Code EXISTS at `olivia-arcana/backend` — FastAPI auth (register/login/me/birth-data) + payments (Paddle checkout/portal/webhook, Stars invoice, /status) matching the frontend contract exactly, real Paddle Billing API calls — but never deployed, untested, SQLite on ephemeral disk (every redeploy wipes users/subscriptions), JWT secret falls back to hardcoded string, and all ~15 payment env vars empty everywhere.
3. **Supabase project deleted.** Sign-in breaks at DNS. URL/key hardcoded, not env-driven. Recreate project (or drop Supabase) + re-point.
4. **Auth split-brain** (above). Backend `auth.py` verifies Supabase JWTs; website `api.ts` expects its own JWT; login pages use Supabase OAuth. Three schemes, never reconciled. Need one auth system + session→payment-API bridge.
5. **Checkout funnel dead-ends.** Tokenless buyer → `/onboarding/?redirect=checkout&price=X`; onboarding ignores both params and exits to /chart. 100% of purchase intent dropped.
6. **All three kill switches off + Netlify env empty.** `NEXT_PUBLIC_PAYMENTS_ENABLED` / `ACCOUNTS_ENABLED` / `PAYWALL_ENABLED` unset → every buy button is a bare Telegram link, every gate free, billing paused. Netlify prod has exactly ONE env var (`NEXT_PUBLIC_API_URL`). This state is deliberate and honest (`service-status.ts`: backends "torn down while the project was dormant") — but it is the off position.
7. **"Olivia Arcana LLC (Wyoming)" unverified.** Named in terms, privacy, JSON-LD, contact. No evidence entity exists. Charging under a fictional counterparty is fraud-adjacent; any processor's KYC requires it. Register the LLC (or rewrite pages to the real entity) before first charge.
8. **/api/chat live but 502** — Anthropic call failing (bad/absent key; no ANTHROPIC_API_KEY in Netlify env). And `/ask` page never calls it anyway: it ships **7 canned regex-matched responses** ("Claude API integration when backend is ready"). Complete streaming edge function + orphaned `chat-client.ts` sit unwired — days of work, not weeks. Charging for the current /ask = selling a lorem-ipsum oracle. Also: edge fn has no tier check, in-memory 20/IP/hr limit, CORS `*` — open Anthropic-credit drain once key works.

## P1 — launchable but embarrassing or legally risky

- **Auth pages orphaned**: zero links to /login, /register, /profile, /account/billing in masthead or homepage. Customers cannot find sign-in or billing.
- **Billing page**: insight/premium subscribers see tier chip "Free"; "Manage Subscription" renders only for VIP → **no cancel path in UI** while refund policy promises "cancel any time from /account/billing".
- **/checkout/success hardcodes "Welcome to VIP"** for any purchase, verifies nothing (1.5s timer + swallowed status call). Directly visitable on static export.
- **Privacy promises account deletion at /account/billing** — page has no delete UI. Unbacked GDPR erasure promise.
- **Terms claim Google-only sign-in** while code ships email/password too — contract misdescribes product.
- **No transactional email at all** — no password reset, no promised change notices. Locked-out paying customers = chargebacks.
- **Support mailboxes unverified** (support@/privacy@/legal@/dmca@oliviaarcana.com). Unmonitored refund inbox = processor-account-risk event.
- **Static export = every gate decorative.** All premium content/data ships in the JS bundle to everyone; `Paywall` renders full gated children into DOM behind CSS blur (one devtools click). Real enforcement requires server-side content. Acceptable business risk at launch scale — but know it.
- **Gate/tier contradictions**: transits page gates at insight, `plans.ts` says premium; premium-only spreads never individually enforced (Insight $4.99 gets nearly everything Premium sells); `UpgradePrompt` (with its "5 messages/day" claims) is dead code.
- **Journal (paid tier) is localStorage-only** — silent total data loss on device change/private mode. Sync or disclose.
- **Daily horoscope headline pool ~3 texts/sign** — repeats every 3 days. Fine free, not paid.
- **Telegram Stars deep link dead** — fallback sends buyers to bot with no product context (`telegramStarsLink` imported, never called). Bot + backend also have two SEPARATE Stars implementations sharing no DB.

## P2 — polish

Language switcher orphaned (163KB translations, 8 locales, UA deck all wired — unreachable manually) · /cookies missing from footer · no age gate (birth date already collected — trivial to enforce 18+) · zero analytics (also why no consent banner needed yet — add together) · trust set absent (reviews near CTA, guarantee badge, sample reading surfaced at checkout) · Pricing hardcodes "-35%" badge · two addons share display-name key (year-ahead + solar-return both "price_i4") · stale "Post-Stripe" comment.

---

## What IS genuinely ready

- **Legal text**: 6 substantive, product-specific pages (terms/privacy/refund/cookies/disclaimer/DMCA) — Paddle-MoR-aware, 14-day refund + EU withdrawal, entertainment disclaimer covered 5 ways. Best-in-audit. (Paddle references need rewrite for whichever processor wins.)
- **SEO**: full metadata/OG/JSON-LD, robots.txt, 57-URL sitemap.
- **Price model**: single source of truth (`PRICING`/`ADDONS`), consistent across UI + JSON-LD, competitive vs market — CHANI $12/mo, Sanctuary $14.99/mo + $5–10/min live, Nebula $7.99/wk, Co-Star ~$15/mo, Labyrinthos $9.99/mo. Apple-30% native-shell avoidance handled.
- **Gate architecture**: coherent flip-one-flag design, ready when backend exists.
- **The product itself** (client-side, sellable now): synastry full 2-person flow + invite links · life-timing page · transits · all 4 spreads with real local reading-synthesis engine · expert-grade birth chart · 257-lesson academy in 8 locales · daily (as free hook). Auth/account pages already in the engraved-night register — no restyle needed.

## Honest launch shape (recommendation)

**Sell Insight $4.99 + Premium $14.99 subscriptions only. Drop VIP, video reading, solar-return addon from pricing until built.** Sequence:

1. **Processor decision first** — longest pole, gates everything: Gumroad (fastest, entertainment-framed copy) / Lemon Squeezy (test onboarding) / high-risk gateway (subscriptions proper). Register the Wyoming LLC in parallel.
2. **One auth system**: recreate Supabase (or replace with backend-native auth), add session→payment-JWT bridge, fix onboarding checkout handoff.
3. **Deploy `backend/`** on Railway with Postgres (not SQLite), real env vars, rewrite `paddle_service.py` for chosen processor, webhook wiring.
4. **Wire /ask to the existing edge function** + set ANTHROPIC_API_KEY + tier-gate it (kills the canned-response embarrassment, days of work).
5. **Fix P1 storefront lies**: nav entry points, billing tier display + cancel path, tier-aware success page with real verification, terms auth wording, delete-account UI or policy fix, transactional email (Resend/Postmark), verify mailboxes.
6. Flip `NEXT_PUBLIC_ACCOUNTS_ENABLED` + `PAYMENTS_ENABLED` (+ `PAYWALL_ENABLED` last), run one real end-to-end purchase + refund + cancel test, then launch.

Code work: ~1–2 focused weeks. Wall-clock long pole: processor approval + LLC registration.
