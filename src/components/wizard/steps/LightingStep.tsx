"use client";

/**
 * Step 5 — Lighting.
 *
 * One Pinterest grid, up to 3 lighting references — pendants, sconces,
 * floor lamps, ambient. The AI will later analyze these as "mood + task +
 * accent" layers.
 */

import PinterestStepWrapper from "./PinterestStepWrapper";
import { getIndustry } from "@/lib/space-taxonomy";
import type { WizardState } from "@/lib/wizard-state";

type Props = {
  state: WizardState;
  setState: (patch: Partial<WizardState>) => void;
};

const MAX_PINS = 3;

export default function LightingStep({ state, setState }: Props) {
  const industry = state.industryId ? getIndustry(state.industryId) : null;
  const spaceLabel =
    industry?.spaces.find((s) => s.id === state.spaceId)?.label.toLowerCase() ??
    "interior";

  return (
    <PinterestStepWrapper
      spaceLabel={spaceLabel}
      industryLabel={industry?.label}
      suggestionStep="lighting"
      category="lighting"
      rememberedQuery={state.lightingQuery}
      selectedPins={state.lightingPins ?? []}
      maxSelections={MAX_PINS}
      onChange={({ pins, query }) =>
        setState({ lightingPins: pins, lightingQuery: query })
      }
      helperText="Mood, task, accent: try to cover all three layers in your three picks."
    />
  );
}
