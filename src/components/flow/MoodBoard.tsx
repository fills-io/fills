"use client";

/**
 * MoodBoard — the final deliverable view. Hero banner, then a board grid
 * (palette, materials, furniture, lighting, spatial notes) assembled from
 * the brief. Footer: add another space, talk to architect, export PDF.
 * Design-first; Export PDF is a stub until the new data shape is wired to
 * the PDF renderer.
 */

import { getPalette } from "@/lib/concept-palettes";
import { buildNarrative } from "@/lib/quickflow-data";
import PlaceholderScene from "./PlaceholderScene";
import type { FlowState } from "./FlowApp";

export default function MoodBoard({
  state,
  onAddSpace,
}: {
  state: FlowState;
  onAddSpace: () => void;
}) {
  const palette = getPalette(state.paletteId);
  const narrative = buildNarrative(state.spec, state.vibe);

  return (
    <main className="mx-auto max-w-[1000px] px-6 py-12">
      {/* Breadcrumbs */}
      <div className="mb-4 font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
        Untitled project · Untitled zone ·{" "}
        <span className="text-acc">{state.spec || "concept"}</span>
      </div>

      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="font-serif text-[clamp(26px,3.6vw,38px)] font-normal capitalize leading-[1.1] tracking-tight text-txt">
          {state.spec || "Your mood board"}
        </h1>
        <span className="inline-flex items-center gap-2 border border-bdr-2 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-txt-3">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Saved
        </span>
      </div>

      {/* Hero banner */}
      <div className="relative mb-3 h-[300px] w-full overflow-hidden border border-bdr-2">
        <PlaceholderScene pattern="arch" className="h-full w-full" />
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/40 to-transparent p-8">
          <p className="max-w-[480px] font-serif text-[clamp(18px,2.4vw,26px)] italic leading-[1.3] text-white">
            “{state.vibe || "A warm, considered direction"}.”
          </p>
        </div>
      </div>

      {/* Board grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Palette */}
        <BoardCard title="Palette">
          {palette ? (
            <div className="flex h-14 overflow-hidden border border-bdr-2">
              {palette.colors.map((c, i) => (
                <span key={i} className="flex-1" style={{ flexGrow: i === 0 ? 6 : i === 1 ? 3 : 1, backgroundColor: c }} />
              ))}
            </div>
          ) : null}
        </BoardCard>

        {/* Materials */}
        <BoardCard title="Materials">
          <div className="grid grid-cols-3 gap-2">
            {["arch", "window", "col"].map((p, i) => (
              <PlaceholderScene key={i} pattern={p as "arch"} className="aspect-square w-full" />
            ))}
          </div>
        </BoardCard>

        {/* Furniture */}
        <BoardCard title="Furniture">
          <p className="font-serif text-[14px] leading-[1.6] text-txt-2">
            Low, sculptural silhouettes in considered materials — a hero piece,
            a few quiet supporting forms, room to breathe.
          </p>
        </BoardCard>

        {/* Lighting */}
        <BoardCard title="Lighting">
          <p className="font-serif text-[14px] leading-[1.6] text-txt-2">
            Warm pools at human height, daylight left to lead, accents only
            where the eye should rest.
          </p>
        </BoardCard>

        {/* Spatial notes — full width */}
        <div className="sm:col-span-2">
          <BoardCard title="Spatial notes">
            <p className="font-serif text-[14px] leading-[1.6] text-txt-2">{narrative.spatial}</p>
          </BoardCard>
        </div>
      </div>

      {/* Footer actions */}
      <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-bdr-2 pt-6">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onAddSpace}
            className="border border-bdr-2 px-5 py-3 text-[12px] font-medium text-txt transition hover:border-acc hover:text-acc"
          >
            + Add another space
          </button>
          <button className="border border-bdr-2 px-5 py-3 text-[12px] font-medium text-txt transition hover:border-acc hover:text-acc">
            Talk to a working architect
          </button>
        </div>
        <button
          title="PDF export for the new flow lands once it's wired to the renderer"
          className="inline-flex items-center gap-2 bg-acc px-6 py-3 text-[12px] font-medium uppercase tracking-[0.08em] text-white transition hover:bg-acc-h"
        >
          Export PDF →
        </button>
      </footer>
    </main>
  );
}

function BoardCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-bdr-2 bg-bg-2 p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
          {title}
        </span>
        <button className="font-mono text-[9px] uppercase tracking-[0.1em] text-txt-3 transition hover:text-acc">
          ↻ Regenerate
        </button>
      </div>
      {children}
    </div>
  );
}
