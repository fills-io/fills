/**
 * POST /api/ai/generate-image
 *   body: { prompt: string, size?, quality? }
 *
 * Generates ONE image via the configured image provider (GPT Image) and
 * returns it as a data URL. The Quick flow calls this once per category (in
 * parallel from the client) so each request stays within the serverless time
 * budget — generating all of them in a single call would risk a timeout.
 *
 * Response:
 *   200 OK  — { image: "data:image/png;base64,…" }
 *   400 BAD — { ok: false, error }
 *   502 ERR — { ok: false, error }
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { aiImage } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  prompt: z.string().min(10).max(4000),
  size: z.enum(["1024x1024", "1536x1024", "1024x1536"]).optional(),
  quality: z.enum(["low", "medium", "high"]).optional(),
});

export async function POST(request: NextRequest) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    const result = await aiImage(body);
    return NextResponse.json({ image: result.dataUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[/api/ai/generate-image] failed:", error);
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
