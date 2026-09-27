import {validateGuidance} from './saved-guidance.js';
/** Pure spread selection and device-local persistence. Entitlements belong upstream. */
import { ReadingError, shuffleDeck, INTENTIONS, normalizeOrientation, createDeckOrientations, deckOrientations } from './core.js';
import { CARD_IDS, CARD_COUNT } from './deck-catalog.js';
import { validateQuestionPlan, QUESTION_LIMIT } from './question-coach.js';

export const SPREAD_STORAGE_KEY = 'olivia-arcana-spreads-v1';
export const SPREAD_SCHEMA_VERSION = 1;
export const MAX_SPREAD_RECORDS = 100;
export const SPREAD_COUNTS = Object.freeze({ clarity3: 3, crossroads5: 5, compass8: 8 });

const fail = message => { throw new ReadingError('VALIDATION', message); };
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isCardId = value => Number.isInteger(value) && value >= 0 && value < CARD_COUNT;

function questionPlan(value, spreadId, question) {
  if (value === undefined) return undefined;
  let plan;
  try { plan = validateQuestionPlan(value); } catch { fail('The approved question plan is invalid.'); }
  if (plan.spreadId !== spreadId || plan.question !== question) fail('The approved question plan must match this reading.');
  return plan;
}

function text(value, name, limit, required = false) {
  if (typeof value !== 'string' || value.length > limit || (required && !value.trim())) {
    fail(`${name} must be ${required ? 'non-empty text' : 'text'} of at most ${limit} characters.`);
  }
  return value;
}

function timestamp(value, name) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)) fail(`${name} must be an ISO timestamp.`);
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== value) fail(`${name} is invalid.`);
  return value;
}

function intention(value) {
  if (!INTENTIONS.includes(value)) fail('Choose a valid reading intention.');
  return value;
}

function spreadCount(spreadId) {
  if (!Object.hasOwn(SPREAD_COUNTS, spreadId)) fail('Choose a supported spread.');
  return SPREAD_COUNTS[spreadId];
}

function cardIds(value, { length, allowEmpty = false } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0) || value.length > CARD_COUNT || !value.every(isCardId) || new Set(value).size !== value.length || (length !== undefined && value.length !== length)) {
    fail('Card numbers must be unique tarot numbers, in the expected order and count.');
  }
  return [...value];
}

function id() {
  const crypto = globalThis.crypto;
  if (!crypto?.getRandomValues) throw new ReadingError('RANDOM_UNAVAILABLE', 'A secure card draw is not available in this browser.');
  if (crypto.randomUUID) return crypto.randomUUID();
  return [...crypto.getRandomValues(new Uint32Array(4))].map(n => n.toString(16).padStart(8, '0')).join('');
}

function immutableSession(session) {
  return Object.freeze({
    ...session,
    deck: Object.freeze([...session.deck]),
    selectedSlots: Object.freeze([...session.selectedSlots]),
    cardIds: Object.freeze([...session.cardIds]),
    deckOrientations: Object.freeze([...deckOrientations(session)]),
    orientations: Object.freeze([...(session.orientations ?? session.cardIds.map(() => 'upright'))]),
    ...(session.readingPlan ? { readingPlan: questionPlan(session.readingPlan, session.spreadId, session.question) } : {}),
  });
}

export function createSpreadSession({ question = '', intention: chosenIntention = 'open', spreadId, count, reversals = false, readingPlan } = {}, ids = CARD_IDS, randomUint32) {
  text(question, 'Your question', QUESTION_LIMIT);
  intention(chosenIntention);
  const expected = spreadCount(spreadId);
  if (count !== expected) fail('The card count does not match this spread.');
  const deck = cardIds(ids);
  if (deck.length < count) fail('The deck does not contain enough cards for this spread.');
  const plan = questionPlan(readingPlan, spreadId, question);
  return immutableSession({
    id: id(), createdAt: new Date().toISOString(), question, intention: chosenIntention,
    spreadId, count, deck: shuffleDeck(deck, randomUint32), selectedSlots: [], cardIds: [], revealedCount: 0,
    reversals, deckOrientations: createDeckOrientations(deck.length, reversals, randomUint32), orientations: [],
    ...(plan ? { readingPlan: plan } : {}),
  });
}

function validateSession(session) {
  if (!isObject(session)) fail('A spread session is required.');
  text(session.id, 'Reading identifier', 128, true);
  timestamp(session.createdAt, 'Reading date');
  text(session.question, 'Your question', QUESTION_LIMIT);
  questionPlan(session.readingPlan, session.spreadId, session.question);
  intention(session.intention);
  const count = spreadCount(session.spreadId);
  if (session.count !== count) fail('The card count does not match this spread.');
  const deck = cardIds(session.deck);
  const selected = cardIds(session.cardIds, { allowEmpty: true });
  const deckDirections = deckOrientations(session), directions = session.orientations ?? selected.map(() => 'upright');
  if (!Array.isArray(directions) || directions.length !== selected.length) fail('Every chosen card must have one orientation.');
  if (deck.length < count || selected.length > count || !Array.isArray(session.selectedSlots) || session.selectedSlots.length !== selected.length || new Set(session.selectedSlots).size !== selected.length) {
    fail('The selected positions are invalid.');
  }
  session.selectedSlots.forEach((slot, i) => {
    if (!Number.isInteger(slot) || slot < 0 || slot >= deck.length || deck[slot] !== selected[i]) fail('A selected card does not match its deck position.');
    if (directions[i] === undefined || normalizeOrientation(directions[i]) !== deckDirections[slot]) fail('A chosen orientation does not match its deck position.');
  });
  if (!Number.isInteger(session.revealedCount) || session.revealedCount < 0 || session.revealedCount > selected.length) fail('The reveal position is invalid.');
}

export function selectSpreadCard(session, slot) {
  validateSession(session);
  if (!Number.isInteger(slot) || slot < 0 || slot >= session.deck.length) fail('Choose a card position in this deck.');
  if (session.selectedSlots.includes(slot) || session.cardIds.length === session.count) return session;
  return immutableSession({
    ...session,
    selectedSlots: [...session.selectedSlots, slot],
    cardIds: [...session.cardIds, session.deck[slot]],
    orientations: [...(session.orientations ?? session.cardIds.map(() => 'upright')), deckOrientations(session)[slot]],
  });
}

export function revealNext(session) {
  validateSession(session);
  if (session.revealedCount === session.cardIds.length) return session;
  return immutableSession({ ...session, revealedCount: session.revealedCount + 1 });
}

export function revealAll(session) {
  validateSession(session);
  if (session.revealedCount === session.cardIds.length) return session;
  return immutableSession({ ...session, revealedCount: session.cardIds.length });
}

function validateCard(value) {
  if (!isObject(value) || !isCardId(value.cardId)) fail('A spread card is invalid.');
  return {
    cardId: value.cardId,
    orientation: normalizeOrientation(value.orientation),
    positionId: text(value.positionId, 'Position identifier', 80, true),
    label: text(value.label, 'Position label', 160, true),
    meaning: text(value.meaning, 'Card meaning', 8000, true),
    prompt: text(value.prompt, 'Reflection prompt', 2000, true),
    practice: text(value.practice, 'Suggested practice', 2000, true),
  };
}

function validateSynthesis(value) {
  if (!isObject(value) || !Array.isArray(value.paragraphs) || value.paragraphs.length < 1 || value.paragraphs.length > 12) fail('A spread synthesis must contain 1 to 12 paragraphs.');
  return {
    paragraphs: value.paragraphs.map(paragraph => text(paragraph, 'Synthesis paragraph', 8000, true)),
    prompt: text(value.prompt, 'Spread reflection prompt', 2000, true),
  };
}

function validateRecord(value) {
  if (!isObject(value) || value.schemaVersion !== SPREAD_SCHEMA_VERSION) fail('This spread uses an unsupported format.');
  const count = spreadCount(value.spreadId), ids = cardIds(value.cardIds, { length: count });
  if (value.revealedCount !== count) fail('Reveal the whole spread before saving it.');
  if (!Array.isArray(value.cards) || value.cards.length !== count) fail('The spread must contain every position.');
  const cards = value.cards.map(validateCard);
  if (cards.some((card, index) => card.cardId !== ids[index]) || new Set(cards.map(card => card.positionId)).size !== count) fail('The spread positions must match the ordered cards.');
  const record = {
    schemaVersion: SPREAD_SCHEMA_VERSION,
    id: text(value.id, 'Reading identifier', 128, true),
    createdAt: timestamp(value.createdAt, 'Reading date'),
    updatedAt: timestamp(value.updatedAt, 'Updated date'),
    question: text(value.question, 'Your question', QUESTION_LIMIT),
    intention: intention(value.intention),
    spreadId: value.spreadId,
    spreadName: text(value.spreadName, 'Spread name', 160, true),
    cardIds: ids,
    revealedCount: count,
    cards,
    synthesis: validateSynthesis(value.synthesis),
    note: text(value.note, 'Your reflection', 4000),
  };
  const plan = questionPlan(value.readingPlan, value.spreadId, value.question);
  if (plan) {
    if (record.spreadName !== plan.spreadName) fail('The saved spread name must match the approved plan.');
    if (cards.some((card, index) => card.positionId !== plan.positions[index].id || card.label !== plan.positions[index].label)) fail('Saved positions must match the approved question plan.');
    record.readingPlan = plan;
  }
  if (value.guidance !== undefined) { try { record.guidance = validateGuidance(value.guidance); } catch { fail('The saved AI interpretation is invalid.'); } }
  if (record.updatedAt < record.createdAt) fail('The updated date cannot precede the reading date.');
  return record;
}

export function createSpreadRecord(session, spread, reading, note = '') {
  validateSession(session);
  if (session.cardIds.length !== session.count || session.revealedCount !== session.count) fail('Choose and reveal every card before saving this spread.');
  if (!isObject(spread) || spread.id !== session.spreadId || spread.count !== session.count || !Array.isArray(spread.positions) || spread.positions.length !== session.count) fail('The spread definition does not match this reading.');
  if (!isObject(reading) || !Array.isArray(reading.cards) || reading.cards.length !== session.count) fail('The spread interpretation is incomplete.');
  spread.positions.forEach((position, index) => {
    const card = reading.cards[index];
    if (!isObject(position) || !isObject(card) || position.id !== card.positionId || position.label !== card.label) fail('The interpretation must follow this spread’s position order.');
    if (session.readingPlan && (position.id !== session.readingPlan.positions[index].id || position.label !== session.readingPlan.positions[index].label || position.prompt !== session.readingPlan.positions[index].prompt)) fail('Spread positions cannot change after the question plan is approved.');
  });
  return validateRecord({
    schemaVersion: SPREAD_SCHEMA_VERSION,
    id: session.id, createdAt: session.createdAt,
    updatedAt: new Date(Math.max(Date.now(), Date.parse(session.createdAt))).toISOString(),
    question: session.question, intention: session.intention,
    ...(session.readingPlan ? { readingPlan: session.readingPlan } : {}),
    spreadId: session.spreadId, spreadName: spread.name,
    cardIds: session.cardIds, revealedCount: session.revealedCount,
    cards: reading.cards.map((card, index) => {
      const orientation = (session.orientations ?? session.cardIds.map(() => 'upright'))[index];
      if (normalizeOrientation(card.orientation) !== orientation) fail('The interpretation must use the orientation of the chosen card.');
      return { ...card, orientation };
    }), synthesis: reading.synthesis, note,
  });
}

function requireStorage(storage) {
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
    throw new ReadingError('STORAGE_UNAVAILABLE', 'Your browser is not allowing access to the local spread journal. Download your reading to keep a copy.');
  }
}

function validateRecords(value) {
  if (!Array.isArray(value) || value.length > MAX_SPREAD_RECORDS) fail('The spread journal must contain at most 100 readings.');
  const records = value.map(validateRecord);
  if (new Set(records.map(record => record.id)).size !== records.length) fail('The journal contains duplicate spread identifiers.');
  return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function loadSpreadRecords(storage) {
  requireStorage(storage);
  let raw;
  try { raw = storage.getItem(SPREAD_STORAGE_KEY); }
  catch (cause) { throw new ReadingError('STORAGE_UNAVAILABLE', 'Your browser is not allowing access to the local spread journal. Download your reading to keep a copy.', cause); }
  if (raw === null) return [];
  try {
    const envelope = JSON.parse(raw);
    if (!isObject(envelope) || envelope.schemaVersion !== SPREAD_SCHEMA_VERSION) fail('The spread journal format is not recognised.');
    return validateRecords(envelope.records);
  } catch (cause) {
    throw new ReadingError('STORAGE_CORRUPT', 'Your existing spread journal could not be read. It has not been changed. Download this reading to keep a copy.', cause);
  }
}

function writeRecords(storage, records) {
  try { storage.setItem(SPREAD_STORAGE_KEY, JSON.stringify({ schemaVersion: SPREAD_SCHEMA_VERSION, records })); }
  catch (cause) {
    const quota = cause?.name === 'QuotaExceededError' || cause?.name === 'NS_ERROR_DOM_QUOTA_REACHED' || cause?.code === 22 || cause?.code === 1014;
    throw new ReadingError(quota ? 'STORAGE_QUOTA' : 'STORAGE_UNAVAILABLE', quota
      ? 'Your browser has no room for another saved spread. Download it, or remove an older entry first.'
      : 'Your browser could not save this spread. Download it to keep a copy.', cause);
  }
  return records;
}

export function saveSpreadRecord(storage, value) {
  const record = validateRecord(value), records = loadSpreadRecords(storage);
  const index = records.findIndex(prior => prior.id === record.id);
  if (index === -1) {
    if (records.length >= MAX_SPREAD_RECORDS) throw new ReadingError('STORAGE_LIMIT', 'Your journal holds 100 spreads. Download your journal or remove an older entry before saving another.');
    records.push(record);
  } else {
    const prior = records[index];
    if (prior.spreadId !== record.spreadId || prior.createdAt !== record.createdAt || prior.question !== record.question || prior.intention !== record.intention || JSON.stringify(prior.readingPlan) !== JSON.stringify(record.readingPlan) || prior.cardIds.some((id, i) => id !== record.cardIds[i]) || prior.cards.some((card, i) => card.orientation !== record.cards[i].orientation || card.positionId !== record.cards[i].positionId || card.label !== record.cards[i].label)) {
      fail('An existing spread cannot be replaced by a different draw or position order.');
    }
    records[index] = { ...record, ...(!record.guidance && prior.guidance ? {guidance:prior.guidance} : {}) };
  }
  records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return writeRecords(storage, records);
}

export function removeSpreadRecord(storage, readingId) {
  text(readingId, 'Reading identifier', 128, true);
  const records = loadSpreadRecords(storage), remaining = records.filter(record => record.id !== readingId);
  return remaining.length === records.length ? records : writeRecords(storage, remaining);
}

export function exportSpreadRecords(records) {
  return JSON.stringify({ schemaVersion: SPREAD_SCHEMA_VERSION, records: validateRecords(records) }, null, 2);
}

export function getLastSpreadRecord(records) {
  return validateRecords(records)[0] ?? null;
}
