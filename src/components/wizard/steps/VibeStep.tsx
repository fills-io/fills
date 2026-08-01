"use client";

/**
 * Step 2 — Vibe & Style.
 *
 * The user picks up to 3 Pinterest pins that capture the feeling they want
 * the space to have. Selections drive the AI's later "Design DNA" analysis,
 * so quality > quantity — three sharp picks beat ten muddy ones.
 *
 * Seeded from the homepage's "feels like ___" input if Quick mode brought
 * one through (`?vibe=warm minimalism`).
 */

import { useSearchParams } from "next/navigation";
import PinterestGrid from "@/components/wizard/PinterestGrid";
import { getIndustry } from "@/lib/space-taxonomy";
import { CURATED_PINS, CURATED_VIBE } from "@/data/reference-images";
import type { WizardState } from "@/lib/wizard-state";

type Props = {
  state: WizardState;
  setState: (patch: Partial<WizardState>) => void;
};

/** Vibe selection range: pick 3 (min, so the AI has a real signal) to 6 (max). */
const MIN_VIBE_PINS = 3;
const MAX_VIBE_PINS = 6;

export default function VibeStep({ state, setState }: Props) {
  const params = useSearchParams();

  // Seed the search query from (in order of priority):
  //   1. Whatever the user previously typed on this step (state.vibeQuery)
  //   2. The homepage Quick form's vibe input (?vibe=...)
  //   3. A sensible default
  // A real style signal from the user (their own earlier choice, or the
  // homepage madlib). Deliberately NOT defaulted — writing a placeholder here
  // used to tell the AI every project was "warm minimalism".
  const userStyle = (state.vibeQuery ?? params.get("vibe") ?? "").trim();
  const seededQuery = userStyle || "warm minimalism interior";

  const selected = state.vibePins ?? [];

  // Resolve industry / space labels for the AI suggestion context.
  const industry = state.industryId ? getIndustry(state.industryId) : null;
  const spaceLabel = industry?.spaces.find((s) => s.id === state.spaceId)?.label;

  // Vibe references reflect the project category: a per-industry curated set
  // (restaurant vibes for F&B, office vibes for workplace, …), falling back to
  // the generic set for "Other" / unknown.
  const vibeSet =
    (state.industryId && CURATED_VIBE[state.industryId]) || CURATED_PINS.vibe;

  // The style picked on the homepage ("feels like ___") pre-selects its chip.
  const styleFromHome = (state.vibeQuery ?? params.get("vibe") ?? "")
    .trim()
    .toLowerCase();

  return (
    <PinterestGrid
      initialQuery={seededQuery}
      curatedPins={vibeSet}
      initialStyle={styleFromHome}
      maxSelections={MAX_VIBE_PINS}
      minSelections={MIN_VIBE_PINS}
      selectedPins={selected}
      onSelectionChange={(pins) => {
        // Describe the vibe from what they actually PICKED (the dominant style
        // across their references), falling back to their stated style. Never
        // persist the placeholder seed.
        const styles = pins
          .map((p) => (p as { style?: string }).style)
          .filter((s): s is string => !!s);
        const top = styles.length
          ? [...new Set(styles)]
              .map((s) => ({ s, n: styles.filter((x) => x === s).length }))
              .sort((a, b) => b.n - a.n)[0].s
          : "";
        setState({
          vibePins: pins,
          vibeQuery: userStyle || top || undefined,
        });
      }}
      helperText="Pick 3 to 6 that capture the feeling you want. Type a style or use the chips to switch. These set the mood for the whole plan."
      suggestionContext={{
        step: "vibe",
        industry: industry?.label,
        space: spaceLabel,
      }}
    />
  );
}
