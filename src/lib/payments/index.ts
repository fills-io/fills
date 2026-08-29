/**
 * The payment provider seam.
 *
 * Stripe is not connected yet — a Stripe UAE account requires a valid trade
 * licence, and fills.io doesn't have one to hand. Rather than wait, the whole
 * purchase flow is built against this interface and runs on a placeholder, so
 * the screens, the entitlement checks and the database are all real and
 * testable today. Connecting Stripe later is one file, not a rewrite.
 *
 * Whichever provider is active, the rules are the same:
 *   • the price is decided HERE, never sent from the browser;
 *   • a completed purchase is written once, keyed on the provider's event id,
 *     because payment webhooks arrive at least once and often twice.
 */

export type ProductId = "brief" | "pass";

export type Product = {
  id: ProductId;
  label: string;
  /** Minor units — 900 is $9.00. Money in floats is how rounding bugs start. */
  amountMinor: number;
  currency: "usd";
  blurb: string;
};

/**
 * The catalogue, server-side and authoritative.
 *
 * A price that lives in the browser is a price a customer can edit.
 */
export const PRODUCTS: Record<ProductId, Product> = {
  brief: {
    id: "brief",
    label: "This brief",
    amountMinor: 900,
    currency: "usd",
    blurb: "Unlock this deck. Yours to keep, forever.",
  },
  pass: {
    id: "pass",
    label: "Project pass",
    amountMinor: 1900,
    currency: "usd",
    blurb: "Every brief, every room, for 30 days.",
  },
};

export type CheckoutRequest = {
  product: ProductId;
  /** The deck being unlocked. Ignored for a pass, which covers everything. */
  briefToken: string | null;
  email: string;
  /** Where to send the buyer once they're done. */
  returnUrl: string;
};

export type CheckoutResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; error: string };

export interface PaymentProvider {
  readonly name: string;
  /** True when this provider can actually take money. */
  readonly live: boolean;
  createCheckout(req: CheckoutRequest): Promise<CheckoutResult>;
}

export function formatPrice(p: Product): string {
  return `$${(p.amountMinor / 100).toFixed(p.amountMinor % 100 === 0 ? 0 : 2)}`;
}
