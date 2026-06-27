/**
 * Concept taxonomy — ported from the v40 homepage prototype.
 *
 * Richer than the original space-taxonomy: 10 industries, a "specifically"
 * suggestion bank per industry, AND smart per-space vibe matching so the
 * vibe chips fit the exact program the user picked (a "ryokan-style room"
 * gets very different vibes than a "natural wine bar"), not just the
 * industry.
 *
 * Resolution order for vibes:
 *   1. exact spec match (VIBE_BY_SPEC)
 *   2. substring match (handles free-typed specs near a known one)
 *   3. industry-level fallback (VIBE_BY_IND)
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
  { id: "retail", label: "Retail", meta: "shop · boutique · showroom" },
  { id: "workplace", label: "Workplace", meta: "office · co-work · studio" },
  { id: "wellness", label: "Healthcare & Wellness", meta: "clinic · spa · med" },
  { id: "cultural", label: "Cultural", meta: "gallery · library · listening" },
  { id: "residential", label: "Residential", meta: "home · apt · loft" },
  { id: "beauty", label: "Beauty & Salon", meta: "salon · barber · skin" },
  { id: "fitness", label: "Fitness & Studio", meta: "pilates · yoga · gym" },
  { id: "other", label: "Other", meta: "custom space" },
];

export const SPEC_BY_IND: Record<string, string[]> = {
  hospitality: ["boutique hotel suite", "co-working hotel lobby", "design hotel suite", "ryokan-style room", "all-day cafe lobby"],
  fnb: ["specialty coffee bar", "natural wine bar", "neighborhood trattoria", "omakase counter", "cocktail lounge with vinyl listening room", "izakaya"],
  retail: ["fragrance boutique", "minimalist menswear", "concept store", "showroom", "denim boutique"],
  workplace: ["founder's office", "members club for creatives", "podcast studio cluster", "boutique law office", "creative agency floor"],
  wellness: ["family dental practice", "longevity clinic", "med-spa", "sauna lounge", "sensory-friendly pediatric"],
  cultural: ["white-cube gallery", "audiophile listening room", "neighborhood library", "domestic-feel gallery", "bookshop cafe"],
  residential: ["pied-à-terre", "writer's flat", "studio for two", "loft conversion", "family villa"],
  beauty: ["minimalist hair salon", "nail studio", "barbershop", "brow & lash studio", "skin clinic"],
  fitness: ["pilates studio", "yoga studio", "boxing club", "cycling studio", "movement lab"],
  other: ["custom retreat", "private workshop", "atelier", "experimental space"],
};

export const VIBE_BY_IND: Record<string, string[]> = {
  hospitality: ["1920s glam", "Japandi calm", "warm minimalism", "old Shanghai", "Mediterranean", "moody intimate"],
  fnb: ["natural wine cellar", "izakaya warmth", "deep velvet", "sunlit communal", "Wong Kar-wai", "kissaten quiet"],
  retail: ["museum minimal", "warm brutalism", "kunsthalle", "Italian futurist", "atelier-feel"],
  workplace: ["library calm", "modernist atelier", "industrial warmth", "members-club lounge", "writer's room"],
  wellness: ["calm clinical", "soft sage modernist", "Scandinavian warm", "biophilic light", "spa-like minimal"],
  cultural: ["wabi-sabi", "neoclassical library", "deep dim listening", "Marcel Breuer", "monastic"],
  residential: ["Belgian wabi", "California modern", "Tokyo minimalism", "warm maximalist", "plaster & rose"],
  beauty: ["warm Japandi", "soft brutalist", "rose plaster", "Italian salon", "minimalist clinical"],
  fitness: ["Pilates gallery", "warm concrete", "gym-as-temple", "monochrome studio", "soft & breathing"],
  other: ["warm minimalism", "Japandi", "editorial noir", "Mediterranean"],
};

export const VIBE_BY_SPEC: Record<string, string[]> = {
  "boutique hotel suite": ["1920s glam", "old Shanghai", "warm minimalism", "moody intimate", "Wong Kar-wai"],
  "co-working hotel lobby": ["library calm", "modernist atelier", "warm minimalism", "industrial warmth", "members-club lounge"],
  "design hotel suite": ["Japandi calm", "warm minimalism", "Belgian wabi", "Tokyo minimalism", "monastic"],
  "ryokan-style room": ["Japandi calm", "wabi-sabi", "Tokyo minimalism", "monastic", "deep dim listening"],
  "all-day cafe lobby": ["sunlit communal", "warm minimalism", "Mediterranean", "kissaten quiet", "natural wine cellar"],
  "specialty coffee bar": ["kissaten quiet", "warm minimalism", "Japandi calm", "sunlit communal", "Tokyo minimalism"],
  "natural wine bar": ["natural wine cellar", "deep velvet", "moody intimate", "Wong Kar-wai", "Belgian wabi"],
  "neighborhood trattoria": ["Mediterranean", "warm maximalist", "sunlit communal", "rose plaster", "Italian salon"],
  "omakase counter": ["Japandi calm", "kissaten quiet", "monastic", "Tokyo minimalism", "deep dim listening"],
  "cocktail lounge with vinyl listening room": ["Wong Kar-wai", "1920s glam", "deep dim listening", "moody intimate", "warm brutalism"],
  izakaya: ["izakaya warmth", "Wong Kar-wai", "moody intimate", "kissaten quiet", "warm minimalism"],
  "fragrance boutique": ["museum minimal", "rose plaster", "atelier-feel", "warm minimalism", "kunsthalle"],
  "minimalist menswear": ["museum minimal", "Tokyo minimalism", "warm brutalism", "modernist atelier", "kunsthalle"],
  "concept store": ["kunsthalle", "Italian futurist", "museum minimal", "warm brutalism", "atelier-feel"],
  showroom: ["museum minimal", "Italian futurist", "kunsthalle", "warm brutalism", "atelier-feel"],
  "denim boutique": ["industrial warmth", "warm brutalism", "atelier-feel", "members-club lounge", "writer's room"],
  "founder's office": ["library calm", "members-club lounge", "writer's room", "Belgian wabi", "deep dim listening"],
  "members club for creatives": ["members-club lounge", "library calm", "deep velvet", "writer's room", "moody intimate"],
  "podcast studio cluster": ["library calm", "modernist atelier", "deep dim listening", "warm brutalism", "industrial warmth"],
  "boutique law office": ["library calm", "Belgian wabi", "writer's room", "members-club lounge", "deep dim listening"],
  "creative agency floor": ["modernist atelier", "industrial warmth", "library calm", "writer's room", "warm brutalism"],
  "family dental practice": ["calm clinical", "soft sage modernist", "Scandinavian warm", "spa-like minimal", "biophilic light"],
  "longevity clinic": ["calm clinical", "spa-like minimal", "Japandi calm", "soft sage modernist", "biophilic light"],
  "med-spa": ["spa-like minimal", "rose plaster", "Japandi calm", "soft sage modernist", "calm clinical"],
  "sauna lounge": ["monastic", "wabi-sabi", "Japandi calm", "warm minimalism", "biophilic light"],
  "sensory-friendly pediatric": ["soft sage modernist", "biophilic light", "Scandinavian warm", "calm clinical", "warm minimalism"],
  "white-cube gallery": ["museum minimal", "kunsthalle", "monastic", "Marcel Breuer", "warm brutalism"],
  "audiophile listening room": ["deep dim listening", "Wong Kar-wai", "moody intimate", "1920s glam", "warm brutalism"],
  "neighborhood library": ["library calm", "neoclassical library", "writer's room", "monastic", "Belgian wabi"],
  "domestic-feel gallery": ["wabi-sabi", "Belgian wabi", "warm minimalism", "atelier-feel", "monastic"],
  "bookshop cafe": ["library calm", "writer's room", "kissaten quiet", "warm minimalism", "neoclassical library"],
  "pied-à-terre": ["Belgian wabi", "warm minimalism", "Tokyo minimalism", "Mediterranean", "1920s glam"],
  "writer's flat": ["writer's room", "library calm", "Belgian wabi", "warm maximalist", "moody intimate"],
  "studio for two": ["Japandi calm", "Tokyo minimalism", "warm minimalism", "Belgian wabi", "California modern"],
  "loft conversion": ["industrial warmth", "warm brutalism", "modernist atelier", "California modern", "members-club lounge"],
  "family villa": ["Mediterranean", "California modern", "warm maximalist", "plaster & rose", "warm minimalism"],
  "minimalist hair salon": ["minimalist clinical", "warm Japandi", "rose plaster", "soft brutalist", "Italian salon"],
  "nail studio": ["rose plaster", "warm Japandi", "minimalist clinical", "Italian salon", "spa-like minimal"],
  barbershop: ["warm brutalism", "industrial warmth", "library calm", "members-club lounge", "writer's room"],
  "brow & lash studio": ["minimalist clinical", "soft brutalist", "rose plaster", "warm Japandi", "spa-like minimal"],
  "skin clinic": ["calm clinical", "soft sage modernist", "Japandi calm", "minimalist clinical", "spa-like minimal"],
  "pilates studio": ["Pilates gallery", "warm concrete", "soft & breathing", "monochrome studio", "biophilic light"],
  "yoga studio": ["soft & breathing", "wabi-sabi", "biophilic light", "warm concrete", "monastic"],
  "boxing club": ["warm concrete", "industrial warmth", "warm brutalism", "gym-as-temple", "monochrome studio"],
  "cycling studio": ["monochrome studio", "warm concrete", "industrial warmth", "gym-as-temple", "soft & breathing"],
  "movement lab": ["soft & breathing", "Pilates gallery", "warm concrete", "monochrome studio", "biophilic light"],
};

export function getIndustry(id: string | null): ConceptIndustry | undefined {
  return INDUSTRIES.find((i) => i.id === id);
}

/** Specifically-suggestions for the chosen industry (max 5). */
export function getSpecSuggestions(industryId: string | null): string[] {
  if (!industryId) return [];
  return (SPEC_BY_IND[industryId] ?? []).slice(0, 5);
}

/** Vibe suggestions resolved from current spec → substring → industry. */
export function getVibeSuggestions(
  industryId: string | null,
  spec: string,
): string[] {
  const s = spec.trim().toLowerCase();
  if (!s) return industryId ? (VIBE_BY_IND[industryId] ?? []).slice(0, 5) : [];
  if (VIBE_BY_SPEC[s]) return VIBE_BY_SPEC[s].slice(0, 5);
  for (const key of Object.keys(VIBE_BY_SPEC)) {
    if (s.includes(key) || key.includes(s)) return VIBE_BY_SPEC[key].slice(0, 5);
  }
  return industryId ? (VIBE_BY_IND[industryId] ?? []).slice(0, 5) : [];
}

/** Vibe panel only opens once spec has real substance (3+ chars). */
export function shouldShowVibe(industryId: string | null, spec: string): boolean {
  return !!industryId && spec.trim().length >= 3;
}
