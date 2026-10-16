# Blind judge: m1-baseline vs m2-medium

Judge claude-opus-5-5 (effort high), harness 87c5146. Every profile was judged twice, once with m1-baseline as Reading A (order 1) and once with m2-medium as Reading A (order 2); the judge never saw the variant names. A profile goes to a variant only if both orders pick it; if the orders disagree or either is a tie, it is a tie. Scores run 1 to 5, higher is better, and are the mean of the two orders.

Judged 2 profiles; the two orders agreed on 2 of 2.

## Winners

| m1-baseline | m2-medium | Tie |
| --- | --- | --- |
| 0 | 2 | 0 |

## Mean scores

| Criterion | m1-baseline | m2-medium |
| --- | --- | --- |
| recognisability | 2.5 | 5.0 |
| specificity | 3.0 | 4.0 |
| distinctness | 2.0 | 4.0 |
| warmth | 3.5 | 4.3 |
| plainLanguage | 2.3 | 4.3 |
| ukrainianNaturalness (UK only) | 2.5 | 4.0 |

## By profile

Scores read `m1-baseline – m2-medium`. Picks are the order 1 and order 2 results.

| Profile | Locale | Winner | Picks | recognisability | specificity | distinctness | warmth | plainLanguage | ukrainianNaturalness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| m1-en-olena | en | m2-medium | m2-medium / m2-medium | 3 – 5 | 3 – 4 | 2 – 4 | 4 – 4 | 2.5 – 4.5 | – |
| m1-uk-olena | uk | m2-medium | m2-medium / m2-medium | 2 – 5 | 3 – 4 | 2 – 4 | 3 – 4.5 | 2 – 4 | 2.5 – 4 |

## Run metrics

Means over the judged profiles. Repairs: stages that needed a second attempt. Lint and residue: sums over the stored readings; residue is every code today's validator still reports on them, so for an imported baseline it also holds what the old format lacks (no outline, for instance). n/a: not recorded (an imported baseline has no timings or costs).

| Variant | Readings | Seconds | Cost (cents) | Words | Repairs | hedge-lead | hedges | phrase | gender | repeat | Residue codes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| m1-baseline | 2 | n/a | n/a | 2412 | n/a | 28 | 5 | 0 | 1 | 12 | 48 |
| m2-medium | 2 | 425.8 | 56.5 | 2408 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |

## Reasons

- **m1-en-olena** (winner: m2-medium):
  - Order 1 (A = m1-baseline, B = m2-medium; pick: m2-medium): **m2-medium** grounds its claims in concrete, confirmable scenes: stacking chairs, holding the hall keys, the midnight draft message, the course outline with empty headings, who takes the bins out. **m1-baseline** stays abstract ("the wide idea," "authorship"), hedges constantly with "probably," "may" and "likely," and repeats its bolded opening lines verbatim. It also recycles phrases like "author of your own life," "finish line" and "exits" across sections. B has some overlap of its own, but less, and its tone is warm and plain without pep talk.
  - Order 2 (A = m2-medium, B = m1-baseline; pick: m2-medium): **m2-medium** is built from concrete, checkable scenes: the midnight draft message, the course outline with nine empty headings, stacking chairs, the bins nobody mentions. These make it easy to recognise and specific to this person. **m1-baseline** leans on trait labels and hedges ("probably", "may", "likely"). It repeats each chapter's bold opening line word for word as its first sentence, and two love chapters overlap heavily. A has a few repeated motifs (finish lines, the pull between freedom and structure) but less than B, and its plainer, more concrete warmth makes it the more trustworthy reading.
- **m1-uk-olena** (winner: m2-medium):
  - Order 1 (A = m1-baseline, B = m2-medium; pick: m2-medium): **m2-medium** grounds each trait in scenes a person could check: the blanket, the marker passed at a meeting, ten open tabs, the refused help with a bag, the document open at 23:30, the shelf of half-finished projects. **m1-baseline** stays abstract and hedges constantly with «мабуть», «ймовірно», «можливо». Several of its chapters repeat their opening line word for word and its two love chapters overlap. It also assumes a female reader («самій собі», «господинею», «бажаною»). **m2-medium** has slips («Козорозі», «я скучили», a stray accent), but it is clearly stronger.
  - Order 2 (A = m2-medium, B = m1-baseline; pick: m2-medium): **m2-medium** is built on concrete, checkable scenes: the blanket, the marker passed at a meeting, the unbought ticket, glasses put away at night, the 11:30 document, the umbrella on the platform. Its claims are stated plainly. **m1-baseline** hedges almost every sentence with «мабуть», «ймовірно» and «можливо», and repeats its bold lines word for word. It assumes the reader is a woman («самій собі», «бажаною», «господинею») and keeps restating its Venus and Moon passages. **m2-medium** has small slips («Козорозі», the stray accent, «я скучили») but reads better overall.
