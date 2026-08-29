/**
 * GET /api/brief/[token]/pdf — the deck, rendered on the server.
 *
 * WHY THIS EXISTS: the PDF used to be built in the browser by
 * @react-pdf/renderer, which means the browser already held everything needed
 * to produce the finished, unwatermarked deck. A paywall on top of that is a
 * locked door in a room with no walls — anyone who opens dev tools has the
 * file. Charging for the deck requires the deck to be made somewhere the user
 * cannot reach.
 *
 * Two things fall out for free: phones no longer have to render a 55-image
 * document themselves, and a saved brief's PDF can be re-downloaded from its
 * link months later.
 *
 * THE PAYWALL IS BUILT BUT SWITCHED OFF. checkEntitlement() is the single
 * place the decision lives; it lets everyone through until PAYWALL_ENABLED is
 * true AND a payment provider is live. Enforcing before checkout exists would
 * only stop people downloading what they can currently have.
 *
 * When it is switched on, DELETE the client-side generation in ExportPanel at
 * the same time, or this route protects nothing.
 *
 * Response:
 *   200 — application/pdf
 *   402 — { ok: false, error } when the brief hasn't been paid for
 *   404 — unknown token
 */

import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";
import { db, concepts } from "@/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkEntitlement } from "@/lib/entitlements";
import BriefPDF, { type BriefFacts } from "@/components/wizard/BriefPDF";
import type { BriefPins } from "@/components/wizard/BriefDisplay";
import type { GenerateBriefResponse } from "@/lib/ai/prompts/generate-brief";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Fetching and embedding ~55 images takes appreciably longer than a page render.
export const maxDuration = 60;

function filename(projectType: string): string {
  const slug = projectType
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")
    .slice(0, 5)
    .join("-");
  return `fills-brief-${slug || "design"}-${new Date().toISOString().slice(0, 10)}.pdf`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  // Rendering a deck costs real CPU and pulls ~55 images through our proxy.
  const limited = checkRateLimit(request, "brief-pdf", 40, 3_600_000);
  if (limited) return limited;

  const { token } = await params;

  let row;
  try {
    const rows = await db
      .select()
      .from(concepts)
      .where(eq(concepts.shareToken, token))
      .limit(1);
    row = rows[0];
  } catch (error) {
    console.error("[/api/brief/pdf] lookup failed:", error);
    return NextResponse.json(
      { ok: false, error: "Couldn't load that brief." },
      { status: 500 },
    );
  }

  if (!row?.brief) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  // The paywall. Off until PAYWALL_ENABLED=true and a payment provider is
  // live — see src/lib/entitlements.ts.
  let entitled;
  try {
    entitled = await checkEntitlement(
      token,
      request.nextUrl.searchParams.get("email"),
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Couldn't check that purchase." },
      { status: 500 },
    );
  }
  if (!entitled.allowed) {
    return NextResponse.json(
      { ok: false, error: "This brief hasn't been unlocked yet." },
      { status: 402 },
    );
  }

  const brief = row.brief as unknown as GenerateBriefResponse;

  // 16:9 slides by default, A4 portrait on request. This used to be hardcoded
  // to "deck", which meant the page size the FAQ advertises did not exist on
  // the server at all — and this route is due to replace the browser-side
  // export entirely, so that would have quietly deleted A4 from the product.
  const format =
    request.nextUrl.searchParams.get("format") === "document"
      ? ("document" as const)
      : ("deck" as const);

  try {
    const buffer = await renderToBuffer(
      BriefPDF({
        brief,
        pins: (row.briefPins ?? undefined) as BriefPins | undefined,
        facts: (row.briefFacts ?? undefined) as BriefFacts | undefined,
        format,
        // Absolute, because @react-pdf resolves every image itself and has no
        // page context to resolve a relative path against.
        baseUrl: request.nextUrl.origin,
      }),
    );

    return new Response(new Uint8Array(buffer), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${filename(brief.summary.projectType)}"`,
        // Safe to cache per URL: ?format= is part of the cache key, so the two
        // page sizes never collide. Revisit if briefs become editable — a
        // cached deck would then hand back the pre-edit file.
        "cache-control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[/api/brief/pdf] render failed:", error);
    return NextResponse.json(
      { ok: false, error: "Couldn't build the PDF." },
      { status: 500 },
    );
  }
}
