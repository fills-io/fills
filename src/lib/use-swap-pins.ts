"use client";

/**
 * Owns a brief's reference images while the user re-picks them, and keeps the
 * saved copy in step.
 *
 * Why this exists at all: the deck is rendered server-side from
 * `concepts.brief_pins`, and the share link renders from the same column. A
 * swap that lives only in React state would mean the page, the shared link and
 * the downloaded PDF all disagree. So every change is written back.
 *
 * The write is debounced and always sends the WHOLE pins object, which makes
 * it idempotent: a dropped request is repaired by the next one instead of
 * leaving the row half-updated.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { BriefPins } from "@/components/wizard/BriefDisplay";
import type { PinterestPin } from "@/db/schema";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/** Trailing debounce. Long, because swapping is bursty and each write is ~40KB. */
const DEBOUNCE_MS = 1200;
/** Give up after this many consecutive failures rather than hammering. */
const MAX_ATTEMPTS = 3;

/**
 * Replace slot `index`, or SWAP TWO SLOTS if the chosen pin is already in this
 * category.
 *
 * The exchange matters. Twelve pins are stored per category but only eight are
 * shown, and all twelve reach the deck. A plain overwrite with an
 * already-stored pin would leave a duplicate, and BriefPDF skips images it has
 * already used — so it would quietly steal one from another spread to fill the
 * gap, which is how the mood board once shipped half empty.
 */
export function applySwap(
  list: PinterestPin[],
  index: number,
  next: PinterestPin,
): PinterestPin[] {
  const at = list.findIndex((p) => p.imageUrl === next.imageUrl);
  if (at === -1) return list.map((p, i) => (i === index ? next : p));
  const out = [...list];
  [out[index], out[at]] = [out[at], out[index]];
  return out;
}

export function useSwapPins(
  initial: BriefPins,
  shareToken: string | null,
  editToken: string | null,
) {
  const [pins, setPins] = useState<BriefPins>(initial);
  const [status, setStatus] = useState<SaveStatus>("idle");

  const latest = useRef(pins);
  const dirty = useRef(false);
  const busy = useRef(false);
  const attempts = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The host builds its pins asynchronously (Quick only has them once
  // generation finishes), so `initial` arrives AFTER mount. Adopt it — but
  // never over the top of a swap the user has already made.
  useEffect(() => {
    if (dirty.current) return;
    setPins(initial);
    latest.current = initial;
  }, [initial]);

  // The compiler can't prove this callback is stable: it reads and writes refs
  // and re-enters itself on retry. That is exactly what it is for, and every
  // consumer is an event handler or an effect with explicit deps, so identity
  // never drives a re-render.
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const flush = useCallback(async () => {
    if (!shareToken || !editToken) return;
    if (!dirty.current || busy.current) return;
    if (attempts.current >= MAX_ATTEMPTS) return;

    busy.current = true;
    dirty.current = false;
    setStatus("saving");
    const snapshot = latest.current;

    try {
      const res = await fetch(`/api/concepts/${shareToken}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editToken, pins: snapshot }),
      });
      if (res.ok) {
        attempts.current = 0;
        setStatus("saved");
      } else {
        setStatus("error");
        // Retry transport-ish failures only. A 400/403/409 will fail
        // identically forever, and retrying it is how a save loop becomes an
        // infinite one.
        if (res.status >= 500) {
          attempts.current += 1;
          dirty.current = true;
        } else {
          attempts.current = MAX_ATTEMPTS;
        }
      }
    } catch {
      setStatus("error");
      attempts.current += 1;
      dirty.current = true;
    } finally {
      busy.current = false;
      // Only re-enter for a change that arrived DURING the request, or a
      // retry we still have budget for.
      if (dirty.current && attempts.current < MAX_ATTEMPTS) {
        timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
      }
    }
  }, [shareToken, editToken]);

  const onSwap = useCallback(
    (category: keyof BriefPins, index: number, next: PinterestPin) => {
      setPins((prev) => {
        const out = { ...prev, [category]: applySwap(prev[category] ?? [], index, next) };
        latest.current = out;
        return out;
      });
      dirty.current = true;
      attempts.current = 0;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
    },
    [flush],
  );

  // Quick shows the brief before the save resolves, so a swap can happen
  // before there is a row to write to. Flush once the tokens land.
  useEffect(() => {
    if (shareToken && editToken && dirty.current) void flush();
  }, [shareToken, editToken, flush]);

  // Last chance before the tab goes away.
  useEffect(() => {
    const go = () => {
      if (dirty.current) void flush();
    };
    document.addEventListener("visibilitychange", go);
    window.addEventListener("pagehide", go);
    return () => {
      document.removeEventListener("visibilitychange", go);
      window.removeEventListener("pagehide", go);
    };
  }, [flush]);

  return { pins, status, onSwap };
}
