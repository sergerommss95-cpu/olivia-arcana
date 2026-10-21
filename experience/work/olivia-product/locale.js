import {amiellePreparedMeaning} from './amielle-content.js';
import { UK_TEXT, UK_CARDS } from './locale-uk.js';
import { UK_NOTES } from './card-notes-uk.js';
import { TAROT_CARDS } from './deck-catalog.js';

export const getLocale = () => typeof window !== 'undefined' && (window.OLIVIA_LOCALE === 'uk' || window.location.pathname === '/uk' || window.location.pathname.startsWith('/uk/') || new URLSearchParams(window.location.search).get('lang') === 'uk' || (typeof document !== 'undefined' && document.documentElement.lang === 'uk')) ? 'uk' : 'en';

const dictionary = { ...UK_TEXT };
for (const [name, card] of Object.entries(UK_CARDS)) {
  dictionary[name] = card.name;
  dictionary[name.toUpperCase()] = card.name.toUpperCase();
}
const words = n => n % 10 === 1 && n % 100 !== 11 ? 'карта' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'карти' : 'карт';
const own = key => Object.prototype.hasOwnProperty.call(dictionary, key);

function translateValue(value) {
  if (typeof value !== 'string' || !value.trim()) return value;
  const key = value.trim().replace(/\s+/g, ' ');
  if (own(key)) return value.replace(value.trim(), dictionary[key]);
  const arrow = key.match(/^(.*?)(\s*[↗↓↑+])$/);
  if (arrow && own(arrow[1].trim())) return `${dictionary[arrow[1].trim()]}${arrow[2]}`;
  if (key.includes(' · ')) {
    const parts = key.split(' · ');
    const translated = parts.map(translateValue);
    if (translated.some((part, index) => part !== parts[index])) return translated.join(' · ');
  }
  let match;
  if ((match = key.match(/^(.+)\. Your reading is opening\.$/)) && own(match[1])) return `${dictionary[match[1]]}. Відкриваємо ваше читання.`;
  if ((match = key.match(/^Remove (.+) reading$/)) && own(match[1])) return `Видалити читання карти «${dictionary[match[1]]}»`;
  if ((match = key.match(/^(\d+) cards$/))) return `${match[1]} ${words(Number(match[1]))}`;
  if ((match = key.match(/^(\d+) of (\d+) chosen$/))) return `${match[1]} з ${match[2]} обрано`;
  if ((match = key.match(/^(\d+) of (\d+) revealed$/))) return `${match[1]} з ${match[2]} відкрито`;
  if ((match = key.match(/^(\d+) of (\d+)$/))) return `${match[1]} з ${match[2]}`;
  if ((match = key.match(/^(\d+)[––-](\d+) of (\d+)(?: cards)?$/))) return `${match[1]}–${match[2]} із ${match[3]} карт`;
  if ((match = key.match(/^(\d+) positions, each with a purpose$/))) return `${match[1]} ${Number(match[1]) < 5 ? 'позиції' : 'позицій'}, кожна зі своїм змістом`;
  if ((match = key.match(/^(Preview|Begin|Reveal|Return to|Remove) (.+?)(\s*↗)?$/))) {
    const subject = translateValue(match[2]);
    if (subject !== match[2]) return `${{ Preview: 'Переглянути', Begin: 'Почати', Reveal: 'Відкрити', 'Return to': 'Повернутися до', Remove: 'Видалити' }[match[1]]} ${subject}${match[3] || ''}`;
  }
  if ((match = key.match(/^Choose card (\d+)( for the spread)?$/))) return `Обрати карту ${match[1]}${match[2] ? ' для розкладу' : ''}`;
  if ((match = key.match(/^Choose card (\d+) of (\d+)$/))) return `Обрати карту ${match[1]} з ${match[2]}`;
  if ((match = key.match(/^Choose (\d+) cards, one at a time, or let the deck choose\.$/))) return `Оберіть ${match[1]} ${words(Number(match[1]))} по черзі або дозвольте обрати колоді.`;
  if ((match = key.match(/^Choose (\d+) cards for this example question\. The deck waits for you\.$/))) return `Оберіть ${match[1]} ${words(Number(match[1]))} для цього прикладу запитання. Колода чекає на вас.`;
  if ((match = key.match(/^(\d+) \/ (.+)$/)) && own(match[2])) return `${match[1]} / ${dictionary[match[2]]}`;
  if ((match = key.match(/^(.+): (.+)$/)) && own(match[1]) && own(match[2])) return `${dictionary[match[1]]}: ${dictionary[match[2]]}`;
  if ((match = key.match(/^Choose (.+), (\d+) cards$/))) return `Обрати «${translateValue(match[1])}», ${match[2]} ${words(Number(match[2]))}`;
  if ((match = key.match(/^(\d+)\. (.+)\. (Waiting for a card\.|Reveal card\.)$/))) return `${match[1]}. ${translateValue(match[2])}. ${match[3] === 'Waiting for a card.' ? 'Очікує на карту.' : 'Відкрити карту.'}`;
  if ((match = key.match(/^(\d+)\. (.+): (.+)\. Explore this card\.$/))) return `${match[1]}. ${translateValue(match[2])}: ${translateValue(match[3])}. Дослідити цю карту.`;
  if ((match = key.match(/^(.+) — Olivia Arcana(?: tarot artwork)?$/))) return `${translateValue(match[1])} — Olivia Arcana`;
  if ((match = key.match(/^(.+) \/ (THE MAJOR ARCANA|MINOR ARCANA)$/))) return `${translateValue(match[1])} / ${dictionary[match[2]]}`;
  if ((match = key.match(/^(\d+) cards · Your guided reading$/))) return `${match[1]} ${words(Number(match[1]))} · Ваш розклад`;
  return value;
}

export function t(value, locale = getLocale()) { return locale === 'uk' ? translateValue(value) : value; }

const decode = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&rsquo;', '’').replaceAll('&nbsp;', ' ');
const encode = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/** Build-time translation of authored template text. Scripts/styles and data stay byte-for-byte unchanged. */
export function translateMarkup(html) {
  const held = [];
  let text = html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, value => `<!--OLIVIA_HELD_${held.push(value) - 1}-->`);
  text = text.replace(/(<[^>]+>)|([^<]+)/g, (whole, tag, content) => {
    if (!tag) {
      const decoded = decode(content), translated = translateValue(decoded);
      return translated === decoded ? content : encode(translated);
    }
    return tag.replace(/\b(alt|title|aria-label|placeholder|content)="([^"]*)"/g, (attr, name, value) => {
      const translated = translateValue(decode(value));
      return `${name}="${encode(translated).replaceAll('"', '&quot;')}"`;
    });
  });
  text = text.replace('<html lang="en">', '<html lang="uk">');
  text = text.replace(/<a\b([^>]*\bdata-language="uk"[^>]*)>[\s\S]*?<\/a>/g, (_, attrs) => `<a${attrs.replace(/href="[^"]*"/, 'href="/"').replace(/lang="uk"/g, 'lang="en"').replace('data-language="uk"', 'data-language="en"')}>English</a>`);
  text = text.replace(/<!--OLIVIA_HELD_(\d+)-->/g, (_, i) => held[Number(i)]);
  return text;
}

// Private writing, AI output, and user-chosen topic labels are never translated.
const PRIVATE = 'script,style,textarea,input,[contenteditable="true"],[data-no-translate="true"],.question-quote,#reading-question,#spread-held-question,#spread-synthesis-question,.journal-row p,.revisit-copy>span:not(.eyebrow),.revisit-copy .eyebrow,#topic-filter option:not([value=""]),datalist';
function translateElement(root) {
  if (!root || root.nodeType === 3) return;
  if (root.nodeType === 1 && root.closest(PRIVATE)) return;
  const nodes = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = nodes.nextNode())) {
    if (node.parentElement?.closest(PRIVATE)) continue;
    const translated = translateValue(node.nodeValue);
    if (translated !== node.nodeValue) node.nodeValue = translated;
  }
  const targets = root.nodeType === 1 ? [root, ...root.querySelectorAll('[alt],[title],[aria-label],[placeholder]')] : [...root.querySelectorAll('[alt],[title],[aria-label],[placeholder]')];
  for (const target of targets) {
    if (target.closest('[data-no-translate="true"]')) continue;
    for (const attr of ['alt', 'title', 'aria-label', 'placeholder']) {
      const current = target.getAttribute(attr);
      if (current === null) continue;
      const translated = translateValue(current);
      if (translated !== current) target.setAttribute(attr, translated);
    }
  }
}

/** Translate authored UI as views mount. Attribute observation excludes motion styles and class changes. */
export function initLocale(root = document.body) {
  if (getLocale() !== 'uk') return () => {};
  document.documentElement.lang = 'uk';
  translateElement(root);
  let queued = false;
  const pending = new Set();
  const observer = new MutationObserver(records => {
    for (const record of records) {
      const target = record.target.nodeType === 3 ? record.target.parentElement : record.target;
      if (target?.nodeType === 1 && !target.closest(PRIVATE)) pending.add(target);
    }
    if (queued || !pending.size) return;
    queued = true;
    queueMicrotask(() => { queued = false; const targets = [...pending]; pending.clear(); targets.forEach(translateElement); });
  });
  observer.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['alt', 'title', 'aria-label', 'placeholder'] });
  return () => observer.disconnect();
}

/** Ukrainian notes are native renderings of the curated English (card-notes-uk.js). */
export function localizeCardNotes(cardId, notes, options = {}) {
  if(['amielle-relationships-v1','amielle-relationships-v2'].includes(options.artworkEdition)){const meaning=amiellePreparedMeaning(cardId,options.orientation==='reversed'||options.reversed===true,options.locale||getLocale(),options.artworkEdition);if(meaning)return {...notes,...meaning};}
  if ((options.locale || getLocale()) !== 'uk') return notes;
  const native = UK_NOTES[cardId];
  if (!native) return notes;
  const reversed = options.reversed === true || options.orientation === 'reversed';
  const side = reversed ? native.reversed : native;
  return { ...notes, meaning: side.meaning, reversed: native.reversed.meaning, prompt: side.prompt, practice: side.practice, learn: native.learn };
}

const positionPrompts = {
  situation: 'Яка частина ситуації заслуговує на увагу?', complication: 'Яку напругу чи припущення варто розглянути уважніше?',
  'next-step': 'Який невеликий практичний крок можна обрати?', heart: 'Яка цінність або потреба найважливіша для цього вибору?',
  'path-a': 'Які можливості й вимоги має ваш перший варіант?', 'path-b': 'Які можливості й вимоги має ваш другий варіант?',
  overlooked: 'Що ще потрібно зрозуміти перед вибором?', root: 'Який звичний сценарій або припущення варто перевірити?',
  inner: 'Як ваш власний погляд впливає на розуміння ситуації?', outer: 'Які спостережувані обставини потрібно врахувати?',
  tension: 'Які дві потреби чи вимоги тягнуть у різні боки?', support: 'Який ресурс, якість або допомога може вас підтримати?',
  release: 'Яке очікування чи звичну реакцію можна зробити гнучкішими?',
};

export function localizePositionPrompt(positionId, fallback) {
  return getLocale() === 'uk' ? positionPrompts[positionId] || fallback : fallback;
}

export function localizeEditorialLine(cardId, positionId, fallback) {
  if (getLocale() !== 'uk') return fallback;
  const note = localizeCardNotes(cardId, {});
  return positionId === 'next-step' ? note.practice : `${positionPrompts[positionId] || note.prompt} ${note.meaning.split(/(?<=[.!?])\s/)[0]}`;
}

/** Localize the reading copy without changing draw IDs, position IDs, or the visitor's question. */
export function localizeSpreadReading(reading, definition, locale = getLocale()) {
  if (locale !== 'uk') return reading;
  const cards = reading.cards.map((entry, index) => {
    const note = localizeCardNotes(entry.cardId, entry, { locale, reversed: entry.reversed, orientation: entry.orientation });
    const label = translateValue(entry.label || definition.positions[index].label);
    const position = positionPrompts[entry.positionId] || 'Що ця карта допомагає помітити у вашій ситуації?';
    // Labels identify the saved position and must match its stable definition.
    return { ...entry, meaning: `«${label}». ${position} ${note.meaning}`, prompt: `${position} ${note.prompt}`, practice: note.practice, learn: note.learn };
  });
  const names = cards.map(entry => UK_CARDS[TAROT_CARDS[entry.cardId].name].name);
  const pairs = definition.id === 'clarity3' ? [[0, 1], [1, 2]] : definition.id === 'crossroads5' ? [[0, 3], [1, 2], [3, 4]] : [[0, 1], [2, 3], [4, 5], [6, 7]];
  const paragraphs = pairs.map(([a, b]) => {
    const first = UK_CARDS[TAROT_CARDS[cards[a].cardId].name], second = UK_CARDS[TAROT_CARDS[cards[b].cardId].name];
    return `${translateValue(cards[a].label)}: ${names[a]} — ${first.keywords.slice(0, 3).join(', ')}. ${translateValue(cards[b].label)}: ${names[b]} — ${second.keywords.slice(0, 3).join(', ')}. Порівняйте ці теми: де вони підтримують одна одну, а де ставлять різні запитання? Знайдіть конкретний приклад зі своєї ситуації. ${positionPrompts[cards[b].positionId]}`;
  });
  return { ...reading, cards, synthesis: { ...reading.synthesis, paragraphs, prompt: definition.id === 'crossroads5' ? 'Що ви можете перевірити, запитати або спробувати, щоб різниця між двома шляхами стала яснішою?' : 'Який зв’язок між картами відгукується найбільше і який один практичний крок із нього випливає?' } };
}
