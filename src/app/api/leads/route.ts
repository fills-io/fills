/**
 * POST /api/leads
 *
 * Stores an early-access email capture from the flow's "view your concept"
 * gate, along with what the person was designing. Viewable in Supabase →
 * Table Editor → leads.
 *
 * Best-effort: the flow advances the user regardless of whether this
 * succeeds, so a DB hiccup never blocks them. Returns 200 on success,
 * 400 on bad input, 500 on a storage error (the client ignores failures).
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db, leads } from "@/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email().max(200),
  name: z.string().max(120).optional(),
  industry: z.string().max(120).optional(),
  spec: z.string().max(200).optional(),
  vibe: z.string().max(200).optional(),
  message: z.string().max(2000).optional(),
  source: z.enum(["quick", "upload", "talk-to-designer"]).optional(),
});

export async function POST(request: NextRequest) {
  let parsed;
  try {
    parsed = bodySchema.safeParse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "A valid email is required." },
      { status: 400 },
    );
  }

  try {
    await db.insert(leads).values({
      email: parsed.data.email.trim().toLowerCase(),
      name: parsed.data.name || null,
      industry: parsed.data.industry || null,
      spec: parsed.data.spec || null,
      vibe: parsed.data.vibe || null,
      message: parsed.data.message || null,
      source: parsed.data.source || null,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[/api/leads] insert failed:", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
