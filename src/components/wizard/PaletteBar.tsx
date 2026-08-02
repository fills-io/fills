"use client";

/**
 * PaletteBar — one connected bar of colours, sized by dominance.
 *
 * Each colour is a solid block with a clear, hard edge to its neighbour (no
 * blending) and its hex code sitting on it. Block WIDTH is proportional to how
 * dominant the colour is in the source images, so the main colour reads as the
 * biggest.
 *
 * Editing a colour:
 *   - Tap a block  → the OS colour picker (type a hex, drag the wheel).
 *   - Eyedropper   → sample any colour on screen (where the browser supports it).
 *
 * The palette + weights live in the parent, so the wizard state stays the
 * single source of truth.
 */

import { useEffect, useState } from "react";

type Props = {
  colors: string[];
  /** Dominance per colour (0..1), aligned with `colors`. Absent ≡ equal width. */
  weights?: number[];
  onChange: (colors: string[]) => void;
};

/** Minimal typing for the (still newish) EyeDropper API. */
type EyeDropperResult = { sRGBHex: string };
interface EyeDropperInstance {
  open: (options?: { signal?: AbortSignal }) => Promise<EyeDropperResult>;
}
interface EyeDropperConstructor {
  new (): EyeDropperInstance;
}

function readableText(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "#2a2a28";
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum > 150 ? "#2a2a28" : "#f4f2ec";
}

const EyedropperIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M4 20l1.5-.4L15 10" />
    <path d="M13.5 6.5l4 4" />
    <path d="M15.5 4.5a2.1 2.1 0 0 1 3 3L16.5 9.5l-3-3 2-2Z" />
  </svg>
);

export default function PaletteBar({ colors, weights, onChange }: Props) {
  const [supportsEyedropper, setSupportsEyedropper] = useState(false);
  useEffect(() => {
    // Feature-detect after mount so server and first client render agree (no
    // hydration mismatch); the eyedropper button then appears where supported.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupportsEyedropper(
      typeof window !== "undefined" && "EyeDropper" in window,
    );
  }, []);

  // Block width ∝ dominance. Floor each so even a small colour stays readable.
  const grow = (i: number): number => {
    if (!weights || weights.length !== colors.length) return 1;
    return Math.max(weights[i] ?? 0, 0.08);
  };

  function update(i: number, hex: string) {
    onChange(colors.map((c, idx) => (idx === i ? hex : c)));
  }

  async function sample(i: number) {
    const Ctor = (window as unknown as { EyeDropper?: EyeDropperConstructor })
      .EyeDropper;
    if (!Ctor) return;
    try {
      const result = await new Ctor().open();
      update(i, result.sRGBHex);
    } catch {
      /* user pressed Escape — no change */
    }
  }

  return (
    <div>
      <div className="flex h-24 w-full overflow-hidden rounded-xl border border-bdr-2 lg:h-28">
        {colors.map((hex, i) => {
          const text = readableText(hex);
          const pct = weights ? Math.round((weights[i] ?? 0) * 100) : null;
          return (
            <div
              key={i}
              // Floor the width on phones so the eyedropper — now always drawn
              // — stays inside its own block instead of over its neighbour.
              className="group relative min-w-[42px] border-r border-bg-2 last:border-r-0 sm:min-w-0"
              style={{ flexGrow: grow(i), flexBasis: 0, backgroundColor: hex }}
            >
              {/* Tap anywhere on the block → OS colour picker */}
              <input
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(hex) ? hex : "#000000"}
                onChange={(e) => update(i, e.target.value)}
                aria-label={`Change colour ${i + 1} (${hex})`}
                className="absolute inset-0 z-0 h-full w-full cursor-pointer opacity-0"
              />

              {/* Eyedropper — sample any colour on screen. Always drawn, just
                  dimmed: hiding it behind :hover left it unreachable on touch
                  while the helper text below still told the user to use it. */}
              {supportsEyedropper && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    sample(i);
                  }}
                  aria-label={`Pick colour ${i + 1} with the eyedropper`}
                  className="absolute right-1.5 top-1.5 z-20 grid h-6 w-6 place-items-center rounded-full bg-black/25 opacity-70 backdrop-blur-sm transition group-hover:opacity-100 focus-visible:opacity-100"
                  style={{ color: text }}
                >
                  {EyedropperIcon}
                </button>
              )}

              {/* Hex code + dominance %, sitting on the colour */}
              <span
                className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex flex-col items-center gap-0.5 px-1 text-center font-mono uppercase"
                style={{ color: text }}
              >
                <span className="truncate text-[10px] tracking-wide lg:text-[11px]">
                  {hex.toUpperCase()}
                </span>
                {pct !== null && (
                  <span className="text-[8px] opacity-70 lg:text-[9px]">
                    {pct}%
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-2 text-[11px] text-txt-3">
        Widths show how dominant each colour is. Tap a colour to change it
        {supportsEyedropper
          ? ", or use the eyedropper to grab a colour from anywhere on screen."
          : "."}
      </p>
    </div>
  );
}
