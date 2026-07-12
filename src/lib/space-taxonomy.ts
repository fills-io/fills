/**
 * Space taxonomy — the master list of industries and the specific spaces
 * within each one. Used by the wizard's Space step (and later, by the AI
 * prompts to scope what "good design" means for each context).
 *
 * Broad professional coverage: the categories a working interior architect
 * actually briefs across. New categories can be added without touching any
 * other code — the UI reads from this file.
 */

export type IndustryId =
  | "residential"
  | "hospitality"
  | "food-beverage"
  | "retail"
  | "workplace"
  | "healthcare"
  | "education"
  | "cultural"
  | "fitness-wellness"
  | "beauty-salon"
  | "real-estate"
  | "other";

export type Industry = {
  id: IndustryId;
  label: string;
  /** One-line description shown when the industry is selected. */
  blurb: string;
  spaces: SpaceOption[];
  /** When true, the Space step collects a free-text project type instead of a
   *  fixed space grid (used by "Other"). */
  freeform?: boolean;
};

export type SpaceOption = {
  id: string;
  label: string;
  /** Short tagline shown under the label. */
  hint: string;
};

export const INDUSTRIES: Industry[] = [
  {
    id: "residential",
    label: "Residential",
    blurb: "Homes and personal spaces.",
    spaces: [
      { id: "living-room", label: "Living room", hint: "Lounging, hosting, daily life" },
      { id: "bedroom", label: "Bedroom", hint: "Rest, retreat, intimacy" },
      { id: "kitchen", label: "Kitchen", hint: "Cooking, gathering, the social anchor" },
      { id: "bathroom", label: "Bathroom", hint: "Ritual, restoration, privacy" },
      { id: "dining-room", label: "Dining room", hint: "Meals, conversation, ceremony" },
      { id: "home-office", label: "Home office", hint: "Focus, calls, end-of-day reset" },
      { id: "kids-room", label: "Kids' room", hint: "Play, sleep, growing up" },
      { id: "walk-in-closet", label: "Walk-in closet", hint: "Dressing, storage, display" },
      { id: "outdoor", label: "Outdoor", hint: "Terrace, balcony, garden room" },
    ],
  },
  {
    id: "hospitality",
    label: "Hospitality",
    blurb: "Hotels, resorts, and short-stay spaces.",
    spaces: [
      { id: "hotel-lobby", label: "Hotel lobby", hint: "First impression, social hub" },
      { id: "hotel-room", label: "Hotel room", hint: "Standard guest accommodation" },
      { id: "suite", label: "Suite", hint: "Premium / signature room" },
      { id: "boutique-hotel", label: "Boutique hotel", hint: "Small, character-driven, themed" },
      { id: "resort", label: "Resort", hint: "Destination feel, leisure-led" },
      { id: "serviced-apartment", label: "Serviced apartment", hint: "Long-stay, home-like" },
      { id: "ballroom", label: "Ballroom / events", hint: "Weddings, banquets, conferences" },
    ],
  },
  {
    id: "food-beverage",
    label: "Food & Beverage",
    blurb: "Restaurants, cafés, and bars.",
    spaces: [
      { id: "fine-dining", label: "Fine dining", hint: "Tasting menus, chef-led, theatrical" },
      { id: "casual-restaurant", label: "Casual restaurant", hint: "Everyday, neighborhood, all-day" },
      { id: "cafe", label: "Café", hint: "Coffee-led, daytime, light food" },
      { id: "cocktail-bar", label: "Cocktail bar", hint: "Mixology, evening, low light" },
      { id: "wine-bar", label: "Wine bar", hint: "Bottles, plates, conversation" },
      { id: "fast-casual", label: "Fast casual / QSR", hint: "Quick service, high turnover" },
      { id: "bakery", label: "Bakery / patisserie", hint: "Counter-led, display, grab-and-go" },
      { id: "cloud-kitchen", label: "Cloud kitchen", hint: "Delivery-only, back of house" },
    ],
  },
  {
    id: "retail",
    label: "Retail",
    blurb: "Stores, showrooms, and brand spaces.",
    spaces: [
      { id: "showroom", label: "Showroom", hint: "Curated product display" },
      { id: "fashion-store", label: "Fashion store", hint: "Clothing, accessories, beauty" },
      { id: "flagship", label: "Flagship store", hint: "Brand statement, experiential" },
      { id: "concept-store", label: "Concept store", hint: "Multi-brand, lifestyle-led" },
      { id: "mall-unit", label: "Mall unit", hint: "In-line shop, mall guidelines" },
      { id: "pop-up", label: "Pop-up", hint: "Short-term, brand activation" },
      { id: "jewelry-store", label: "Jewelry store", hint: "Security, lighting, display" },
      { id: "supermarket", label: "Supermarket / grocery", hint: "Wayfinding, volume, aisles" },
    ],
  },
  {
    id: "workplace",
    label: "Workplace",
    blurb: "Offices and shared work environments.",
    spaces: [
      { id: "open-office", label: "Open office", hint: "Shared, collaborative floor" },
      { id: "private-office", label: "Private office", hint: "Single occupant or small team" },
      { id: "coworking", label: "Coworking", hint: "Flexible memberships, hot desks" },
      { id: "meeting-room", label: "Meeting room", hint: "Boardroom, huddle, focus" },
      { id: "reception", label: "Reception", hint: "Entrance, lobby, hosting" },
      { id: "executive-suite", label: "Executive suite", hint: "Leadership, private, refined" },
      { id: "breakout", label: "Breakout / pantry", hint: "Coffee, informal, recharge" },
    ],
  },
  {
    id: "healthcare",
    label: "Healthcare",
    blurb: "Clinics and medical environments.",
    spaces: [
      { id: "clinic", label: "Clinic", hint: "General practice, consult rooms" },
      { id: "dental-clinic", label: "Dental clinic", hint: "Chairs, hygiene, calm" },
      { id: "aesthetic-clinic", label: "Aesthetic clinic", hint: "Derma, cosmetic, premium" },
      { id: "medical-center", label: "Medical center", hint: "Multi-specialty, wayfinding" },
      { id: "pharmacy", label: "Pharmacy", hint: "Counter, display, dispensing" },
      { id: "waiting-area", label: "Waiting / reception", hint: "Calm, flow, first impression" },
    ],
  },
  {
    id: "education",
    label: "Education",
    blurb: "Schools and learning environments.",
    spaces: [
      { id: "classroom", label: "Classroom", hint: "Focus, flexibility, groups" },
      { id: "nursery", label: "Nursery / early years", hint: "Play, safety, soft scale" },
      { id: "library", label: "Library / resource", hint: "Quiet, reading, study" },
      { id: "lecture-hall", label: "Lecture hall", hint: "Tiered, acoustics, sightlines" },
      { id: "training-center", label: "Training center", hint: "Corporate, workshops, agile" },
      { id: "campus-common", label: "Campus common", hint: "Social, break, in-between" },
    ],
  },
  {
    id: "cultural",
    label: "Cultural",
    blurb: "Galleries, museums, and event spaces.",
    spaces: [
      { id: "gallery", label: "Gallery", hint: "Art-led, neutral, lighting" },
      { id: "museum", label: "Museum", hint: "Narrative, artefacts, flow" },
      { id: "exhibition", label: "Exhibition", hint: "Temporary, immersive, staged" },
      { id: "event-space", label: "Event space", hint: "Flexible, reconfigurable" },
      { id: "auditorium", label: "Auditorium", hint: "Stage, seating, acoustics" },
      { id: "visitor-center", label: "Visitor center", hint: "Welcome, orientation, retail" },
    ],
  },
  {
    id: "fitness-wellness",
    label: "Fitness & Wellness",
    blurb: "Spaces for the body and the mind.",
    spaces: [
      { id: "gym", label: "Gym", hint: "Strength, training, performance" },
      { id: "yoga-studio", label: "Yoga / pilates studio", hint: "Movement, breath, focus" },
      { id: "spa", label: "Spa", hint: "Treatments, rituals, calm" },
      { id: "wellness-center", label: "Wellness center", hint: "Longevity, recovery, IV / IM" },
      { id: "physiotherapy", label: "Physiotherapy", hint: "Rehab, movement, clinical-calm" },
      { id: "pool-thermal", label: "Pool / thermal", hint: "Water, heat, sensory" },
    ],
  },
  {
    id: "beauty-salon",
    label: "Beauty & Salon",
    blurb: "Hair, nails, and grooming spaces.",
    spaces: [
      { id: "hair-salon", label: "Hair salon", hint: "Stations, wash, mirrors" },
      { id: "nail-bar", label: "Nail bar", hint: "Seating, ventilation, display" },
      { id: "barbershop", label: "Barbershop", hint: "Chairs, character, grooming" },
      { id: "med-spa", label: "Med-spa", hint: "Clinical-luxe, treatment rooms" },
      { id: "makeup-studio", label: "Makeup / brow studio", hint: "Lighting, mirrors, close work" },
    ],
  },
  {
    id: "real-estate",
    label: "Real Estate & Developer",
    blurb: "Sales, show, and amenity spaces.",
    spaces: [
      { id: "sales-gallery", label: "Sales gallery", hint: "Models, journey, close the sale" },
      { id: "show-apartment", label: "Show apartment", hint: "Aspirational, move-in ready" },
      { id: "building-lobby", label: "Building lobby", hint: "Arrival, address, identity" },
      { id: "amenity-lounge", label: "Amenity lounge", hint: "Residents' club, social" },
      { id: "gym-amenity", label: "Amenity gym", hint: "Building fitness, shared" },
      { id: "rooftop", label: "Rooftop / pool deck", hint: "Leisure, views, outdoor" },
    ],
  },
  {
    id: "other",
    label: "Other",
    blurb: "Something else — tell us what.",
    freeform: true,
    spaces: [],
  },
];

/** Homepage (concept-taxonomy) labels that don't match a space-taxonomy label. */
const CONCEPT_LABEL_ALIASES: Record<string, IndustryId> = {
  "healthcare & wellness": "healthcare",
  "fitness & studio": "fitness-wellness",
};

/** Match a free-text industry label (from URL params) to an IndustryId, or null. */
export function findIndustryByLabel(label: string | null): Industry | null {
  if (!label) return null;
  const needle = label.trim().toLowerCase();
  const aliased = CONCEPT_LABEL_ALIASES[needle];
  if (aliased) return getIndustry(aliased) ?? null;
  return (
    INDUSTRIES.find(
      (i) =>
        i.label.toLowerCase() === needle ||
        i.id === needle ||
        i.id.replace(/-/g, " ") === needle,
    ) ?? null
  );
}

/** Get an industry by its ID. */
export function getIndustry(id: IndustryId): Industry | undefined {
  return INDUSTRIES.find((i) => i.id === id);
}
