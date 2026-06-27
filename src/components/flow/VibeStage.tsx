"use client";

/**
 * Stage 2 — Vibe & style. Pick 3–5 reference images that capture the
 * direction. Masonry grid of placeholder scenes (real Pinterest later),
 * a search bar with a 6-search budget, and keyword suggestion chips.
 */

import { useMemo, useState } from "react";
import { PICKS } from "@/lib/quickflow-data";
import PlaceholderScene from "./PlaceholderScene";
import type { FlowState } from "./FlowApp";

const MAX_PICKS = 5;
const MIN_PICKS = 3;
const SEARCH_BUDGET = 6;

const RATIO_CLASS: Record<string, string> = {
  tall: "aspect-[3/5]",
  normal: "aspect-[4/5]",
  short: "aspect-[5/4]",
};

export default function VibeStage({
  state,
  patch,
}: {
  state: FlowState;
  patch: (p: Partial<FlowState>) => void;
}) {
  const [query, setQuery] = useState("");
  const [searches, setSearches] = useState(0);
  const [seed, setSeed] = useState(0);

  // Faked search: reshuffles the placeholder picks (real search later).
  const grid = useMemo(() => {
    const arr = [...PICKS];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = (i * 7 + seed * 13 + 3) % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [seed]);

  const picked = state.picks;
  const ready = picked.length >= MIN_PICKS;
  const searchesLeft = SEARCH_BUDGET - searches;

  function toggle(id: string, label: string) {
    if (picked.includes(id)) {
      patch({ picks: picked.filter((p) => p !== id) });
    } else if (picked.length < MAX_PICKS) {
      // first pick seeds the vibe if not already set
      const next = [...picked, id];
      patch({ picks: next, vibe: state.vibe || label });
    }
  }

  function runSearch() {
    if (searchesLeft <= 0) return;
    setSearches((s) => s + 1);
    setSeed((s) => s + 1);
  }

  return (
    <section>
      <div className="mb-2 flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-txt-3">
        <span className="inline-block h-px w-4 bg-txt-3" />
        02 · Vibe &amp; style
      </div>
      <h2 className="mb-2 font-serif text-[clamp(26px,3.4vw,38px)] font-normal leading-[1.1] tracking-tight text-txt">
        What design direction <em className="italic text-acc">speaks to you</em>?
      </h2>
      <p className="mb-6 max-w-[560px] text-[14px] leading-relaxed text-txt-2">
        Search by keyword or browse the suggestions. Pick {MIN_PICKS} to{" "}
        {MAX_PICKS} images that capture the direction.
      </p>

      {/* Search bar */}
      <div className="mb-3 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch()}
          placeholder="Search a direction, e.g. warm minimalism or moody lounge…"
          disabled={searchesLeft <= 0}
          className="flex-1 border border-bdr-2 bg-bg-2 px-4 py-3 text-[14px] text-txt outline-none placeholder:text-txt-3 focus:border-acc disabled:opacity-50"
        />
        <button
          onClick={runSearch}
          disabled={searchesLeft <= 0}
          className="border border-acc bg-acc px-5 text-[12px] font-medium uppercase tracking-[0.08em] text-white transition hover:bg-acc-h disabled:cursor-not-allowed disabled:opacity-50"
        >
          Search
        </button>
      </div>
      <div className="mb-6 flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-txt-3">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            searchesLeft === 0 ? "bg-rose-500" : searchesLeft <= 2 ? "bg-amber-500" : "bg-acc"
          }`}
        />
        {searchesLeft} / {SEARCH_BUDGET} searches
        {searchesLeft === 0 && <span className="text-rose-400"> · limit reached</span>}
      </div>

      {/* Masonry grid */}
      <div className="[column-fill:_balance] columns-2 gap-3 sm:columns-3 lg:columns-4">
        {grid.map((p) => {
          const isPicked = picked.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id, p.label)}
              className="group relative mb-3 block w-full break-inside-avoid transition-transform duration-200 active:scale-[0.97]"
            >
              <PlaceholderScene
                label={p.label}
                pattern={p.pattern}
                className={`${RATIO_CLASS[p.ratio]} w-full transition duration-200 ${
                  isPicked
                    ? "scale-[1.02] ring-2 ring-acc"
                    : "group-hover:border-acc"
                }`}
              />
              {isPicked && (
                <>
                  <span className="absolute -left-[3px] -top-[3px] h-3 w-3 border-l-2 border-t-2 border-acc" />
                  <span className="absolute -right-[3px] -top-[3px] h-3 w-3 border-r-2 border-t-2 border-acc" />
                  <span className="absolute -bottom-[3px] -left-[3px] h-3 w-3 border-b-2 border-l-2 border-acc" />
                  <span className="absolute -bottom-[3px] -right-[3px] h-3 w-3 border-b-2 border-r-2 border-acc" />
                  <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-acc text-[11px] text-white">
                    ✓
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer status */}
      <div className="mt-7 border-t border-bdr-2 pt-5">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-txt-3">
          Your picks · {picked.length} / {MAX_PICKS}
          {!ready && (
            <span className="text-acc">
              {" "}
              · pick {MIN_PICKS - picked.length} more to continue
            </span>
          )}
        </span>
      </div>
    </section>
  );
}
