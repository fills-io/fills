"use client";

/**
 * Step 1 — Space.
 *
 * Asks:
 *   1. Industry / project type — a broad grid, or "Other" with free text.
 *   2. The specific space(s) inside it — pick up to 3 (e.g. Bedroom + Living
 *      room) so a project that spans a few rooms is covered in one brief.
 *
 * Optional extras (size, free-text description) live behind an "Add details"
 * toggle so the default flow stays fast.
 *
 * No AI calls. No Pinterest. Purely a curated picker over `INDUSTRIES`.
 */

import { useState } from "react";
import {
  INDUSTRIES,
  type SpaceOption,
  getIndustry,
} from "@/lib/space-taxonomy";
import type { WizardState } from "@/lib/wizard-state";

type Props = {
  state: WizardState;
  setState: (patch: Partial<WizardState>) => void;
};

const MAX_SPACES = 3;

const SIZES: { id: NonNullable<WizardState["spaceSize"]>; label: string; hint: string }[] = [
  { id: "small", label: "Small", hint: "Under 20 m² · cosy" },
  { id: "medium", label: "Medium", hint: "20–50 m²" },
  { id: "large", label: "Large", hint: "50–120 m²" },
  { id: "xl", label: "Extra large", hint: "Over 120 m²" },
];

export default function SpaceStep({ state, setState }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const selectedIndustry = state.industryId ? getIndustry(state.industryId) : null;
  const isOther = !!selectedIndustry?.freeform;

  const selectedSpaceIds =
    state.spaceIds ?? (state.spaceId ? [state.spaceId] : []);
  const atMax = selectedSpaceIds.length >= MAX_SPACES;

  function selectIndustry(id: WizardState["industryId"]) {
    if (id === state.industryId) return;
    // Reset the space selection when the industry changes.
    setState({ industryId: id, spaceIds: [], spaceId: undefined });
  }

  function toggleSpace(id: string) {
    const has = selectedSpaceIds.includes(id);
    const next = has
      ? selectedSpaceIds.filter((x) => x !== id)
      : atMax
        ? selectedSpaceIds
        : [...selectedSpaceIds, id];
    setState({ spaceIds: next, spaceId: next[0] });
  }

  const hasSpaceSelection = isOther
    ? !!state.customIndustry?.trim()
    : selectedSpaceIds.length > 0;

  return (
    <div className="space-y-12">
      {/* ── Industry picker ───────────────────────────────────────────── */}
      <section>
        <h2 className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
          01 · Project type
        </h2>
        <p className="text-[14px] text-txt-2">What kind of project is this?</p>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {INDUSTRIES.map((ind) => {
            const isSelected = state.industryId === ind.id;
            const meta = ind.freeform
              ? "your own brief"
              : ind.spaces
                  .slice(0, 3)
                  .map((s) => s.id.split("-")[0])
                  .join(" · ");
            return (
              <button
                key={ind.id}
                onClick={() => selectIndustry(ind.id)}
                className={`group flex flex-col items-start gap-1 border px-4 py-3 text-left transition ${
                  isSelected
                    ? "border-acc bg-[rgba(200,81,42,0.1)]"
                    : "border-bdr-2 bg-bg-2 hover:border-acc"
                }`}
              >
                <span className="text-[13px] font-medium text-txt">
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

      {/* ── "Other" free-text project type ────────────────────────────── */}
      {selectedIndustry && isOther && (
        <section>
          <h2 className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
            02 · Your project
          </h2>
          <p className="text-[14px] text-txt-2">
            Tell us what you&apos;re designing so we can shape the plan around it.
          </p>
          <input
            type="text"
            // Sent as both `industry` and `space`, each capped at 80 by the API.
            maxLength={80}
            value={state.customIndustry ?? ""}
            onChange={(e) => setState({ customIndustry: e.target.value })}
            placeholder="e.g. Private aviation lounge, art studio, co-living space…"
            className="mt-5 block w-full border border-bdr-2 bg-bg-2 p-3 text-[14px] text-txt placeholder:text-txt-3 focus:border-acc focus:outline-none"
          />
        </section>
      )}

      {/* ── Space multi-picker (fixed-taxonomy industries) ────────────── */}
      {selectedIndustry && !isOther && (
        <section>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
              02 · Specific space
            </h2>
            <span
              className={`font-mono text-[10px] tracking-[0.1em] ${
                atMax ? "text-acc" : "text-txt-3"
              }`}
            >
              {selectedSpaceIds.length} / {MAX_SPACES}
            </span>
          </div>
          <p className="text-[14px] text-txt-2">
            Pick up to {MAX_SPACES}: combine rooms if the project spans a few.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {selectedIndustry.spaces.map((space) => {
              const isSelected = selectedSpaceIds.includes(space.id);
              return (
                <SpaceCard
                  key={space.id}
                  space={space}
                  isSelected={isSelected}
                  disabled={!isSelected && atMax}
                  onSelect={() => toggleSpace(space.id)}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* ── Optional details (size + description) ─────────────────────── */}
      {hasSpaceSelection && (
        <section>
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-txt-3 transition hover:text-acc"
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
                            : "border-bdr-2 text-txt hover:border-txt-2"
                        }`}
                      >
                        <span className="text-[14px] font-medium">{s.label}</span>
                        <span className="mt-0.5 text-[11px] text-txt-3">
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
                  // The API caps `spaceDescription` at 800. The placeholder invites a long answer, so cap it here rather than rejecting it after the wait.
                  maxLength={800}
                  value={state.spaceDescription ?? ""}
                  onChange={(e) => setState({ spaceDescription: e.target.value })}
                  placeholder="e.g. North-facing, double-height ceiling, opens onto a small terrace. Client wants warm but not heavy."
                  rows={4}
                  className="mt-3 block w-full resize-none border border-bdr-2 bg-bg-2 p-3 text-[14px] text-txt placeholder:text-txt-3 focus:border-acc focus:outline-none"
                />
                <p className="mt-2 text-[11px] text-txt-3">
                  Anything the AI should know: orientation, materials already in
                  place, what&apos;s not working, who uses it.
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
  disabled,
  onSelect,
}: {
  space: SpaceOption;
  isSelected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`flex items-start justify-between gap-3 border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${
        isSelected
          ? "border-acc bg-[rgba(200,81,42,0.08)]"
          : "border-bdr-2 hover:border-txt-2"
      }`}
    >
      <span className="flex flex-col items-start">
        <span
          className={`text-[15px] font-medium ${
            isSelected ? "text-acc" : "text-txt"
          }`}
        >
          {space.label}
        </span>
        <span className="mt-1 text-[12px] text-txt-3">{space.hint}</span>
      </span>
      <span
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center border transition ${
          isSelected
            ? "border-acc bg-acc text-white"
            : "border-bdr-2 text-transparent"
        }`}
        aria-hidden
      >
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 7l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}
