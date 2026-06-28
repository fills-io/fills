"use client";

/**
 * The blog post editor — used for both "new" and "edit". Body is light markdown
 * with a small toolbar that inserts the syntax for you, plus a live preview
 * rendered with the same component the public blog uses. Saving POSTs (new) or
 * PATCHes (edit) to /api/admin/posts, then returns to the list.
 */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PostBody from "@/components/blog/PostBody";
import { parseMarkdown } from "@/lib/markdown";

export type EditablePost = {
  id?: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  body: string;
  description: string;
  keywords: string;
  author: string;
  status: "draft" | "published";
};

const EMPTY: EditablePost = {
  title: "",
  slug: "",
  category: "Interior design",
  excerpt: "",
  body: "",
  description: "",
  keywords: "",
  author: "",
  status: "draft",
};

export default function PostEditor({
  initial,
}: {
  initial?: Partial<EditablePost>;
}) {
  const router = useRouter();
  const [p, setP] = useState<EditablePost>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const set = <K extends keyof EditablePost>(k: K, v: EditablePost[K]) =>
    setP((prev) => ({ ...prev, [k]: v }));

  function insertAtCaret(text: string, wrapEnd?: string) {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = p.body.slice(start, end);
    const next =
      p.body.slice(0, start) +
      text +
      sel +
      (wrapEnd ?? "") +
      p.body.slice(end);
    set("body", next);
    requestAnimationFrame(() => {
      ta.focus();
      const caret = start + text.length + sel.length;
      ta.setSelectionRange(caret, caret);
    });
  }

  async function save() {
    if (!p.title.trim()) {
      setError("A title is required.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      title: p.title.trim(),
      slug: p.slug.trim() || undefined,
      category: p.category.trim() || "Interior design",
      excerpt: p.excerpt.trim() || undefined,
      body: p.body,
      description: p.description.trim() || undefined,
      keywords: p.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      author: p.author.trim() || undefined,
      status: p.status,
    };

    try {
      const res = await fetch(
        p.id ? `/api/admin/posts/${p.id}` : "/api/admin/posts",
        {
          method: p.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || `Save failed (HTTP ${res.status})`);
      }
      router.push("/admin/blog");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  const labelCls =
    "block font-mono text-[10px] uppercase tracking-[0.14em] text-txt-3 mb-1.5";
  const inputCls =
    "w-full border border-bdr-2 bg-bg-2 px-3 py-2.5 text-[14px] text-txt outline-none focus:border-acc";
  const toolBtn =
    "border border-bdr-2 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-txt-2 transition hover:border-acc hover:text-acc";

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_minmax(0,440px)]">
      {/* Form */}
      <div className="space-y-5">
        <div>
          <label className={labelCls}>Title</label>
          <input
            className={`${inputCls} font-serif text-[20px]`}
            value={p.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="How to choose a colour palette"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Category</label>
            <input
              className={inputCls}
              value={p.category}
              onChange={(e) => set("category", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>URL slug (optional)</label>
            <input
              className={inputCls}
              value={p.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="auto from title"
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Excerpt (one-line summary)</label>
          <input
            className={inputCls}
            value={p.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            placeholder="Shown on the blog list and in Google."
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className={labelCls + " mb-0"}>Body</label>
            <div className="flex gap-1.5">
              <button type="button" className={toolBtn} onClick={() => insertAtCaret("## ")}>
                H2
              </button>
              <button type="button" className={toolBtn} onClick={() => insertAtCaret("### ")}>
                H3
              </button>
              <button type="button" className={toolBtn} onClick={() => insertAtCaret("**", "**")}>
                Bold
              </button>
              <button type="button" className={toolBtn} onClick={() => insertAtCaret("- ")}>
                List
              </button>
              <button type="button" className={toolBtn} onClick={() => insertAtCaret("[", "](https://)")}>
                Link
              </button>
            </div>
          </div>
          <textarea
            ref={bodyRef}
            className={`${inputCls} min-h-[360px] font-mono text-[13px] leading-relaxed`}
            value={p.body}
            onChange={(e) => set("body", e.target.value)}
            placeholder={"Write here.\n\n## A heading\n\nA paragraph with **bold** and a [link](https://example.com).\n\n- a list item\n- another item"}
          />
          <p className="mt-1.5 text-[11px] text-txt-3">
            Use the buttons, or type: ## heading, **bold**, - list,
            [text](link). Leave a blank line between paragraphs.
          </p>
        </div>

        {/* SEO (optional) */}
        <details className="border border-bdr-2 bg-bg-2 p-4">
          <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.14em] text-txt-2">
            SEO &amp; byline (optional)
          </summary>
          <div className="mt-4 space-y-4">
            <div>
              <label className={labelCls}>Search description</label>
              <input
                className={inputCls}
                value={p.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Falls back to the excerpt."
              />
            </div>
            <div>
              <label className={labelCls}>Keywords (comma separated)</label>
              <input
                className={inputCls}
                value={p.keywords}
                onChange={(e) => set("keywords", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Author byline</label>
              <input
                className={inputCls}
                value={p.author}
                onChange={(e) => set("author", e.target.value)}
                placeholder="Falls back to the site author."
              />
            </div>
          </div>
        </details>

        {error && (
          <p className="border border-rose-500/40 bg-rose-500/5 px-4 py-3 text-[13px] text-rose-600">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 border-t border-bdr pt-5">
          <div className="flex border border-bdr-2">
            {(["draft", "published"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set("status", s)}
                className={`px-4 py-2 font-mono text-[10px] uppercase tracking-[0.1em] transition ${
                  p.status === s
                    ? "bg-acc text-white"
                    : "text-txt-2 hover:text-acc"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="bg-acc px-6 py-2.5 text-[13px] font-medium text-white transition hover:bg-acc-d disabled:opacity-50"
          >
            {saving ? "Saving…" : p.status === "published" ? "Publish" : "Save draft"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/blog")}
            className="text-[12px] text-txt-3 transition hover:text-acc"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Live preview */}
      <div className="lg:sticky lg:top-[76px] lg:h-fit">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-txt-3">
          Live preview
        </div>
        <div className="border border-bdr-2 bg-bg p-6">
          <h1 className="font-serif text-[26px] font-medium leading-tight tracking-tight text-txt">
            {p.title || "Untitled post"}
          </h1>
          <div className="mt-5">
            {p.body.trim() ? (
              <PostBody blocks={parseMarkdown(p.body)} />
            ) : (
              <p className="font-serif text-[15px] italic text-txt-3">
                Your post will appear here as you type.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
