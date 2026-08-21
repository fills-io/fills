import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPublishedPosts } from "@/lib/blog-store";

// Posts come from the database (authored in /admin), so render fresh each time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Interior Design Blog | Fills" },
  description:
    "Practical notes on writing interior design briefs, building mood boards, and briefing a space well. Written by a working architect.",
  alternates: { canonical: "https://fills.io/blog" },
  openGraph: {
    type: "website",
    url: "https://fills.io/blog",
    title: "Interior Design Blog | Fills",
    description:
      "Practical notes on writing interior design briefs and building mood boards, from a working architect.",
    images: ["/opengraph-image"],
  },
  // Next replaces the whole openGraph/twitter block rather than merging fields,
  // so a page that only sets openGraph still shares the homepage headline on X.
  twitter: {
    card: "summary_large_image",
    title: "Interior Design Blog | Fills",
    description:
      "Practical notes on writing interior design briefs and building mood boards, from a working architect.",
    images: ["/opengraph-image"],
  },
};

export default async function BlogIndex() {
  const posts = await getPublishedPosts();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg px-6 py-20 sm:px-8">
        <div className="mx-auto max-w-[760px]">
          {/* Header */}
          <span className="inline-flex items-center gap-2.5 font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-acc">
            <span className="inline-block h-px w-6 bg-acc" />
            The Blog
          </span>
          <h1 className="mt-5 font-serif text-[clamp(34px,5vw,52px)] font-medium leading-[1.05] tracking-tight text-txt">
            Notes on briefing a space well.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-[1.8] font-light text-txt-2">
            Short, practical writing on interior design briefs, mood boards, and
            the small decisions that make a room hang together. Written from the
            studio, not the marketing department.
          </p>

          {/* Featured: the free template */}
          <Link
            href="/interior-design-brief-template"
            className="group relative mt-12 block border border-bdr-2 bg-bg-2 p-7 transition hover:border-acc"
          >
            <span className="absolute left-0 top-0 h-[16px] w-[16px] border-l-[1.5px] border-t-[1.5px] border-acc opacity-0 transition group-hover:opacity-100" />
            <span className="absolute bottom-0 right-0 h-[16px] w-[16px] border-b-[1.5px] border-r-[1.5px] border-acc opacity-0 transition group-hover:opacity-100" />
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-acc">
              Free resource
            </div>
            <h2 className="mt-3 font-serif text-[24px] font-medium leading-tight text-txt">
              The interior design brief template
            </h2>
            <p className="mt-2 max-w-lg text-[14px] leading-[1.7] font-light text-txt-2">
              A clean, printable one-pager that walks through every section of a
              good brief. Fill it in on screen, then print it or save it as a PDF.
            </p>
            <span className="mt-4 inline-block font-mono text-[11px] uppercase tracking-[0.1em] text-txt transition group-hover:text-acc">
              Get the template →
            </span>
          </Link>

          {/* Post list */}
          <div className="mt-14 border-t border-bdr">
            {posts.length === 0 ? (
              <p className="py-16 text-center font-serif text-[18px] italic text-txt-3">
                No posts yet. The first one is on its way.
              </p>
            ) : (
              posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group block border-b border-bdr py-9 transition"
                >
                  <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-txt-3">
                    <span className="text-acc">{post.category}</span>
                    <span>·</span>
                    <span>{post.dateLabel}</span>
                    <span>·</span>
                    <span>{post.readingTime}</span>
                  </div>
                  <h2 className="mt-3 font-serif text-[26px] font-medium leading-tight tracking-tight text-txt transition group-hover:text-acc">
                    {post.title}
                  </h2>
                  <p className="mt-2 max-w-xl text-[14.5px] leading-[1.75] font-light text-txt-2">
                    {post.excerpt}
                  </p>
                  <span className="mt-4 inline-block font-mono text-[11px] uppercase tracking-[0.1em] text-txt-3 transition group-hover:text-acc">
                    Read →
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
