/** A short-lived draft stays in this tab, never in a URL or an AI request. */
export const QUESTION_HANDOFF_KEY = 'olivia-question-handoff-v1';
const MAX_AGE = 30 * 60 * 1000;
export type ReflectionOrigin = { practice: 'astrology'; cardId: number; role: string };

export function normalizeReflectionOrigin(value: unknown): ReflectionOrigin | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  if (source.practice !== 'astrology' || !Number.isInteger(source.cardId) || Number(source.cardId) < 0 || Number(source.cardId) > 21
    || typeof source.role !== 'string' || !source.role.trim() || source.role.length > 120) return null;
  // Explicit allowlist: birth data, placements and unrelated payloads never cross.
  return { practice: 'astrology', cardId: Number(source.cardId), role: source.role.trim() };
}

type HandoffStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function readQuestionHandoff(storage: HandoffStorage, now = Date.now()): string | null {
  try {
    const raw = storage.getItem(QUESTION_HANDOFF_KEY);
    if (raw === null) return null;
    const value = JSON.parse(raw);
    if (value?.schemaVersion === 1 && typeof value.question === 'string'
      && value.question.trim() && value.question.length <= 1600
      && Number.isFinite(value.createdAt) && value.createdAt <= now
      && now - value.createdAt <= MAX_AGE) {
      // Reading is intentionally idempotent: the entrance transition may
      // remount Ask, and leaving the native renderer may reload the document.
      // Neither event is the user's acknowledgement of the carried question.
      return value.question;
    }
    storage.removeItem(QUESTION_HANDOFF_KEY);
  } catch {
    try { storage.removeItem(QUESTION_HANDOFF_KEY); } catch { /* Storage may be blocked. */ }
  }
  return null;
}

export function readQuestionHandoffOrigin(storage: HandoffStorage, now = Date.now()): ReflectionOrigin | null {
  if (readQuestionHandoff(storage, now) === null) return null;
  try { return normalizeReflectionOrigin(JSON.parse(storage.getItem(QUESTION_HANDOFF_KEY) || 'null')?.origin); }
  catch { return null; }
}

export function writeQuestionHandoff(storage: HandoffStorage, question: string, now = Date.now(), origin?: ReflectionOrigin | null): void {
  if (typeof question !== 'string' || question.length > 1600 || !Number.isFinite(now)) {
    throw new Error('Invalid question handoff');
  }
  if (!question.trim()) {
    clearQuestionHandoff(storage);
    return;
  }
  const safeOrigin = origin === undefined ? readQuestionHandoffOrigin(storage, now) : normalizeReflectionOrigin(origin);
  storage.setItem(QUESTION_HANDOFF_KEY, JSON.stringify({ schemaVersion: 1, question, createdAt: now, ...(safeOrigin ? { origin: safeOrigin } : {}) }));
}

export function clearQuestionHandoff(storage: HandoffStorage): void {
  storage.removeItem(QUESTION_HANDOFF_KEY);
}
