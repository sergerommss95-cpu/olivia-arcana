/** Beta invites: only SHA-256 hashes live in configuration; codes are compared case-insensitively. */

export async function sha256Hex(text: string) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  return [...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** A short stable id for the invite (never the code itself), or null when the code is not on the list. */
export async function inviteId(code: string, hashes: string[]) {
  const clean = String(code || "").trim().toLowerCase();
  if (!clean) return null;
  const hash = await sha256Hex(clean);
  return hashes.includes(hash) ? hash.slice(0, 16) : null;
}
