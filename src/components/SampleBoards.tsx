"use client";

/**
 * SampleBoards — the homepage showcase of example briefs (id="samples").
 *
 * A horizontally-scrollable rail of sample-board cards (scroll-snap, works
 * with trackpad/drag/arrow keys) — a robust, coherent alternative to the
 * prototype's scroll-hijacked sticky version. Clicking a card opens a
 * lightbox with the full palette, materials, and a "build a brief like this"
 * CTA into the flow. Theme-aware.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SAMPLE_BOARDS, paletteGradient } from "@/lib/sample-boards";

export default function SampleBoards() {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const prev = useCallback(
    () => setOpen((i) => (i === null ? i : (i - 1 + SAMPLE_BOARDS.length) % SAMPLE_BOARDS.length)),
    [],
  );
  const next = useCallback(
    () => setOpen((i) => (i === null ? i : (i + 1) % SAMPLE_BOARDS.length)),
    [],
  );

  // Lock body scroll + keyboard nav while the lightbox is open.
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close, prev, next]);

  const board = open === null ? null : SAMPLE_BOARDS[open];

  return (
    <section id="samples" className="border-b border-bdr bg-bg px-6 py-[104px] sm:px-8">
      <div className="mx-auto max-w-[1280px]">
        {/* Header */}
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[780px]">
            <span className="inline-flex items-center gap-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-txt-3">
              <span className="inline-block h-px w-[18px] bg-acc" />
              05 · Sample boards
            </span>
            <h2 className="mt-4 font-serif text-[clamp(34px,4.6vw,56px)] font-medium leading-[1.05] tracking-tight text-txt">
              Real briefs, real projects.
            </h2>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-txt-3">
            Scroll →
          </span>
        </div>

        {/* Horizontal rail */}
        <div className="-mx-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-8 sm:px-8">
          {SAMPLE_BOARDS.map((b, i) => (
            <button
              key={b.name}
              onClick={() => setOpen(i)}
              className="group relative flex w-[300px] shrink-0 snap-start flex-col border border-bdr-2 bg-bg-2 text-left transition hover:-translate-y-[3px] hover:border-acc sm:w-[360px]"
            >
              {/* Palette-built preview */}
              <div
                className="relative h-[220px] w-full overflow-hidden"
                style={{ background: paletteGradient(b.palette) }}
              >
                <span className="pointer-events-none absolute -left-px -top-px h-3.5 w-3.5 border-l border-t border-white/50 opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="pointer-events-none absolute -bottom-px -right-px h-3.5 w-3.5 border-b border-r border-white/50 opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="absolute bottom-3 left-3 font-mono text-[9px] uppercase tracking-[0.14em] text-white/80">
                  SB.{String(i + 1).padStart(2, "0")}
                </span>
              </div>
              {/* Meta */}
              <div className="flex items-center justify-between gap-3 p-5">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-acc">
                    {b.tag}
                  </div>
                  <div className="mt-1 font-serif text-[20px] text-txt">{b.name}</div>
                  <div className="font-serif text-[13px] italic text-txt-2">{b.style}</div>
                </div>
                <div className="flex gap-1">
                  {b.palette.map((c, j) => (
                    <span key={j} className="h-4 w-4 border border-bdr-2" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {board && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 p-6 backdrop-blur-md"
          onClick={close}
        >
          <div
            className="relative grid w-full max-w-[1000px] grid-cols-1 overflow-hidden border border-bdr bg-bg shadow-2xl md:grid-cols-[1fr_360px]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image side */}
            <div
              className="relative min-h-[280px]"
              style={{ background: paletteGradient(board.palette) }}
            >
              <span className="absolute left-4 top-4 bg-black/60 px-2.5 py-1.5 font-mono text-[10px] tracking-[0.08em] text-white">
                {String((open ?? 0) + 1).padStart(2, "0")} / {String(SAMPLE_BOARDS.length).padStart(2, "0")}
              </span>
              <button
                onClick={close}
                aria-label="Close"
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-bg/95 text-txt transition hover:bg-acc hover:text-white"
              >
                ✕
              </button>
              <button
                onClick={prev}
                aria-label="Previous"
                className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-bg/95 text-txt transition hover:bg-acc hover:text-white"
              >
                ‹
              </button>
              <button
                onClick={next}
                aria-label="Next"
                className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-bg/95 text-txt transition hover:bg-acc hover:text-white"
              >
                ›
              </button>
            </div>

            {/* Info side */}
            <div className="flex flex-col gap-4 overflow-y-auto p-8">
              <div className="font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-acc">
                {board.tag} · Sample board
              </div>
              <h3 className="font-serif text-[26px] leading-[1.15] text-txt">
                {board.name}
                <br />
                <em className="text-[18px] italic text-acc">{board.style}</em>
              </h3>
              <p className="text-[13px] leading-[1.8] text-txt-2">{board.desc}</p>
              <div>
                <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.1em] text-txt-3">
                  Palette
                </div>
                <div className="flex gap-1.5">
                  {board.palette.map((c, j) => (
                    <span key={j} className="h-9 w-9 border border-bdr-2" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-4 border-t border-bdr pt-4">
                <div>
                  <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.1em] text-txt-3">
                    Size
                  </div>
                  <div className="text-[13px] font-medium text-txt">{board.size}</div>
                </div>
                <div>
                  <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.1em] text-txt-3">
                    Materials
                  </div>
                  <div className="text-[11px] leading-[1.5] text-txt">{board.materials}</div>
                </div>
              </div>
              <Link
                href="/concept/wizard"
                className="mt-2 inline-flex w-fit items-center gap-2 bg-acc px-5 py-3 text-[12px] font-medium uppercase tracking-[0.08em] text-white transition hover:gap-3 hover:bg-acc-h"
              >
                Build a brief like this →
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
