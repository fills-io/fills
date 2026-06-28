import Link from "next/link";
import PostEditor from "@/components/admin/PostEditor";

export const dynamic = "force-dynamic";

export default function NewPostPage() {
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
            New post
          </h1>
        </div>
        <PostEditor />
      </div>
    </main>
  );
}
