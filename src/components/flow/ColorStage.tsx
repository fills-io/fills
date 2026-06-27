"use client";

/**
 * Stage 3 — Color system. A 5-role palette pulled from the direction.
 * Roles: Dominant 60 / Secondary 30 / Accent 10 / Support / Support.
 * (Full HSL editing lands in a later pass; for now the strip + role labels
 * + a regenerate that cycles palettes.)
 */

import { useEffect, useState } from "react";
import { PALETTES, getPalette } from "@/lib/concept-palettes";
import { seedPaletteIdForVibe } from "@/lib/quickflow-data";
import type { FlowState } from "./FlowApp";

const ROLES = ["Dominant · 60%", "Secondary · 30%", "Accent · 10%", "Support", "Support"];

export default function ColorStage({
  state,
  patch,
}: {
  state: FlowState;
  patch: (p: Partial<FlowState>) => void;
}) {
  const seededId = state.paletteId || seedPaletteIdForVibe(state.vibe);
  const [paletteId, setPaletteId] = useState(seededId);
  const palette = getPalette(paletteId) ?? PALETTES[0];

  // Keep the chosen palette in flow state live, so the top-bar Continue
  // always advances with the current selection.
  useEffect(() => {
    patch({ paletteId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paletteId]);

  function regenerate() {
    const idx = PALETTES.findIndex((p) => p.id === paletteId);
    const next = PALETTES[(idx + 1) % PALETTES.length];
    setPaletteId(next.id);
  }

  return (
    <section>
      <div className="mb-2 flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-txt-3">
        <span className="inline-block h-px w-4 bg-txt-3" />
        03 · Color system
      </div>
      <h2 className="mb-2 font-serif text-[clamp(26px,3.4vw,38px)] font-normal leading-[1.1] tracking-tight text-txt">
        Pulled from your <em className="italic text-acc">direction</em>.
      </h2>
      <p className="mb-7 max-w-[560px] text-[14px] leading-relaxed text-txt-2">
        A complete color system, extracted and balanced. Regenerate to explore
        alternatives.
      </p>

      {/* Palette strip */}
      <div className="flex h-[140px] overflow-hidden border border-bdr-2">
        {palette.colors.map((c, i) => (
          <div
            key={i}
            className="relative flex-1 transition-all"
            style={{ backgroundColor: c, flexGrow: i === 0 ? 6 : i === 1 ? 3 : 1 }}
          >
            <span className="absolute bottom-2 left-2 font-mono text-[8px] uppercase tracking-[0.1em] text-white mix-blend-difference">
              {c}
            </span>
          </div>
        ))}
      </div>

      {/* Role labels */}
      <div className="mt-3 flex gap-2 font-mono text-[9px] uppercase tracking-[0.1em] text-txt-3">
        {ROLES.map((r, i) => (
          <span key={i} style={{ flexGrow: i === 0 ? 6 : i === 1 ? 3 : 1 }} className="flex-1">
            {r}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-acc">
        <span className="inline-block h-px w-4 bg-acc" />
        Palette · {palette.label}
      </div>

      <div className="mt-8 border-t border-bdr-2 pt-6">
        <button
          onClick={regenerate}
          className="inline-flex items-center gap-2 border border-bdr-2 px-6 py-3.5 text-[13px] font-medium text-txt transition hover:border-acc hover:text-acc active:scale-[0.98]"
        >
          ↻ Regenerate
        </button>
      </div>
    </section>
  );
}
