// Build a curated, committed reference-image set per category by hitting the
// production Pinterest API ONCE. The app reads the generated static file
// (src/data/reference-images.ts) instead of scraping live every session — which
// kills load lag and per-session Apify charges. Regenerate to refresh the set.
//
// Each pin keeps its id/title/dominantColor (for the palette step) and a
// `style` tag (the query family it came from) so the Vibe step can adapt:
// once the user picks a pin, similar-style pins get surfaced first.
//
// Run: node scripts/build-refs.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const BASE = "https://www.fills.io/api/pinterest/search";

// Each category pulls from several distinct queries so the set has genuine
// variety (different styles/moods), not near-duplicates. The key of each
// entry becomes the pin's `style` tag.
const CATEGORIES = {
  space: {
    moodboard: "interior design moodboard",
    "living room": "modern living room interior",
    bedroom: "bedroom interior design",
  },
  vibe: {
    "warm minimalism": "warm minimalist interior",
    japandi: "japandi interior design",
    "mid-century modern": "mid century modern living room",
    "industrial loft": "industrial loft interior",
    scandinavian: "scandinavian interior design",
    coastal: "coastal interior design",
    "art deco": "art deco interior",
    "rustic farmhouse": "rustic farmhouse interior",
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

// Vibe powers the adaptive picker, so it gets a deeper pool.
const CAP = { vibe: 64 };
const DEFAULT_CAP = 24;

async function fetchQuery(style, q) {
  try {
    const r = await fetch(`${BASE}?q=${encodeURIComponent(q)}&limit=12`);
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

const out = {};
await Promise.all(
  Object.entries(CATEGORIES).map(async ([cat, styles]) => {
    const lists = await Promise.all(
      Object.entries(styles).map(([style, q]) => fetchQuery(style, q)),
    );
    // Round-robin interleave across styles so the set alternates moods.
    const seen = new Set();
    const merged = [];
    let i = 0;
    let added = true;
    while (added) {
      added = false;
      for (const list of lists) {
        if (i < list.length) {
          added = true;
          const p = list[i];
          if (p.imageUrl && !seen.has(p.imageUrl)) {
            seen.add(p.imageUrl);
            merged.push(p);
          }
        }
      }
      i++;
    }
    out[cat] = merged.slice(0, CAP[cat] ?? DEFAULT_CAP);
  }),
);

const outPath = process.argv[2] || "src/data/reference-images.ts";
mkdirSync(dirname(outPath), { recursive: true });

const file = `// AUTO-GENERATED — curated reference images per category.
// Built once from the Pinterest scraper (scripts/build-refs.mjs) so the app never
// scrapes live per session: no load lag, no per-session Apify cost. The same set
// is reused for every user/session. Regenerate to refresh.

export type CuratedPin = {
  id: string;
  title: string;
  imageUrl: string;
  dominantColor: string;
  /** The style family this pin came from — drives the adaptive vibe picker. */
  style: string;
};

export const CURATED_PINS: Record<string, CuratedPin[]> = ${JSON.stringify(out, null, 2)};

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
  "->",
  Object.entries(out)
    .map(([k, v]) => `${k}:${v.length}`)
    .join(" "),
);
