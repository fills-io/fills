/**
 * Auto-select real reference images per category for the Quick flow.
 *
 * Quick does not GENERATE images — it picks real ones, the way a designer
 * pulling a reference sheet would. Two things make a pick good:
 *
 *   1. It is about this STEP (a lighting shot on the lighting step).
 *   2. It belongs to this PROJECT (a hotel-lobby shot for a hotel lobby, not a
 *      generic living-room sofa).
 *
 * The old version only had (1), and only loosely: it ranked a single generic
 * per-category pool by colour, so a hotel lobby and a dental clinic got the
 * same sofas. Now we blend two sources —
 *
 *   • the CATEGORY pool (close-ups: actual lighting, flooring, materials), and
 *   • the INDUSTRY pool (real rooms of this project type, filtered to pins
 *     whose text actually mentions this category)
 *
 * — score both on style match + palette proximity, and interleave them, so a
 * step shows both "here is the detail" and "here is how it reads in a room of
 * your type". Everything is passed through the junk filter first, so product
 * listings and text-overlay graphics can never reach a brief.
 */

import { CURATED_PINS, CURATED_VIBE, type CuratedPin } from "@/data/reference-images";
import { categoryAffinity, isUsableReference } from "@/lib/image-quality";

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function dist2(a: number[], b: number[]): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

/** Max squared RGB distance, for normalising colour scores to 0..1. */
const MAX_DIST = 255 * 255 * 3;

function styleMatches(pinStyle: string | undefined, vibe: string): number {
  if (!vibe || !pinStyle) return 0;
  const s = pinStyle.toLowerCase();
  const v = vibe.toLowerCase();
  if (s === v) return 1;
  if (v.includes(s) || s.includes(v)) return 0.7;
  return 0;
}

type Scored = { pin: CuratedPin; score: number };

/** Rank a pool: higher is better. Colour is the tie-breaker, not the driver. */
function rank(
  pool: CuratedPin[],
  opts: {
    vibe: string;
    paletteRgb: [number, number, number][];
    category: string;
    useAffinity: boolean;
  },
): Scored[] {
  return pool
    .map((pin) => {
      const rgb = hexToRgb(pin.dominantColor);
      const colour =
        rgb && opts.paletteRgb.length
          ? 1 - Math.min(...opts.paletteRgb.map((p) => dist2(p, rgb))) / MAX_DIST
          : 0.5;
      const style = styleMatches(pin.style, opts.vibe);
      const affinity = opts.useAffinity
        ? Math.min(categoryAffinity(pin, opts.category), 3) / 3
        : 0;
      // Relevance first (is it about this step / this style), colour last.
      const score = affinity * 3 + style * 2 + colour * 1;
      return { pin, score };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * The full ranked pool for a category — clean images only, most relevant first,
 * blending category close-ups with rooms of this project type. Used by the
 * manual pickers (Full Studio) so their grids are project-aware too.
 */
export function buildCategoryPool(
  category: string,
  opts: { vibe?: string; paletteHexes?: string[]; spaceId?: string | null },
): CuratedPin[] {
  const vibe = (opts.vibe ?? "").trim().toLowerCase();
  const paletteRgb = (opts.paletteHexes ?? [])
    .map(hexToRgb)
    .filter((c): c is [number, number, number] => c !== null);

  const categoryPool = (CURATED_PINS[category] ?? []).filter(isUsableReference);
  const industryPool = (opts.spaceId ? CURATED_VIBE[opts.spaceId] ?? [] : [])
    .filter(isUsableReference)
    .filter((p) => categoryAffinity(p, category) > 0);

  const rankedCategory = rank(categoryPool, {
    vibe,
    paletteRgb,
    category,
    useAffinity: false,
  });
  const rankedIndustry = rank(industryPool, {
    vibe,
    paletteRgb,
    category,
    useAffinity: true,
  });

  const out: CuratedPin[] = [];
  const seen = new Set<string>();
  const push = (p?: CuratedPin) => {
    if (!p || seen.has(p.imageUrl)) return;
    seen.add(p.imageUrl);
    out.push(p);
  };
  const max = Math.max(rankedCategory.length, rankedIndustry.length);
  for (let k = 0; k < max; k++) {
    push(rankedCategory[k]?.pin);
    push(rankedIndustry[k]?.pin);
  }
  return out.length > 0 ? out : CURATED_PINS[category] ?? [];
}

export type SelectOptions = {
  /** Style the user chose, e.g. "contemporary". */
  vibe?: string;
  /** The user's palette, as hex strings. */
  paletteHexes: string[];
  /** space-taxonomy industry id (e.g. "hospitality") for the contextual pool. */
  spaceId?: string | null;
  /** How many images to return. */
  count?: number;
};

/**
 * Pick `count` reference images for a category, blending category close-ups
 * with in-context rooms of the user's project type.
 */
export function selectCategoryImages(
  category: string,
  opts: SelectOptions,
): CuratedPin[] {
  const count = opts.count ?? 6;
  const vibe = (opts.vibe ?? "").trim().toLowerCase();
  const paletteRgb = opts.paletteHexes
    .map(hexToRgb)
    .filter((c): c is [number, number, number] => c !== null);

  // 1. Category close-ups (generic but precisely on-topic).
  const categoryPool = (CURATED_PINS[category] ?? []).filter(isUsableReference);

  // 2. Rooms of this project type that actually mention this category.
  const industryPoolAll = opts.spaceId ? CURATED_VIBE[opts.spaceId] ?? [] : [];
  const industryPool = industryPoolAll
    .filter(isUsableReference)
    .filter((p) => categoryAffinity(p, category) > 0);

  const rankedCategory = rank(categoryPool, {
    vibe,
    paletteRgb,
    category,
    useAffinity: false,
  });
  const rankedIndustry = rank(industryPool, {
    vibe,
    paletteRgb,
    category,
    useAffinity: true,
  });

  // Interleave: detail, context, detail, context… so the sheet reads varied.
  const out: CuratedPin[] = [];
  const seen = new Set<string>();
  const push = (p?: CuratedPin) => {
    if (!p || seen.has(p.imageUrl) || out.length >= count) return;
    seen.add(p.imageUrl);
    out.push(p);
  };

  let i = 0;
  let j = 0;
  while (out.length < count && (i < rankedCategory.length || j < rankedIndustry.length)) {
    const before = out.length;
    push(rankedCategory[i++]?.pin);
    push(rankedIndustry[j++]?.pin);
    // Both sources exhausted of new material — stop rather than spin.
    if (out.length === before && i >= rankedCategory.length && j >= rankedIndustry.length) {
      break;
    }
  }

  // Last resort: if filtering left us short, top up from the unfiltered
  // category pool so a step is never empty.
  if (out.length < count) {
    for (const p of CURATED_PINS[category] ?? []) {
      push(p);
      if (out.length >= count) break;
    }
  }

  return out;
}

/** The categories Quick auto-curates (Full Studio picks these by hand). */
export const AUTO_CATEGORIES = [
  "furniture",
  "lighting",
  "flooring",
  "ceiling",
  "materials",
] as const;
