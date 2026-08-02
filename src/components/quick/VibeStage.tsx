"use client";

/**
 * Stage 2 — Vibe & style. A search bar (with a free-search budget that nudges
 * toward sign-up), keyword suggestion chips, and a masonry grid of curated
 * references. Pick 3–5. The picks feed the palette + the AI's design read.
 */

import { useMemo, useState } from "react";
import { getIndustry } from "@/lib/concept-taxonomy";
import { findIndustryByLabel } from "@/lib/space-taxonomy";
import {
  CURATED_PINS,
  CURATED_VIBE,
  type CuratedPin,
} from "@/data/reference-images";
import { usableOnly } from "@/lib/image-quality";
import type { QuickState } from "@/lib/quick-state";

type Props = {
  state: QuickState;
  patch: (p: Partial<QuickState>) => void;
};

const MAX_SEARCHES = 6;
const MAX_PICKS = 5;
/** Images shown before "Show more". The pools hold 150-250 per industry, so
 *  this is a starting view, not a cap. */
const SHOWN = 40;

/** Token match against a pin's style + title. Returns [] when nothing matches
 *  so the caller can show an honest empty state instead of the whole pool. */
function filterPool(pool: CuratedPin[], query: string): CuratedPin[] {
  const q = query.trim().toLowerCase();
  if (!q) return pool;
  const toks = q.split(/\s+/);
  return pool.filter((p) => {
    const hay = (p.style + " " + (p.title || "")).toLowerCase();
    return toks.some((t) => hay.includes(t));
  });
}

export default function VibeStage({ state, patch }: Props) {
  const ind = getIndustry(state.industryId);

  const pool = useMemo(() => {
    const spaceId = ind ? findIndustryByLabel(ind.label)?.id : null;
    const raw = (spaceId && CURATED_VIBE[spaceId]) || CURATED_PINS.vibe;
    // Never offer product listings, text-overlay graphics or collages.
    const clean = usableOnly(raw);
    return clean.length >= 12 ? clean : raw;
  }, [ind]);

  // Style chips come from the styles ACTUALLY present in this industry's pool,
  // so a chip can never return nothing. (The old hardcoded list offered e.g.
  // "luxe" to Healthcare, which had zero luxe images.)
  const styles = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of pool) {
      if (p.style) counts.set(p.style, (counts.get(p.style) ?? 0) + 1);
    }
    return [...counts.entries()]
      .filter(([, n]) => n >= 3)
      .sort((a, b) => b[1] - a[1])
      .map(([s]) => s);
  }, [pool]);

  // Style filtering is free and instant. Only free-text search is metered.
  const [style, setStyle] = useState<string | null>(() => {
    const seed = (state.vibeQuery ?? "").trim().toLowerCase();
    return seed && styles.includes(seed) ? seed : null;
  });
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [searchCount, setSearchCount] = useState(0);
  const [shown, setShown] = useState(SHOWN);

  const searchLocked = searchCount >= MAX_SEARCHES;
  const picks = state.picks;

  // Matches lead, then the rest of the pool follows, so a narrow style (Luxe
  // might only have eight images) never leaves the user with a short grid and
  // nothing to browse.
  const results = useMemo(() => {
    const lead = submitted
      ? filterPool(pool, submitted)
      : style
        ? pool.filter((p) => p.style === style)
        : pool;
    if (lead.length === pool.length) return pool;
    const seen = new Set(lead.map((p) => p.id));
    return [...lead, ...pool.filter((p) => !seen.has(p.id))];
  }, [pool, submitted, style]);

  /** How many of `results` are exact matches for the active filter. */
  const exactCount = useMemo(() => {
    if (submitted) return filterPool(pool, submitted).length;
    if (style) return pool.filter((p) => p.style === style).length;
    return pool.length;
  }, [pool, submitted, style]);

  const visible = results.slice(0, shown);
  const canLoadMore = visible.length < results.length;

  function runSearch(term: string) {
    const q = term.trim();
    if (!q || searchLocked) return;
    setSubmitted(q);
    setStyle(null);
    setShown(SHOWN);
    setSearchCount((c) => c + 1);
  }

  function chooseStyle(s: string | null) {
    setStyle(s);
    setSubmitted("");
    setQuery("");
    setShown(SHOWN);
  }

  /** Describe the vibe from what they actually picked, not a stale search. */
  function vibeFrom(next: CuratedPin[]): string | undefined {
    if (next.length === 0) return state.vibeQuery || undefined;
    const tally = new Map<string, number>();
    for (const p of next) {
      if (p.style) tally.set(p.style, (tally.get(p.style) ?? 0) + 1);
    }
    const top = [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    return top ?? state.vibeQuery ?? undefined;
  }

  function togglePick(pin: CuratedPin) {
    const has = picks.some((p) => p.id === pin.id);
    const next = has
      ? picks.filter((p) => p.id !== pin.id)
      : picks.length >= MAX_PICKS
        ? picks
        : [...picks, pin];
    patch({ picks: next, vibeQuery: vibeFrom(next) });
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
            // Matches the `vibeQuery` cap on /api/ai/generate-brief.
            maxLength={200}
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
        {/* Prominent counter = images SELECTED (updates as you pick). */}
        <div className="flex items-center gap-2 whitespace-nowrap border border-bdr bg-bg-2 px-4 font-mono text-[10.5px] uppercase tracking-[0.14em] text-txt-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              picks.length >= 3 ? "bg-green-500" : "bg-acc"
            }`}
          />
          <b className="font-medium text-acc">{picks.length}</b> / {MAX_PICKS}{" "}
          selected
        </div>
      </div>

      {/* Search budget — small, secondary. */}
      <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
        {searchLocked
          ? "Free searches used — browsing by style is still unlimited"
          : `${MAX_SEARCHES - searchCount} of ${MAX_SEARCHES} free searches left · browsing by style is free`}
      </p>

      {/* Style chips — always available, always free, never a dead end. */}
      {styles.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
            Style
          </span>
          <button
            type="button"
            onClick={() => chooseStyle(null)}
            className={`border px-3 py-1.5 text-[12.5px] transition ${
              !style && !submitted
                ? "border-acc bg-[rgba(200,81,42,0.1)] text-acc"
                : "border-bdr text-txt-2 hover:border-acc hover:text-acc"
            }`}
          >
            All
          </button>
          {styles.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => chooseStyle(s)}
              className={`border px-3 py-1.5 text-[12.5px] capitalize transition ${
                style === s
                  ? "border-acc bg-[rgba(200,81,42,0.1)] text-acc"
                  : "border-bdr text-txt-2 hover:border-acc hover:text-acc"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Honest state when the filter matched nothing or only a handful. */}
      {(submitted || style) && exactCount === 0 && (
        <div className="mt-5 border border-bdr bg-bg-2 p-4 text-[13px] leading-relaxed text-txt-2">
          Nothing matched{" "}
          <b className="text-txt">“{submitted || style}”</b> in{" "}
          {ind?.label ?? "this category"} — showing everything else instead.
        </div>
      )}
      {(submitted || style) && exactCount > 0 && (
        <p className="mt-4 text-[12px] text-txt-3">
          {exactCount} {submitted ? "match" : ""}
          {exactCount === 1 ? "" : submitted ? "es" : ""}
          {style && !submitted ? ` ${style} image${exactCount === 1 ? "" : "s"}` : ""}{" "}
          first, then the rest of the {pool.length}.
        </p>
      )}

      {/* Masonry grid */}
      <div className="mt-6 columns-2 gap-3 sm:columns-3 lg:columns-4">
        {visible.map((p, i) => {
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

      {/* More of the pool, on demand — the grid used to cap at 24 forever. */}
      {canLoadMore && (
        <div className="mb-6 flex justify-center">
          <button
            type="button"
            onClick={() => setShown((n) => n + SHOWN)}
            className="border border-bdr-2 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-txt-2 transition hover:border-acc hover:text-acc"
          >
            Show more ({results.length - visible.length} left)
          </button>
        </div>
      )}

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
