/**
 * Picking the right Pinterest CDN variant for a slot.
 *
 * Pinterest serves the same asset at several widths off one path — /236x/,
 * /474x/, /736x/, /1200x/ — so an <img> should request the smallest variant
 * that still covers the box it lands in (times the device pixel ratio).
 *
 * Every call site used to inline `url.replace("/736x/", "/236x/")`. That did
 * nothing at all to the curated set, whose URLs are stored at /474x/, so a
 * grid that asked for a small thumbnail silently got a large one and no grid
 * could ever ask for something BIGGER than what was stored. Matching any
 * width segment makes the request actually follow the slot.
 *
 * Display only: pin objects keep their stored `imageUrl`, which is what the
 * PDF export upscales to /1200x/.
 */

/** The widths Pinterest's CDN serves off a single asset path. */
export type PinWidth = 236 | 474 | 736 | 1200;

/** Matches the `/474x/` style width segment in a Pinterest CDN path. */
const WIDTH_SEGMENT = /\/\d+x\//;

/** The same image at a different CDN width. Non-Pinterest URLs pass through. */
export function pinAt(url: string, width: PinWidth): string {
  return url.replace(WIDTH_SEGMENT, `/${width}x/`);
}

/** As `pinAt`, for the optional `imageThumbUrl` fallbacks. */
export function pinAtOrUndefined(
  url: string | undefined,
  width: PinWidth,
): string | undefined {
  return url === undefined ? undefined : pinAt(url, width);
}

/**
 * A `srcset` across variants, for slots whose width lands on a different
 * variant at phone size than on a desktop retina screen. Returns undefined
 * for URLs with no width segment so React drops the attribute rather than
 * offering the browser the same file under several widths.
 */
export function pinSrcSet(
  url: string | undefined,
  widths: PinWidth[],
): string | undefined {
  if (!url || !WIDTH_SEGMENT.test(url)) return undefined;
  return widths.map((w) => `${pinAt(url, w)} ${w}w`).join(", ");
}
