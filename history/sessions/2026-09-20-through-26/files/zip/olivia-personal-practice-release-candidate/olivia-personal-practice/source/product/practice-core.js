/**
 * Device-local practice data, separate from both existing reading journals.
 * Every API accepts a Storage-like object; this module never reads globals,
 * fetches data, changes a journal, or discards an invalid stored envelope.
 */
import { ReadingError, getLastRecord } from './core.js';

export const PRACTICE_SCHEMA_VERSION = 1;
export const METADATA_KEY = 'olivia-arcana-practice-metadata-v1';
export const DAILY_KEY = 'olivia-arcana-daily-reading-v1';
export const DRAFT_KEY = 'olivia-arcana-current-reading-v1';

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const fail = message => { throw new ReadingError('VALIDATION', message); };
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

function text(value, label, limit, required = false) {
  if (typeof value !== 'string' || value.length > limit || (required && !value.trim())) {
    fail(`${label} must be ${required ? 'non-empty text' : 'text'} of at most ${limit} characters.`);
  }
  return value;
}

/** Validate calendar dates without parsing YYYY-MM-DD as UTC or rolling invalid dates. */
function calendarDate(value, allowEmpty = false) {
  if (allowEmpty && value === '') return value;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) fail('Use a calendar date in YYYY-MM-DD format.');
  const [year, month, day] = value.split('-').map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1]) fail('This calendar date does not exist.');
  return value;
}

/** Today's date in the visitor's local calendar; never derived from toISOString(). */
export function localDate(date = new Date()) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) fail('A valid date is required.');
  return calendarDate(`${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
}

function timestamp(value) {
  if (value === null) return null;
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)) fail('The review time must be an ISO timestamp or null.');
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== value) fail('The review time is invalid.');
  return value;
}

function identity(kind, id) {
  if (!['single', 'spread'].includes(kind)) fail('Choose a single reading or a spread.');
  text(id, 'Reading identifier', 128, true);
  return { id, kind };
}

function emptyMetadata(kind, id) {
  return { ...identity(kind, id), topic: '', nextStep: '', revisitDate: '', outcome: '', reviewedAt: null };
}

function metadata(value) {
  if (!object(value)) fail('Practice details must be an object.');
  return {
    ...identity(value.kind, value.id),
    topic: text(value.topic, 'Topic', 80).trim(),
    nextStep: text(value.nextStep, 'Next step', 400),
    revisitDate: calendarDate(value.revisitDate, true),
    outcome: text(value.outcome, 'What happened', 2000),
    reviewedAt: timestamp(value.reviewedAt),
  };
}

function metadataList(values) {
  if (!Array.isArray(values)) fail('Practice details must be a list.');
  const entries = values.map(metadata), seen = new Set();
  for (const entry of entries) {
    const key = JSON.stringify([entry.kind, entry.id]);
    if (seen.has(key)) fail('Practice details contain a duplicate reading.');
    seen.add(key);
  }
  return entries;
}

function singleRecord(value) {
  // The public helper delegates to core's validateRecords/validateRecord,
  // keeping one source of truth for the complete single-reading schema.
  return getLastRecord([value]);
}

function dailyList(values) {
  if (!Array.isArray(values)) fail('Daily readings must be a list.');
  const entries = values.map(value => {
    if (!object(value)) fail('A daily reading is invalid.');
    return { date: calendarDate(value.date), record: singleRecord(value.record) };
  });
  if (new Set(entries.map(entry => entry.date)).size !== entries.length) fail('A calendar day contains more than one daily reading.');
  return entries.sort((a, b) => a.date.localeCompare(b.date));
}

function requireStorage(storage) {
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
    throw new ReadingError('STORAGE_UNAVAILABLE', 'This browser is not allowing access to your saved practice.');
  }
}

function read(storage, key, field, validate, empty) {
  requireStorage(storage);
  let raw;
  try { raw = storage.getItem(key); }
  catch (cause) { throw new ReadingError('STORAGE_UNAVAILABLE', 'This browser could not open your saved practice.', cause); }
  if (raw === null) return empty;
  try {
    const envelope = JSON.parse(raw);
    if (!object(envelope) || envelope.schemaVersion !== PRACTICE_SCHEMA_VERSION || !own(envelope, field)) fail('The saved practice format is not recognised.');
    return validate(envelope[field]);
  } catch (cause) {
    throw new ReadingError('STORAGE_CORRUPT', 'Your saved practice could not be read. The original data has not been changed.', cause);
  }
}

function write(storage, key, field, value) {
  try { storage.setItem(key, JSON.stringify({ schemaVersion: PRACTICE_SCHEMA_VERSION, [field]: value })); }
  catch (cause) {
    const quota = cause?.name === 'QuotaExceededError' || cause?.name === 'NS_ERROR_DOM_QUOTA_REACHED' || cause?.code === 22 || cause?.code === 1014;
    throw new ReadingError(quota ? 'STORAGE_QUOTA' : 'STORAGE_UNAVAILABLE', quota
      ? 'This browser has no room for your practice. Download a copy of your reading.'
      : 'This browser could not save your practice. Download a copy of your reading.', cause);
  }
  return value;
}

/** Return all single/spread metadata. A malformed entry rejects the entire envelope. */
export function loadMetadata(storage) {
  return read(storage, METADATA_KEY, 'entries', metadataList, []);
}

/** Read an entry from loaded metadata; a missing entry gets complete empty fields. */
export function getMetadata(entries, kind, id) {
  const fallback = emptyMetadata(kind, id);
  return metadataList(entries).find(entry => entry.kind === kind && entry.id === id) ?? fallback;
}

/** Upsert fields for one existing reading ID; omitted fields retain their prior value. */
export function saveMetadata(storage, value) {
  if (!object(value)) fail('Practice details must be an object.');
  const { kind, id } = identity(value.kind, value.id);
  const entries = loadMetadata(storage);
  const entry = metadata({ ...getMetadata(entries, kind, id), ...value });
  const index = entries.findIndex(item => item.kind === kind && item.id === id);
  if (index === -1) entries.push(entry); else entries[index] = entry;
  write(storage, METADATA_KEY, 'entries', entries);
  return entry;
}

/** Remove only one reading's follow-up metadata; return it so callers can undo. */
export function removeMetadata(storage, kind, id) {
  identity(kind, id);
  const entries = loadMetadata(storage);
  const index = entries.findIndex(entry => entry.kind === kind && entry.id === id);
  if (index === -1) return null;
  const [removed] = entries.splice(index, 1);
  write(storage, METADATA_KEY, 'entries', entries);
  return removed;
}

/** Pending revisits, sorted by local calendar date. Reviewed/unscheduled entries stay stored. */
export function listRevisits(entries, today = localDate()) {
  calendarDate(today);
  const pending = metadataList(entries).filter(entry => entry.revisitDate && entry.reviewedAt === null)
    .sort((a, b) => a.revisitDate.localeCompare(b.revisitDate) || a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id));
  return { due: pending.filter(entry => entry.revisitDate <= today), upcoming: pending.filter(entry => entry.revisitDate > today) };
}

/** User-authored topics only, deduplicated case-insensitively for journal filtering. */
export function deriveTopics(entries) {
  const topics = new Map();
  for (const entry of metadataList(entries)) if (entry.topic) {
    const key = entry.topic.toLowerCase();
    if (!topics.has(key)) topics.set(key, entry.topic);
  }
  return [...topics.values()].sort((a, b) => a.localeCompare(b));
}

/** Return the card already held for a local calendar day, or null. */
export function loadDaily(storage, date = localDate()) {
  calendarDate(date);
  const entries = read(storage, DAILY_KEY, 'days', dailyList, []);
  return entries.find(entry => entry.date === date)?.record ?? null;
}

/** First valid draw wins per day. Repeated calls return it without changing stored data. */
export function saveDaily(storage, value, date = localDate()) {
  calendarDate(date);
  const record = singleRecord(value), entries = read(storage, DAILY_KEY, 'days', dailyList, []);
  const held = entries.find(entry => entry.date === date);
  if (held) return held.record;
  entries.push({ date, record });
  write(storage, DAILY_KEY, 'days', dailyList(entries));
  return record;
}

/** Current single-reading draft, held independently of the saved journal. */
export function loadDraft(storage) {
  return read(storage, DRAFT_KEY, 'record', value => value === null ? null : singleRecord(value), null);
}

/** Save/replace the current draft; edits to one reading may not change its chosen card. */
export function saveDraft(storage, value) {
  const record = singleRecord(value), previous = loadDraft(storage);
  if (previous?.id === record.id && ['cardId', 'orientation', 'createdAt', 'question', 'intention'].some(key => previous[key] !== record[key])) {
    fail('An existing draft cannot be replaced by a different draw.');
  }
  return write(storage, DRAFT_KEY, 'record', record);
}

/** Clear only the current draft; optional ID prevents a stale view from clearing a newer one. */
export function clearDraft(storage, id) {
  if (id !== undefined) text(id, 'Reading identifier', 128, true);
  const previous = loadDraft(storage);
  if (!previous || (id !== undefined && previous.id !== id)) return previous;
  return write(storage, DRAFT_KEY, 'record', null);
}
