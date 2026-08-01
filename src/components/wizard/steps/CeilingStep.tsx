"use client";

/**
 * Step 7 — Ceiling.
 *
 * The "fifth wall." Up to 2 references — usually one principal treatment
 * (coffered, exposed beam, plain plaster) and optionally a contrast detail.
 */

import PinterestStepWrapper from "./PinterestStepWrapper";
import { getIndustry } from "@/lib/space-taxonomy";
import type { WizardState } from "@/lib/wizard-state";

type Props = {
  state: WizardState;
  setState: (patch: Partial<WizardState>) => void;
};

const MAX_PINS = 2;

export default function CeilingStep({ state, setState }: Props) {
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
      suggestionStep="ceiling"
      category="ceiling treatment"
      categoryKey="ceiling"
      rememberedQuery={state.ceilingQuery}
      selectedPins={state.ceilingPins ?? []}
      maxSelections={MAX_PINS}
      onChange={({ pins, query }) =>
        setState({ ceilingPins: pins, ceilingQuery: query })
      }
      helperText="Coffers, beams, plaster, exposed structure, painted color: the often-forgotten surface."
    />
  );
}
