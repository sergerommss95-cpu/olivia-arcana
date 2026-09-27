# Personal consultation review — 25 September 2026

## Intent
Make the interpretation answer the visitor's question in a warm tarot consultation voice. Lead with the connected reading, then explain how the chosen cards, positions and orientations support it. Preserve the exact personal question and distinguish symbolic interpretation from unsupported claims about the visitor.

## Changes
- New size-specific reading instructions for one, three, five and eight cards; concise question preparation that preserves names, choices and timeframe.
- English and Ukrainian voice guidance, with positive answer-first examples and no routine repeated anti-tarot caveats.
- Personal answer leads the reading; traditional meanings remain accessible in a disclosure underneath. While waiting or on error, prepared meanings remain available.
- Per-reading consent and visible AI attribution are retained. Personal journal content is not included in the request.
- Both explicit save paths retain the personal answer. An answer arriving after an earlier save is marked unsaved; later reflection edits are preserved.
- Question-angle help no longer offers to replace a nonempty personal question with a generic template.

## Verification
- 156 product tests pass.
- 25 reading-service tests pass.
- Additional direct save-handler scenarios: fresh/saved guidance, delayed answer, stale record identifiers, changed reflection baseline and unrelated unsaved records.
- Native production build succeeds.
- English hosted manual selection, completed spread, generated answer, ordinary Keep action, journal and reload checked.
- Ukrainian question helper preserves the original wording and timeframe when applying a conversation angle.
- Desktop and 390 × 844 mobile reading inspected: no horizontal overflow; personal reference disclosure collapses only when an answer exists; no browser errors captured.
- Approved hero.js SHA-256 remains 413304f1cea159c67fee3f8542cf5f95ebb6358891f2c08b91c38f76a965a5b2.

## Editorial evaluation
First live iteration removed repetitive caveats but still led with separate card definitions and made unsupported personal assumptions. Second iteration answered work and conversation questions sooner, but a fresh curiosity question still invented a hidden block. The final instruction pass replaces the diagnosis-priming example with a positive exploration example and frames complications as possible trade-offs, not established defects.

Synthetic evaluation requests and actual returned answers are saved beside this file. These samples assess presentation and interpretation style; they are not validation of predictive accuracy.

## Final preview

https://6ab6bae6a3cdabc78a81a8db--olivia-arcana.netlify.app/#question

The final three synthetic samples answer the actual question first and retain all supplied cards. Work: 234 words, broad purpose/growth/continuity rather than a fabricated job title. Ukrainian conversation: 157 words, a concrete opening message and consistent reader address. Photography: 228 words, a visual experiment connected to Moon / Knight of Wands / Ten of Wands rather than an assertion of hidden personal inadequacy. Some phrasing remains more explanatory than conversational; generation is variable. Earlier saved readings are retained rather than silently rewritten.

This is a draft preview. Production has not been changed in this pass.

Final hosted save-race check passed: Keep while answer pending → Saved; answer arrives → Save updated reading; save again → journal → reload → exact personal answer restored. No browser errors captured.
