"use client";

/**
 * Stage 1 — Setup. The madlib sentence, editable inline:
 *   "I'm working on a [industry ▾] project, a [specifically…] that feels like [vibe]."
 * Industry + a real spec unlock the Vibe stage.
 */

import { useEffect, useRef, useState } from "react";
import {
  INDUSTRIES,
  getIndustry,
  getSpecSuggestions,
} from "@/lib/concept-taxonomy";
import type { QuickState } from "@/lib/quick-state";

type Props = {
  state: QuickState;
  patch: (p: Partial<QuickState>) => void;
};

export default function SetupStage({ state, patch }: Props) {
  const [ddOpen, setDdOpen] = useState(false);
  const [specInput, setSpecInput] = useState(state.spec);
  const ddRef = useRef<HTMLSpanElement>(null);

  const ind = getIndustry(state.industryId);
  const specs = getSpecSuggestions(state.industryId);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) {
        setDdOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pickSpec(s: string) {
    patch({ spec: s });
    setSpecInput(s);
  }
  function commitInput() {
    const v = specInput.trim();
    if (v.length >= 2) patch({ spec: v });
  }

  const chipBase =
    "mx-1 inline-flex items-baseline gap-2 rounded-[3px] px-3.5 py-0.5 align-baseline italic transition";

  return (
    <section className="pt-2">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
        01 · Project
      </div>

      <p className="font-serif text-[clamp(22px,3vw,34px)] font-normal leading-[1.65] tracking-tight text-txt-2">
        <span className={state.industryId ? "text-txt" : ""}>
          I&apos;m working on a{" "}
        </span>

        {/* Industry dropdown */}
        <span className="relative inline-block align-baseline" ref={ddRef}>
          <button
            type="button"
            onClick={() => setDdOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={ddOpen}
            className={`${chipBase} ${
              ind
                ? "bg-[rgba(200,81,42,0.12)] text-acc"
                : "border border-dashed border-bdr-2 text-txt-3 hover:border-acc hover:text-acc"
            }`}
          >
            <span className="not-italic">{ind ? ind.label : "choose industry"}</span>
            <span className={`text-[11px] not-italic transition ${ddOpen ? "rotate-180" : ""}`}>
              ▾
            </span>
          </button>

          {ddOpen && (
            <div
              role="listbox"
              className="absolute left-0 top-[calc(100%+8px)] z-50 max-h-[340px] min-w-[260px] overflow-y-auto border border-bdr bg-bg p-1.5 text-left shadow-[0_24px_64px_-8px_rgba(80,55,35,0.28)]"
            >
              {INDUSTRIES.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => {
                    // Changing industry invalidates everything downstream —
                    // reset picks + palette so the old industry can't leak in.
                    //
                    // EXCEPT a palette the user supplied themselves. Upload
                    // mode reads colours out of their own photos and arrives
                    // with them locked; those aren't derived from the industry,
                    // so wiping them here threw away the entire point of
                    // uploading before the user ever reached the palette step.
                    const userSupplied = state.locks.some(Boolean);
                    patch({
                      industryId: i.id,
                      spec: "",
                      picks: [],
                      vibeQuery: "",
                      ...(userSupplied
                        ? {}
                        : { palette: [], paletteWeights: [], locks: [] }),
                    });
                    setSpecInput("");
                    setDdOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left font-sans text-[13px] not-italic transition hover:bg-bg-3 ${
                    state.industryId === i.id ? "text-acc" : "text-txt"
                  }`}
                >
                  <span>{i.label}</span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-txt-3">
                    {i.meta}
                  </span>
                </button>
              ))}
            </div>
          )}
        </span>

        <span className={state.industryId ? "text-txt" : ""}> project, a </span>

        {/* Spec */}
        {state.spec ? (
          <button
            type="button"
            onClick={() => {
              patch({ spec: "" });
              setSpecInput("");
            }}
            className={`${chipBase} border border-solid border-acc bg-[rgba(200,81,42,0.12)] text-acc`}
          >
            <span className="not-italic">{state.spec}</span>
          </button>
        ) : (
          <input
            // The API caps `space` at 80 — without this the user only finds out at the final click.
            maxLength={80}
            value={specInput}
            onChange={(e) => setSpecInput(e.target.value)}
            onBlur={commitInput}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            placeholder="specifically…"
            disabled={!state.industryId}
            className="mx-1 inline-block w-[190px] max-w-full border-b border-dashed border-acc/50 bg-[rgba(200,81,42,0.06)] px-2 py-0.5 align-baseline font-serif text-[0.85em] italic text-acc outline-none placeholder:text-txt-3 focus:border-acc disabled:cursor-not-allowed disabled:opacity-40"
          />
        )}

        <span> that feels like </span>

        {/* Vibe (filled from the Vibe stage) */}
        {state.vibeQuery ? (
          <span className="font-medium italic text-acc">{state.vibeQuery}</span>
        ) : (
          <span className="italic text-txt-3 opacity-60">vibe…</span>
        )}
        <span>.</span>
      </p>

      {/* Project facts — the numbers a designer needs first, and the basis for
          any later floor plan or 3D. Optional, never blocks the flow. */}
      {state.spec && (
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-bdr pt-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
            Project facts
          </span>

          <label className="flex items-center gap-2 text-[13px] text-txt-2">
            Roughly
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={state.areaSqm ?? ""}
              onChange={(e) =>
                patch({
                  areaSqm: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="—"
              className="w-20 border-b border-dashed border-bdr-2 bg-transparent px-1 py-0.5 text-center text-[13px] text-txt outline-none focus:border-acc"
            />
            m² of floor area
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-txt-2">
            <input
              type="checkbox"
              checked={!!state.hasOutdoor}
              onChange={(e) => patch({ hasOutdoor: e.target.checked })}
              className="h-3.5 w-3.5 accent-[var(--acc)]"
            />
            Includes outdoor space
          </label>

          <span className="text-[11px] text-txt-3">
            Optional, but it makes the brief far more useful.
          </span>
        </div>
      )}

      {/* Spec suggestions */}
      {state.industryId && !state.spec && specs.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
            Suggestions
          </span>
          {specs.slice(0, 10).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => pickSpec(s)}
              className="border border-bdr px-3 py-1.5 text-[12.5px] text-txt-2 transition hover:border-acc hover:bg-[rgba(200,81,42,0.06)] hover:text-acc"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
