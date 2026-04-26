/**
 * journal-store.ts — Cosmic journal persistence layer
 *
 * Stores journal entries in localStorage with moon phase context.
 * Provides CRUD, streak tracking, and JSON export.
 */

import { getMoonPhase } from "./celestial";

// ── Types ──

export interface JournalEntry {
  id: string;
  date: string;       // YYYY-MM-DD
  text: string;
  moonPhase: string;
  moonEmoji: string;
  prompt: string;
  createdAt: number;
}

const STORAGE_KEY = "olivia-arcana-journal";

// ── Helpers ──

function generateId(): string {
  return `j_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadAll(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as JournalEntry[];
  } catch {
    return [];
  }
}

function persist(entries: JournalEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {}
}

// ── Public API ──

/** Save or update an entry for a given date */
export function saveEntry(date: string, text: string, prompt: string): JournalEntry {
  const entries = loadAll();
  const existing = entries.find(e => e.date === date);

  // Get moon phase for the entry date
  const [y, m, d] = date.split("-").map(Number);
  const entryDate = new Date(y, m - 1, d, 12, 0);
  const phase = getMoonPhase(entryDate);

  if (existing) {
    existing.text = text;
    existing.prompt = prompt;
    existing.moonPhase = phase.phase;
    existing.moonEmoji = phase.emoji;
    persist(entries);
    return existing;
  }

  const entry: JournalEntry = {
    id: generateId(),
    date,
    text,
    moonPhase: phase.phase,
    moonEmoji: phase.emoji,
    prompt,
    createdAt: Date.now(),
  };
  entries.push(entry);
  persist(entries);
  return entry;
}

/** Load entry for a specific date (null if none) */
export function loadEntry(date: string): JournalEntry | null {
  const entries = loadAll();
  return entries.find(e => e.date === date) || null;
}

/** Load all entries, sorted newest first */
export function loadAllEntries(): JournalEntry[] {
  return loadAll().sort((a, b) => b.date.localeCompare(a.date));
}

/** Delete an entry by ID */
export function deleteEntry(id: string): void {
  const entries = loadAll().filter(e => e.id !== id);
  persist(entries);
}

/** Get current writing streak in days */
export function getStreak(): number {
  const entries = loadAll();
  if (entries.length === 0) return 0;

  const dates = new Set(entries.map(e => e.date));
  const today = new Date();
  let streak = 0;
  const current = new Date(today);

  // Check today first
  const todayStr = formatDate(current);
  if (!dates.has(todayStr)) {
    // Check yesterday — streak might still be alive
    current.setDate(current.getDate() - 1);
    if (!dates.has(formatDate(current))) return 0;
  }

  // Count consecutive days backwards
  while (dates.has(formatDate(current))) {
    streak++;
    current.setDate(current.getDate() - 1);
  }

  return streak;
}

/** Get total entry count */
export function getEntryCount(): number {
  return loadAll().length;
}

/** Export all entries as JSON string */
export function exportJSON(): string {
  return JSON.stringify(loadAllEntries(), null, 2);
}

/** Get set of dates that have entries (for calendar highlighting) */
export function getEntryDates(): Set<string> {
  return new Set(loadAll().map(e => e.date));
}

// ── Date formatting ──

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function todayString(): string {
  return formatDate(new Date());
}
