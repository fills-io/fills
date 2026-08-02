"use client";

/**
 * The generated design brief — the user's deliverable.
 *
 * Structured as a real handover document a designer or contractor can work
 * from: what the project is, the palette with applications, big reference
 * imagery, a materials/finishes schedule, furniture direction, a lighting
 * plan, spatial notes, do/don't guardrails, and next steps.
 *
 * Image-forward and scannable: specs are laid out as lists and rows, not
 * paragraphs. The only prose is the concept line, the intent, and one short
 * "how it should look" note.
 */

import type { GenerateBriefResponse } from "@/lib/ai/prompts/generate-brief";
import type { PinterestPin } from "@/db/schema";
import ExportPanel from "./ExportPanel";
import type { BriefFacts } from "./BriefPDF";

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
  /** The project facts the user entered (area, outdoor, style). */
  facts?: BriefFacts;
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

const LABEL = "mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-acc";

/** A compact spec row: bold key, supporting detail, quiet note. */
function SpecRow({
  head,
  sub,
  note,
}: {
  head: string;
  sub: string;
  note?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 border-t border-bdr-2 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:gap-4">
      <div className="text-[14px] leading-snug text-txt">{head}</div>
      <div>
        <div className="text-[13px] leading-snug text-txt-2">{sub}</div>
        {note && (
          <div className="mt-0.5 text-[12px] leading-snug text-txt-3">
            {note}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BriefDisplay({
  brief,
  pins,
  facts,
  onRegenerate,
  onStartOver,
}: Props) {
  const pinSections = pins
    ? PIN_SECTIONS.filter(({ key }) => (pins[key]?.length ?? 0) > 0)
    : [];

  return (
    <article className="space-y-10">
      {/* Header */}
      <header className="border-b border-bdr-2 pb-8">
        <div className="mb-3 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
          <span className="inline-block h-px w-6 bg-acc" />
          Design brief · {brief.summary.projectType}
        </div>
        <h1 className="font-serif text-[clamp(28px,4vw,44px)] font-normal leading-[1.12] tracking-tight text-txt">
          {brief.conceptLine}
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-txt-2">
          {brief.summary.intent}
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

      {/* At a glance */}
      <section className="grid grid-cols-1 gap-px border border-bdr bg-bdr sm:grid-cols-2">
        {[
          ["Who it's for", brief.summary.whoItsFor],
          ["Scope", brief.summary.scopeNotes],
        ].map(([label, body]) => (
          <div key={label} className="bg-bg-2 p-5">
            <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-acc">
              {label}
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-txt-2">{body}</p>
          </div>
        ))}
      </section>

      {/* Palette — with where each colour goes */}
      <section>
        <h2 className={LABEL}>Colour system</h2>
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
        <div className="mt-1">
          {brief.colorSystem.map((c, i) => (
            <SpecRow
              key={`${c.hex}-${i}`}
              head={`${c.name} · ${c.hex.toUpperCase()}`}
              sub={c.application}
            />
          ))}
        </div>
      </section>

      {/* Reference imagery — large */}
      {pinSections.map(({ key, label }) => {
        const list = pins?.[key] ?? [];
        return (
          <section key={key}>
            <h2 className={LABEL}>{label} references</h2>
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

      {/* Materials & finishes */}
      <section>
        <h2 className={LABEL}>Materials &amp; finishes</h2>
        <div className="border-b border-bdr-2">
          {brief.materials.map((m, i) => (
            <SpecRow
              key={i}
              head={m.material}
              sub={m.application}
              note={m.note}
            />
          ))}
        </div>
      </section>

      {/* Furniture */}
      <section>
        <h2 className={LABEL}>Furniture</h2>
        <div className="border-b border-bdr-2">
          {brief.furniture.map((f, i) => (
            <SpecRow key={i} head={f.item} sub={f.character} note={f.note} />
          ))}
        </div>
      </section>

      {/* Lighting plan */}
      <section>
        <h2 className={LABEL}>Lighting plan</h2>
        <p className="text-[14px] leading-relaxed text-txt-2">
          {brief.lighting.strategy}
        </p>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-acc">
          {brief.lighting.colorTemperature}
        </p>
        <div className="mt-3 border-b border-bdr-2">
          {brief.lighting.layers.map((l) => (
            <SpecRow
              key={l.layer}
              head={l.layer}
              sub={l.fixtures}
              note={l.note}
            />
          ))}
        </div>
      </section>

      {/* Spatial notes */}
      <section>
        <h2 className={LABEL}>Layout &amp; spatial notes</h2>
        <ul className="space-y-2">
          {brief.spatialNotes.map((n, i) => (
            <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-txt-2">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-acc" />
              {n}
            </li>
          ))}
        </ul>
      </section>

      {/* Do / Don't */}
      <section className="grid grid-cols-1 gap-px border border-bdr bg-bdr sm:grid-cols-2">
        <div className="bg-bg-2 p-5">
          <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-acc">
            Do
          </div>
          <ul className="mt-3 space-y-2">
            {brief.dos.map((d, i) => (
              <li key={i} className="flex gap-2.5 text-[13px] leading-snug text-txt-2">
                <span className="text-acc">+</span>
                {d}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-bg-2 p-5">
          <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
            Don&apos;t
          </div>
          <ul className="mt-3 space-y-2">
            {brief.donts.map((d, i) => (
              <li key={i} className="flex gap-2.5 text-[13px] leading-snug text-txt-2">
                <span className="text-txt-3">−</span>
                {d}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it should look */}
      <section className="border border-bdr bg-bg-2 p-6">
        <h2 className={LABEL}>How it should look</h2>
        <p className="font-serif text-[15px] leading-[1.7] text-txt">
          {brief.cinematicDescription}
        </p>
      </section>

      {/* Next steps */}
      <section>
        <h2 className={LABEL}>Next steps</h2>
        <ol className="space-y-2.5">
          {brief.nextSteps.map((s, i) => (
            <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-txt-2">
              <span className="font-mono text-[11px] text-acc">
                {String(i + 1).padStart(2, "0")}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </section>

      {/* Export */}
      <ExportPanel brief={brief} pins={pins} facts={facts} />

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
