/**
 * GET /api/colors/generate
 *   ?locked=#aabbcc,#112233   — (optional) up to 4 locked hex values
 *
 * Asks Colormind for a 5-color palette, optionally with some slots locked
 * to specific user-picked hex values. Returns the first 4 colors (we use
 * a 4-slot builder in the UI).
 *
 * Response:
 *   200 OK   — { palette: ["#...", "#...", "#...", "#..."] }
 *   400 BAD  — { ok: false, error: string }
 *   502 ERR  — { ok: false, error: string } (Colormind unreachable)
 *
 * Why proxy through our API: Colormind only serves HTTP, and browsers
 * block mixed-content fetches from our HTTPS site. Server-side fetch
 * has no such restriction.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  fetchColormindPalette,
  hexToRgb,
  type ColormindInputColor,
} from "@/lib/colormind";

export const runtime = "nodejs";

const querySchema = z.object({
  /** Comma-separated hex values to lock into the suggestion, in slot order. */
  locked: z.string().optional(),
});

export async function GET(request: NextRequest) {
  // Free upstream, but an open proxy to it is still ours to answer for.
  const limited = checkRateLimit(request, "colors", 120, 3_600_000);
  if (limited) return limited;

  const parsed = querySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.message },
      { status: 400 },
    );
  }

  // Build the 5-slot input. Unused slots are "N" (let Colormind pick).
  const input: ColormindInputColor[] = ["N", "N", "N", "N", "N"];
  if (parsed.data.locked) {
    const hexes = parsed.data.locked.split(",").slice(0, 4);
    hexes.forEach((hex, i) => {
      const rgb = hexToRgb(hex.trim());
      if (rgb) input[i] = rgb;
    });
  }

  try {
    const fullPalette = await fetchColormindPalette(input);
    // Colormind returns 5 colours — return all of them (callers slice/pad).
    return NextResponse.json({ palette: fullPalette.slice(0, 5) });
  } catch (error) {    console.error("[/api/colors/generate] failed:", error);
    return NextResponse.json({ ok: false, error: "Couldn't mix a new palette just now." }, { status: 502 });
  }
}
