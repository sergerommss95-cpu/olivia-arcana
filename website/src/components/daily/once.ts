/**
 * Once-per-tab flags for entry choreography (e.g. `olivia:daily-arrived:<date>:<sign>`). The module Set
 * survives the ClientShell remount within one page view; sessionStorage carries the flag across reloads in
 * the same tab. Write the flag on the final animationend, so an interrupted entry simply replays.
 */

const played = new Set<string>();

/** Tab storage, or null on the server and wherever reading it throws (blocked site data). */
function tabStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function hasPlayed(key: string): boolean {
  if (played.has(key)) return true;
  try {
    if (tabStorage()?.getItem(key) === "1") {
      played.add(key);
      return true;
    }
  } catch {
    /* Unreadable storage: this page view's Set is the record. */
  }
  return false;
}

export function markPlayed(key: string): void {
  played.add(key);
  try {
    tabStorage()?.setItem(key, "1");
  } catch {
    /* Quota or blocked storage: the Set still prevents a replay in this page view. */
  }
}
