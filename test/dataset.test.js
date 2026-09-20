// Dataset integrity: the copy-paste mistakes that come with hand-curating
// 57 entries at 1am.
import test from "node:test";
import assert from "node:assert/strict";
import { QUESTS } from "../src/data/quests.js";
import { STARTS } from "../src/data/starts.js";
import { PROFILES, closingTime, hoursSource, alwaysOpen } from "../src/lib/hours.js";

const MOODS = ["productive", "social", "quiet", "food", "outdoors"];

test("every quest has the fields the interface renders", () => {
  for (const q of QUESTS) {
    for (const f of ["id", "name", "area", "addr", "blurb", "tip", "mood"]) {
      assert.ok(q[f] && String(q[f]).trim(), `${q.id || "?"} is missing ${f}`);
    }
    assert.equal(typeof q.indoor, "boolean", `${q.id} indoor must be a boolean`);
    assert.ok(MOODS.includes(q.mood), `${q.id} has an unknown mood: ${q.mood}`);
    assert.ok(q.tags.every((t) => MOODS.includes(t)), `${q.id} has an unknown tag`);
    assert.ok(!q.tags.includes(q.mood), `${q.id} repeats its primary mood as a tag`);
  }
});

test("ranges are the right way round and plausible", () => {
  for (const q of QUESTS) {
    assert.ok(q.act[0] <= q.act[1], `${q.id} activity range is inverted`);
    assert.ok(q.cost[0] <= q.cost[1], `${q.id} cost range is inverted`);
    assert.ok(q.act[0] >= 10, `${q.id}: under 10 minutes isn't worth the walk`);
    assert.ok(q.act[1] <= 120, `${q.id}: longer than the biggest gap we offer`);
    assert.ok(q.delight >= 0 && q.delight <= 10, `${q.id} delight out of range`);
  }
});

test("every quest declares hours we know how to read", () => {
  for (const q of QUESTS) {
    const profile = q.openness || "outdoor";
    assert.ok(PROFILES[profile], `${q.id} has an unknown hours profile: ${profile}`);
    if (q.hours) {
      assert.ok(q.hours.open < q.hours.close, `${q.id} closes before it opens`);
      assert.ok(q.hours.note, `${q.id} overrides hours without saying why`);
    }
  }
  // the categories that should obviously never be "open 24/7"
  for (const q of QUESTS.filter((q) => q.indoor)) {
    assert.notEqual(q.openness, "outdoor", `${q.id} is indoors but marked always open`);
  }
});

test("ids are unique — the exclusion list depends on it", () => {
  const ids = QUESTS.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("every coordinate is actually in Seattle", () => {
  for (const p of [...QUESTS, ...STARTS]) {
    assert.ok(p.lat > 47.5 && p.lat < 47.75, `${p.id} latitude is not Seattle`);
    assert.ok(p.lng > -122.45 && p.lng < -122.25, `${p.id} longitude is not Seattle`);
  }
});

test("free, indoor and short options all exist in useful numbers", () => {
  // Without these, "30 minutes, no money, indoors" returns an empty page.
  const free = QUESTS.filter((q) => q.cost[1] === 0);
  const quick = QUESTS.filter((q) => q.act[0] <= 20);
  const dry = QUESTS.filter((q) => q.indoor);
  assert.ok(free.length >= 20, `only ${free.length} free quests`);
  assert.ok(quick.length >= 15, `only ${quick.length} quests doable in 20 minutes`);
  assert.ok(dry.length >= 25, `only ${dry.length} indoor quests`);
  for (const m of MOODS) {
    assert.ok(QUESTS.filter((q) => q.mood === m).length >= 3,
      `mood "${m}" has too few primary quests — results get repetitive`);
  }
});

// --- merge with Google data ---
// Fixtures, not the real venues.js, so these pass before anyone runs enrich.
test("real hours from Google override the category profile", () => {
  const magus = QUESTS.find((q) => q.id === "magus");     // profile: shop, 10-19
  const wednesday = 3;

  // profile says a shop shuts at 7pm
  assert.equal(closingTime(magus, 18 * 60, wednesday, {}), 19 * 60);

  // Google says this one shuts at 8pm, and Google wins
  const fixture = { magus: { hours: { 3: [[10 * 60, 20 * 60]] }, fetchedAt: "2026-09-01" } };
  assert.equal(closingTime(magus, 18 * 60, wednesday, fixture), 20 * 60);
  assert.equal(hoursSource(magus, fixture), "google");
  assert.equal(hoursSource(magus, {}), "estimated");
});

test("a day Google marks closed is closed, whatever the profile says", () => {
  const magus = QUESTS.find((q) => q.id === "magus");
  const shutSunday = { magus: { hours: { 0: [], 3: [[10 * 60, 19 * 60]] } } };
  assert.equal(closingTime(magus, 13 * 60, 0, shutSunday), null);
  assert.equal(closingTime(magus, 13 * 60, 3, shutSunday), 19 * 60);
});

test("split hours pick the period you'd actually arrive in", () => {
  const q = QUESTS.find((q) => q.id === "thaitom");
  const split = { thaitom: { hours: { 3: [[11 * 60, 15 * 60], [17 * 60, 21 * 60]] } } };
  assert.equal(closingTime(q, 12 * 60, 3, split), 15 * 60, "lunch service");
  assert.equal(closingTime(q, 16 * 60, 3, split), null, "arriving in the gap between services");
  assert.equal(closingTime(q, 18 * 60, 3, split), 21 * 60, "dinner service");
});

test("an always-open venue stays always open through the merge", () => {
  const park = QUESTS.find((q) => q.id === "ravenna");
  assert.equal(alwaysOpen(park, {}), true);
  assert.equal(alwaysOpen(park, { ravenna: { hours: "always" } }), true);
  assert.equal(alwaysOpen(park, { ravenna: { hours: { 3: [[6 * 60, 22 * 60]] } } }), false,
    "if Google says the gate is locked at 10pm, believe it");
});
