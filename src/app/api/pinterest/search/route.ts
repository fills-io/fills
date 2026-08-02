/**
 * GET /api/pinterest/search?q=<query>&limit=<n>&type=<type>
 *
 * Wraps the Apify `fatihtahta/pinterest-scraper-search` actor with input
 * validation, a 24-hour cache, and clean error handling.
 *
 * Query params:
 *   q      — required, the search text (e.g. "warm minimalism")
 *   limit  — optional, 1..100, defaults to 30
 *   type   — optional, one of "all-pins" | "videos" | "boards" | "profiles",
 *            defaults to "all-pins"
 *
 * Response:
 *   200 OK  — { query, count, pins: PinterestPin[] }
 *   400 BAD — { ok: false, error: string } (invalid input)
 *   500 ERR — { ok: false, error: string } (Apify / network failure)
 *
 * Why GET (vs POST like the prototype):
 *   - Simpler to test from a browser address bar
 *   - The query carries no sensitive data, so query-string is fine
 *   - Plays nicely with Vercel's edge cache as a future optimization
 *
 * Wizard UI callers should hit this from React with `fetch("/api/pinterest/search?q=...")`.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { searchPinterestPins } from "@/lib/pinterest";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const querySchema = z.object({
  q: z.string().trim().min(1, "Query is required").max(200),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  type: z
    .enum(["all-pins", "videos", "boards", "profiles"])
    .default("all-pins"),
});

export async function GET(request: NextRequest) {
  // Paid Apify actor. The 24h cache only helps on repeated identical queries.
  const limited = checkRateLimit(request, "pinterest", 60, 3_600_000);
  if (limited) return limited;

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = querySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      },
      { status: 400 },
    );
  }

  const { q, limit, type } = parsed.data;

  try {
    const pins = await searchPinterestPins(q, limit, type);

    return NextResponse.json({
      query: q,
      count: pins.length,
      pins,
    });
  } catch (error) {    console.error("[/api/pinterest/search] failed:", error);

    return NextResponse.json(
      { ok: false, error: "Couldn't load reference images just now." },
      { status: 500 },
    );
  }
}
