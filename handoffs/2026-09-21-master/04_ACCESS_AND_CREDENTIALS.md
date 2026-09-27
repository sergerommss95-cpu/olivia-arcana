# Access, Permissions and Data — what it takes to run Olivia Arcana

*Compiled 2026-09-22 by reading the repo, not from memory. Every variable name
below was verified present in source, a `.env.example`, or `netlify.toml`.*

---

## 0. Read this before you paste anything anywhere

**This document deliberately contains no secret values.** Key names, yes. Values,
never.

If you are handing this to ChatGPT (or any other external assistant) so it can help
run the project:

- **Safe to share:** everything in this file. Variable names, service names, which
  account owns what, what is alive and what is dead, architecture, the runbook.
- **Never share:** the contents of `.env`, `.env.local`, any `sk-ant-…`,
  `sb_secret_…`, `SUPABASE_JWT_SECRET`, `JWT_SECRET`, bot tokens, processor API
  keys or webhook secrets, database URLs with passwords in them.

Pasting a key into a chat window publishes it. It may be logged, cached or retained
even if you delete the message. If a key ever does land in a chat, treat it as
burned and rotate it at the provider — do not just delete the message.

**An assistant does not need any secret to help with this project.** It needs the
*names* and the *shape*. Every single task on the current backlog — the card act,
the Edition System, the design work, the SEO pages, the processor rewrite — is
doable with zero credentials. Only *deploying* and *charging money* need real keys,
and those are operations you run yourself, on your own machine or in a provider
dashboard.

---

## 1. Accounts — who owns what

| Service | What it holds | Status |
|---|---|---|
| **GitHub** | `github.com/sergerommss95-cpu/olivia-arcana` — the monorepo (site, backend, bot, deck pipeline) | alive; `main` auto-deploys |
| **Netlify** | Site ID `61c7559d-6bcf-4e3f-bb3e-79348ca6ea6b`; builds `website/` on push to `main`; hosts the `/api/chat` edge function | alive; **only one env var set in production** |
| **Namecheap** | `oliviaarcana.com` — registrar **and** DNS **and** MX (eforward) | alive; forwarding verified 2026-09-20 |
| **Supabase** | Google OAuth sign-in, user rows | **DELETED.** Old project URL is DNS-dead. Must be recreated. |
| **Railway** | Intended home of the FastAPI backend + Postgres | **never deployed.** `olivia-api.up.railway.app` 404s. |
| **Anthropic** | `ANTHROPIC_API_KEY` for the `/api/chat` edge function and the backend `/ask` endpoint | key exists but **502s in prod — assume dead, create a fresh one** |
| **Telegram / BotFather** | Up to 8 bots + 8 channels, one per language; also the Stars payment rail | bot exists; channels idle |
| **Payment processor** | — | **NOT CHOSEN.** See §5. This is the long pole. |
| **Resend** | Transactional email (password reset, receipts) — promised in the privacy policy | **not created.** Zero sending capability today. |
| **Runware** | Seedream 5.0 Pro — generated the carved hero plates and the deck | used offline, not needed at runtime |
| **Plausible** | Analytics | optional, not set up. Zero analytics today. |

Not a service, but load-bearing: **"Olivia Arcana LLC (Wyoming)"** is named in all
six legal pages. Its existence is unverified. Either register it or rewrite the
pages.

---

## 2. Environment variables, by surface

### 2a. Website build — Netlify, and `website/.env.local` for dev

| Name | Purpose | Needed to… |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | sign-in |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable key (safe in the browser by design) | sign-in |
| `NEXT_PUBLIC_API_URL` | FastAPI base. Defaults in `netlify.toml` to the not-yet-deployed Railway URL | accounts, payments |
| `NEXT_PUBLIC_ENGINE_URL` | optional natal-chart engine at `~/olivia-engine`. **Unset → `lib/engine.ts` quietly disables itself** and the site falls back to its own astronomy | nothing; it is an upgrade |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | kill-switch | show the purchase rail |
| `NEXT_PUBLIC_ACCOUNTS_ENABLED` | kill-switch | show the Account nav entry |
| `NEXT_PUBLIC_PAYWALL_ENABLED` | kill-switch | lock premium content |
| `ANTHROPIC_API_KEY` | **server-side only**, consumed by `netlify/edge-functions/chat.ts` | the live `/ask` oracle |

> All three `*_ENABLED` flags are **unset**, which is why the two local commits are
> inert. Flipping them is the launch sequence, in the order given in
> `website/DEPLOY_RUNBOOK.md` §5 — and `PAYWALL_ENABLED` goes **last**, a full week
> after payments work. Locking content behind a broken paywall is a refund storm.

Anything prefixed `NEXT_PUBLIC_` is compiled into the browser bundle. It is public
by construction. Never put a secret behind that prefix.

### 2b. Backend — Railway (`backend/.env.example` is the canonical list)

| Name | Purpose |
|---|---|
| `ENV` | `production` makes a missing `JWT_SECRET` a startup error |
| `JWT_SECRET` | signs our own HS256 access tokens — **required in production** |
| `SUPABASE_JWT_SECRET` | verifies Supabase bearer tokens from the frontend |
| `DATABASE_URL` | Postgres; `postgres://` is auto-rewritten to asyncpg. Unset → ephemeral local SQLite |
| `ANTHROPIC_API_KEY` | the `/ask` endpoint |
| `PADDLE_ENV`, `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET` | processor — **see §5, Paddle is unusable** |
| `PADDLE_PRICE_*` | 6 subscription + 6 addon price IDs |
| `TELEGRAM_BOT_TOKEN_EN` | Stars invoices and refunds |
| `RESEND_API_KEY` | not yet wired; code work once the key exists |

`backend/services/stripe_service.py` still exists and is **dead code** — never
imported. Its `STRIPE_*` vars are not read. Stripe bans this vertical.

### 2c. Bot and social pipeline — repo root `.env`

8 × `BOT_TOKEN_{EN,UK,RU,AR,DE,ES,PT,FR}`, 8 × `CHANNEL_ID_*`,
`ANTHROPIC_API_KEY`, `CRYPTOBOT_API_TOKEN`, `HEYGEN_API_KEY` (video readings),
`ELEVENLABS_API_KEY` (voice), `DATABASE_DIR`. Plus `QUIVER_API_KEY` in
`social-pipeline/.env`.

HeyGen and ElevenLabs serve the $49.99 video reading, which the readiness audit
recommends **dropping** — it has no implementation or fulfilment path. If you drop
it, both keys become unnecessary.

---

## 3. The short answer: what you need to just run the site

**Nothing.** No account, no key.

```bash
cd ~/olivia-arcana/website
npm install
# start the dev server through the harness' preview_start "olivia-site" (port 3300)
```

The whole almanac — the hero, the card act, the readings, the charts, the academy,
tonight's real sky — is computed **client-side** by `astronomy-engine`. Sign-in,
payments and the AI oracle degrade gracefully to nothing when their variables are
absent. That is deliberate and it is why the site has always been demoable.

To **deploy the marketing site** as it is today: push to `main`. Netlify builds it.
Still no keys required.

Keys only start mattering at: *sign in*, *charge money*, *answer with an LLM*.

---

## 4. What is alive, right now

✅ Domain, DNS, inbound mail forwarding · GitHub · Netlify build + hosting ·
the entire client-side product

❌ Supabase (deleted) · backend (never deployed) · Postgres (never created) ·
payments (no processor) · outbound email (no sender) · analytics (none) ·
Anthropic key (502s) · 5 of the 5 legal inboxes unmonitored until you check them

---

## 5. The blocker that is not a credential

**Paddle bans this vertical.** Its AUP prohibited category 14 explicitly names
clairvoyance, horoscopes and fortune-telling. The backend's `paddle_service.py` and
the Merchant-of-Record language in all six legal pages target Paddle.

Stripe bans it too. So the processor decision is a genuine fork, and it is
**yours to make** — not an assistant's, and not a code problem:

| | Gumroad | Lemon Squeezy | High-risk gateway | Telegram Stars |
|---|---|---|---|---|
| Vertical allowed | **yes, explicitly** (entertainment framing) | no pseudo-science clause, but bans "services"; Stripe-owned → convergence risk | yes — the traditional home | yes |
| Onboarding | near-instant | days | **2–6 weeks**, wants entity docs + a live site | hours |
| Fees | 10% + card | 5% + 50¢ | 3.9–7.5% + reserve | ~30% effective |
| Handles VAT (MoR) | yes | yes | **no — you own it** | n/a |
| Verdict | fastest to first dollar | approve before building | right long-term home | secondary rail |

Recommended: apply to a high-risk gateway **today** (the lead time is the point),
launch on Gumroad meanwhile, sell only Insight + Premium subscriptions.

Whichever wins, it is then code work: rewrite `paddle_service.py` for the new
processor and rewrite the MoR language in the legal pages. An assistant can do both
— with no credentials at all.

**Copy-framing rules, non-negotiable under every processor:** entertainment and
self-reflection framing only; never "will happen" / "predicts" / "your future"; zero
medical, legal, financial, pregnancy or death claims anywhere — site, checkout,
receipts, ads; disclaimer visible before purchase; no testimonial implying
predictive accuracy. Breaking these is how the account gets closed.

---

## 6. Order of operations to first dollar

From `website/DEPLOY_RUNBOOK.md`, which is the authority:

1. Entity — register the WY LLC, or rewrite the legal pages to match reality.
2. **Processor — start first, it is the long pole.**
3. Supabase — recreate the project, test sign-in on a deploy preview, then flip
   `ACCOUNTS_ENABLED`.
4. Railway — deploy the backend + Postgres.
5. Netlify env — flip `PAYMENTS_ENABLED` after one real verified purchase; fresh
   Anthropic key; `PAYWALL_ENABLED` **last**, a week later.
6. Email — confirm the five forwarding rules (`support@`, `privacy@`, `hello@`,
   `legal@`, `dmca@`); add Resend for sending, keeping the eforward MX records.
7. Go-live test script — with a real card, in order.

Launch cost: ~$200–250 for the LLC in year one, ~$10/mo Railway, $0 Supabase and
Resend at launch volume, 5–10% of revenue to the processor, Anthropic usage-based.

> Tier-gate `/ask` **before** putting a live Anthropic key in production, or it is
> an open credit drain. This is P0 #8 in the readiness audit.

---

## 7. What an external assistant cannot do

Worth saying plainly, so the division of labour is clear. It has no access to your
machine, your repo, your dashboards or your inboxes. It cannot start the dev
server, run the headless verification, read the actual `.env`, or see whether a
render looks right.

So the useful split is: **it reasons and drafts, you run and verify.** Give it this
file, the four master docs, and the specific source file in question — that is
genuinely enough context for design, architecture, copy and code review. Paste back
the errors and screenshots it asks for.

And if it ever asks you for a key: the answer is no. It does not need one.
