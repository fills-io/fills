/**
 * PATCH /api/concepts/[shareToken] — re-pick a saved brief's reference images.
 *
 * The deck is rendered SERVER-SIDE from `concepts.brief_pins`
 * (src/app/api/brief/[token]/pdf/route.ts), and the shared link renders from
 * the same column. So a swap made on screen has to reach the database or the
 * user's PDF and their share link quietly disagree with what they are looking
 * at. This is the only write path for that.
 *
 * It changes brief_pins and nothing else. Not the written brief, not the
 * facts, not the status.
 */

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db, concepts, purchases } from "@/db";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Only Pinterest's CDN, mirroring the allow-list in /api/img.
 *
 * This is not decoration. BriefPDF passes any non-pinimg absolute URL straight
 * through unproxied, and the PDF route then fetches it from our own serverless
 * function — so an unvalidated image URL here is a server-side request forgery
 * with a token attached to it.
 */
function isPinimg(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    return u.hostname === "pinimg.com" || u.hostname.endsWith(".pinimg.com");
  } catch {
    return false;
  }
}

const pinSchema = z
  .object({
    id: z.string().max(200),
    url: z.string().max(600).optional(),
    title: z.string().max(400).optional(),
    altText: z.string().max(400).optional(),
    imageUrl: z.string().max(600).refine(isPinimg, "unsupported image host"),
    imageThumbUrl: z.string().max(600).refine(isPinimg).optional(),
    dominantColor: z.string().max(32).optional(),
  })
  .passthrough();

const bodySchema = z.object({
  editToken: z.string().min(8).max(64),
  /** The WHOLE pins object every time, so a dropped request is repaired by the
   *  next one rather than leaving the row half-written. */
  pins: z.record(
    z.enum(["vibe", "furniture", "lighting", "flooring", "ceiling", "materials"]),
    z.array(pinSchema).max(24),
  ),
});

/** Constant-time compare, so the token can't be probed a character at a time. */
function tokenMatches(given: string, expected: string | null): boolean {
  if (!expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  // Swaps come in bursts — someone re-picking a wall of images does five in a
  // minute — so this is looser than the 30/hr on creating a brief.
  const limited = checkRateLimit(request, "concepts-patch", 120, 3_600_000);
  if (limited) return limited;

  const { token } = await params;

  let parsed;
  try {
    parsed = bodySchema.safeParse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Those images couldn't be saved." },
      { status: 400 },
    );
  }

  try {
    const rows = await db
      .select({ id: concepts.id, editToken: concepts.editToken })
      .from(concepts)
      .where(eq(concepts.shareToken, token))
      .limit(1);
    const row = rows[0];
    if (!row) {
      return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
    }

    if (!tokenMatches(parsed.data.editToken, row.editToken)) {
      // Deliberately the same shape as a 404 to anyone probing: holding the
      // share link tells you nothing about whether the edit token was close.
      return NextResponse.json(
        { ok: false, error: "This brief can only be changed by whoever made it." },
        { status: 403 },
      );
    }

    // A deck someone has paid for must not change under them. Versioning a
    // purchased brief would be better than refusing, but there is nothing to
    // version into yet, so refuse and say so plainly.
    const paid = await db
      .select({ id: purchases.id })
      .from(purchases)
      .where(and(eq(purchases.briefToken, token), isNull(purchases.refundedAt)))
      .limit(1);
    if (paid[0]) {
      return NextResponse.json(
        {
          ok: false,
          error: "This brief has been purchased, so its images are fixed.",
        },
        { status: 409 },
      );
    }

    await db
      .update(concepts)
      .set({ briefPins: parsed.data.pins, updatedAt: new Date() })
      .where(eq(concepts.id, row.id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[/api/concepts/[token]] PATCH failed:", error);
    return NextResponse.json(
      { ok: false, error: "Couldn't save that change." },
      { status: 500 },
    );
  }
}
