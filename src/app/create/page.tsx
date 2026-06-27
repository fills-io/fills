import { Suspense } from "react";
import FlowApp from "@/components/flow/FlowApp";

/**
 * /create — the QuickFlow entry. Receives ?path=quick|upload and the
 * prefilled ?industry= &spec= &vibe= from the homepage builder.
 *
 * FlowApp uses useSearchParams, so it must sit inside a Suspense boundary.
 */
export default function CreatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <FlowApp />
    </Suspense>
  );
}
