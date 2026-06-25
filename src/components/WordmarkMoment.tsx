"use client";

/**
 * WordmarkMoment — a restrained kinetic wordplay on "Fills".
 *
 * "Fills" holds steady; the completion rotates (the brief / the room / in
 * the blanks / the rest) in italic serif accent. Editorial, professional,
 * far calmer than the old oversized static wordmark. Honors
 * prefers-reduced-motion (shows the first phrase, no cycling).
 */

import { useEffect, useState } from "react";

const COMPLETIONS = ["the brief.", "the room.", "in the blanks.", "the rest."];

export default function WordmarkMoment() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(
      () => setIdx((i) => (i + 1) % COMPLETIONS.length),
      2600,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <section className="overflow-hidden border-b border-bdr bg-bg px-8 py-[96px]">
      <div className="mx-auto max-w-[1000px] text-center">
        <span className="inline-flex items-center gap-2.5 font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-txt-3">
          <span className="inline-block h-px w-6 bg-acc" />
          The promise
        </span>

        <h2 className="mt-6 font-serif text-[clamp(34px,5.2vw,68px)] font-normal leading-[1.05] tracking-tight text-txt">
          Fills{" "}
          <span className="relative inline-block align-baseline">
            {/* sizing ghost keeps the line from reflowing as the word swaps */}
            <span className="invisible italic" aria-hidden>
              in the blanks.
            </span>
            <span
              key={idx}
              className="absolute inset-0 whitespace-nowrap italic text-acc"
              style={{ animation: "wmSwap 2.6s ease-in-out" }}
            >
              {COMPLETIONS[idx]}
            </span>
          </span>
        </h2>

        <p className="mx-auto mt-6 max-w-[440px] text-[14px] leading-relaxed text-txt-2">
          You bring the taste. We fill in the eight design dimensions a studio
          would — palette, materials, lighting, furniture, and the rest.
        </p>
      </div>

      <style>{`
        @keyframes wmSwap {
          0%   { opacity: 0; transform: translateY(8px); }
          12%  { opacity: 1; transform: translateY(0); }
          88%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-8px); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="wmSwap"] { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </section>
  );
}
