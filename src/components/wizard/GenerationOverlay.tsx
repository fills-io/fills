"use client";

/**
 * Full-screen overlay shown while /api/ai/generate-brief is running.
 *
 * The model takes ~10-20 seconds for a brief and the request is a single call
 * (no real sub-progress), so we show a smooth, easing progress bar that climbs
 * toward completion and a matching status line — an honest "how much is done"
 * feel for the wait. The parent swaps this out for the finished brief the moment
 * the response lands, so the bar simply eases upward until then.
 */

import { useEffect, useState } from "react";

const PHASES = [
  "Reading your picks…",
  "Naming your colours…",
  "Finding the through-line…",
  "Describing how the space would look…",
  "Polishing the plan…",
];

export default function GenerationOverlay() {
  const [progress, setProgress] = useState(4);

  useEffect(() => {
    // Ease toward ~96% (never a fake 100 — that lands when the brief is ready).
    const id = setInterval(() => {
      setProgress((p) => (p >= 96 ? 96 : p + Math.max(0.5, (96 - p) * 0.05)));
    }, 350);
    return () => clearInterval(id);
  }, []);

  const pct = Math.round(progress);
  const phase = Math.min(
    PHASES.length - 1,
    Math.floor((progress / 100) * PHASES.length),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/85 backdrop-blur-md">
      <div className="w-full max-w-md px-8 text-center">
        <div className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-acc" />
          Generating your design plan
        </div>

        <h2 className="font-serif text-[clamp(28px,4vw,40px)] font-normal leading-[1.15] tracking-tight text-txt">
          {PHASES[phase]}
        </h2>

        {/* Percentage + progress bar */}
        <div className="mx-auto mt-8 max-w-xs">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-txt-3">
              Building
            </span>
            <span className="font-mono text-[15px] tabular-nums text-acc">
              {pct}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-3">
            <div
              className="h-full rounded-full bg-acc transition-[width] duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <p className="mt-6 text-[13px] leading-relaxed text-txt-2">
          A senior designer wouldn&apos;t rush this either. Usually 10–20 seconds.
        </p>
      </div>
    </div>
  );
}
