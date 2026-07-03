"use client";

/**
 * Step 6 — Flooring.
 *
 * Up to 2 picks. Usually one dominant floor surface; an optional accent
 * for transitions, rugs, or zoning.
 */

import PinterestStepWrapper from "./PinterestStepWrapper";
import { getIndustry } from "@/lib/space-taxonomy";
import type { WizardState } from "@/lib/wizard-state";

type Props = {
  state: WizardState;
  setState: (patch: Partial<WizardState>) => void;
};

const MAX_PINS = 2;

export default function FlooringStep({ state, setState }: Props) {
  const industry = state.industryId ? getIndustry(state.industryId) : null;
  const spaceLabel =
    industry?.spaces.find((s) => s.id === state.spaceId)?.label.toLowerCase() ??
    "interior";

  return (
    <PinterestStepWrapper
      spaceLabel={spaceLabel}
      industryLabel={industry?.label}
      suggestionStep="flooring"
      category="flooring"
      categoryKey="flooring"
      rememberedQuery={state.flooringQuery}
      selectedPins={state.flooringPins ?? []}
      maxSelections={MAX_PINS}
      onChange={({ pins, query }) =>
        setState({ flooringPins: pins, flooringQuery: query })
      }
      helperText="Wood, stone, tile, concrete, carpet: the plane that grounds the room."
    />
  );
}
