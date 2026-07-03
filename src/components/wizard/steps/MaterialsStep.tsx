"use client";

/**
 * Step 8 — Materials & Textures.
 *
 * Up to 4 close-up material references — the textures and finishes that
 * give the space its tactile character.
 */

import PinterestStepWrapper from "./PinterestStepWrapper";
import { getIndustry } from "@/lib/space-taxonomy";
import type { WizardState } from "@/lib/wizard-state";

type Props = {
  state: WizardState;
  setState: (patch: Partial<WizardState>) => void;
};

const MAX_PINS = 4;

export default function MaterialsStep({ state, setState }: Props) {
  const industry = state.industryId ? getIndustry(state.industryId) : null;
  const spaceLabel =
    industry?.spaces.find((s) => s.id === state.spaceId)?.label.toLowerCase() ??
    "interior";

  return (
    <PinterestStepWrapper
      spaceLabel={spaceLabel}
      industryLabel={industry?.label}
      suggestionStep="materials"
      category="materials texture"
      categoryKey="materials"
      rememberedQuery={state.materialsQuery}
      selectedPins={state.materialsPins ?? []}
      maxSelections={MAX_PINS}
      onChange={({ pins, query }) =>
        setState({ materialsPins: pins, materialsQuery: query })
      }
      helperText="Close-up shots: stone, plaster, wood grain, fabric, metal patina."
    />
  );
}
