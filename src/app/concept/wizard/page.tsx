/**
 * /concept/wizard — Full Studio, the nine-step brief builder.
 *
 * The page itself is only the shell: navbar, then WizardClient, which owns the
 * progress strip, the active step, and Back / Next. Every step is real (space,
 * vibe, colours, materials, lighting, furniture, flooring, ceiling, review) and
 * ends in a generated brief.
 *
 * Work in progress is kept in the browser, not the database: a draft survives a
 * refresh via wizard-storage, and only the finished brief is saved server-side,
 * behind the share token in /brief/[token].
 */

import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import WizardClient from "./WizardClient";

export const metadata: Metadata = {
  title: { absolute: "Interior Design Brief Generator — 9-Step Builder | Fills" },
  description:
    "The full studio flow: nine steps through room, style, palette, materials, lighting and furniture, ending in a complete interior design brief you can export as a PDF and hand to a contractor.",
  keywords: [
    "interior design brief generator",
    "design brief builder",
    "interior design brief maker",
    "design brief tool for designers",
    "interior design specification",
  ],
  alternates: { canonical: "/concept/wizard" },
  openGraph: {
    type: "website",
    url: "/concept/wizard",
    title: "Interior Design Brief Generator — 9-Step Builder | Fills",
    description:
      "Nine steps through room, style, palette, materials, lighting and furniture, ending in a complete brief you can export as a PDF.",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Interior Design Brief Generator — 9-Step Builder | Fills",
    description:
      "Nine steps through room, style, palette, materials, lighting and furniture, ending in a complete brief you can export as a PDF.",
    images: ["/opengraph-image"],
  },
};

export default function WizardPage() {
  return (
    <div className="min-h-screen bg-bg text-txt">
      <Navbar />
      {/* The wizard's own headings are per-step, and the shell is all a crawler
          ever sees, so the page needs one stable h1 that isn't visible chrome. */}
      <h1 className="sr-only">
        Interior design brief generator: the nine-step studio flow
      </h1>
      <Suspense
        fallback={
          <div className="mx-auto max-w-4xl px-6 py-24 sm:px-8 text-txt-3">
            Loading your wizard…
          </div>
        }
      >
        <WizardClient />
      </Suspense>
    </div>
  );
}
