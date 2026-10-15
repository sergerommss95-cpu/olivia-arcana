# Milestone 1 live evidence (deploy preview 20)

Both readings were generated on the deploy preview through the real pipeline: POST /api/portrait, background function, Claude Opus 5.5 via Netlify AI Gateway, then GET /api/portrait/:id. The people are fictional.

| File | Profile | Total | Stage A | Notes |
| --- | --- | --- | --- | --- |
| en-timed-olena-koval.json | 2000-02-01 14:30 Kyiv, "Olena Koval", EN | ~109 s | ~60 s | 58 teachings cited; V18's own reference person |
| uk-unknown-time.json | 1990-03-03, time unknown, Kyiv, "Олена Коваль" (Latin "Olena Koval"), UK | ~242 s | ~147 s | Moon, Mercury and Venus change sign that day; the text keeps them conditional |

Findings for Milestone 2:
- B and C run in parallel without seeing each other. The heart and love ledes nearly repeat.
- "probably", "may" and "likely" recur. The style lint should cap hedges.
- The Ukrainian text uses feminine forms ("самій собі") although the packet has no gender. It needs gender-neutral Ukrainian or an optional form field.
- Ukrainian stage A is slow. Tune effort or the model in the eval.
