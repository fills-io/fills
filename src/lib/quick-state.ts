/**
 * State for the Quick "canvas" flow — the single-scroll experience
 * (Setup madlib → Vibe → Palette → Live brief → generate).
 *
 * Kept separate from the 9-step wizard's WizardState: the canvas is its own
 * lighter model, but it feeds the SAME /api/ai/generate-brief endpoint.
 */

import type { ColorEntry } from "@/db/schema";
import type { CuratedPin } from "@/data/reference-images";

export type QuickState = {
  /** concept-taxonomy id (hospitality, fnb, retail, …) or null. */
  industryId: string | null;
  /** The specific space, free text (e.g. "dental clinic"). */
  spec: string;
  /** The vibe label / last search term, shown in the sentence + live brief. */
  vibeQuery: string;
  /** 3–5 reference images the user picked. */
  picks: CuratedPin[];
  /** Up to 5 palette colours, aligned with weights + locks. */
  palette: ColorEntry[];
  /** How dominant each palette colour is (0..1), aligned with palette. */
  paletteWeights: number[];
  /** Whether each palette colour is locked (kept on regenerate). */
  locks: boolean[];
};

export const EMPTY_QUICK: QuickState = {
  industryId: null,
  spec: "",
  vibeQuery: "",
  picks: [],
  palette: [],
  paletteWeights: [],
  locks: [],
};

/** How many colours the canvas palette carries (Dominant → Support). */
export const QUICK_PALETTE_SIZE = 5;

/** Role label for a palette slot, by dominance rank. */
export function paletteRole(index: number): string {
  return (
    ["Dominant", "Secondary", "Accent", "Support", "Support"][index] ??
    "Support"
  );
}
