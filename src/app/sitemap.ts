import type { MetadataRoute } from "next";

/** XML sitemap at /sitemap.xml — tells Google which pages to index. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://fills.io";
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/create`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/concept`, changeFrequency: "monthly", priority: 0.6 },
  ];
}
