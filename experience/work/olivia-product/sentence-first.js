/* Before Olivia's version of a spread: the reader's own one-sentence reading.
   Optional. Writing first hides the prepared paragraphs until the reader asks
   to compare; the sentence can then be added to their reflection. */
import {sentenceHelp} from '../../../website/src/lib/learn/phrase-check.js';
import {loadLazy, learnHref} from './lazy-json.js';

const COPY = {
  en: {
    eyebrow: 'Your reading first', lead: 'Before Olivia’s version: can you say in one sentence what these cards are about together?',
    start: 'Write my sentence first', label: 'Your sentence', placeholder: 'In one sentence, what is this spread about?',
    words: (n, limit) => `${n} of about ${limit} words`, names: list => `Names: ${list}`, noNames: 'It names none of the cards yet: which one carries the sentence?', softer: 'Softer words to consider:',
    compare: 'Compare with Olivia’s reading', skip: 'Show Olivia’s reading now', yours: 'Your sentence', add: 'Add it to my reflection', added: 'Added to your reflection below.', learn: 'How to find the sentence ↗',
  },
  uk: {
    eyebrow: 'Спершу ваше читання', lead: 'Перш ніж читати версію Olivia: чи можете ви одним реченням сказати, про що ці карти разом?',
    start: 'Спершу написати своє речення', label: 'Ваше речення', placeholder: 'Одним реченням: про що цей розклад?',
    words: (n, limit) => `Слів: ${n} з приблизно ${limit}`, names: list => `Названо: ${list}`, noNames: 'Речення ще не називає жодної карти: яка з них його тримає?', softer: 'М’якші слова, які варто розглянути:',
    compare: 'Порівняти з читанням Olivia', skip: 'Показати читання Olivia зараз', yours: 'Ваше речення', add: 'Додати до моїх нотаток', added: 'Додано до ваших нотаток нижче.', learn: 'Як знайти це речення ↗',
  },
};

export function mountSentenceFirst({ host, paragraphs, reflection, cardNames, locale }) {
  host.querySelector('.sentence-panel')?.remove();
  paragraphs.hidden = false;
  const language = locale === 'uk' ? 'uk' : 'en', c = COPY[language];
  const make = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  const button = (className, text, action) => { const node = make('button', className, text); node.type = 'button'; node.addEventListener('click', action); return node; };
  const panel = make('section', 'sentence-panel'); panel.dataset.noTranslate = 'true';
  panel.append(make('p', 'eyebrow', c.eyebrow), make('p', 'sentence-lead', c.lead));
  const start = button('text-action sentence-start', c.start + ' ↗', open);
  panel.append(start);
  paragraphs.before(panel);

  function open() {
    start.remove(); paragraphs.hidden = true;
    const id = `sentence-${Date.now().toString(36)}`;
    const label = make('label', 'sentence-label', c.label); label.htmlFor = id;
    const field = make('textarea', 'sentence-field'); field.id = id; field.rows = 2; field.maxLength = 600; field.placeholder = c.placeholder;
    const helper = make('div', 'sentence-helper'); helper.setAttribute('aria-live', 'polite');
    const actions = make('div', 'sentence-actions');
    const compare = button('solid-action', c.compare, () => reveal(field.value.trim()));
    compare.disabled = true;
    actions.append(compare, button('quiet-link', c.skip, () => reveal('')));
    const learn = make('a', 'quiet-link sentence-learn', c.learn); learn.href = learnHref('spreads/your-spread-in-one-sentence', language);
    if (globalThis.OLIVIA_NATIVE !== true) learn.target = '_top';
    panel.append(label, field, helper, actions, learn);
    let bank = null;
    loadLazy('phrases', language).then(value => { bank = { [language]: value }; render(); }).catch(() => {});
    function render() {
      const text = field.value.trim(); compare.disabled = !text; helper.replaceChildren();
      if (!text) return;
      const help = sentenceHelp(text, language, bank, cardNames);
      const count = make('p', '', c.words(help.words, help.limit)); if (help.words > help.limit) count.dataset.over = 'true';
      helper.append(count, make('p', '', help.named.length ? c.names(help.named.join(', ')) : c.noNames));
      if (help.swaps.length) helper.append(make('p', '', `${c.softer} ${help.swaps.map(s => `${s.from} → ${s.to}`).join(' · ')}`));
    }
    field.addEventListener('input', render);
    field.focus({ preventScroll: true });
  }

  function reveal(sentence) {
    paragraphs.hidden = false;
    panel.replaceChildren(make('p', 'eyebrow', c.eyebrow));
    if (!sentence) { panel.remove(); return; }
    const quote = make('blockquote', 'sentence-quote'); quote.append(make('span', 'sentence-quote-label', c.yours), make('p', '', language === 'uk' ? `«${sentence}»` : `“${sentence}”`));
    const status = make('p', 'sentence-status'); status.setAttribute('role', 'status');
    const add = button('quiet-link', c.add + ' ↓', () => {
      if (!reflection) return;
      reflection.value = reflection.value.trim() ? `${reflection.value.trim()}\n\n${sentence}` : sentence;
      reflection.dispatchEvent(new Event('input', { bubbles: true }));
      add.remove(); status.textContent = c.added;
    });
    panel.append(quote, add, status);
    paragraphs.querySelector('h3')?.setAttribute('tabindex', '-1');
    paragraphs.querySelector('h3')?.focus({ preventScroll: true });
  }
  return panel;
}
