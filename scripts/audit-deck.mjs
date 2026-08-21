/**
 * Render the deck at both page sizes and measure what the images actually
 * become.
 *
 * The founder's report was "the portrait document is cutting images to make
 * them vertical". Every image slot used to be a fixed point HEIGHT with
 * width:"100%", authored for a 1440pt-wide page; on A4's 467pt content column
 * the width collapsed while the height held, so objectFit:"cover" threw away
 * most of each photograph's width. This reads the real rendered rectangles out
 * of the PDF content stream, so the fix can be proved rather than asserted.
 *
 * A slot ratio (width ÷ height) near 0.75 means a portrait reference lands
 * almost uncropped. Below ~0.5 it is a vertical strip.
 *
 * Run:  node scripts/audit-deck.mjs
 */

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { inflateSync } from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require_ = createRequire(import.meta.url);

function loadJiti() {
  try {
    return require_("jiti");
  } catch {
    return createRequire(require_.resolve("next/package.json"))("jiti");
  }
}
const jiti = loadJiti().createJiti(import.meta.url, {
  alias: { "@": join(root, "src") },
  // BriefPDF is .tsx. jiti's default transform does not enable the JSX plugin,
  // so without this it stops on the first tag with "Unexpected token". The
  // classic runtime compiles tags to React.createElement, which is why React
  // is put on globalThis below rather than imported by the component.
  jsx: true,
  babel: { plugins: [["@babel/plugin-syntax-jsx"]] },
});

globalThis.React = await jiti.import("react", { default: true });

const { renderToBuffer } = await jiti.import("@react-pdf/renderer");
const BriefPDF = (await jiti.import(join(root, "src/components/wizard/BriefPDF.tsx")))
  .default;

/**
 * A 1x1 PNG, inline.
 *
 * Every slot is sized by aspectRatio and flex, never by the image's own
 * dimensions, so the rendered rectangles are identical whatever the source is.
 * Using a data URI keeps this script offline and fast: real references would
 * mean ~56 CDN fetches per format and would fail in CI.
 */
const DOT =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBgDTD2qgAAAAASUVORK5CYII=";

const pin = (i) => ({
  id: `p${i}`,
  url: DOT,
  title: `Reference ${i}`,
  imageUrl: DOT,
  imageThumbUrl: DOT,
  dominantColor: "#8d6649",
});
const many = (n) => Array.from({ length: n }, (_, i) => pin(i));
const PINS = {
  vibe: many(12),
  materials: many(12),
  furniture: many(12),
  lighting: many(12),
  flooring: many(12),
  ceiling: many(12),
};

const line = (n, word = "detail") => Array.from({ length: n }, () => word).join(" ");
const BRIEF = {
  title: "Audit Scheme",
  conceptLine: line(16, "considered"),
  summary: {
    projectType: "Hotel lobby, boutique hospitality",
    intent: line(22, "intent"),
    whoItsFor: line(14, "guests"),
    scopeNotes: line(14, "survey"),
  },
  keywords: Array.from({ length: 10 }, (_, i) => `keyword${i}`),
  colorSystem: ["#1d1e20", "#7b5a3c", "#807367", "#a99981", "#d2cec5", "#c8512a"].map(
    (hex, i) => ({
      role: i === 0 ? "primary" : "supporting",
      hex,
      name: `colour name ${i}`,
      application: line(9, "surface"),
    }),
  ),
  materials: Array.from({ length: 7 }, (_, i) => ({
    material: `Material ${i}, honed finish`,
    application: line(7, "where"),
  })),
  furniture: Array.from({ length: 6 }, (_, i) => ({
    item: `Furniture item ${i}`,
    character: line(8, "form"),
  })),
  lighting: {
    strategy: line(16, "light"),
    colorTemperature: "2700K throughout, 3000K in task zones",
    layers: [
      { layer: "Ambient", fixtures: line(8, "fixture") },
      { layer: "Task", fixtures: line(8, "fixture") },
      { layer: "Accent", fixtures: line(8, "fixture") },
    ],
  },
  spatialNotes: Array.from({ length: 4 }, () => line(16, "zone")),
  dos: Array.from({ length: 5 }, () => line(10, "do")),
  donts: Array.from({ length: 5 }, () => line(10, "avoid")),
  nextSteps: Array.from({ length: 4 }, () => line(16, "step")),
  cinematicDescription: line(50, "frame"),
};

/**
 * Pull every image placement out of a page's content stream.
 *
 * @react-pdf emits each image as `q <a> 0 0 <d> <x> <y> cm /I<n> Do Q`, where
 * `a` is the drawn width and `d` the drawn height, both already in points.
 */
function imageRects(pdf, { debug = false } = {}) {
  const out = [];
  const raw = pdf.toString("latin1");
  for (const m of raw.matchAll(/stream\r?\n/g)) {
    const start = m.index + m[0].length;
    const end = raw.indexOf("endstream", start);
    if (end < 0) continue;
    let text;
    try {
      text = inflateSync(pdf.subarray(start, end)).toString("latin1");
    } catch {
      continue; // not a deflated content stream (an image XObject, a font)
    }
    if (!/\bDo\b/.test(text)) continue;
    if (debug) {
      console.log("--- content stream sample ---");
      console.log(text.slice(0, 600));
    }
    // The scale factors may be negative (a flipped image matrix), and the
    // `Do` can sit on its own line.
    for (const cm of text.matchAll(
      /(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+cm\s+\/\S+\s+Do/g,
    )) {
      out.push({ w: Math.abs(Number(cm[1])), h: Math.abs(Number(cm[4])) });
    }
  }
  return out;
}

const PHOTO = 0.75; // a typical portrait reference, width ÷ height

for (const format of ["deck", "document"]) {
  const buf = await renderToBuffer(
    BriefPDF({
      brief: BRIEF,
      pins: PINS,
      facts: { projectName: "Audit", industry: "Hospitality", areaSqm: 180 },
      format,
      baseUrl: "https://example.invalid",
    }),
  );

  const rects = imageRects(buf).filter((r) => r.w > 20 && r.h > 20);
  const pages = (buf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;

  // Group identical slot shapes so one line stands for one grid.
  const shapes = new Map();
  for (const r of rects) {
    const key = `${r.w.toFixed(0)}x${r.h.toFixed(0)}`;
    shapes.set(key, (shapes.get(key) ?? 0) + 1);
  }

  console.log(
    `\n${format.toUpperCase()} — ${pages} pages, ${rects.length} images, ` +
      `${Math.round(buf.length / 1024)}KB`,
  );
  const slivers = [];
  for (const [key, n] of [...shapes].sort((a, b) => b[1] - a[1])) {
    const [w, h] = key.split("x").map(Number);
    const ratio = w / h;
    const lost =
      ratio > PHOTO
        ? `${Math.round((1 - PHOTO / ratio) * 100)}% off top+bottom`
        : `${Math.round((1 - ratio / PHOTO) * 100)}% off the sides`;
    if (ratio < 0.5) slivers.push(key);
    console.log(
      `  ${String(n).padStart(2)} x ${key.padEnd(12)} ratio ${ratio.toFixed(2)}  crops ${lost}`,
    );
  }
  console.log(
    slivers.length
      ? `  FAIL: ${slivers.length} slot shape(s) below 0.5 — ${slivers.join(", ")}`
      : `  OK: every slot holds a usable crop shape.`,
  );
}
