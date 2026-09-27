# Question-aware interpretation

`reading.ts` handles `/api/reading`; `chat.ts` handles `/api/chat`. Both use the same provider connection and honest error handling. There is no static-answer fallback.

## Server configuration

The edge entry points read runtime settings with `Netlify.env.get`. Never use a `NEXT_PUBLIC_` name for a provider key.

Two configurations are supported:

- **Netlify AI Gateway:** Netlify injects both `ANTHROPIC_API_KEY` and `ANTHROPIC_BASE_URL` in supported compute contexts. These automatic values need not appear in the project's `env:list` output. Keep the pair together: sending the gateway key to Anthropic's direct endpoint fails authentication.
- **Direct Anthropic:** set a server-side `ANTHROPIC_API_KEY` with Functions scope. When `ANTHROPIC_BASE_URL` is absent, the handler uses `https://api.anthropic.com`. If a base URL is configured, it must be HTTPS with no credentials, query or fragment. Redirects are rejected so credentials cannot follow a redirect. The handler appends `/v1/messages`, retaining a gateway path prefix and accepting an existing `/v1` suffix.

Optional `ANTHROPIC_MODEL` overrides the `claude-sonnet-5` default. This exact model ID is active in Anthropic's documentation and supported directly by Netlify AI Gateway as checked on 2026-09-25. Sonnet 5 is a candidate quality upgrade after real Ukrainian Haiku responses failed the language and unsupported-claims review, even with stronger instructions. Preview quality checks are required before accepting the change for production. No environment value was changed. Edge environment changes require a new deployment.

Sonnet 5 enables adaptive thinking by default. For this exact model, the request explicitly sends `thinking: { type: 'disabled' }` so the unchanged limits (2,200 reading tokens, 800 chat tokens, 45 seconds) remain dedicated to the short visible answer. Other explicit model overrides retain the previous request shape. No sampling parameters or assistant prefills are sent. Provider responses are already parsed by content type, and non-`end_turn` responses fail closed. Published Sonnet 5 pricing is $2 input / $10 output per million tokens, versus Haiku 4.5's $1 / $5; its different tokenizer means actual request cost must be measured, not assumed to be exactly doubled. Netlify converts actual usage into credits.

`GET /api/reading` and `/api/chat` make no provider request and consume no inference. The response separates configuration from observed health:

```json
{
  "available": true,
  "configured": true,
  "source": "ai",
  "state": "unverified",
  "lastCheckedAt": null,
  "healthScope": "recent_request_on_this_instance",
  "capabilities": {
    "locales": ["en", "uk"],
    "spreads": ["single", "clarity3", "crossroads5", "compass8"],
    "questionDirections": ["understand", "decision", "conversation", "original"],
    "customPositions": false,
    "journalContext": false
  }
}
```

`available` is retained for existing clients and means that an explicit attempt can be made, not that the provider is healthy. `state` is `unconfigured`, `misconfigured`, `unverified`, `ready`, or `degraded`. Only a complete real POST response marks `ready`; failure marks `degraded`. Observations expire after five minutes and are local to each edge instance, so a different instance can correctly return `unverified`. Do not advertise global uptime from this endpoint or disable every cold-start attempt while waiting for `ready`. Chat omits spread-specific capabilities. `POST` without a valid configuration returns 503 with code `unavailable`.

## Reading request

Only send when the reader explicitly asks for interpretation after seeing a disclosure that their question and chosen cards will be sent to the AI provider. Never add their journal, birth details or background data implicitly.

```json
{
  "question": "What should I think through before changing jobs?",
  "locale": "en",
  "spreadId": "clarity3",
  "cards": [
    { "id": 0, "orientation": "upright" },
    { "id": 8, "orientation": "reversed" },
    { "id": 29, "orientation": "upright" }
  ]
}
```

The card array is in position order. Supported spread IDs are `single`, `clarity3`, `crossroads5`, `compass8`, with 1, 3, 5, 8 distinct cards respectively. Card IDs are the existing stable 0–77 catalogue IDs. Locale is `en` or `uk`. Question maximum is 1,600 characters. The server supplies card names, meanings, orientations and position roles from the trusted catalogue; client-supplied meaning/position fields are ignored.

For an approved editorial three-card question plan, the client may also send `questionDirection` (`understand`, `decision`, `conversation`, or `original`) and `originalQuestion` (at most 1,600 characters; may be empty). These fields are accepted only with `clarity3`. `question` remains the user's approved focus; `originalQuestion` provides their initial context. The server derives the exact bilingual labels and prompts from `question-directions.ts`, a trusted version-1 mirror of the question coach. It does not accept arbitrary client positions or describe these prepared templates as AI-generated spreads. The opt-in disclosure must cover both questions when both are sent. Journal notes and prior readings remain excluded.

Success: `{ "synthesis": "Plain-text interpretation", "source": "ai", "locale": "en", "cardIds": [0,8,29] }`.
Errors: `{ "error": "Helpful explanation", "code": "unavailable" }` with an appropriate non-200 HTTP status. Display the output as plain text, not HTML. Retain the question and existing reading on failure. Show an explicit AI-assisted label.

The response makes symbolic connections to the question, rather than claims of prediction or hidden facts. It does not change the saved draw.

## Consultation voice

The reading opens with an interpretation of the whole spread tied to the person's actual question. The middle paragraphs explain how cards reinforce, complicate or change one another through their assigned positions, instead of providing a definition for each card in turn. A positive card in a complication position must be read in that role without inventing a flaw in the person. The ending offers one modest, specific next step; a reflection question is optional.

The wording can be confident about card symbolism while remaining accurate about unknown circumstances. Ordinary readings avoid repeated anti-prediction disclaimers and hedging in every sentence. This does not permit invented future events, private motives, supernatural certainty or human impersonation. Necessary medical, legal, investment and crisis boundaries still take priority. AI assistance remains disclosed in the interface and in the response's `source` field.

Server-selected generation budgets are 100–170 words in three paragraphs for one card, 160–260 words in four paragraphs for three cards, 230–340 words in five paragraphs for five cards, and 300–430 words in five paragraphs for eight cards. These are prompt instructions rather than post-processing that could cut an answer in half. The provider token budget and operational safeguards are unchanged.

The question-preparation chat offers a usable question first, preserving the person's topic, timeframe and named alternatives, then a short explanation or one optional clarification. It never invents a draw. This voice revision is covered by request-level contract tests, which verify instructions and context transmission rather than guaranteeing generated prose. Review real English and Ukrainian readings for question relevance, relational accuracy, orientation and position fidelity, unsupported claims, and unnecessary disclaimers before treating the revision as editorially verified. Existing saved answers should remain intact; the new voice applies to newly requested interpretations.

## Chat request

`POST /api/chat`: `{ "locale": "uk", "messages": [{ "role": "user", "content": "Я думаю про зміну роботи." }] }`. Up to 12 alternating messages (starting and ending with user), maximum 14,000 total characters. Success: `{ "text": "…", "source": "ai", "locale": "uk" }`. This is question preparation, not a card reading. No birth data or implied chart is added.

## Operational bounds

Same-origin browser requests, 18 KB request body maximum, 45-second timeout, 64 KB provider response maximum, and 20 requests per IP per hour per edge instance. The in-memory throttle is an abuse reduction, not a durable billing quota: configure deployment-wide rate controls and verified membership before making paid AI entitlements available. Only complete `end_turn` text is returned. A cancelled user request does not mark provider health as degraded.

On failure, structured server logs contain only the fixed event name, route kind (`direct`/`gateway`), operation, upstream HTTP status, an allowlisted error type, a fixed reason category and an optional validated provider request ID. Raw provider messages, exception messages, request headers, keys, endpoint URLs, submitted questions, and model responses are never logged or echoed to the client. `billing_required`, `authentication_failed`, `access_denied`, `model_or_endpoint_unavailable`, `rate_limited`, and `provider_unavailable` distinguish operational causes without exposing private data. No canned answer is substituted.

## 2026-09-25 diagnosis and deployment check

Read-only checks against Netlify site `6a67384f-4d46-451e-ac61-f8108015fbfd` found no explicitly configured function-scope variables, although the deployed endpoint reported `available: true`. Netlify's documented automatic gateway settings explain that combination. The old code hardcoded `https://api.anthropic.com/v1/messages` and ignored `ANTHROPIC_BASE_URL`; this change corrects that routing defect. A preview deployment and successful English/Ukrainian POST requests are required before claiming the live rejection is resolved. No environment values were changed during preparation.

Verified on preview deploy `6ab66b70e51cac1ef1a2895c`: real English reading (7.76 s), Ukrainian approved decision-plan reading (11.02 s), English chat (4.61 s), and Ukrainian chat (5.63 s) all returned 200 with `source: ai`. Synthetic library-versus-museum context was reflected in the answers, and selected card IDs `[8,72,1]` were preserved. Both endpoints moved from `unverified` to `ready` after successful POSTs. This verifies the gateway routing fix on that preview, not production availability or a broad editorial-quality evaluation. The sample outputs prompted a further instruction revision: ordinary text without Markdown, tentative psychological language, direct usable question suggestions, and neutral formal Ukrainian. Recheck those editorial requirements on the next build.

On preview `6ab6705498a6604382f65cac`, the strengthened instructions still produced Russian vocabulary and unsupported gender/financial circumstances in a synthetic Ukrainian decision reading. HTTP 200 and provider health are not editorial-quality approval. The subsequent Sonnet 5 code default is prepared for a separate candidate preview; evaluate relevance, faithful approved positions, natural Ukrainian/English, neutral address, and unsupported claims on actual replies before claiming improvement.

Sonnet candidate `6ab67439b8012f61a8e4eaf6` returned 200 in four synthetic cases: Ukrainian decision (20.96 s), Ukrainian conversation (22.50 s), English decision (13.48 s), and Ukrainian chat (11.33 s). Cards, reversed orientation, approved roles and original context were preserved. No Russianisms or assumed user gender were observed. However, the conversation response asserted an unstated wish to avoid conflict, the decision response assumed available resources, and readings exceeded the paragraph limit. The next prompt revision therefore gives a shared explicit fact boundary, the observed prohibited phrase with a conditional alternative, and instructions to combine the final step and reflection within one paragraph. A request-level test verifies that both routes/locales send these invariants; this is a prompt regression test, not proof that every model answer will comply. Re-run the two Ukrainian reading cases on the next preview.

The separate account/payment blockers were checked read-only: the configured `https://olivia-api.up.railway.app/api/auth/me` and `/api/payments/status` returned Railway 404 `Application not found`; the configured Supabase hostname did not resolve. The astronomy engine `/health` returned 200 with version `0.8.0`, but it is a separate service and does not certify account or billing readiness. Keep those service flags disabled until their own end-to-end flows are restored and verified. Do not redirect private journal or tarot requests to the astronomy engine as a fallback.

References: [Netlify AI Gateway and supported model list](https://docs.netlify.com/build/ai-gateway/overview/), [edge environment variables](https://docs.netlify.com/build/edge-functions/environment-variables/), [Anthropic API errors](https://platform.claude.com/docs/en/api/errors), [model lifecycle](https://platform.claude.com/docs/en/about-claude/model-deprecations), [Sonnet 5 ID and pricing](https://platform.claude.com/docs/en/models/sonnet-5/overview), [Sonnet 5 migration from Haiku and thinking configuration](https://platform.claude.com/docs/en/models/sonnet-5/migration-guide).

Tests: `node --experimental-strip-types --test netlify/edge-functions/_shared/reading-service.test.mjs`.
