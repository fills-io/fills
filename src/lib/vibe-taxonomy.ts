/**
 * Vibe taxonomy — curated style/atmosphere suggestions per industry.
 *
 * Surfaced as dropdown suggestions on the homepage Quick form's
 * "feels like…" input so users without strong design vocabulary
 * have a starting point. Users can still type anything.
 *
 * Curated to favor named-style vocabulary that AI prompts respond
 * well to (e.g. "japandi" rather than "calm and zen").
 */

import type { IndustryId } from "./space-taxonomy";

export const VIBES_BY_INDUSTRY: Partial<Record<IndustryId, string[]>> = {
  residential: [
    "warm minimalism",
    "japandi",
    "mid-century modern",
    "scandi soft",
    "organic modernism",
    "mediterranean coastal",
    "english country",
    "brutalist edge",
    "art deco revival",
    "wabi-sabi",
  ],
  hospitality: [
    "editorial luxury",
    "tropical modernism",
    "brutalist heritage",
    "scandi calm",
    "art deco glamour",
    "biophilic resort",
    "boutique maximalism",
    "coastal hideaway",
    "alpine lodge",
  ],
  retail: [
    "gallery white",
    "brutalist concept",
    "warm boutique",
    "monochrome edit",
    "raw material",
    "archive vintage",
    "soft luxury",
    "industrial workshop",
  ],
  workplace: [
    "industrial calm",
    "scandinavian focus",
    "biophilic open",
    "residential office",
    "brutalist minimal",
    "library hush",
    "creative studio",
    "members' club",
  ],
  "fitness-wellness": [
    "japandi sanctuary",
    "scandi spa",
    "biophilic calm",
    "white stone",
    "tropical retreat",
    "minimal clinic",
    "wabi-sabi spa",
    "alpine bathhouse",
  ],
  "food-beverage": [
    "editorial diner",
    "brutalist warmth",
    "mid-century cocktail",
    "japandi izakaya",
    "mediterranean trattoria",
    "gothic moody",
    "tropical taproom",
    "art deco brasserie",
    "rustic farmhouse",
  ],
};

const FALLBACK_VIBES = [
  "warm minimalism",
  "japandi",
  "mid-century modern",
  "organic modernism",
];

/** Get vibes for a given industry, falling back to residential if unknown. */
export function getVibesForIndustry(industryId: IndustryId | null): string[] {
  const base = industryId ? VIBES_BY_INDUSTRY[industryId] : undefined;
  return base ?? VIBES_BY_INDUSTRY.residential ?? FALLBACK_VIBES;
}
