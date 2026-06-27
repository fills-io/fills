/**
 * One-off: generate 4 editorial interior renders for the homepage Sample
 * Boards, using OpenAI's image model. Saves PNGs to public/samples/.
 *
 * Run:  node --env-file=.env.local scripts/generate-sample-images.mjs
 *
 * This is a TEST batch (4 images, ~medium quality) to judge quality + cost
 * before wiring a full pipeline. Not part of the app build.
 */

import OpenAI from "openai";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "..", "public", "samples");

// OpenAI's current image model id. Bump if a newer id is available.
const MODEL = process.env.IMAGE_MODEL || "gpt-image-1";
const SIZE = "1536x1024"; // landscape, matches the showcase cards
const QUALITY = "medium"; // keep the test cheap (~few cents each)

const JOBS = [
  {
    file: "meadow-living.png",
    prompt:
      "Editorial interior photography of a warm minimalist family living room. Clay plaster walls, wide oak floors, linen drapery, aged brass fixtures. Palette of sun-bleached linen, soft camel, terracotta and smoked oak. Low afternoon side light, calm and uncluttered, architectural composition, magazine quality. No text, no people.",
  },
  {
    file: "cloud-lounge.png",
    prompt:
      "Editorial interior photography of a soft brutalist hotel lounge. Poured concrete shell, travertine floors, paper-screen east wall, brushed steel. Muted palette of bone, oat, sage-grey and charcoal. Diffuse natural light through paper screens, serene and monumental, architectural magazine quality. No text, no people.",
  },
  {
    file: "void-index.png",
    prompt:
      "Editorial interior photography of an editorial-noir gallery cafe. Polished black plaster, ink-stained oak counters, marble, single-source overhead light. High-contrast palette of off-white, grey, near-black. Dramatic directional lighting, refined and moody, architectural magazine quality. No text, no people.",
  },
  {
    file: "citrus-house.png",
    prompt:
      "Editorial interior photography of a Mediterranean cafe. Travertine counters, terracotta floor tiles, olive-wood seating, rope-bound pendant lighting. Warm palette of cream, blush, terracotta and deep sienna. Bright sunlit afternoon, relaxed and editorial, architectural magazine quality. No text, no people.",
  },
];

async function main() {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.includes("REPLACE_WITH_YOUR_KEY")) {
    console.error(
      "\n✗ OPENAI_API_KEY is not set. Paste your real key into .env.local first.\n",
    );
    process.exit(1);
  }

  const client = new OpenAI({ apiKey: key });
  await mkdir(OUT_DIR, { recursive: true });

  console.log(`\nGenerating ${JOBS.length} images with ${MODEL} (${SIZE}, ${QUALITY})…\n`);

  for (const job of JOBS) {
    process.stdout.write(`  • ${job.file} … `);
    try {
      const res = await client.images.generate({
        model: MODEL,
        prompt: job.prompt,
        size: SIZE,
        quality: QUALITY,
        n: 1,
      });
      const b64 = res.data?.[0]?.b64_json;
      if (!b64) throw new Error("no image data returned");
      await writeFile(resolve(OUT_DIR, job.file), Buffer.from(b64, "base64"));
      console.log("done");
    } catch (err) {
      console.log("FAILED");
      console.error(`     ${err?.message || err}`);
    }
  }

  console.log(`\n✓ Saved to public/samples/. Review them, then I'll wire them in.\n`);
}

main();
