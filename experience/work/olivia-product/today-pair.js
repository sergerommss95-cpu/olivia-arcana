/* On the Today page: today's card read beside the card from the last day one
   was drawn, through the five pair lenses of the lessons. */
import {pairFacts, cardFacts} from '../../../website/src/lib/learn/card-facts.js';
import {pairLenses} from '../../../website/src/lib/learn/pair-lenses.ts';
import CARD_SYMBOLS from '../../../website/src/lib/learn/card-symbols.json' with { type: 'json' };
import {loadLazy, learnHref} from './lazy-json.js';
import {cardSlug} from './deck-catalog.js';
import {previousDaily, whenLabel, dayCaption} from './today-pair-dates.js';

const COPY = {
  en: {
    eyebrow: 'Two days, two cards', title: when => `Read it with the card you drew ${when}.`,
    today: 'Today', lens: 'Choose a lens', version: 'One reader’s version', page: 'Open the pair’s page ↗', lesson: 'Two cards, five ways ↗',
    bothMajor: 'Two Major Arcana', majorWithMinor: 'A Major and a Minor', sameSuit: suit => `Both ${suit}`, sameNumber: n => `Both carry the number ${n}`,
    sameCourt: 'The same court rank', contrary: (a, b) => `${a} and ${b}: contrary elements`, shared: name => `Carved on both: ${name}`,
    suits: { wands: 'Wands', cups: 'Cups', swords: 'Swords', pentacles: 'Pentacles' }, elements: { fire: 'Fire', water: 'Water', air: 'Air', earth: 'Earth' },
  },
  uk: {
    eyebrow: 'Два дні, дві карти', title: when => `Прочитайте її разом із картою, яку ви витягнули ${when}.`,
    today: 'Сьогодні', lens: 'Оберіть оптику', version: 'Одна з версій читання', page: 'Відкрити сторінку пари ↗', lesson: 'Дві карти, п’ять способів ↗',
    bothMajor: 'Дві карти Старших Арканів', majorWithMinor: 'Старший і Молодший аркан', sameSuit: suit => `Обидві — ${suit}`, sameNumber: n => `Обидві мають число ${n}`,
    sameCourt: 'Той самий придворний ранг', contrary: (a, b) => `${a} і ${b}: протилежні стихії`, shared: name => `Вирізьблено на обох: ${name}`,
    suits: { wands: 'Жезли', cups: 'Кубки', swords: 'Мечі', pentacles: 'Пентаклі' }, elements: { fire: 'Вогонь', water: 'Вода', air: 'Повітря', earth: 'Земля' },
  },
};

export function mountTodayPair({ after, entries, today, daily, images, nameOf, locale }) {
  after.parentElement?.querySelector('.today-pair')?.remove();
  if (!daily) return null;
  const earlier = previousDaily(entries, today, daily.cardId);
  if (!earlier) return null;
  const language = locale === 'uk' ? 'uk' : 'en', c = COPY[language];
  const make = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  const a = earlier.record.cardId, b = daily.cardId, fa = cardFacts(a), fb = cardFacts(b);
  const symbolsOf = id => CARD_SYMBOLS[id] || [];
  const facts = pairFacts(a, b, symbolsOf(a).map(s => s.k), symbolsOf(b).map(s => s.k));
  const shared = facts.sharedSymbols.map(key => symbolsOf(a).find(s => s.k === key)?.[language]).filter(Boolean);
  const quote = name => language === 'uk' ? `«${name}»` : `“${name}”`;
  const lenses = pairLenses(facts, { nameA: nameOf(a), nameB: nameOf(b), suitA: fa.suit, elementA: fa.element, elementB: fb.element, number: fa.number, sharedNames: shared.map(quote) }, language);

  const panel = make('section', 'today-pair'); panel.dataset.noTranslate = 'true';
  panel.append(make('p', 'eyebrow', c.eyebrow), make('h2', 'today-pair-title', c.title(whenLabel(earlier.date, earlier.gap, language))));
  const cards = make('div', 'today-pair-cards');
  for (const [id, label] of [[a, dayCaption(earlier.date, earlier.gap, language)], [b, c.today]]) {
    const figure = make('figure'), img = make('img'); img.src = images[id]; img.alt = ''; img.loading = 'lazy';
    const caption = make('figcaption'); caption.append(make('span', '', label), make('strong', '', nameOf(id)));
    figure.append(img, caption); cards.append(figure);
  }
  const chips = make('ul', 'today-pair-chips');
  const chip = text => chips.append(make('li', '', text));
  if (facts.bothMajor) chip(c.bothMajor); else if (facts.majorWithMinor) chip(c.majorWithMinor);
  if (facts.sameSuit) chip(c.sameSuit(c.suits[fa.suit]));
  if (facts.sameNumber) chip(c.sameNumber(fa.number));
  if (facts.sameCourt) chip(c.sameCourt);
  if (facts.elements === 'contrary') chip(c.contrary(c.elements[fa.element], c.elements[fb.element]));
  for (const name of shared) chip(c.shared(name.charAt(0).toLocaleLowerCase(language) + name.slice(1)));

  const body = make('div', 'today-pair-body');
  const tabs = make('div', 'today-pair-lenses'); tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', c.lens);
  const prompt = make('p', 'today-pair-prompt'); prompt.setAttribute('role', 'tabpanel'); prompt.setAttribute('aria-live', 'polite');
  lenses.forEach((lens, index) => {
    const tab = make('button', '', `${index + 1}. ${lens.title}`); tab.type = 'button'; tab.setAttribute('role', 'tab');
    tab.addEventListener('click', () => select(index)); tabs.append(tab);
  });
  function select(index) { [...tabs.children].forEach((tab, i) => tab.setAttribute('aria-selected', String(i === index))); prompt.textContent = lenses[index].prompt; }
  select(0);
  body.append(make('p', 'eyebrow', c.lens), tabs, prompt);
  if (chips.children.length) body.prepend(chips);
  const links = make('div', 'today-pair-links');
  const lesson = make('a', 'quiet-link', c.lesson); lesson.href = learnHref('combinations/two-cards-five-ways', language);
  if (globalThis.OLIVIA_NATIVE !== true) lesson.target = '_top';
  links.append(lesson); body.append(links);
  panel.append(cards, body);
  after.after(panel);

  const [low, high] = a < b ? [a, b] : [b, a];
  loadLazy('pairs', language).then(pairs => {
    const readings = pairs[`${low}-${high}`];
    if (!readings?.length || !panel.isConnected) return;
    const details = make('details', 'today-pair-version'); details.append(make('summary', '', c.version));
    for (const r of readings) details.append(make('p', '', r.text));
    links.before(details);
    const page = make('a', 'quiet-link', c.page);
    page.href = `${globalThis.OLIVIA_NATIVE === true ? '' : 'https://oliviaarcana.com'}${language === 'uk' ? '/uk' : ''}/cards/pairs/${cardSlug(low)}-and-${cardSlug(high)}/`;
    if (globalThis.OLIVIA_NATIVE !== true) page.target = '_top';
    links.prepend(page);
  }).catch(() => {});
  return panel;
}
