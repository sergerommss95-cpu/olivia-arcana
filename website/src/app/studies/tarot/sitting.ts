/** State guards keep fast taps and cancelled rituals from changing a later reading. */
type Phase = "intention" | "shuffling" | "choosing" | "revealing" | "reading";
export type Intention = "clarity" | "connection" | "direction" | "change";
export type State = { phase: Phase; seed: number; count: 1 | 3; intention: Intention; question: string; selected: number[]; revealed: number[] };
export type Action = { type: "count"; count: 1 | 3 } | { type: "intention"; intention: Intention } | { type: "question"; question: string } | { type: "begin"; seed: number } | { type: "ready"; seed: number } | { type: "select"; index: number } | { type: "reveal"; index: number } | { type: "reset" };
export const INITIAL: State = { phase: "intention", seed: 0, count: 3, intention: "clarity", question: "", selected: [], revealed: [] };
export function reducer(state: State, action: Action): State {
  if (action.type === "reset") return { ...INITIAL, count: state.count, intention: state.intention };
  if (action.type === "count") return state.phase === "intention" ? { ...state, count: action.count } : state;
  if (action.type === "intention") return state.phase === "intention" ? { ...state, intention: action.intention } : state;
  if (action.type === "question") return state.phase === "intention" ? { ...state, question: action.question } : state;
  if (action.type === "begin") return state.phase === "intention" ? { ...state, seed: action.seed, phase: "shuffling" } : state;
  if (action.type === "ready") return state.phase === "shuffling" && state.seed === action.seed ? { ...state, phase: "choosing" } : state;
  if (action.type === "select") {
    if (state.phase !== "choosing" || state.selected.includes(action.index) || !Number.isInteger(action.index) || action.index < 0 || action.index >= 78) return state;
    const selected = [...state.selected, action.index];
    return { ...state, selected, phase: selected.length === state.count ? "revealing" : "choosing" };
  }
  if (action.type === "reveal") {
    if (state.phase !== "revealing" || !state.selected.includes(action.index) || state.revealed.includes(action.index)) return state;
    const revealed = [...state.revealed, action.index];
    return { ...state, revealed, phase: revealed.length === state.count ? "reading" : "revealing" };
  }
  return state;
}
