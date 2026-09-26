# Olivia Arcana — Ukrainian voice guide

Used for the Ukrainian card notes in `card-notes-uk.js` (v5), which replaced an older library written with informal «ти» and a predictive voice («Всесвіт підтримує…», «так має бути»). Apply it to every Ukrainian text in the product: it should read as if written in Ukrainian first, while keeping every idea, nuance and limit of the English.

## Address and grammar
- Always the polite/plural «ви»: ви, вас, вам, вами, ваш, ваша, ваше, ваші. Never «ти», «тебе», «тобі», «твій», and never imperatives like «довірся», «зроби».
- Imperatives in the polite form: «Зверніть увагу», «Подумайте», «Запишіть», «Оберіть», «Поверніться».
- With «ви», adjectives and past-tense verbs are plural (ви готові, ви вирішили). This keeps the text gender-neutral — keep it that way.
- Court cards (Паж, Лицар, Королева, Король) describe qualities, not a person's gender or someone who will appear.

## Voice
- Reflective, warm, precise. The card «запрошує», «звертає увагу», «пропонує подумати», «може допомогти побачити». Never predicts, promises or warns.
- No «Всесвіт», «доля», «знак згори», «обов’язково станеться», «карта обіцяє/попереджає». No medical, legal or financial advice.
- Reversed = a reflective angle, never bad luck or harm. The English opening "X reversed draws attention to…" becomes e.g. «У перевернутому положенні [назва] звертає увагу на…» or «Перевернута [назва] привертає увагу до…» — vary it naturally.
- Don't claim to know another person's private feelings.

## Natural Ukrainian (not a calque)
- Restructure English sentences when needed; keep meaning, not word order.
- Avoid russisms and bureaucratese: являється → є; приймати участь → брати участь; на протязі → протягом; слідуючий → наступний; співпадати → збігатися; вірно (у значенні «правильно») → правильно; рахувати (думати) → вважати; відноситися до → стосуватися; згідно чогось → згідно з чимось; міроприємство → захід; у якості → як.
- Prefer verbs to abstract nouns where natural.

## Terms (use exactly)
- the reading question: «запитання» (not «питання» when it means the user's question)
- reading: «читання»; spread: «розклад»; card: «карта»; deck: «колода»
- Major Arcana: «Старші Аркани»; Minor Arcana: «Молодші Аркани»; suit: «масть»
- Suits: Жезли, Кубки, Мечі, Пентаклі (Wands, Cups, Swords, Pentacles)
- upright: «пряме положення»; reversed: «перевернуте положення», «перевернута карта»
- Card names: use the `ukName` from the input exactly, but write the apostrophe as ’ (П’ятірка, Дев’ятка).

## Typography
- Apostrophe inside words: ’ (U+2019) — п’ять, розв’язати, пам’ять, м’який, з’являтися. Never ASCII ' inside Cyrillic words.
- Quotes: «…». Dash: space + — + space. Ellipsis: … (one character).
- Prompts end with «?». Practices end with «.».

## Lengths
- Keep each field roughly the same length as the English (±25%). Don't add ideas the English doesn't have; don't drop any.
