import test from 'node:test';
import assert from 'node:assert/strict';
import { readingSections, streamBlocks } from './reading-sections.js';

test('a new reading keeps its concise opening and authored sections as plain text', () => {
 const result = readingSections('The cards favour **a thoughtful change**.\n\n## Ambition meets commitment\nThe Devil and the King of Wands *suggest* a tension.\n\nJustice asks for a clear agreement.\n\n## One conversation to begin\nAsk what the role gives you room to create.');
 assert.deepEqual(result, {
  lead: 'The cards favour a thoughtful change.',
  sections: [
   { title: 'Ambition meets commitment', paragraphs: ['The Devil and the King of Wands suggest a tension.', 'Justice asks for a clear agreement.'], kind: 'connection' },
   { title: 'One conversation to begin', paragraphs: ['Ask what the role gives you room to create.'], kind: 'next-step' }
  ]
 });
});

test('legacy long opening becomes one complete sentence and loses none of its words', () => {
 const first = 'Work next month asks for clarity and honest agreements.';
 const remainder = 'There is also room for leadership, initiative, careful negotiation, shared responsibility, creative work, and the patience to examine what each opportunity could mean for you before deciding whether to accept an offer or continue searching for a more suitable role.';
 const middle = 'The King of Wands and Justice connect ambition to accountability.';
 const end = 'Write down the three conditions that would make the work worthwhile.';
 const result = readingSections(`${first} ${remainder}\n\n${middle}\n\n${end}`);
 assert.equal(result.lead, first);
 assert.deepEqual(result.sections, [
  { title: 'How the cards connect', paragraphs: [remainder, middle], kind: 'connection' },
  { title: 'A next step', paragraphs: [end], kind: 'next-step' }
 ]);
 assert.equal([result.lead, ...result.sections.flatMap(part => part.paragraphs)].join(' '), [first, remainder, middle, end].join(' '));
});

test('one long sentence is retained whole rather than visually truncated', () => {
 const sentence = `Consider ${'one thoughtful possibility '.repeat(30)}before choosing.`;
 assert.deepEqual(readingSections(sentence), { lead: sentence, sections: [] });
});

test('two legacy paragraphs do not invent a next step where only card meanings exist', () => {
 assert.deepEqual(readingSections('There is room for renewal.\n\nJudgement and the Star connect a fresh perspective to hope.'), {
  lead: 'There is room for renewal.',
  sections: [{ title: 'How the cards connect', paragraphs: ['Judgement and the Star connect a fresh perspective to hope.'], kind: 'connection' }]
 });
 assert.equal(readingSections('There is room for renewal.\n\nAs a small next step, speak to your friend.').sections[0].kind, 'next-step');
});

test('Ukrainian legacy and authored readings retain language and paragraph boundaries', () => {
 const legacy = readingSections('Карти запрошують до розмови.\n\nВідлюдник і Королева Мечів поєднують уважність із ясністю.\n\nПочніть із короткого щирого повідомлення.', 'uk');
 assert.deepEqual(legacy.sections.map(part => part.title), ['Як поєднуються карти', 'Наступний крок']);
 const headed = readingSections('Є місце для нового початку.\n## **Ясність і довіра**\nНе поспішайте з висновками.\n\nЗалиште місце для відповіді.\n## Відчиніть двері\nЗапропонуйте зустрітися.', 'uk');
 assert.equal(headed.sections[0].title, 'Ясність і довіра');
 assert.equal(headed.sections[0].paragraphs.length, 2);
 assert.equal(headed.sections[1].kind, 'next-step');
});

test('unsafe-looking text stays text and invalid lengthy headings never become display titles', () => {
 const longTitle = 'This heading has too many words to become a display heading because it would dominate the entire reading';
 const result = readingSections(`A clear answer.\n\n## ${longTitle}\n<script>alert('x')</script>\n\n## What to consider\n<img src=x onerror=alert(1)>\n## Begin here\nKeep your own judgment.`);
 assert.equal(result.sections.some(part => part.title === longTitle), false);
 assert.equal(result.sections[0].paragraphs[0], `${longTitle} <script>alert('x')</script>`);
 assert.equal(result.sections[0].paragraphs[1], '<img src=x onerror=alert(1)>');
});

test('extra authored headings are bounded without dropping their content', () => {
 const result = readingSections('One opening.\n## First\nOne.\n## Second\nTwo.\n## Third\nThree.\n## Fourth\nFour.\n## Last\nFive.');
 assert.equal(result.sections.length, 3);
 assert.deepEqual(result.sections[1].paragraphs, ['Second', 'Two.', 'Third', 'Three.', 'Fourth', 'Four.']);
 assert.equal(result.sections[2].title, 'Last');
 assert.equal(result.sections[2].kind, 'next-step');
});

test('empty, short, heading-first, and incomplete readings remain readable', () => {
 for (const value of ['', '   ', null, undefined, {}]) assert.deepEqual(readingSections(value), { lead: '', sections: [] });
 assert.deepEqual(readingSections('A quiet beginning.'), { lead: 'A quiet beginning.', sections: [] });
 const headed = readingSections('## What the cards invite\nA quiet beginning.\n\nListen before deciding.\n## Your next step\nMake time for a conversation.');
 assert.equal(headed.lead, 'A quiet beginning.');
 assert.equal(headed.sections[0].paragraphs[0], 'Listen before deciding.');
 const incomplete = readingSections('A quiet beginning.\n## An unfinished thought');
 assert.deepEqual(incomplete.sections[0].paragraphs, ['An unfinished thought']);
});

test('plain punctuation, underscores inside identifiers, and unpaired emphasis are preserved', () => {
 const result = readingSections('Choose *carefully*.\n\nKeep project_name and 2 * 3 unchanged; a lone * is text.\n\nTry **one** __clear__ _step_.');
 assert.equal(result.lead, 'Choose carefully.');
 assert.equal(result.sections[0].paragraphs[0], 'Keep project_name and 2 * 3 unchanged; a lone * is text.');
 assert.equal(result.sections[1].paragraphs[0], 'Try one clear step.');
});

test('a reading being written shows only its complete paragraphs, in order, and only grows', () => {
 const reading = 'The cards favour **a thoughtful change**.\n\n## Ambition meets commitment\nThe Devil and the King of Wands suggest a tension.\n\nJustice asks for a clear agreement.\n\n## One conversation to begin\nAsk what the role gives you room to create.';
 assert.deepEqual(streamBlocks('The cards favour'), []);
 assert.deepEqual(streamBlocks('The cards favour **a thoughtful change**.\n\n## Ambi'), [{ kind: 'lead', text: 'The cards favour a thoughtful change.' }]);
 let previous = [];
 for (let end = 1; end <= reading.length; end++) {
  const blocks = streamBlocks(reading.slice(0, end));
  assert.deepEqual(blocks.slice(0, previous.length), previous, `blocks changed at ${end}`);
  previous = blocks;
 }
 assert.deepEqual(streamBlocks(reading + '\n\n').map(block => block.kind), ['lead', 'heading', 'paragraph', 'paragraph', 'heading', 'paragraph']);
 assert.deepEqual(streamBlocks('## Starts with a title\nFirst words.\n\n').map(block => block.kind), ['heading', 'paragraph']);
 assert.deepEqual(streamBlocks(null), []);
});
