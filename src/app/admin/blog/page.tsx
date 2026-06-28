import Link from "next/link";
import type { Post as DbPost } from "@/db";
import { listAllPosts } from "@/lib/blog-store";
import DeletePostButton from "@/components/admin/DeletePostButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function load(): Promise<{ rows: DbPost[]; error: string | null }> {
  try {
    return { rows: await listAllPosts(), error: null };
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : String(e) };
  }
}

function fmt(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminBlogList() {
  const { rows, error } = await load();

  return (
    <main className="px-6 py-12">
      <div className="mx-auto max-w-[1000px]">
        <div className="mb-8 flex items-end justify-between border-b border-bdr pb-6">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
              Blog
            </div>
            <h1 className="mt-2 font-serif text-[32px] font-medium text-txt">
              Your posts
            </h1>
          </div>
          <Link
            href="/admin/blog/new"
            className="bg-acc px-5 py-2.5 text-[13px] font-medium text-white transition hover:bg-acc-d"
          >
            New post
          </Link>
        </div>

        {error ? (
          <div className="border border-amber-500/40 bg-amber-500/5 p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-600">
              Database not ready
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-txt-2">
              The <code className="text-acc">posts</code> table doesn&apos;t
              exist yet. Run the one-time setup SQL in Supabase (Aisha has it),
              then refresh. Technical detail:{" "}
              <span className="text-txt-3">{error}</span>
            </p>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-serif text-[18px] italic text-txt-3">
              No posts yet.
            </p>
            <Link
              href="/admin/blog/new"
              className="mt-4 inline-block font-mono text-[11px] uppercase tracking-[0.1em] text-acc hover:text-acc-d"
            >
              Write your first post →
            </Link>
          </div>
        ) : (
          <div className="border border-bdr-2">
            {rows.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-4 border-b border-bdr-2 px-5 py-4 last:border-0"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-block px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] ${
                        r.status === "published"
                          ? "bg-emerald-500/15 text-emerald-700"
                          : "bg-bdr-2 text-txt-3"
                      }`}
                    >
                      {r.status}
                    </span>
                    <span className="truncate font-serif text-[18px] text-txt">
                      {r.title}
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-txt-3">
                    {r.category} · /{r.slug} · updated {fmt(r.updatedAt)}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-[12px]">
                  {r.status === "published" && (
                    <Link
                      href={`/blog/${r.slug}`}
                      className="font-mono text-[10px] uppercase tracking-[0.1em] text-txt-3 transition hover:text-acc"
                    >
                      View
                    </Link>
                  )}
                  <Link
                    href={`/admin/blog/${r.id}`}
                    className="border border-bdr-2 px-3 py-1.5 text-txt-2 transition hover:border-acc hover:text-acc"
                  >
                    Edit
                  </Link>
                  <DeletePostButton id={r.id} title={r.title} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
