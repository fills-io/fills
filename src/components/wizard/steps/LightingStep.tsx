"use client";

/**
 * Step 5 — Lighting.
 *
 * One grid, up to six lighting references: pendants, sconces, floor lamps,
 * ambient. The AI later reads these as "ambient + task + accent" layers.
 */

import PinterestStepWrapper from "./PinterestStepWrapper";
import { getIndustry } from "@/lib/space-taxonomy";
import type { WizardState } from "@/lib/wizard-state";

type Props = {
  state: WizardState;
  setState: (patch: Partial<WizardState>) => void;
};

const MAX_PINS = 6;

export default function LightingStep({ state, setState }: Props) {
  const industry = state.industryId ? getIndustry(state.industryId) : null;
  const spaceLabel =
    industry?.spaces.find((s) => s.id === state.spaceId)?.label.toLowerCase() ??
    "interior";

  return (
    <PinterestStepWrapper
      spaceLabel={spaceLabel}
      industryLabel={industry?.label}
      spaceId={state.industryId}
      vibe={state.vibeQuery}
      suggestionStep="lighting"
      category="lighting"
      categoryKey="lighting"
      rememberedQuery={state.lightingQuery}
      selectedPins={state.lightingPins ?? []}
      maxSelections={MAX_PINS}
      onChange={({ pins, query }) =>
        setState({ lightingPins: pins, lightingQuery: query })
      }
      helperText="Mood, task, accent: try to cover all three layers across your picks."
    />
  );
}
