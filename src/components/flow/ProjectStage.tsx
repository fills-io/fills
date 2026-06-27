"use client";

/**
 * Stage 1 — Project. The editorial fill-in-the-blank: "I'm working on a
 * [industry] project, a [spec] that feels like [vibe]." Prefilled from the
 * homepage builder; editable here. Suggestion chips per industry.
 */

import { useState } from "react";
import {
  INDUSTRIES,
  getSpecSuggestions,
  getVibeSuggestions,
} from "@/lib/concept-taxonomy";
import type { FlowState } from "./FlowApp";

type Props = {
  state: FlowState;
  patch: (p: Partial<FlowState>) => void;
};

export default function ProjectStage({ state, patch }: Props) {
  const [ddOpen, setDdOpen] = useState(false);
  const matched = INDUSTRIES.find((i) => i.label === state.industry);
  const specChips = getSpecSuggestions(matched?.id ?? null);
  const vibeChips = getVibeSuggestions(matched?.id ?? null, state.spec);

  return (
    <section>
      <div className="mb-2 flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-txt-3">
        <span className="inline-block h-px w-4 bg-txt-3" />
        01 · Project
      </div>
      <h2 className="mb-7 font-serif text-[clamp(26px,3.4vw,38px)] font-normal leading-[1.1] tracking-tight text-txt">
        What are you <em className="italic text-acc">designing</em>?
      </h2>

      {/* Madlib */}
      <div className="font-serif text-[clamp(19px,2.2vw,25px)] leading-[1.9] text-txt-3">
        <span>I&apos;m working on a </span>
        <span className="relative inline-block">
          <button
            type="button"
            onClick={() => setDdOpen(!ddOpen)}
            className={`inline-flex items-baseline gap-2 rounded-[3px] px-3 py-0.5 italic transition ${
              state.industry
                ? "bg-[rgba(200,81,42,0.12)] text-acc"
                : "border border-dashed border-bdr-2 text-txt-3 hover:border-acc hover:text-acc"
            }`}
          >
            {state.industry || "choose industry"}
            <span className={`text-[10px] not-italic ${ddOpen ? "rotate-180" : ""}`}>▾</span>
          </button>
          {ddOpen && (
            <div className="absolute left-0 top-[calc(100%+6px)] z-50 max-h-[320px] min-w-[240px] overflow-y-auto border border-bdr bg-bg p-1.5 text-left shadow-[0_24px_64px_-8px_rgba(80,55,35,0.22)]">
              {INDUSTRIES.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => {
                    patch({ industry: i.label });
                    setDdOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left font-sans text-[13px] not-italic text-txt transition hover:bg-bg-3"
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
        <span> project, a </span>
        <input
          value={state.spec}
          onChange={(e) => patch({ spec: e.target.value })}
          placeholder="specifically…"
          className="w-[220px] border-b border-dashed border-bdr-2 bg-transparent px-2 text-center font-serif italic text-txt outline-none placeholder:text-txt-3 placeholder:opacity-70 focus:border-acc"
        />
        <span> that feels like </span>
        <input
          value={state.vibe}
          onChange={(e) => patch({ vibe: e.target.value })}
          placeholder="vibe…"
          className="w-[180px] border-b border-dashed border-bdr-2 bg-transparent px-2 text-center font-serif italic text-txt outline-none placeholder:text-txt-3 placeholder:opacity-70 focus:border-acc"
        />
        <span>.</span>
      </div>

      {/* Suggestion chips */}
      {matched && (
        <div className="mt-7 space-y-4 border-t border-bdr-2 pt-5">
          <ChipRow
            label="Specifically"
            chips={specChips}
            active={state.spec}
            onPick={(v) => patch({ spec: v })}
          />
          {state.spec.trim().length >= 3 && (
            <ChipRow
              label="Vibe"
              chips={vibeChips}
              active={state.vibe}
              onPick={(v) => patch({ vibe: v })}
            />
          )}
        </div>
      )}
    </section>
  );
}

function ChipRow({
  label,
  chips,
  active,
  onPick,
}: {
  label: string;
  chips: string[];
  active: string;
  onPick: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-txt-3">
        <b className="font-medium text-txt-2">{label}</b> suggestions
      </span>
      {chips.map((c, i) => {
        const isActive = active.trim().toLowerCase() === c.toLowerCase();
        return (
          <button
            key={`${c}-${i}`}
            type="button"
            onClick={() => onPick(c)}
            className={`rounded-full border px-[11px] py-[5px] font-sans text-[11.5px] transition active:scale-95 ${
              isActive
                ? "border-acc bg-[rgba(200,81,42,0.18)] text-acc"
                : "border-bdr-2 text-txt-2 hover:border-acc hover:text-acc"
            }`}
          >
            {c}
          </button>
        );
      })}
    </div>
  );
}
