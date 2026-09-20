/**
 * GET /api/admin/email-check
 *
 * Answers one question a person can't otherwise answer without Vercel's
 * logs: will the lead alert email actually send? It logs in to Gmail with the
 * configured settings and reports Google's verdict, without sending anything.
 *
 * Behind the same Basic Auth as the rest of /admin (see src/middleware.ts).
 * Never returns the password, only whether it is set and its length.
 *
 * Response: GmailCheck as JSON, e.g.
 *   { "gmailUser": "aisha@fills.io", "appPasswordSet": true,
 *     "appPasswordLength": 16, "recipients": ["aisha@fills.io"], "login": "ok" }
 */

import { NextResponse } from "next/server";
import { checkGmail } from "@/lib/lead-alert";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await checkGmail();
  return NextResponse.json(result, {
    status: result.login === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
