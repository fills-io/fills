/**
 * Picks the payment provider, and holds the placeholder.
 *
 * The placeholder exists because Stripe UAE needs a trade licence that
 * fills.io doesn't have yet. It records a real purchase row so the paywall,
 * the entitlement check and the download can all be exercised end to end —
 * but it never takes money, and it refuses to run in production.
 *
 * When Stripe is ready: add a StripeProvider implementing the same interface,
 * return it from getPaymentProvider() when the keys are present, and delete
 * nothing else. That is the whole point of the seam.
 */

import { randomUUID } from "node:crypto";
import { db, purchases } from "@/db";
import { PASS_DAYS } from "@/lib/entitlements";
import {
  PRODUCTS,
  type CheckoutRequest,
  type CheckoutResult,
  type PaymentProvider,
} from "./index";

/**
 * Grants the purchase immediately, without charging anyone.
 *
 * DEVELOPMENT AND PREVIEW ONLY. Handing the product away on the live site
 * would be indefensible, so it refuses there.
 *
 * The check is on VERCEL_ENV, not NODE_ENV: every Vercel deployment builds
 * with NODE_ENV=production, preview ones included, so gating on that would
 * refuse everywhere and leave the flow untestable outside localhost.
 * VERCEL_ENV is "production" only on the real domain.
 */
const placeholderProvider: PaymentProvider = {
  name: "placeholder",
  live: false,

  async createCheckout(req: CheckoutRequest): Promise<CheckoutResult> {
    if (process.env.VERCEL_ENV === "production") {
      return {
        ok: false,
        error: "Payments aren't switched on yet.",
      };
    }

    const product = PRODUCTS[req.product];
    const expiresAt =
      product.id === "pass"
        ? new Date(Date.now() + PASS_DAYS * 24 * 60 * 60 * 1000)
        : null;

    try {
      await db.insert(purchases).values({
        email: req.email.trim().toLowerCase(),
        kind: product.id,
        briefToken: product.id === "brief" ? req.briefToken : null,
        expiresAt,
        amountMinor: String(product.amountMinor),
        currency: product.currency,
        provider: "placeholder",
        // Unique per attempt, mirroring the idempotency key a real provider
        // supplies — so the insert path is identical once Stripe replaces it.
        providerEventId: `placeholder_${randomUUID()}`,
      });
    } catch (error) {
      console.error("[payments] placeholder purchase failed:", error);
      return { ok: false, error: "Couldn't record that purchase." };
    }

    // No redirect to a payment page — there isn't one. Straight back.
    return { ok: true, redirectUrl: req.returnUrl };
  },
};

export function getPaymentProvider(): PaymentProvider {
  // When Stripe lands:
  //   if (process.env.STRIPE_SECRET_KEY) return stripeProvider;
  return placeholderProvider;
}
