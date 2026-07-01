/**
 * /concept/wizard — the 9-step brief builder.
 *
 * This page only renders the shell:
 *   - Top navbar
 *   - Progress strip across all 9 steps
 *   - The active step's placeholder card
 *   - Back / Next navigation
 *
 * The individual steps (Pinterest grids, color builder, AI helpers) get
 * built in follow-up PRs. For now each step is an empty card so you can
 * walk the navigation end-to-end and see the progress bar advance.
 *
 * Wizard state lives in-memory on the client for this first PR. We'll
 * persist to the concepts table in a follow-up — at that point the URL
 * will include a brief ID and refreshing will restore the work.
 */

import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import WizardClient from "./WizardClient";

export default function WizardPage() {
  return (
    <div className="min-h-screen bg-dark text-hero-cream">
      <Navbar />
      <Suspense
        fallback={
          <div className="mx-auto max-w-4xl px-6 py-24 sm:px-8 text-hero-dim">
            Loading your wizard…
          </div>
        }
      >
        <WizardClient />
      </Suspense>
    </div>
  );
}
