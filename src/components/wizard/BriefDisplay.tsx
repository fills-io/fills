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
import { pinAtOrUndefined, pinSrcSet } from "@/lib/pin-image";
import ExportPanel from "./ExportPanel";
import PaywallPreview from "./PaywallPreview";
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
  /** Set when the deck has not been paid for: references drop to small
   *  un-clickable previews and the paywall stands where the download was. */
  paywall?: { briefToken: string };
};

function textOn(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "#f4f2ec";
  const n = parseInt(m[1], 16);
  const lum =
    0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return lum > 150 ? "#2a2a28" : "#f4f2ec";
}

const LABEL = "mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-acc";

/**
 * How wide a reference cell actually is, so the browser can pick a CDN
 * variant instead of guessing the full viewport.
 *
 * Every host of this component — the wizard, the Quick flow and the shared
 * brief link — wraps it in `max-w-4xl px-6 sm:px-8`, so the column tops out
 * at 832px and a large cell lands at ~270px, a small one at ~157px. Doubled
 * for a retina screen that is 540px and 314px, which is why the small grid
 * used to look soft: it was asking for 236px.
 */
const LG_SIZES = "(min-width: 896px) 270px, (min-width: 640px) 30vw, 45vw";
const MD_SIZES = "(min-width: 896px) 157px, (min-width: 640px) 17vw, 28vw";

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

/**
 * Most references a single section shows on the page.
 *
 * Each category carries twelve so the exported deck can run five or six a
 * spread without repeating any. On the page that reads as a wall — eight is
 * where a section still scans in one glance. The deck keeps the full set.
 */
const MAX_REFS_PER_SECTION = 8;

/**
 * The reference images for one part of the brief.
 *
 * These used to be collected into a single block of "reference imagery" far
 * from the words they illustrate, so the lighting shots sat nowhere near the
 * lighting plan. Each section now carries its own.
 */
function Refs({
  list,
  size = "md",
  locked = false,
}: {
  list?: PinterestPin[];
  size?: "lg" | "md";
  /** Before the deck is paid for. See the note on the locked branch below. */
  locked?: boolean;
}) {
  if (!list || list.length === 0) return null;
  const large = size === "lg";

  // LOCKED: a strip of small, non-clickable previews.
  //
  // Unlocked, every reference links out to the full-size original, which on a
  // paywalled brief hands over exactly what is being sold, one image at a time.
  // Here they are 236px, un-linked and un-draggable, so the easy routes to the
  // full-resolution file are closed. That is not screenshot protection — no
  // such thing exists on the web — it just stops the page serving the goods
  // itself. The real deck is only ever assembled server-side.
  if (locked) {
    return (
      <ul className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {list.slice(0, 6).map((pin) => (
          <li key={pin.id} className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={pinAtOrUndefined(pin.imageUrl || pin.imageThumbUrl, 236)}
              alt=""
              aria-hidden="true"
              draggable={false}
              loading="lazy"
              decoding="async"
              className="pointer-events-none h-24 w-20 select-none border border-bdr-2 object-cover sm:h-28 sm:w-24"
            />
          </li>
        ))}
      </ul>
    );
  }

  const shown = list.slice(0, MAX_REFS_PER_SECTION);
  return (
    <div
      className={`mb-4 grid gap-3 ${
        large ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-3 sm:grid-cols-5"
      }`}
    >
      {shown.map((pin) => {
        // Only the displayed bytes are narrowed — the pin keeps the stored
        // URL the PDF export and the click-through read.
        const ref = pin.imageUrl || pin.imageThumbUrl;
        return (
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
              src={pinAtOrUndefined(ref, large ? 736 : 474)}
              srcSet={pinSrcSet(ref, large ? [474, 736] : [236, 474])}
              sizes={large ? LG_SIZES : MD_SIZES}
              alt={pin.altText || pin.title || "Reference image"}
              loading="lazy"
              decoding="async"
              className={`w-full object-cover transition group-hover:opacity-90 ${
                large ? "aspect-[3/4]" : "aspect-[4/5]"
              }`}
            />
          </a>
        );
      })}
    </div>
  );
}

export default function BriefDisplay({
  brief,
  pins,
  facts,
  onRegenerate,
  onStartOver,
  paywall,
}: Props) {
  const locked = !!paywall;

  return (
    <article className="space-y-10">
      {/* Header */}
      <header className="border-b border-bdr-2 pb-8">
        <div className="mb-3 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
          <span className="inline-block h-px w-6 bg-acc" />
          {brief.title?.trim() || "Design brief"} ·{" "}
          {/* The model often ends projectType with a full stop, which reads as
              a typo inside a letter-spaced uppercase eyebrow. */}
          {brief.summary.projectType.replace(/[.,;:\s]+$/, "")}
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

      {/* The direction — the vibe references and the one piece of real writing */}
      <section>
        <h2 className={LABEL}>The direction</h2>
        <Refs list={pins?.vibe} size="lg" locked={locked} />
        <p className="font-serif text-[15px] leading-[1.7] text-txt">
          {brief.cinematicDescription}
        </p>
      </section>

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

      {/* Materials & finishes */}
      <section>
        <h2 className={LABEL}>Materials &amp; finishes</h2>
        <Refs list={pins?.materials} locked={locked} />
        <div className="border-b border-bdr-2">
          {brief.materials.map((m, i) => (
            <SpecRow key={i} head={m.material} sub={m.application} />
          ))}
        </div>
      </section>

      {/* Furniture */}
      <section>
        <h2 className={LABEL}>Furniture</h2>
        <Refs list={pins?.furniture} locked={locked} />
        <div className="border-b border-bdr-2">
          {brief.furniture.map((f, i) => (
            <SpecRow key={i} head={f.item} sub={f.character} />
          ))}
        </div>
      </section>

      {/* Flooring & ceiling — reference only, no schedule of their own */}
      {(pins?.flooring?.length ?? 0) > 0 && (
        <section>
          <h2 className={LABEL}>Flooring</h2>
          <Refs list={pins?.flooring} locked={locked} />
        </section>
      )}
      {(pins?.ceiling?.length ?? 0) > 0 && (
        <section>
          <h2 className={LABEL}>Ceiling</h2>
          <Refs list={pins?.ceiling} locked={locked} />
        </section>
      )}

      {/* Lighting plan */}
      <section>
        <h2 className={LABEL}>Lighting plan</h2>
        <Refs list={pins?.lighting} locked={locked} />
        <p className="text-[14px] leading-relaxed text-txt-2">
          {brief.lighting.strategy}
        </p>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-acc">
          {brief.lighting.colorTemperature}
        </p>
        <div className="mt-3 border-b border-bdr-2">
          {brief.lighting.layers.map((l) => (
            <SpecRow key={l.layer} head={l.layer} sub={l.fixtures} />
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
      {paywall ? (
        <PaywallPreview
          brief={brief}
          pins={pins}
          briefToken={paywall.briefToken}
        />
      ) : (
        <ExportPanel brief={brief} pins={pins} facts={facts} />
      )}

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
