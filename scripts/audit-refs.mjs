/**
 * Reference-image pixel audit.
 *
 * Title filtering (src/lib/image-quality.ts) catches pins that ANNOUNCE
 * themselves — listicles, product listings, ad copy. It cannot catch the two
 * things that actually ruin a deck:
 *
 *   1. COLLAGES — a grid of four small photos with a headline across them.
 *      They read as one image in the picker and as a mess in the PDF.
 *   2. BURNED-IN TEXT — a "SALE 20% OFF" band or a brand watermark, on a pin
 *      whose title says nothing about it.
 *
 * Both are visible in the pixels, so we look there. This runs ONCE over the
 * whole curated set and writes the rejected ids to a JSON file that the app
 * imports; nothing here happens at request time.
 *
 * The signal we use is the GUTTER: a run of consecutive rows (or columns),
 * away from the edges, that is nearly constant in luminance along its whole
 * length AND is close to white or black. That is what separates the panels of
 * a collage, and what a product listing floats its subject on.
 *
 * Three other detectors were tried and DELETED — each rejected real rooms:
 *
 *   - an edge-density/colour-count "text band" scanner: scored a living room
 *     with a gallery wall at 0.61, because framed art is edge-dense and
 *     colour-poor in exactly the way type is;
 *   - a "strongest adjacent-row difference" seam scanner: scored a real
 *     penthouse at 37, because a linear track light crossed the ceiling;
 *   - a glyph-baseline scanner (small high-contrast blobs of equal height on a
 *     shared baseline): scored a slatted timber ceiling at 32 against 12 for an
 *     actual "SALE — 20% OFF" advert. Repeating architectural detail — slats,
 *     balusters, tiles, book spines — is indistinguishable from a line of text
 *     at this level, and slat ceilings are exactly the imagery we want.
 *
 * So burnt-in text on a photograph is NOT solved here. It needs a vision model
 * (scripts/tag-refs.mjs), which runs offline when an API key is available. A
 * gutter has no architectural analogue, so it is the one signal that ships:
 * interiors do not contain flat white bands spanning the whole frame. We would
 * rather keep a bad pin than throw away a good room.
 *
 * Usage:  node scripts/audit-refs.mjs [--limit N] [--concurrency N]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import jpeg from "jpeg-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "src/data/reference-images.ts");
const OUT = path.join(ROOT, "src/data/rejected-images.json");

const args = process.argv.slice(2);
const argN = (flag, dflt) => {
  const i = args.indexOf(flag);
  return i >= 0 ? Number(args[i + 1]) : dflt;
};
const LIMIT = argN("--limit", Infinity);
const CONCURRENCY = argN("--concurrency", 24);

/* ── read the dataset ────────────────────────────────────────────────── */

function readPins() {
  const src = fs.readFileSync(DATA, "utf8");
  const re =
    /"id":\s*"([^"]+)",\s*\n\s*"title":\s*"((?:[^"\\]|\\.)*)",\s*\n\s*"imageUrl":\s*"([^"]+)"/g;
  const out = [];
  const seen = new Set();
  for (const m of src.matchAll(re)) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    out.push({ id: m[1], title: m[2], imageUrl: m[3] });
  }
  return out;
}

/* ── pixel signals ───────────────────────────────────────────────────── */

/** Greyscale plane at the image's own resolution. */
function grey(img) {
  const { width: w, height: h, data } = img;
  const g = new Float32Array(w * h);
  for (let i = 0, p = 0; i < g.length; i++, p += 4) {
    g[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
  }
  return { g, w, h };
}

/**
 * Is this line flat enough, and near enough to WHITE, to be a collage gutter?
 *
 * Dark bands were allowed at first and had to be removed: a room with a
 * near-black timber ceiling produces a flat dark run spanning the full width,
 * and one such photograph was rejected in testing. White gutters have no
 * equivalent — a blown-out window is a column, not a full-width row, and is
 * broken up by frames and reveals.
 */
function isGutterLine(mean, std) {
  return std < 9 && mean > 224;
}

/**
 * The longest interior run of gutter lines, in pixels, taken as the larger of
 * the horizontal and vertical result. A single flat white line happens (a
 * blown-out window edge); a RUN of them across the full frame does not.
 */
function gutterRun({ g, w, h }) {
  const scan = (n, len, at) => {
    // Ignore the outer 8% — a border or a mount is not a collage gutter.
    const pad = Math.floor(n * 0.08);
    let best = 0;
    let run = 0;
    for (let i = pad; i < n - pad; i++) {
      let sum = 0;
      for (let j = 0; j < len; j++) sum += g[at(i, j)];
      const mean = sum / len;
      let varc = 0;
      for (let j = 0; j < len; j++) {
        const d = g[at(i, j)] - mean;
        varc += d * d;
      }
      if (isGutterLine(mean, Math.sqrt(varc / len))) {
        best = Math.max(best, ++run);
      } else run = 0;
    }
    return best;
  };
  const rows = scan(h, w, (y, x) => y * w + x);
  const cols = scan(w, h, (x, y) => y * w + x);
  return Math.max(rows, cols);
}

/* ── run ─────────────────────────────────────────────────────────────── */

async function analyse(pin) {
  const res = await fetch(pin.imageUrl, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  const img = jpeg.decode(buf, { useTArray: true, formatAsRGBA: true });
  const gp = grey(img);
  return { gutter: gutterRun(gp), w: img.width, h: img.height };
}

const pins = readPins().slice(0, LIMIT);
console.log(`auditing ${pins.length} pins at concurrency ${CONCURRENCY}`);

const rejected = [];
const rows = [];
let done = 0;
let failed = 0;

async function worker(queue) {
  for (;;) {
    const pin = queue.pop();
    if (!pin) return;
    try {
      const r = await analyse(pin);
      if (r) {
        // 4px of flat white gutter. At 3px a real interior was caught (a blown
        // window reveal), so we give the photographs the benefit of the doubt.
        const bad = r.gutter >= 4;
        rows.push({ ...pin, ...r, bad });
        if (bad) rejected.push({ id: pin.id, title: pin.title, ...r });
      } else failed++;
    } catch {
      failed++;
    }
    if (++done % 200 === 0) {
      console.log(`  ${done}/${pins.length} · rejected ${rejected.length} · failed ${failed}`);
    }
  }
}

const queue = pins.slice().reverse();
await Promise.all(
  Array.from({ length: CONCURRENCY }, () => worker(queue)),
);

rejected.sort((a, b) => b.gutter - a.gutter);
fs.writeFileSync(
  OUT,
  JSON.stringify(
    { generated: rows.length, rejected: rejected.map((r) => r.id) },
    null,
    2,
  ),
);
fs.writeFileSync(
  path.join(ROOT, "scripts/.audit-detail.json"),
  JSON.stringify(rows, null, 1),
);

console.log(`\ndone. analysed ${rows.length}, failed ${failed}`);
console.log(`rejected ${rejected.length} (${((rejected.length / rows.length) * 100).toFixed(1)}%)`);
console.log(`wrote ${path.relative(ROOT, OUT)}`);
