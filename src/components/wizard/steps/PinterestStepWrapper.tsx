"use client";

/**
 * Generic wrapper for any wizard step whose body is just "search Pinterest,
 * pick N pins". Furniture, Lighting, Flooring, Ceiling, and Materials all
 * route through here — only the seed query and max-selection cap differ.
 *
 * Each concrete step file (`FurnitureStep.tsx`, `LightingStep.tsx`, …) is
 * a thin wrapper that wires this component into the right WizardState
 * fields. That isolation keeps the Pinterest selection contract type-safe
 * even as new steps are added.
 */

import { useSearchParams } from "next/navigation";
import PinterestGrid from "@/components/wizard/PinterestGrid";
import type { PinterestPin } from "@/db/schema";

type Props = {
  /** Used to seed a contextual default query when no override is provided. */
  spaceLabel?: string;
  /** Falls back to `${spaceLabel} ${category}` when not set. */
  category: string;
  /** Optional override seed query — wins over the default if provided. */
  overrideSeedQuery?: string;
  /** Previously-typed query for this step (so re-visits don't reset). */
  rememberedQuery?: string;
  /** Pins currently selected for this step. */
  selectedPins: PinterestPin[];
  /** Max pins this step accepts. */
  maxSelections: number;
  /** Tells the parent (the WizardClient) about new picks or query changes. */
  onChange: (next: { pins: PinterestPin[]; query: string }) => void;
  /** One-line guidance shown under the search bar. */
  helperText: string;
  /** Curated category key — the fixed reference set this step draws from. */
  categoryKey?: string;
  /** Optional URL search-param key to also consult for the seed query. */
  urlSeedKey?: string;
  /**
   * Wizard step ID — passed to the AI suggestion endpoint so it can
   * tailor proposals (a Lighting search wants very different suggestions
   * than a Flooring search even with the same query text).
   * Omit to disable AI suggestions for this step.
   */
  suggestionStep?: string;
  /** Industry label ("Residential" etc.), passed to AI suggestions. */
  industryLabel?: string;
  /** space-taxonomy industry id, so the curated grid is project-aware. */
  spaceId?: string | null;
  /** The user's chosen style, used to rank the curated grid. */
  vibe?: string;
};

export default function PinterestStepWrapper({
  spaceLabel,
  category,
  overrideSeedQuery,
  rememberedQuery,
  selectedPins,
  maxSelections,
  onChange,
  helperText,
  categoryKey,
  urlSeedKey,
  suggestionStep,
  industryLabel,
  spaceId,
  vibe,
}: Props) {
  const params = useSearchParams();

  // Priority order: remembered (user typed previously) > URL seed > override > default.
  const urlSeed = urlSeedKey ? params.get(urlSeedKey) : null;
  const defaultQuery = spaceLabel
    ? `${spaceLabel} ${category}`
    : category;

  const seededQuery =
    rememberedQuery ?? urlSeed ?? overrideSeedQuery ?? defaultQuery;

  return (
    <PinterestGrid
      initialQuery={seededQuery}
      categoryKey={categoryKey}
      spaceId={spaceId}
      vibe={vibe}
      maxSelections={maxSelections}
      selectedPins={selectedPins}
      onSelectionChange={(pins) =>
        onChange({ pins, query: seededQuery })
      }
      helperText={helperText}
      suggestionContext={
        suggestionStep
          ? {
              step: suggestionStep,
              industry: industryLabel,
              space: spaceLabel,
            }
          : undefined
      }
    />
  );
}
