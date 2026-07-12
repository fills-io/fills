"use client";

/**
 * The generated Design DNA brief — the user's final artifact.
 *
 * Rendered after a successful /api/ai/generate-brief call. Layout is
 * editorial — large concept line, color swatches with names + materials,
 * mood lines, strategic pillars, cinematic description.
 *
 * Intentionally read-only here. Editing comes in the mood-board editor
 * (later phase). For now: read, screenshot, regenerate if not right.
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

const ROLE_LABEL: Record<
  GenerateBriefResponse["colorSystem"][number]["role"],
  string
> = {
  primary: "Primary",
  secondary: "Secondary",
  accent: "Accent",
  supporting: "Supporting",
};

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
    <article className="space-y-12">
      {/* Concept line — the headline of the whole brief */}
      <header className="border-b border-bdr-2 pb-10">
        <div className="mb-3 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
          <span className="inline-block h-px w-6 bg-acc" />
          Your design plan · ready
        </div>
        <h1 className="font-serif text-[clamp(28px,4vw,44px)] font-normal leading-[1.15] tracking-tight text-txt">
          {brief.conceptLine}
        </h1>
        <div className="mt-6 flex flex-wrap gap-1.5">
          {brief.keywords.map((kw) => (
            <span
              key={kw}
              className="border border-bdr-2 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-txt-2"
            >
              {kw}
            </span>
          ))}
        </div>
      </header>

      {/* Reference imagery — the pins the user picked across the wizard. */}
      {pinSections.length > 0 && (
        <section>
          <h2 className="mb-6 font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
            Reference images
          </h2>
          <div className="space-y-6">
            {pinSections.map(({ key, label }) => {
              const list = pins?.[key] ?? [];
              return (
                <div
                  key={key}
                  className="grid grid-cols-[80px_1fr] items-start gap-4 sm:grid-cols-[110px_1fr] sm:gap-6"
                >
                  <div className="pt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
                    {label}
                  </div>
                  <ul className="flex flex-wrap gap-2 sm:gap-3">
                    {list.map((pin) => (
                      <li
                        key={pin.id}
                        className="group relative overflow-hidden border border-bdr-2"
                      >
                        <a
                          href={pin.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={pin.title || pin.altText || "Pinterest pin"}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={pin.imageThumbUrl || pin.imageUrl}
                            alt={pin.altText || pin.title || "Reference pin"}
                            loading="lazy"
                            className="h-20 w-20 object-cover transition group-hover:opacity-80 sm:h-24 sm:w-24"
                          />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Color system */}
      <section>
        <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
          Color system
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {brief.colorSystem.map((c) => (
            <div key={c.role} className="space-y-3">
              <div
                className="aspect-square border border-bdr-2"
                style={{ backgroundColor: c.hex }}
              />
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
                  {ROLE_LABEL[c.role]} · {c.hex}
                </div>
                <div className="mt-1 font-serif text-[16px] text-txt">
                  {c.name}
                </div>
                <div className="mt-0.5 text-[11px] text-txt-2">
                  {c.material}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cinematic description — the visual brief */}
      <section className="border border-bdr bg-bg-2 p-8">
        <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
          The space, as it would be photographed
        </h2>
        <p className="font-serif text-[16px] leading-[1.7] text-txt">
          {brief.cinematicDescription}
        </p>
      </section>

      {/* Section mood lines */}
      <section>
        <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
          Section atmospheres
        </h2>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
          {(
            [
              ["vibe", "Vibe"],
              ["colors", "Colors"],
              ["furniture", "Furniture"],
              ["lighting", "Lighting"],
              ["surfaces", "Surfaces"],
              ["materials", "Materials"],
              ["pillars", "Pillars"],
              ["cover", "Cover"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
                {label}
              </dt>
              <dd className="mt-1 text-[14px] leading-relaxed text-txt-2">
                {brief.sectionMoodLines[key]}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Strategic pillars */}
      <section>
        <h2 className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
          Strategic pillars
        </h2>
        <div className="grid grid-cols-1 gap-px border border-bdr bg-bdr sm:grid-cols-3">
          {(
            [
              ["psychological", "Psychological"],
              ["functional", "Functional"],
              ["marketing", "Marketing"],
            ] as const
          ).map(([key, label]) => (
            <div
              key={key}
              className="bg-bg-2 p-6"
            >
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-acc">
                {label}
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-txt-2">
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
