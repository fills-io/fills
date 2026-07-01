"use client";

/**
 * Pinterest-driven pin picker — the reusable workhorse for every
 * Pinterest-backed wizard step (vibe, lighting, flooring, ceiling, materials).
 *
 * Lifecycle:
 *   1. The parent passes an `initialQuery` (often seeded from elsewhere — the
 *      homepage's vibe input, an AI suggestion, etc.) and how many pins the
 *      user is allowed to pick (`maxSelections`).
 *   2. We fetch /api/pinterest/search?q=... on mount and whenever the search
 *      input is submitted again. Results are cached server-side for 24h, so
 *      typing the same query twice is free.
 *   3. Selection state is owned by the parent (so wizard state survives
 *      step navigation). We only echo selection changes via `onSelectionChange`.
 *
 * Notes:
 *   - We use plain <img> tags rather than next/image to avoid configuring
 *     a remotePatterns entry for i.pinimg.com just yet. Easy to upgrade
 *     later if we want optimization.
 *   - Selection toggles: clicking a selected pin de-selects it. Clicking a
 *     new pin when we're already at the max is silently ignored (with a
 *     hint message visible to the user).
 */

import { useCallback, useEffect, useState } from "react";
import type { PinterestPin } from "@/db/schema";

/**
 * Context the parent passes so the AI suggestion endpoint can tailor
 * its proposals to the project. Optional — when absent, the suggestion
 * row simply doesn't appear (zero AI cost, zero UI clutter).
 */
export type SuggestionContext = {
  step: string;
  industry?: string;
  space?: string;
  priorContext?: string;
};

type Props = {
  /** Pre-filled search text. */
  initialQuery: string;
  /** Max pins the user can select. Picking past this is a no-op. */
  maxSelections: number;
  /** Currently-selected pins (owned by the wizard state). */
  selectedPins: PinterestPin[];
  /** Called whenever the selection changes (add or remove). */
  onSelectionChange: (pins: PinterestPin[]) => void;
  /** Optional copy under the search input ("Pick three that capture…"). */
  helperText?: string;
  /** When provided, AI-suggested alternative searches appear below the bar. */
  suggestionContext?: SuggestionContext;
};

export default function PinterestGrid({
  initialQuery,
  maxSelections,
  selectedPins,
  onSelectionChange,
  helperText,
  suggestionContext,
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [pins, setPins] = useState<PinterestPin[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  // Suggestion state — only meaningful when suggestionContext is set.
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionsStatus, setSuggestionsStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");

  const fetchPins = useCallback(async (q: string) => {
    setStatus("loading");
    setError(null);

    try {
      const response = await fetch(
        `/api/pinterest/search?q=${encodeURIComponent(q)}&limit=24`,
      );
      const data = (await response.json()) as
        | { query: string; count: number; pins: PinterestPin[] }
        | { ok: false; error: string };

      if ("ok" in data && data.ok === false) {
        throw new Error(data.error);
      }
      if (!("pins" in data)) {
        throw new Error("Unexpected response shape from Pinterest API");
      }

      setPins(data.pins);
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  // Fire the first search on mount (and whenever submittedQuery changes).
  useEffect(() => {
    if (submittedQuery.trim().length > 0) {
      fetchPins(submittedQuery);
    }
  }, [submittedQuery, fetchPins]);

  // Whenever a new query is submitted, also ask the AI for alternative
  // search suggestions tailored to the wizard context. Fire-and-forget;
  // failures hide the suggestion row silently rather than disrupting the
  // user's actual search.
  useEffect(() => {
    if (!suggestionContext || submittedQuery.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setSuggestionsStatus("loading");

    fetch("/api/ai/suggest-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentQuery: submittedQuery,
        step: suggestionContext.step,
        industry: suggestionContext.industry,
        space: suggestionContext.space,
        priorContext: suggestionContext.priorContext,
      }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as { suggestions?: string[] };
        if (cancelled) return;
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
        setSuggestionsStatus("idle");
      })
      .catch(() => {
        if (cancelled) return;
        // Don't surface AI errors — suggestions are a bonus, not core flow.
        setSuggestions([]);
        setSuggestionsStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [submittedQuery, suggestionContext]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length > 0) {
      setSubmittedQuery(trimmed);
    }
  }

  function togglePin(pin: PinterestPin) {
    const isSelected = selectedPins.some((p) => p.id === pin.id);
    if (isSelected) {
      onSelectionChange(selectedPins.filter((p) => p.id !== pin.id));
      return;
    }
    if (selectedPins.length >= maxSelections) {
      // Hit the cap — ignore. The UI message tells the user what to do.
      return;
    }
    onSelectionChange([...selectedPins, pin]);
  }

  const atMax = selectedPins.length >= maxSelections;

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <label
          htmlFor="pinterest-query"
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-acc"
        >
          Search
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="pinterest-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="warm minimalism…"
            className="flex-1 border border-dark-3 bg-[rgba(34,30,24,0.6)] px-3 py-2.5 text-[14px] text-hero-cream placeholder:text-hero-dim focus:border-acc focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="border border-dark-3 px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.1em] text-hero-cream transition hover:border-acc hover:text-acc disabled:opacity-50"
          >
            {status === "loading" ? "Searching…" : "Search"}
          </button>
        </div>
        {helperText && (
          <p className="text-[12px] text-hero-dim">{helperText}</p>
        )}
      </form>

      {/* AI-suggested alternative searches */}
      {suggestionContext && suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-acc">
Try also
          </span>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQuery(s);
                setSubmittedQuery(s);
              }}
              className="border border-dark-3 px-3 py-1 text-[11px] text-hero-cream-2 transition hover:border-acc hover:text-acc"
            >
              {s}
            </button>
          ))}
        </div>
      )}
      {suggestionContext && suggestionsStatus === "loading" && (
        <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-hero-dim">
Finding related searches…
        </div>
      )}

      {/* Selection counter */}
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em]">
        <span className={atMax ? "text-acc" : "text-hero-dim"}>
          {selectedPins.length} of {maxSelections} selected
        </span>
        {atMax && (
          <span className="text-hero-dim">
            Tap a selected pin to swap it
          </span>
        )}
      </div>

      {/* Error state */}
      {status === "error" && (
        <div className="border border-red-900/40 bg-red-950/30 p-4 text-[13px] text-red-200">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-red-300">
            Search failed
          </p>
          <p className="mt-2">{error}</p>
          <button
            onClick={() => fetchPins(submittedQuery)}
            className="mt-3 text-[12px] underline underline-offset-2 hover:text-red-100"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {status === "loading" && pins.length === 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse border border-dark-3 bg-dark-2"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {status === "idle" && pins.length === 0 && submittedQuery && (
        <p className="border border-dark-3 bg-[rgba(34,30,24,0.4)] p-6 text-center text-[13px] text-hero-dim">
          No pins came back for &ldquo;{submittedQuery}&rdquo;. Try a different
          phrase. Short descriptive nouns work best.
        </p>
      )}

      {/* Pin grid */}
      {pins.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {pins.map((pin) => {
            const isSelected = selectedPins.some((p) => p.id === pin.id);
            const cannotSelect = !isSelected && atMax;
            return (
              <button
                key={pin.id}
                onClick={() => togglePin(pin)}
                disabled={cannotSelect}
                className={`group relative aspect-[3/4] overflow-hidden border transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  isSelected
                    ? "border-acc ring-2 ring-acc ring-offset-2 ring-offset-dark"
                    : "border-dark-3 hover:border-hero-cream-2"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pin.imageUrl}
                  alt={pin.altText || pin.title || "Pinterest pin"}
                  loading="lazy"
                  className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                />
                {/* Caption — only visible on hover */}
                {pin.title && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
                    <p className="line-clamp-2 text-[11px] text-hero-cream">
                      {pin.title}
                    </p>
                  </div>
                )}
                {/* Selected badge */}
                {isSelected && (
                  <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center bg-acc text-white">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M2 7l3 3 7-7" strokeLinecap="round" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
