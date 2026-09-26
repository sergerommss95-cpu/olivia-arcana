# The Tide Opens — copy and handoff outline

Copy for the new standalone concept in `outputs/olivia-arcana-tide`. This is a proposed cinematic entrance, not a change to the live website. Keep the scene visually dominant: one short line per act, followed by the complete reading entrance.

## Persistent interface

| Element | English | Ukrainian |
|---|---|---|
| Brand | Olivia Arcana | Olivia Arcana |
| Small descriptor | A personal almanac | Персональний альманах |
| Skip link | Skip to the reading entrance | Перейти до початку читання |
| Motion on | Pause motion | Зупинити рух |
| Motion off | Play motion | Увімкнути рух |
| Replay | Replay the opening | Переглянути вступ ще раз |
| Language names | English · Українська | English · Українська |

Use a stable accessible name such as **Scene motion / Рух у сцені** if the motion button is implemented as an `aria-pressed` toggle. The visible Pause/Play labels may change with state. Keep Skip available immediately.

## Hero

| Element | English | Ukrainian |
|---|---|---|
| Eyebrow | Astrology & tarot | Астрологія й таро |
| Headline | Your stars, translated clearly. | Ваші зірки — людською мовою. |
| Supporting line | Bring a question. Make room for a new perspective. | Принесіть запитання. Погляньте на нього по-новому. |
| Primary action | Begin the journey | Почати подорож |
| Direct alternative | Go to the reading | Перейти до читання |
| Scroll cue, if needed | Scroll to begin | Гортайте, щоб почати |

Suggested display line breaks: **Your stars, / translated / clearly.** and **Ваші зірки — / людською / мовою.** Keep copy present on arrival rather than delaying it until the cinematic sequence completes.

## Three acts

The act labels belong in a restrained progress indicator. Display at most one narrative line at a time; the scene carries the rest.

| Act | English label | English narrative line | Ukrainian label | Ukrainian narrative line |
|---|---|---|---|---|
| I — Olivia approaches | The approach | Every reading begins with a question. | Наближення | Кожне читання починається із запитання. |
| II — her wake rises into the moonlit opening | The tide opens | A little stillness. A different perspective. | Приплив відкриває шлях | Трохи тиші. Інший погляд. |
| III — the view passes through | On the other side | Bring what is on your mind. | По той бік | Почніть із того, що вас хвилює. |

The three acts describe a symbolic passage. Do not attach horoscope facts, an actual lunar phase, a personal destiny, or claims of supernatural change to the cinematic moonlight or water.

## Reading entrance

| Element | English | Ukrainian |
|---|---|---|
| Eyebrow | The Oracle | Оракул |
| Heading | What would you like to see more clearly? | Що ви хочете побачити ясніше? |
| Body | Choose a starting point, or bring a question of your own. | Оберіть тему або сформулюйте власне запитання. |
| Intent 1 | A decision | Рішення |
| Intent 2 | A relationship | Стосунки |
| Intent 3 | My next step | Мій наступний крок |
| Intent 4, if there is a text input | My own question | Власне запитання |
| Input label | Your question | Ваше запитання |
| Placeholder | What is on your mind? | Що вас хвилює? |
| Primary action | Continue to the Oracle | Перейти до Оракула |
| Secondary action | Draw your daily card | Витягнути карту дня |
| Trust line | Clarity first. No noise. | Спершу ясність. Без шуму. |

A selected intent can reveal a suggested question. This is ordinary interface state, not a personalized reading:

| Selected intent | English suggested question | Ukrainian suggested question |
|---|---|---|
| A decision | What should I consider before I choose? | Що варто врахувати, перш ніж зробити вибір? |
| A relationship | What could help me understand this connection? | Що допоможе мені краще зрозуміти ці стосунки? |
| My next step | What deserves my attention now? | На що мені зараз варто звернути увагу? |

If suggestions appear, label them **A question to begin with / Запитання для початку**. Do not show drawn cards, scores, computed chart details, or written counsel unless the actual product has produced those results. Selecting an intent must not imply that a reading has begun or personal data has been sent.

The standalone handoff should use verified product destinations: `https://oliviaarcana.com/oracle` and `https://oliviaarcana.com/daily`. For this prototype, selecting an intent only demonstrates the proposed entrance interaction; following the Oracle link opens the existing product. Do not claim the selected intent or typed question will carry over unless that transfer is actually implemented and verified. Put this prototype limitation in the handoff, not in the public-facing hero.

## Handoff outline

1. **Concept and scene sequence.** Start with the original blue celestial photograph. Olivia approaches; her wake rises into a large moonlit opening; the view passes through into the reading entrance. Identify the exact controls that advance the scene and the direct Skip route.
2. **Identity and asset provenance.** Preserve Olivia's foreground identity from the original pixels. Root is handling `hero-lab/assets/olivia-cutout-raw.png`; the figure must not be silently replaced by a newly generated person. Record the final source, extracted layers, masks, generated additions, and output filenames.
3. **Composition and motion.** Document the three act ranges, the transition into the reading panel, desktop/mobile framing, and the relationship between Olivia, the wake, opening, water, and background. Name what is moving and what stays anchored. Keep the reading controls readable and clickable throughout their visible state.
4. **Visual system.** Specify ultramarine grounds, pale moonlit highlights, matte grain, editorial serif/mono type, and restrained gilt. Document the type scale, spacing, buttons, progress indicator, and selected-intent states. The cinematic sequence is symbolic artwork; real astronomy remains a separate functional layer.
5. **Copy and language.** Include the approved EN/UK strings above, intentional headline wraps, all control labels, and the selected-intent suggestions. Integration should use the project's existing `useLocale()` system rather than a competing storage or event model.
6. **Interaction boundaries.** The local artifact previews the opening and an intent-selection interface. It does not calculate astrology, draw tarot, submit a question, or change account state. State which buttons stay in the preview and which open the existing product.
7. **Motion alternatives.** Provide an immediately available Skip action, Pause/Play, and a reduced-motion path to a fully readable entrance. No opening effect may trap scrolling, keyboard focus, or the user behind an invisible layer. Describe the static image fallback if graphics initialization fails.
8. **Implementation map and verification.** Identify the standalone HTML, modular source, assets, and documentation; then outline the later integration at `website/src/app/page.tsx`. Preserve functioning lower-page content, locale wiring, and real astronomy. Record desktop/mobile, EN/UK, keyboard, pause, replay, skip, reduced-motion, and fallback checks that were actually run.

Reference websites reviewed by the root agent for interaction direction: [Lusion](https://lusion.co), [Lando Norris](https://landonorris.com), and [Bruno Simon](https://bruno-simon.com). Treat these as inspiration for scene pacing and transitions; do not imply that their assets or implementation were copied.
