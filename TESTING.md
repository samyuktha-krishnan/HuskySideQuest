# Testing notes

The question neither of us could answer alone: *are these recommendations actually achievable?*

A knew what each quest needs. B knew what the filters could ask for. Neither half can check the promise on its own, so we wrote `test/recommend.test.js` together — it walks all **1,760** filter combinations (4 gaps × 4 budgets × 5 moods × 11 start points × rain on/off) and asserts on every single result that comes back.

```
npm test                      →  30 tests, ~90,000 assertions, about a second
python test/browser_check.py  →  36 checks against the built page
```

Three rounds, three real bugs.

---

## Round 1 — 160 combinations returned an empty page

The sweep found that 9% of the filter space produced nothing at all. Almost all of it clustered in one place: **30 minutes with no money**, and worse in the rain.

Two separate causes, one in each of our halves:

- **Dataset hole.** There was nothing free, indoor and short near south campus or Husky Stadium. If you got out of a Health Sciences lecture with half an hour in the rain, the app had no answer.
- **Activity minimums set too high.** Odegaard was `act: [40, 110]`. Forty minutes is a study session; twenty-two is "sit down, do one reading." The minimum wasn't the shortest sensible visit, it was the visit A had in mind while typing.

**Fixed by** adding 11 quests (44 → 55), including the Health Sciences Library, the glass wall inside UW station, Denny Hall and the Gould Hall atrium, and retuning the ranges. Dead combinations: 160 → 0.

The dataset test now has an assertion that keeps us honest about it:

```js
assert.ok(free.length  >= 20);   // free options
assert.ok(quick.length >= 15);   // doable in 20 minutes
assert.ok(dry.length   >= 25);   // indoor options
```

---

## Round 2 — "give me another" gave you the same one

B noticed it by hand before the test caught it: at 120 minutes on a social mood, reroll returned Archie McPhee ten times running. One quest was simply winning by too many points for the random jitter to displace it.

The instinct was to turn up the randomness. We measured it instead, across a grid of weights:

| mood weight | jitter | on-mood top picks | distinct picks in 6 rerolls |
|---|---|---|---|
| 36 | 18 | 65.5% | 2.85 |
| 42 | 18 | 70.6% | 2.65 |
| 42 | 10 | 73.6% | 1.75 |
| 48 | 6 | 74.3% | 1.45 |

Every setting that bought variety cost mood accuracy. So the jitter was the wrong lever — **see DECISIONS.md #5**. Rerolling now excludes what you've already been shown, which gets six different quests in six presses without touching the ranking. Weights settled at 42/22/12.

---

## Round 3 — a bug that wasn't there

That table shows on-mood accuracy topping out around 74%, and we spent most of an evening trying to push it higher. It wouldn't move.

It wasn't a ranking bug. For **452 of the 1,760 combinations there is no on-mood quest that can fit at all** — there is no free food anywhere in the dataset, and nothing outdoors survives the rain filter. The ranking was being blamed for a hole in the dataset.

Measured conditionally, the answer is different:

```
combos where an on-mood quest was reachable:  1,308
  → top pick was on-mood:                       98.9%
combos where none could fit:                    452  (falls back to a tagged match)
```

The test now asserts both halves separately: on-mood wins when available, and when it can't, the fallback is at least *related* to what you asked for. The lesson we kept repeating for the rest of the weekend: measure conditionally, or you'll tune a model to compensate for missing data.

---

## Round 4 — the two bugs only a screenshot could find

Everything above was found by assertions over the logic. Then we ran the built
site in a headless browser (`test/browser_check.py`, 23 checks: every control,
the timeline geometry, reroll, alternates, mobile overflow, dark mode) and two
bugs fell straight out of the first screenshot.

**A telescope recommended in the rain.** The Jacobsen Observatory is a building,
so `indoor: true`, so it sailed through the rain filter — and got offered for a
rainy evening. No logic test could have caught this: every assertion we had was
about time, money and shelter, and by all three the answer was correct. Quests
now carry a `clear` flag for things that are pointless under cloud.

**An off-mood pick with no explanation.** Asking for *outdoors* from south campus
in the rain returned a card stamped *quiet*, because nothing outdoors survives
that filter. The ranking was right and the screen was baffling. The card now
says so in a line under the title: *"Nothing outdoors fits this gap from here
while staying dry, so here's the closest thing that does."*

The browser suite also confirmed a property we'd only proved in Node: the empty
state is now **unreachable** through the UI. Twenty gap/mood combinations at the
worst start point, no money, raining, all return a quest. `loosenings()` stays as
a guard against future dataset edits rather than something users hit.

## Round 5 — four more bugs, three of them from looking at pictures

Adding opening hours, the setting choice and free-text location broke things in
ways the existing tests did not cover.

**Clicking "did you mean" did nothing.** The location field re-resolves on
`blur`, and `blur` fires *before* the click on the suggestion buttons — so the
buttons were re-rendered and detached mid-click, and the click landed on a dead
node. Resolving is now a no-op when the input hasn't changed.

**"mgh" resolved silently.** Typing a course code and seeing no confirmation at
all leaves you guessing whether it landed. The field now echoes what it read
("Reading that as Mary Gates Hall") unless you typed the name itself.

**A grove of trees that closed at 7:58pm.** Spotted in a dark-mode screenshot.
Always-open places were handed an `arrival + 24h` sentinel as their closing
time, which wrapped around the clock and got printed. Places that never shut now
report no closing time.

**"gates" picked one silently.** The matcher returned the top-scoring place
without checking for ties — and Mary Gates Hall and the Gates Center score
identically and sit a quarter-mile apart. A tie now returns suggestions.

Two of these were only visible in a rendered page, which is why the browser
suite grew from 23 checks to 24 and now covers the location field, the clock
line and the hours behaviour.

## Round 6 — the build lied

Wiring in the Google integration broke the site completely, and the build said
it went fine.

`src/lib/hours.js` gained `export { ENRICHED_AT };`. Our 40-line bundler strips
`export function` and `export const` with a regex and had never met that form,
so `export` survived into `dist/index.html`, the browser threw
`Unexpected token 'export'` on it, and **every line of JavaScript on the page
stopped running**. No options rendered, no autocomplete, no form. `node build.js`
printed a size and a success message.

Nothing in the node suite could have caught this: the modules were correct, the
tests import them directly, and all 30 passed. It surfaced only because the
browser suite clicked a suggestion button that no longer existed.

Two fixes. The bundler learned the re-export form, and — more usefully — it now
scans its own output for surviving module syntax and exits non-zero with the
offending lines. A build that can't produce a working page should not print
"built".

The merge between real Google hours and the fallback profiles is tested against
fixtures rather than live data, so `npm test` passes whether or not anyone has
run `npm run enrich`: a Google closing time beating the profile, a day Google
marks closed, split lunch/dinner hours picking the right period, and an
always-open park staying always open.

## What the suite covers now

| file | owner | what it protects |
|---|---|---|
| `dataset.test.js` | A | field completeness, range sanity, unique ids, coordinates inside Seattle, enough free/short/indoor options to keep the edges alive |
| `travel.test.js` | A | walking estimates within 4 min of route times, transit chosen only when faster, every plan fits its gap, impossible things refused |
| `locate.test.js` | A | codes, nicknames, whole sentences, misspellings, and refusing to guess on ambiguity |
| `browser_check.py` | both | the built site in a headless Chromium: controls render, timeline segments sum to the bar, the on-screen arithmetic adds to the gap, reroll and alternates work, no horizontal scroll at 390px, dark mode applies |
| `recommend.test.js` | both | the full 1,760-combination sweep: no overruns, hard filters stay hard, no empty pages, rerolls don't repeat, mood fidelity, every offered loosening actually works |

## What we haven't tested

- **Visual regression.** The browser suite checks behaviour and geometry, not whether it still looks right. That part is still two people and a screenshot.
- **Walking times as a group.** Six pairs are checked against route times. The other 599 are the model trusting itself.
- **Opening hours**, because they aren't modelled. The app will confidently route you to a bookshop that closed at six.
