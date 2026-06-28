import Link from "next/link";
import { notFound } from "next/navigation";
import PostEditor, { type EditablePost } from "@/components/admin/PostEditor";
import { getPostById } from "@/lib/blog-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let initial: EditablePost | null = null;
  let error: string | null = null;
  try {
    const post = await getPostById(id);
    if (post) {
      initial = {
        id: post.id,
        title: post.title,
        slug: post.slug,
        category: post.category,
        excerpt: post.excerpt ?? "",
        body: post.body,
        description: post.description ?? "",
        keywords: (post.keywords ?? []).join(", "),
        author: post.author ?? "",
        status: post.status,
      };
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  if (error) {
    return (
      <main className="px-6 py-10">
        <div className="mx-auto max-w-[1200px]">
          <div className="border border-amber-500/40 bg-amber-500/5 p-6 text-[13px] text-txt-2">
            Couldn&apos;t load this post.{" "}
            <span className="text-txt-3">{error}</span>
          </div>
        </div>
      </main>
    );
  }

  if (!initial) notFound();

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-8">
          <Link
            href="/admin/blog"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-txt-3 transition hover:text-acc"
          >
            ← All posts
          </Link>
          <h1 className="mt-3 font-serif text-[30px] font-medium text-txt">
            Edit post
          </h1>
        </div>
        <PostEditor initial={initial} />
      </div>
    </main>
  );
}
