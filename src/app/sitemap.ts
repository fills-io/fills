import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/blog-store";

/** XML sitemap at /sitemap.xml — tells Google which pages to index. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://fills.io";

  const posts = await getPublishedPosts();
  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.dateISO),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/interior-design-brief-template`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.7 },
    ...postEntries,
    { url: `${base}/concept/quick`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/concept`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
