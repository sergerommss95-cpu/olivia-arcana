export const SPREAD_STORAGE_KEY = "olivia-arcana-spreads-v1";
export const SPREAD_STORAGE_UNAVAILABLE = "@storage-unavailable";

export type SavedSpread = {
  schemaVersion: 1;
  id: string;
  createdAt: string;
  updatedAt: string;
  question: string;
  intention: string;
  spreadId: "clarity3" | "crossroads5" | "compass8";
  spreadName: string;
  cardIds: number[];
  revealedCount: number;
  cards: { cardId: number; positionId: string; label: string; meaning: string; prompt: string; practice: string }[];
  synthesis: { paragraphs: string[]; prompt: string };
  note: string;
};

type Snapshot = { status: "loading" | "ready" | "unavailable" | "malformed"; records: SavedSpread[]; skipped: boolean };
const counts = { clarity3: 3, crossroads5: 5, compass8: 8 };
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const isText = (value: unknown, limit: number, required = false): value is string => typeof value === "string" && value.length <= limit && (!required || !!value.trim());
const isCardId = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 21;
function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
}

function isRecord(value: unknown): value is SavedSpread {
  if (!isObject(value) || value.schemaVersion !== 1 || !isText(value.id, 128, true) ||
      !isDate(value.createdAt) || !isDate(value.updatedAt) || value.updatedAt < value.createdAt ||
      !isText(value.question, 500) || !isText(value.note, 4000) || !isText(value.spreadName, 160, true) ||
      !["open", "relationships", "work", "change"].includes(value.intention as string) ||
      !Object.hasOwn(counts, value.spreadId as string)) return false;
  const count = counts[value.spreadId as keyof typeof counts];
  if (!Array.isArray(value.cardIds) || value.cardIds.length !== count || !value.cardIds.every(isCardId) ||
      new Set(value.cardIds).size !== count || value.revealedCount !== count ||
      !Array.isArray(value.cards) || value.cards.length !== count) return false;
  const ids = value.cardIds;
  const cardsValid = value.cards.every((card, i) => isObject(card) && card.cardId === ids[i] &&
    isText(card.positionId, 80, true) && isText(card.label, 160, true) &&
    isText(card.meaning, 8000, true) && isText(card.prompt, 2000, true) && isText(card.practice, 2000, true));
  if (!cardsValid || new Set(value.cards.map(card => card.positionId)).size !== count) return false;
  const synthesis = value.synthesis;
  return isObject(synthesis) && Array.isArray(synthesis.paragraphs) && synthesis.paragraphs.length >= 1 &&
    synthesis.paragraphs.length <= 12 && synthesis.paragraphs.every(p => isText(p, 8000, true)) && isText(synthesis.prompt, 2000, true);
}

/** Read-only: malformed entries are never written back or silently removed. */
export function parseSavedSpreads(raw: string | null): Snapshot {
  if (raw === null) return { status: "loading", records: [], skipped: false };
  if (raw === SPREAD_STORAGE_UNAVAILABLE) return { status: "unavailable", records: [], skipped: false };
  if (!raw) return { status: "ready", records: [], skipped: false };
  try {
    const envelope: unknown = JSON.parse(raw);
    if (!isObject(envelope) || envelope.schemaVersion !== 1 || !Array.isArray(envelope.records) || envelope.records.length > 100) {
      return { status: "malformed", records: [], skipped: false };
    }
    const ids = new Set<string>();
    let skipped = false;
    const records = envelope.records.filter((record): record is SavedSpread => {
      if (!isRecord(record) || ids.has(record.id)) { skipped = true; return false; }
      ids.add(record.id);
      return true;
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { status: "ready", records, skipped };
  } catch {
    return { status: "malformed", records: [], skipped: false };
  }
}
