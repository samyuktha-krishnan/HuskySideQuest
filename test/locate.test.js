// Free-text location matching. The interesting cases are where it should
// refuse to guess — wrong building beats no building only in theory.
import test from "node:test";
import assert from "node:assert/strict";
import { locate } from "../src/lib/locate.js";

const at = (s) => locate(s).place?.name;

test("exact names and course-schedule codes", () => {
  assert.equal(at("Red Square"), "Red Square");
  assert.equal(at("mgh"), "Mary Gates Hall");
  assert.equal(at("HSB"), "Health Sciences Building");
  assert.equal(at("cse2"), "Gates Center");
  assert.equal(at("the hub"), "The HUB");
  assert.equal(at("u village"), "University Village");
});

test("nicknames students actually use", () => {
  assert.equal(at("suz"), "Suzzallo Library");
  assert.equal(at("ode"), "Odegaard Library");
  assert.equal(at("the ave"), "The Ave at NE 45th");
  assert.equal(at("frat row"), "Greek Row");
  assert.equal(at("the gym"), "IMA");
});

test("a whole sentence, not just a name", () => {
  assert.equal(at("im outside the hub"), "The HUB");
  assert.equal(at("just left class in kane"), "Kane Hall");
  assert.equal(at("in front of suzzallo library"), "Suzzallo Library");
});

test("misspellings that should still resolve", () => {
  assert.equal(at("odegard"), "Odegaard Library");
  assert.equal(at("suzallo"), "Suzzallo Library");
  assert.equal(at("gerberding hal"), "Gerberding Hall");
});

test("ambiguity comes back as suggestions, never a guess", () => {
  const r = locate("gates");
  assert.equal(r.place, null, "must not silently pick between the two Gates");
  assert.ok(r.suggestions.length >= 2);
  const names = r.suggestions.map((p) => p.name);
  assert.ok(names.includes("Gates Center") || names.includes("Mary Gates Hall"));
});

test("nonsense fails honestly rather than landing somewhere", () => {
  const r = locate("zzzzqqqq");
  assert.equal(r.place, null);
  assert.deepEqual(r.suggestions, []);
  assert.equal(locate("").place, null);
  assert.equal(locate(null).place, null);
});

test("longer aliases win over shorter ones inside a sentence", () => {
  assert.equal(at("waiting at u district station"), "U District Light Rail Station");
});
