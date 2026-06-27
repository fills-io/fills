"use client";

/**
 * Stage 2 — Vibe & style. Pick 3–5 reference images that capture the
 * direction. Real Pinterest results via /api/pinterest/search (24h cached),
 * rendered as a masonry grid. The initial search is seeded from the user's
 * homepage inputs (vibe / spec); they can refine with their own keywords.
 *
 * Selected pins are stored in state.picks as image URLs (keeps the FlowState
 * shape a simple string[] while making the references real downstream).
 */

import { useCallback, useEffect, useState } from "react";
import type { FlowState } from "./FlowApp";
import type { PinterestPin } from "@/db/schema";

const MAX_PICKS = 5;
const MIN_PICKS = 3;
const SEARCH_BUDGET = 10;

function seedQueryFrom(state: FlowState): string {
  const parts = [state.vibe, state.spec].map((s) => s?.trim()).filter(Boolean);
  return (parts.join(" ") || "interior design mood board").slice(0, 120);
}

export default function VibeStage({
  state,
  patch,
}: {
  state: FlowState;
  patch: (p: Partial<FlowState>) => void;
}) {
  const seed = seedQueryFrom(state);
  const [query, setQuery] = useState(seed);
  const [submitted, setSubmitted] = useState(seed);
  const [pins, setPins] = useState<PinterestPin[]>([]);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [searches, setSearches] = useState(0);

  const picked = state.picks;
  const ready = picked.length >= MIN_PICKS;
  const searchesLeft = SEARCH_BUDGET - searches;

  const fetchPins = useCallback(async (q: string) => {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch(
        `/api/pinterest/search?q=${encodeURIComponent(q)}&limit=24`,
      );
      const data = (await res.json()) as
        | { query: string; count: number; pins: PinterestPin[] }
        | { ok: false; error: string };

      if ("ok" in data && data.ok === false) throw new Error(data.error);
      if (!("pins" in data)) throw new Error("Unexpected response from search");

      setPins(data.pins.filter((p) => p.imageUrl));
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  // Initial (seeded) search on mount, and whenever a new query is submitted.
  // The seeded mount search does not count against the budget.
  useEffect(() => {
    if (submitted.trim()) fetchPins(submitted);
  }, [submitted, fetchPins]);

  function runSearch() {
    const q = query.trim();
    if (!q || q === submitted || searchesLeft <= 0) return;
    setSearches((s) => s + 1);
    setSubmitted(q);
  }

  function toggle(pin: PinterestPin) {
    const url = pin.imageUrl;
    if (picked.includes(url)) {
      patch({ picks: picked.filter((u) => u !== url) });
    } else if (picked.length < MAX_PICKS) {
      patch({ picks: [...picked, url], vibe: state.vibe || submitted });
    }
  }

  const atMax = picked.length >= MAX_PICKS;

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
        Search by keyword or browse what we pulled for your project. Pick{" "}
        {MIN_PICKS} to {MAX_PICKS} images that capture the direction.
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
          disabled={searchesLeft <= 0 || status === "loading"}
          className="border border-acc bg-acc px-5 text-[12px] font-medium uppercase tracking-[0.08em] text-white transition hover:bg-acc-h disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "loading" ? "…" : "Search"}
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

      {/* Error */}
      {status === "error" && (
        <div className="mb-6 border border-rose-500/40 bg-rose-500/5 p-5 text-[13px] text-txt-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-rose-400">
            Search failed
          </p>
          <p className="mt-2">{error}</p>
          <button
            onClick={() => fetchPins(submitted)}
            className="mt-3 text-[12px] text-acc underline underline-offset-2 hover:text-acc-h"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {status === "loading" && pins.length === 0 && (
        <div className="[column-fill:_balance] columns-2 gap-3 sm:columns-3 lg:columns-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={`mb-3 w-full animate-pulse break-inside-avoid border border-bdr-2 bg-bg-2 ${
                i % 3 === 0 ? "aspect-[3/5]" : i % 3 === 1 ? "aspect-[4/5]" : "aspect-[5/4]"
              }`}
            />
          ))}
        </div>
      )}

      {/* Empty */}
      {status === "idle" && pins.length === 0 && (
        <p className="border border-bdr-2 bg-bg-2 p-6 text-center text-[13px] text-txt-2">
          Nothing came back for &ldquo;{submitted}&rdquo;. Try a shorter, more
          descriptive phrase.
        </p>
      )}

      {/* Masonry grid of real pins */}
      {pins.length > 0 && (
        <div className="[column-fill:_balance] columns-2 gap-3 sm:columns-3 lg:columns-4">
          {pins.map((pin) => {
            const isPicked = picked.includes(pin.imageUrl);
            const blocked = !isPicked && atMax;
            return (
              <button
                key={pin.id || pin.imageUrl}
                type="button"
                onClick={() => toggle(pin)}
                disabled={blocked}
                className="group relative mb-3 block w-full break-inside-avoid overflow-hidden transition-transform duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pin.imageUrl}
                  alt={pin.altText || pin.title || "Design reference"}
                  loading="lazy"
                  className={`w-full transition duration-200 ${
                    isPicked ? "scale-[1.02] ring-2 ring-acc" : "group-hover:opacity-90"
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
      )}

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
          {atMax && <span className="text-acc"> · tap a pick to swap</span>}
        </span>
      </div>
    </section>
  );
}
