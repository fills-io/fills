"use client";

/**
 * ConceptPage — the editable concept. Title from the spec, "Reading this as"
 * refinement chips, 6 design-element rows (each 4 placeholder thumbs + an
 * Edit that cycles the direction), editorial + spatial narrative, and the
 * "Create mood board" CTA. Design-first; real AI/imagery wired later.
 */

import { useState } from "react";
import { getPalette } from "@/lib/concept-palettes";
import {
  CONCEPT_ELEMENTS,
  CONTEXT_DIMENSIONS,
  ELEMENT_ALTERNATIVES,
  buildNarrative,
} from "@/lib/quickflow-data";
import PlaceholderScene from "./PlaceholderScene";
import { useVibeImages, sliceImages, VibeImage } from "./vibeImages";
import type { FlowState } from "./FlowApp";

export default function ConceptPage({
  state,
  onCreateBoard,
}: {
  state: FlowState;
  onCreateBoard: () => void;
}) {
  const palette = getPalette(state.paletteId);
  const [context, setContext] = useState<Record<string, string>>(() =>
    Object.fromEntries(CONTEXT_DIMENSIONS.map((d) => [d.id, d.options[0]])),
  );
  const [elementIdx, setElementIdx] = useState<Record<string, number>>({});
  const narrative = buildNarrative(state.spec, state.vibe);
  const images = useVibeImages(state.vibe, state.spec, state.picks);

  function cycleElement(id: string) {
    const alts = ELEMENT_ALTERNATIVES[id] ?? [];
    setElementIdx((prev) => ({ ...prev, [id]: ((prev[id] ?? 0) + 1) % alts.length }));
  }

  return (
    <main className="mx-auto max-w-[920px] px-6 py-12">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-6 border-b border-bdr-2 pb-8">
        <div>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-acc">
            Concept · Ready for render
          </div>
          <h1 className="font-serif text-[clamp(28px,4vw,42px)] font-normal capitalize leading-[1.1] tracking-tight text-txt">
            {state.spec || "Your concept"}
          </h1>
          <p className="mt-2 font-serif text-[16px] italic text-txt-2">
            {state.vibe}{state.industry ? ` · ${state.industry}` : ""}
          </p>
        </div>
        <div className="text-right font-mono text-[9px] uppercase leading-[1.8] tracking-[0.12em] text-txt-3">
          FRAC.05 / REV.A
          <br />
          {state.industry || "—"}
          <br />
          2026 · ED.01
        </div>
      </div>

      {/* Reading this as — context chips */}
      <section className="mt-8">
        <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
          Reading this as
        </div>
        <div className="flex flex-wrap gap-2">
          {CONTEXT_DIMENSIONS.map((d) => (
            <label
              key={d.id}
              className="inline-flex items-center gap-2 border border-bdr-2 bg-bg-2 px-3 py-2 text-[12px]"
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-txt-3">
                {d.label}
              </span>
              <select
                value={context[d.id]}
                onChange={(e) => setContext((p) => ({ ...p, [d.id]: e.target.value }))}
                className="bg-transparent font-sans text-[12px] text-txt outline-none"
              >
                {d.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </section>

      {/* Palette */}
      {palette && (
        <section className="mt-9">
          <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
            Color system · {palette.label}
          </div>
          <div className="flex h-16 overflow-hidden border border-bdr-2">
            {palette.colors.map((c, i) => (
              <span key={i} className="flex-1" style={{ flexGrow: i === 0 ? 6 : i === 1 ? 3 : 1, backgroundColor: c }} />
            ))}
          </div>
        </section>
      )}

      {/* Visual element bars */}
      <section className="mt-9 space-y-4">
        {CONCEPT_ELEMENTS.map((el, elIdx) => {
          const alts = ELEMENT_ALTERNATIVES[el.id] ?? [];
          const idx = elementIdx[el.id] ?? 0;
          const direction = alts[idx] ?? el.label;
          return (
            <div key={el.id} className="border border-bdr-2 bg-bg-2 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-txt-3">
                    {el.num}
                  </span>
                  <div className="font-serif text-[18px] text-txt">{el.label}</div>
                  <div className="font-sans text-[12px] text-acc">{direction}</div>
                </div>
                <button
                  onClick={() => cycleElement(el.id)}
                  className="border border-bdr-2 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-txt-2 transition hover:border-acc hover:text-acc"
                >
                  Edit
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {images.length > 0
                  ? sliceImages(images, elIdx * 4, 4).map((src, i) => (
                      <VibeImage
                        key={i}
                        src={src}
                        className="aspect-[4/3] w-full"
                      />
                    ))
                  : [0, 1, 2, 3].map((i) => (
                      <PlaceholderScene
                        key={i}
                        pattern={(["arch", "window", "col", "plain"] as const)[i]}
                        className="aspect-[4/3] w-full"
                      />
                    ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* Narrative */}
      <section className="mt-9 grid gap-6 sm:grid-cols-2">
        <div>
          <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-acc">
            Editorial
          </div>
          <p className="font-serif text-[15px] leading-[1.7] text-txt">{narrative.editorial}</p>
        </div>
        <div>
          <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-acc">
            Spatial notes
          </div>
          <p className="font-serif text-[15px] leading-[1.7] text-txt">{narrative.spatial}</p>
        </div>
      </section>

      {/* CTA */}
      <footer className="mt-10 flex flex-col items-center gap-3 border-t border-bdr-2 pt-8 text-center">
        <button
          onClick={onCreateBoard}
          className="inline-flex items-center gap-2 bg-acc px-8 py-4 text-[13px] font-medium text-white transition hover:gap-3 hover:bg-acc-h"
        >
          Create mood board →
        </button>
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-txt-3">
          Free trial · 10 credits
        </span>
        <button className="mt-2 font-sans text-[13px] text-txt-2 underline-offset-4 transition hover:text-acc hover:underline">
          Talk to a working architect →
        </button>
      </footer>
    </main>
  );
}
