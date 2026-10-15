// Makes a beta invite: prints the code to share and the hash to add to PORTRAIT_INVITE_HASHES.
// Usage: node scripts/portrait-invite.mjs [label]
import { randomInt, createHash } from "node:crypto";
const WORDS = ["moon", "star", "lamp", "olive", "tide", "quill", "lapis", "gilt", "dawn", "veil", "orbit", "leaf"];
const label = (process.argv[2] || WORDS[randomInt(WORDS.length)]).toLowerCase().replace(/[^a-z]/g, "");
const code = `olv-${label}-${String(randomInt(10_000)).padStart(4, "0")}`;
console.log(`code: ${code}`);
console.log(`hash: ${createHash("sha256").update(code).digest("hex")}`);
console.log(`link: https://oliviaarcana.com/portrait/#invite=${code}`);
