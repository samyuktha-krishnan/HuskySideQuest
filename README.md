# SideQuest UW

You get let out of a lecture with 45 minutes before the next one. Not enough to go home, too much to stand in a corridor. So you spend all 45 minutes scrolling and deciding, and then the gap is gone.

SideQuest UW asks four questions and gives you one thing to do that you can actually finish and get back from. It shows you the arithmetic, because the point is not another list of recommendations — it's proof you have time.

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

**Feasibility** — a hard filter, not a penalty:

```
2 × travel + shortest sensible visit + 5 min buffer  ≤  your gap
```

Fail it and the quest never appears, no matter how good it is. Every quest carries a curated `act: [min, max]` rather than one duration, so the visit stretches to fill the gap you actually have, up to the point where more time stops being enjoyable.

**Scoring** (`src/lib/recommend.js`) — mood match (+42 primary, +22 secondary), how fully it uses the window without rushing (+26), budget fit (+12–14), weather (+10–12), a curated delight rating as a tiebreak (up to +12), minus 8 if it's cutting things fine, plus a small seeded jitter. Every component is shown to you under "Why this one?" — we'd rather be legible than clever.

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

**Before you push:**

1. **The live link** above assumes the repo lives at
   `github.com/samyuktha-krishnan/sidequest-uw`. If it ends up on Thanishka's
   account or under a different repo name, the URL follows the same pattern:
   `https://<owner>.github.io/<repo>/`.
2. **Never commit the Google key.** Both scripts read `GOOGLE_MAPS_API_KEY`
   from the environment and `.gitignore` covers `.env`, but check `git log -p`
   if you've been experimenting. A leaked Maps key gets scraped and billed
   within hours — restrict it by HTTP referrer in the Cloud console regardless.
3. **Commit as yourselves.** One bulk "initial commit" from one account is a
   thin story for a project whose whole point is that two people built it.
   Push the parts each of you owns from your own account.

## Where the data comes from

Nothing is fetched at runtime. The deployed page makes **no outbound requests** —
its content-security policy blocks them, and a static site can't hold a billing
key safely anyway. So Google is called on a laptop, and the answers are
committed to the repo:

```bash
GOOGLE_MAPS_API_KEY=... npm run enrich     # real hours + coordinates + place ids
GOOGLE_MAPS_API_KEY=... npm run calibrate  # fits the walking model to real routes
npm run enrich -- --dry-run                # see what it would ask for, no key
```

`enrich` writes `src/data/venues.js`: for each venue, Google's opening hours,
coordinates and place id. Anything it can't find falls back to the category
profiles in `src/lib/hours.js`, and the interface says which it's showing —
"10am–7pm" when the hours are real, "shop hours, estimated" when they're not.
It skips the eight quests that aren't venues, because looking up "The Ave
under-ten challenge" returns confident nonsense.

`calibrate` fixes the walking model. It samples 60 real walking routes across
the full distance range, fits the detour factor to them, and reports what's
still worst. That's much cheaper than fetching an 87 × 57 matrix every time
someone adds a building, and it keeps the app offline and instant.

Run both monthly and commit the output. The cost sits inside Google's free
monthly allowance at this size — don't put either on a cron.

**Free alternative:** OpenStreetMap's Overpass API carries an `opening_hours`
tag for most of these venues and costs nothing, no billing account. Coverage is
patchier and the tag syntax is its own small language to parse. Worth it if
this outlives the hackathon.

## Working on it

Only needed if you're changing the code — using the site needs none of this.

```bash
npm run dev     # static server on :8000, ES modules, no build step
npm test                       # 30 tests, ~90k assertions, about a second
python test/browser_check.py   # 36 checks against the built page in headless Chromium
npm run build   # bundles the 5 modules + CSS into dist/index.html
```

`build.js` inlines the modules and stylesheet into `dist/index.html` and copies
the manifest, icons and service worker beside it. It's deliberately not a real
bundler. The app is five modules with a linear dependency chain, it deploys as one static file, and we wanted anyone reading the repo to see exactly what ships.

## What we know is wrong

- **Walking times run conservative.** Red Square to Ravenna Park reads 31 minutes; the real route is closer to 25. The detour factor is a single constant across a campus that has hills, bridges and one very long diagonal. A per-region factor would fix most of it.
- **Nobody has run `npm run enrich` yet.** Until someone does, every opening time on the site is a category estimate and the page says so. The machinery is written and tested against fixtures; it needs a key and five minutes.
- **The dataset has never been walked.** 57 quests were written from knowledge and checked against maps, not visited with a notebook. `enrich` will flag any whose coordinates drift more than 400m from Google's, which catches the worst of it, but it can't tell you a place shut down cheerfully.
- **The walking factor is still the number we guessed.** `npm run calibrate` replaces it with a fitted one. Until then, expect long diagonals to read a few minutes conservative.
- **No live transit.** OneBusAway publishes a real arrivals API for Puget Sound, but the deployed page makes no outbound requests, so bus legs are static ride estimates. A self-hosted build could wire it up; a live arrival time would change "the 44 bus, 11 minutes" into "the 44, leaves in 4".
- **Outdoors plus a 30-minute gap** from the north end of campus has no answer, and the app says so rather than inventing one.

## What we'd build next

Run the two scripts, which turns every estimate on the site into real data and
costs nothing but an API key. Then live bus arrivals on a self-hosted build,
where an outbound request is actually possible: OneBusAway publishes a free
arrivals API for Puget Sound, and "the 44 bus, 11 minutes" becoming "the 44,
leaves in 4" is the difference between a suggestion and a plan.
