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
import {
  categoryAffinity,
  hasCategoryKeywords,
  isUsableReference,
} from "@/lib/image-quality";
import type { PinterestPin } from "@/db/schema";

/**
 * The industry pool for one category: rooms of the user's project type, kept
 * only where they are about this step.
 *
 * The `hasCategoryKeywords` guard is load-bearing. "vibe" has no keyword list,
 * because every pin in an industry pool is already a room of that project type
 * and there is nothing to narrow — but `categoryAffinity` returns 0 for a
 * category it has no words for, so a bare `> 0` filter deleted the ENTIRE pool
 * for exactly the section that needed it most. Measured before this guard: 0
 * industry pins for residential (of 145 usable), 0 for hospitality (of 144), 0
 * for retail (of 171). Every mood board and every deck cover in the product
 * came from the same 17 generic images whether the user was briefing a hotel
 * lobby or a dental clinic.
 */
function industryPoolFor(category: string, spaceId?: string | null): CuratedPin[] {
  const base = (spaceId ? CURATED_VIBE[spaceId] ?? [] : []).filter(
    isUsableReference,
  );
  if (!hasCategoryKeywords(category)) return base;
  return base.filter((p) => categoryAffinity(p, category) > 0);
}

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

/** Words that carry no signal about what a picture shows. */
const FOCUS_STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "for", "with", "of", "in", "on",
  "design", "designs", "idea", "ideas", "modern", "luxury", "style",
]);

/**
 * Words a category is also known by, where the obvious one doesn't appear in
 * the pins. "Shelving" matched nothing at all; people photograph bookshelves.
 */
const FOCUS_SYNONYMS: Record<string, string[]> = {
  shelving: ["shelf", "shelves", "bookshelf", "bookcase", "shelving"],
  storage: ["storage", "cabinet", "cupboard", "sideboard", "credenza"],
  screens: ["screen", "partition", "divider", "room divider"],
  nightstands: ["nightstand", "bedside"],
  wardrobe: ["wardrobe", "closet", "armoire"],
  banquette: ["banquette", "booth", "bench seating"],
  seating: ["seating", "sofa", "chair", "settee"],
  rugs: ["rug", "carpet"],
};

/**
 * Build one matcher per meaningful word in a sub-section name.
 *
 * Matching is on WORD BOUNDARIES, not substrings: a plain `includes("table")`
 * scored "Cotton sofa suitable for living room" as a coffee table, which is
 * how the picker ended up offering sofas on the Coffee table step.
 */
function focusMatchers(focus: string | undefined): RegExp[] {
  if (!focus) return [];
  const words = focus
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length > 2 && !FOCUS_STOPWORDS.has(w));

  return words.map((w) => {
    const alts = FOCUS_SYNONYMS[w] ?? [w.replace(/s$/, "")];
    const escaped = alts.map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    // Allow a plural on any alternative: chair -> chair/chairs.
    return new RegExp(`\\b(?:${escaped.join("|")})(?:s|es)?\\b`, "i");
  });
}

/** How many of the focus words this pin's text actually names. */
function focusScore(pin: CuratedPin, matchers: RegExp[]): number {
  if (matchers.length === 0) return 0;
  const hay = `${pin.title ?? ""} ${pin.style ?? ""}`;
  let hits = 0;
  for (const m of matchers) if (m.test(hay)) hits++;
  return hits;
}

/**
 * Narrow a pool to what a sub-section is actually about.
 *
 * Every furniture sub-section asked for the same generic "furniture" pool, so
 * the Coffee table step and the Sofa step showed the identical set of living
 * rooms — the picker was asking the user to choose a coffee table from photos
 * that mostly had none. Pins naming the thing come first; if too few name it,
 * the rest of the pool follows rather than leaving the grid empty.
 */
function applyFocus(pool: CuratedPin[], focus: string | undefined): CuratedPin[] {
  const matchers = focusMatchers(focus);
  if (matchers.length === 0) return pool;
  // Pins naming every word beat pins naming one; the remainder keeps its
  // existing (already project- and palette-ranked) order behind them.
  const scored = pool.map((pin) => ({ pin, hits: focusScore(pin, matchers) }));
  const named = scored
    .filter((s) => s.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .map((s) => s.pin);
  const rest = scored.filter((s) => s.hits === 0).map((s) => s.pin);
  return [...named, ...rest];
}

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
  opts: {
    vibe?: string;
    paletteHexes?: string[];
    spaceId?: string | null;
    /** What this particular grid is for, e.g. a furniture sub-section name
     *  like "Coffee table". Pins that name it are shown first. */
    focus?: string;
  },
): CuratedPin[] {
  const vibe = (opts.vibe ?? "").trim().toLowerCase();
  const paletteRgb = (opts.paletteHexes ?? [])
    .map(hexToRgb)
    .filter((c): c is [number, number, number] => c !== null);

  const categoryPool = (CURATED_PINS[category] ?? []).filter(isUsableReference);
  const industryPool = industryPoolFor(category, opts.spaceId);

  const rankedCategory = rank(categoryPool, {
    vibe,
    paletteRgb,
    category,
    // Score, don't filter. Roughly 40% of close-ups are untitled, so a hard
    // filter would delete pins that are probably fine; scoring just sinks the
    // off-topic ones instead of letting dominant colour decide the order.
    useAffinity: true,
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
  // If the blend produced nothing, fall back to the category pool — still
  // FILTERED. Falling back to the raw pool was how ad pins reached the picker.
  const blended =
    out.length > 0 ? out : (CURATED_PINS[category] ?? []).filter(isUsableReference);
  return applyFocus(blended, opts.focus);
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
  /** Narrow the result to a sub-topic, e.g. "Coffee table". */
  focus?: string;
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

  // 2. Rooms of this project type that are about this category.
  const industryPool = industryPoolFor(category, opts.spaceId);

  const rankedCategory = rank(categoryPool, {
    vibe,
    paletteRgb,
    category,
    // See the note in buildCategoryPool: score the close-ups, never filter them.
    useAffinity: true,
  });
  const rankedIndustry = rank(industryPool, {
    vibe,
    paletteRgb,
    category,
    useAffinity: true,
  });

  // Pins that name the sub-topic come first within each source, so a focused
  // request ("Coffee table") is answered with coffee tables where they exist.
  const focused = (list: Scored[]) =>
    applyFocus(list.map((x) => x.pin), opts.focus);
  const focusedCategory = focused(rankedCategory);
  const focusedIndustry = focused(rankedIndustry);

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
  while (out.length < count && (i < focusedCategory.length || j < focusedIndustry.length)) {
    const before = out.length;
    push(focusedCategory[i++]);
    push(focusedIndustry[j++]);
    // Both sources exhausted of new material — stop rather than spin.
    if (out.length === before && i >= focusedCategory.length && j >= focusedIndustry.length) {
      break;
    }
  }

  // NO CROSS-CATEGORY TOP-UP. A short section is returned short.
  //
  // There used to be a fallback here that borrowed from OTHER categories'
  // close-ups whenever this one came up short. It fired for flooring in ten of
  // eleven industries, and because it admitted anything whose text matched the
  // category, what it borrowed was lamps: a retail flooring spread shipped with
  // "Derosier Floor Lamp", "Burgundy Mid-Century Modern Arched Floor Lamp" and
  // "Cozy Living Room: Tall Floor Lamp Glow" on it. That is the whole of the
  // "images aren't relevant to the category" complaint, in one loop.
  //
  // The earlier comment here already had the right principle and stopped one
  // step short of applying it: returning fewer, clean images is always better
  // than filling the count. Seven flooring photographs beat twelve with four
  // lamps among them, and BriefDisplay/BriefPDF both handle a short list.
  return out;
}

/**
 * A curated reference in the shape the rest of the app stores picks in.
 *
 * Curated pins have no source page, so the image itself is the link — that is
 * what the brief's thumbnails open. Keep `imageUrl` at full resolution: the PDF
 * export reads it directly and needs the large original, not a thumbnail.
 */
export function toPin(c: CuratedPin): PinterestPin {
  return {
    id: c.id,
    url: c.imageUrl,
    title: c.title,
    description: "",
    altText: c.title,
    imageUrl: c.imageUrl,
    imageThumbUrl: c.imageUrl,
    dominantColor: c.dominantColor,
    boardName: "",
    boardUrl: "",
  };
}

/** The categories Quick auto-curates (Full Studio picks these by hand). */
export const AUTO_CATEGORIES = [
  "furniture",
  "lighting",
  "flooring",
  "ceiling",
  "materials",
] as const;
