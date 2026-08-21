/**
 * Who is allowed to download what.
 *
 * One question, asked in one place: has this person paid for this brief?
 * Two ways to be entitled —
 *
 *   • they bought that specific deck ($9, never expires — they own it), or
 *   • they hold a project pass that hasn't run out yet ($19, 30 days).
 *
 * A lapsed pass deliberately does NOT revoke anything already downloaded, and
 * the saved brief pages stay readable forever. Holding someone's finished work
 * hostage is the fastest way to lose them, and it saves us nothing.
 */

import { and, eq, gt, isNull, or } from "drizzle-orm";
import { db, purchases } from "@/db";

/**
 * The master switch.
 *
 * Off by default, and it must STAY off until a payment provider is live:
 * turning it on first would only stop people downloading things they can
 * currently have. Set PAYWALL_ENABLED=true when checkout works.
 */
export function paywallEnabled(): boolean {
  return process.env.PAYWALL_ENABLED === "true";
}

/** How long a project pass lasts. */
export const PASS_DAYS = 30;

export type Entitlement =
  | { allowed: true; via: "paywall-off" | "brief" | "pass" }
  | { allowed: false };

/**
 * @param briefToken the concept share token being downloaded
 * @param email      the buyer, as collected at checkout. Without one there is
 *                   nothing to match a purchase against.
 */
export async function checkEntitlement(
  briefToken: string,
  email: string | null,
): Promise<Entitlement> {
  if (!paywallEnabled()) return { allowed: true, via: "paywall-off" };
  if (!email) return { allowed: false };

  const normalised = email.trim().toLowerCase();

  try {
    const rows = await db
      .select()
      .from(purchases)
      .where(
        and(
          eq(purchases.email, normalised),
          isNull(purchases.refundedAt),
          or(
            // This exact deck, bought outright.
            and(eq(purchases.kind, "brief"), eq(purchases.briefToken, briefToken)),
            // Or any pass still inside its window.
            and(eq(purchases.kind, "pass"), gt(purchases.expiresAt, new Date())),
          ),
        ),
      )
      .limit(1);

    const hit = rows[0];
    if (!hit) return { allowed: false };
    return { allowed: true, via: hit.kind === "pass" ? "pass" : "brief" };
  } catch (error) {
    // A database wobble must not hand out free decks, and must not look like
    // a payment failure either — the caller reports it as a server error.
    console.error("[entitlements] lookup failed:", error);
    throw error;
  }
}
