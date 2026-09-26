export type QuestionReadingRequest = {
  question: string;
  locale: 'en' | 'uk';
  spreadId: 'single' | 'clarity3' | 'crossroads5' | 'compass8';
  cards: { id: number; orientation: 'upright' | 'reversed' }[];
};
export type QuestionReadingResult = { synthesis: string; source: 'ai'; locale: 'en' | 'uk'; cardIds: number[] };
/** Call only after the reader explicitly chooses AI interpretation and sees its data disclosure. */
export async function interpretQuestion(input: QuestionReadingRequest, signal?: AbortSignal): Promise<QuestionReadingResult> {
  const response = await fetch('/api/reading', { method: 'POST', signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result || result.source !== 'ai' || typeof result.synthesis !== 'string' || !result.synthesis.trim()) {
    throw new Error(result?.error || 'Question-aware interpretation is unavailable. Your cards and notes are still here.');
  }
  return result as QuestionReadingResult;
}
