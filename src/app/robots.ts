import type { MetadataRoute } from "next";

/** /robots.txt — lets crawlers in, keeps the admin + API out of the index. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    },
    sitemap: "https://fills.io/sitemap.xml",
  };
}
