// Build a curated, committed reference-image set per category by hitting the
// production Pinterest API ONCE. The app then reads the generated static file
// (src/data/reference-images.ts) instead of scraping live every session — which
// kills load lag and per-session Apify charges. Regenerate to refresh the set.
//
// Run: node scripts/build-refs.mjs src/data/reference-images.ts
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const BASE = "https://www.fills.io/api/pinterest/search";

// Each category pulls from several distinct queries so the set has genuine
// variety (different styles/moods), not near-duplicates.
const CATEGORIES = {
  space: [
    "interior design moodboard",
    "modern living room interior",
    "bedroom interior design",
  ],
  vibe: [
    "warm minimalist interior",
    "japandi interior design",
    "mid century modern living room",
    "industrial loft interior",
    "scandinavian interior design",
    "coastal interior design",
    "art deco interior",
    "rustic farmhouse interior",
  ],
  furniture: [
    "furniture interior design",
    "designer lounge chair",
    "modern sofa interior",
  ],
  lighting: [
    "interior lighting design",
    "pendant lighting interior",
    "floor lamp interior",
  ],
  flooring: [
    "wood flooring interior",
    "herringbone floor",
    "stone tile floor interior",
  ],
  ceiling: ["ceiling design interior", "wood slat ceiling", "coffered ceiling"],
  materials: [
    "interior materials texture",
    "marble texture interior",
    "wood grain texture",
  ],
  review: ["interior moodboard editorial", "interior design flat lay"],
};

async function fetchQuery(q) {
  try {
    const r = await fetch(`${BASE}?q=${encodeURIComponent(q)}&limit=12`);
    const d = await r.json();
    if (!Array.isArray(d.pins)) return [];
    return d.pins.map((p) => p.imageUrl).filter(Boolean);
  } catch {
    return [];
  }
}

const out = {};
await Promise.all(
  Object.entries(CATEGORIES).map(async ([cat, queries]) => {
    const lists = await Promise.all(queries.map(fetchQuery));
    // Round-robin interleave across queries so the set alternates styles.
    const seen = new Set();
    const merged = [];
    let i = 0;
    let added = true;
    while (added) {
      added = false;
      for (const list of lists) {
        if (i < list.length) {
          added = true;
          const u = list[i];
          if (u && !seen.has(u)) {
            seen.add(u);
            merged.push(u);
          }
        }
      }
      i++;
    }
    out[cat] = merged.slice(0, 24);
  }),
);

const outPath = process.argv[2] || "src/data/reference-images.ts";
mkdirSync(dirname(outPath), { recursive: true });

const header = `// AUTO-GENERATED — curated reference images per category.
// Built once from the Pinterest scraper (scripts/build-refs.mjs) so the app never
// scrapes live per session: no load lag, no per-session Apify cost. The same set
// is reused for every user/session. Regenerate to refresh.

`;
const body = `export const REFERENCE_IMAGES: Record<string, string[]> = ${JSON.stringify(
  out,
  null,
  2,
)};

export type ReferenceCategory = keyof typeof REFERENCE_IMAGES;
`;
writeFileSync(outPath, header + body);
console.log(
  "wrote",
  outPath,
  "->",
  Object.entries(out)
    .map(([k, v]) => `${k}:${v.length}`)
    .join(" "),
);
