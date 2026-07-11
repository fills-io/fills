/**
 * The shape of the in-progress brief while the user is moving through the
 * wizard. This is the client-side mirror of what eventually gets persisted
 * to the `concepts` table — but kept here as a separate type so the wizard
 * doesn't have to think about DB serialization yet.
 *
 * Every field is optional because the wizard fills them in step by step.
 */

import type { IndustryId } from "./space-taxonomy";
import type { ColorEntry, FurnitureSubSection, PinterestPin } from "@/db/schema";

export type WizardState = {
  /** Which flow the user is in. "quick" auto-fills everything after Vibe (the
   *  AI writes furniture/lighting/etc. into the brief); "full" walks every
   *  category with its own image picker. Absent ≡ "full". */
  mode?: "quick" | "full";

  // ── Step 1: Space ────────────────────────────────────────────────────────
  industryId?: IndustryId;
  /** Primary space (kept in sync with spaceIds[0] for back-compat). */
  spaceId?: string;
  /** Up to 3 specific spaces the project covers (e.g. Bedroom + Living room). */
  spaceIds?: string[];
  /** Free-text project type when the industry is "Other". */
  customIndustry?: string;
  /** Free-text "describe the space" notes. */
  spaceDescription?: string;
  /** Rough size bucket. */
  spaceSize?: "small" | "medium" | "large" | "xl";

  // ── Step 2: Vibe ─────────────────────────────────────────────────────────
  /** Last search query the user typed on the Vibe step. */
  vibeQuery?: string;
  /** Pinterest pins picked as the vibe reference (max 3). */
  vibePins?: PinterestPin[];

  // ── Step 3: Colors ───────────────────────────────────────────────────────
  /** Four-slot palette: Primary / Secondary / Accent / Supporting. */
  palette?: ColorEntry[];

  // ── Step 4: Furniture ────────────────────────────────────────────────────
  /** Three AI-generated sub-sections (e.g. Bed / Nightstands / Wardrobe),
   *  each with its own search query + pin selection. */
  furnitureSubSections?: FurnitureSubSection[];
  /** @deprecated single-grid furniture — kept for older saved drafts only. */
  furnitureQuery?: string;
  /** @deprecated single-grid furniture — kept for older saved drafts only. */
  furniturePins?: PinterestPin[];

  // ── Step 5: Lighting ─────────────────────────────────────────────────────
  lightingQuery?: string;
  lightingPins?: PinterestPin[];

  // ── Step 6: Flooring ─────────────────────────────────────────────────────
  flooringQuery?: string;
  flooringPins?: PinterestPin[];

  // ── Step 7: Ceiling ──────────────────────────────────────────────────────
  ceilingQuery?: string;
  ceilingPins?: PinterestPin[];

  // ── Step 8: Materials ────────────────────────────────────────────────────
  materialsQuery?: string;
  materialsPins?: PinterestPin[];

  // ── Reserved for future steps ──────────────────────────────────────────
  // We'll add fields as each step ships. Keeping the type open ensures
  // refactors don't cascade through every step component.

  // ── Step 9: Review ───────────────────────────────────────────────────────
  // (read-only summary, no fields of its own)
};

/** Convenient empty state for a fresh wizard. */
export const EMPTY_WIZARD_STATE: WizardState = {};
