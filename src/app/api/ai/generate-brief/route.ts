/**
 * POST /api/ai/generate-brief
 *
 * THE central AI call. Synthesizes the user's wizard picks into a full
 * Design DNA brief: concept line, keywords, named color system, section
 * mood lines, strategic pillars, and a cinematic description that will
 * later feed image generation.
 *
 * Uses the full gpt-5 tier (not mini) — this is the user-facing
 * artifact, quality differential matters here. ~$0.05 per call.
 *
 * Response:
 *   200 OK   — GenerateBriefResponse (matching the schema)
 *   400 BAD  — { ok: false, error }
 *   500 ERR  — { ok: false, error }
 *
 * No DB save yet — caller stores the response client-side / in
 * localStorage. A later PR persists to the concepts table on success.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { aiText } from "@/lib/ai";
import {
  GENERATE_BRIEF_SYSTEM_PROMPT,
  GENERATE_BRIEF_SCHEMA,
  buildGenerateBriefPrompt,
  type GenerateBriefResponse,
} from "@/lib/ai/prompts/generate-brief";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// GPT-5 full takes longer — bump the Vercel function timeout to 60s.
export const maxDuration = 60;

const paletteEntrySchema = z.object({
  hex: z.string(),
  name: z.string().optional(),
  material: z.string().optional(),
});

const bodySchema = z.object({
  industry: z.string().max(80).optional(),
  space: z.string().max(80).optional(),
  spaceDescription: z.string().max(800).optional(),
  spaceSize: z.string().max(40).optional(),
  vibeQuery: z.string().max(200).optional(),
  vibePinTitles: z.array(z.string().max(200)).max(10).optional(),
  palette: z.array(paletteEntrySchema).max(8).optional(),
  furnitureQuery: z.string().max(200).optional(),
  furniturePinTitles: z.array(z.string().max(200)).max(10).optional(),
  // Full Studio splits furniture into AI-named sub-sections (Sofa / Chairs /
  // Coffee table). Without this key Zod stripped the whole furniture
  // selection before it ever reached the prompt.
  furnitureSubSections: z
    .array(
      z.object({
        name: z.string().max(80),
        query: z.string().max(200).optional(),
        pinTitles: z.array(z.string().max(200)).max(10).optional(),
      }),
    )
    .max(6)
    .optional(),
  lightingPinTitles: z.array(z.string().max(200)).max(10).optional(),
  flooringPinTitles: z.array(z.string().max(200)).max(10).optional(),
  ceilingPinTitles: z.array(z.string().max(200)).max(10).optional(),
  materialsPinTitles: z.array(z.string().max(200)).max(10).optional(),
});

export async function POST(request: NextRequest) {
  let parsed;
  try {
    const body = await request.json();
    parsed = bodySchema.safeParse(body);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.message },
      { status: 400 },
    );
  }

  try {
    const result = await aiText({
      system: GENERATE_BRIEF_SYSTEM_PROMPT,
      prompt: buildGenerateBriefPrompt(parsed.data),
      // The big one — premium model for the user-facing artifact.
      tier: "full",
      schema: GENERATE_BRIEF_SCHEMA,
      schemaName: "design_dna_brief",
      // Headroom for the full brief: ~8 fields × ~150 words each plus
      // reasoning overhead. 8192 is comfortable.
      maxOutputTokens: 8192,
    });

    let payload: GenerateBriefResponse;
    try {
      payload = JSON.parse(result.text);
    } catch {
      console.error("[/api/ai/generate-brief] malformed JSON:", result.text);
      return NextResponse.json(
        { ok: false, error: "Model returned malformed JSON" },
        { status: 502 },
      );
    }

    console.log(
      `[/api/ai/generate-brief] generated brief in ${result.latencyMs}ms with ${result.model}`,
    );
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[/api/ai/generate-brief] AI call failed:", error);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 },
    );
  }
}
