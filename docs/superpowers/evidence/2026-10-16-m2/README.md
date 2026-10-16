# Milestone 2 evidence: the writing eval

Readings were written by `claude-opus-5-5` (effort medium) through the Netlify AI Gateway, using `scripts/portrait-eval.mjs`. Every person in these profiles is fictional.

## Blind judge: M1 baseline vs M2

`judge-m1-vs-m2.md` holds the full report. M1 has only two readings, so only those two profiles were compared. Each was judged in both orders, and the judge never saw which variant was which.

| | M1 baseline | M2 medium |
| --- | --- | --- |
| Profiles won | 0 | 2 (both orders agreed) |
| Recognisability | 2.5 | 5.0 |
| Specificity | 3.0 | 4.0 |
| Distinctness | 2.0 | 4.0 |
| Warmth | 3.5 | 4.3 |
| Plain language | 2.3 | 4.3 |
| Ukrainian naturalness | 2.5 | 4.0 |
| Style-lint hits (2 readings) | 46 | 0 |

## M2 robustness: 6 profiles

The profiles cover English and Ukrainian, birth time known and unknown, and a master number (Tom).

| Profile | Result | Words | Cost | Attempts a/b/c* | Residue |
| --- | --- | --- | --- | --- | --- |
| m1-en-olena | done | 2623 | 57c | 1/1/1 | 0 |
| m1-uk-olena (unknown time) | done | 2192 | 56c | 1/1/3 | 0 |
| en-timed-tom | done | 2770 | 63c | 1/1/1 | 0 |
| en-unknown-aidan | done | 2530 | 83c | 3/3/4 | 0 |
| uk-timed-taras | done | 2310 | 71c | 1/1/1 | 0 |
| uk-unknown-kateryna | done | 2004 | 70c | 1/1/2 | 2 (two paragraphs 174 and 195 chars, min 200) |

\* Attempts include connection failures that cost nothing.

Mean cost is 67c per reading. A clean run takes 85–200 s; the longer `ms` values are network stalls. `en-timed-priya` and `uk-timed-solomiia` were skipped to stay inside the $10 budget.

## What the eval found and fixed

- **Validator false positive (1492f63).** It rejected Ukrainian Capricorn spelled «Козоріг/Козорозі». The knowledge bank uses that spelling, so correct UK unknown-time readings were being refused.
- **Contradictory prompt rules (0e2e1c9, 4d4968c).** One rule kept planet names out of the prose while another required naming every alternative sign.
  - Repair prompts now explain each failed check.
  - Each task lists this reading's uncertain factors and their signs.
- **Stage C never saw the chapter form (f6b7926).** It said "in the same form", but the form lived only in stage B's task.
- **UK slips the judge caught (ea39ed6).** «я скучили» (plural verb after «я») and a stray stress mark. A lint now flags «я» with a past-tense verb, which caught «я вже вирішили» in Kateryna's stage C. Stress marks are stripped before validation.
- **Empty answer (90cb74f).** A schema-valid reply with every field empty now gets a one-line repair, "empty", instead of twenty codes.
- **Near-miss lengths (2f616d0).** After a real repair, a length close to its range is kept as residue rather than failing a paid reading.
- **Eval harness (f60968c, ac7b807).**
  - Validation codes now appear in the log.
  - Paid calls are cached and replayed, so a reading broken off by a lost connection is not paid for twice.
  - The harness waits for the gateway host after a connection failure.

## Network note

From the owner's Mac, Netlify's edge IPs throttle TLS after minutes of sustained gateway streaming; each IP recovers after about 3–20 minutes. Local runs used a process-local DNS pin that rotates between edge IPs (in the session scratchpad, not the repo). This affects only local eval runs: in production the background function calls the gateway from inside Netlify.
