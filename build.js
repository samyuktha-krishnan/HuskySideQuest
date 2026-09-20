// Bundles the modules and stylesheet into one self-contained dist/index.html.
// Tiny on purpose: linear dependency chain, and you can read what ships.

import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(resolve(root, p), "utf8");

// A module goes after everything it imports.
const MODULES = [
  "src/data/starts.js",
  "src/data/places.js",
  "src/data/venues.js",
  "src/data/calibration.js",
  "src/data/quests.js",
  "src/lib/hours.js",
  "src/lib/travel.js",
  "src/lib/locate.js",
  "src/lib/recommend.js",
  "src/ui/app.js",
];

function flatten(path) {
  return read(path)
    .split("\n")
    // one scope, so every binding is already here
    .filter((line) => !/^\s*import\s.*from\s+["'].*["'];?\s*$/.test(line))
    .filter((line) => !/^\s*export\s*\{[^}]*\}\s*;?\s*$/.test(line))
    // `export function foo` -> `function foo`
    .map((line) => line.replace(/^(\s*)export\s+(?=(function|const|let|var|class)\s)/, "$1"))
    .join("\n");
}

const bundle = MODULES.map(
  (m) => `/* ---------- ${m} ---------- */\n${flatten(m)}`
).join("\n\n");

const html = read("index.html")
  .replace(
    '<link rel="stylesheet" href="src/ui/styles.css">',
    `<style>\n${read("src/ui/styles.css")}\n</style>`
  )
  .replace(
    '<script type="module" src="src/ui/app.js"></script>',
    `<script>\n(function(){\n"use strict";\n${bundle}\n})();\n</script>`
  );

// Leftover module syntax kills the whole page: the browser throws on the
// first `export` and no JS runs. This used to fail silently.
const leftovers = bundle
  .split("\n")
  .map((line, i) => ({ line: line.trim(), n: i + 1 }))
  .filter(({ line }) => /^(import|export)\b/.test(line));

if (leftovers.length) {
  console.error("Module syntax survived bundling — the page would not run:\n");
  for (const { line, n } of leftovers.slice(0, 10)) console.error(`  line ${n}: ${line}`);
  console.error("\nTeach flatten() this form, or avoid it in the source.");
  process.exit(1);
}

mkdirSync(resolve(root, "dist"), { recursive: true });
writeFileSync(resolve(root, "dist/index.html"), html);

// Not inlined: the manifest and icons have to be real files for "add to home
// screen" to work, and the service worker has to be served from the root.
const ASSETS = ["manifest.webmanifest", "sw.js", "icon-192.png", "icon-512.png"];
for (const a of ASSETS) copyFileSync(resolve(root, a), resolve(root, "dist", a));

const kb = (html.length / 1024).toFixed(1);
console.log(`built dist/index.html  ${kb} kB  (${MODULES.length} modules inlined, ` +
  `${ASSETS.length} assets copied)`);
