# Olivia Arcana — proposed product direction

24 September 2026. Product recommendations for discussion; these entitlements, prices and features have not been implemented or approved for sale.

## Product promise

A beautiful tarot practice that helps you explore a question, choose a useful next step, and return to discover how your perspective has changed.

The artistic deck and cinematic interaction establish the identity. The personal almanac should make that identity useful over months. The initial audience is people who enjoy tarot as a reflective practice, including beginners who need help connecting the cards to everyday situations.

## What exists and what is missing

The current experience contains the complete 78-card deck, the approved Olive Lattice reverse, manual card selection, single-card readings, three guided spread sizes, curated meanings, sequential reveals, local notes and JSON export. The established cinematic hero, touch/keyboard controls and reduced-motion support provide a substantial foundation.

Current readings display the user's question alongside curated text; they do not semantically interpret the question. Saved readings remain in the current browser, with separate limits of 100 single readings and 100 spreads. Unsaved drafts live in memory. Cloud continuity and import are absent from this experience.

The subscription interface obtains membership state through the parent website. Payment/account integrations exist in code but operational production readiness has not been verified. Paid spread computation remains bundled in the client, so the visual gate is not sufficient authorization for paid services. The website also contains four existing plan definitions and add-ons, while the new experience grants the same guided spreads to any paid tier. Consolidate this offer before publishing pricing, with an explicit migration decision for any existing subscribers.

The self-contained build is approximately 30.3 MB. Preserve it as a downloadable/offline edition, but create a hosted edition with separately cached artwork, progressive loading and only the assets needed for the current moment.

## Recommended free and paid offer

| Capability | Free Olivia | Olivia Membership |
|---|---|---|
| Full deck | All 78 cards and their reference meanings | Same complete deck |
| Basic readings | Single-card and a classic three-card reading, using curated interpretation | Included |
| Personal almanac | Text notes, saved readings, basic account sync, optional reminders and export | Advanced organization, linked questions and reflection summaries |
| Guided exploration | A complete example of a deeper guided reading | Five- and eight-card spreads; purpose-specific guided readings of suitable length |
| Interpretation | Card meanings, position meanings, prompts and practical reflection | Question-aware synthesis explaining relationships among the actual cards |
| Continuing a question | Revisit a saved reading and add a note | Related readings grouped into a continuing story, using only context the person chooses to include |
| Learning | All-card reference, concise explanations in context | Structured learning and reflection journeys, introduced after the core offer works |
| Ownership | Read, export and delete your own entries | Same rights, including after cancellation |

Three cards should be enough to demonstrate a useful complete experience. The value of membership must be clear in the relevance and continuity of the reading. Charging solely for the number of cards is weak differentiation.

Basic cloud saving is a proposed free feature, not a statement about the present local-only implementation. Size/storage limits should be based on measured cost and communicated before saving; existing writing must never become inaccessible after cancellation.

Begin with one membership tier. A provisional price to test is US$9/month or US$69/year. This is a hypothesis, not a validated price or a promise of profitability. Measure willingness to pay and the cost of contextual readings before publishing the offer. Define any AI allowance in complete readings, with clearly stated follow-ups included. Do not advertise unlimited generation before measuring costs. Curated readings remain useful when a service is unavailable.

Offer a complete sample before an upgrade decision. Present the paid boundary before someone starts a paid ritual; never interrupt a reveal or hide the conclusion of an already-started reading behind checkout. Clearly disclose renewal and cancellation terms.

## Five features to make the product worth returning to

### 1. Today

A returning visitor arrives at a calm personal home: today's card, one reflection to revisit, and the last unfinished reading. The daily card stays stable for that person and date. Other readings remain available separately. The cinematic entrance remains available to watch by choice.

Ask for an account after the first meaningful reading, when there is something worth keeping. A returning visitor should reach the next useful action without replaying the introduction.

### 2. Questions that continue

Allow a person to name a thread such as “Changing work” or “Making room for myself.” Related readings, notes and actions belong together. On return, ask what changed before offering another draw.

A contextual interpretation uses the selected question, spread positions and the exact cards drawn. Previous entries are included only when the user chooses them. The interface shows what context is being used and lets the person remove it. It must not invent personal history or another person's private thoughts.

### 3. A reading that leads somewhere

End a reading with three small choices: what stood out, one possible next step, and whether to revisit it later. A check-in asks what happened and what the person now sees differently. The aim is useful reflection, not a higher volume of draws.

Example: a person explores a work decision, records “Ask for a clearer description of the role,” and chooses to revisit on Friday. Friday's entry opens beside the original cards. It asks what changed and preserves the person's own account of the outcome.

### 4. The weekly almanac

When enough entries exist, offer a short review of the person's own words and chosen topics. Link every observation to the entries that support it. Recurring cards may be shown as a factual count, with no claim that repetition proves destiny.

The person can correct or dismiss an observation. With little history, show a thoughtful empty state rather than manufacturing patterns. Make reminders optional and user-scheduled. Avoid streak loss and anxiety-driven notifications.

### 5. Bring your own deck

Let people record cards drawn from a physical deck, choose positions and keep the same reflections and history. Start with manual card lookup rather than camera recognition. This extends Olivia into an existing tarot practice and makes a future physical Olivia deck a natural continuation.

## Signature motion and interaction

### A continuous reading table

Preserve object identity across selection, extraction, reveal, reading and saving. A card selected from the fan stays visibly the same object as it moves into its spread position. The reading settles into the almanac; reopening it restores that composition. Existing work already establishes parts of this continuity; complete and refine it rather than restarting the visual language.

### Tactile selection

Give the active card a stable, precise hit target. Lift it according to the pull gesture, allow cancellation before commitment, and settle it with controlled weight. Tap and keyboard selection must provide equally clear control. Selection feedback should begin immediately; the expressive motion can finish more slowly. Avoid a mandatory shuffle ritual for every repeat visit.

### A deliberate reveal

Load the actual face before the turn. Show the back, then the edge, then the front exactly once. Allow a quiet hold after the reveal, with no automatic flood of copy. Separate the card's short opening thought from deeper interpretation. Keep a quick/reduced alternative and remember the person's preference.

### Choreography that explains relationships

When the synthesis discusses two cards, bring those cards gently into focus while retaining the complete spread as a frame of reference. On mobile, offer a readable focused card plus a compact spread overview. The user should always know the card's position and how to return to the whole reading.

### Material, atmosphere and stillness

Use the established lapis, ivory and antique gold. Refine subtle directional sheen and soft contact shadows; let the approved background settle while the person reads. Preserve rigid card geometry and the approved artwork. Do not reintroduce the rejected tails, luminous outlines, particles or radial tunnels.

Any sound is opt-in, restrained and separately controllable. Motion must remain interruptible where possible. Daily tasks should become easier with familiarity rather than requiring repeated cinematic delays.

## Release priorities

1. **Make the practice dependable.** Cloud saving, draft recovery, accessible account restoration, import of current local entries, deletion/export, verified checkout/cancellation and server authorization for paid operations. Preserve access to already saved readings when membership ends.
2. **Make it personal and repeatable.** Today, a stable daily draw, revisit dates, one chosen action, question threads and an explicit save state. Keep first-use onboarding short.
3. **Make membership demonstrably useful.** High-quality contextual spread synthesis and relevant follow-ups. Have a skilled tarot editor review the 78-card content and representative combinations. Test whether people find the paid interpretation more useful than the free version before broad promotion.
4. **Finish the interaction craft.** Continuous card motion, clear spread relationships, a composed mobile layout, remembered pacing and fast loading on ordinary phones.
5. **Add breadth after evidence.** Guided learning, physical-deck entry, gift memberships and eventually a physical deck. Avoid launching many loosely related features at once.

For the hosted website, target good Core Web Vitals: LCP at or below 2.5 seconds, INP at or below 200 milliseconds and CLS at or below 0.1 at the 75th percentile. These are targets, not current measured results. Also inspect animation smoothness and battery behavior on a midrange phone.

## Validation

Observe a small group of intended users completing a first reading without coaching. Look for hesitation at selection, lost context during transitions, unclear interpretation, uncertainty about saving and the upgrade boundary. Invite them back a week later to revisit a real question.

Track first-reading completion, saved reflections, meaningful returns after seven and thirty days, revisit completion, paid conversion after a complete sample, interpretation feedback, paid-service cost and cancellation reasons. Do not use the number of cards drawn as the primary success measure. Collect product events without logging the content of private questions and journals.

The first release to validate is **Today → choose a card or spread → reflect → choose a next step → revisit**. Strong retention remains a hypothesis until people return voluntarily and find the continuation useful.

## Research behind the recommendations

- [Labyrinthos official app](https://app.labyrinthos.co/) offers unlimited basic readings and up to 100 saved readings free; premium includes personalized AI and expanded storage. This supports a generous complete free ritual, while not proving any particular pricing or retention outcome for Olivia.
- [Day One reminders](https://dayoneapp.com/guides/tips-and-tutorials/reminders/) includes reminders that help people return to their existing entries. The principle to adapt is reconnecting people with material they already care about.
- [Rosebud weekly report](https://help.rosebud.app/ai-analysis/weekly-report) describes reviews drawn from accumulated journal entries. Olivia's proposed weekly almanac applies that mechanism to its own reflective practice.
- [Rosebud's current free-plan notice](https://help.rosebud.app/account/changes-to-the-free-plan) announces retirement of its free plan on September 30, 2026 and cites upgraded-memory costs. This is a relevant caution when costing an AI membership; it is not evidence that all free journals are unsustainable.
- [Apple motion guidance](https://developer.apple.com/design/human-interface-guidelines/motion) emphasizes purposeful feedback, realistic continuity, optional motion and cancellation. These support the proposed interaction principles.
- [Web Vitals](https://web.dev/articles/vitals) provides the hosted performance thresholds above.

Research checked September 24, 2026. Competitor features illustrate possible mechanisms; they do not establish causation or guarantee Olivia's commercial success.
