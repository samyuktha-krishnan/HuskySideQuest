// Travel estimates and the feasibility rule.
import test from "node:test";
import assert from "node:assert/strict";
import { walkMinutes, travelFor, planFor, BUFFER } from "../src/lib/travel.js";
import { QUESTS } from "../src/data/quests.js";
import { STARTS } from "../src/data/starts.js";

const at = (id) => STARTS.find((s) => s.id === id);
const quest = (id) => QUESTS.find((q) => q.id === id);

test("walking estimates stay close to real route times", () => {
  // Reference = Google Maps walking directions. Swap in stopwatch numbers as
  // we walk them. ±4 min because the model isn't routing.
  const REFERENCE = [
    ["red", "allegro", 7], ["red", "magus", 7], ["red", "thaitom", 12],
    ["red", "mollymoon", 17], ["west", "aguaverde", 6], ["north", "burke", 8],
  ];
  for (const [from, to, real] of REFERENCE) {
    const got = walkMinutes(at(from), quest(to));
    assert.ok(Math.abs(got - real) <= 4,
      `${from} -> ${to}: model says ${got}, route time is ${real}`);
  }
});

test("transit is only chosen when it actually beats walking", () => {
  for (const q of QUESTS.filter((q) => q.via)) {
    for (const s of STARTS) {
      const t = travelFor(q, s);
      assert.ok(t.minutes <= walkMinutes(s, q),
        `${q.id} from ${s.id}: took the bus when walking was faster`);
    }
  }
});

test("a plan always fits inside the gap it was built for", () => {
  for (const q of QUESTS) for (const s of STARTS) for (const gap of [30, 60, 90, 120]) {
    const p = planFor(q, s, gap);   // no `now` — hours ignored, geometry only
    if (!p) continue;
    assert.ok(p.travel * 2 + p.stay + BUFFER <= gap,
      `${q.id} from ${s.id} overruns a ${gap}-minute gap`);
    assert.ok(p.spare >= BUFFER - 1, `${q.id} leaves no buffer`);
    assert.ok(p.stay >= q.act[0] && p.stay <= q.act[1],
      `${q.id} stay time ${p.stay} is outside its curated range`);
  }
});

test("impossible things are refused rather than squeezed", () => {
  assert.equal(planFor(quest("greenlake"), at("red"), 30), null);
  assert.equal(planFor(quest("canoe"), at("north"), 60), null);
  assert.ok(planFor(quest("greenlake"), at("red"), 120));
});
