"use client";

/**
 * Full-screen overlay shown while /api/ai/generate-brief is running.
 *
 * GPT-5 full takes 10–20 seconds for a brief. We use that wait as a
 * production moment, not a loading-spinner moment — three short status
 * lines cycle through to signal the work happening behind the scenes.
 *
 * This is purely visual; the actual generation runs in the parent.
 */

import { useEffect, useState } from "react";

const PHASES = [
  "Reading your picks…",
  "Naming the color system…",
  "Finding the through-line…",
  "Composing the cinematic description…",
  "Polishing the brief…",
];

export default function GenerationOverlay() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setPhase((p) => (p + 1) % PHASES.length);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/85 backdrop-blur-md">
      <div className="max-w-md px-8 text-center">
        <div className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-acc" />
          Generating your brief
        </div>
        <h2 className="font-serif text-[clamp(28px,4vw,40px)] font-normal leading-[1.15] tracking-tight text-hero-cream">
          {PHASES[phase]}
        </h2>
        <p className="mt-6 text-[13px] leading-relaxed text-hero-cream-2">
          A senior designer wouldn&apos;t rush this either. Usually 10–20 seconds.
        </p>
      </div>
    </div>
  );
}
