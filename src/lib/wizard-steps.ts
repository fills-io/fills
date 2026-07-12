/**
 * Single source of truth for the wizard's step ordering.
 *
 * Steps are deliberately listed in the order the user moves through them.
 * Anywhere in the app — the progress bar, the URL slugs, the step renderer —
 * we resolve from this array so adding/reordering a step is a one-line change.
 *
 * Ported from the Replit prototype's `client/src/pages/new-concept.tsx`,
 * with the same nine steps. Names match the wizardSelections schema keys
 * in src/db/schema.ts where applicable (vibeStyle ↔ vibe, etc.).
 */

export type WizardStepId =
  | "space"
  | "vibe"
  | "colors"
  | "furniture"
  | "lighting"
  | "flooring"
  | "ceiling"
  | "materials"
  | "review";

export type WizardStep = {
  /** URL/data slug — kept short. */
  id: WizardStepId;
  /** Display label in the progress bar. */
  label: string;
  /** One-line description shown under the step heading. */
  description: string;
};

export const WIZARD_STEPS: readonly WizardStep[] = [
  {
    id: "space",
    label: "Space",
    description:
      "Tell us about the space itself: what kind of room, how it's used, who it's for.",
  },
  {
    id: "vibe",
    label: "Vibe",
    description:
      "Pick 3 to 6 images that capture the feeling you want the space to have.",
  },
  {
    id: "colors",
    label: "Colors",
    description:
      "Choose your colours: pull from an image, build from scratch, or refine an AI suggestion.",
  },
  {
    id: "furniture",
    label: "Furniture",
    description:
      "Sofas, chairs, tables, beds, whatever the space needs, picked one category at a time.",
  },
  {
    id: "lighting",
    label: "Lighting",
    description:
      "Mood, task, accent. Pendants, sconces, recessed. Set the atmosphere.",
  },
  {
    id: "flooring",
    label: "Flooring",
    description:
      "Wood, stone, tile, carpet, concrete. The plane that grounds the whole room.",
  },
  {
    id: "ceiling",
    label: "Ceiling",
    description:
      "The fifth wall: coffers, beams, plaster, exposed structure, painted color.",
  },
  {
    id: "materials",
    label: "Materials",
    description:
      "Surfaces, textures, finishes, the close-up details that make a space feel real.",
  },
  {
    id: "review",
    label: "Review",
    description:
      "A last look at every choice before we generate your full design plan (a brief).",
  },
] as const;

/** Map step ID → its position (1-indexed) for progress display. */
export function stepNumber(id: WizardStepId): number {
  return WIZARD_STEPS.findIndex((s) => s.id === id) + 1;
}

/** Get the next step after `id`, or `null` if it's the last one. */
export function nextStep(id: WizardStepId): WizardStepId | null {
  const i = WIZARD_STEPS.findIndex((s) => s.id === id);
  return i >= 0 && i < WIZARD_STEPS.length - 1
    ? WIZARD_STEPS[i + 1].id
    : null;
}

/** Get the previous step before `id`, or `null` if it's the first one. */
export function prevStep(id: WizardStepId): WizardStepId | null {
  const i = WIZARD_STEPS.findIndex((s) => s.id === id);
  return i > 0 ? WIZARD_STEPS[i - 1].id : null;
}
