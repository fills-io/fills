/**
 * Vision tagging for the curated reference set.
 *
 * This is the real fix for the last class of bad reference: an advertisement
 * or a watermark burned into an otherwise ordinary photograph, on a pin whose
 * title says nothing about it ("Save 20% On Premium", or no title at all).
 *
 * Neither of the cheap layers can catch those:
 *   • the title filter (src/lib/image-quality.ts) has nothing to read;
 *   • the pixel audit (scripts/audit-refs.mjs) only finds collage gutters —
 *     every text-shaped pixel heuristic tried there also rejected slat
 *     ceilings and herringbone floors, so none of them shipped.
 *
 * A vision model reads the image. It runs ONCE over the whole set and appends
 * its rejections to src/data/rejected-images.json, which the app already
 * imports; nothing here happens at request time.
 *
 * Requires OPENAI_API_KEY. Run it wherever the key lives:
 *
 *   OPENAI_API_KEY=sk-... node scripts/tag-refs.mjs
 *   node scripts/tag-refs.mjs --limit 50      # cost check first
 *
 * At the time of writing the whole set is ~2.6k images on gpt-5-mini, which is
 * a couple of dollars — a one-off, not a per-session cost.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "src/data/reference-images.ts");
const OUT = path.join(ROOT, "src/data/rejected-images.json");

const KEY = process.env.OPENAI_API_KEY;
if (!KEY || KEY.startsWith("your-") || KEY.length < 20) {
  console.error(
    "OPENAI_API_KEY is not set (or is still the placeholder).\n" +
      "Run this where the real key lives — it is a one-off pass, not a\n" +
      "per-request call.",
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const argN = (flag, dflt) => {
  const i = args.indexOf(flag);
  return i >= 0 ? Number(args[i + 1]) : dflt;
};
const LIMIT = argN("--limit", Infinity);
const CONCURRENCY = argN("--concurrency", 8);
const MODEL = "gpt-5-mini";

const PROMPT = `You are checking whether an image can be used as a reference photograph in a professional interior design deck.

REJECT the image if ANY of these are true:
- It has text, a logo, a price, or a watermark drawn on top of it (a shop sign or a book title INSIDE the room is fine; an overlay added afterwards is not).
- It is a collage, a grid of several photos, a mood board graphic, or an infographic.
- It is a product cut-out or a catalogue shot on a plain white background.
- It is a floor plan, an elevation, or a diagram.
- The main subject is a person, food, or clothing rather than a space or a material.

ACCEPT ordinary photographs of rooms, architectural details, furniture in a setting, lighting, flooring, ceilings, and material close-ups — including slatted timber, herringbone floors, and textured plaster.

Answer with JSON only: {"ok": true} or {"ok": false, "why": "<four words>"}.`;

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

async function judge(pin) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_completion_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            { type: "image_url", image_url: { url: pin.imageUrl, detail: "low" } },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const body = await res.json();
  const text = body.choices?.[0]?.message?.content ?? "";
  return JSON.parse(text);
}

const existing = fs.existsSync(OUT)
  ? JSON.parse(fs.readFileSync(OUT, "utf8"))
  : { rejected: [] };
const already = new Set(existing.rejected);

// No point paying to look at pins the pixel audit already threw out.
const pins = readPins()
  .filter((p) => !already.has(p.id))
  .slice(0, LIMIT);

console.log(`tagging ${pins.length} pins with ${MODEL} (concurrency ${CONCURRENCY})`);

const rejected = [];
let done = 0;
let failed = 0;

async function worker(queue) {
  for (;;) {
    const pin = queue.pop();
    if (!pin) return;
    try {
      const verdict = await judge(pin);
      if (verdict && verdict.ok === false) {
        rejected.push({ id: pin.id, why: verdict.why ?? "", title: pin.title });
      }
    } catch {
      // A failure must not remove a pin — leaving it in is the safe default.
      failed++;
    }
    if (++done % 100 === 0) {
      console.log(`  ${done}/${pins.length} · rejected ${rejected.length} · failed ${failed}`);
    }
  }
}

const queue = pins.slice().reverse();
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));

const merged = [...new Set([...existing.rejected, ...rejected.map((r) => r.id)])];
fs.writeFileSync(
  OUT,
  JSON.stringify({ generated: merged.length, rejected: merged }, null, 2),
);
fs.writeFileSync(
  path.join(ROOT, "scripts/.vision-detail.json"),
  JSON.stringify(rejected, null, 1),
);

const byReason = {};
for (const r of rejected) byReason[r.why] = (byReason[r.why] ?? 0) + 1;
console.log(`\ndone. checked ${done}, failed ${failed}`);
console.log(`newly rejected ${rejected.length}; list is now ${merged.length}`);
console.log(
  Object.entries(byReason)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([w, n]) => `  ${String(n).padStart(4)} ${w}`)
    .join("\n"),
);
