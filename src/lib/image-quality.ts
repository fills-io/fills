/**
 * Reference-image quality filter.
 *
 * Scraped Pinterest pools are full of things a designer would never put in a
 * brief: product listings, text-overlay infographics ("False Ceiling — Types,
 * Advantages & Disadvantages"), exported assets ("Wood Grain PNG"), printables
 * and wall art, article headlines, palette cards, and photos of people.
 *
 * We can't run a vision model on every pin at request time, but a pin's TITLE
 * is a strong signal — these images are titled by whoever published them, and
 * text-heavy graphics almost always announce themselves ("ideas", "tips", "how
 * to", "types of", "guide", "vs", "top 10", "PNG", "Etsy", a price, a size).
 *
 * So: reject on title signal, and prefer pins that read like real interior
 * photography. Applied both to what the picker OFFERS the user and to what the
 * AI auto-selects, so a text-heavy image can never reach a brief.
 */

import type { CuratedPin } from "@/data/reference-images";

/** Phrases that mark an image as a graphic/listing/article rather than a photo. */
const REJECT_PATTERNS: RegExp[] = [
  // Marketplaces + explicit commerce
  /\b(etsy|amazon|ebay|alibaba|wayfair|ikea\s+hack|aliexpress)\b/i,
  /\b(for sale|buy now|shop now|on sale|discount|coupon|free shipping)\b/i,
  /\b(price|pricing|\$\s?\d|usd\s?\d|₹\s?\d|£\s?\d|€\s?\d)\b/i,
  /\b(set of \d|pack of \d|\d+\s?(pcs?|pieces)\b)/i,
  /\b\d+-(head|light|piece|pack|tier|seater)\b/i,
  /\b(sample|swatch pack|colou?r ?way|sku|model no)\b/i,
  /[®™]/,
  // Product-listing dimension strings: "117.3in", "80x60cm", "9.02-in",
  // 'L55" x W24"', "24x48" tile sizes, "20-mil" wear layers.
  /\d+(\.\d+)?\s?-?\s?(in|inch|inches|cm|mm|ft|mil)\b/i,
  /\d+\s*["”]\s*(x|×)/i,
  /\b[lwhd]\s?\d+(\.\d+)?\s*["”]/i,
  /\b\d{1,3}\s?[x×]\s?\d{1,3}\b/,
  // Ad copy / calls to action
  /\b(book a|sign up|shop the|order now|free quote|get yours|inscrivez|jetzt|comprar)\b/i,
  /\b\d+\s+of\s+the\s+(best|top|most)\b/i,

  // Downloadable / printable assets, not photographs
  /\b(png|svg|jpg|jpeg|psd|dwg|cad block|vector|clipart|mockup)\b/i,
  /\b(printable|print at home|digital download|instant download|wall art|poster|canvas print|framed print)\b/i,
  /\b(template|worksheet|planner|checklist|cheat sheet)\b/i,

  // Text-overlay / infographic / listicle titles
  /\b(ideas|inspiration guide|guide to|how to|tips|tricks|hacks|tutorial|step by step|diy)\b/i,
  /\b(types? of|advantages|disadvantages|pros and cons|vs\.?|versus|comparison|difference between)\b/i,
  /\b(top|best)\s?\d+\b/i,
  /\b\d+\s+(best|top|amazing|beautiful|stunning|creative|modern)\b/i,
  /\b(everything you need|what you need to know|explained|explore latest|latest trends?|trending now)\b/i,
  /\b(infographic|chart|diagram|checklist|glossary)\b/i,

  // Palette / swatch / moodboard cards — collages with labels, not rooms
  /\b(colou?r (palette|scheme|combination|chart)|paint colou?rs?|swatch|moodboard|mood board|collage)\b/i,

  // Editorial / blog headlines
  /\b(the timeless|iconic|a complete|ultimate|essential|must[- ]have|why you should|reasons)\b/i,

  // People / fashion / lifestyle, not interiors
  /\b(outfit|fashion|model|portrait|selfie|hairstyle|makeup look|ootd|wedding dress)\b/i,

  // Floor plans and drawings (useful later, not as a look-and-feel reference)
  /\b(floor ?plan|elevation drawing|section drawing|blueprint|autocad|sketchup)\b/i,

  // ── Pinterest AD PINS ────────────────────────────────────────────────
  // These are the ones with marketing text burned into the image. Their
  // captions are truncated ad copy, so they announce themselves:

  // Marketing imperatives aimed at the viewer
  /\b(transform|elevate|upgrade|discover|reimagine|refresh|revamp|declutter)\s+(your|his|her|their)\b/i,
  /\b(feel at home|your dream|dream (kitchen|home|bathroom|bedroom)|make it yours)\b/i,
  // Imperative openers: "Top off your ceiling", "Give your room a lift"
  /^(top off|give|bring|add|turn|treat|update|complete|finish|style|dress)\s+(your|a|the)\b/i,

  // Non-English furniture/decor advertising vocabulary
  /\b(arreda|arredi|arredamento|cucina|cucine|soggiorno|spazi|ispirazione|camera da letto|mobili)\b/i,
  /\b(dekor|wohnzimmer|küche|schlafzimmer|einrichtung|luxuriös\w*|gemütlich\w*)\b/i,
  /\b(meuble[s]?|canapé|chambre|décoration|salle de bain)\b/i,
  /\b(muebles|dormitorio|cocina moderna|sala de estar)\b/i,

  // Truncated ad copy: caption cut mid-sentence
  /[:;,]\s*$/,
  /(\.\.\.|…)\s*$/,
  /\b(for|to|the|a|an|your|our|with|and|of|that|this|in|on|from|per|la|le|il|lo|un|una|di|e|und|der|die|das|et|con|y|del)\s*$/i,
];

/** Emoji and decorative symbols are a strong "marketing graphic" tell. */
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;

/** True when the pin looks like a clean interior photograph we can show. */
export function isUsableReference(pin: {
  title?: string;
  imageUrl?: string;
}): boolean {
  if (!pin.imageUrl) return false;
  const title = (pin.title ?? "").trim();

  // No title is fine — plenty of good pins are untitled. Judge only what we have.
  if (!title) return true;

  if (EMOJI.test(title)) return false;

  // ALL-CAPS titles of any length are almost always graphics/ads.
  const letters = title.replace(/[^A-Za-z]/g, "");
  if (letters.length > 8 && letters === letters.toUpperCase()) return false;

  // Very long titles are listing/SEO spam rather than a photo caption.
  if (title.length > 110) return false;

  return !REJECT_PATTERNS.some((re) => re.test(title));
}

/** Filter a pool down to usable references (keeps original order). */
export function usableOnly<T extends { title?: string; imageUrl?: string }>(
  pins: T[],
): T[] {
  return pins.filter(isUsableReference);
}

/**
 * Category keyword sets — used to tell whether a pin from a broad industry pool
 * is actually ABOUT this step (a lighting shot vs a generic room shot).
 */
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  furniture: [
    "furniture", "sofa", "chair", "seating", "table", "desk", "bench",
    "armchair", "stool", "cabinet", "shelving", "banquette", "lounge",
  ],
  lighting: [
    "lighting", "light", "lamp", "pendant", "chandelier", "sconce",
    "luminaire", "cove", "backlit", "illumination",
  ],
  flooring: [
    "floor", "flooring", "tile", "terrazzo", "parquet", "herringbone",
    "carpet", "rug", "concrete floor", "hardwood",
  ],
  ceiling: [
    "ceiling", "soffit", "beam", "coffered", "slat", "canopy", "vault",
  ],
  materials: [
    "material", "texture", "finish", "marble", "travertine", "oak", "walnut",
    "stone", "plaster", "brass", "timber", "veneer", "concrete", "linen",
  ],
  vibe: [],
};

/** How well a pin's title matches a category's vocabulary (0 = no match). */
export function categoryAffinity(
  pin: { title?: string; style?: string },
  category: string,
): number {
  const words = CATEGORY_KEYWORDS[category];
  if (!words || words.length === 0) return 0;
  const hay = `${pin.title ?? ""} ${pin.style ?? ""}`.toLowerCase();
  let score = 0;
  for (const w of words) {
    if (hay.includes(w)) score += 1;
  }
  return score;
}

export type { CuratedPin };
