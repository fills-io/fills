/**
 * Auto-select real reference images per category for the Quick flow.
 *
 * Instead of GENERATING images, Quick picks real scraped/curated pins from each
 * category pool (furniture, lighting, …) — the same source Full Studio uses —
 * ranked by how well they match the user's vibe style and their palette
 * colours. Deterministic, instant, free: the AI already produced the palette
 * and vibe; this ranks the library against them.
 */

import { CURATED_PINS, type CuratedPin } from "@/data/reference-images";

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function dist(a: number[], b: number[]): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

/** Pick `count` reference images for a category, ranked by style + palette fit. */
export function selectCategoryImages(
  category: string,
  opts: { vibe?: string; paletteHexes: string[]; count?: number },
): CuratedPin[] {
  const pool = CURATED_PINS[category] ?? [];
  if (pool.length === 0) return [];
  const count = opts.count ?? 6;
  const vibe = (opts.vibe ?? "").trim().toLowerCase();
  const paletteRgb = opts.paletteHexes
    .map(hexToRgb)
    .filter((c): c is [number, number, number] => c !== null);

  const scored = pool
    .map((p) => {
      // Colour: distance to the nearest palette colour (lower = better).
      const rgb = hexToRgb(p.dominantColor);
      const colorDist =
        rgb && paletteRgb.length
          ? Math.min(...paletteRgb.map((pr) => dist(pr, rgb)))
          : 200_000;
      // Style: a strong boost when the pin's style matches the vibe.
      const style = (p.style ?? "").toLowerCase();
      const styleMatch =
        vibe && style && (style === vibe || vibe.includes(style) || style.includes(vibe))
          ? 1
          : 0;
      // Style dominates; colour breaks ties.
      return { p, score: colorDist - styleMatch * 40_000 };
    })
    .sort((a, b) => a.score - b.score);

  const seen = new Set<string>();
  const out: CuratedPin[] = [];
  for (const s of scored) {
    if (!seen.has(s.p.imageUrl)) {
      seen.add(s.p.imageUrl);
      out.push(s.p);
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
