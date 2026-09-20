// Written jointly: neither half can prove on its own that a recommendation is
// achievable. Sweeps every combination of filters the UI can produce.
import test from "node:test";
import assert from "node:assert/strict";
import { recommend, loosenings } from "../src/lib/recommend.js";
import { BUFFER } from "../src/lib/travel.js";
import { alwaysOpen } from "../src/lib/hours.js";
import { STARTS } from "../src/data/starts.js";

const GAPS = [30, 60, 90, 120];
const BUDGETS = [0, 10, 25, 40];
const MOODS = ["productive", "social", "quiet", "food", "outdoors"];
const NOON = { minutes: 13 * 60, day: 3 };   // a Wednesday lunchtime

function* everyCombination() {
  for (const gap of GAPS) for (const budget of BUDGETS) for (const mood of MOODS)
  for (const s of STARTS) for (const setting of ["indoors","outdoors","either"]) {
    yield { gap, budget, mood, setting, start: s.id, now: NOON, seed: 7, exclude: [] };
  }
}

test("nothing we recommend overruns the gap it was asked about", () => {
  let checked = 0;
  for (const f of everyCombination()) {
    for (const { quest, plan } of recommend(f)) {
      assert.ok(plan.travel * 2 + plan.stay + BUFFER <= f.gap,
        `${quest.id} overruns ${f.gap} minutes from ${f.start}`);
      assert.ok(plan.spare >= 0, `${quest.id} leaves you late`);
      checked++;
    }
  }
  assert.ok(checked > 40000, `only checked ${checked} recommendations`);
});

test("hard filters are hard", () => {
  for (const f of everyCombination()) {
    for (const { quest } of recommend(f)) {
      assert.ok(quest.cost[0] <= f.budget,
        `${quest.id} costs at least $${quest.cost[0]} on a $${f.budget} budget`);
      if (f.setting === "indoors") assert.ok(quest.indoor, `${quest.id} is outdoors but indoors was asked for`);
      if (f.setting === "outdoors") assert.ok(!quest.indoor, `${quest.id} is indoors but outdoors was asked for`);
    }
  }
});

test("a dead end always offers a working way out", () => {
  // Not "never empty": outdoors + 30 min from north campus genuinely has no
  // answer, and faking one means recommending something unreachable. The
  // invariant is that every empty result comes with a relaxation that works.
  const all = [...everyCombination()];
  const dead = all.filter((f) => recommend(f).length === 0);

  assert.ok(dead.length / all.length < 0.02,
    `${dead.length} of ${all.length} combinations are dead ends`);

  for (const f of dead) {
    const ways = loosenings(f);
    assert.ok(ways.length > 0, `dead end with no way out: ${JSON.stringify(f)}`);
    for (const w of ways) {
      assert.ok(recommend({ ...f, ...w.patch }).length > 0,
        `"${w.label}" offered but still returns nothing`);
    }
  }
});

test("'give me another' actually gives you another", () => {
  // Reroll used to repeat when one quest dominated the score; `exclude` fixed
  // it. See TESTING.md round 2.
  for (const gap of GAPS) for (const mood of MOODS) {
    const seen = [];
    for (let i = 0; i < 6; i++) {
      const [top] = recommend({ gap, budget: 10, mood, start: "red",
        setting: "either", now: NOON, seed: i + 1, exclude: seen });
      if (top) seen.push(top.quest.id);
    }
    assert.equal(new Set(seen).size, seen.length,
      `${gap}m/${mood} repeated a quest within six rerolls`);
  }
});

test("when an on-mood quest is reachable, it wins", () => {
  // Unconditionally this reads ~65% and looks like a ranking bug. It isn't:
  // for ~450 combinations no on-mood quest fits at all. Measure conditionally
  // or you tune the model to cover a hole in the dataset.
  let available = 0, won = 0, unavailable = 0, gracefulFallback = 0;

  for (const f of everyCombination()) {
    const results = recommend(f);
    if (!results.length) continue;
    const top = results[0].quest;

    if (results.some((r) => r.quest.mood === f.mood)) {
      available++;
      if (top.mood === f.mood) won++;
    } else {
      unavailable++;
      if (top.tags.includes(f.mood)) gracefulFallback++;
    }
  }

  assert.ok(won / available > 0.95,
    `on-mood quest available but not chosen in ${available - won} cases`);
  assert.ok(gracefulFallback / unavailable > 0.5,
    "when no on-mood quest fits, the fallback should still be related");
});

test("an impossible brief offers a way out instead of a dead end", () => {
  const impossible = { gap: 30, budget: 0, mood: "food", start: "south",
    setting: "outdoors", now: { minutes: 23 * 60, day: 3 }, seed: 1, exclude: [] };
  const ways = loosenings(impossible);
  assert.ok(ways.length > 0, "no loosening suggested");
  for (const w of ways) {
    assert.ok(recommend({ ...impossible, ...w.patch }).length > 0,
      `"${w.label}" was offered but still returns nothing`);
  }
});

test("nothing shut is ever recommended", () => {
  // Replaces an earlier `clear` flag. Hours are the real constraint and cover
  // every venue, not one special case.
  const LATE = { minutes: 23 * 60 + 30, day: 3 };   // half eleven on a Wednesday
  for (const gap of GAPS) for (const mood of MOODS) {
    for (const { quest, plan } of recommend({ gap, budget: 40, mood, setting: "either",
      start: "red", now: LATE, seed: 4, exclude: [] })) {
      assert.ok(alwaysOpen(quest) || plan.closes,
        `${quest.id} was offered at 11:30pm with no opening hours check`);
    }
  }
  // museums shut on Mondays
  const monday = recommend({ gap: 120, budget: 40, mood: "quiet", setting: "indoors",
    start: "north", now: { minutes: 13 * 60, day: 1 }, seed: 1, exclude: [] });
  assert.ok(!monday.some((r) => r.quest.id === "burke"), "the Burke is shut on Mondays");
  const tuesday = recommend({ gap: 120, budget: 40, mood: "quiet", setting: "indoors",
    start: "north", now: { minutes: 13 * 60, day: 2 }, seed: 1, exclude: [] });
  assert.ok(tuesday.some((r) => r.quest.id === "burke"), "the Burke should be open on Tuesdays");
});

test("somewhere that never shuts reports no closing time", () => {
  // The always-open sentinel (arrival + 24h) leaked to the UI and wrapped:
  // a grove of trees labelled "until 7:58pm".
  for (const { quest, plan } of recommend({ gap: 120, budget: 0, mood: "outdoors",
    setting: "outdoors", start: "red", now: { minutes: 19 * 60, day: 3 }, seed: 1, exclude: [] })) {
    if (alwaysOpen(quest)) {
      assert.equal(plan.closes, null, `${quest.id} never shuts but reported a closing time`);
    } else {
      assert.ok(plan.closes > 0, `${quest.id} has hours but reported none`);
    }
  }
});

test("a visit never runs past closing time", () => {
  const EVENING = { minutes: 17 * 60 + 40, day: 4 };  // shops close at 7
  for (const { quest, plan } of recommend({ gap: 120, budget: 40, mood: "quiet",
    setting: "either", start: "red", now: EVENING, seed: 2, exclude: [] })) {
    if (!plan.closes) continue;
    const leaveAt = EVENING.minutes + plan.travel + plan.stay;
    assert.ok(leaveAt <= plan.closes,
      `${quest.id} has you leaving at ${leaveAt} but it shuts at ${plan.closes}`);
  }
});
