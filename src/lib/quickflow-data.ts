/**
 * QuickFlow data — ported from the Fractional_QuickFlow_v2-14 prototype.
 *
 * Design-first build: the prototype renders "scenes" as CSS gradients. Here
 * we model each visual as a labeled placeholder (label + optional pattern
 * hint) and render it via <PlaceholderScene>. Real Pinterest/AI imagery
 * gets wired in later.
 *
 * Industries / specs / vibes already live in concept-taxonomy.ts and the
 * palette cards in concept-palettes.ts — this file adds the flow-specific
 * sets (vibe picks, theater steps, tips, palette-by-vibe seeds).
 */

export type PickPattern = "arch" | "col" | "window" | "plain";
export type PickRatio = "tall" | "normal" | "short";

export type VibePick = {
  id: string;
  label: string;
  pattern: PickPattern;
  ratio: PickRatio;
};

/** The Stage-2 vibe image grid (placeholder scenes). */
export const PICKS: VibePick[] = [
  { id: "moody-glam", label: "Moody glam", pattern: "arch", ratio: "tall" },
  { id: "warm-minimalism", label: "Warm minimalism", pattern: "window", ratio: "normal" },
  { id: "1920s-glam", label: "1920s glam", pattern: "col", ratio: "short" },
  { id: "old-shanghai", label: "Old Shanghai", pattern: "arch", ratio: "normal" },
  { id: "sunlit-communal", label: "Sunlit communal", pattern: "window", ratio: "tall" },
  { id: "wong-kar-wai", label: "Wong Kar-wai", pattern: "plain", ratio: "normal" },
  { id: "japandi-calm", label: "Japandi calm", pattern: "window", ratio: "short" },
  { id: "deep-velvet", label: "Deep velvet", pattern: "col", ratio: "tall" },
  { id: "members-club", label: "Members-club", pattern: "arch", ratio: "normal" },
  { id: "belgian-wabi", label: "Belgian wabi", pattern: "plain", ratio: "normal" },
  { id: "industrial-warmth", label: "Industrial warmth", pattern: "col", ratio: "short" },
  { id: "rose-plaster", label: "Rose plaster", pattern: "window", ratio: "tall" },
  { id: "library-calm", label: "Library calm", pattern: "arch", ratio: "normal" },
  { id: "mediterranean", label: "Mediterranean", pattern: "window", ratio: "short" },
  { id: "monastic", label: "Monastic", pattern: "plain", ratio: "tall" },
  { id: "moody-intimate", label: "Moody intimate", pattern: "col", ratio: "normal" },
];

/** Sequential steps shown on the "Drafting your concept" generation screen. */
export const THEATER_STEPS: { label: string; durationMs: number }[] = [
  { label: "Composing palette", durationMs: 1100 },
  { label: "Curating materials", durationMs: 1700 },
  { label: "Sourcing furniture direction", durationMs: 1900 },
  { label: "Setting lighting strategy", durationMs: 1500 },
  { label: "Writing spatial notes", durationMs: 1300 },
  { label: "Assembling brief", durationMs: 1500 },
];

/** Rotating tip cards on the generation screen. */
export const THEATER_TIPS: { eyebrow: string; text: string }[] = [
  {
    eyebrow: "Did you know",
    text: "A brief built like architecture starts from light and material, not furniture.",
  },
  {
    eyebrow: "Available from here",
    text: "You can talk to a working architect to take any concept into real drawings.",
  },
  {
    eyebrow: "Tip",
    text: "Pick references that share a feeling, not a room type — the AI reads mood first.",
  },
  {
    eyebrow: "Designed by an architect",
    text: "Every brief mirrors how senior studios actually scope a project.",
  },
];

/** The 6 design-element rows on the concept page. */
export const CONCEPT_ELEMENTS: { id: string; label: string; num: string }[] = [
  { id: "materials", label: "Materials & textures", num: "EL.01" },
  { id: "flooring", label: "Flooring", num: "EL.02" },
  { id: "ceiling", label: "Ceiling", num: "EL.03" },
  { id: "furniture", label: "Furniture", num: "EL.04" },
  { id: "lighting", label: "Lighting", num: "EL.05" },
  { id: "accents", label: "Accents & art", num: "EL.06" },
];

/**
 * "Reading this as" refinement chips on the concept page. Generic across
 * industries (design-first placeholders); real per-industry dimensions can
 * replace these when the concept AI is wired in.
 */
export const CONTEXT_DIMENSIONS: { id: string; label: string; options: string[] }[] = [
  { id: "scale", label: "Scale", options: ["Intimate", "Mid-size", "Generous", "Flagship"] },
  { id: "audience", label: "Audience", options: ["Locals", "Destination", "Members", "Mixed"] },
  { id: "budget", label: "Budget tier", options: ["Considered", "Premium", "Luxury", "Ultra-luxe"] },
];

/** Alternative direction names per element (Edit cycles through these). */
export const ELEMENT_ALTERNATIVES: Record<string, string[]> = {
  materials: ["Lime plaster & oak", "Travertine & brass", "Raw concrete & linen", "Burl wood & bouclé"],
  flooring: ["Wide oak board", "Honed limestone", "Microcement", "Herringbone parquet"],
  ceiling: ["Exposed structure", "Lime-washed flat", "Timber slat", "Coffered plaster"],
  furniture: ["Sculptural & low", "Classic & upholstered", "Modular & light", "Antique & collected"],
  lighting: ["Warm pools", "Natural-led", "Dramatic spots", "Even & diffuse"],
  accents: ["Ceramics & stone", "Vintage art", "Botanical", "Sculptural objects"],
};

/** Build templated editorial + spatial narrative from the brief. */
export function buildNarrative(spec: string, vibe: string): {
  editorial: string;
  spatial: string;
} {
  const s = spec || "the space";
  const v = vibe || "a warm, considered direction";
  return {
    editorial: `A ${s} read through ${v}. The room is composed from light and material first — surfaces chosen for how they hold late-afternoon sun, furniture kept low and quiet so the architecture leads. Nothing shouts; everything is intentional.`,
    spatial: `Circulation runs along the longest sightline, drawing you in before the room reveals itself. Zones are defined by a continuous floor finish and a single uninterrupted ceiling, so the ${s} feels larger than its footprint and calm at every hour.`,
  };
}

/**
 * Seed palette id (into concept-palettes.ts) chosen from the vibe text.
 * Mirrors the prototype's keyword matching (dark/moody → noir,
 * japandi/minimal → japandi, else warm).
 */
export function seedPaletteIdForVibe(vibe: string): string {
  const v = vibe.toLowerCase();
  if (/(dark|moody|velvet|noir|glam|shanghai)/.test(v)) return "noir";
  if (/(japandi|minimal|monastic|wabi|library|calm)/.test(v)) return "japandi";
  if (/(rose|plaster|mediterran|sunlit|warm)/.test(v)) return "rose";
  return "warm";
}
