"use client";

/**
 * Step 3 — Colors & Palette.
 *
 * Four-slot color palette builder (Primary / Secondary / Accent / Supporting).
 * Each slot is a hex value + a designer name + the material it shows up on.
 *
 * The "Suggest a palette" button hits /api/colors/generate, which proxies
 * Colormind.io — a free palette-completion service that returns harmonized
 * hex codes. We pull the first 4 colors and replace any slots whose user-set
 * name is empty. Slots the user has already named are treated as "locked".
 */

import { useState } from "react";
import ColorPaletteBuilder, {
  PALETTE_SLOTS,
} from "@/components/wizard/ColorPaletteBuilder";
import type { ColorEntry } from "@/db/schema";
import type { WizardState } from "@/lib/wizard-state";

type Props = {
  state: WizardState;
  setState: (patch: Partial<WizardState>) => void;
};

/** Default starting palette — pulled from the warm-cream/terracotta theme. */
function defaultPalette(): ColorEntry[] {
  return PALETTE_SLOTS.map((slot) => ({
    hex: slot.defaultHex,
    name: "",
    material: "",
  }));
}

export default function ColorsStep({ state, setState }: Props) {
  const palette = state.palette ?? defaultPalette();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pinterest's Apify scraper returns a dominantColor per pin (when available).
  // Surface only those vibe pins that came back with a usable hex.
  const vibePinsWithColors = (state.vibePins ?? [])
    .map((p) => p.dominantColor?.trim())
    .filter((c): c is string => !!c && /^#[0-9a-f]{6}$/i.test(c));

  /** Fill unnamed palette slots with dominant colors pulled from vibe pins. */
  function pullFromVibe() {
    if (vibePinsWithColors.length === 0) return;
    const next: ColorEntry[] = palette.map((slot, i) => {
      if (slot.name.trim()) return slot; // locked by name
      const pulled = vibePinsWithColors[i];
      return pulled ? { ...slot, hex: pulled } : slot;
    });
    setState({ palette: next });
  }

  async function suggestPalette() {
    setStatus("loading");
    setErrorMessage(null);
    try {
      // Lock any slot the user has already named — Colormind will respect it.
      const locked = palette
        .map((c) => (c.name.trim() ? c.hex : null))
        .filter((v): v is string => v !== null);
      const query = locked.length > 0 ? `?locked=${locked.join(",")}` : "";

      const response = await fetch(`/api/colors/generate${query}`);
      const data = (await response.json()) as
        | { palette: string[] }
        | { ok: false; error: string };

      if ("ok" in data && data.ok === false) {
        throw new Error(data.error);
      }
      if (!("palette" in data)) {
        throw new Error("Unexpected response from /api/colors/generate");
      }

      // Replace only the slots whose name is empty — preserve user-named ones.
      const next: ColorEntry[] = palette.map((slot, i) => {
        if (slot.name.trim()) return slot; // user-named = locked
        return { ...slot, hex: data.palette[i] ?? slot.hex };
      });
      setState({ palette: next });
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setErrorMessage(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-[14px] text-hero-cream-2">
        Build the palette in four roles. The names and materials you write here
        feed straight into the final Design DNA brief, so think of them as
        designer-to-designer notes, not generic labels.
      </p>

      {/* Generation buttons */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={suggestPalette}
            disabled={status === "loading"}
            className="inline-flex items-center gap-2 border border-acc px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.1em] text-acc transition hover:bg-acc hover:text-white disabled:opacity-50"
          >
            {status === "loading" ? "Generating…" : "Suggest a palette →"}
          </button>

          {vibePinsWithColors.length > 0 && (
            <button
              onClick={pullFromVibe}
              className="inline-flex items-center gap-2 border border-dark-3 px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.1em] text-hero-cream-2 transition hover:border-hero-cream-2 hover:text-hero-cream"
            >
              <span
                className="flex h-3 w-3 items-center justify-center gap-px"
                aria-hidden="true"
              >
                {vibePinsWithColors.slice(0, 4).map((c, i) => (
                  <span
                    key={i}
                    className="block h-3 w-[3px]"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </span>
              Pull from vibe pins
            </button>
          )}
        </div>
        <p className="text-[11px] text-hero-dim">
          Both buttons replace unnamed slots only. Slots you&apos;ve named stay.
        </p>
      </div>

      {status === "error" && (
        <div className="border border-red-900/40 bg-red-950/30 p-3 text-[12px] text-red-200">
          Suggestion failed: {errorMessage}
        </div>
      )}

      <ColorPaletteBuilder
        palette={palette}
        onChange={(next) => setState({ palette: next })}
      />

      <p className="text-[11px] text-hero-dim">
        Tip: leave a name blank if you&apos;re still scouting; those slots
        get replaced when you tap &ldquo;Suggest a palette.&rdquo; Name a slot
        to lock it before generating.
      </p>
    </div>
  );
}
