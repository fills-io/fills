/**
 * POST /api/checkout — start a purchase.
 *
 * The browser says WHICH product and who it's for. It never says what that
 * costs: the price is looked up server-side from PRODUCTS, because a price
 * sent from a browser is a price a customer can edit.
 *
 * Today this runs on the placeholder provider (Stripe UAE needs a trade
 * licence), which records the purchase and hands back the same page. When
 * Stripe is connected the shape of the answer doesn't change — the redirect
 * simply points at a real payment page instead.
 *
 * Response:
 *   200 — { ok: true, redirectUrl }
 *   400 — { ok: false, error }
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { getPaymentProvider } from "@/lib/payments/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  product: z.enum(["brief", "pass"]),
  briefToken: z.string().max(64).nullable().optional(),
  email: z.string().email().max(200),
});

export async function POST(request: NextRequest) {
  // Each attempt writes a row; bound it so the table can't be flooded.
  const limited = checkRateLimit(request, "checkout", 20, 3_600_000);
  if (limited) return limited;

  let parsed;
  try {
    parsed = bodySchema.safeParse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "We need a valid email address to send this to." },
      { status: 400 },
    );
  }

  const { product, briefToken, email } = parsed.data;
  if (product === "brief" && !briefToken) {
    return NextResponse.json(
      { ok: false, error: "We couldn't tell which brief that was." },
      { status: 400 },
    );
  }

  const provider = getPaymentProvider();
  const returnUrl = briefToken
    ? `${request.nextUrl.origin}/brief/${briefToken}?email=${encodeURIComponent(email)}`
    : request.nextUrl.origin;

  const result = await provider.createCheckout({
    product,
    briefToken: briefToken ?? null,
    email,
    returnUrl,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, redirectUrl: result.redirectUrl });
}
