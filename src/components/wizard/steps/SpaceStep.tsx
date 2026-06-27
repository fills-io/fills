"use client";

/**
 * Step 1 — Space.
 *
 * Asks two things:
 *   1. Industry (locked if the homepage Quick form already provided one,
 *      otherwise the user picks from the 6 industries).
 *   2. Specific space within that industry (e.g. "Bedroom" inside Residential).
 *
 * Optional extras (size, free-text description) are available behind a
 * "Add details" toggle so the default flow stays a single click per choice.
 *
 * No AI calls. No Pinterest. Purely a curated picker over `INDUSTRIES`.
 */

import { useState } from "react";
import {
  INDUSTRIES,
  type IndustryId,
  type SpaceOption,
  getIndustry,
} from "@/lib/space-taxonomy";
import type { WizardState } from "@/lib/wizard-state";

type Props = {
  state: WizardState;
  setState: (patch: Partial<WizardState>) => void;
};

const SIZES: { id: NonNullable<WizardState["spaceSize"]>; label: string; hint: string }[] = [
  { id: "small", label: "Small", hint: "Under 20 m² · cosy" },
  { id: "medium", label: "Medium", hint: "20–50 m²" },
  { id: "large", label: "Large", hint: "50–120 m²" },
  { id: "xl", label: "Extra large", hint: "Over 120 m²" },
];

export default function SpaceStep({ state, setState }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const selectedIndustry = state.industryId ? getIndustry(state.industryId) : null;

  return (
    <div className="space-y-12">
      {/* ── Industry picker ───────────────────────────────────────────── */}
      <section>
        <h2 className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
          01 · Industry
        </h2>
        <p className="text-[14px] text-hero-cream-2">
          What kind of project is this?
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {INDUSTRIES.map((ind) => {
            const isSelected = state.industryId === ind.id;
            // v40-style meta: first 3 spaces, root segment, joined by " · "
            const meta = ind.spaces
              .slice(0, 3)
              .map((s) => s.id.split("-")[0])
              .join(" · ");
            return (
              <button
                key={ind.id}
                onClick={() => {
                  setState({
                    industryId: ind.id,
                    spaceId:
                      ind.id === state.industryId ? state.spaceId : undefined,
                  });
                }}
                className={`group flex flex-col items-start gap-1 border bg-bg-2 p-[14px_16px] text-left transition ${
                  isSelected
                    ? "border-acc bg-[rgba(200,81,42,0.1)]"
                    : "border-bdr-2 hover:border-acc"
                }`}
              >
                <span
                  className={`text-[13px] font-medium ${
                    isSelected ? "text-txt" : "text-txt"
                  }`}
                >
                  {ind.label}
                </span>
                <span
                  className={`font-mono text-[9px] uppercase tracking-[0.08em] ${
                    isSelected ? "text-acc" : "text-txt-3"
                  }`}
                >
                  {meta}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Space picker (only after industry chosen) ─────────────────── */}
      {selectedIndustry && (
        <section>
          <h2 className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
            02 · Specific space
          </h2>
          <p className="text-[14px] text-hero-cream-2">
            What exactly are we designing inside that {selectedIndustry.label.toLowerCase()}?
          </p>

          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {selectedIndustry.spaces.map((space) => (
              <SpaceCard
                key={space.id}
                space={space}
                isSelected={state.spaceId === space.id}
                onSelect={() => setState({ spaceId: space.id })}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Optional details (size + description) ─────────────────────── */}
      {state.spaceId && (
        <section>
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-hero-dim transition hover:text-acc"
          >
            {showDetails ? "− Hide details" : "+ Add details (optional)"}
          </button>

          {showDetails && (
            <div className="mt-6 space-y-8">
              {/* Size */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
                  Size
                </label>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {SIZES.map((s) => {
                    const isSelected = state.spaceSize === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() =>
                          setState({
                            spaceSize: isSelected ? undefined : s.id,
                          })
                        }
                        className={`flex flex-col items-start border p-3 text-left transition ${
                          isSelected
                            ? "border-acc bg-[rgba(200,81,42,0.08)] text-acc"
                            : "border-dark-3 text-hero-cream hover:border-hero-cream-2"
                        }`}
                      >
                        <span className="text-[14px] font-medium">{s.label}</span>
                        <span className="mt-0.5 text-[11px] text-hero-dim">
                          {s.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="space-description"
                  className="font-mono text-[10px] uppercase tracking-[0.18em] text-acc"
                >
                  Describe the space
                </label>
                <textarea
                  id="space-description"
                  value={state.spaceDescription ?? ""}
                  onChange={(e) =>
                    setState({ spaceDescription: e.target.value })
                  }
                  placeholder="e.g. North-facing, double-height ceiling, opens onto a small terrace. Client wants warm but not heavy."
                  rows={4}
                  className="mt-3 block w-full resize-none border border-dark-3 bg-[rgba(34,30,24,0.6)] p-3 text-[14px] text-hero-cream placeholder:text-hero-dim focus:border-acc focus:outline-none"
                />
                <p className="mt-2 text-[11px] text-hero-dim">
                  Anything the AI should know — orientation, materials already
                  in place, what's not working, who uses it.
                </p>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

/* ─── Sub-components ───────────────────────────────────────────────────── */

function SpaceCard({
  space,
  isSelected,
  onSelect,
}: {
  space: SpaceOption;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex flex-col items-start border p-4 text-left transition ${
        isSelected
          ? "border-acc bg-[rgba(200,81,42,0.08)]"
          : "border-dark-3 hover:border-hero-cream-2"
      }`}
    >
      <span
        className={`text-[15px] font-medium ${
          isSelected ? "text-acc" : "text-hero-cream"
        }`}
      >
        {space.label}
      </span>
      <span className="mt-1 text-[12px] text-hero-dim">{space.hint}</span>
    </button>
  );
}
