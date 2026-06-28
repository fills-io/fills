/**
 * POST /api/admin/posts — create a blog post.
 *
 * Gated by Basic Auth in middleware.ts (matcher includes /api/admin/*), so
 * only the site owner can reach it. The body is the editor's payload.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createPost, postSchema } from "@/lib/blog-store";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let parsed;
  try {
    parsed = postSchema.safeParse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  }

  try {
    const post = await createPost(parsed.data);
    return NextResponse.json({ ok: true, id: post.id, slug: post.slug });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[/api/admin/posts] create failed:", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
