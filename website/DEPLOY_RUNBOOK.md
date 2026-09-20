# DEPLOY RUNBOOK — first charged dollar

Human-only steps. Everything code-side is done or in a sibling lane; this is the sequence Claude cannot execute for you. Source of truth for WHY each step exists: `LAUNCH_READINESS_2026-09-20.md` (P0 list). Order matters — start §2 (processor) day one, it is the wall-clock long pole. §1–§4 can run in parallel with it.

**Env-flag invariant:** prod today has all three `NEXT_PUBLIC_*_ENABLED` flags unset = everything paused. Nothing in this runbook changes user-visible behavior until §5.

---

## 1. ENTITY — Olivia Arcana LLC (or rewrite legal pages)

Every legal page + JSON-LD names "Olivia Arcana LLC (Wyoming)". Entity does not exist. Charging under a fictional counterparty = fraud-adjacent; every processor's KYC will demand proof. Two paths — pick one:

**Path A — register the LLC (recommended, matches copy as-is):**
- [ ] Pick Wyoming registered agent (Northwest Registered Agent / Registered Agents Inc / Wyoming Agents). ~$100–150/yr agent + $100 WY state filing fee. Filing online, 1–3 business days.
- [ ] File Articles of Organization, name exactly `Olivia Arcana LLC`.
- [ ] Get EIN: IRS Form SS-4. Non-US-resident owner → cannot use online EIN tool; fax SS-4 to IRS (+1-855-641-6935) or phone +1-267-941-1099. Free. 1–2 weeks by fax.
- [ ] Open US business bank account (Mercury/Relay — remote-friendly for WY LLCs, free). Needed for processor payout.
- [ ] Keep: Articles + EIN letter (CP 575) — processor KYC uploads.
- Annual cost after year 1: ~$160/yr (agent + $60 WY annual report min).

**Path B — no LLC:** rewrite all 6 legal pages + JSON-LD (`terms`, `privacy`, `refund`, `cookies`, `disclaimer`, `dmca`, site JSON-LD org block) to real personal name/entity. Free but personal liability + weaker processor optics. Tell Claude which entity string; it does the rewrite.

- [ ] Decision made: ___ (A / B)

---

## 2. PROCESSOR — start this FIRST (long pole)

Stripe: banned the vertical (historical, per code comments). **Paddle: BANNED** — AUP prohibited category 14 explicitly names clairvoyance/horoscopes/fortune-telling. Backend `services/paddle_service.py` and all legal pages target Paddle as Merchant of Record — any non-Paddle choice requires (a) Claude rewrites `paddle_service.py` for the new processor, (b) Claude rewrites the MoR language in legal pages. Both are code work, but blocked on YOUR decision here.

### Decision table

| | Gumroad | Lemon Squeezy | High-risk gateway (CCBill / PaymentCloud) | Telegram Stars only |
|---|---|---|---|---|
| Vertical allowed? | **YES, explicit** — astrology/tarot for "insight, reflection or entertainment"; bans concrete-outcome predictions + medical/legal/financial claims | No pseudo-science clause, but bans all "services" (kills video reading) — and Stripe-owned → policy convergence risk, mid-flight ban plausible | Yes — this vertical's traditional home | Yes (digital goods in Telegram) |
| Onboarding | Email signup, near-instant; ID verify at first payout | Standard KYC, days | Application + underwriting, **2–6 weeks**, wants entity docs (§1) + site live | Bot already exists; BotFather setup, hours |
| Subscriptions | Supported but weak UX (memberships) | Full subscription engine, good | Full, proper | Stars subscriptions exist but rail is Telegram-locked |
| Fees | 10% flat + card fees | 5% + 50¢ | ~$0–1k setup, 3.9–7.5% + reserves (10% rolling common) | ~30% effective (Stars purchase spread), payout via Fragment/TON |
| Payout | Weekly, PayPal/bank | Bank, ~2 wk net | Bank, weekly/biweekly, reserve held | TON crypto → you handle conversion + accounting |
| MoR (handles VAT)? | Yes | Yes | **No — you own VAT/sales tax** | N/A |
| Ban risk | Low if copy stays entertainment-framed | **Medium-high** (Stripe ownership) | Low (they priced the risk in) | Low, but platform-locked audience |
| Code changes needed | Replace `paddle_service.py` with Gumroad license-key/webhook flow; overlay checkout → Gumroad-hosted page; legal pages: Gumroad as MoR | Replace with LS API (closest 1:1 to Paddle Billing shape); legal pages: LS as MoR | Replace with gateway API; legal pages: YOU as merchant + VAT registration section | Wire existing `telegramStarsLink` + bot; unify the two separate Stars implementations; legal pages: drop MoR language |
| Verdict | **Fastest to first dollar** | Test account first; don't build until approved | **Right long-term home for subscriptions** — start application NOW even if launching on Gumroad | Viable secondary rail, not primary |

**Recommended:** apply to a high-risk gateway today (weeks of lead time) + launch on Gumroad meanwhile. Sell only `insight_*` + `premium_*` subscriptions at launch — VIP/video-reading/solar-return are vapor (readiness audit Q2), drop from pricing until built.

- [ ] High-risk gateway application submitted (needs §1 entity + live site): date ___
- [ ] Gumroad account created + product(s) drafted (unpublished)
- [ ] Decision recorded, told Claude → `paddle_service.py` rewrite + legal-page MoR rewrite

### Copy-framing rules (whichever processor wins — non-negotiable)
- Entertainment / self-reflection framing ONLY. Never "will happen", "predicts", "your future".
- Zero medical, legal, financial, pregnancy, death claims — anywhere: site, checkout, receipts, ads.
- Disclaimer visible pre-purchase (already exists — keep it linked from checkout).
- No testimonial implying predictive accuracy.

---

## 3. SUPABASE — recreate project (old one deleted, DNS-dead)

- [ ] supabase.com → New project (free tier OK to start; Pro $25/mo when real users). Region close to users.
- [ ] Google OAuth client: console.cloud.google.com → APIs & Services → Credentials → Create OAuth client ID (Web application):
  - Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
- [ ] Supabase → Authentication → Providers → Google: paste client ID + secret, enable.
- [ ] Supabase → Authentication → URL Configuration:
  - Site URL: `https://oliviaarcana.com`
  - Redirect URLs: `https://oliviaarcana.com/profile/`
- [ ] Supabase → Project Settings → API → **JWT Settings → legacy JWT secret**: copy → this is `SUPABASE_JWT_SECRET` for the backend (§4). Do NOT paste into any repo file.
- [ ] Netlify env (also in §5 block):

```bash
cd /Users/macbookpro/olivia-arcana/website
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://<project-ref>.supabase.co"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "<anon-key>"
```

---

## 4. BACKEND DEPLOY — Railway

Backend code: `/Users/macbookpro/olivia-arcana/backend` (FastAPI, Dockerfile present). Never deployed. SQLite default = data wiped every redeploy → **Postgres addon mandatory**.

- [ ] railway.app → New Project → Deploy from local dir or GitHub repo pointing at `backend/` (Dockerfile auto-detected). ~$5/mo hobby.
- [ ] Add Postgres plugin → Railway injects `DATABASE_URL`. Verify backend uses it (async driver: URL must be `postgresql+asyncpg://...` — if Railway gives `postgresql://`, set `DATABASE_URL` manually with the `+asyncpg` scheme). ~$5/mo.
- [ ] Set env vars per `backend/.env.example` (lane E is completing this file — it is the authoritative list). Known set today: `DATABASE_URL`, `JWT_SECRET` (generate: `openssl rand -hex 32` — hardcoded fallback in `api/auth.py` is a prod vuln), `SUPABASE_JWT_SECRET` (from §3), `ANTHROPIC_API_KEY`, `SITE_URL=https://oliviaarcana.com`, `TELEGRAM_BOT_TOKEN_EN`, plus processor keys per §2 outcome (Paddle names in `services/paddle_service.py` docstring — will be renamed by the processor rewrite).
- [ ] Custom domain (e.g. `api.oliviaarcana.com` CNAME → Railway) **or** update Netlify:

```bash
netlify env:set NEXT_PUBLIC_API_URL "https://<railway-service>.up.railway.app"
```

- [ ] Register webhook URL at the processor (§2) → `https://<api-domain>/payments/webhook` (confirm exact path in backend after processor rewrite). Copy webhook signing secret into Railway env.
- [ ] Smoke test: `curl https://<api-domain>/` returns non-404; `/payments/status` responds.

---

## 5. NETLIFY ENV — the flag flips

**Every `NEXT_PUBLIC_*` var is inlined at build time. Nothing takes effect until a redeploy.** After each `env:set` batch:

```bash
cd /Users/macbookpro/olivia-arcana/website
netlify deploy --build --prod
```

Order — do NOT set them all at once:

```bash
# Step 1 — after §3 done and sign-in manually tested on a deploy preview:
netlify env:set NEXT_PUBLIC_ACCOUNTS_ENABLED true

# Step 2 — after §4 done + processor live (§2) + one real sandbox/test purchase verified:
netlify env:set NEXT_PUBLIC_PAYMENTS_ENABLED true

# Step 3 — new Anthropic key (old one 502s in prod — create fresh at console.anthropic.com):
netlify env:set ANTHROPIC_API_KEY "sk-ant-<NEW>"

# Step 4 — LAST. Only after a FULL WEEK of paid flows working with paywall off
# (people can pay, nothing is locked). Locking content behind a broken paywall
# = refund storm; selling before locking = zero risk.
netlify env:set NEXT_PUBLIC_PAYWALL_ENABLED true
```

- [ ] Redeploy after each step; verify flag took effect on prod before next step.

---

## 6. EMAIL

**Receiving** — MX for oliviaarcana.com = Namecheap eforward (verified working 2026-09-20; SPF record only covers forwarding, not sending):
- [ ] Namecheap dashboard → Domain → Redirect Email: confirm forwarding rules exist for ALL of: `support@`, `privacy@`, `hello@`, `legal@`, `dmca@` → an inbox you actually read. Legal pages publish all five. Unmonitored refund inbox = processor-account-risk event.
- [ ] Send a test mail to each of the five, confirm arrival.

**Sending** (password reset, receipts, change notices — promised in privacy policy, currently zero capability):
- [ ] Resend (resend.com) — free tier 3k/mo, fine at launch. Add domain, set the DKIM + SPF records they give in Namecheap DNS (do not delete the eforward MX records), verify.
- [ ] `RESEND_API_KEY` → Railway backend env (wiring is code work — tell Claude once key exists).

---

## 7. GO-LIVE TEST SCRIPT — run with a real card, in order

Prereq: §1–§6 done except PAYWALL flag (still off). Use your own card.

1. [ ] Incognito → oliviaarcana.com → sign in with Google → lands on /profile/ signed in.
2. [ ] Buy `insight_monthly` ($4.99) with a real card through the live processor checkout.
3. [ ] Processor dashboard: transaction shows. Railway logs: webhook received + 200.
4. [ ] `/account/billing`: tier chip shows **Insight** (not "Free") + Manage button present.
5. [ ] `/checkout/success`: copy matches the tier actually bought (not "Welcome to VIP").
6. [ ] Receipt email arrived.
7. [ ] Cancel via Manage/portal → billing page status flips (cancel-at-period-end or immediate — note which).
8. [ ] Refund the transaction in the processor dashboard → within 14-day policy → status/tier revoked correctly.
9. [ ] Repeat 2–8 once for `premium_monthly`.
10. [ ] Sign out, sign back in on a second device/browser → tier persists (server-side, not localStorage).
11. [ ] Run paid flows for a full week with paywall OFF. Zero webhook failures + zero support incidents → flip `NEXT_PUBLIC_PAYWALL_ENABLED` (§5 step 4) → redeploy → verify a free account now sees gates and a paid account does not.

Any step fails → stop, do not proceed to the next flag.

---

## 8. ANALYTICS (optional, post-launch OK)

- [ ] Plausible ($9/mo, EU, cookieless) or self-hosted Umami on the Railway box (~free). Cookieless mode = no consent banner needed.
- [ ] If you ever add cookie-based analytics or ads: consent banner becomes REQUIRED first (privacy policy + /cookies page must match). Add both together, never analytics alone.

---

## Cost summary (launch config)

| Item | Cost |
|---|---|
| WY LLC (agent + filing) | ~$200–250 yr 1, ~$160/yr after |
| EIN | $0 |
| Supabase | $0 → $25/mo at scale |
| Railway (API + Postgres) | ~$10/mo |
| Processor | 5–10% of revenue (path-dependent) |
| Resend | $0 at launch volume |
| Plausible (optional) | $9/mo |
| Anthropic API | usage-based — tier-gate /ask before flipping key or it is an open credit drain (readiness P0 #8) |
