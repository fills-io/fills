/**
 * /concept/quick — the Quick "canvas" flow (Setup → Vibe → Palette → generate),
 * with a live brief. The homepage "Build my brief" routes here; Full Studio
 * still uses the 9-step /concept/wizard.
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import QuickCanvas from "@/components/quick/QuickCanvas";

export const metadata: Metadata = {
  title: { absolute: "Make a Mood Board in 5 Minutes | Fills" },
  description:
    "Pick a room, a vibe and a palette, and get a complete interior design mood board and brief in about five minutes: colours, materials, lighting and furniture, with real reference images.",
  keywords: [
    "mood board generator",
    "quick mood board maker",
    "interior design mood board",
    "AI mood board generator",
    "5 minute design brief",
  ],
  alternates: { canonical: "/concept/quick" },
  openGraph: {
    type: "website",
    url: "/concept/quick",
    title: "Make a Mood Board in 5 Minutes | Fills",
    description:
      "Pick a room, a vibe and a palette, and get a complete mood board and brief in about five minutes.",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Make a Mood Board in 5 Minutes | Fills",
    description:
      "Pick a room, a vibe and a palette, and get a complete mood board and brief in about five minutes.",
    images: ["/opengraph-image"],
  },
};

export default function QuickConceptPage() {
  return (
    <div className="min-h-screen bg-bg text-txt">
      <Navbar />
      {/* The canvas is a working surface, so it has no visible headline. Crawlers
          and screen readers still need one, and exactly one. */}
      <h1 className="sr-only">
        Quick mood board maker — build an interior design brief in five minutes
      </h1>
      <Suspense
        fallback={
          <div className="mx-auto max-w-4xl px-6 py-24 text-txt-3 sm:px-8">
            Loading your canvas…
          </div>
        }
      >
        <QuickCanvas />
      </Suspense>
    </div>
  );
}
