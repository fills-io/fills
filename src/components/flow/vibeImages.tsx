"use client";

/**
 * Real vibe-related Pinterest imagery for the post-Vibe screens (concept page,
 * mood board). It combines the pins the user already picked in the Vibe step
 * (the most on-vibe references there are) with one extra cached scraper search
 * seeded by their vibe + spec, then hands components a flat pool of image URLs
 * to slice from. One search, reused everywhere — fast and cheap.
 */

import { useEffect, useMemo, useState } from "react";
import type { PinterestPin } from "@/db/schema";

export function useVibeImages(
  vibe: string,
  spec: string,
  picks: string[],
): string[] {
  const q =
    [vibe, spec]
      .map((s) => (s || "").trim())
      .filter(Boolean)
      .join(" ") || "interior design mood";

  const [extra, setExtra] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/pinterest/search?q=${encodeURIComponent(q)}&limit=30`)
      .then((r) => r.json())
      .then((d: { pins?: PinterestPin[] }) => {
        if (cancelled) return;
        const urls = Array.isArray(d.pins)
          ? d.pins.map((p) => p.imageUrl).filter(Boolean)
          : [];
        setExtra(urls);
      })
      .catch(() => {
        /* keep the picks-only pool on failure */
      });
    return () => {
      cancelled = true;
    };
  }, [q]);

  // Picks first (the user's own on-vibe choices), then the fresh search, deduped.
  return useMemo(
    () => Array.from(new Set([...(picks || []), ...extra])),
    [picks, extra],
  );
}

/** `n` images starting at `start`, wrapping around the pool. */
export function sliceImages(images: string[], start: number, n: number): string[] {
  if (images.length === 0) return [];
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(images[(start + i) % images.length]);
  return out;
}

/** A reference image: smaller (faster) variant, lazy, fades in over a bg. */
export function VibeImage({
  src,
  className = "",
  alt = "Reference",
}: {
  src: string;
  className?: string;
  alt?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src.replace(/\/(736x|originals)\//, "/474x/")}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={(e) => e.currentTarget.classList.remove("opacity-0")}
      className={`bg-bg-2 object-cover opacity-0 transition duration-300 ${className}`}
    />
  );
}
