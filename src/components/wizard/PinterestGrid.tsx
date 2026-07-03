"use client";

/**
 * Reference-image picker for every image-backed wizard step (vibe, lighting,
 * flooring, ceiling, materials, furniture).
 *
 * Two modes:
 *   1. CURATED (default for all wizard steps) — reads a fixed, pre-approved
 *      image set per category from `src/data/reference-images.ts`. No live
 *      scraping, so it loads instantly and never incurs per-session cost. The
 *      same set is reused for every user/session. Vibe uses `adaptive` so that
 *      after the first pick, similar-style references float to the top, and
 *      style chips let the user steer the mood.
 *   2. LIVE (fallback only) — the original Apify-backed search, used if a
 *      category has no curated set. Kept so nothing breaks.
 *
 * Selection state is owned by the parent (wizard state) — we only echo changes.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PinterestPin } from "@/db/schema";
import { CURATED_PINS, type CuratedPin } from "@/data/reference-images";

export type SuggestionContext = {
  step: string;
  industry?: string;
  space?: string;
  priorContext?: string;
};

type Props = {
  /** Pre-filled search text (live mode only). */
  initialQuery?: string;
  /** Max pins the user can select. Picking past this is a no-op. */
  maxSelections: number;
  /** Minimum picks needed for the step (shown as guidance). */
  minSelections?: number;
  /** Currently-selected pins (owned by the wizard state). */
  selectedPins: PinterestPin[];
  /** Called whenever the selection changes (add or remove). */
  onSelectionChange: (pins: PinterestPin[]) => void;
  /** Optional copy under the header. */
  helperText?: string;
  /** When provided (live mode), AI-suggested alternative searches appear. */
  suggestionContext?: SuggestionContext;
  /** Curated category key (vibe, lighting, flooring, ceiling, materials,
   *  furniture). When it resolves to a non-empty set, we use curated mode. */
  categoryKey?: string;
  /** Vibe-style adaptive reordering + style chips. */
  adaptive?: boolean;
  /** Offsets the curated slice so repeated grids (furniture sub-sections)
   *  show different references. */
  sliceSeed?: number;
};

/** Curated pin → the PinterestPin shape the wizard state stores. */
function toPin(c: CuratedPin): PinterestPin {
  return {
    id: c.id,
    url: "",
    title: c.title,
    description: "",
    altText: c.title,
    imageUrl: c.imageUrl,
    imageThumbUrl: c.imageUrl,
    dominantColor: c.dominantColor,
    boardName: "",
    boardUrl: "",
  };
}

/** Slightly smaller variant for grid thumbnails — faster than the 736 original. */
function thumb(url: string): string {
  return url.replace("/736x/", "/474x/");
}

export default function PinterestGrid(props: Props) {
  const curated = props.categoryKey ? CURATED_PINS[props.categoryKey] : undefined;
  if (curated && curated.length > 0) {
    return <CuratedPicker {...props} curated={curated} />;
  }
  return <LiveGrid {...props} />;
}

/* ─────────────────────────── Curated picker ──────────────────────────── */

function CuratedPicker({
  curated,
  maxSelections,
  minSelections,
  selectedPins,
  onSelectionChange,
  helperText,
  adaptive,
  sliceSeed,
}: Props & { curated: CuratedPin[] }) {
  const [styleFilter, setStyleFilter] = useState<string | null>(null);

  const styles = useMemo(
    () => Array.from(new Set(curated.map((c) => c.style))),
    [curated],
  );
  const showChips = !!adaptive && styles.length >= 3;

  // Rotate the pool for repeated grids (furniture sub-sections) so each shows
  // a different slice of the same curated set.
  const pool = useMemo(() => {
    if (!sliceSeed) return curated;
    const n = curated.length;
    const start = ((sliceSeed * 6) % n + n) % n;
    return [...curated.slice(start), ...curated.slice(0, start)];
  }, [curated, sliceSeed]);

  const styleOf = useMemo(() => {
    const m = new Map<string, string>();
    curated.forEach((c) => m.set(c.id, c.style));
    return m;
  }, [curated]);

  const selectedStyles = useMemo(
    () =>
      new Set(
        selectedPins
          .map((p) => styleOf.get(p.id))
          .filter((s): s is string => !!s),
      ),
    [selectedPins, styleOf],
  );

  const visible = useMemo(() => {
    let list = styleFilter ? pool.filter((c) => c.style === styleFilter) : pool;
    // Adaptive: once something's picked, float same-style references up.
    if (adaptive && selectedStyles.size > 0 && !styleFilter) {
      list = [...list].sort(
        (a, b) =>
          (selectedStyles.has(a.style) ? 0 : 1) -
          (selectedStyles.has(b.style) ? 0 : 1),
      );
    }
    return list;
  }, [pool, styleFilter, adaptive, selectedStyles]);

  const atMax = selectedPins.length >= maxSelections;
  const need = minSelections ?? 0;
  const short = selectedPins.length < need;

  const toggle = useCallback(
    (c: CuratedPin) => {
      const isSel = selectedPins.some((p) => p.id === c.id);
      if (isSel) {
        onSelectionChange(selectedPins.filter((p) => p.id !== c.id));
        return;
      }
      if (selectedPins.length >= maxSelections) return;
      onSelectionChange([...selectedPins, toPin(c)]);
    },
    [selectedPins, maxSelections, onSelectionChange],
  );

  return (
    <div className="space-y-5">
      {helperText && <p className="text-[13px] text-txt-2">{helperText}</p>}

      {/* Style chips — steer the mood (vibe) */}
      {showChips && (
        <div className="flex flex-wrap gap-2">
          <Chip active={styleFilter === null} onClick={() => setStyleFilter(null)}>
            All styles
          </Chip>
          {styles.map((s) => (
            <Chip
              key={s}
              active={styleFilter === s}
              onClick={() => setStyleFilter((cur) => (cur === s ? null : s))}
            >
              {s}
            </Chip>
          ))}
        </div>
      )}

      {/* Counter + guidance */}
      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
        <span className={short ? "text-txt-3" : "text-acc"}>
          {selectedPins.length}
          {need > 0 ? ` / ${need}–${maxSelections}` : ` of ${maxSelections}`} selected
        </span>
        {adaptive && selectedStyles.size > 0 && !styleFilter && (
          <span className="normal-case tracking-normal text-txt-3">
            Sorted to match your picks
          </span>
        )}
        {atMax && (
          <span className="normal-case tracking-normal text-txt-3">
            Tap a pick to swap it
          </span>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((c) => {
          const isSelected = selectedPins.some((p) => p.id === c.id);
          const cannotSelect = !isSelected && atMax;
          return (
            <button
              key={c.id}
              onClick={() => toggle(c)}
              disabled={cannotSelect}
              className={`group relative aspect-[3/4] overflow-hidden border transition disabled:cursor-not-allowed disabled:opacity-40 ${
                isSelected
                  ? "border-acc ring-2 ring-acc ring-offset-2 ring-offset-bg"
                  : "border-bdr-2 hover:border-txt-2"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumb(c.imageUrl)}
                alt={c.title || "reference"}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition group-hover:scale-[1.02]"
              />
              {isSelected && (
                <span className="absolute inset-0 bg-acc/25" />
              )}
              {isSelected && (
                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center bg-acc text-white">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 7l3 3 7-7" strokeLinecap="round" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-[11px] capitalize transition ${
        active
          ? "border-acc bg-acc text-white"
          : "border-bdr-2 text-txt-2 hover:border-acc hover:text-acc"
      }`}
    >
      {children}
    </button>
  );
}

/* ─────────────────────── Live (fallback) grid ────────────────────────── */

function LiveGrid({
  initialQuery = "",
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
      if ("ok" in data && data.ok === false) throw new Error(data.error);
      if (!("pins" in data)) throw new Error("Unexpected response shape");
      setPins(data.pins);
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    if (submittedQuery.trim().length > 0) fetchPins(submittedQuery);
  }, [submittedQuery, fetchPins]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length > 0) setSubmittedQuery(trimmed);
  }

  function togglePin(pin: PinterestPin) {
    const isSelected = selectedPins.some((p) => p.id === pin.id);
    if (isSelected) {
      onSelectionChange(selectedPins.filter((p) => p.id !== pin.id));
      return;
    }
    if (selectedPins.length >= maxSelections) return;
    onSelectionChange([...selectedPins, pin]);
  }

  const atMax = selectedPins.length >= maxSelections;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-2">
        <label htmlFor="pinterest-query" className="font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
          Search
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="pinterest-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="warm minimalism…"
            className="flex-1 border border-bdr-2 bg-bg-2 px-3 py-2.5 text-[14px] text-txt placeholder:text-txt-3 focus:border-acc focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="border border-bdr-2 px-5 py-2.5 text-[12px] font-medium uppercase tracking-[0.1em] text-txt transition hover:border-acc hover:text-acc disabled:opacity-50"
          >
            {status === "loading" ? "Searching…" : "Search"}
          </button>
        </div>
        {helperText && <p className="text-[12px] text-txt-3">{helperText}</p>}
      </form>

      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em]">
        <span className={atMax ? "text-acc" : "text-txt-3"}>
          {selectedPins.length} of {maxSelections} selected
        </span>
        {atMax && <span className="text-txt-3">Tap a selected pin to swap it</span>}
      </div>

      {status === "error" && (
        <div className="border border-red-900/40 bg-red-950/30 p-4 text-[13px] text-red-200">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-red-300">Search failed</p>
          <p className="mt-2">{error}</p>
          <button onClick={() => fetchPins(submittedQuery)} className="mt-3 text-[12px] underline underline-offset-2 hover:text-red-100">
            Try again
          </button>
        </div>
      )}

      {status === "loading" && pins.length === 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse border border-bdr-2 bg-bg-2" />
          ))}
        </div>
      )}

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
                  isSelected ? "border-acc ring-2 ring-acc ring-offset-2 ring-offset-bg" : "border-bdr-2 hover:border-txt-2"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pin.imageUrl} alt={pin.altText || pin.title || "pin"} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
                {isSelected && (
                  <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center bg-acc text-white">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 7l3 3 7-7" strokeLinecap="round" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
