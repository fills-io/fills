// Build the curated, committed reference-image sets by hitting the production
// Pinterest API ONCE. The app reads the generated static file
// (src/data/reference-images.ts) instead of scraping live every session — no
// load lag, no per-session Apify cost. Regenerate to refresh.
//
// Produces two exports:
//   CURATED_PINS  — per-step sets (space, furniture, lighting, ...) + a generic
//                   vibe fallback. Each pin keeps id/title/dominantColor + a
//                   `style` tag (its query family) for the adaptive picker.
//   CURATED_VIBE  — per-INDUSTRY vibe sets, so the Vibe step reflects the
//                   project category (restaurant vibes for F&B, office vibes for
//                   workplace, etc.), each still tagged by style mood.
//
// Run: node scripts/build-refs.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const BASE = "https://www.fills.io/api/pinterest/search";
const LIMIT = 24;
const CONCURRENCY = 10;

// Per-step sets. Each key's queries give genuine variety (distinct moods), not
// near-duplicates. The object key becomes the pin's `style` tag.
const CATEGORIES = {
  space: {
    moodboard: "interior design moodboard",
    "living room": "modern living room interior",
    bedroom: "bedroom interior design",
  },
  // Generic vibe — fallback for "Other" / unknown industry.
  vibe: {
    "warm minimalism": "warm minimalist interior",
    japandi: "japandi interior design",
    "mid-century": "mid century modern interior",
    industrial: "industrial loft interior",
    scandinavian: "scandinavian interior design",
  },
  furniture: {
    statement: "furniture interior design",
    seating: "designer lounge chair",
    sofa: "modern sofa interior",
  },
  lighting: {
    ambient: "interior lighting design",
    pendant: "pendant lighting interior",
    floor: "floor lamp interior",
  },
  flooring: {
    wood: "wood flooring interior",
    herringbone: "herringbone floor",
    stone: "stone tile floor interior",
  },
  ceiling: {
    feature: "ceiling design interior",
    "wood slat": "wood slat ceiling",
    coffered: "coffered ceiling",
  },
  materials: {
    texture: "interior materials texture",
    marble: "marble texture interior",
    wood: "wood grain texture",
  },
  review: {
    editorial: "interior moodboard editorial",
    "flat lay": "interior design flat lay",
  },
};

// Per-industry vibe: base noun that anchors each query to the category.
const VIBE_NOUN = {
  residential: "living room interior",
  hospitality: "hotel lobby interior",
  "food-beverage": "restaurant interior",
  retail: "boutique store interior",
  workplace: "modern office interior",
  healthcare: "clinic interior",
  education: "modern classroom interior",
  cultural: "art gallery interior",
  "fitness-wellness": "luxury spa interior",
  "beauty-salon": "beauty salon interior",
  "real-estate": "luxury show apartment interior",
};

// Style moods layered over each industry noun (become the vibe style chips).
// These names must match the homepage vibe vocabulary (concept-taxonomy) so a
// style picked on the homepage pre-selects the matching chip in the wizard.
const VIBE_STYLES = {
  contemporary: "contemporary",
  modern: "modern",
  minimalist: "minimalist",
  scandinavian: "scandinavian",
  industrial: "industrial",
  "mid-century": "mid century modern",
  japandi: "japandi",
  luxe: "luxury elegant",
  coastal: "coastal",
  rustic: "rustic",
  bohemian: "bohemian",
  farmhouse: "farmhouse",
  "art deco": "art deco",
  mediterranean: "mediterranean",
};

const CAP = { vibeIndustry: 320, category: 30 };

async function fetchQuery(style, q) {
  try {
    const r = await fetch(`${BASE}?q=${encodeURIComponent(q)}&limit=${LIMIT}`);
    const d = await r.json();
    if (!Array.isArray(d.pins)) return [];
    return d.pins
      .filter((p) => p.imageUrl)
      .map((p) => ({
        id: String(p.id ?? ""),
        title: p.title ?? "",
        imageUrl: p.imageUrl,
        dominantColor: p.dominantColor ?? "",
        style,
      }));
  } catch {
    return [];
  }
}

/** Run tasks with a concurrency cap so we don't hammer the scraper at once. */
async function pool(limit, tasks) {
  const results = new Array(tasks.length);
  let i = 0;
  async function worker() {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await tasks[idx]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

/** Round-robin interleave across style lists, dedup by URL, cap the total. */
function interleave(lists, cap) {
  const seen = new Set();
  const out = [];
  let i = 0;
  let added = true;
  while (added && out.length < cap) {
    added = false;
    for (const list of lists) {
      if (i < list.length) {
        added = true;
        const p = list[i];
        if (p.imageUrl && !seen.has(p.imageUrl)) {
          seen.add(p.imageUrl);
          out.push(p);
        }
      }
    }
    i++;
  }
  return out.slice(0, cap);
}

// Flatten every query into a single task list, then run with a concurrency cap.
const jobs = [];
for (const [cat, styles] of Object.entries(CATEGORIES)) {
  for (const [style, q] of Object.entries(styles)) {
    jobs.push({ kind: "category", cat, style, q });
  }
}
for (const [ind, noun] of Object.entries(VIBE_NOUN)) {
  for (const [style, frag] of Object.entries(VIBE_STYLES)) {
    jobs.push({ kind: "vibe", ind, style, q: `${frag} ${noun}` });
  }
}

console.log(`fetching ${jobs.length} queries (concurrency ${CONCURRENCY})…`);
const fetched = await pool(
  CONCURRENCY,
  jobs.map((j) => () => fetchQuery(j.style, j.q)),
);

// Regroup results.
const catLists = {};
const vibeLists = {};
jobs.forEach((j, idx) => {
  const pins = fetched[idx] ?? [];
  if (j.kind === "category") {
    (catLists[j.cat] ??= []).push(pins);
  } else {
    (vibeLists[j.ind] ??= []).push(pins);
  }
});

const CURATED_PINS = {};
for (const [cat, lists] of Object.entries(catLists)) {
  CURATED_PINS[cat] = interleave(lists, CAP.category);
}
const CURATED_VIBE = {};
for (const [ind, lists] of Object.entries(vibeLists)) {
  CURATED_VIBE[ind] = interleave(lists, CAP.vibeIndustry);
}

const outPath = process.argv[2] || "src/data/reference-images.ts";
mkdirSync(dirname(outPath), { recursive: true });

const file = `// AUTO-GENERATED — curated reference images. Built once from the Pinterest
// scraper (scripts/build-refs.mjs) so the app never scrapes live per session:
// no load lag, no per-session Apify cost. The same sets are reused for every
// user/session. Regenerate to refresh.

export type CuratedPin = {
  id: string;
  title: string;
  imageUrl: string;
  dominantColor: string;
  /** The style/mood family this pin came from — drives the adaptive picker. */
  style: string;
};

/** Per-step reference sets (space, furniture, lighting, ...) + generic vibe. */
export const CURATED_PINS: Record<string, CuratedPin[]> = ${JSON.stringify(CURATED_PINS, null, 2)};

/** Per-industry vibe sets so the Vibe step reflects the project category. */
export const CURATED_VIBE: Record<string, CuratedPin[]> = ${JSON.stringify(CURATED_VIBE, null, 2)};

/** Flat per-category URL lists (used by the homepage Full Studio demo). */
export const REFERENCE_IMAGES: Record<string, string[]> = Object.fromEntries(
  Object.entries(CURATED_PINS).map(([k, pins]) => [
    k,
    pins.map((p) => p.imageUrl),
  ]),
);
`;
writeFileSync(outPath, file);
console.log(
  "wrote",
  outPath,
  "\n  categories:",
  Object.entries(CURATED_PINS).map(([k, v]) => `${k}:${v.length}`).join(" "),
  "\n  vibe/industry:",
  Object.entries(CURATED_VIBE).map(([k, v]) => `${k}:${v.length}`).join(" "),
);
