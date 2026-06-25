"use client";

/**
 * Theater — the "Drafting your concept" generation screen. A rotating
 * architectural glyph, a sequential checklist that completes step by step,
 * and rotating tip cards. Auto-advances to the next phase when done.
 *
 * Design-first: the timing is cosmetic (no real generation yet). Honors
 * prefers-reduced-motion by completing instantly.
 */

import { useEffect, useState } from "react";
import { THEATER_STEPS, THEATER_TIPS } from "@/lib/quickflow-data";

export default function Theater({ onDone }: { onDone: () => void }) {
  const [done, setDone] = useState(0);
  const [tip, setTip] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDone(THEATER_STEPS.length);
      const t = setTimeout(onDone, 400);
      return () => clearTimeout(t);
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 0;
    THEATER_STEPS.forEach((step, i) => {
      elapsed += step.durationMs;
      timers.push(setTimeout(() => setDone(i + 1), elapsed));
    });
    timers.push(setTimeout(onDone, elapsed + 700));
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  useEffect(() => {
    const id = setInterval(() => setTip((t) => (t + 1) % THEATER_TIPS.length), 3500);
    return () => clearInterval(id);
  }, []);

  const currentTip = THEATER_TIPS[tip];

  return (
    <main className="mx-auto flex min-h-[calc(100vh-60px)] max-w-[680px] flex-col items-center justify-center px-6 py-16 text-center">
      {/* Rotating architectural glyph */}
      <svg
        width="56"
        height="56"
        viewBox="0 0 56 56"
        fill="none"
        className="mb-8 text-acc"
        style={{ animation: "flowSpin 32s linear infinite" }}
        aria-hidden
      >
        <circle cx="28" cy="28" r="26" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        <rect x="14" y="14" width="28" height="28" stroke="currentColor" strokeWidth="1" opacity="0.6" />
        <path d="M28 6 L28 50 M6 28 L50 28" stroke="currentColor" strokeWidth="0.75" opacity="0.4" />
        <circle cx="28" cy="28" r="6" stroke="currentColor" strokeWidth="1.2" />
      </svg>

      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
        Generating
      </div>
      <h2 className="mb-3 font-serif text-[clamp(28px,4vw,42px)] font-normal leading-[1.1] tracking-tight text-txt">
        Drafting your <em className="italic text-acc">concept</em>.
      </h2>
      <p className="mb-10 max-w-[420px] text-[14px] leading-relaxed text-txt-2">
        A working architect&apos;s process, run on your direction.
      </p>

      {/* Checklist */}
      <ul className="mb-10 w-full max-w-[360px] space-y-2.5 text-left">
        {THEATER_STEPS.map((step, i) => {
          const isDone = i < done;
          const isActive = i === done;
          return (
            <li
              key={step.label}
              className={`flex items-center gap-3 font-sans text-[13px] transition ${
                isDone ? "text-txt" : isActive ? "text-acc" : "text-txt-3 opacity-50"
              }`}
            >
              <span
                className={`grid h-4 w-4 place-items-center rounded-full border text-[9px] ${
                  isDone
                    ? "border-acc bg-acc text-white"
                    : isActive
                      ? "border-acc text-acc"
                      : "border-bdr-2"
                }`}
              >
                {isDone ? "✓" : isActive ? "·" : ""}
              </span>
              {step.label}
            </li>
          );
        })}
      </ul>

      {/* Rotating tip */}
      <div key={tip} className="max-w-[420px] border border-bdr-2 bg-bg-2 p-5 text-left" style={{ animation: "flowFade .5s ease" }}>
        <div className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-acc">
          {currentTip.eyebrow}
        </div>
        <p className="text-[13px] leading-relaxed text-txt-2">{currentTip.text}</p>
      </div>

      <style>{`
        @keyframes flowSpin { to { transform: rotate(360deg); } }
        @keyframes flowFade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </main>
  );
}
