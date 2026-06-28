/**
 * Edge middleware — gates /admin/* behind HTTP Basic Auth.
 *
 * The browser shows a native email + password prompt. Credentials are
 * checked against ADMIN_USER / ADMIN_PASSWORD (server env vars, NEVER in
 * code — the repo is public). Good enough for a small internal dashboard
 * over HTTPS; real multi-user auth (Clerk) lands in Phase 6.
 *
 * If the env vars aren't set, the admin area stays locked (deny by default).
 */

import { NextResponse, type NextRequest } from "next/server";

export const config = {
  // Gate the admin pages AND the admin write API behind the same Basic Auth.
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

export function middleware(request: NextRequest) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;

  const unauthorized = () =>
    new NextResponse("Authentication required.", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Fills Admin"' },
    });

  // Deny by default if credentials aren't configured.
  if (!user || !pass) return unauthorized();

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return unauthorized();

  let decoded = "";
  try {
    decoded = atob(header.slice(6));
  } catch {
    return unauthorized();
  }
  const sep = decoded.indexOf(":");
  const givenUser = decoded.slice(0, sep);
  const givenPass = decoded.slice(sep + 1);

  if (givenUser !== user || givenPass !== pass) return unauthorized();

  return NextResponse.next();
}
