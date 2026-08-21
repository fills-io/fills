"use client";

/**
 * Pick a different reference for one slot.
 *
 * Extracted from ReviewStep's SwapBoard so the same gesture works in two
 * places: Full Studio's review step, before the brief is written, and the
 * finished brief itself, where until now every image was fixed. One component
 * so the two cannot drift into two different interactions.
 *
 * Deliberately a light panel, not a modal: click-away and Escape both cancel,
 * and nothing traps someone who opened it by accident.
 *
 * ALWAYS RENDER THIS AS A SIBLING AFTER the grid it belongs to, never inside
 * it. ReviewStep's board is a CSS multi-column flow, which tears a block in
 * half across the column break.
 */

import { useEffect, useRef, useState } from "react";
import { pinAt } from "@/lib/pin-image";
import type { PinterestPin } from "@/db/schema";

/** How many alternatives to show before "More options". */
export const PICKER_PAGE = 12;

export type SwapControls = {
  /**
   * Replacements for one slot, best first. Called only when a picker opens —
   * ranking a pool for every board on mount is work nobody asked for.
   */
  candidates: () => PinterestPin[];
  /** Commit. The HOST owns the pin state, and the persistence. */
  onPick: (index: number, next: PinterestPin) => void;
};

export function SwapPicker({
  index,
  candidates,
  onPick,
  onCancel,
}: {
  /** Which slot is being replaced. */
  index: number;
  candidates: PinterestPin[];
  onPick: (index: number, next: PinterestPin) => void;
  onCancel: () => void;
}) {
  const [shown, setShown] = useState(PICKER_PAGE);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) onCancel();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onCancel]);

  return (
    <div ref={wrapRef} className="border border-acc/40 bg-bg-2 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
          Swap for…
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-txt-3 transition hover:text-acc"
        >
          Cancel ✕
        </button>
      </div>

      {candidates.length === 0 ? (
        <p className="text-[13px] italic text-txt-3">
          Nothing else left in this set.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {candidates.slice(0, shown).map((c) => (
              <button
                /* Pools dedupe on URL, not id — key on both so two entries
                   sharing an id can't collide. */
                key={c.id + c.imageUrl}
                type="button"
                onClick={() => onPick(index, c)}
                title={c.title || "Reference"}
                className="aspect-[3/4] overflow-hidden border border-bdr-2 transition hover:border-acc"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pinAt(c.imageUrl, 236)}
                  alt={c.altText || c.title || "Reference"}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
          {shown < candidates.length && (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={() => setShown((n) => n + PICKER_PAGE)}
                className="border border-bdr-2 px-5 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-txt-2 transition hover:border-acc hover:text-acc"
              >
                More options
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SwapPicker;
