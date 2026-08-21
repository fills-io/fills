"use client";

/**
 * Step 9 — Review.
 *
 * The last look before the brief is generated. Three jobs:
 *
 *   1. The project facts (space, size, palette) and the AI design check.
 *   2. Every reference image the user picked, laid out as a MASONRY board
 *      grouped by category — images at their natural shape, the way a designer
 *      pins a board, instead of square crops that hide what the image is of.
 *   3. Swapping. Clicking an image opens an inline picker of alternatives from
 *      the same curated pool that step drew from, so one weak reference can be
 *      replaced here rather than by walking back four steps. Replacements keep
 *      the FULL pin shape (the brief and the PDF read `pin.imageUrl`), so a
 *      swapped image behaves exactly like a hand-picked one.
 *
 * The big primary CTA on this page lives on the parent (WizardClient)'s nav
 * bar — when the user is on the review step, "Next →" is replaced with
 * "Generate brief →" and the AI generation pipeline takes over.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { getIndustry } from "@/lib/space-taxonomy";
import { buildCategoryPool } from "@/lib/select-images";
import { usableOnly } from "@/lib/image-quality";
import { pinAt, pinSrcSet } from "@/lib/pin-image";
import {
  CURATED_PINS,
  CURATED_VIBE,
  type CuratedPin,
} from "@/data/reference-images";
import type { WizardState } from "@/lib/wizard-state";
import type { WizardStepId } from "@/lib/wizard-steps";
import type { ColorEntry, PinterestPin } from "@/db/schema";
import DesignCheckBanner from "@/components/wizard/DesignCheckBanner";

type Props = {
  state: WizardState;
  /** Jump back to a specific step (rendered as "Edit" links in each section). */
  goToStep: (id: WizardStepId) => void;
  /**
   * The same patch setter every other step takes. Optional because Review was
   * read-only before swapping existed: without it the board still renders, it
   * just isn't editable. With it, clicking an image replaces it in place.
   */
  setState?: (patch: Partial<WizardState>) => void;
};

/** How many alternatives the inline picker shows before "More options". */
const PICKER_PAGE = 12;

export default function ReviewStep({ state, goToStep, setState }: Props) {
  const industry = state.industryId ? getIndustry(state.industryId) : null;
  const spaceLabel =
    industry?.spaces.find((s) => s.id === state.spaceId)?.label ?? null;
  // The headline name for the space: a picked space, else the typed "Other"
  // project type, else the free-text description.
  const primary =
    spaceLabel ?? state.customIndustry?.trim() ?? state.spaceDescription ?? null;
  // In Quick mode everything after Colours is designed for the user by the AI,
  // so we don't show empty "pick this" category sections here.
  const isQuick = state.mode === "quick";

  // Ranking input for the swap pools. Memoised so a re-render (a swap, the
  // design check landing) doesn't rebuild an open picker's pool from scratch.
  const paletteHexes = useMemo(
    () => (state.palette ?? []).map((c) => c.hex),
    [state.palette],
  );

  // Vibe swaps must come from the SAME set the Vibe step offered — the
  // per-industry vibe board — not the generic category pool, or the
  // alternatives would be for a different project type than the picks.
  const vibePool = useMemo(() => {
    const set =
      (state.industryId && CURATED_VIBE[state.industryId]) || CURATED_PINS.vibe;
    const clean = usableOnly(set ?? []);
    return clean.length > 0 ? clean : set ?? [];
  }, [state.industryId]);

  const subSections = useMemo(
    () => state.furnitureSubSections ?? [],
    [state.furnitureSubSections],
  );

  // Every furniture pick across every sub-section: swapping inside "Bed" must
  // not offer an image already sitting in "Wardrobe", or the brief shows the
  // same photograph twice.
  const allFurniturePins = useMemo(
    () => subSections.flatMap((s) => s.pins ?? []),
    [subSections],
  );

  /** Swap one pin for another, leaving the rest of the picks in their order. */
  const replaceAt = (
    pins: PinterestPin[],
    index: number,
    next: PinterestPin,
  ): PinterestPin[] => pins.map((p, i) => (i === index ? next : p));

  /** Build an onReplace handler for a simple single-list category. */
  const replacer = (
    pins: PinterestPin[],
    write: (next: PinterestPin[]) => Partial<WizardState>,
  ) =>
    setState
      ? (index: number, pin: PinterestPin) =>
          setState(write(replaceAt(pins, index, pin)))
      : undefined;

  return (
    <div className="space-y-8">
      <p className="text-[14px] text-txt-2">
        One last look, laid out the way the brief will read. Tap any image to
        swap it for another reference, with no need to go back a step. Nothing
        is locked in until you generate the plan.
      </p>

      {/* AI design check — coherence reading across all picks */}
      <DesignCheckBanner state={state} />

      {/* Space */}
      <ReviewSection
        label="Space"
        onEdit={isQuick ? undefined : () => goToStep("space")}
        isEmpty={!industry}
      >
        {industry ? (
          <p className="text-[15px] text-txt">
            <span className="text-acc">{primary ?? industry.label}</span>
            {/* Show the industry label alongside a distinct space name, but not
                for freeform "Other" (whose label IS the typed project type). */}
            {primary && !industry.freeform && (
              <span className="text-txt-3"> · {industry.label}</span>
            )}
            {state.spaceSize && (
              <>
                <span className="text-txt-3"> · </span>
                <span className="text-txt-2">
                  {sizeLabel(state.spaceSize)}
                </span>
              </>
            )}
          </p>
        ) : null}
        {state.spaceDescription && state.spaceDescription !== primary && (
          <p className="mt-3 text-[13px] leading-relaxed text-txt-2">
            {state.spaceDescription}
          </p>
        )}
      </ReviewSection>

      {/* Vibe */}
      <ReviewSection
        label="Vibe"
        onEdit={() => goToStep("vibe")}
        isEmpty={(state.vibePins?.length ?? 0) === 0}
      >
        <SwapBoard
          pins={state.vibePins ?? []}
          categoryKey="vibe"
          curatedPool={vibePool}
          vibe={state.vibeQuery}
          paletteHexes={paletteHexes}
          spaceId={state.industryId}
          taken={state.vibePins ?? []}
          onReplace={replacer(state.vibePins ?? [], (next) => ({
            vibePins: next,
          }))}
        />
      </ReviewSection>

      {/* Colors */}
      <ReviewSection
        label="Colors"
        onEdit={() => goToStep("colors")}
        isEmpty={!state.palette || state.palette.length === 0}
      >
        <ColorSwatchRow
          palette={state.palette ?? []}
          weights={state.paletteWeights}
        />
      </ReviewSection>

      {isQuick ? (
        /* Quick mode: everything below is designed automatically. */
        <section className="border-t border-bdr-2 pt-6">
          <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
            Furniture · Lighting · Flooring · Ceiling · Materials
          </h2>
          <p className="text-[13px] leading-relaxed text-txt-2">
            Designed for you automatically from your space, vibe, and colours
            when you generate. Want to hand-pick every piece yourself? Start
            again from the homepage and choose{" "}
            <span className="text-acc">Full Studio</span>.
          </p>
        </section>
      ) : (
        <>
          {/* Furniture — one board per AI sub-section, named, so the review
              reads the way the furniture step did. */}
          {subSections.length === 0 ? (
            <ReviewSection
              label="Furniture"
              onEdit={() => goToStep("furniture")}
              isEmpty
            >
              {null}
            </ReviewSection>
          ) : (
            subSections.map((sub, i) => (
              <ReviewSection
                key={sub.name + i}
                label={`Furniture · ${sub.name}`}
                onEdit={() => goToStep("furniture")}
                isEmpty={(sub.pins?.length ?? 0) === 0}
              >
                <SwapBoard
                  pins={sub.pins ?? []}
                  categoryKey="furniture"
                  vibe={state.vibeQuery}
                  paletteHexes={paletteHexes}
                  spaceId={state.industryId}
                  taken={allFurniturePins}
                  onReplace={
                    setState
                      ? (index, pin) =>
                          setState({
                            furnitureSubSections: subSections.map((s, j) =>
                              j === i
                                ? {
                                    ...s,
                                    pins: replaceAt(s.pins ?? [], index, pin),
                                  }
                                : s,
                            ),
                          })
                      : undefined
                  }
                />
              </ReviewSection>
            ))
          )}

          {/* Lighting */}
          <ReviewSection
            label="Lighting"
            onEdit={() => goToStep("lighting")}
            isEmpty={(state.lightingPins?.length ?? 0) === 0}
          >
            <SwapBoard
              pins={state.lightingPins ?? []}
              categoryKey="lighting"
              vibe={state.vibeQuery}
              paletteHexes={paletteHexes}
              spaceId={state.industryId}
              taken={state.lightingPins ?? []}
              onReplace={replacer(state.lightingPins ?? [], (next) => ({
                lightingPins: next,
              }))}
            />
          </ReviewSection>

          {/* Flooring */}
          <ReviewSection
            label="Flooring"
            onEdit={() => goToStep("flooring")}
            isEmpty={(state.flooringPins?.length ?? 0) === 0}
          >
            <SwapBoard
              pins={state.flooringPins ?? []}
              categoryKey="flooring"
              vibe={state.vibeQuery}
              paletteHexes={paletteHexes}
              spaceId={state.industryId}
              taken={state.flooringPins ?? []}
              onReplace={replacer(state.flooringPins ?? [], (next) => ({
                flooringPins: next,
              }))}
            />
          </ReviewSection>

          {/* Ceiling */}
          <ReviewSection
            label="Ceiling"
            onEdit={() => goToStep("ceiling")}
            isEmpty={(state.ceilingPins?.length ?? 0) === 0}
          >
            <SwapBoard
              pins={state.ceilingPins ?? []}
              categoryKey="ceiling"
              vibe={state.vibeQuery}
              paletteHexes={paletteHexes}
              spaceId={state.industryId}
              taken={state.ceilingPins ?? []}
              onReplace={replacer(state.ceilingPins ?? [], (next) => ({
                ceilingPins: next,
              }))}
            />
          </ReviewSection>

          {/* Materials */}
          <ReviewSection
            label="Materials"
            onEdit={() => goToStep("materials")}
            isEmpty={(state.materialsPins?.length ?? 0) === 0}
          >
            <SwapBoard
              pins={state.materialsPins ?? []}
              categoryKey="materials"
              vibe={state.vibeQuery}
              paletteHexes={paletteHexes}
              spaceId={state.industryId}
              taken={state.materialsPins ?? []}
              onReplace={replacer(state.materialsPins ?? [], (next) => ({
                materialsPins: next,
              }))}
            />
          </ReviewSection>
        </>
      )}

      {/* "Generate" disabled-note */}
      <div className="border border-bdr-2 bg-bg-2 p-6 backdrop-blur-sm">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
          Next up
        </p>
        <p className="mt-3 text-[14px] leading-relaxed text-txt-2">
          Hitting <span className="text-acc">Generate brief →</span> builds the
          full plan: a check that your picks work together, colour analysis, the
          story of how the space should feel, and the mood board images. About
          15 to 20 seconds.
        </p>
      </div>
    </div>
  );
}

/* ─── Sub-components ───────────────────────────────────────────────────── */

function ReviewSection({
  label,
  onEdit,
  isEmpty,
  children,
}: {
  label: string;
  /** Omit to hide the Edit link (e.g. Space in Quick mode, fixed on the homepage). */
  onEdit?: () => void;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-bdr-2 pt-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
          {label}
        </h2>
        {onEdit && (
          <button
            onClick={onEdit}
            className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-txt-2 transition hover:text-acc"
          >
            Edit →
          </button>
        )}
      </div>
      {isEmpty ? (
        <p className="text-[13px] italic text-txt-3">
          Not picked yet. Go back and finish this step.
        </p>
      ) : (
        children
      )}
    </section>
  );
}

/**
 * A board tile is ~270px in the three-column desktop layout and ~157px on a
 * phone — 736 and 474 respectively once retina is accounted for. The tiles
 * used to render the stored URL as-is, which left curated picks (stored at
 * 474) soft on desktop and scraped picks (736) oversized on a phone.
 */
const BOARD_SIZES = "(min-width: 896px) 270px, (min-width: 768px) 30vw, 45vw";

/**
 * One category's picks as a masonry board, with click-to-swap.
 *
 * CSS multi-column is the whole masonry implementation — no library, no
 * measuring pass. `break-inside-avoid` stops a tile splitting across a column
 * boundary, and the images carry no aspect box so a tall pendant shot stays
 * tall. Two columns on phones so nothing has to shrink below ~160px wide.
 */
function SwapBoard({
  pins,
  categoryKey,
  curatedPool,
  vibe,
  paletteHexes,
  spaceId,
  taken,
  onReplace,
}: {
  pins: PinterestPin[];
  /** Curated pool key (vibe, furniture, lighting, flooring, ceiling, materials). */
  categoryKey: string;
  /** Explicit pool — wins over `categoryKey`, used by Vibe (see above). */
  curatedPool?: CuratedPin[];
  vibe?: string;
  paletteHexes: string[];
  spaceId?: string | null;
  /** Picks that must not be offered again (this board's, plus its siblings'). */
  taken: PinterestPin[];
  /** Absent ≡ read-only board. */
  onReplace?: (index: number, pin: PinterestPin) => void;
}) {
  // Which tile's picker is open. One at a time — a review page covered in open
  // pickers is worse than the grid it replaced.
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [shown, setShown] = useState(PICKER_PAGE);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Click-away and Escape both cancel. The picker is a light-touch panel, not a
  // modal, so it must never trap someone who opened it by accident.
  useEffect(() => {
    if (openIndex === null) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpenIndex(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIndex(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openIndex]);

  // Only built once a tile is actually open — ranking a category pool on mount
  // for eight boards would be work nobody asked for.
  const alternatives = useMemo(() => {
    if (openIndex === null) return [];
    const pool =
      curatedPool ??
      buildCategoryPool(categoryKey, { vibe, paletteHexes, spaceId });
    const usedIds = new Set(taken.map((p) => p.id));
    const usedUrls = new Set(taken.map((p) => p.imageUrl));
    return pool.filter((c) => !usedIds.has(c.id) && !usedUrls.has(c.imageUrl));
  }, [openIndex, curatedPool, categoryKey, vibe, paletteHexes, spaceId, taken]);

  return (
    <div ref={wrapRef}>
      <div className="columns-2 gap-3 md:columns-3">
        {pins.map((pin, i) => {
          const isOpen = i === openIndex;
          const label = pin.altText || pin.title || "Reference";
          const frame = `mb-3 block w-full break-inside-avoid overflow-hidden border transition ${
            isOpen ? "border-acc ring-2 ring-acc" : "border-bdr-2"
          }`;

          if (!onReplace) {
            return (
              <div key={pin.id + i} className={frame}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pinAt(pin.imageUrl, 736)}
                  srcSet={pinSrcSet(pin.imageUrl, [474, 736])}
                  sizes={BOARD_SIZES}
                  alt={label}
                  loading="lazy"
                  decoding="async"
                  className="w-full"
                />
              </div>
            );
          }

          return (
            <button
              key={pin.id + i}
              type="button"
              onClick={() => {
                setOpenIndex(isOpen ? null : i);
                setShown(PICKER_PAGE);
              }}
              aria-label={`Swap ${label}`}
              className={`group relative ${frame} hover:border-acc`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pinAt(pin.imageUrl, 736)}
                srcSet={pinSrcSet(pin.imageUrl, [474, 736])}
                sizes={BOARD_SIZES}
                alt={label}
                loading="lazy"
                decoding="async"
                className="w-full transition group-hover:opacity-85"
              />
              <span
                className={`absolute inset-x-0 bottom-0 bg-bg/85 py-1.5 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-acc transition ${
                  isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                {isOpen ? "Pick below" : "Swap"}
              </span>
            </button>
          );
        })}
      </div>

      {/* The picker sits under the board rather than inside a column — a panel
          spliced into a multi-column flow gets torn in half by the columns. */}
      {onReplace && openIndex !== null && (
        <div className="border border-acc/40 bg-bg-2 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
              Swap for…
            </p>
            <button
              type="button"
              onClick={() => setOpenIndex(null)}
              className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-txt-3 transition hover:text-acc"
            >
              Cancel ✕
            </button>
          </div>

          {alternatives.length === 0 ? (
            <p className="text-[13px] italic text-txt-3">
              Nothing else left in this set. Use Edit → to search for more.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {alternatives.slice(0, shown).map((c) => (
                  <button
                    /* The pool dedupes on URL, not id — key on both so two
                       entries sharing an id can't collide. */
                    key={c.id + c.imageUrl}
                    type="button"
                    onClick={() => {
                      onReplace(openIndex, toPin(c));
                      setOpenIndex(null);
                    }}
                    className="aspect-[3/4] overflow-hidden border border-bdr-2 transition hover:border-acc"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumb(c.imageUrl)}
                      alt={c.title || "reference"}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
              {shown < alternatives.length && (
                <div className="mt-3 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShown((s) => s + PICKER_PAGE)}
                    className="border border-bdr-2 px-5 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-txt-2 transition hover:border-acc hover:text-acc"
                  >
                    More options
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ColorSwatchRow({
  palette,
  weights,
}: {
  palette: ColorEntry[];
  weights?: number[];
}) {
  if (palette.length === 0) return null;
  const textOn = (hex: string) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return "#2a2a28";
    const n = parseInt(m[1], 16);
    const lum =
      0.299 * ((n >> 16) & 255) +
      0.587 * ((n >> 8) & 255) +
      0.114 * (n & 255);
    return lum > 150 ? "#2a2a28" : "#f4f2ec";
  };
  const grow = (i: number) =>
    weights && weights.length === palette.length
      ? Math.max(weights[i] ?? 0, 0.08)
      : 1;
  return (
    <div className="flex h-16 w-full overflow-hidden rounded-lg border border-bdr-2">
      {palette.map((c, i) => (
        <div
          key={i}
          className="relative min-w-0"
          style={{ flexGrow: grow(i), flexBasis: 0, backgroundColor: c.hex }}
        >
          <span
            className="absolute inset-x-0 bottom-1 text-center font-mono text-[9px] uppercase"
            style={{ color: textOn(c.hex) }}
          >
            {c.hex.toUpperCase()}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Curated pin → the PinterestPin shape wizard state stores. Mirrors
 * PinterestGrid's `toPin`: the brief, the mood board and the PDF all read
 * `pin.imageUrl`, so a swapped-in image has to carry the whole shape, not a
 * bare URL, or it silently drops out of the export.
 */
function toPin(c: CuratedPin): PinterestPin {
  return {
    id: c.id,
    url: "",
    title: c.title,
    description: "",
    altText: c.title,
    imageUrl: c.imageUrl,
    imageThumbUrl: c.imageUrl,
    dominantColor: c.dominantColor,
    boardName: "",
    boardUrl: "",
  };
}

/** Picker thumbnails sit in a ~153px cell on desktop, so 474 is the smallest
 *  variant a retina screen can use without softening. Same call the curated
 *  picker makes. */
function thumb(url: string): string {
  return pinAt(url, 474);
}

function sizeLabel(size: NonNullable<WizardState["spaceSize"]>): string {
  switch (size) {
    case "small":
      return "Small";
    case "medium":
      return "Medium";
    case "large":
      return "Large";
    case "xl":
      return "Extra large";
  }
}
