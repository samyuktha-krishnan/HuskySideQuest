// "im outside odegard" -> coordinates, no network.
// Owner: dataset + recommendation logic.
//
// Four passes, cheapest first. Below the confidence bar we return suggestions
// instead of a guess — wrong guesses send people across campus.

import { PLACES, ALIAS_INDEX } from "../data/places.js";

// Carry no location information.
const NOISE = new Set([
  "im", "i'm", "at", "in", "the", "near", "by", "outside", "inside", "front",
  "of", "a", "an", "hall", "building", "bldg", "uw", "on", "next", "to",
  "just", "left", "leaving", "class", "lecture", "room", "library",
]);

function normalise(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9\s']/g, " ").replace(/\s+/g, " ").trim();
}

function tokens(s) {
  return normalise(s).split(" ").filter((t) => t && !NOISE.has(t));
}

// Levenshtein, capped: we only want near-misses, so bail early.
function editDistance(a, b, cap) {
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      if (row[j] < best) best = row[j];
    }
    if (best > cap) return cap + 1;
    prev = row;
  }
  return prev[b.length];
}

// "mgh" -> exact | "odegard" -> close | "hall" -> { place: null, suggestions }
export function locate(input) {
  const typed = String(input || "").trim();
  const norm = normalise(typed);
  if (!norm) return { place: null, suggestions: [], typed };

  // 1. whole string is a known name or alias
  if (ALIAS_INDEX.has(norm)) {
    return { place: PLACES[ALIAS_INDEX.get(norm)], confidence: "exact", typed };
  }

  // 2. alias inside a sentence; longest wins ("u district station" > "u district")
  let best = null;
  for (const [alias, idx] of ALIAS_INDEX) {
    if (alias.length < 3) continue;
    if (norm.includes(alias) && (!best || alias.length > best.alias.length)) {
      best = { alias, idx };
    }
  }
  if (best) return { place: PLACES[best.idx], confidence: "exact", typed };

  // 3. token overlap: word order and extra words don't matter
  const want = tokens(typed);
  if (want.length) {
    const scored = PLACES.map((p, i) => {
      const hay = tokens(p.name + " " + p.aliases.join(" "));
      let hits = 0;
      for (const w of want) {
        if (hay.some((h) => h === w || (w.length > 3 && h.startsWith(w)))) hits++;
      }
      return { i, score: hits / want.length };
    }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);

    // A tie is ambiguity, not a winner: "gates" matches Mary Gates Hall and
    // the Gates Center equally, and they're a quarter-mile apart.
    const tied = scored.filter((x) => x.score === scored[0].score);
    if (tied.length === 1 && scored[0].score >= 0.75) {
      return { place: PLACES[scored[0].i], confidence: "close", typed };
    }
    if (tied.length > 1 && scored[0].score >= 0.75) {
      return { place: null, typed, suggestions: tied.slice(0, 4).map((x) => PLACES[x.i]) };
    }
    if (scored.length) {
      return { place: null, typed, suggestions: scored.slice(0, 4).map((x) => PLACES[x.i]) };
    }
  }

  // 4. spelling: "suzallo", "odegard"
  const cap = norm.length <= 5 ? 1 : norm.length <= 9 ? 2 : 3;
  const near = [];
  for (const [alias, idx] of ALIAS_INDEX) {
    if (Math.abs(alias.length - norm.length) > cap) continue;
    const d = editDistance(norm, alias, cap);
    if (d <= cap) near.push({ idx, d });
  }
  near.sort((a, b) => a.d - b.d);
  if (near.length === 1 || (near.length && near[0].d === 1)) {
    return { place: PLACES[near[0].idx], confidence: "close", typed };
  }
  if (near.length) {
    const seen = new Set();
    const suggestions = [];
    for (const n of near) {
      if (seen.has(n.idx)) continue;
      seen.add(n.idx);
      suggestions.push(PLACES[n.idx]);
      if (suggestions.length === 4) break;
    }
    return { place: null, typed, suggestions };
  }

  return { place: null, typed, suggestions: [] };
}
