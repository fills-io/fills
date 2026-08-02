/**
 * POST /api/ai/furniture-sub-sections
 *
 * Given the user's space + vibe, returns 3 furniture sub-category
 * names tailored to that combination, each with a Pinterest search
 * query the wizard can seed into the grid.
 *
 * Request body:
 *   {
 *     space: string,        // "Bedroom", "Hotel lobby", etc.
 *     vibe?: string,        // "japandi", "warm minimalism", etc.
 *     industry?: string,    // "Residential", "Hospitality"
 *   }
 *
 * Response:
 *   200 OK   — { subSections: [{ name, query }, { name, query }, { name, query }] }
 *   400 BAD  — { ok: false, error: string }
 *   500 ERR  — { ok: false, error: string }
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { aiText } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rate-limit";

import {
  FURNITURE_SUB_SECTIONS_SYSTEM_PROMPT,
  FURNITURE_SUB_SECTIONS_SCHEMA,
  buildFurnitureSubSectionsPrompt,
  type FurnitureSubSectionsResponse,
} from "@/lib/ai/prompts/furniture-sub-sections";

/** A single sentence a user can act on, instead of Zod's JSON dump. */
function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (issue?.code === "too_big") {
    const field = String(issue.path[0] ?? "answer");
    return `Your ${field} is too long — please shorten it.`;
  }
  return "Some of your answers couldn't be read. Please check them.";
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  space: z.string().min(1).max(80),
  vibe: z.string().max(120).optional(),
  industry: z.string().max(80).optional(),
});

export async function POST(request: NextRequest) {
  // One model call per furniture step.
  const limited = checkRateLimit(request, "furniture-subs", 40, 3_600_000);
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
      {
        ok: false,
        // Zod's message is a pretty-printed JSON array of issue objects.
        // It was rendered verbatim into the UI as a wall of braces; the
        // only cause a user can act on is having written too much.
        error: firstIssue(parsed.error),
      },
      { status: 400 },
    );
  }

  try {
    const result = await aiText({
      system: FURNITURE_SUB_SECTIONS_SYSTEM_PROMPT,
      prompt: buildFurnitureSubSectionsPrompt(parsed.data),
      tier: "mini",
      schema: FURNITURE_SUB_SECTIONS_SCHEMA,
      schemaName: "furniture_sub_sections",
      // GPT-5 spends reasoning tokens from this same budget BEFORE it writes
      // a single character of output. At 800 the whole allowance went on
      // thinking, the model returned an empty string, and the Furniture step
      // failed with "Model returned malformed JSON" every time.
      maxOutputTokens: 6000,
      // A short list of furniture categories needs recall, not deliberation.
      reasoningEffort: "low",
    });

    let payload: FurnitureSubSectionsResponse;
    try {
      payload = JSON.parse(result.text);
    } catch {
      console.error(
        "[/api/ai/furniture-sub-sections] malformed JSON:",
        result.text,
      );
      return NextResponse.json(
        { ok: false, error: "Model returned malformed JSON" },
        { status: 502 },
      );
    }

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("[/api/ai/furniture-sub-sections] AI call failed:", error);
    return NextResponse.json(
      { ok: false, error: "Couldn't work out the furniture sections just now." },
      { status: 500 },
    );
  }
}
