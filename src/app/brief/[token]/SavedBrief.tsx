"use client";

/**
 * The client half of /brief/[token].
 *
 * BriefDisplay is shared with the live flows, which own "regenerate" and
 * "start over". Neither belongs on a saved brief — regenerating would replace
 * someone's saved work with different words, and this page has no flow to
 * start over. Both are pointed at a fresh brief instead, which is what a
 * visitor who lands here and wants their own actually needs.
 */

import { useRouter } from "next/navigation";
import BriefDisplay, { type BriefPins } from "@/components/wizard/BriefDisplay";
import type { BriefFacts } from "@/components/wizard/BriefPDF";
import type { GenerateBriefResponse } from "@/lib/ai/prompts/generate-brief";

export default function SavedBrief({
  brief,
  pins,
  facts,
  savedAt,
  token,
  locked,
}: {
  brief: GenerateBriefResponse;
  pins?: BriefPins;
  facts?: BriefFacts;
  savedAt: string;
  token: string;
  /** True when this visitor hasn't unlocked this deck. */
  locked: boolean;
}) {
  const router = useRouter();
  const startNew = () => router.push("/concept/quick");

  const saved = new Date(savedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 sm:px-8 sm:py-16">
      <div className="mb-8 flex flex-wrap items-center gap-3 border border-bdr-2 bg-bg-2 px-4 py-3">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-acc">
          Saved brief
        </span>
        <p className="min-w-0 flex-1 text-[13px] text-txt-2">
          Generated {saved}. This link is permanent. Share it with your
          designer or contractor.
        </p>
      </div>

      {/* Locked, the paywall lives INSIDE the brief, where the download panel
          would otherwise be. Sitting above it, it was a lock on an open door:
          the export panel below still built the full deck in the browser. */}
      <BriefDisplay
        brief={brief}
        pins={pins}
        facts={facts}
        onRegenerate={startNew}
        onStartOver={startNew}
        paywall={locked ? { briefToken: token } : undefined}
      />
    </main>
  );
}
