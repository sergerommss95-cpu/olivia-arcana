import {normalizeReflectionOrigin} from '../../../website/src/lib/question-handoff.ts';
import {validateFirstImpressions,mergeFirstImpressions} from './first-impression.js';
import {validateGuidance} from './saved-guidance.js';
/**
 * Olivia's private, device-local reading journal.
 *
 * No network calls, HTML, generated interpretations, or global storage access.
 * Callers supply localStorage and render all returned strings as text.
 */
import { CARD_IDS, CARD_COUNT } from './deck-catalog.js';

export const STORAGE_KEY = 'olivia-arcana-readings-v1';
export const SCHEMA_VERSION = 1;
export const MAX_RECORDS = 1000;
export const INTENTIONS = Object.freeze(['open', 'relationships', 'work', 'change']);
export const DECK_IDS = Object.freeze(['olivia', 'space-between']);

export class ReadingError extends Error {
  constructor(code, message, cause) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = 'ReadingError';
    this.code = code;
  }
}

const fail = (message) => { throw new ReadingError('VALIDATION', message); };
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const validCardId = value => Number.isInteger(value) && value >= 0 && value < CARD_COUNT;

// Artwork belongs to the reading, not to the reader's current deck preference.
// Missing IDs are pre-deck-choice records and retain the original Olivia art.
export function normalizeDeckId(value) {
  if (value === undefined) return 'olivia';
  if (!DECK_IDS.includes(value)) fail('Choose a supported tarot deck.');
  return value;
}

export function normalizeArtwork(value = {}) {
 if(value.artworkEdition===undefined&&value.artworkVariant===undefined)return {};
 if(value.deckId!=='space-between'||!['amielle-relationships-v1','amielle-relationships-v2'].includes(value.artworkEdition)||!['woman-man','men','women'].includes(value.artworkVariant))fail('Choose a supported artwork edition.');
 return {artworkEdition:value.artworkEdition,artworkVariant:value.artworkVariant};
}

export function normalizeOrigin(value) {
 if(value===undefined)return {};
 const origin=normalizeReflectionOrigin(value);
 if(!origin)fail('This reflection origin is invalid.');
 return {origin};
}

function string(value, name, max, required = false) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) {
    fail(`${name} must be ${required ? 'a non-empty string' : 'text'} of at most ${max} characters.`);
  }
  return value;
}

function iso(value, name) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)) {
    fail(`${name} must be an ISO timestamp.`);
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== value) fail(`${name} is invalid.`);
  return value;
}

function validateIntention(value) {
  if (!INTENTIONS.includes(value)) fail('Choose a valid reading intention.');
  return value;
}

function validateIds(ids) {
  if (!Array.isArray(ids) || !ids.length || ids.length > CARD_COUNT || !ids.every(validCardId) || new Set(ids).size !== ids.length) {
    fail(`The deck must contain unique tarot card numbers, from 0 to ${CARD_COUNT - 1}.`);
  }
  return [...ids];
}

function secureUint32() {
  if (!globalThis.crypto?.getRandomValues) {
    throw new ReadingError('RANDOM_UNAVAILABLE', 'A secure card draw is not available in this browser.');
  }
  return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
}

function randomIndex(bound, randomUint32) {
  // Rejection sampling avoids modulo bias for deck sizes that do not divide 2^32.
  const ceiling = 0x100000000 - (0x100000000 % bound);
  let value;
  do {
    value = randomUint32();
    if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
      fail('The random source must return an unsigned 32-bit integer.');
    }
  } while (value >= ceiling);
  return value % bound;
}

// Orientations belong to the shuffled deck, so neither hovering, choosing nor
// revealing can redraw them. Missing orientations are old upright-only data.
export function normalizeOrientation(value) {
  if (value === undefined) return 'upright';
  if (value !== 'upright' && value !== 'reversed') fail('Choose a valid card orientation.');
  return value;
}

export function createDeckOrientations(count, reversals = false, randomUint32 = secureUint32) {
  if (typeof reversals !== 'boolean') fail('The reversals option must be on or off.');
  if (!Number.isInteger(count) || count < 1 || count > CARD_COUNT) fail('The deck size is invalid.');
  if (typeof randomUint32 !== 'function') fail('A random source is required.');
  return Object.freeze(Array.from({ length: count }, () => reversals && randomIndex(2, randomUint32) === 1 ? 'reversed' : 'upright'));
}

export function deckOrientations(session) {
  if (session.reversals !== undefined && typeof session.reversals !== 'boolean') fail('The reversals option must be on or off.');
  const orientations = session.deckOrientations ?? session.deck.map(() => 'upright');
  if (!Array.isArray(orientations) || orientations.length !== session.deck.length) fail('Every deck position must have one orientation.');
  orientations.forEach(value => { if (value === undefined) fail('A deck orientation is missing.'); normalizeOrientation(value); });
  if (!session.reversals && orientations.includes('reversed')) fail('This reading does not include reversed cards.');
  return orientations;
}

export function shuffleDeck(ids, randomUint32 = secureUint32) {
  const deck = validateIds(ids);
  if (typeof randomUint32 !== 'function') fail('A random source is required.');
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1, randomUint32);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function uniqueId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return Array.from({ length: 4 }, () => secureUint32().toString(16).padStart(8, '0')).join('');
}

export function createSession({ question = '', intention = 'open', reversals = false, deckId, artworkEdition, artworkVariant, origin } = {}, ids = CARD_IDS, randomUint32 = secureUint32) {
  string(question, 'Your question', 1600);
  validateIntention(intention);
  const chosenDeck = normalizeDeckId(deckId);
  const deck = shuffleDeck(ids, randomUint32);
  return Object.freeze({
    id: uniqueId(),
    createdAt: new Date().toISOString(),
    question,
    intention,
    deckId: chosenDeck,
    ...normalizeArtwork({deckId:chosenDeck,artworkEdition,artworkVariant}),
    ...normalizeOrigin(origin),
    deck: Object.freeze(deck),
    reversals,
    deckOrientations: createDeckOrientations(deck.length, reversals, randomUint32),
    selectedSlot: null,
    cardId: null,
    orientation: null,
  });
}

function validateSession(session) {
  if (!isObject(session)) fail('A reading session is required.');
  string(session.id, 'Reading identifier', 128, true);
  iso(session.createdAt, 'Reading date');
  string(session.question, 'Your question', 1600);
  validateIntention(session.intention);
  normalizeDeckId(session.deckId);
  normalizeArtwork(session);
  normalizeOrigin(session.origin);
  validateIds(session.deck);
  const orientations = deckOrientations(session);
  if (session.cardId === null && session.selectedSlot === null) {
    if (session.orientation !== undefined && session.orientation !== null) fail('Choose a card before assigning its orientation.');
    return;
  }
  if (!Number.isInteger(session.selectedSlot) || session.selectedSlot < 0 || session.selectedSlot >= session.deck.length || session.cardId !== session.deck[session.selectedSlot]) {
    fail('The selected card does not match this reading session.');
  }
  if (normalizeOrientation(session.orientation) !== orientations[session.selectedSlot]) fail('The orientation does not match the chosen card.');
}

export function chooseCard(session, slot) {
  validateSession(session);
  if (!Number.isInteger(slot) || slot < 0 || slot >= session.deck.length) fail('Choose a card position in this deck.');
  // Subsequent taps and repeated renders cannot change an already chosen card.
  if (session.cardId !== null) return session;
  return Object.freeze({ ...session, deckId: normalizeDeckId(session.deckId), selectedSlot: slot, cardId: session.deck[slot], orientation: deckOrientations(session)[slot] });
}

function validateInterpretation(value) {
  if (!isObject(value)) fail('The card interpretation is missing.');
  const result = {
    meaning: string(value.meaning, 'Card meaning', 8000, true),
    prompt: string(value.prompt, 'Reflection prompt', 2000, true),
    practice: string(value.practice, 'Suggested practice', 2000, true),
  };
  if (value.connection !== undefined) result.connection = string(value.connection, 'Connection', 2000);
  return result;
}

function validateRecord(value) {
  if (!isObject(value) || value.schemaVersion !== SCHEMA_VERSION) fail('This reading uses an unsupported format.');
  if (!validCardId(value.cardId)) fail('This reading has an invalid card number.');
  const record = {
    schemaVersion: SCHEMA_VERSION,
    id: string(value.id, 'Reading identifier', 128, true),
    createdAt: iso(value.createdAt, 'Reading date'),
    updatedAt: iso(value.updatedAt, 'Updated date'),
    question: string(value.question, 'Your question', 1600),
    intention: validateIntention(value.intention),
    deckId: normalizeDeckId(value.deckId),
    ...normalizeArtwork(value),
    ...normalizeOrigin(value.origin),
    cardId: value.cardId,
    orientation: normalizeOrientation(value.orientation),
    cardName: string(value.cardName, 'Card name', 120, true),
    interpretation: validateInterpretation(value.interpretation),
    note: string(value.note, 'Your reflection', 4000),
  };
  if (value.source !== undefined) { if(value.source !== 'physical') fail('The reading source is invalid.'); record.source = value.source; }
  if(value.firstImpressions!==undefined){try{record.firstImpressions=validateFirstImpressions(value.firstImpressions,[value.cardId]);}catch{fail('The first impressions are invalid.');}}
  if (value.guidance !== undefined) { try { record.guidance = validateGuidance(value.guidance); } catch { fail('The saved AI interpretation is invalid.'); } }
  if (record.updatedAt < record.createdAt) fail('The updated date cannot precede the reading date.');
  return record;
}

export function createRecord(session, card, interpretation, note = '') {
  validateSession(session);
  if (session.cardId === null) fail('Choose a card before saving your reading.');
  if (!isObject(card)) fail('The chosen card is missing.');
  const cardId = card.number ?? card.id;
  if (cardId !== session.cardId) fail('The card does not match the card you chose.');
  return validateRecord({
    schemaVersion: SCHEMA_VERSION,
    id: session.id,
    createdAt: session.createdAt,
    updatedAt: new Date(Math.max(Date.now(), Date.parse(session.createdAt))).toISOString(),
    question: session.question,
    intention: session.intention,
    deckId: normalizeDeckId(session.deckId),
    ...normalizeArtwork(session),
    ...normalizeOrigin(session.origin),
    cardId,
    orientation: normalizeOrientation(session.orientation),
    cardName: card.name,
    interpretation,
    note,
  });
}

function requireStorage(storage) {
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
    throw new ReadingError('STORAGE_UNAVAILABLE', 'Your browser is not allowing access to the local journal. You can still download your reading.');
  }
}

function validateRecords(records) {
  if (!Array.isArray(records)) fail('The journal must contain a list of readings.');
  if (records.length > MAX_RECORDS) fail('This journal contains too many readings.');
  const result = records.map(validateRecord);
  if (new Set(result.map(record => record.id)).size !== result.length) fail('The journal contains duplicate reading identifiers.');
  return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function loadRecords(storage) {
  requireStorage(storage);
  let raw;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch (cause) {
    throw new ReadingError('STORAGE_UNAVAILABLE', 'Your browser is not allowing access to the local journal. You can still download your reading.', cause);
  }
  if (raw === null) return [];
  try {
    const envelope = JSON.parse(raw);
    if (!isObject(envelope) || envelope.schemaVersion !== SCHEMA_VERSION) fail('The journal format is not recognised.');
    return validateRecords(envelope.records);
  } catch (cause) {
    // Never filter out invalid records and then overwrite the user's original data.
    throw new ReadingError('STORAGE_CORRUPT', 'Your existing journal could not be read. It has not been changed. Download this reading to keep a copy.', cause);
  }
}

function writeRecords(storage, records) {
  const payload = JSON.stringify({ schemaVersion: SCHEMA_VERSION, records });
  try {
    storage.setItem(STORAGE_KEY, payload);
  } catch (cause) {
    const quota = cause?.name === 'QuotaExceededError' || cause?.name === 'NS_ERROR_DOM_QUOTA_REACHED' || cause?.code === 22 || cause?.code === 1014;
    throw new ReadingError(quota ? 'STORAGE_QUOTA' : 'STORAGE_UNAVAILABLE', quota
      ? 'Your browser has no room for another saved reading. Download it, or remove an older journal entry first.'
      : 'Your browser could not save this reading. Download it to keep a copy.', cause);
  }
  return records;
}

export function saveRecord(storage, value) {
  const record = validateRecord(value);
  const records = loadRecords(storage);
  const existing = records.findIndex(entry => entry.id === record.id);
  if (existing === -1) {
    if (records.length >= MAX_RECORDS) {
      throw new ReadingError('STORAGE_LIMIT', 'Your journal holds 1,000 readings. Download your journal or remove an older entry before saving another.');
    }
    records.push(record);
  } else {
    // Editing a note must not turn one saved draw into a different card/session.
    const prior = records[existing];
    if (JSON.stringify(record.origin) !== JSON.stringify(prior.origin) || record.artworkEdition !== prior.artworkEdition || record.artworkVariant !== prior.artworkVariant || record.deckId !== prior.deckId || record.cardId !== prior.cardId || record.orientation !== prior.orientation || record.createdAt !== prior.createdAt || record.question !== prior.question || record.intention !== prior.intention || record.source !== prior.source) {
      fail('An existing reading cannot be replaced by a different draw.');
    }
    if(prior.firstImpressions||record.firstImpressions){try{record.firstImpressions=mergeFirstImpressions(prior.firstImpressions,record.firstImpressions,[record.cardId]);}catch(error){fail(error.message);}}
    records[existing] = { ...record, ...(!record.guidance && prior.guidance ? {guidance:prior.guidance} : {}) };
  }
  records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return writeRecords(storage, records);
}

export function removeRecord(storage, id) {
  string(id, 'Reading identifier', 128, true);
  const records = loadRecords(storage);
  const remaining = records.filter(record => record.id !== id);
  return remaining.length === records.length ? records : writeRecords(storage, remaining);
}

export function exportRecords(records) {
  return JSON.stringify({ schemaVersion: SCHEMA_VERSION, records: validateRecords(records) }, null, 2);
}

export function getLastRecord(records) {
  return validateRecords(records)[0] ?? null;
}
