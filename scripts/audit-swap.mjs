/**
 * How many alternatives does the swap picker actually have to offer?
 *
 * A finished brief already holds the best 12 of each category, and the pools
 * are 7-23 deep, so the narrow pickers used elsewhere leave almost nothing.
 * This measures what buildSwapPool has left once the brief's own picks are
 * excluded, across every industry. A zero here is an empty panel in the UI.
 *
 * Run: node scripts/audit-swap.mjs
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

const { selectCategoryImages, buildSwapPool, buildCategoryPool, AUTO_CATEGORIES } =
  await jiti.import(join(root, "src/lib/select-images.ts"));
const { CURATED_VIBE } = await jiti.import(join(root, "src/data/reference-images.ts"));

const PALETTE = ["#c8512a", "#f4f2ec", "#2a2a28", "#8d6649"];
const INDUSTRIES = Object.keys(CURATED_VIBE);

console.log("Alternatives left after excluding the brief's own 12\n");
console.log("category".padEnd(11) + "narrow pool (today)".padEnd(24) + "swap pool");
console.log("-".repeat(58));

for (const cat of AUTO_CATEGORIES) {
  const narrow = [];
  const wide = [];
  for (const spaceId of INDUSTRIES) {
    const opts = { vibe: "contemporary", paletteHexes: PALETTE, spaceId };
    const inBrief = new Set(
      selectCategoryImages(cat, { ...opts, count: 12 }).map((p) => p.imageUrl),
    );
    narrow.push(buildCategoryPool(cat, opts).filter((c) => !inBrief.has(c.imageUrl)).length);
    wide.push(buildSwapPool(cat, opts).filter((c) => !inBrief.has(c.imageUrl)).length);
  }
  const span = (a) => `${Math.min(...a)}-${Math.max(...a)}`;
  const empties = narrow.filter((n) => n === 0).length;
  console.log(
    cat.padEnd(11) +
      `${span(narrow)}  (${empties}/${INDUSTRIES.length} empty)`.padEnd(24) +
      span(wide),
  );
}
