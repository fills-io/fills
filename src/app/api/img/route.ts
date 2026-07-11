/**
 * GET /api/img?url=<encoded image url>
 *
 * A tiny, host-restricted image proxy. It streams a Pinterest CDN image back
 * through our own origin so the browser can draw it to a <canvas> and read its
 * pixels (for colour extraction) WITHOUT tainting the canvas — a cross-origin
 * image would otherwise block getImageData().
 *
 * Security: we only proxy images from Pinterest's CDN (*.pinimg.com) so this
 * can't be used as an open proxy / SSRF vector.
 *
 * Response:
 *   200 OK   — the image bytes, cached for a day
 *   400 BAD  — missing/invalid url
 *   403 FORB — host not on the allow-list
 *   502 ERR  — upstream fetch failed
 */

import { type NextRequest } from "next/server";

export const runtime = "nodejs";

/** Only Pinterest's image CDN is allowed through the proxy. */
function isAllowedHost(hostname: string): boolean {
  return hostname === "pinimg.com" || hostname.endsWith(".pinimg.com");
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) {
    return new Response("Missing url", { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  if (target.protocol !== "https:" || !isAllowedHost(target.hostname)) {
    return new Response("Host not allowed", { status: 403 });
  }

  try {
    const upstream = await fetch(target.toString(), {
      // A UA header keeps some CDNs from 403-ing an "unknown" client.
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FillsBot/1.0)" },
      cache: "force-cache",
    });
    if (!upstream.ok || !upstream.body) {
      return new Response("Upstream fetch failed", { status: 502 });
    }
    const contentType =
      upstream.headers.get("content-type") ?? "image/jpeg";
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return new Response("Upstream fetch failed", { status: 502 });
  }
}
