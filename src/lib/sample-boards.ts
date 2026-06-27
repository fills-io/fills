/**
 * Sample boards — the example briefs shown in the homepage showcase
 * (ported verbatim from the v40 prototype's SAMPLES array).
 *
 * Each board's preview "image" is built from its own palette (a gradient of
 * the real colors) rather than a stock photo — honest and on-brand until
 * real renders are generated.
 */

export type SampleBoard = {
  tag: string;
  name: string;
  style: string;
  /** Five palette colors, light → dark. */
  palette: [string, string, string, string, string];
  materials: string;
  size: string;
  desc: string;
};

export const SAMPLE_BOARDS: SampleBoard[] = [
  {
    tag: "Residential",
    name: "Meadow Living",
    style: "Warm Minimalist",
    palette: ["#F5EDE4", "#E8D5C4", "#D4A88C", "#A86B47", "#3D2817"],
    materials: "Clay plaster, oak, linen, brass",
    size: "120 SQM",
    desc: "A family living space designed around a single afternoon light direction. Clay plaster, oak floors, linen drapery, and aged brass fixtures.",
  },
  {
    tag: "Hospitality",
    name: "Cloud Lounge",
    style: "Soft Brutalist",
    palette: ["#EFEAE2", "#D9D2C5", "#A8A492", "#5C5847", "#2A2620"],
    materials: "Concrete, travertine, paper, steel",
    size: "320 SQM",
    desc: "Hotel lounge with a poured concrete shell and travertine floors. Light enters through a paper-screened east wall.",
  },
  {
    tag: "Cultural",
    name: "Void Index",
    style: "Editorial Noir",
    palette: ["#EFEDE8", "#A8A6A2", "#5C5A56", "#2E2C28", "#0A0908"],
    materials: "Polished plaster, ink-stained oak, marble",
    size: "480 SQM",
    desc: "Gallery-cafe hybrid. Inked oak counters, polished black plaster, single-source overhead light.",
  },
  {
    tag: "Wellness",
    name: "Plaster & Rose",
    style: "Plaster & Rose",
    palette: ["#FAF1EC", "#EBD3C8", "#D4A89A", "#8B5E52", "#3F2A24"],
    materials: "Rose plaster, velvet, soft brass, terrazzo",
    size: "180 SQM",
    desc: "Rose-toned wellness studio. Warm rose plaster, velvet drape, soft brass, and terrazzo floors.",
  },
  {
    tag: "Coastal",
    name: "Salt Threshold",
    style: "Coastal Calm",
    palette: ["#F0F1ED", "#D4DDDC", "#9BA9AB", "#5A6A6E", "#2C3539"],
    materials: "Limewash, linen, salt-bleached oak",
    size: "95 SQM",
    desc: "A coastal apartment threshold with limewash walls, linen sheers, and salt-bleached oak.",
  },
  {
    tag: "F&B",
    name: "Citrus House",
    style: "Mediterranean",
    palette: ["#FBF0EB", "#E8C4B0", "#C8512A", "#8B3A1A", "#3D1F12"],
    materials: "Travertine, terracotta tile, olive wood, rope",
    size: "210 SQM",
    desc: "Mediterranean cafe with travertine counters, terracotta floor tile, olive-wood seating, and rope-bound lighting.",
  },
];

/** A diagonal gradient built from a board's palette (used as its preview). */
export function paletteGradient(palette: SampleBoard["palette"]): string {
  return `linear-gradient(135deg, ${palette[1]} 0%, ${palette[2]} 45%, ${palette[3]} 75%, ${palette[4]} 100%)`;
}
