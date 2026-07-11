"use client";

/**
 * Stage 2 — Vibe & style. A search bar (with a free-search budget that nudges
 * toward sign-up), keyword suggestion chips, and a masonry grid of curated
 * references. Pick 3–5. The picks feed the palette + the AI's design read.
 */

import { useMemo, useState } from "react";
import { getIndustry, VIBE_BY_IND } from "@/lib/concept-taxonomy";
import { findIndustryByLabel } from "@/lib/space-taxonomy";
import {
  CURATED_PINS,
  CURATED_VIBE,
  type CuratedPin,
} from "@/data/reference-images";
import type { QuickState } from "@/lib/quick-state";

type Props = {
  state: QuickState;
  patch: (p: Partial<QuickState>) => void;
};

const MAX_SEARCHES = 6;
const MAX_PICKS = 5;
const SHOWN = 24;

function filterPool(pool: CuratedPin[], query: string): CuratedPin[] {
  const q = query.trim().toLowerCase();
  if (!q) return pool;
  const toks = q.split(/\s+/);
  const m = pool.filter((p) => {
    const hay = (p.style + " " + (p.title || "")).toLowerCase();
    return toks.some((t) => hay.includes(t));
  });
  return m.length ? m : pool;
}

export default function VibeStage({ state, patch }: Props) {
  const ind = getIndustry(state.industryId);

  const pool = useMemo(() => {
    const spaceId = ind ? findIndustryByLabel(ind.label)?.id : null;
    return (spaceId && CURATED_VIBE[spaceId]) || CURATED_PINS.vibe;
  }, [ind]);

  const keywords = state.industryId
    ? VIBE_BY_IND[state.industryId] ?? []
    : [];

  const [query, setQuery] = useState("");
  const [searchCount, setSearchCount] = useState(0);
  const [lastSearched, setLastSearched] = useState(state.vibeQuery || "");
  const [results, setResults] = useState<CuratedPin[]>(() =>
    filterPool(pool, state.vibeQuery || "").slice(0, SHOWN),
  );

  const searchLocked = searchCount >= MAX_SEARCHES;
  const picks = state.picks;

  function runSearch(term: string) {
    const q = term.trim();
    if (!q || searchLocked) return;
    setResults(filterPool(pool, q).slice(0, SHOWN));
    setSearchCount((c) => c + 1);
    setLastSearched(q);
  }

  function togglePick(pin: CuratedPin) {
    const has = picks.some((p) => p.id === pin.id);
    const next = has
      ? picks.filter((p) => p.id !== pin.id)
      : picks.length >= MAX_PICKS
        ? picks
        : [...picks, pin];
    patch({
      picks: next,
      vibeQuery: next.length
        ? lastSearched || next[0].style || state.vibeQuery
        : state.vibeQuery,
    });
  }

  return (
    <section className="border-t border-bdr pt-10">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
        02 · Vibe &amp; style
      </div>
      <h2 className="font-serif text-[clamp(24px,3vw,36px)] font-normal leading-[1.1] tracking-tight text-txt">
        What direction speaks to you?
      </h2>
      <p className="mt-3 max-w-xl font-serif text-[16px] italic leading-relaxed text-txt-2">
        Search by keyword or browse the suggestions. Pick 3 to 5 images that
        capture the direction — each pick gives the AI more signal.
      </p>

      {/* Search */}
      <div className="mt-6 flex flex-wrap items-stretch gap-3">
        <div
          className={`flex flex-1 items-center border border-bdr bg-bg-2 focus-within:border-acc ${
            searchLocked ? "opacity-60" : ""
          }`}
        >
          <span className="pl-4 text-txt-3" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") runSearch(query);
            }}
            disabled={searchLocked}
            placeholder={
              searchLocked
                ? "Search limit reached — pick from what you found."
                : `Try "moody hotel lounge", "warm minimal cafe"…`
            }
            className="min-w-0 flex-1 bg-transparent px-3.5 py-3.5 text-[14px] text-txt outline-none placeholder:italic placeholder:text-txt-3 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={() => runSearch(query)}
            disabled={searchLocked || !query.trim()}
            aria-label="Search"
            className="grid h-full min-h-[48px] w-12 place-items-center border-l border-bdr text-txt-2 transition hover:bg-acc hover:text-white disabled:cursor-not-allowed disabled:text-txt-3 disabled:hover:bg-transparent"
          >
            →
          </button>
        </div>
        <div className="flex items-center gap-2 border border-bdr bg-bg-2 px-4 font-mono text-[10.5px] uppercase tracking-[0.14em] text-txt-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              searchLocked
                ? "bg-txt-3"
                : searchCount >= MAX_SEARCHES - 2
                  ? "bg-acc"
                  : "bg-green-500"
            }`}
          />
          {searchLocked ? (
            "Limit reached"
          ) : (
            <>
              <b className="font-medium text-acc">{searchCount}</b> /{" "}
              {MAX_SEARCHES} searches
            </>
          )}
        </div>
      </div>

      {/* Keyword suggestions */}
      {!searchLocked && keywords.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
            Try
          </span>
          {keywords.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setQuery(k);
                runSearch(k);
              }}
              className="border border-bdr px-3 py-1.5 text-[12.5px] text-txt-2 transition hover:border-acc hover:bg-[rgba(200,81,42,0.06)] hover:text-acc"
            >
              {k}
            </button>
          ))}
        </div>
      )}

      {searchLocked && (
        <div className="mt-4 flex items-start gap-3 border border-acc/30 border-l-2 border-l-acc bg-[rgba(200,81,42,0.06)] p-4 text-[13px] italic leading-relaxed text-txt-2">
          <span className="font-mono text-[9px] not-italic uppercase tracking-[0.14em] text-acc">
            Limit
          </span>
          <span>
            You&apos;ve used your free searches. Pick from what you&apos;ve
            found — sign up later to keep exploring with unlimited searches.
          </span>
        </div>
      )}

      {/* Masonry grid */}
      <div className="mt-6 columns-2 gap-3 sm:columns-3 lg:columns-4">
        {results.map((p, i) => {
          const sel = picks.some((x) => x.id === p.id);
          return (
            <button
              key={p.id || i}
              type="button"
              onClick={() => togglePick(p)}
              className={`group relative mb-3 block w-full break-inside-avoid overflow-hidden border transition ${
                sel
                  ? "border-[1.5px] border-acc"
                  : "border-bdr hover:-translate-y-1"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.imageUrl.replace("/736x/", "/474x/")}
                alt={p.title || ""}
                loading="lazy"
                className="w-full object-cover"
              />
              <span
                className={`pointer-events-none absolute right-2 top-2 grid h-6 w-6 place-items-center bg-acc text-[13px] font-semibold text-white transition ${
                  sel ? "scale-100 opacity-100" : "scale-50 opacity-0"
                }`}
              >
                ✓
              </span>
            </button>
          );
        })}
      </div>

      {/* Pick status */}
      {picks.length > 0 && (
        <div className="flex items-center justify-between border border-bdr bg-bg-2 px-4 py-3">
          <div className="text-[13.5px] text-txt-2">
            Your picks{" "}
            <b className="font-semibold text-acc">
              {picks.length}/{MAX_PICKS}
            </b>
            {picks.length < 3 && (
              <span className="ml-2 text-txt-3">(pick at least 3)</span>
            )}
          </div>
          <div className="flex gap-1">
            {picks.map((p, i) => (
              <div
                key={p.id || i}
                className="h-8 w-8 overflow-hidden border border-bdr"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageUrl.replace("/736x/", "/236x/")}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
