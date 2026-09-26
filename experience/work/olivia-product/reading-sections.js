const labels = {
 en: { connection: 'How the cards connect', next: 'A next step' },
 uk: { connection: 'Як поєднуються карти', next: 'Наступний крок' }
};
const MAX_TITLE_LENGTH = 72;
const MAX_TITLE_WORDS = 12;
const MAX_LEAD_WORDS = 45;

/** Plain display text, never HTML. Remove paired emphasis without interpreting links or tags. */
function displayText(value) {
 let text = value.trim();
 for (let pass = 0; pass < 3; pass++) {
  text = text
   .replace(/\*\*(?=\S)([^\n]*?\S)\*\*/g, '$1')
   .replace(/__(?=\S)([^\n]*?\S)__/g, '$1')
   .replace(/(^|[^\p{L}\p{N}_])([*_])(?=\S)([^*_\n]*?\S)\2(?=$|[^\p{L}\p{N}_])/gu, '$1$3');
 }
 return text.replace(/\s+/g, ' ').trim();
}

function splitLead(paragraph, locale) {
 if (paragraph.split(/\s+/).length <= MAX_LEAD_WORDS) return [paragraph, ''];
 // Segment only at complete sentence boundaries. The remainder remains in the reading.
 const sentences = typeof Intl?.Segmenter === 'function'
  ? [...new Intl.Segmenter(locale, { granularity: 'sentence' }).segment(paragraph)].map(part => part.segment)
  : paragraph.match(/.*?[.!?…](?:["'”’»\])]*)(?:\s+|$)|.+$/gu) || [paragraph];
 let first = '';
 for (const sentence of sentences) {
  first += sentence;
  const ending = first.trim().split(/\s+/).at(-1);
  // A title or initial is not a complete opening sentence, including in the fallback.
  if (/^(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|e\.g|i\.e|[A-ZА-ЯІЇЄҐ])\.$/u.test(ending)) continue;
  if (/[.!?…]["'”’»\])]*$/u.test(first.trim())) break;
 }
 const lead = first.trim();
 return lead && lead.length < paragraph.length
  ? [lead, paragraph.slice(first.length).trim()]
  : [paragraph, ''];
}

/**
 * Make a reading scannable without rewriting or discarding its interpretation.
 * New readings use a short opening followed by ## headings. Older saved readings
 * receive neutral section labels. Render every returned string with textContent.
 */
export function readingSections(synthesis, locale = 'en') {
 if (typeof synthesis !== 'string' || !synthesis.trim()) return { lead: '', sections: [] };
 const language = locale === 'uk' ? 'uk' : 'en', c = labels[language];
 const preamble = [], authored = [];
 let current = preamble, lines = [];
 const flush = () => {
  const paragraph = displayText(lines.join(' '));
  if (paragraph) current.push(paragraph);
  lines = [];
 };
 for (const line of synthesis.replace(/\r\n?/g, '\n').split('\n')) {
  const heading = line.match(/^\s*##\s+(.+?)\s*$/);
  const title = heading ? displayText(heading[1]) : '';
  if (heading && title && title.length <= MAX_TITLE_LENGTH && title.split(/\s+/).length <= MAX_TITLE_WORDS) {
   flush();
   const section = { title, paragraphs: [], kind: 'connection' };
   authored.push(section);current = section.paragraphs;
  } else if (!line.trim()) flush();
  else lines.push(heading ? heading[1] : line);
 }
 flush();

 if (!authored.length) {
  const [lead, remainder] = splitLead(preamble.shift() || '', language);
  const sections = [], body = remainder ? [remainder, ...preamble] : [...preamble];
  const explicitStep = /^(?:As a (?:small )?next step|A (?:small )?next step|Your next step|Next,|For now,|Як наступний крок|Наступний крок|Зробіть (?:невеликий|маленький) крок)/iu;
  // With only two original paragraphs, the second may still explain the cards.
  const hasNextStep = preamble.length >= 2 || (preamble.length === 1 && explicitStep.test(preamble[0]));
  const next = hasNextStep ? body.pop() : null;
  if (body.length) sections.push({ title: c.connection, paragraphs: body, kind: 'connection' });
  if (next) sections.push({ title: c.next, paragraphs: [next], kind: 'next-step' });
  return { lead, sections };
 }

 // Tolerate an answer that starts at its first heading rather than with a lead.
 const opening = preamble.length ? preamble.shift() : authored.find(part => part.paragraphs.length)?.paragraphs.shift() || '';
 const [lead, remainder] = splitLead(opening, language);
 const introduction = [...(remainder ? [remainder] : []), ...preamble];
 if (introduction.length) authored[0].paragraphs.unshift(...introduction);

 // Keep incomplete heading-only output as text instead of leaving empty sections.
 const sections = [];
 for (const part of authored) {
  if (part.paragraphs.length) sections.push(part);
  else if (sections.length) sections.at(-1).paragraphs.push(part.title);
  else if (authored.length > 1) authored[1].paragraphs.unshift(part.title);
  else return { lead, sections: [{ title: c.connection, paragraphs: [part.title], kind: 'connection' }] };
 }
 if (sections.length > 3) {
  const middle = sections.splice(1, sections.length - 2);
  sections.splice(1, 0, {
   title: c.connection,
   paragraphs: middle.flatMap(part => [part.title, ...part.paragraphs]),
   kind: 'connection'
  });
 }
 if (sections.length) sections.at(-1).kind = 'next-step';
 return { lead, sections };
}
