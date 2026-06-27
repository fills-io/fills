/**
 * Concept palettes — the 6 starter palette cards (ported from v40).
 *
 * Each palette is 5 colors arranged light-to-dark; they preview as a
 * horizontal swatch row in the wizard's palette picker. Designed to be
 * stylistically distinct: Warm Earth (sandy luxe), Japandi (mineral
 * neutrals), Terracotta (the signature accent system), Sage Garden
 * (cool green), Editorial Noir (high-contrast greys), Plaster & Rose
 * (rose-tinted plaster).
 */

export type ConceptPalette = {
  id: string;
  label: string;
  /** Five colors light-to-dark, hex format. */
  colors: [string, string, string, string, string];
};

export const PALETTES: ConceptPalette[] = [
  {
    id: "warm",
    label: "Warm Earth",
    colors: ["#F5EDE4", "#E8D5C4", "#D4A88C", "#A86B47", "#3D2817"],
  },
  {
    id: "japandi",
    label: "Japandi",
    colors: ["#F2EFE9", "#D9D2C5", "#A8A492", "#5C5847", "#2A2620"],
  },
  {
    id: "terracotta",
    label: "Terracotta",
    colors: ["#FBF0EB", "#E8C4B0", "#C8512A", "#8B3A1A", "#3D1F12"],
  },
  {
    id: "sage",
    label: "Sage Garden",
    colors: ["#EFEDE5", "#C5CDB8", "#8FA08A", "#4F5C50", "#2B342D"],
  },
  {
    id: "noir",
    label: "Editorial Noir",
    colors: ["#EFEDE8", "#A8A6A2", "#5C5A56", "#2E2C28", "#0A0908"],
  },
  {
    id: "rose",
    label: "Plaster & Rose",
    colors: ["#FAF1EC", "#EBD3C8", "#D4A89A", "#8B5E52", "#3F2A24"],
  },
];

export function getPalette(id: string | null): ConceptPalette | undefined {
  return PALETTES.find((p) => p.id === id);
}
