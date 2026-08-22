/**
 * POST /api/concepts
 *
 * Saves a finished brief and hands back a share token.
 *
 * Until now a brief existed only in the browser tab that made it: a refresh,
 * a back button or a closed tab destroyed several minutes of the user's work
 * and a paid model call, and the only way back was to pay for it again — for
 * different words. It also meant we had no record that any brief was ever
 * generated. This is that record.
 *
 * The brief is stored WHOLE (see the `brief` column in src/db/schema.ts), so a
 * saved brief renders exactly as it did on the day it was made, even after the
 * prompt changes.
 *
 * Best-effort by design: the caller shows the brief regardless of whether this
 * succeeds, because failing to save is never a good enough reason to throw away
 * something the user already has on screen.
 *
 * Response:
 *   200 OK   — { ok: true, shareToken }
 *   400 BAD  — { ok: false, error }
 *   500 ERR  — { ok: false, error: "Couldn't save the brief." }
 */

import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db, concepts } from "@/db";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  /** The whole GenerateBriefResponse. Shape is enforced upstream by the
   *  model's JSON schema, so we only check it is an object. */
  brief: z.record(z.string(), z.unknown()),
  pins: z.record(z.string(), z.unknown()).optional(),
  facts: z.record(z.string(), z.unknown()).optional(),
  spaceType: z.string().max(120).optional(),
  creationMode: z.enum(["quick", "full", "from-image"]).optional(),
});

/** Short, unguessable, and safe in a URL without escaping. */
function makeShareToken(): string {
  return randomBytes(9).toString("base64url");
}

/** Postgres 42703: the statement named a column the table does not have. */
function isUndefinedColumn(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "42703"
  );
}

export async function POST(request: NextRequest) {
  // One row per saved brief; bounded so the table can't be flooded.
  const limited = checkRateLimit(request, "concepts", 30, 3600000);
  if (limited) return limited;

  let parsed;
  try {
    parsed = bodySchema.safeParse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "That doesn't look like a finished brief." },
      { status: 400 },
    );
  }

  const shareToken = makeShareToken();
  // Returned to the creating browser only, never rendered into the share page.
  // See the note on concepts.editToken in src/db/schema.ts.
  const editToken = makeShareToken();

  const row = {
    status: "ready" as const,
    creationMode: parsed.data.creationMode ?? ("quick" as const),
    shareToken,
    spaceType: parsed.data.spaceType || "unspecified",
    brief: parsed.data.brief,
    briefPins: parsed.data.pins ?? null,
    briefFacts: parsed.data.facts ?? null,
  };

  try {
    await db.insert(concepts).values({ ...row, editToken });
    return NextResponse.json({ ok: true, shareToken, editToken });
  } catch (error) {
    // A deploy can reach a database that has not had its migration applied
    // yet — schema changes here are a button in /admin/setup, pressed by a
    // person, so code and database are briefly out of step by design.
    //
    // Saving the brief matters far more than the edit token does. If the
    // column is missing, save without it: the user keeps their work and their
    // share link, and only re-picking images is unavailable until the button
    // is pressed. Losing a finished brief over an optional feature would be
    // the wrong trade.
    if (isUndefinedColumn(error)) {
      console.error(
        "[/api/concepts] concepts.edit_token is missing — saved without it. " +
          "Apply the pending migration from /admin/setup.",
      );
      try {
        await db.insert(concepts).values(row);
        return NextResponse.json({ ok: true, shareToken, editToken: null });
      } catch (retryError) {
        console.error("[/api/concepts] insert failed:", retryError);
      }
    } else {
      // Never hand a raw Postgres error to the browser — it names tables and
      // columns to anyone who asks.
      console.error("[/api/concepts] insert failed:", error);
    }
    return NextResponse.json(
      { ok: false, error: "Couldn't save the brief." },
      { status: 500 },
    );
  }
}
