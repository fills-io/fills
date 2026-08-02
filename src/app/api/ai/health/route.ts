/**
 * GET /api/ai/health
 *
 * Smoke test for the AI wiring. Confirms:
 *   1. The configured TEXT_PROVIDER's API key is set
 *   2. The provider's API is reachable
 *   3. The model responds with a sane reply
 *
 * Response:
 *   200 OK   — { ok: true, provider: string, model: string, reply: string, latencyMs: number }
 *   500 ERR  — { ok: false, error: string }
 *
 * Each ping costs a model call, so the model is only contacted when the
 * caller explicitly asks with ?ping=1. A bare GET answers from configuration
 * alone. The old behaviour billed us for every scraper, preview crawler and
 * naive uptime monitor that ever touched this URL.
 *
 * Response:
 *   200 OK   — { ok, provider, model, reply?, latencyMs }
 *   500 ERR  — { ok: false, error }
 */

import { NextResponse, type NextRequest } from "next/server";
import { aiText } from "@/lib/ai";
import { getTextProvider } from "@/lib/ai/config";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const startedAt = Date.now();

  // Configuration-only answer: enough to tell whether a deploy is wired up,
  // and it costs nothing.
  if (request.nextUrl.searchParams.get("ping") !== "1") {
    return NextResponse.json({
      ok: true,
      provider: getTextProvider().name,
      configured: Boolean(process.env.OPENAI_API_KEY),
      note: "Add ?ping=1 to actually call the model.",
      latencyMs: Date.now() - startedAt,
    });
  }

  const limited = checkRateLimit(request, "ai-health", 10, 3_600_000);
  if (limited) return limited;

  try {
    const result = await aiText({
      prompt: "Respond with the single word OK to confirm you received this.",
      tier: "mini",
      // GPT-5 family doesn't accept custom temperature; we don't pass one.
      // GPT-5 also uses "reasoning tokens" against the same budget as
      // output — even a one-word reply needs ~500 tokens for the model to
      // think before emitting "OK". We give generous headroom.
      maxOutputTokens: 1024,
    });

    return NextResponse.json({
      ok: true,
      provider: result.provider,
      model: result.model,
      reply: result.text.trim(),
      latencyMs: Date.now() - startedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[/api/ai/health] AI ping failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: message,
        latencyMs: Date.now() - startedAt,
      },
      { status: 500 },
    );
  }
}
