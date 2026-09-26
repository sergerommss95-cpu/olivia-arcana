/** AI responses are never replaced by pre-written copy when the service fails. */
export interface ChatMessage { role: 'user' | 'assistant'; content: string }
export class ChatError extends Error {
  status: number;
  code: string;
  constructor(message: string, status: number, code = 'request_failed') {
    super(message); this.name = 'ChatError'; this.status = status; this.code = code;
  }
}
export async function* streamChat(messages: ChatMessage[], locale: 'en' | 'uk', signal?: AbortSignal): AsyncGenerator<string> {
  const response = await fetch('/api/chat', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, locale }), signal,
  });
  let result;
  try { result = await response.json(); } catch { throw new ChatError('The interpretation service is unavailable. Please try again later.', response.status || 502); }
  if (!response.ok) throw new ChatError(result.error || 'The interpretation service is unavailable.', response.status, result.code);
  if (result.source !== 'ai' || typeof result.text !== 'string' || !result.text.trim()) throw new ChatError('No complete response was returned. Please try again.', 502);
  yield result.text;
}
export async function questionServiceAvailable(signal?: AbortSignal): Promise<boolean> {
  const response = await fetch('/api/chat', { signal, cache: 'no-store' });
  if (!response.ok) return false;
  const result = await response.json();
  return result.available === true;
}
