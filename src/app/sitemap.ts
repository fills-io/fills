import type { MetadataRoute } from "next";
import { POSTS } from "@/content/blog/posts";

/** XML sitemap at /sitemap.xml — tells Google which pages to index. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://fills.io";

  const postEntries: MetadataRoute.Sitemap = POSTS.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/interior-design-brief-template`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.7 },
    ...postEntries,
    { url: `${base}/create`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/concept`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
