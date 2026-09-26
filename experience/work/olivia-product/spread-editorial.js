import { MINOR_EDITORIAL } from './minor-content.js';

// A lighter first reading. The full authored interpretation remains available
// beneath each lead; these lines never replace the saved reading itself.
const EDITORIAL = {
  clarity3: {
    invitation: 'Give the question a little room. See what is present, what complicates it, and where you could begin.',
    arrival: 'Three perspectives, held together. Turn the first card when you are ready.',
    gesture: 'A little room to see.',
    chapters: ['Where the question opens', 'One way to begin']
  },
  crossroads5: {
    invitation: 'Hold both possibilities without rushing to choose. Let each show you what it asks, and what matters to you.',
    arrival: 'Both paths have a place. Begin with what matters at the heart of your choice.',
    gesture: 'Hold both possibilities.',
    chapters: ['What matters to you', 'Two paths in conversation', 'Before you decide']
  },
  compass8: {
    invitation: 'Let the picture gather slowly. A situation, its roots, the forces around it, and a step that remains yours.',
    arrival: 'The whole picture is here. Take it one relationship at a time.',
    gesture: 'Let the picture gather.',
    chapters: ['The situation and its roots', 'Within and around you', 'Tension and support', 'Making room to move']
  }
};

// Card order follows the stable full-deck IDs, 0–77. Each phrase has a
// grammatical role so a position changes the invitation, not just its label.
const CARDS = [
  {
    focus: 'beginning while some questions remain unanswered',
    resource: 'curiosity about what a first attempt could teach',
    friction: 'waiting for certainty before making any move',
    loosen: 'the expectation of getting a beginning exactly right',
    step: 'Try something small enough to reverse, and pay attention to what the experience teaches you.'
  },
  {
    focus: 'turning an intention into something you can do',
    resource: 'the skills and materials already within your reach',
    friction: 'spreading your effort across too many intentions',
    loosen: 'the belief that you need another resource first',
    step: 'Choose one task that puts an existing skill to use, and give it your full attention.'
  },
  {
    focus: 'listening carefully before giving an impression its meaning',
    resource: 'quiet attention and a willingness to stay curious',
    friction: 'treating an impression as the whole explanation',
    loosen: 'the pressure to explain every feeling straight away',
    step: 'Write down your impression, then place beside it something you can actually observe.'
  },
  {
    focus: 'creating conditions in which something can grow',
    resource: 'patient care that you can sustain over time',
    friction: 'giving more care than you can sustainably offer',
    loosen: 'the expectation that growth must be constantly visible',
    step: 'Make one part of your day more supportive of something you want to nurture.'
  },
  {
    focus: 'the agreements and boundaries that hold things together',
    resource: 'clear agreements and a dependable sense of structure',
    friction: 'holding to a rule after its purpose changes',
    loosen: 'the need to manage every detail yourself',
    step: 'Put one useful boundary into plain words, leaving room to discuss how it works.'
  },
  {
    focus: 'the guidance and beliefs you have learned',
    resource: 'shared experience that remains open to thoughtful questions',
    friction: 'following familiar guidance without examining its purpose',
    loosen: 'the obligation to accept guidance without questioning it',
    step: 'Ask what a familiar rule protects, then consider whether it still serves that purpose.'
  },
  {
    focus: 'the values your choices put into practice',
    resource: 'an honest sense of what matters to you',
    friction: 'leaving competing desires unspoken or poorly understood',
    loosen: 'the expectation that a meaningful choice feels effortless',
    step: 'Name the value you want to honour, then imagine one action that would express it.'
  },
  {
    focus: 'giving your effort a direction you can sustain',
    resource: 'focus that brings competing demands into workable order',
    friction: 'letting speed take the place of clear direction',
    loosen: 'the need to advance on every front together',
    step: 'Choose one achievable milestone, and set a pace that leaves you room to notice.'
  },
  {
    focus: 'meeting strong feelings with care and firmness',
    resource: 'patience that gives an honest response room to form',
    friction: 'confusing kindness with having to tolerate everything',
    loosen: 'the belief that firmness needs to feel harsh',
    step: 'Give an honest feeling a few clear words, alongside a boundary you can uphold.'
  },
  {
    focus: 'making space to hear your own perspective',
    resource: 'time alone that helps you understand your position',
    friction: 'allowing a useful retreat to become indefinite withdrawal',
    loosen: 'the need for another opinion before hearing yourself',
    step: 'Write what you think before seeking another opinion, then choose what deserves a conversation.'
  },
  {
    focus: 'responding to conditions that continue to change',
    resource: 'flexibility and an attentive eye for recurring patterns',
    friction: 'trying to control circumstances that keep changing',
    loosen: 'the assumption that this arrangement must stay fixed',
    step: 'Separate what you can influence from what you can adapt to, and choose your response.'
  },
  {
    focus: 'giving responsibility and evidence a fair hearing',
    resource: 'clear evidence and a fair account of responsibility',
    friction: 'treating an untested assumption as an established fact',
    loosen: 'the demand for a verdict before everyone is heard',
    step: 'Check one fact that matters, and leave an unanswered question open until you know more.'
  },
  {
    focus: 'allowing a pause to change your perspective',
    resource: 'a deliberate pause that makes another interpretation possible',
    friction: 'waiting without deciding what the pause is for',
    loosen: 'the insistence on one particular shape of outcome',
    step: 'Describe the question from another perspective, setting your preferred outcome aside for a moment.'
  },
  {
    focus: 'recognising what is ending or changing its form',
    resource: 'discernment about what to preserve through a change',
    friction: 'asking an old arrangement to continue unchanged',
    loosen: 'the expectation that an ending should feel simple',
    step: 'Name what you want to carry forward, and what you can stop carrying in the same way.'
  },
  {
    focus: 'adjusting the space between two competing needs',
    resource: 'patient experimentation with the pace and proportion of things',
    friction: 'searching for a balance that never needs revisiting',
    loosen: 'the need to answer competing demands all at once',
    step: 'Make one small adjustment that acknowledges both needs, then decide when to review it.'
  },
  {
    focus: 'examining what a repeated pattern offers and costs',
    resource: 'honesty about a pattern without turning it into blame',
    friction: 'avoiding questions about a familiar attachment',
    loosen: 'the self-blame that makes a pattern harder to examine',
    step: 'Describe a repeated pattern plainly, then identify one realistic change or source of support.'
  },
  {
    focus: 'checking the assumptions beneath an important explanation',
    resource: 'a willingness to revise an idea when evidence changes',
    friction: 'building another decision on an unchecked assumption',
    loosen: 'the fear that revision makes earlier effort worthless',
    step: 'Choose an assumption your decision depends on, and look for a practical way to check it.'
  },
  {
    focus: 'making room for encouragement and renewed possibility',
    resource: 'small sources of encouragement you can return to',
    friction: 'requiring certainty before allowing any room for hope',
    loosen: 'the pressure to feel hopeful before you are ready',
    step: 'Return to one thing that helps you feel renewed, and notice what it makes possible.'
  },
  {
    focus: 'finding your bearings within an incomplete picture',
    resource: 'the patience to separate observations from interpretations',
    friction: 'filling missing information with a convincing story',
    loosen: 'the need to make all uncertainty disappear immediately',
    step: 'Separate what you know from what you imagine, then name what you still want to understand.'
  },
  {
    focus: 'recognising what is clear, enjoyable, or sustaining',
    resource: 'specific appreciation for something that is going well',
    friction: 'overlooking something good because other things remain difficult',
    loosen: 'the need to turn every achievement into another goal',
    step: 'Give one good thing your full attention, without asking it to settle the whole question.'
  },
  {
    focus: 'letting what you have learned inform another choice',
    resource: 'an honest review that leaves room for change',
    friction: 'turning an earlier mistake into a fixed self-definition',
    loosen: 'an old description of yourself that no longer fits',
    step: 'Name something you now understand differently, and let it shape one response you can choose.'
  },
  {
    focus: 'recognising what an experience has brought together',
    resource: 'a considered view of what an experience taught you',
    friction: 'moving on before acknowledging what is already complete',
    loosen: 'the demand for perfect closure before beginning again',
    step: 'Mark what is finished, and choose one thing from the experience to carry forward.'
  },
  ...MINOR_EDITORIAL
];

export function spreadEditorial(spreadId) {
  const editorial = EDITORIAL[spreadId];
  if (!editorial) throw new TypeError('Choose an Olivia spread.');
  return { ...editorial, chapters: [...editorial.chapters] };
}

export function cardEditorial(cardId, positionId) {
  if (!Number.isInteger(cardId) || !CARDS[cardId]) throw new TypeError('Choose a tarot card from 0 to 77.');
  const card = CARDS[cardId];
  let line;
  switch (positionId) {
    case 'situation': line = `Give some attention to ${card.focus} as you consider this question.`; break;
    case 'heart': line = cardId===6?'Which choice would let you act on the values you want to live by?':`Let ${card.resource} help you name what matters in this choice.`; break;
    case 'path-a':
    case 'path-b': line = `Ask how this path would make room for ${card.resource}.`; break;
    case 'complication': line = `Consider whether ${card.friction} is making this question harder to approach.`; break;
    case 'overlooked': line = `Look again at ${card.friction} before your comparison feels complete.`; break;
    case 'root': line = `Consider how ${card.focus} has shaped your earlier choices and assumptions.`; break;
    case 'inner': line = `Notice how ${card.focus} shapes the way you see this question.`; break;
    case 'outer': line = `Look for concrete examples of ${card.focus} in the circumstances around you.`; break;
    case 'tension': line = `Explore the tension around ${card.friction}, leaving room for more than one need.`; break;
    case 'support': line = `Draw on ${card.resource} as you explore what would help.`; break;
    case 'release': line = `Experiment with loosening ${card.loosen}, then notice what feels more possible.`; break;
    case 'next-step': line = card.step; break;
    default: throw new TypeError('Choose a position in an Olivia spread.');
  }
  return { line };
}
