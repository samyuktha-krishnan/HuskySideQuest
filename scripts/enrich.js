// Google Places -> src/data/venues.js.
//
//   GOOGLE_MAPS_API_KEY=... npm run enrich
//   GOOGLE_MAPS_API_KEY=... npm run enrich -- --only magus,allegro
//   npm run enrich -- --dry-run          (shows what it would ask for, no key needed)
//
// Run monthly and commit the output. The app never calls Google at runtime:
// the deployed page can't make outbound requests and can't hold a key.
//
// ~100 requests a run (Text Search + Details, 3 fields), inside the free
// monthly allowance. It's somebody's card, so don't put it on a cron.
//
// Free alternative: OSM Overpass has `opening_hours` for most of these.
// Patchier, and the tag syntax is its own language to parse.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { QUESTS } from "../src/data/quests.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const KEY = process.env.GOOGLE_MAPS_API_KEY;
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const onlyArg = args.indexOf("--only");
const only = onlyArg > -1 ? (args[onlyArg + 1] || "").split(",").filter(Boolean) : null;

const targets = QUESTS.filter((q) => (only ? only.includes(q.id) : true));

// Not places. Looking these up returns confident nonsense.
const NOT_A_VENUE = new Set([
  "blindshelf", "obelisk", "quadphoto", "under10", "onestop", "avewalk",
  "burkegilman", "studyroom",
]);

function minutes(t) {
  return t.hour * 60 + t.minute;
}

// Google periods -> { weekday: [[open, close], ...] }, 0 = Sunday.
function toHours(regular) {
  if (!regular) return null;
  if (regular.periods?.length === 1 && !regular.periods[0].close) {
    return "always";                        // open 24/7
  }
  const byDay = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const p of regular.periods || []) {
    if (!p.open || !p.close) continue;
    const day = p.open.day;
    let open = minutes(p.open);
    let close = minutes(p.close);
    if (p.close.day !== day) close = 24 * 60;   // past midnight: clamp to the day
    byDay[day].push([open, close]);
  }
  for (const d of Object.keys(byDay)) byDay[d].sort((a, b) => a[0] - b[0]);
  return byDay;
}

async function search(quest) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": KEY,
      "X-Goog-FieldMask": "places.id,places.displayName,places.location,places.formattedAddress",
    },
    body: JSON.stringify({
      textQuery: quest.addr,
      // or "Gates" returns a foundation in Bellevue
      locationBias: {
        circle: { center: { latitude: 47.6553, longitude: -122.3035 }, radius: 6000 },
      },
      maxResultCount: 1,
    }),
  });
  if (!res.ok) throw new Error(`searchText ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.places?.[0] || null;
}

async function details(placeId) {
  const url = `https://places.googleapis.com/v1/places/${placeId}` +
    "?fields=id,displayName,location,regularOpeningHours";
  const res = await fetch(url, { headers: { "X-Goog-Api-Key": KEY } });
  if (!res.ok) throw new Error(`details ${res.status}: ${await res.text()}`);
  return res.json();
}

// Metres between Google's coords and ours.
function drift(a, b) {
  const t = Math.PI / 180, R = 6371000;
  const dLat = (b.lat - a.lat) * t, dLng = (b.lng - a.lng) * t;
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

const lookups = targets.filter((q) => !NOT_A_VENUE.has(q.id));

if (dryRun) {
  console.log(`Would look up ${lookups.length} venues:\n`);
  for (const q of lookups) console.log(`  ${q.id.padEnd(14)} ${q.addr}`);
  console.log(`\nSkipping ${targets.length - lookups.length} that aren't venues: ` +
    targets.filter((q) => NOT_A_VENUE.has(q.id)).map((q) => q.id).join(", "));
  process.exit(0);
}

if (!KEY) {
  console.error("Set GOOGLE_MAPS_API_KEY, or pass --dry-run to see what this would fetch.");
  process.exit(1);
}

const out = {};
const warnings = [];
const today = new Date().toISOString().slice(0, 10);

for (const q of lookups) {
  try {
    const hit = await search(q);
    if (!hit) { warnings.push(`${q.id}: no match for "${q.addr}"`); continue; }

    const full = await details(hit.id);
    const loc = { lat: full.location.latitude, lng: full.location.longitude };
    const moved = drift(q, loc);

    // Big drift usually means the wrong match. Flag, don't relocate.
    if (moved > 400) {
      warnings.push(`${q.id}: matched "${full.displayName?.text}" ${moved}m away — check it`);
    }

    const hours = toHours(full.regularOpeningHours);
    out[q.id] = {
      placeId: full.id,
      name: full.displayName?.text || hit.displayName?.text,
      lat: +loc.lat.toFixed(5),
      lng: +loc.lng.toFixed(5),
      hours,
      fetchedAt: today,
    };
    if (!hours) warnings.push(`${q.id}: Google has no opening hours — profile still applies`);

    console.log(`  ${q.id.padEnd(14)} ${out[q.id].name} (${moved}m off)`);
  } catch (err) {
    warnings.push(`${q.id}: ${err.message}`);
  }
}

const body = `// Real venue data, fetched from Google Places and committed to the repo.
// Owner: dataset.
//
// THIS FILE IS GENERATED by scripts/enrich.js. Run \`npm run enrich\` to
// refresh it; don't hand-edit. Anything absent falls back to the category
// profiles in src/lib/hours.js.
//
//   hours: { weekday: [[openMinutes, closeMinutes], ...] }, 0 = Sunday
//          [] means closed that day, "always" means never shuts

export const VENUES = ${JSON.stringify(out, null, 2)};

export const ENRICHED_AT = ${JSON.stringify(today)};
`;

writeFileSync(resolve(root, "src/data/venues.js"), body);

console.log(`\nWrote ${Object.keys(out).length} venues to src/data/venues.js`);
if (warnings.length) {
  console.log(`\n${warnings.length} thing(s) to look at:`);
  for (const w of warnings) console.log("  ! " + w);
}
console.log("\nRun `npm test` before committing — dataset tests check the merge.");
