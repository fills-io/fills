/**
 * Blog data layer. The public site and the admin both read/write posts through
 * here so there's one place that knows about the database.
 *
 * Resilience: the DB connection module (`@/db`) throws at import time when
 * DATABASE_URL is missing (e.g. local dev), and queries throw if the `posts`
 * table doesn't exist yet. So public reads use a dynamic import inside try/catch
 * and fall back to the in-repo seed post — the public /blog never crashes,
 * even before the migration is applied. Admin writes require a real DB and let
 * errors surface (the admin UI shows them).
 */

import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { AUTHOR, POSTS } from "@/content/blog/posts";
import type { Block } from "@/content/blog/posts";
import type { Post as DbPost } from "@/db";
import { parseMarkdown } from "@/lib/markdown";

/** Shared validation for the create/update API routes. */
export const postSchema = z.object({
  title: z.string().trim().min(1, "A title is required.").max(200),
  slug: z.string().trim().max(200).optional(),
  excerpt: z.string().max(500).optional(),
  body: z.string().max(100_000).default(""),
  category: z.string().max(80).optional(),
  metaTitle: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  keywords: z.array(z.string().max(60)).max(30).optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  author: z.string().max(120).optional(),
});

export type RenderablePost = {
  slug: string;
  title: string;
  metaTitle?: string | null;
  description: string;
  excerpt: string;
  category: string;
  author: string;
  dateISO: string;
  dateLabel: string;
  readingTime: string;
  blocks: Block[];
  keywords?: string[];
};

export type PostInput = {
  title: string;
  slug?: string;
  excerpt?: string;
  body: string;
  category?: string;
  metaTitle?: string;
  description?: string;
  keywords?: string[];
  status: "draft" | "published";
  author?: string;
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtMonthYear(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function readingTime(body: string): string {
  const words = (body || "").trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "post"
  );
}

function fromDb(row: DbPost): RenderablePost {
  const date = row.publishedAt ?? row.createdAt;
  return {
    slug: row.slug,
    title: row.title,
    metaTitle: row.metaTitle,
    description: row.description || row.excerpt || row.title,
    excerpt: row.excerpt || "",
    category: row.category,
    author: row.author || AUTHOR.name,
    dateISO: (date instanceof Date ? date : new Date(date)).toISOString(),
    dateLabel: fmtMonthYear(date),
    readingTime: readingTime(row.body),
    blocks: parseMarkdown(row.body),
    keywords: row.keywords ?? undefined,
  };
}

/** In-repo fallback posts, mapped to the renderable shape. */
function seedRenderable(): RenderablePost[] {
  return POSTS.map((p) => ({
    slug: p.slug,
    title: p.title,
    metaTitle: p.metaTitle ?? null,
    description: p.description,
    excerpt: p.excerpt,
    category: p.category,
    author: AUTHOR.name,
    dateISO: p.date,
    dateLabel: p.dateLabel,
    readingTime: p.readingTime,
    blocks: p.body,
    keywords: p.keywords,
  }));
}

/** Dynamic import so a missing DATABASE_URL doesn't crash at module load. */
async function getDb() {
  const mod = await import("@/db");
  return { db: mod.db, posts: mod.posts };
}

// ─── public reads (resilient) ────────────────────────────────────────────────

export async function getPublishedPosts(): Promise<RenderablePost[]> {
  try {
    const { db, posts } = await getDb();
    const rows = await db
      .select()
      .from(posts)
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.publishedAt));
    return rows.map(fromDb);
  } catch {
    return seedRenderable();
  }
}

export async function getPostBySlug(
  slug: string,
): Promise<RenderablePost | null> {
  try {
    const { db, posts } = await getDb();
    const rows = await db
      .select()
      .from(posts)
      .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
      .limit(1);
    if (rows[0]) return fromDb(rows[0]);
  } catch {
    // fall through to seed
  }
  return seedRenderable().find((p) => p.slug === slug) ?? null;
}

// ─── admin reads/writes (require a real DB) ──────────────────────────────────

export async function listAllPosts(): Promise<DbPost[]> {
  const { db, posts } = await getDb();
  return db.select().from(posts).orderBy(desc(posts.updatedAt));
}

export async function getPostById(id: string): Promise<DbPost | null> {
  const { db, posts } = await getDb();
  const rows = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return rows[0] ?? null;
}

async function uniqueSlug(
  base: string,
  excludeId?: string,
): Promise<string> {
  const { db, posts } = await getDb();
  let slug = base;
  let n = 1;
  // Bounded loop: append -2, -3 … until the slug is free.
  while (n < 1000) {
    const rows = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);
    if (!rows[0] || rows[0].id === excludeId) return slug;
    n++;
    slug = `${base}-${n}`;
  }
  return `${base}-${Date.now()}`;
}

export async function createPost(input: PostInput): Promise<DbPost> {
  const { db, posts } = await getDb();
  const slug = await uniqueSlug(slugify(input.slug || input.title));
  const now = new Date();
  const rows = await db
    .insert(posts)
    .values({
      slug,
      title: input.title,
      excerpt: input.excerpt || null,
      body: input.body || "",
      category: input.category || "Interior design",
      metaTitle: input.metaTitle || null,
      description: input.description || null,
      keywords: input.keywords && input.keywords.length ? input.keywords : null,
      status: input.status,
      author: input.author || null,
      publishedAt: input.status === "published" ? now : null,
    })
    .returning();
  return rows[0];
}

export async function updatePost(
  id: string,
  input: PostInput,
): Promise<DbPost | null> {
  const { db, posts } = await getDb();
  const existing = await getPostById(id);
  if (!existing) return null;

  const slug = await uniqueSlug(slugify(input.slug || input.title), id);
  const now = new Date();
  const publishedAt =
    input.status === "published" ? (existing.publishedAt ?? now) : null;

  const rows = await db
    .update(posts)
    .set({
      slug,
      title: input.title,
      excerpt: input.excerpt || null,
      body: input.body || "",
      category: input.category || "Interior design",
      metaTitle: input.metaTitle || null,
      description: input.description || null,
      keywords: input.keywords && input.keywords.length ? input.keywords : null,
      status: input.status,
      author: input.author || null,
      publishedAt,
      updatedAt: now,
    })
    .where(eq(posts.id, id))
    .returning();
  return rows[0] ?? null;
}

export async function deletePost(id: string): Promise<void> {
  const { db, posts } = await getDb();
  await db.delete(posts).where(eq(posts.id, id));
}
