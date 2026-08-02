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
import { checkRateLimit } from "@/lib/rate-limit";
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
  // GPT-5 at roughly $0.05 a call — the most expensive thing we run.
  const limited = checkRateLimit(request, "brief", 10, 3_600_000);
  if (limited) return limited;

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
      // GPT-5 spends reasoning tokens from the same budget as the output, and
      // 8192 truncated the JSON mid-object.
      maxOutputTokens: 24000,
      // The single most important setting on this route. At the default
      // effort the call took 57s against a 60s serverless limit, so briefs
      // intermittently died on a Vercel timeout rather than any error we
      // could show. The output is a schema-constrained deck of labels — it
      // needs recall and taste, not long deliberation — so "low" costs
      // nothing in quality and brings the call back inside the budget.
      reasoningEffort: "low",
    });

    if (!result.text.trim()) {
      console.error(
        `[/api/ai/generate-brief] empty response (finish_reason=${result.finishReason})`,
      );
      return NextResponse.json(
        {
          ok: false,
          error: `The model returned nothing (finish_reason=${result.finishReason ?? "unknown"}).`,
        },
        { status: 502 },
      );
    }

    if (result.finishReason === "length") {
      console.error(
        "[/api/ai/generate-brief] output truncated (finish_reason=length)",
      );
      return NextResponse.json(
        {
          ok: false,
          error:
            "The brief was cut off before it finished. Please try again.",
        },
        { status: 502 },
      );
    }

    let payload: GenerateBriefResponse;
    try {
      payload = JSON.parse(result.text);
    } catch {
      console.error(
        `[/api/ai/generate-brief] malformed JSON (finish_reason=${result.finishReason}, ${result.text.length} chars):`,
        result.text.slice(0, 2000),
      );
      return NextResponse.json(
        {
          ok: false,
          error: `Model returned malformed JSON (finish_reason=${result.finishReason ?? "unknown"})`,
        },
        { status: 502 },
      );
    }

    console.log(
      `[/api/ai/generate-brief] generated brief in ${result.latencyMs}ms with ${result.model}`,
    );
    return NextResponse.json(payload);
  } catch (error) {    console.error("[/api/ai/generate-brief] AI call failed:", error);
    return NextResponse.json(
      { ok: false, error: "Couldn't generate the brief just now. Please try again." },
      { status: 500 },
    );
  }
}
