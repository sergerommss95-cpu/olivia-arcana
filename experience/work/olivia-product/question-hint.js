/* A quiet note under a question when its wording asks the cards for a verdict or
   for someone else's mind. It only suggests: the question is never changed or
   blocked. Questions about safety are left to support-note.js. */
import {checkQuestion} from '../../../website/src/lib/learn/phrase-check.js';
import {loadLazy, learnHref} from './lazy-json.js';

const COPY = {
  en: { closed: 'A closed question', thirdParty: 'Someone else’s mind', example: 'For example', learn: 'Why open questions work ↗' },
  uk: { closed: 'Закрите запитання', thirdParty: 'Думки іншої людини', example: 'Наприклад', learn: 'Чому працюють відкриті запитання ↗' },
};

export function mountQuestionHint(input, getLocale) {
  if (!input) return null;
  const make = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  const box = make('div', 'question-hint'); box.hidden = true; box.dataset.noTranslate = 'true'; box.setAttribute('aria-live', 'polite');
  input.after(box);
  // Other modules also insert after the input; the note moves back beside it when it shows.
  let timer = 0, shown = '';
  async function update() {
    const language = getLocale() === 'uk' ? 'uk' : 'en', c = COPY[language];
    let bank;
    try { bank = await loadLazy('phrases', language); } catch { box.hidden = true; return; }
    const result = checkQuestion(input.value, language, { [language]: bank });
    const notes = result.sensitive.length ? [] : [...result.closed.slice(0, 1).map(e => ['closed', e]), ...result.thirdParty.slice(0, 1).map(e => ['thirdParty', e])];
    const key = language + notes.map(([kind, e]) => kind + e.id).join();
    if (key === shown) return;
    shown = key; box.replaceChildren();
    box.hidden = !notes.length;
    if (input.nextElementSibling !== box) input.after(box);
    for (const [kind, entry] of notes) {
      const note = make('div', 'question-hint-note');
      note.append(make('p', 'eyebrow question-hint-kind', c[kind]), make('p', 'question-hint-text', entry.note));
      if (entry.example) {
        const example = make('p', 'question-hint-example');
        example.append(make('span', '', `${c.example}: `), make('s', '', entry.example.from), document.createTextNode(' → '), make('em', '', entry.example.to));
        note.append(example);
      }
      box.append(note);
    }
    if (notes.length) {
      const link = make('a', 'quiet-link', c.learn); link.href = learnHref('asking/a-question-any-card-can-answer', language);
      if (globalThis.OLIVIA_NATIVE !== true) link.target = '_top';
      box.append(link);
    }
  }
  const schedule = () => { clearTimeout(timer); timer = setTimeout(update, 450); };
  input.addEventListener('input', schedule);
  if (input.value) schedule();
  return { update: schedule };
}
