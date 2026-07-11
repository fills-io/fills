"use client";

/**
 * BlendedPaletteBar — one connected bar of colours.
 *
 * A hybrid of "crisp blocks" and "soft blend": each colour is a solid block
 * with its hex code sitting on it (so it's readable and editable), but the
 * seams between neighbours melt together with a soft gradient so the whole
 * thing reads as one flowing palette.
 *
 * Editing a colour:
 *   - Tap a block  → the OS colour picker (type a hex, drag the wheel).
 *   - Eyedropper   → sample any colour on screen (where the browser supports it).
 *
 * The palette lives in the parent, so the wizard state stays the single source
 * of truth. Colours are plain hex strings.
 */

import { useEffect, useState } from "react";

type Props = {
  colors: string[];
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

export default function BlendedPaletteBar({ colors, onChange }: Props) {
  const [supportsEyedropper, setSupportsEyedropper] = useState(false);
  useEffect(() => {
    // Feature-detect after mount so server and first client render agree (no
    // hydration mismatch); the eyedropper button then appears where supported.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupportsEyedropper(
      typeof window !== "undefined" && "EyeDropper" in window,
    );
  }, []);

  const n = colors.length;

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
      <div className="relative flex h-24 w-full overflow-hidden rounded-xl border border-bdr-2 lg:h-28">
        {colors.map((hex, i) => {
          const text = readableText(hex);
          return (
            <div
              key={i}
              className="group relative flex-1"
              style={{ backgroundColor: hex }}
            >
              {/* Tap anywhere on the block → OS colour picker */}
              <input
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(hex) ? hex : "#000000"}
                onChange={(e) => update(i, e.target.value)}
                aria-label={`Change colour ${i + 1} (${hex})`}
                className="absolute inset-0 z-0 h-full w-full cursor-pointer opacity-0"
              />

              {/* Eyedropper — sample any colour on screen */}
              {supportsEyedropper && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    sample(i);
                  }}
                  aria-label={`Pick colour ${i + 1} with the eyedropper`}
                  className="absolute right-1.5 top-1.5 z-20 grid h-6 w-6 place-items-center rounded-full bg-black/25 opacity-0 backdrop-blur-sm transition group-hover:opacity-100 focus-visible:opacity-100"
                  style={{ color: text }}
                >
                  {EyedropperIcon}
                </button>
              )}

              {/* Hex code, sitting on the colour */}
              <span
                className="pointer-events-none absolute inset-x-0 bottom-2 z-10 text-center font-mono text-[10px] uppercase tracking-wide lg:text-[11px]"
                style={{ color: text }}
              >
                {hex.toUpperCase()}
              </span>
            </div>
          );
        })}

        {/* Soft seams — thin gradient strips that melt neighbours together */}
        {colors.slice(0, -1).map((hex, i) => (
          <span
            key={`seam-${i}`}
            aria-hidden
            className="pointer-events-none absolute top-0 h-full"
            style={{
              left: `${((i + 1) / n) * 100}%`,
              width: "clamp(16px, 6%, 36px)",
              transform: "translateX(-50%)",
              background: `linear-gradient(90deg, ${hex}, ${colors[i + 1]})`,
            }}
          />
        ))}
      </div>

      <p className="mt-2 text-[11px] text-txt-3">
        Tap a colour to change it
        {supportsEyedropper
          ? ", or use the eyedropper to grab a colour from anywhere on screen."
          : "."}
      </p>
    </div>
  );
}
