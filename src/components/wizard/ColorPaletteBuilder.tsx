"use client";

/**
 * Color palette builder — four named, material-tagged color slots.
 *
 * Pattern intentionally matches the prototype's `richColorSystem`:
 *   - Primary    — the dominant color (≈ 50% of the room)
 *   - Secondary  — the supporting color (≈ 30%)
 *   - Accent     — the punch / contrast (≈ 10–15%)
 *   - Supporting — the connective / texture tone
 *
 * Each slot holds:
 *   - hex      — the actual color
 *   - name     — what the designer calls it ("Terracotta", "Travertine")
 *   - material — where it lives in the space ("Stoneware floor", "Linen drapery")
 *
 * Selection state is owned by the parent so the wizard's overall state is the
 * single source of truth.
 */

import type { ColorEntry } from "@/db/schema";

export type PaletteSlot = {
  /** Logical role in the room. */
  role: "primary" | "secondary" | "accent" | "supporting";
  /** Display label shown above the swatch. */
  label: string;
  /** One-line description of what this slot represents. */
  blurb: string;
  /** A sensible starting hex for the slot if the user has set nothing. */
  defaultHex: string;
};

export const PALETTE_SLOTS: readonly PaletteSlot[] = [
  {
    role: "primary",
    label: "Primary",
    blurb: "The dominant tone — about half the room.",
    defaultHex: "#c8a882",
  },
  {
    role: "secondary",
    label: "Secondary",
    blurb: "Supporting backdrop, roughly a third of what you see.",
    defaultHex: "#f0eae2",
  },
  {
    role: "accent",
    label: "Accent",
    blurb: "The punch — small but unmissable.",
    defaultHex: "#c8512a",
  },
  {
    role: "supporting",
    label: "Supporting",
    blurb: "Texture, warmth, or connective tissue between the others.",
    defaultHex: "#5b4a3a",
  },
] as const;

type Props = {
  /** Current palette state — usually 4 entries, in PALETTE_SLOTS order. */
  palette: ColorEntry[];
  /** Replace the entire palette (passed-through to wizard state). */
  onChange: (palette: ColorEntry[]) => void;
};

export default function ColorPaletteBuilder({ palette, onChange }: Props) {
  // Ensure we always render exactly PALETTE_SLOTS.length slots, padding with
  // sensible defaults when the parent hasn't filled them all yet.
  const slots: ColorEntry[] = PALETTE_SLOTS.map((slot, i) => {
    const existing = palette[i];
    if (existing) return existing;
    return { hex: slot.defaultHex, name: "", material: "" };
  });

  function updateSlot(i: number, patch: Partial<ColorEntry>) {
    const next = slots.map((c, idx) => (idx === i ? { ...c, ...patch } : c));
    onChange(next);
  }

  return (
    <div className="space-y-4">
      {PALETTE_SLOTS.map((slot, i) => {
        const entry = slots[i];
        return (
          <div
            key={slot.role}
            className="flex flex-col gap-4 border border-bdr-2 bg-bg-2 p-4 sm:flex-row sm:items-stretch"
          >
            {/* Swatch + hex input */}
            <div className="flex flex-row gap-3 sm:flex-col sm:items-stretch">
              <label
                className="relative block h-20 w-20 cursor-pointer border border-bdr-2 transition hover:border-acc sm:h-24 sm:w-24"
                style={{ backgroundColor: entry.hex }}
                aria-label={`${slot.label} color picker`}
              >
                <input
                  type="color"
                  value={entry.hex}
                  onChange={(e) => updateSlot(i, { hex: e.target.value })}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>
              <input
                type="text"
                value={entry.hex}
                onChange={(e) => {
                  // Sanitize freely — only commit valid 7-char hex.
                  const v = e.target.value.trim();
                  if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                    updateSlot(i, { hex: v });
                  } else {
                    updateSlot(i, { hex: v });
                  }
                }}
                className="w-24 border border-bdr-2 bg-transparent px-2 py-1.5 text-center font-mono text-[11px] uppercase text-txt focus:border-acc focus:outline-none sm:w-24"
              />
            </div>

            {/* Role label + blurb + name + material */}
            <div className="flex-1 space-y-2">
              <div className="flex items-baseline justify-between">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
                  {slot.label}
                </h3>
              </div>
              <p className="text-[12px] text-txt-3">{slot.blurb}</p>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
                    Color name
                  </label>
                  <input
                    type="text"
                    value={entry.name}
                    onChange={(e) => updateSlot(i, { name: e.target.value })}
                    placeholder="e.g. Travertine"
                    className="mt-1 block w-full border-b border-bdr-2 bg-transparent px-1 py-1.5 text-[13px] text-txt placeholder:text-txt-3 focus:border-acc focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
                    Where it lives
                  </label>
                  <input
                    type="text"
                    value={entry.material}
                    onChange={(e) =>
                      updateSlot(i, { material: e.target.value })
                    }
                    placeholder="e.g. Wall plaster"
                    className="mt-1 block w-full border-b border-bdr-2 bg-transparent px-1 py-1.5 text-[13px] text-txt placeholder:text-txt-3 focus:border-acc focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
