/**
 * PATCH  /api/admin/posts/[id] — update a post.
 * DELETE /api/admin/posts/[id] — delete a post.
 *
 * Gated by Basic Auth in middleware.ts (matcher includes /api/admin/*).
 */

import { NextResponse, type NextRequest } from "next/server";
import { updatePost, deletePost, postSchema } from "@/lib/blog-store";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

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
    const post = await updatePost(id, parsed.data);
    if (!post) {
      return NextResponse.json({ ok: false, error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, id: post.id, slug: post.slug });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[/api/admin/posts/[id]] update failed:", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await deletePost(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[/api/admin/posts/[id]] delete failed:", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
