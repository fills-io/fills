/**
 * Measure how ON-TOPIC and how PROJECT-SPECIFIC the reference pools are.
 *
 * The founder's report was "for furniture and lighting and flooring, images
 * are not relevant to the category". This turns that into numbers so a change
 * can be shown to help rather than argued about.
 *
 * It runs the REAL selection pipeline through jiti, so it cannot drift away
 * from what the app actually serves. Three things are reported per category:
 *
 *   supply/demand  clean pins available ÷ pins requested. At ~1:1 the ranker
 *                  has no choices to make and simply emits its pool, so no
 *                  amount of scoring tuning can help — only more images can.
 *   off-topic      pins delivered whose text never names the category
 *   overlap        how alike two different industries' results are. 100% means
 *                  a dental clinic and a hotel lobby get the same pictures.
 *
 * Run:  node scripts/audit-relevance.mjs
 *       node scripts/audit-relevance.mjs --want 12
 */

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const require_ = createRequire(import.meta.url);

/**
 * jiti arrives as a transitive dependency of next, so pnpm leaves it inside
 * .pnpm rather than hoisting it to node_modules/jiti. Resolve it through a
 * package that DOES depend on it instead of guessing a version-stamped path.
 */
function loadJiti() {
  try {
    return require_("jiti");
  } catch {
    const fromNext = createRequire(require_.resolve("next/package.json"));
    return fromNext("jiti");
  }
}
const { createJiti } = loadJiti();
const jiti = createJiti(import.meta.url, { alias: { "@": join(root, "src") } });

const { selectCategoryImages, AUTO_CATEGORIES } = await jiti.import(
  join(root, "src/lib/select-images.ts"),
);
const { CATEGORY_KEYWORDS, categoryAffinity, isUsableReference } =
  await jiti.import(join(root, "src/lib/image-quality.ts"));
const { CURATED_PINS, CURATED_VIBE } = await jiti.import(
  join(root, "src/data/reference-images.ts"),
);

function readWant() {
  const eq = process.argv.find((a) => a.startsWith("--want="));
  if (eq) return Number(eq.slice("--want=".length));
  const i = process.argv.indexOf("--want");
  if (i !== -1 && process.argv[i + 1]) return Number(process.argv[i + 1]);
  return 12; // what QuickCanvas asks for
}
const WANT = readWant();

/** A representative request, so every category is measured the same way. */
const PALETTE = ["#c8512a", "#f4f2ec", "#2a2a28", "#8d6649"];
const VIBE = "contemporary";
const INDUSTRIES = Object.keys(CURATED_VIBE);
const CATEGORIES = [...AUTO_CATEGORIES, "vibe"];

console.log(
  `Reference-pool audit — real pipeline, ${INDUSTRIES.length} industries, ` +
    `${WANT} images requested per section\n`,
);
console.log(
  "category".padEnd(11) +
    "clean".padEnd(7) +
    "supply".padEnd(17) +
    "delivered".padEnd(11) +
    "off-topic".padEnd(15) +
    "overlap",
);
console.log("-".repeat(70));

const summary = [];

for (const category of CATEGORIES) {
  const closeUps = (CURATED_PINS[category] ?? []).filter(isUsableReference).length;

  const perIndustry = INDUSTRIES.map((spaceId) => {
    const industryClean = (CURATED_VIBE[spaceId] ?? []).filter(isUsableReference);
    const onTopic = CATEGORY_KEYWORDS[category]
      ? industryClean.filter((p) => categoryAffinity(p, category) > 0).length
      : industryClean.length;
    const got = selectCategoryImages(category, {
      vibe: VIBE,
      paletteHexes: PALETTE,
      spaceId,
      count: WANT,
    });
    return { spaceId, supply: closeUps + onTopic, got };
  });

  const delivered = perIndustry.reduce((n, r) => n + r.got.length, 0);
  const wanted = perIndustry.length * WANT;
  const supply = Math.round(
    (perIndustry.reduce((n, r) => n + r.supply, 0) / perIndustry.length) * 10,
  ) / 10;

  // Off-topic: delivered pins whose text never names this category. Untitled
  // pins are excluded — they carry no signal either way, so counting them as
  // failures would punish the pool for missing metadata.
  //
  // CAVEAT when comparing runs across a code change: this uses whichever
  // categoryAffinity is currently compiled, so it is a self-consistent score,
  // not a fixed yardstick. Under the old substring matcher "Derosier Floor
  // Lamp" scored as ON-topic for flooring because it contains "floor", so the
  // old run reported 0% while shipping lamps. Read `delivered` alongside it:
  // a drop there is the pipeline refusing to pad a short section.
  let titled = 0;
  let offTopic = 0;
  for (const { got } of perIndustry) {
    for (const pin of got) {
      if (!pin.title?.trim()) continue;
      titled++;
      if (CATEGORY_KEYWORDS[category] && categoryAffinity(pin, category) === 0) {
        offTopic++;
      }
    }
  }

  // Overlap: mean share of images two different industries have in common.
  let pairs = 0;
  let shared = 0;
  for (let a = 0; a < perIndustry.length; a++) {
    for (let b = a + 1; b < perIndustry.length; b++) {
      const A = new Set(perIndustry[a].got.map((p) => p.imageUrl));
      const common = perIndustry[b].got.filter((p) => A.has(p.imageUrl)).length;
      shared += common / Math.max(1, perIndustry[b].got.length);
      pairs++;
    }
  }
  const overlap = pairs ? Math.round((shared / pairs) * 100) : 0;
  const ratio = (supply / WANT).toFixed(2);
  const offPct = titled ? Math.round((offTopic / titled) * 100) : 0;

  summary.push({ category, ratio: Number(ratio), overlap, offPct });

  console.log(
    category.padEnd(11) +
      String(closeUps).padEnd(7) +
      `${supply} (${ratio}:1)`.padEnd(17) +
      `${delivered}/${wanted}`.padEnd(11) +
      `${offTopic}/${titled} (${offPct}%)`.padEnd(15) +
      `${overlap}%`,
  );
}

console.log(`
  clean      close-up pins surviving the junk filter (shared by every project type)
  supply     clean close-ups + on-topic industry pins, averaged over industries
  supply:1   how much choice the ranker has. Below ~2:1 it emits its whole pool
             and no scoring change can matter — only more images can.
  delivered  how many of the requested images the pipeline could actually find
  off-topic  delivered TITLED pins whose text never names the category
  overlap    mean share of images any two industries have in common. High means
             a dental clinic and a hotel lobby get the same pictures.`);

const worst = summary.slice().sort((a, b) => a.ratio - b.ratio)[0];
console.log(
  `\nTightest pool: ${worst.category} at ${worst.ratio}:1. ` +
    `Mean cross-industry overlap: ` +
    `${Math.round(summary.reduce((n, s) => n + s.overlap, 0) / summary.length)}%.`,
);
