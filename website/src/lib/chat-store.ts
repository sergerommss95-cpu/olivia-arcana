/**
 * chat-store.ts — localStorage persistence for Olivia chat history
 *
 * Stores conversation messages (max 50) across sessions.
 * Simple key-value with JSON serialization.
 */

export interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const STORAGE_KEY = "olivia-arcana-chat";
const MAX_MESSAGES = 50;

/** Load chat history from localStorage */
export function loadChat(): StoredMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredMessage[];
  } catch {
    return [];
  }
}

/** Save chat history to localStorage (truncates to MAX_MESSAGES) */
export function saveChat(messages: StoredMessage[]): void {
  try {
    const truncated = messages.slice(-MAX_MESSAGES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(truncated));
  } catch {
    // localStorage might be full or unavailable
  }
}

/** Clear chat history */
export function clearChat(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
