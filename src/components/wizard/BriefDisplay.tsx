"use client";

/**
 * The generated Design DNA brief — the user's final artifact.
 *
 * Image-forward and lean: a concise headline + one-line subtitle, a compact
 * palette bar, then LARGE reference images per category (the star of the page),
 * a short strategy block, and export. The heavy prose sections were removed on
 * feedback — the brief should read as a mood board, not an essay.
 */

import type { GenerateBriefResponse } from "@/lib/ai/prompts/generate-brief";
import type { PinterestPin } from "@/db/schema";
import ExportPanel from "./ExportPanel";

/** Pins picked across the wizard, surfaced in the brief as reference imagery. */
export type BriefPins = {
  vibe?: PinterestPin[];
  furniture?: PinterestPin[];
  lighting?: PinterestPin[];
  flooring?: PinterestPin[];
  ceiling?: PinterestPin[];
  materials?: PinterestPin[];
};

type Props = {
  brief: GenerateBriefResponse;
  pins?: BriefPins;
  onRegenerate: () => void;
  onStartOver: () => void;
};

const PIN_SECTIONS: { key: keyof BriefPins; label: string }[] = [
  { key: "vibe", label: "Vibe" },
  { key: "furniture", label: "Furniture" },
  { key: "lighting", label: "Lighting" },
  { key: "flooring", label: "Flooring" },
  { key: "ceiling", label: "Ceiling" },
  { key: "materials", label: "Materials" },
];

function textOn(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "#f4f2ec";
  const n = parseInt(m[1], 16);
  const lum =
    0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return lum > 150 ? "#2a2a28" : "#f4f2ec";
}

/** The first sentence of the cinematic description — a tight subtitle. */
function firstSentence(text: string): string {
  const m = text.trim().match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : text).trim();
}

const LABEL =
  "mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-acc";

export default function BriefDisplay({
  brief,
  pins,
  onRegenerate,
  onStartOver,
}: Props) {
  const pinSections = pins
    ? PIN_SECTIONS.filter(({ key }) => (pins[key]?.length ?? 0) > 0)
    : [];

  return (
    <article className="space-y-10">
      {/* Header — concise */}
      <header className="border-b border-bdr-2 pb-8">
        <div className="mb-3 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
          <span className="inline-block h-px w-6 bg-acc" />
          Your design plan · ready
        </div>
        <h1 className="font-serif text-[clamp(28px,4vw,44px)] font-normal leading-[1.12] tracking-tight text-txt">
          {brief.conceptLine}
        </h1>
        <p className="mt-4 max-w-2xl font-serif text-[16px] italic leading-relaxed text-txt-2">
          {firstSentence(brief.cinematicDescription)}
        </p>
        <div className="mt-5 flex flex-wrap gap-1.5">
          {brief.keywords.slice(0, 10).map((kw) => (
            <span
              key={kw}
              className="border border-bdr-2 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-txt-2"
            >
              {kw}
            </span>
          ))}
        </div>
      </header>

      {/* Palette — compact proportional bar + short names */}
      <section>
        <h2 className={LABEL}>Palette</h2>
        <div className="flex h-16 w-full overflow-hidden rounded-lg border border-bdr-2 lg:h-20">
          {brief.colorSystem.map((c, i) => (
            <div
              key={i}
              className="relative flex-1"
              style={{ backgroundColor: c.hex }}
            >
              <span
                className="absolute inset-x-0 bottom-1.5 text-center font-mono text-[9px] uppercase"
                style={{ color: textOn(c.hex) }}
              >
                {c.hex}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
          {brief.colorSystem.map((c) => (
            <div key={c.role} className="text-[11px] leading-snug">
              <span className="text-txt">{c.name}</span>
              <span className="text-txt-3"> · {c.material}</span>
            </div>
          ))}
        </div>
      </section>

      {/* LARGE reference images per category — the star of the page */}
      {pinSections.map(({ key, label }) => {
        const list = pins?.[key] ?? [];
        return (
          <section key={key}>
            <h2 className={LABEL}>{label}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {list.map((pin) => (
                <a
                  key={pin.id}
                  href={pin.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={pin.title || pin.altText || "Reference"}
                  className="group overflow-hidden border border-bdr-2"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pin.imageUrl || pin.imageThumbUrl}
                    alt={pin.altText || pin.title || "Reference image"}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition group-hover:opacity-90"
                  />
                </a>
              ))}
            </div>
          </section>
        );
      })}

      {/* Strategy — the one text block, kept tight */}
      <section>
        <h2 className={LABEL}>Strategy</h2>
        <div className="grid grid-cols-1 gap-px border border-bdr bg-bdr sm:grid-cols-3">
          {(
            [
              ["psychological", "Psychological"],
              ["functional", "Functional"],
              ["marketing", "Marketing"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="bg-bg-2 p-5">
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-acc">
                {label}
              </div>
              <p className="mt-2.5 text-[13px] leading-relaxed text-txt-2">
                {brief.strategicPillars[key]}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Export — PDF download with logo + orientation controls. */}
      <ExportPanel brief={brief} pins={pins} />

      {/* Actions */}
      <footer className="flex flex-col items-center justify-between gap-4 border-t border-bdr-2 pt-8 sm:flex-row">
        <button
          type="button"
          onClick={onStartOver}
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-txt-2 transition hover:text-acc"
        >
          ← Start a new plan
        </button>
        <button
          type="button"
          onClick={onRegenerate}
          className="inline-flex items-center gap-2 border border-acc px-6 py-3 text-[12px] font-medium uppercase tracking-[0.1em] text-acc transition hover:bg-acc hover:text-white"
        >
          ↻ Regenerate plan
        </button>
      </footer>
    </article>
  );
}
