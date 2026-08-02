/**
 * A small in-process rate limiter for the paid endpoints.
 *
 * Every AI and scraping route is a public POST that spends real money —
 * /api/ai/generate-brief calls GPT-5, /api/pinterest/search calls a paid Apify
 * actor — and until now nothing stood between them and a ten-line script.
 *
 * HONEST LIMITATION: serverless functions scale horizontally, so this counts
 * per running instance, not globally. Someone determined, hitting hard enough
 * to spin up many instances, gets a higher effective ceiling than the numbers
 * below suggest. It is a floor, not a wall — it stops casual abuse, a runaway
 * script, and a naive uptime monitor pinging an AI endpoint every minute.
 *
 * A global limit needs shared state (Upstash/Vercel KV, or a Postgres table).
 * Worth doing if this ever shows up on a bill; not worth a paid dependency
 * before then.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Drop expired buckets so an idle instance doesn't grow forever. */
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key);
}

/**
 * The caller's IP, as far as we can tell behind Vercel's proxy. Falls back to
 * a single shared key, which means an unidentifiable caller shares one budget
 * with every other unidentifiable caller — deliberately strict.
 */
export function clientKey(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export type RateLimitResult = {
  ok: boolean;
  /** Seconds until the window resets — for the Retry-After header. */
  retryAfter: number;
};

/**
 * Consume one unit from `key`'s budget.
 *
 * @param limit   requests allowed per window
 * @param windowMs length of the window
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return { ok: false, retryAfter: Math.ceil((existing.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

/**
 * Guard a route. Returns a 429 Response to return immediately, or null to
 * carry on.
 *
 * `name` scopes the budget, so a user who has used up their brief generations
 * can still search for images.
 */
export function checkRateLimit(
  request: Request,
  name: string,
  limit: number,
  windowMs: number,
): Response | null {
  const { ok, retryAfter } = rateLimit(`${name}:${clientKey(request)}`, limit, windowMs);
  if (ok) return null;
  return new Response(
    JSON.stringify({
      ok: false,
      error: "You've made a lot of requests just now. Try again in a minute.",
    }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(retryAfter),
      },
    },
  );
}
