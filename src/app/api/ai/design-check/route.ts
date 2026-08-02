/**
 * POST /api/ai/design-check
 *
 * Given a summary of the user's wizard picks, returns a senior-designer
 * coherence assessment ("strong" / "mixed" / "off", plus a headline and
 * a few sentences of observation). Powers the design-check banner that
 * appears on the Review step.
 *
 * Why a POST (not a GET): the input is a structured summary of the
 * user's entire wizard state — too long for a query string, and
 * cleaner as a typed body.
 *
 * Response:
 *   200 OK   — { verdict, headline, observations }
 *   400 BAD  — { ok: false, error }
 *   500 ERR  — { ok: false, error }
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { aiText } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  DESIGN_CHECK_SYSTEM_PROMPT,
  DESIGN_CHECK_SCHEMA,
  buildDesignCheckPrompt,
  type DesignCheckResponse,
} from "@/lib/ai/prompts/design-check";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const paletteEntrySchema = z.object({
  hex: z.string(),
  name: z.string().optional(),
  material: z.string().optional(),
});

const bodySchema = z.object({
  industry: z.string().max(80).optional(),
  space: z.string().max(80).optional(),
  spaceDescription: z.string().max(800).optional(),
  vibeQuery: z.string().max(200).optional(),
  vibePinTitles: z.array(z.string().max(200)).max(10).optional(),
  palette: z.array(paletteEntrySchema).max(8).optional(),
  furnitureQuery: z.string().max(200).optional(),
  furniturePinTitles: z.array(z.string().max(200)).max(10).optional(),
  lightingPinTitles: z.array(z.string().max(200)).max(10).optional(),
  flooringPinTitles: z.array(z.string().max(200)).max(10).optional(),
  ceilingPinTitles: z.array(z.string().max(200)).max(10).optional(),
  materialsPinTitles: z.array(z.string().max(200)).max(10).optional(),
});

export async function POST(request: NextRequest) {
  // One model call per check, and the button can be clicked repeatedly.
  const limited = checkRateLimit(request, "design-check", 30, 3_600_000);
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
      system: DESIGN_CHECK_SYSTEM_PROMPT,
      prompt: buildDesignCheckPrompt(parsed.data),
      tier: "mini",
      schema: DESIGN_CHECK_SCHEMA,
      schemaName: "design_check",
      maxOutputTokens: 2000,
    });

    let payload: DesignCheckResponse;
    try {
      payload = JSON.parse(result.text);
    } catch {
      console.error("[/api/ai/design-check] malformed JSON:", result.text);
      return NextResponse.json(
        { ok: false, error: "Model returned malformed JSON" },
        { status: 502 },
      );
    }

    return NextResponse.json(payload);
  } catch (error) {    console.error("[/api/ai/design-check] AI call failed:", error);
    return NextResponse.json(
      { ok: false, error: "Couldn't run the design check just now." },
      { status: 500 },
    );
  }
}
