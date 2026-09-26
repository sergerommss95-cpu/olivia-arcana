# Olivia spread design notes

Research checked 24 September 2026. These are three original Olivia layouts, informed by authored tarot teaching rather than presented as traditional standards or universally best spreads.

## Sources and useful principles

- [Tina Gong, Labyrinthos: Making Tough Choices — A 5 Card Tarot Spread for Decision Making](https://labyrinthos.co/blogs/learn-tarot-with-labyrinthos-academy/making-tough-choices-a-5-card-tarot-spread-for-decision-making). Gong places personal motivations and values alongside two options, recommends keeping decision spreads manageable, and describes the reader retaining responsibility for the decision. Olivia borrows the structural principle of a shared centre and compared paths, not the source's positions or predictive outcome wording.
- [Brigit Esselmont, Biddy Tarot: How to Design Your Own Tarot Spread](https://biddytarot.com/blog/how-to-design-your-own-tarot-spread/). Esselmont builds positions from distinct questions, includes useful action within a spread, and treats arrangement as a way of expressing its subject. For Olivia this supports named positions, a cross for comparison, and a final practical step. Our fixed spreads do not claim the personal tailoring of a human consultation.
- [Labyrinthos: How to Read Tarot Cards](https://labyrinthos.co/pages/how-to-read-tarot-cards). Its teaching describes a spread as a framework and connects the cards into a reading rather than stopping at separate definitions. Olivia therefore follows the individual positions with explicitly paired relationships and one final reflection question.

## Our three layouts

| Spread | Purpose | Arrangement | Reading relationship |
| --- | --- | --- | --- |
| A little clarity · 3 | Focus one question | Shallow arc | Situation ↔ complication → useful next step |
| At a crossroads · 5 | Compare two named options | A central heart, paths either side, a reconsideration above, a step below | A shared value informs both paths; another question precedes commitment |
| The inner compass · 8 | Examine a situation with connected layers | Asymmetrical compass | Situation/root; inner/outer; tension/support; release/next step |

Three cards are the accessible default. Five is useful when the visitor can name two options. Eight is an expanded reflection for a layered situation; it is not advertised as more accurate or inherently better because it contains more cards. The eight-position layout is our composition, not a claimed historical spread.

## Interpretation model

The current artwork supports the 22 Major Arcana. Each card has a curated meaning in `content.js`; `spread-content.js` adds card-specific themes, resources, tensions, and possible actions. Each position changes how that material is framed. Synthesis relates the named cards and positions, with different treatment of comparison, inner/outer perspective, tension/support, and release/action.

This is deterministic authored guidance, not AI analysis of the visitor's question. Question text is retained as the visitor's context, not silently interpreted. The result does not claim to reveal another person's thoughts or predict future events. Path A and Path B must be defined before interpreting them.

## Product implications

- Keep prices and payment state outside this content module. A price should describe the actual service offered, including that this version uses curated interpretations.
- Introduce the purpose of the spread before a draw. Deal in reading order, then let the visitor revisit any position.
- Persist the entire draw and its interpretation together. Revisiting a reading should not silently draw again.
- Offer a short synthesis and a place for the visitor's own words; avoid turning eight cards into eight unrelated tasks.
- Make reduced-motion dealing immediate or a brief crossfade, preserving position labels and reading order.

## Export contract

`SPREADS` contains `id`, `name`, `count`, `kicker`, `description`, `goodFor`, `positions`, normalized `layout` centre coordinates with rotation in degrees, and zero-based `readingOrder`.

`buildSpreadReading(spread, cardIds, intention)` returns `{ cards: [{ cardId, positionId, label, meaning, prompt, practice }], synthesis: { paragraphs, prompt } }` for the journal schema. Card IDs align with the positions array, remain unique, and belong to 0–21. The module also exports `positionReading` and `synthesizeSpread` for richer presentation. No network service or secret is needed.
