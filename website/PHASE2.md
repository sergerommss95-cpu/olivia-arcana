# Phase 2 — turning the press back on

State today: the whole site runs static with graceful Night-Watch degradation.
The compute engine (`~/olivia-engine`) is wired in and PROVEN locally — the
Meridian Glass shows "Figures set by the press" (true ephemeris, ASC/MC,
whole-sign houses, retrogrades) whenever `NEXT_PUBLIC_ENGINE_URL` points at a
live engine. Everything below is the exact order to go live.

## 1. The engine (no keys needed — do this first)

The engine's pure-compute endpoints (/chart, /synastry, /returns, /eclipses,
/progressions, /lots, /resolve-place, /health) need NO API keys. LLM endpoints
(/reading, /ask, /briefing) degrade to engine-composed fallbacks without keys
— briefing verified: 200 + `llm.fallback: true`.

1. Deploy `~/olivia-engine` (Dockerfile-less; Railway/Fly nixpacks will do):
   `uvicorn olivia_engine.api:app --host 0.0.0.0 --port $PORT`
2. CORS already allows `https://oliviaarcana.com` (api.py:60).
3. Set in the site build env: `NEXT_PUBLIC_ENGINE_URL=https://<engine-host>`
   — REMOVE the localhost line from `.env.local` before a prod build
   (currently `http://127.0.0.1:8100` for local proof).
4. Rebuild + deploy the site. The portrait page upgrades itself; nothing
   else changes.

Optional keys, later, each independent:
- `ANTHROPIC_API_KEY` / `DEEPSEEK_API_KEY` → /reading, /ask, /briefing prose.
- `ELEVENLABS_API_KEY` → /voice/narrate.

## 2. Supabase (auth + oracle chat) — needs a new project

The old project (`ghyzkpcxlnlfjzitdxkk`) is deleted. Steps:
1. Create a new Supabase project; run migrations `~/olivia-engine/migrations/001,002`.
2. Fill `.env.local` / build env: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Redeploy the oracle chat edge function with its LLM key.
4. Flip `NEXT_PUBLIC_ACCOUNTS_ENABLED=true` → login/register/profile leave
   the Night Watch.

## 3. Payments

1. Paddle credentials into the build env, `NEXT_PUBLIC_PAYMENTS_ENABLED=true`.
2. Journey act V is already designed: checkout confirmation should render as
   the receipt-leaf (subscriber №, first edition №) — see The Reader's
   Passage, act V; not yet built, build when Paddle is live.

## 4. After the press turns

- Replace the Night Watch notice CTAs (they already point at the letter and
  the tariff — no code change needed; ServicePaused reads the env flags).
- Build the reservation-ledger storage (capture was deliberately left
  UI-only while there was nowhere to store it).
- The only letter (email on real occasions) — needs an email provider choice.

## Local dev

- Engine: `cd ~/olivia-engine && .venv/bin/python -m uvicorn olivia_engine.api:app --port 8100`
- Site QA: `npx next build` then `python3 -m http.server 4321 -d out`
- Engine CORS already allows `localhost:4321` / `127.0.0.1:4321`.
