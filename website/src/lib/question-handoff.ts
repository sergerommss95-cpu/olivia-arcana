/** A short-lived draft stays in this tab, never in a URL or an AI request. */
export const QUESTION_HANDOFF_KEY = 'olivia-question-handoff-v1';
const MAX_AGE = 30 * 60 * 1000;
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

export function writeQuestionHandoff(storage: HandoffStorage, question: string, now = Date.now()): void {
  if (typeof question !== 'string' || question.length > 1600 || !Number.isFinite(now)) {
    throw new Error('Invalid question handoff');
  }
  if (!question.trim()) {
    clearQuestionHandoff(storage);
    return;
  }
  storage.setItem(QUESTION_HANDOFF_KEY, JSON.stringify({ schemaVersion: 1, question, createdAt: now }));
}

export function clearQuestionHandoff(storage: HandoffStorage): void {
  storage.removeItem(QUESTION_HANDOFF_KEY);
}
