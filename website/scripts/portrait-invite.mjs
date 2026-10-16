// Makes a beta invite: prints the code to share and the hash to add to PORTRAIT_INVITE_HASHES.
// Usage: node scripts/portrait-invite.mjs [label]
import { randomInt, createHash } from "node:crypto";
const WORDS = ["moon", "star", "lamp", "olive", "tide", "quill", "lapis", "gilt", "dawn", "veil", "orbit", "leaf"];
// No look-alike characters (i, l, o, 0, 1); 10 characters from 31 is about 49 bits.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const label = (process.argv[2] || WORDS[randomInt(WORDS.length)]).toLowerCase().replace(/[^a-z]/g, "");
const suffix = Array.from({ length: 10 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
const code = `olv-${label}-${suffix}`;
console.log(`code: ${code}`);
console.log(`hash: ${createHash("sha256").update(code).digest("hex")}`);
console.log(`link: https://oliviaarcana.com/portrait/#invite=${code}`);
