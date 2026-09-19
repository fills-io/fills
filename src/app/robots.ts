import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** /robots.txt — lets crawlers in, keeps the admin + API out of the index. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
