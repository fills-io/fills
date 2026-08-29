/**
 * How much do briefs repeat themselves, and each other?
 *
 * Three separate questions, which have three separate answers and three
 * separate fixes. Keeping them apart matters: only the first is a bug.
 *
 *   A. WITHIN one brief — the same photograph under two headings. A pendant
 *      over a dining table scores for both furniture and lighting, so without
 *      a shared ledger it landed in both. Should always be 0.
 *   B. TWO briefs of the SAME project type, different vibe and palette. High
 *      means the ranking barely responds to what the user chose.
 *   C. TWO briefs of DIFFERENT project types. High means a dental clinic and a
 *      hotel lobby are being shown the same pictures — which is a function of
 *      how much of the library is per-industry rather than shared.
 *
 * B and C are bounded by the size of the reference library, not by the code:
 * after the junk filter, flooring holds 7 clean close-ups against a 12-image
 * request, and those same 7 are all any project type can be offered. No
 * ranking change can make two briefs differ using images that do not exist.
 *
 * Run: node scripts/audit-overlap.mjs
 */

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require_ = createRequire(import.meta.url);
const loadJiti = () => {
  try {
    return require_("jiti");
  } catch {
    return createRequire(require_.resolve("next/package.json"))("jiti");
  }
};
const jiti = loadJiti().createJiti(import.meta.url, {
  alias: { "@": join(root, "src") },
});

const { selectBriefImages } = await jiti.import(join(root, "src/lib/select-images.ts"));
const { CURATED_VIBE } = await jiti.import(join(root, "src/data/reference-images.ts"));

const PALETTE = ["#c8512a", "#f4f2ec", "#2a2a28", "#8d6649"];
const INDUSTRIES = Object.keys(CURATED_VIBE);

/** Exactly what the app builds for one brief. */
const brief = (spaceId, vibe = "contemporary", paletteHexes = PALETTE) =>
  selectBriefImages({ vibe, paletteHexes, spaceId, count: 12, variety: 1 });

const urlsOf = (b) =>
  Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v.map((p) => p.imageUrl)]));
const flat = (b) => Object.values(urlsOf(b)).flat();

let failures = 0;

console.log("A. WITHIN ONE BRIEF — the same image under two headings\n");
let repeats = 0;
for (const spaceId of INDUSTRIES) {
  const b = urlsOf(brief(spaceId));
  const all = Object.values(b).flat();
  const dup = all.length - new Set(all).size;
  repeats += dup;
  if (dup > 0) {
    const where = new Map();
    for (const [cat, urls] of Object.entries(b)) {
      for (const u of urls) where.set(u, (where.get(u) ?? []).concat(cat));
    }
    console.log(`  ${spaceId.padEnd(18)} ${dup} repeated`);
    [...where.values()]
      .filter((c) => c.length > 1)
      .slice(0, 3)
      .forEach((c) => console.log(`      one image in: ${c.join(" + ")}`));
  }
}
if (repeats === 0) {
  console.log("  0 across all 11 project types — every section draws its own images.");
} else {
  console.log(`\n  FAIL: ${repeats} repeats. selectBriefImages should make this impossible.`);
  failures++;
}

console.log("\nB. TWO BRIEFS, SAME PROJECT TYPE, different vibe + palette\n");
for (const spaceId of INDUSTRIES) {
  const a = new Set(flat(brief(spaceId, "japandi", ["#2a2a28", "#d2cec5"])));
  const b = flat(brief(spaceId, "art deco", ["#7b5a3c", "#c8512a"]));
  const pct = Math.round((b.filter((u) => a.has(u)).length / b.length) * 100);
  console.log(`  ${spaceId.padEnd(18)} ${pct}% of the second brief repeats the first`);
}

console.log("\nC. TWO BRIEFS, DIFFERENT PROJECT TYPES\n");
const briefs = INDUSTRIES.map((i) => urlsOf(brief(i)));
const cats = Object.keys(briefs[0]);
for (const cat of cats) {
  let pairs = 0;
  let shared = 0;
  for (let x = 0; x < briefs.length; x++) {
    for (let y = x + 1; y < briefs.length; y++) {
      const A = new Set(briefs[x][cat]);
      const B = briefs[y][cat];
      if (!B.length) continue;
      shared += B.filter((u) => A.has(u)).length / B.length;
      pairs++;
    }
  }
  console.log(
    `  ${cat.padEnd(12)} ${Math.round((shared / pairs) * 100)}% shared between any two project types`,
  );
}

console.log(`
  A is a code guarantee and must read 0.
  B and C are library size. They fall when there are more images to choose
  from, not when the ranking changes — see scripts/audit-relevance.mjs for the
  supply numbers behind them.`);

process.exit(failures);
