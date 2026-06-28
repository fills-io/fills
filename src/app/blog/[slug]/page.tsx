import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PostBody from "@/components/blog/PostBody";
import { AUTHOR } from "@/content/blog/posts";
import { getPostBySlug } from "@/lib/blog-store";

type Params = { slug: string };

// Posts are database-backed; render on demand so new posts appear immediately.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const url = `https://fills.io/blog/${post.slug}`;
  const title = post.metaTitle ?? `${post.title} | Fills`;
  return {
    title: { absolute: title },
    description: post.description,
    keywords: post.keywords,
    authors: [{ name: post.author }],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description: post.description,
      publishedTime: post.dateISO,
      authors: [post.author],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: post.description,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const url = `https://fills.io/blog/${post.slug}`;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.dateISO,
    dateModified: post.dateISO,
    author: { "@type": "Person", name: post.author },
    publisher: {
      "@type": "Organization",
      name: "Fills",
      url: "https://fills.io",
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <main className="min-h-screen bg-bg px-6 py-16 sm:px-8">
        <article className="mx-auto max-w-[680px]">
          <Link
            href="/blog"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-txt-3 transition hover:text-acc"
          >
            ← The Blog
          </Link>

          <div className="mt-8 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-txt-3">
            <span className="text-acc">{post.category}</span>
            <span>·</span>
            <span>{post.dateLabel}</span>
            <span>·</span>
            <span>{post.readingTime}</span>
          </div>
          <h1 className="mt-4 font-serif text-[clamp(32px,5vw,48px)] font-medium leading-[1.05] tracking-tight text-txt">
            {post.title}
          </h1>

          {/* Byline */}
          <div className="mt-7 flex items-center gap-3 border-y border-bdr py-4">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-acc font-mono text-[12px] font-medium text-white">
              {post.author.charAt(0)}
            </span>
            <div>
              <div className="text-[13px] font-medium text-txt">
                {post.author}
              </div>
              <div className="text-[11.5px] text-txt-2">{AUTHOR.role}</div>
            </div>
          </div>

          <div className="mt-12">
            <PostBody blocks={post.blocks} />
          </div>

          {/* Author bio + closing CTA */}
          <div className="mt-16 border-t border-bdr pt-8">
            <p className="text-[13.5px] leading-[1.7] text-txt-2">{AUTHOR.bio}</p>
            <Link
              href="/concept?mode=quick"
              className="mt-6 inline-flex items-center gap-2 bg-acc px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.1em] text-white transition hover:bg-acc-d"
            >
              Build your brief with Fills →
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
