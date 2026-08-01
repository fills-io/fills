"use client";

/**
 * Step 4 — Furniture.
 *
 * AI splits the room into 3 furniture sub-categories (e.g. Bedroom →
 * Bed / Nightstands / Wardrobe). Each sub-category gets its own
 * Pinterest grid. User picks pins per category, not "all furniture
 * for this room."
 *
 * Sub-section names are fetched once on first visit and persisted
 * into wizard state so revisiting the step doesn't burn tokens.
 * "Re-categorize" lets the user request a fresh set.
 */

import { useCallback, useEffect, useState } from "react";
import PinterestGrid from "@/components/wizard/PinterestGrid";
import { getIndustry } from "@/lib/space-taxonomy";
import type { WizardState } from "@/lib/wizard-state";
import type { FurnitureSubSection, PinterestPin } from "@/db/schema";

type Props = {
  state: WizardState;
  setState: (patch: Partial<WizardState>) => void;
};

const MAX_PINS_PER_SUBSECTION = 3;

type Status = "idle" | "loading" | "ready" | "error";

export default function FurnitureStep({ state, setState }: Props) {
  const industry = state.industryId ? getIndustry(state.industryId) : null;
  const spaceLabel =
    industry?.spaces.find((s) => s.id === state.spaceId)?.label ?? "Interior";
  const vibeHint = state.vibeQuery?.trim() || undefined;

  const existing = state.furnitureSubSections;
  const [status, setStatus] = useState<Status>(existing ? "ready" : "idle");
  const [error, setError] = useState<string | null>(null);

  // Fetch sub-categories from the AI. Persists to wizard state so the
  // call only happens once per session (or when the user re-categorizes).
  const fetchSubSections = useCallback(
    async (signal?: AbortSignal) => {
      setStatus("loading");
      setError(null);
      try {
        const response = await fetch("/api/ai/furniture-sub-sections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            space: spaceLabel,
            industry: industry?.label,
            vibe: vibeHint,
          }),
          signal,
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body?.error || `HTTP ${response.status}`);
        }
        const data = (await response.json()) as {
          subSections: Array<{ name: string; query: string }>;
        };
        const next: FurnitureSubSection[] = data.subSections.map((s) => ({
          name: s.name,
          query: s.query,
          pins: [],
        }));
        setState({ furnitureSubSections: next });
        setStatus("ready");
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setError(e instanceof Error ? e.message : String(e));
        setStatus("error");
      }
    },
    [spaceLabel, industry?.label, vibeHint, setState],
  );

  // First-load: if no sub-sections in state yet, fetch them.
  useEffect(() => {
    if (existing && existing.length > 0) {
      setStatus("ready");
      return;
    }
    const controller = new AbortController();
    fetchSubSections(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateSubSectionPins(index: number, pins: PinterestPin[]) {
    if (!existing) return;
    const next = existing.map((s, i) => (i === index ? { ...s, pins } : s));
    setState({ furnitureSubSections: next });
  }

  if (status === "loading") {
    return (
      <div className="border border-bdr-2 bg-bg-2 p-10 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
          Categorizing your {spaceLabel.toLowerCase()}…
        </div>
        <p className="mx-auto mt-3 max-w-md text-[13px] text-txt-2">
          The AI is picking the 3 furniture categories that most define this
          room. One moment.
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="border border-rose-700/50 bg-rose-950/30 p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-rose-300">
          Couldn&apos;t categorize furniture
        </p>
        <p className="mt-2 text-[13px] text-txt-2">{error}</p>
        <button
          onClick={() => fetchSubSections()}
          className="mt-3 text-[12px] underline underline-offset-2 text-rose-200 hover:text-rose-100"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!existing || existing.length === 0) return null;

  return (
    <div className="space-y-12">
      {/* Re-categorize action */}
      <div className="flex items-center justify-between gap-4 border-b border-bdr-2 pb-4">
        <p className="text-[13px] text-txt-2">
          Pick up to {MAX_PINS_PER_SUBSECTION} pins per category.
        </p>
        <button
          onClick={() => fetchSubSections()}
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-txt-3 transition hover:text-acc"
        >
          ↻ Re-categorize
        </button>
      </div>

      {/* One grid per sub-section */}
      {existing.map((subSection, i) => (
        <section key={subSection.name + i}>
          <div className="mb-4 flex items-baseline justify-between">
            <h3 className="font-serif text-[22px] text-txt">
              {subSection.name}
            </h3>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
              {subSection.pins.length} of {MAX_PINS_PER_SUBSECTION} picked
            </span>
          </div>
          <PinterestGrid
            initialQuery={subSection.query}
            categoryKey="furniture"
            spaceId={state.industryId}
            vibe={state.vibeQuery}
            sliceSeed={i + 1}
            maxSelections={MAX_PINS_PER_SUBSECTION}
            selectedPins={subSection.pins}
            onSelectionChange={(pins) => updateSubSectionPins(i, pins)}
            helperText="Pick pins that show shape, material, scale."
            suggestionContext={{
              step: `furniture-${subSection.name.toLowerCase()}`,
              industry: industry?.label,
              space: spaceLabel,
            }}
          />
        </section>
      ))}
    </div>
  );
}
