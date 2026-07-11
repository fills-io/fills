"use client";

/**
 * Color palette builder — four named, material-tagged color slots, plus a live
 * proportional preview of how they sit together.
 *
 *   - Primary    — the dominant color (≈ 50% of the room)
 *   - Secondary  — the supporting color (≈ 30%)
 *   - Accent     — the punch / contrast (≈ 12%)
 *   - Supporting — the connective / texture tone (≈ 8%)
 *
 * Each slot holds hex + name + material. The swatch is a real color picker
 * (click anywhere on it) with a visible eyedropper affordance so it reads as
 * editable; the hex field lets you type a value directly. Selection state is
 * owned by the parent so the wizard's overall state is the source of truth.
 */

import type { ColorEntry } from "@/db/schema";

export type PaletteSlot = {
  role: "primary" | "secondary" | "accent" | "supporting";
  label: string;
  blurb: string;
  defaultHex: string;
  /** Rough share of the room — drives the live preview proportions. */
  weight: number;
};

export const PALETTE_SLOTS: readonly PaletteSlot[] = [
  {
    role: "primary",
    label: "Primary",
    blurb: "The dominant tone — about half the room.",
    defaultHex: "#c8a882",
    weight: 0.5,
  },
  {
    role: "secondary",
    label: "Secondary",
    blurb: "Supporting backdrop, roughly a third of what you see.",
    defaultHex: "#f0eae2",
    weight: 0.3,
  },
  {
    role: "accent",
    label: "Accent",
    blurb: "The punch — small but unmissable.",
    defaultHex: "#c8512a",
    weight: 0.12,
  },
  {
    role: "supporting",
    label: "Supporting",
    blurb: "Texture, warmth, or connective tissue between the others.",
    defaultHex: "#5b4a3a",
    weight: 0.08,
  },
] as const;

type Props = {
  palette: ColorEntry[];
  onChange: (palette: ColorEntry[]) => void;
  /** Called when a slot gains focus (for click-to-assign from the vibe strip). */
  onFocusSlot?: (i: number) => void;
};

/** Fill/pad to exactly PALETTE_SLOTS.length entries. */
function normalize(palette: ColorEntry[]): ColorEntry[] {
  return PALETTE_SLOTS.map((slot, i) => {
    const existing = palette[i];
    if (existing) return existing;
    return { hex: slot.defaultHex, name: "", material: "" };
  });
}

const EyedropperIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20l1.5-.4L15 10" />
    <path d="M13.5 6.5l4 4" />
    <path d="M15.5 4.5a2.1 2.1 0 0 1 3 3L16.5 9.5l-3-3 2-2Z" />
  </svg>
);

export default function ColorPaletteBuilder({
  palette,
  onChange,
  onFocusSlot,
}: Props) {
  const slots = normalize(palette);

  function updateSlot(i: number, patch: Partial<ColorEntry>) {
    onChange(slots.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {PALETTE_SLOTS.map((slot, i) => {
        const entry = slots[i];
        return (
          <div
            key={slot.role}
            onFocus={() => onFocusSlot?.(i)}
            className="flex flex-col gap-2 border border-bdr-2 bg-bg-2 p-3"
          >
            {/* Swatch — click anywhere to pick */}
            <label
              className="group relative block h-16 w-full cursor-pointer overflow-hidden border border-bdr-2 transition hover:border-acc"
              style={{ backgroundColor: entry.hex }}
              title={slot.blurb}
              aria-label={`${slot.label} color picker, click to change`}
            >
              <input
                type="color"
                value={entry.hex}
                onChange={(e) => updateSlot(i, { hex: e.target.value })}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <span className="pointer-events-none absolute bottom-1 right-1 grid h-5 w-5 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm transition group-hover:scale-110">
                {EyedropperIcon}
              </span>
            </label>

            {/* Role + share */}
            <div className="flex items-baseline justify-between">
              <h3
                title={slot.blurb}
                className="font-mono text-[9px] uppercase tracking-[0.16em] text-acc"
              >
                {slot.label}
              </h3>
              <span className="font-mono text-[9px] text-txt-3">
                ≈{Math.round(slot.weight * 100)}%
              </span>
            </div>

            {/* Hex */}
            <input
              type="text"
              value={entry.hex}
              onChange={(e) => updateSlot(i, { hex: e.target.value.trim() })}
              className="w-full border border-bdr-2 bg-transparent px-2 py-1 text-center font-mono text-[11px] uppercase text-txt focus:border-acc focus:outline-none"
            />

            {/* Name + where it lives (stacked) */}
            <input
              type="text"
              value={entry.name}
              onChange={(e) => updateSlot(i, { name: e.target.value })}
              placeholder="Name, e.g. Travertine"
              className="w-full border-b border-bdr-2 bg-transparent px-1 py-1 text-[12px] text-txt placeholder:text-txt-3 focus:border-acc focus:outline-none"
            />
            <input
              type="text"
              value={entry.material}
              onChange={(e) => updateSlot(i, { material: e.target.value })}
              placeholder="Where, e.g. Wall plaster"
              className="w-full border-b border-bdr-2 bg-transparent px-1 py-1 text-[12px] text-txt placeholder:text-txt-3 focus:border-acc focus:outline-none"
            />
          </div>
        );
      })}
    </div>
  );
}

/**
 * Live preview — a proportional stack showing how the four colors sit together
 * in a real room (primary dominant, accent a sliver). Updates as you edit.
 */
export function PalettePreview({ palette }: { palette: ColorEntry[] }) {
  const slots = normalize(palette);

  return (
    <div className="border border-bdr-2 bg-bg-2 p-3">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
          Live preview
        </h3>
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-txt-3">
          In proportion
        </span>
      </div>

      {/* Proportional stacked bar */}
      <div className="flex h-28 w-full overflow-hidden border border-bdr-2 lg:h-32">
        {PALETTE_SLOTS.map((slot, i) => {
          const entry = slots[i];
          return (
            <div
              key={slot.role}
              className="relative flex items-end"
              style={{ flexGrow: slot.weight, backgroundColor: entry.hex }}
            >
              {/* Rotated role label along the bottom of wide segments */}
              {slot.weight >= 0.25 && (
                <span className="p-1.5 font-mono text-[8px] uppercase tracking-wide text-white/70 mix-blend-difference">
                  {entry.name || slot.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 space-y-1.5">
        {PALETTE_SLOTS.map((slot, i) => {
          const entry = slots[i];
          return (
            <div key={slot.role} className="flex items-center gap-2">
              <span
                className="h-3.5 w-3.5 shrink-0 border border-bdr-2"
                style={{ backgroundColor: entry.hex }}
              />
              <span className="truncate text-[11px] text-txt-2">
                {entry.name || slot.label}
              </span>
              <span className="ml-auto shrink-0 font-mono text-[9px] uppercase text-txt-3">
                {entry.hex}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
