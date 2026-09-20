# SideQuest UW

You get let out of a lecture with 45 minutes before the next one. Not enough to go home, too much to stand in a corridor. So you spend all 45 minutes scrolling and deciding, and then the gap is gone.

SideQuest UW asks four questions and gives you one thing to do that you can actually finish and get back from. It shows you the arithmetic, because the point is not another list of recommendations, it's proof you have time.

### → https://samyuktha-krishnan.github.io/sidequest-uw/

Open it in any browser on any device. Nothing to install, no account, no sign-in.
On a phone, "Add to Home Screen" gives it an icon and opens it fullscreen like
an app — and it works with no signal, which matters in the buildings where you
actually have the gap.

Built over a weekend hackathon by Samyuktha and Thanishka.

---

## Who built what

| | **Samyuktha** | **Thanishka** |
|---|---|---|
| Owns | `src/data/`, `src/lib/` | `src/ui/`, `index.html` |
| Built | the 57-quest dataset, the 87-place gazetteer, the travel model, opening hours, the feasibility rule, the scoring algorithm | the spec-sheet form, the free-text location field, the result layout, the clock timeline, reroll and alternates, the dead-end state |
| Tests | `dataset.test.js`, `travel.test.js`, `locate.test.js` | `browser_check.py` |

`test/recommend.test.js` is the one we wrote together, sitting at the same table, and it's the reason the app works — see [TESTING.md](TESTING.md).

## How we worked in parallel without blocking each other

We agreed the seam before either of us wrote anything, on the back of the schedule handout:

```
recommend(filters) -> [{ quest, plan, score, why }]   // best first

filters = { gap, budget, mood, start, raining, stayDry, seed, exclude }
plan    = { travel, mode, stay, total, spare, tight }
why     = [["Exactly the mood you picked", "+42"], ...]
```

Two rules fell out of that, and they held for the whole weekend:

1. **The interface does no arithmetic on a quest.** If a number goes on screen, it arrives in `plan`. When B needed "you'd be back with 21 minutes to spare," that became `plan.spare` in A's code rather than a subtraction in the render function. Anything else and the displayed time and the computed time drift apart the moment one of us changes a constant.
2. **The logic knows nothing about the DOM.** `src/lib/` and `src/data/` import nothing from `src/ui/`, which is why the whole recommendation engine is testable in Node with no browser and why the test sweep below can run 46,000 assertions in under a second.

B stubbed `recommend()` with three fake results for the first two hours and built the entire slip against it. A didn't have to wait for a UI, B didn't have to wait for a dataset.

## How the recommendation works

**Travel** (`src/lib/travel.js`) — haversine distance between your start point and the quest, multiplied by a 1.32 detour factor because streets aren't straight lines, at 78 m/min. For the far ones (Archie McPhee, the Fremont Troll, Gas Works, Elliott Bay Books) it also computes a transit route — walk to the stop, ride, walk off — and takes whichever is faster.

**Feasibility**:

```
2 × travel + shortest sensible visit + 5 min buffer  ≤  your gap
```

Fail it and the quest never appears, no matter how good it is. Every quest carries a curated `act: [min, max]` rather than one duration, so the visit stretches to fill the gap you actually have, up to the point where more time stops being enjoyable.

**Scoring** (`src/lib/recommend.js`): mood match (+42 primary, +22 secondary), how fully it uses the window without rushing (+26), budget fit (+12–14), weather (+10–12), a curated delight rating as a tiebreak (up to +12), minus 8 if it's cutting things fine, plus a small seeded jitter. Every component is shown to you under "Why this one?".
## Putting it on GitHub

```bash
git init && git branch -M main
git add . && git commit -m "SideQuest UW"
git remote add origin git@github.com:<you>/sidequest-uw.git
git push -u origin main
```

Then Settings → Pages → Source: **GitHub Actions**. `.github/workflows/deploy.yml`
builds and publishes `dist/` on every push to main; `ci.yml` runs the node suite,
the browser suite, and checks that `dist/` isn't stale.

## Where the data comes from

Nothing is fetched at runtime. The deployed page makes **no outbound requests**,
its content security policy blocks them, and a static site can't hold a billing
key safely anyway. So Google is called on a laptop, and the answers are
committed to the repo:

```bash
GOOGLE_MAPS_API_KEY=... npm run enrich     # real hours + coordinates + place ids
GOOGLE_MAPS_API_KEY=... npm run calibrate  # fits the walking model to real routes
npm run enrich -- --dry-run                # see what it would ask for, no key
```

`enrich` writes `src/data/venues.js`: for each venue, Google's opening hours,
coordinates and place id. Anything it can't find falls back to the category
profiles in `src/lib/hours.js`, and the interface says which it's showing:
"10am–7pm" when the hours are real, "shop hours, estimated" when they're not.

`calibrate` fixes the walking model. It samples 60 real walking routes across
the full distance range, fits the detour factor to them, and reports what's
still worst. That's much cheaper than fetching an 87 × 57 matrix every time
someone adds a building, and it keeps the app offline and instant.


**Free alternative:** OpenStreetMap's Overpass API carries an `opening_hours`
tag for most of these venues and costs nothing, no billing account. Coverage is
patchier and the tag syntax is its own small language to parse. Worth it if
this outlives the hackathon.

