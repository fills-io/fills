/**
 * Builds the GPT-Image prompts for the Quick flow's auto-generated visuals —
 * one photoreal room render per category, steered by the space, vibe, and the
 * extracted palette, and grounded in the brief's own mood line for that section.
 */

export type ImageCategory =
  | "cover"
  | "furniture"
  | "lighting"
  | "flooring"
  | "ceiling"
  | "materials";

export const IMAGE_CATEGORIES: {
  key: ImageCategory;
  label: string;
  focus: string;
}[] = [
  { key: "cover", label: "The space", focus: "the full room in a wide establishing shot" },
  { key: "furniture", label: "Furniture", focus: "the key furniture pieces and how they're arranged" },
  { key: "lighting", label: "Lighting", focus: "the lighting scheme — the fixtures and how light fills the room" },
  { key: "flooring", label: "Flooring", focus: "the flooring and how it grounds the room" },
  { key: "ceiling", label: "Ceiling", focus: "the ceiling treatment and overhead detail" },
  { key: "materials", label: "Materials", focus: "a close-up of the key materials, textures and finishes" },
];

export function buildImagePrompt(input: {
  focus: string;
  industry?: string;
  space?: string;
  vibe?: string;
  paletteHexes: string[];
  moodLine?: string;
}): string {
  const place =
    [input.space, input.industry].filter(Boolean).join(", ") ||
    "interior space";
  const style = input.vibe ? `, ${input.vibe} style` : "";
  const palette = input.paletteHexes.slice(0, 6).join(", ");
  const mood = input.moodLine ? ` ${input.moodLine}` : "";
  return [
    `Photorealistic interior design photograph of a ${place}${style}.`,
    `Focus on ${input.focus}.${mood}`,
    palette ? `Colour palette: ${palette}.` : "",
    "Editorial architectural photography, natural daylight, high detail, no text, no watermarks, no people.",
  ]
    .filter(Boolean)
    .join(" ");
}
