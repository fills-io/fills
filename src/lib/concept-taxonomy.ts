/**
 * Concept taxonomy for the homepage madlib.
 *
 * Deliberately uses the MOST COMMON, recognizable words people actually use:
 *   - "Specifically" = the everyday name for the space (clothing store, cafe,
 *     hair salon, living room, …), not insider program jargon.
 *   - "Vibe" = mainstream interior-design styles (modern, minimalist,
 *     industrial, scandinavian, bohemian, …), not editorial art-speak.
 *
 * Both lists are per-industry so the examples fit the project type. They seed
 * the wizard (?spec, ?vibe) as free text, so anything here is just a starting
 * suggestion the user can edit.
 */

export type ConceptIndustry = {
  id: string;
  label: string;
  /** Short "a · b · c" descriptor shown under the label. */
  meta: string;
};

export const INDUSTRIES: ConceptIndustry[] = [
  { id: "hospitality", label: "Hospitality", meta: "hotel · suite · lobby" },
  { id: "fnb", label: "Food & Beverage", meta: "cafe · resto · bar" },
  { id: "retail", label: "Retail", meta: "shop · boutique · store" },
  { id: "workplace", label: "Workplace", meta: "office · co-work · studio" },
  { id: "wellness", label: "Healthcare & Wellness", meta: "clinic · spa · med" },
  { id: "cultural", label: "Cultural", meta: "gallery · museum · library" },
  { id: "residential", label: "Residential", meta: "home · apartment · loft" },
  { id: "beauty", label: "Beauty & Salon", meta: "salon · barber · spa" },
  { id: "fitness", label: "Fitness & Studio", meta: "gym · yoga · pilates" },
  { id: "other", label: "Other", meta: "custom space" },
];

// The common, everyday name for the space within each industry.
export const SPEC_BY_IND: Record<string, string[]> = {
  hospitality: ["hotel lobby", "hotel suite", "boutique hotel", "hotel room", "resort", "hotel bar", "hotel restaurant", "spa", "rooftop lounge", "reception", "guest room", "penthouse suite"],
  fnb: ["restaurant", "cafe", "coffee shop", "bar", "bistro", "bakery", "fine dining", "wine bar", "pizzeria", "fast food", "food court", "rooftop restaurant"],
  retail: ["clothing store", "boutique", "shoe store", "jewelry store", "cosmetics store", "electronics store", "bookstore", "flagship store", "pop-up shop", "showroom", "eyewear store", "department store"],
  workplace: ["office", "open office", "private office", "coworking space", "meeting room", "conference room", "reception", "home office", "executive office", "break room", "startup office", "studio"],
  wellness: ["clinic", "dental clinic", "medical office", "spa", "pharmacy", "waiting room", "therapy room", "wellness center", "physiotherapy clinic", "treatment room", "reception", "hospital room"],
  cultural: ["art gallery", "museum", "library", "exhibition", "event space", "auditorium", "bookshop", "studio", "theater", "reading room", "lobby", "gallery"],
  residential: ["living room", "bedroom", "kitchen", "bathroom", "dining room", "home office", "kids room", "master bedroom", "apartment", "studio apartment", "walk-in closet", "outdoor patio"],
  beauty: ["hair salon", "nail salon", "barbershop", "spa", "beauty salon", "makeup studio", "skincare clinic", "lash studio", "tattoo studio", "waxing salon", "treatment room", "reception"],
  fitness: ["gym", "yoga studio", "pilates studio", "fitness studio", "crossfit gym", "dance studio", "spin studio", "boxing gym", "home gym", "locker room", "reception", "stretching area"],
  other: ["event venue", "workshop", "studio", "showroom", "pop-up", "maker space", "coworking", "retreat"],
};

// Mainstream interior-design styles — the words people search for.
export const VIBE_BY_IND: Record<string, string[]> = {
  hospitality: ["modern", "minimalist", "luxury", "art deco", "coastal", "mediterranean", "bohemian", "contemporary", "tropical", "mid-century modern"],
  fnb: ["industrial", "rustic", "modern", "minimalist", "vintage", "bohemian", "mediterranean", "contemporary", "farmhouse", "art deco"],
  retail: ["modern", "minimalist", "industrial", "luxury", "contemporary", "scandinavian", "vintage", "bohemian", "art deco", "eclectic"],
  workplace: ["modern", "minimalist", "industrial", "scandinavian", "contemporary", "mid-century modern", "rustic", "traditional", "luxury", "eclectic"],
  wellness: ["minimalist", "scandinavian", "modern", "zen", "coastal", "contemporary", "japandi", "luxury", "traditional", "mediterranean"],
  cultural: ["minimalist", "modern", "contemporary", "industrial", "traditional", "scandinavian", "rustic", "art deco", "eclectic", "vintage"],
  residential: ["modern", "minimalist", "scandinavian", "mid-century modern", "bohemian", "farmhouse", "industrial", "coastal", "traditional", "contemporary", "rustic", "japandi"],
  beauty: ["modern", "minimalist", "luxury", "scandinavian", "bohemian", "vintage", "contemporary", "art deco", "industrial", "eclectic"],
  fitness: ["industrial", "modern", "minimalist", "contemporary", "scandinavian", "rustic", "luxury", "zen", "vintage", "eclectic"],
  other: ["modern", "minimalist", "scandinavian", "industrial", "bohemian", "contemporary", "rustic", "luxury"],
};

export function getIndustry(id: string | null): ConceptIndustry | undefined {
  return INDUSTRIES.find((i) => i.id === id);
}

/** Specifically-suggestions for the chosen industry (all of them). */
export function getSpecSuggestions(industryId: string | null): string[] {
  if (!industryId) return [];
  return SPEC_BY_IND[industryId] ?? [];
}

/** Common style suggestions for the chosen industry (all of them). */
export function getVibeSuggestions(
  industryId: string | null,
  spec: string,
): string[] {
  void spec; // kept for call-site compatibility; vibes are industry-common now
  return industryId ? (VIBE_BY_IND[industryId] ?? []) : [];
}

/** Vibe panel only opens once spec has real substance (3+ chars). */
export function shouldShowVibe(industryId: string | null, spec: string): boolean {
  return !!industryId && spec.trim().length >= 3;
}
