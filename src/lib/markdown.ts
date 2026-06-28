/**
 * A deliberately small markdown parser that turns the blog body into the same
 * Block[] the rest of the blog renders. It is NOT full markdown — it covers the
 * pieces a blog post actually needs, so we avoid a heavy dependency and never
 * render raw HTML (every block becomes a typed React element downstream, which
 * is also XSS-safe).
 *
 * Supported:
 *   ##, ### headings      (a single # is treated as ## — the page owns the H1)
 *   - or * bullet lists
 *   1. numbered lists
 *   > block quotes
 *   blank-line-separated paragraphs
 * Inline (handled later by PostBody): **bold** and [text](url).
 */

import type { Block } from "@/content/blog/posts";

export function parseMarkdown(md: string): Block[] {
  const lines = (md || "").replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  let i = 0;

  const flush = () => {
    if (para.length) {
      blocks.push({ k: "p", t: para.join(" ").trim() });
      para = [];
    }
  };

  while (i < lines.length) {
    const t = lines[i].trim();

    if (t === "") {
      flush();
      i++;
      continue;
    }

    if (/^###\s+/.test(t)) {
      flush();
      blocks.push({ k: "h3", t: t.replace(/^###\s+/, "") });
      i++;
      continue;
    }
    if (/^#{1,2}\s+/.test(t)) {
      flush();
      blocks.push({ k: "h2", t: t.replace(/^#{1,2}\s+/, "") });
      i++;
      continue;
    }

    if (/^>\s?/.test(t)) {
      flush();
      const parts: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        parts.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ k: "quote", t: parts.join(" ") });
      continue;
    }

    if (/^[-*]\s+/.test(t)) {
      flush();
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({ k: "ul", items });
      continue;
    }

    if (/^\d+\.\s+/.test(t)) {
      flush();
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ k: "ol", items });
      continue;
    }

    para.push(t);
    i++;
  }
  flush();
  return blocks;
}
