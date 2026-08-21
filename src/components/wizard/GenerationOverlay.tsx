"use client";

/**
 * GenerationOverlay — the "theater" shown while /api/ai/generate-brief runs.
 *
 * A working-architect's process, staged: an architectural line-drawing animates
 * in and slowly rotates, a checklist advances through the steps, and tips
 * rotate below. The request is a single variable-length call, so the checklist
 * advances on timers but HOLDS on the last step ("Assembling brief" · Working)
 * until the parent swaps in the finished brief — it never shows a false "done".
 */

import { useEffect, useState } from "react";

const ROWS: { label: string; dur: number }[] = [
  { label: "Composing palette", dur: 1100 },
  { label: "Curating materials", dur: 1700 },
  { label: "Sourcing furniture direction", dur: 1900 },
  { label: "Setting lighting strategy", dur: 1500 },
  { label: "Writing spatial notes", dur: 1300 },
  { label: "Assembling brief", dur: 1500 },
];

const TIPS: { eyebrow: string; text: string }[] = [
  {
    eyebrow: "Did you know",
    text: "Add more spaces to a project and your palette plus vibe stay <b>consistent across all of them</b>, whether that is a full apartment or a hotel's eight zones.",
  },
  {
    eyebrow: "When you want a human eye",
    text: "<b>A working architect can review your brief</b> over a video call, develop 2D drawings, or take it through to a full 3D design. Ask on the Talk to a designer page.",
  },
  {
    eyebrow: "Tip",
    text: "Export as a PDF deck or a shareable link, with <b>your studio's logo on the cover</b> when you send it to clients.",
  },
  {
    eyebrow: "Designed by an architect",
    text: "Every brief is trained on how senior studios actually <b>scope a project</b>, not on random design content.",
  },
];

export default function GenerationOverlay() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  const [pct, setPct] = useState(0);

  // Advance the checklist, but stop (and hold) on the last row.
  useEffect(() => {
    if (activeIdx >= ROWS.length - 1) return;
    const t = setTimeout(() => setActiveIdx((i) => i + 1), ROWS[activeIdx].dur);
    return () => clearTimeout(t);
  }, [activeIdx]);

  // A percentage on the step that is actually running. Completed rows count
  // fully; the active row eases toward (but never reaches) its share, so it
  // never claims to be finished before the brief actually lands.
  useEffect(() => {
    const share = 100 / ROWS.length;
    const floor = activeIdx * share;
    const ceil = floor + share * 0.97;
    // Re-anchor to the new step's floor (external timer -> React).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPct(floor);
    const id = setInterval(() => {
      setPct((p) => (p >= ceil ? ceil : p + Math.max(0.25, (ceil - p) * 0.06)));
    }, 220);
    return () => clearInterval(id);
  }, [activeIdx]);

  useEffect(() => {
    const id = setInterval(
      () => setTipIdx((i) => (i + 1) % TIPS.length),
      3500,
    );
    return () => clearInterval(id);
  }, []);

  const tip = TIPS[tipIdx];

  return (
    <div className="fixed inset-0 z-[500] overflow-y-auto bg-bg [animation:fillsFadeIn_.7s_ease-out]">
      <style>{`
        @keyframes fillsFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fillsAmbient{from{transform:scale(1) translate(0,0)}to{transform:scale(1.06) translate(-2%,-1%)}}
        @keyframes fillsSpin{to{transform:rotate(360deg)}}
        @keyframes fillsDraw{to{opacity:.85}}
        @keyframes fillsRing{0%{transform:scale(.6);opacity:.4}100%{transform:scale(1.3);opacity:0}}
        @keyframes fillsTip{0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}
        .fills-amb{background:radial-gradient(ellipse at 20% 30%, rgba(200,81,42,.05) 0%, transparent 55%),radial-gradient(ellipse at 80% 70%, rgba(94,66,38,.04) 0%, transparent 55%);animation:fillsAmbient 14s ease-in-out infinite alternate}
        .fills-spin{animation:fillsSpin 32s linear infinite;transform-origin:center}
        .fills-svg line,.fills-svg path,.fills-svg circle,.fills-svg rect{stroke:var(--acc);fill:none;stroke-width:1;opacity:0;animation:fillsDraw 1.8s cubic-bezier(.16,.84,.32,1) forwards}
        .fills-svg .l1{animation-delay:.1s}.fills-svg .l2{animation-delay:.3s}.fills-svg .l3{animation-delay:.5s}.fills-svg .l4{animation-delay:.7s}.fills-svg .l5{animation-delay:.9s}.fills-svg .l6{animation-delay:1.1s}.fills-svg .l7{animation-delay:1.3s}
        .fills-ring{animation:fillsRing 3s ease-out infinite}
        .fills-tip{animation:fillsTip .6s cubic-bezier(.16,.84,.32,1)}
      `}</style>

      <div className="fills-amb pointer-events-none fixed inset-0" />

      <div className="relative z-[1] mx-auto flex min-h-full w-full max-w-[680px] flex-col items-center justify-center px-8 py-12 text-center">
        {/* Architectural drawing */}
        <div className="relative mb-9 h-[150px] w-[150px] shrink-0 lg:h-[200px] lg:w-[200px]">
          <span className="fills-ring pointer-events-none absolute inset-0 rounded-full border border-acc opacity-0" />
          <svg
            className="fills-svg h-full w-full"
            viewBox="0 0 200 200"
            aria-hidden="true"
          >
            <g className="fills-spin" style={{ transformOrigin: "100px 100px" }}>
              <circle className="l1" cx="100" cy="100" r="90" />
              <circle className="l2" cx="100" cy="100" r="62" />
              <rect className="l3" x="65" y="80" width="70" height="80" />
              <path className="l4" d="M75 160 L75 110 Q100 90 125 110 L125 160 Z" />
              <line className="l5" x1="40" y1="160" x2="160" y2="160" />
              <line className="l5" x1="60" y1="80" x2="140" y2="80" />
              <line className="l6" x1="100" y1="65" x2="100" y2="80" />
              <line className="l7" x1="100" y1="30" x2="100" y2="50" strokeDasharray="3 3" />
              <line className="l7" x1="20" y1="100" x2="40" y2="100" strokeDasharray="3 3" />
              <line className="l7" x1="160" y1="100" x2="180" y2="100" strokeDasharray="3 3" />
            </g>
          </svg>
        </div>

        <h2 className="font-serif text-[clamp(24px,3.4vw,32px)] font-medium tracking-tight text-txt">
          Drafting your concept.
        </h2>
        <p className="mt-2.5 font-serif text-[15px] italic text-txt-2">
          A working architect&apos;s process, run on your direction.
        </p>

        {/* Checklist */}
        <div className="mt-9 w-full max-w-[480px]">
          {ROWS.map((r, i) => {
            const done = i < activeIdx;
            const active = i === activeIdx;
            return (
              <div
                key={i}
                className={`flex items-center justify-between gap-4 border-b border-bdr py-3 transition-all duration-500 ${
                  done || active
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-2 opacity-40"
                }`}
              >
                <span className="flex items-center gap-2.5 text-[13px] text-txt">
                  <span
                    className={`h-[7px] w-[7px] shrink-0 rounded-full ${
                      done
                        ? "bg-acc"
                        : active
                          ? "animate-pulse bg-acc"
                          : "bg-txt-3"
                    }`}
                  />
                  {r.label}
                </span>
                <span
                  className={`font-mono text-[9.5px] uppercase tracking-[0.14em] ${
                    active ? "text-acc" : done ? "text-txt-2" : "text-txt-3"
                  }`}
                >
                  {done ? (
                    <>
                      <span className="font-medium text-acc">✓</span>&nbsp;Done
                    </>
                  ) : active ? (
                    <span className="tabular-nums">{Math.round(pct)}%</span>
                  ) : (
                    "Pending"
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* Rotating tip */}
        <div className="relative mx-auto mt-9 max-w-[520px] border border-bdr bg-bg-2 px-6 py-5">
          <div key={tipIdx} className="fills-tip">
            <div className="mb-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-acc">
              {tip.eyebrow}
            </div>
            <p
              className="font-serif text-[15px] italic leading-relaxed text-txt [&_b]:font-medium [&_b]:not-italic [&_b]:text-acc"
              dangerouslySetInnerHTML={{ __html: tip.text }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
