import { CARD_NOTES, cardNotesForOrientation } from './content.js';
import { MINOR_LENSES } from './minor-content.js';
import { applyQuestionPlan } from './question-coach.js';

// Original Olivia layouts. Coordinates are card centres, normalized to 0–1;
// rotate is in degrees. Position order is also the dealing/reading order.
export const SPREADS = [
  {
    id: 'clarity3', name: 'A little clarity', count: 3,
    kicker: 'One question, three perspectives',
    description: 'Look at the situation, what makes it complicated, and one useful way forward.',
    goodFor: 'A question that needs focus',
    positions: [
      { id: 'situation', label: 'The situation', prompt: 'What aspect of the situation deserves attention?', connection: 'Read this beside what complicates it; the contrast helps refine the question.' },
      { id: 'complication', label: 'What complicates it', prompt: 'What tension or assumption deserves a closer look?', connection: 'This card adds a question to the first card, rather than cancelling its meaning.' },
      { id: 'next-step', label: 'A helpful next step', prompt: 'What small action could help you understand or respond?', connection: 'Bring the first two perspectives together before choosing a step you can actually take.' }
    ],
    layout: [{ x: .19, y: .54, rotate: -7 }, { x: .50, y: .43, rotate: 0 }, { x: .81, y: .54, rotate: 7 }],
    readingOrder: [0, 1, 2]
  },
  {
    id: 'crossroads5', name: 'At a crossroads', count: 5,
    kicker: 'Two possibilities, room to choose',
    description: 'Explore two paths through what matters to you, what each asks of you, and what still needs attention.',
    goodFor: 'A choice between two named options',
    positions: [
      { id: 'heart', label: 'At the heart', prompt: 'What value or need matters most in this choice?', connection: 'Use this as a criterion for comparing the two paths, rather than looking for a winning card.' },
      { id: 'path-a', label: 'Path A', prompt: 'What quality or demand could you explore in your first option?', connection: 'Compare this with Path B and the value at the heart of the choice.' },
      { id: 'path-b', label: 'Path B', prompt: 'What quality or demand could you explore in your second option?', connection: 'Consider what differs from Path A, and what both paths may require.' },
      { id: 'overlooked', label: 'What to look at again', prompt: 'Which part of the choice would benefit from more attention?', connection: 'Return to both paths with this question; it may change the information you want to gather.' },
      { id: 'next-step', label: 'A grounded next step', prompt: 'What can you do before committing to either path?', connection: 'Choose a practical step that helps you compare the options in real life.' }
    ],
    layout: [{ x: .50, y: .45, rotate: 0 }, { x: .18, y: .46, rotate: -5 }, { x: .82, y: .46, rotate: 5 }, { x: .50, y: .13, rotate: -2 }, { x: .50, y: .80, rotate: 2 }],
    readingOrder: [0, 1, 2, 3, 4]
  },
  {
    id: 'compass8', name: 'The inner compass', count: 8,
    kicker: 'Space for a layered question',
    description: 'Trace the situation through its roots, inner and outer influences, tension, support, and a next step.',
    goodFor: 'A complex situation with several connected parts',
    positions: [
      { id: 'situation', label: 'The situation', prompt: 'Which part of the whole deserves attention first?', connection: 'Start here, then let the root card add context.' },
      { id: 'root', label: 'At the root', prompt: 'What established pattern or assumption might be worth examining?', connection: 'Look for a relationship with the situation card, without assuming that the cards reveal a hidden fact.' },
      { id: 'inner', label: 'Your perspective', prompt: 'What are you bringing to the way you see this?', connection: 'Compare this with outer influences to distinguish your interpretation from your circumstances.' },
      { id: 'outer', label: 'Outer influences', prompt: 'What observable circumstances or relationships need consideration?', connection: 'Use this to form a question about your surroundings, not to infer another person’s private thoughts.' },
      { id: 'tension', label: 'The tension', prompt: 'Where do two needs or demands pull against each other?', connection: 'Read this alongside support; a difficulty and a resource can be present together.' },
      { id: 'support', label: 'What supports you', prompt: 'What resource, quality, or form of help could you make use of?', connection: 'Consider how this could respond to the tension, rather than expecting it to remove every difficulty.' },
      { id: 'release', label: 'What to loosen', prompt: 'What expectation or repeated response could become less rigid?', connection: 'Pair this with the final card: making room and taking action are different parts of the same reflection.' },
      { id: 'next-step', label: 'Your next step', prompt: 'What manageable step follows from the whole picture?', connection: 'Return to your original question and choose one action rather than eight separate tasks.' }
    ],
    layout: [{ x: .43, y: .47, rotate: -2 }, { x: .40, y: .80, rotate: 2 }, { x: .17, y: .32, rotate: -5 }, { x: .68, y: .17, rotate: 4 }, { x: .16, y: .70, rotate: -3 }, { x: .84, y: .44, rotate: 3 }, { x: .39, y: .13, rotate: -3 }, { x: .72, y: .80, rotate: 3 }],
    readingOrder: [0, 1, 2, 3, 4, 5, 6, 7]
  }
];

// These short lenses make each position specific to its card. The words describe
// avenues for reflection, not inferred facts about a person's circumstances.
const LENSES = [
  { name: 'The Fool', group: 'movement', theme: 'beginning before everything is certain', gift: 'curiosity and a willingness to learn by trying', friction: 'the gap between useful preparation and indefinite waiting', release: 'the expectation that a first attempt must prove everything', action: 'try one small, reversible experiment', question: 'What could a modest first attempt teach you?' },
  { name: 'The Magician', group: 'movement', theme: 'bringing intention into practical form', gift: 'skills and resources already within reach', friction: 'effort scattered across too many intentions', release: 'the belief that you need one more resource before beginning', action: 'put one available skill to work on a specific task', question: 'Which resource could become useful through one clear task?' },
  { name: 'The High Priestess', group: 'reflection', theme: 'listening to what is not yet fully understood', gift: 'quiet attention that leaves room for ambiguity', friction: 'treating an impression as a complete explanation', release: 'the pressure to explain a feeling before you have explored it', action: 'write down an impression alongside what you can actually observe', question: 'What feeling deserves attention without becoming your only evidence?' },
  { name: 'The Empress', group: 'connection', theme: 'the conditions that allow something to grow', gift: 'patient care, creativity, and sustained attention', friction: 'giving more care than you can sustainably offer', release: 'the expectation that growth must be forced or constantly visible', action: 'make one arrangement more supportive and sustainable', question: 'What would help growth without asking too much of you?' },
  { name: 'The Emperor', group: 'structure', theme: 'the structures that hold a situation together', gift: 'clear agreements, fair boundaries, and dependable routines', friction: 'a rule that protects certainty more than it supports the situation', release: 'the need to control every detail', action: 'state one useful boundary or agreement in plain language', question: 'Which structure is useful, and where could it become more flexible?' },
  { name: 'The Hierophant', group: 'structure', theme: 'the guidance and beliefs you have inherited', gift: 'experience shared through teaching and trusted practice', friction: 'following a familiar rule without examining its purpose', release: 'an obligation to accept guidance without asking questions', action: 'ask why a rule matters before deciding how to use it', question: 'Which inherited idea would you choose again on its own merits?' },
  { name: 'The Lovers', group: 'connection', theme: 'the relationship between choice and personal values', gift: 'a clear sense of what you want your actions to express', friction: 'conflicting desires or a choice left unexamined', release: 'the expectation that an aligned choice will be effortless', action: 'name the value you want your next action to honour', question: 'What value should be visible in the choice you make?' },
  { name: 'The Chariot', group: 'movement', theme: 'giving effort a deliberate direction', gift: 'focus and the ability to coordinate competing demands', friction: 'speed or pressure taking the place of a clear aim', release: 'the need to make progress on every front at once', action: 'define one achievable milestone and a manageable pace', question: 'What would progress look like in one chosen direction?' },
  { name: 'Strength', group: 'connection', theme: 'meeting intensity with firmness and care', gift: 'patience that allows you to respond rather than react', friction: 'confusing gentleness with tolerating everything', release: 'the belief that strength requires harshness', action: 'put one honest feeling and one clear boundary into words', question: 'How could you be both kinder and clearer?' },
  { name: 'The Hermit', group: 'reflection', theme: 'making space for your own understanding', gift: 'reflection that clarifies your perspective before a conversation', friction: 'a useful retreat becoming an open-ended withdrawal', release: 'the pressure to seek another opinion before hearing your own', action: 'write your own view before choosing what to discuss with someone else', question: 'What do you want to understand for yourself first?' },
  { name: 'Wheel of Fortune', group: 'transition', theme: 'responding to changing conditions', gift: 'flexibility and awareness of recurring patterns', friction: 'trying to control circumstances that can only be observed or adapted to', release: 'the assumption that the present arrangement must stay fixed', action: 'separate what you can influence from what you need to adapt to', question: 'Which part of your response remains available to choose?' },
  { name: 'Justice', group: 'structure', theme: 'weighing a situation with care and fairness', gift: 'clear evidence and an honest account of responsibility', friction: 'an assumption being treated as an established fact', release: 'the demand to reach a verdict before all perspectives are heard', action: 'check one relevant fact and name one unanswered question', question: 'What would a fair account need to include?' },
  { name: 'The Hanged Man', group: 'reflection', theme: 'changing your vantage point', gift: 'a deliberate pause that makes another interpretation possible', friction: 'waiting without knowing what the waiting is for', release: 'an insistence on a single preferred outcome', action: 'describe the question from a different perspective', question: 'What could you notice if you temporarily set your preferred outcome aside?' },
  { name: 'Death', group: 'transition', theme: 'acknowledging endings and changes in form', gift: 'the ability to distinguish what to preserve from what to release', friction: 'asking a finished arrangement to continue unchanged', release: 'the expectation that an ending must feel simple or immediately positive', action: 'name one thing to carry forward and one thing to stop carrying in the same way', question: 'What can change while something important is preserved?' },
  { name: 'Temperance', group: 'connection', theme: 'adjusting the relationship between competing needs', gift: 'patient experimentation with pace and proportion', friction: 'searching for a perfect balance that never needs revisiting', release: 'an all-or-nothing response to competing demands', action: 'make one small adjustment and decide when to review it', question: 'Which adjustment could allow two needs to be acknowledged?' },
  { name: 'The Devil', group: 'structure', theme: 'examining attachment and repeated patterns', gift: 'honesty about what a pattern offers and what it costs', friction: 'an attachment that feels difficult to question', release: 'self-blame that prevents a clear description of the pattern', action: 'describe one repeated pattern and identify a realistic change or source of support', question: 'What does this pattern give you, and what does it ask in return?' },
  { name: 'The Tower', group: 'transition', theme: 'checking the foundations of an explanation', gift: 'a willingness to revise an assumption when evidence changes', friction: 'building another decision on a claim you have not checked', release: 'the expectation that revising a belief makes the earlier effort worthless', action: 'test one assumption before relying on it again', question: 'Which assumption matters enough to verify?' },
  { name: 'The Star', group: 'connection', theme: 'making room for renewal and possibility', gift: 'small, repeatable sources of encouragement', friction: 'requiring certainty before allowing yourself any hope', release: 'the pressure to feel hopeful on command', action: 'return to one source of renewal and notice its effect', question: 'What sustains a small sense of possibility?' },
  { name: 'The Moon', group: 'reflection', theme: 'remaining attentive within an incomplete picture', gift: 'the ability to distinguish observations, feelings, and suspicions', friction: 'filling a gap in information with a convincing story', release: 'the need to make uncertainty disappear immediately', action: 'separate what you know, what you feel, and what you still need to find out', question: 'What is observed, and what are you filling in?' },
  { name: 'The Sun', group: 'movement', theme: 'recognising what is clear and sustaining', gift: 'specific appreciation for progress, warmth, or enjoyment', friction: 'overlooking a good thing because something else remains difficult', release: 'the need to turn every achievement into another goal', action: 'acknowledge one specific thing that is going well', question: 'What is worth appreciating without asking it to resolve everything?' },
  { name: 'Judgement', group: 'transition', theme: 'allowing reflection to inform another choice', gift: 'an honest review that leaves room for a different response', friction: 'turning a lesson from the past into a final judgement of yourself', release: 'an old definition of yourself that no longer fits what you have learned', action: 'name one lesson and how you want your next response to reflect it', question: 'What do you understand differently now?' },
  { name: 'The World', group: 'transition', theme: 'recognising completion and integration', gift: 'a clearer view of what an experience has taught you', friction: 'moving on before acknowledging what is complete', release: 'the demand for perfect closure before another beginning', action: 'mark what is finished and name what you want to carry forward', question: 'What deserves acknowledgement before the next chapter?' },
  ...MINOR_LENSES
];

const INTENTION_LENSES = {
  open: '',
  relationships: 'Bring this back to what you can understand, express, or choose in your relationships.',
  work: 'Consider how this could relate to your attention, responsibilities, or creative effort.',
  change: 'Consider what this makes you want to preserve, reconsider, or explore during a change.'
};

function getSpread(spread) {
  const found = typeof spread === 'string' ? SPREADS.find(item => item.id === spread) : spread;
  if (!found || !SPREADS.some(item => item.id === found.id)) throw new TypeError('Choose an Olivia spread.');
  const canonical = SPREADS.find(item => item.id === found.id);
  return found.readingPlan ? applyQuestionPlan(canonical, found.readingPlan) : canonical;
}

function getLens(cardId) {
  if (!Number.isInteger(cardId) || !LENSES[cardId] || !CARD_NOTES[cardId]) throw new TypeError('Choose a tarot card from 0 to 77.');
  return LENSES[cardId];
}

function getPosition(position) {
  const id = typeof position === 'string' ? position : position?.id;
  const found = SPREADS.flatMap(spread => spread.positions).find(item => item.id === id);
  if (!found) throw new TypeError('Choose a position in an Olivia spread.');
  return typeof position === 'object' ? position : found;
}

function positionText(card, position) {
  const { name, theme, gift, friction, release, action } = card;
  switch (position.id) {
    case 'situation': return `${name} focuses attention on ${theme}. Start by describing where this theme meets your question. Look for an example that is specific enough to examine: an interaction, a choice, or something you keep returning to. The neighbouring cards will add another perspective to that starting point.`;
    case 'complication': return `In this position, ${name} asks you to examine ${friction}. Consider whether that tension changes the way you understand the situation card. It need not describe a problem you already have; it may instead identify an assumption worth checking before you decide how to respond.`;
    case 'heart': return `${name} places ${theme} at the heart of the comparison. Treat ${gift} as a possible value or need to explore. Before judging either path, decide whether this quality matters to you and what it would look like in practice.`;
    case 'path-a':
    case 'path-b': return `Through ${name}, explore ${theme} in ${position.label}. What room would this option give to ${gift}? What would you need to understand about ${friction}? Use the card to develop questions about this option, rather than to predict its outcome or rank it above the other path.`;
    case 'overlooked': return `${name} asks you to look again at ${theme}. There may be value in examining ${friction} before the comparison feels complete. This position does not uncover a hidden fact; it gives you a specific line of inquiry to test against both options.`;
    case 'root': return `${name} offers ${theme} as a possible thread beneath the situation. Look back for an example you can actually recognise: a learned response, an agreement, or a recurring pattern. If it fits, ask whether ${gift} still serves you, and whether ${friction} deserves reconsideration.`;
    case 'inner': return `${name} asks how ${theme} colours your own perspective. You might recognise ${gift} as something you bring to the question, or notice ${friction} as a useful caution. Set this beside outer influences to separate your interpretation from the circumstances you can observe.`;
    case 'outer': return `${name} supplies a question about your surroundings: where is ${theme} visible in actual circumstances, agreements, or interactions? Look for evidence you could describe to another person. This card does not tell you what someone else secretly thinks; it helps you decide what to notice or ask about.`;
    case 'tension': return `${name} focuses the tension around ${friction}. Consider what two needs may be pulling against one another and whether either has gone unacknowledged. Read the support card next: it can suggest a resource to bring into this tension, without implying that the difficulty should disappear.`;
    case 'support': return `${name} draws attention to ${gift}. Consider whether this resource is already present, could be developed, or might be found through appropriate help. Pair it with the tension card and name one realistic way this quality could make that tension easier to understand or respond to.`;
    case 'release': return `${name} invites you to loosen ${release}. This is a question about how you relate to an expectation or pattern, not an instruction to abandon a person or commitment. Consider what room a less rigid response would create for the next-step card.`;
    case 'next-step': return `${name} makes the final invitation practical: ${action}. Adapt this to what is realistic in your circumstances. Look back across the other positions, then choose one manageable experiment; you do not have to turn every card into a separate task or resolve the whole question at once.`;
    default: throw new TypeError('This spread position is not supported.');
  }
}

export function positionReading(cardId, position, intention = 'open', orientation = 'upright') {
  const card = getLens(cardId), slot = getPosition(position), note = cardNotesForOrientation(cardId, orientation);
  if (!Object.hasOwn(INTENTION_LENSES, intention)) throw new TypeError('Choose a supported intention.');
  const focus = ['next-step', 'support', 'release'].includes(slot.id) ? '' : INTENTION_LENSES[intention];
  return {
    cardId, orientation, positionId: slot.id, label: slot.label,
    meaning: [orientation === 'reversed' ? `${note.meaning} In “${slot.label}”, bring this back to the position’s question: ${slot.prompt}` : positionText(card, slot), focus].filter(Boolean).join(' '),
    prompt: `${slot.prompt} ${orientation === 'reversed' ? note.prompt : card.question}`,
    practice: note.practice,
    learn: note.learn,
    connection: slot.connection
  };
}

const RELATIONS = {
  'movement|reflection': 'Allow reflection to shape the action, and let a small action give reflection something real to work with.',
  'movement|structure': 'Give momentum a clear boundary or measure, so that effort has somewhere useful to go.',
  'movement|connection': 'Consider how taking a step and caring for what matters could support one another.',
  'movement|transition': 'Distinguish a step you can choose from a change you need to respond to; they ask for different kinds of effort.',
  'reflection|structure': 'Check whether a rule clarifies what you are noticing, or whether a familiar rule is preventing another interpretation.',
  'reflection|connection': 'Let private reflection inform what you communicate, while leaving room for another person’s perspective.',
  'reflection|transition': 'Make enough space to understand the change without requiring complete certainty before your next small response.',
  'structure|connection': 'Consider whether a boundary or agreement makes care more sustainable, and whether it is fair to everyone involved.',
  'structure|transition': 'Separate the structure worth preserving from the part that may need to adapt.',
  'connection|transition': 'Ask what deserves care through the change, and what can take a different form without losing its value.'
};

const SAME_GROUP = {
  movement: 'Both cards concern action. Compare their pace and purpose, then choose one clear step instead of multiplying tasks.',
  reflection: 'Both cards favour looking again. Give that reflection a focus and a point at which you will return to practical experience.',
  structure: 'Both cards concern the way a situation is organised. Examine which rules are useful, which are assumed, and who they serve.',
  connection: 'Both cards attend to care and relationship. Look for a response that acknowledges your needs as well as the demands around you.',
  transition: 'Both cards concern change or integration. Distinguish what is actually changing from what you are being asked to reconsider.'
};

function relate(a, b) {
  if (a.group === b.group) return SAME_GROUP[a.group];
  return RELATIONS[`${a.group}|${b.group}`] || RELATIONS[`${b.group}|${a.group}`];
}

function readingOrientations(cardIds, orientations) {
  const values = orientations ?? cardIds.map(() => 'upright');
  if (!Array.isArray(values) || values.length !== cardIds.length || values.some(value => value !== 'upright' && value !== 'reversed')) throw new TypeError('Every spread card needs a valid orientation.');
  return values;
}

export function synthesizeSpread(spread, cardIds, intention = 'open', orientations) {
  const definition = getSpread(spread);
  if (!Array.isArray(cardIds) || cardIds.length !== definition.count || new Set(cardIds).size !== cardIds.length) throw new TypeError('Each spread needs its full set of distinct cards.');
  if (!Object.hasOwn(INTENTION_LENSES, intention)) throw new TypeError('Choose a supported intention.');
  const directions = readingOrientations(cardIds, orientations);
  const cards = cardIds.map((id, index) => {
    const card = getLens(id);
    return directions[index] === 'reversed' ? { ...card, name: `${card.name} reversed`, theme: card.friction } : card;
  }), last = cards.at(-1), paragraphs = [];
  if (definition.id === 'clarity3') {
    const [situation, tension, next] = cards;
    paragraphs.push(`${definition.positions[0].label}, ${situation.name}, opens with ${situation.theme}. ${definition.positions[1].label}, ${tension.name}, turns attention toward ${tension.friction}. Look for a concrete example of how those ideas meet in your question; neither card needs to become a complete account of your circumstances.`);
    paragraphs.push(`${situation.name} and ${tension.name} can be read in conversation. ${relate(situation, tension)} Then bring ${next.name} into the picture as a helpful next step: ${next.action}. Choose an action that addresses the tension you recognised, rather than acting on the final card in isolation.`);
  } else if (definition.id === 'crossroads5') {
    const [heart, a, b, overlooked, next] = cards;
    paragraphs.push(`At the heart, ${heart.name} asks you to consider ${heart.theme}. Use that as a possible criterion for the choice: what would it look like for either option to honour ${heart.gift}? Decide whether that criterion fits before using it to compare the paths.`);
    paragraphs.push(`Path A, ${a.name}, offers ${a.gift} as something to explore; Path B, ${b.name}, offers ${b.gift}. Their questions differ: examine ${a.friction} in A and ${b.friction} in B. ${relate(a, b)} The cards do not select a winner; look for information that could make the real differences clearer.`);
    paragraphs.push(`What to look at again, ${overlooked.name}, introduces ${overlooked.theme}. Bring that question back to both paths before taking ${next.name} as a grounded next step: ${next.action}. An experiment, observation, or conversation may be more useful here than an immediate commitment.`);
  } else {
    const [situation, root, inner, outer, tension, support, release, next] = cards;
    paragraphs.push(`The situation, ${situation.name}, foregrounds ${situation.theme}; at the root, ${root.name} adds ${root.theme}. Compare the present question with a pattern you can recognise from experience. ${relate(situation, root)}`);
    paragraphs.push(`Your perspective, ${inner.name}, gives you ${inner.theme} to examine. Outer influences, ${outer.name}, asks where ${outer.theme} appears in observable circumstances. Keep those two layers distinct: an interpretation and an external fact can influence one another without being the same thing.`);
    paragraphs.push(`The tension, ${tension.name}, draws attention to ${tension.friction}. What supports you, ${support.name}, suggests looking for ${support.gift}. ${relate(tension, support)} Name one practical way that resource could respond to the tension you actually recognise.`);
    paragraphs.push(`What to loosen, ${release.name}, asks you to reconsider ${release.release}. Beside it, your next step, ${next.name}, invites you to ${next.action}. Making room and taking action are connected here. Choose one manageable response that respects what the first six positions helped you notice.`);
  }
  const prompt = definition.id === 'crossroads5'
    ? 'What could you observe, ask, or try that would make the difference between your two options clearer?'
    : definition.id === 'compass8'
      ? 'Which relationship between two cards best describes something you recognise, and what one response would help?'
      : 'What small response would address the tension you recognised while respecting the situation as it is?';
  return { title: 'Reading the cards together', paragraphs, prompt, question: prompt, practice: cardNotesForOrientation(cardIds.at(-1), directions.at(-1)).practice, finalCard: last.name };
}

export function buildSpreadReading(spread, cardIds, intention = 'open', orientations) {
  const definition = getSpread(spread), directions = readingOrientations(cardIds, orientations), synthesis = synthesizeSpread(definition, cardIds, intention, directions);
  const cards = cardIds.map((cardId, index) => {
    const { positionId, label, meaning, prompt, practice, orientation } = positionReading(cardId, definition.positions[index], intention, directions[index]);
    return { cardId, orientation, positionId, label, meaning, prompt, practice };
  });
  return { cards, synthesis: { paragraphs: synthesis.paragraphs, prompt: synthesis.prompt } };
}
