/**
 * Client-side colour extraction.
 *
 * Given a handful of image URLs (the vibe pins the user picked), pull a small
 * palette of real colours OUT of the actual pixels — not just one dominant
 * colour per image. We draw each image (downscaled) to an offscreen canvas,
 * read the pixels, pool them across all images, and run a classic median-cut
 * quantization to `count` representative colours.
 *
 * Pinterest images are served cross-origin, which would taint the canvas and
 * block getImageData(). We route them through our own `/api/img` proxy so the
 * draw is same-origin and the pixels are readable. No paid scraper, no native
 * dependency — the browser does the decoding for free.
 */

type RGB = [number, number, number];

/** Downscale target — small is plenty for colour, and keeps median-cut fast. */
const SAMPLE_SIZE = 44;

/** Route Pinterest CDN images through our same-origin proxy; leave others. */
function proxied(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === "pinimg.com" || u.hostname.endsWith(".pinimg.com")) {
      return `/api/img?url=${encodeURIComponent(url)}`;
    }
  } catch {
    /* fall through — return as-is */
  }
  return url;
}

/** Load an image and return its downscaled pixels, or null on failure. */
function loadPixels(url: string): Promise<Uint8ClampedArray | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    let settled = false;
    const done = (v: Uint8ClampedArray | null) => {
      if (!settled) {
        settled = true;
        resolve(v);
      }
    };
    // Don't let one slow image hold up the whole palette.
    const timer = setTimeout(() => done(null), 8000);
    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = SAMPLE_SIZE;
        canvas.height = SAMPLE_SIZE;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return done(null);
        ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        done(ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data);
      } catch {
        done(null);
      }
    };
    img.onerror = () => {
      clearTimeout(timer);
      done(null);
    };
    img.src = proxied(url);
  });
}

/** Collect non-transparent, non-extreme pixels into a flat RGB list. */
function collect(data: Uint8ClampedArray, into: RGB[]): void {
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 200) continue; // skip transparent
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Skip near-pure white/black — usually background or shadow, not "colour".
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max > 250 && min > 250) continue;
    if (max < 8) continue;
    into.push([r, g, b]);
  }
}

/** Widest colour channel of a box, and its range. */
function widestChannel(box: RGB[]): { channel: 0 | 1 | 2; range: number } {
  const mins: RGB = [255, 255, 255];
  const maxs: RGB = [0, 0, 0];
  for (const p of box) {
    for (let c = 0; c < 3; c++) {
      if (p[c] < mins[c]) mins[c] = p[c];
      if (p[c] > maxs[c]) maxs[c] = p[c];
    }
  }
  const ranges: RGB = [maxs[0] - mins[0], maxs[1] - mins[1], maxs[2] - mins[2]];
  let channel: 0 | 1 | 2 = 0;
  if (ranges[1] > ranges[channel]) channel = 1;
  if (ranges[2] > ranges[channel]) channel = 2;
  return { channel, range: ranges[channel] };
}

/** Average colour of a box. */
function average(box: RGB[]): RGB {
  let r = 0,
    g = 0,
    b = 0;
  for (const p of box) {
    r += p[0];
    g += p[1];
    b += p[2];
  }
  const n = box.length || 1;
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

/** Median-cut quantization: split the pixel cloud into `count` colour boxes. */
function medianCut(pixels: RGB[], count: number): RGB[] {
  if (pixels.length === 0) return [];
  const boxes: RGB[][] = [pixels];
  while (boxes.length < count) {
    // Pick the box with the widest colour spread to split next.
    let target = -1;
    let best = -1;
    for (let i = 0; i < boxes.length; i++) {
      if (boxes[i].length < 2) continue;
      const { range } = widestChannel(boxes[i]);
      if (range > best) {
        best = range;
        target = i;
      }
    }
    if (target < 0) break; // nothing left to split
    const box = boxes[target];
    const { channel } = widestChannel(box);
    box.sort((a, b) => a[channel] - b[channel]);
    const mid = box.length >> 1;
    boxes.splice(target, 1, box.slice(0, mid), box.slice(mid));
  }
  return boxes.filter((b) => b.length > 0).map(average);
}

function toHex([r, g, b]: RGB): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0"))
      .join("")
  );
}

export function parseHex(hex: string): RGB | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Squared RGB distance — for nearest-colour assignment. */
function dist2(a: RGB, b: RGB): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

/** Nudge a colour lighter (t>0) or darker (t<0) by fraction t in [-1,1]. */
function shade([r, g, b]: RGB, t: number): RGB {
  const f = (v: number) =>
    t >= 0 ? v + (255 - v) * t : v * (1 + t);
  return [Math.round(f(r)), Math.round(f(g)), Math.round(f(b))];
}

/** Pad a short palette up to `count` using light/dark variants of what we have. */
function padTo(colors: RGB[], count: number): RGB[] {
  const out = [...colors];
  const deltas = [0.18, -0.18, 0.34, -0.34, 0.5, -0.5];
  let d = 0;
  while (out.length < count && colors.length > 0) {
    const base = colors[out.length % colors.length];
    out.push(shade(base, deltas[d % deltas.length]));
    d++;
  }
  return out.slice(0, count);
}

/** A palette colour plus how dominant it is (0..1 share of the image pixels). */
export type PaletteColor = { hex: string; weight: number };

/**
 * Extract `count` colours from the given image URLs, each with a `weight` = the
 * share of the image's pixels closest to it (so the bar can size each colour by
 * how dominant it actually is). Falls back to the provided `fallback` hexes if
 * the images can't be read. Always returns exactly `count` colours, most
 * dominant first.
 */
export async function extractPalette(
  urls: string[],
  count = 6,
  fallback: string[] = [],
): Promise<PaletteColor[]> {
  const pool: RGB[] = [];
  const results = await Promise.all(urls.slice(0, 8).map(loadPixels));
  for (const data of results) {
    if (data) collect(data, pool);
  }

  let colors: RGB[];
  if (pool.length >= count * 4) {
    colors = medianCut(pool, count);
  } else {
    // Not enough readable pixels — lean on the precomputed dominant colours.
    colors = fallback.map(parseHex).filter((c): c is RGB => c !== null);
    if (colors.length === 0 && pool.length > 0) colors = medianCut(pool, count);
  }

  if (colors.length === 0) {
    // Absolute last resort so the UI never shows an empty bar.
    colors = [
      [200, 168, 130],
      [240, 234, 226],
      [200, 81, 42],
      [91, 74, 58],
    ];
  }

  colors = padTo(colors, count);

  // Dominance: assign every sampled pixel to its nearest palette colour, then
  // the count per colour is its share of the image.
  let weights: number[];
  if (pool.length > 0) {
    const counts = new Array<number>(colors.length).fill(0);
    for (const px of pool) {
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < colors.length; i++) {
        const d = dist2(px, colors[i]);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      counts[best]++;
    }
    weights = counts.map((c) => c / pool.length);
  } else {
    weights = colors.map(() => 1 / colors.length);
  }

  // Most dominant colour first.
  return colors
    .map((rgb, i) => ({ hex: toHex(rgb), weight: weights[i] }))
    .sort((a, b) => b.weight - a.weight);
}
