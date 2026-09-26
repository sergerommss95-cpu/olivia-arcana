# Olivia Arcana — competitor study and release decisions

Research checked 24 September 2026. This develops the earlier [product strategy](./olivia-product-strategy.md). It separates documented product mechanisms from recommendations for Olivia. Competitor features are evidence of what they offer; they do not prove which feature caused their growth. Nothing here guarantees commercial success.

## The decision

Position Olivia as a beautiful, thoughtful tarot practice for people navigating an unresolved question. The experience should help someone recognize a useful perspective, record what they intend to do, and return to understand what changed.

Our artistic deck and continuous card motion are the distinctive expression of that promise. A paid product also needs reliable saving, relevant interpretation, an understandable offer and an intentional return journey. Acquisition needs its own product work: a private reading must be able to produce something its owner actively wants to share.

Do not broaden the first release into astrology, dating, a general AI companion, an audio library and a social network. Test one coherent practice first.

## What the competitors actually do

### Co–Star: an invitation changes the experience

The official onboarding asks for birth details, account verification, then friends. Adding a friend unlocks compatibility and that person's daily updates. Its question feature gives a first trial, followed by paid credits; the FAQ says it was developed after people repeatedly sent specific personal questions through other channels. The FAQ also describes purchased readings as retrievable later. These are documented mechanisms, not evidence of scientific accuracy or retention causality. [Official FAQ](https://www.costarastrology.com/faq)

In a 2019 founder interview, Co–Star described a conversational, sometimes abrasive voice and an editorial process based on written fragments. The distinction to study is deliberate authorship and recognizability. Olivia should establish its own warm, perceptive voice. [Vanity Fair interview](https://www.vanityfair.com/style/2019/05/co-star-astrology-app-notifications-founder)

**Olivia translation:** a card and one precise reflection can introduce the product outside it. Later, an invitation should unlock a shared conversation ritual that requires both people's participation. A generic referral link with a reward is less integral to this product.

### CHANI: a recurring editorial commitment

CHANI's August 2026 feature matrix includes daily horoscopes, a weekly podcast, a weekly tarot card and a weekly affirmation in its free tier. Premium includes deeper personal readings, weekly journal prompts and rituals, and a larger audio library. The free experience establishes a cadence; paid content extends it. [Official free/premium matrix](https://chaninicholas.zendesk.com/hc/en-us/articles/1500001732421-Free-Premium-Content-In-the-App)

CHANI explicitly attributes its content to Chani Nicholas and a team of professional astrologers. Its app page offers a new reading from Nicholas each week. This visible relationship between a person, their work and a publishing schedule supports a clear editorial promise. It is a documented offer, not a measured explanation of customer retention. [Official app page](https://www.chani.com/app)

**Olivia translation:** appoint a real tarot editor before claiming expert review. Publish a modest, sustainable weekly reflection with an identifiable author. Distinguish curated card meanings, any future generated interpretation, and the user's own writing. Do not create a fictional expert to make the interface seem more trustworthy.

### The Pattern: recognition before technical detail

The Pattern describes its purpose through strengths, challenges, relationships and personal choices. Its Bonds documentation divides a connection into six traits and summaries, with optional further interpretation; free users receive a limited daily allowance. It describes these as prompts for understanding and communication rather than relationship verdicts. [About The Pattern](https://www.thepattern.com/about-us), [Bonds documentation](https://thepattern.zendesk.com/hc/en-us/articles/360046292451-What-are-Bonds)

Its newer In-Depth product offers a trial of conversation based on its existing content, followed by a subscription. The company makes specific claims about its own model infrastructure and personal chat data; those are company representations, not an independent privacy audit. [In-Depth documentation](https://thepattern.zendesk.com/hc/en-us/articles/42545042932628-In-Depth-AI-Conversation-Feature)

**Olivia translation:** a person should understand the first sentence of a reading without knowing tarot. Let them open the underlying symbolism and position meaning when interested. Explain the actual information used for personalization. Use plain choices such as “A decision,” “A relationship,” and “A change,” while retaining an open-question route.

## Eight prioritized product decisions

### 1. P0 — Make the first useful experience obvious

**Gap:** the visual opening is stronger than the explanation of what happens after entering. A first visitor needs an understandable action and reassurance about its scope.

**Flow:** arrival → choose one card or a three-card reading → optional question/topic → choose cards → reveal → short reflection → save a thought.

Suggested entry copy: **“Bring a question. Find another way to see it.”** Follow with “Choose your cards, explore their meaning, and keep what resonates.” The primary action should describe the task: “Begin a reading.” A secondary “A card for today” offers an easier first step. Preserve a visible route to explore the artwork and cinematic journey.

Ask for an account after there is something worth keeping. Avoid requiring birth details, several onboarding questions or a subscription before the first complete experience. Returning visitors can enter Today directly.

**Acceptance:** a new participant can explain what Olivia offers and complete a reading without coaching; no essential action depends on hover.

### 2. P0 — Build the return journey into the end of the reading

**Gap:** the current saved reading is mainly an archive. There is little reason to reopen it at a meaningful moment.

**Flow:** read → record one thought → choose an optional next step → choose a revisit date → save → Today surfaces that entry when due → add “What changed?” beside the original reading.

Today should have three deliberate states: a first visit, a day with an unread daily card, and a day with an already revealed card or a due reflection. Keep the day's card stable; allow other readings separately. A date should use the person's chosen/local day consistently. Do not reset the card during a session or on a reload.

Suggested revisit copy: **“You wanted to come back to this. What looks different now?”** Reminders require an explicit opt-in and usable settings. In-product revisit cards can work before external reminders are configured.

**Acceptance:** a reading and its follow-up survive refresh; the save location is clear; a returning person can reach a useful action immediately. If storage is still local, say “Saved on this device” and make export accessible.

### 3. P0 — Establish an honest editorial voice and reading method

**Gap:** a question displayed beside a general card meaning can be mistaken for an interpretation of that question. A beautiful surface must not imply expertise, personal knowledge or processing that does not exist.

**Reading order:** one short opening thought → what this card contributes in this position → one question for reflection → optional deeper symbolism → a next step chosen by the person.

Example: for the Two of Swords, lead with **“What information would make this choice easier?”** A more specific interpretation about a work decision must depend on the actual work context the person supplied. Do not silently generate that context from a general card description.

Add a small “How this reading is made” disclosure. For the present experience it should explain that the cards use prepared meanings and prompts. If contextual generation is added, label it accurately, show which saved context is included, and allow its removal. Have a named, contracted tarot editor review the 78-card content, spread positions and representative combinations before making that claim publicly.

**Acceptance:** the copy distinguishes general meanings from personalized synthesis; original notes and generated material are visually identifiable; each reading is useful without opening every detail panel.

### 4. P1 — Give the artwork a useful way to travel

**Gap:** Olivia has distinctive imagery but lacks a simple, intentional discovery loop.

**Flow:** after a reveal → “Share this card” → composed preview → select an approved reflection line or art-only version → download image or invoke the device's sharing sheet. The owner decides whether anything is sent.

The default artifact contains the card, its name, a short general reflection and discreet Olivia attribution. Private question, journal, email, personal history and account identifier must be excluded. Do not embed private data in the image metadata, a public URL or analytics. A share link can initially open a public card reference and a fresh reading; it does not need access to the sender's reading.

Later, test “A reading together”: one person invites another, each chooses a card, and both receive a conversation prompt. Each person explicitly chooses what to share. This should wait until account and privacy controls are dependable.

**Acceptance:** inspect the exported image and share payload; no private input appears. Measure whether recipients begin a first reading, rather than treating share-button taps as proof of growth.

### 5. P0 — Make membership understandable and substantively deeper

**Gap:** multiple existing plan definitions, client-side preview gates and an emphasis on spread size do not form a clear paid offer.

Keep all 78 cards, single-card readings and a complete classic three-card reading free. Include saving, export, deletion and continued access to the person's existing writing. Make the limits and actual storage location clear. Determine sustainable cloud allowances from measured costs.

A single proposed membership should offer guided five/eight-card explorations, question-aware synthesis across positions, and ongoing context the person explicitly selects. Let users see a complete deeper sample before purchase. Announce the paid boundary before beginning a paid reading; never interrupt a reveal with checkout. Do not advertise these future services as available until they work.

Retain US$9/month and US$69/year only as pricing hypotheses from the earlier strategy. Test willingness to pay and service cost before public pricing. Avoid “unlimited AI” promises until costs and abuse limits are understood.

**Acceptance:** the offer names an outcome and exact included services; payment, restoration, cancellation and server enforcement work; a canceled member can still read and export their saved work.

### 6. P1 — Make the almanac accumulate meaning

**Gap:** many unrelated saved entries create volume without continuity.

Allow a person to name a continuing question, attach readings to it, and see their own notes over time. Show chronological evidence before offering a summary. In a weekly view, distinguish counts (“You saved two readings about work”) from interpretations. With insufficient entries, invite reflection rather than invent a pattern.

Start with simple grouping, revisit notes and one weekly editorial prompt. Advanced summaries can follow after the context and privacy model is established. Physical-deck entry is a valuable next extension: manually choose the cards drawn at home and keep the same almanac flow.

**Acceptance:** an older reading can be found through its question; every personal summary points to its source entries; users can correct, unlink or remove context.

### 7. P1 — Finish one continuous physical interaction

**Gap:** exceptional artwork loses credibility when selection, transition, reveal and reading feel like unrelated screens. Additional effects cannot solve object discontinuity.

The selected card should remain the same visible object while leaving the fan, entering its spread position, turning and settling beside its interpretation. Preload its actual face; turn once through the edge. Maintain stable hit targets and an explicit cancellation point during a pull. Let a reading finish in stillness.

When discussing two cards, gently focus those cards without hiding the overall spread. Saving may let the arrangement settle into its almanac entry; reopening restores the arrangement. Use the approved lapis, ivory, gold, rigid geometry and restrained material light. Preserve the user's preference for slow, cinematic mystery and avoid the rejected tails and harsh glow.

Remember pace preference. Quick entry and reduced motion must remain equally complete. A returning visitor should never be forced to replay the long hero sequence.

**Acceptance:** ordinary phone testing shows immediate selection feedback, legible cards and interruption/recovery. Serve a cached hosted build with progressively loaded assets; keep the approximately 30 MB standalone edition as a separate download.

### 8. P0 — Earn a launch decision with operational and customer evidence

**Gap:** working preview interactions do not establish a dependable subscription business.

Before a paid public launch, complete account recovery, durable saving, existing-local-entry import, visible save failures, export/deletion, payment lifecycle, service monitoring and a support contact someone actually answers. Test a failed payment, canceled membership, interrupted reveal, second-device login and deleted reading. Do not collect raw questions or journal text in product analytics.

Run a small observed pilot with intended customers: first use without coaching, a second visit after several days, then a revisit of a real question. Compare free and proposed paid interpretations for usefulness. Ask whether they would pay the offered price after experiencing the difference; observe actual purchase behaviour when checkout is ready.

Use a small measurement set: completed first readings, saved reflections, seven- and thirty-day meaningful returns, revisit completion, invitations leading to completed readings, paid conversion after a sample, cancellation reasons and cost per paid reading. Define “meaningful return” as reopening/annotating a prior entry or completing a reading with a reflection, not simply opening a notification.

**Acceptance:** the launch decision is based on observed repeat value, reliable operations and workable costs. If people admire the animation but do not find the reading useful, prioritize content and clarity over adding another effect.

## Recommended delivery sequence

1. **Complete the useful loop:** first reading, clear save state, Today, next step, revisit, draft recovery, transparent reading method.
2. **Make trust and the offer real:** editorial review, accounts/sync, simple entitlements, verified billing and cancellation, hosted performance.
3. **Test discovery and deeper value:** private-safe sharing, a complete premium sample, contextual synthesis and question continuity.
4. **Expand from evidence:** shared rituals, physical-deck entry, authored weekly programming and additional motion craft.

The intended experience is **a compelling first reading, a thought worth keeping, and a reason to return to it**. This is a focused commercial hypothesis to validate, not a claim that copying successful competitors produces success.
