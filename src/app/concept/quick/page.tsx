/**
 * /concept/quick — the Quick "canvas" flow (Setup → Vibe → Palette → generate),
 * with a live brief. The homepage "Build my brief" routes here; Full Studio
 * still uses the 9-step /concept/wizard.
 */

import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import QuickCanvas from "@/components/quick/QuickCanvas";

export default function QuickConceptPage() {
  return (
    <div className="min-h-screen bg-bg text-txt">
      <Navbar />
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
