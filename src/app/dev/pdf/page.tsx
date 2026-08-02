/**
 * /dev/pdf — a harness for working on the exported deck.
 *
 * It renders BriefPDF with fixture copy and REAL curated reference images, so
 * layout, image density, cropping and resolution can be checked without
 * spending an OpenAI call on every iteration.
 *
 * Development only: 404s in production, and kept out of the sitemap.
 */

import { notFound } from "next/navigation";
import DevPdfClient from "./DevPdfClient";

export const metadata = { robots: { index: false, follow: false } };

export default function DevPdfPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DevPdfClient />;
}
