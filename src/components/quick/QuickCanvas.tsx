"use client";

/**
 * QuickCanvas — the single-scroll Quick flow.
 *
 *   Setup madlib → Vibe (search + picks) → Palette, with a sticky Live brief
 *   on the right. Stages reveal as prerequisites are met. "Generate" posts to
 *   the same /api/ai/generate-brief the wizard uses and shows the finished
 *   brief.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { INDUSTRIES, getIndustry } from "@/lib/concept-taxonomy";
import { findIndustryByLabel } from "@/lib/space-taxonomy";
import { EMPTY_QUICK, type QuickState } from "@/lib/quick-state";
import { generateBrief } from "@/lib/generate-brief-client";
import { selectCategoryImages, AUTO_CATEGORIES } from "@/lib/select-images";
import type { GenerateBriefResponse } from "@/lib/ai/prompts/generate-brief";
import type { PinterestPin } from "@/db/schema";
import SetupStage from "./SetupStage";
import VibeStage from "./VibeStage";
import PaletteStage from "./PaletteStage";
import LiveBrief, { type PrimaryAction } from "./LiveBrief";
import GenerationOverlay from "@/components/wizard/GenerationOverlay";
import BriefDisplay, { type BriefPins } from "@/components/wizard/BriefDisplay";

/** Map a homepage industry LABEL or id (?industry=) back to a concept id.
 *  Forgiving: exact label, exact id, or a sensible prefix (so "Healthcare"
 *  resolves to "Healthcare & Wellness"). */
function idFromLabel(label: string | null): string | null {
  if (!label) return null;
  const p = label.trim().toLowerCase();
  if (!p) return null;
  const hit = INDUSTRIES.find(
    (i) =>
      i.label.toLowerCase() === p ||
      i.id === p ||
      i.label.toLowerCase().startsWith(p) ||
      p.startsWith(i.id),
  );
  return hit?.id ?? null;
}

export default function QuickCanvas() {
  const params = useSearchParams();

  const [state, setState] = useState<QuickState>(() => ({
    ...EMPTY_QUICK,
    industryId: idFromLabel(params.get("industry")),
    spec: params.get("spec")?.trim() ?? "",
    vibeQuery: params.get("vibe")?.trim() ?? "",
  }));

  const patch = useCallback(
    (p: Partial<QuickState>) => setState((prev) => ({ ...prev, ...p })),
    [],
  );

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "generating" | "done" | "error">(
    "idle",
  );
  const [brief, setBrief] = useState<GenerateBriefResponse | null>(null);
  const [categoryPins, setCategoryPins] = useState<BriefPins>({});
  const [genError, setGenError] = useState<string | null>(null);

  const vibeRef = useRef<HTMLDivElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);

  const vibeOpen = !!state.industryId && state.spec.trim().length >= 2;

  // If the vibe stage collapses (spec cleared / industry changed), the palette
  // stage must close too — otherwise it'd float with no vibe above it and let
  // a stale palette through to Generate.
  useEffect(() => {
    if (!vibeOpen && paletteOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPaletteOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vibeOpen]);

  function revealPalette() {
    setPaletteOpen(true);
    setTimeout(
      () => paletteRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      120,
    );
  }

  const generate = useCallback(async () => {
    setStatus("generating");
    setGenError(null);
    setCategoryPins({});
    try {
      const ind = getIndustry(state.industryId);
      const paletteHexes = state.palette
        .map((c) => c.hex)
        .filter((h) => /^#[0-9a-f]{6}$/i.test(h));

      // 1. Choose the reference images FIRST, so the AI can describe the same
      //    materials and fittings the user will see next to its words. (Doing
      //    this after the call left the text and the pictures unrelated.)
      const spaceId = ind ? findIndustryByLabel(ind.label)?.id ?? null : null;
      const selected = AUTO_CATEGORIES.map((cat) => ({
        cat,
        pins: selectCategoryImages(cat, {
          vibe: state.vibeQuery,
          paletteHexes,
          spaceId,
          // The deck spends ~52 images across ten spreads and never repeats
          // one, so each category has to supply more than it shows.
          count: 12,
        }),
      }));

      const titles = (cat: string) =>
        selected
          .find((s) => s.cat === cat)
          ?.pins.map((p) => p.title?.trim())
          .filter((t): t is string => !!t)
          .slice(0, 4) ?? [];

      const pins: BriefPins = {};
      for (const { cat, pins: list } of selected) {
        pins[cat] = list.map((p) => ({
          ...p,
          url: p.imageUrl,
        })) as unknown as PinterestPin[];
      }
      setCategoryPins(pins);

      // 2. Generate the brief against those exact references.
      const data = await generateBrief({
        industry: ind?.label,
        space: state.spec || undefined,
        spaceDescription: state.spec || undefined,
        spaceSize: [
          state.areaSqm ? `${state.areaSqm} m² floor area` : null,
          state.hasOutdoor ? "includes outdoor space" : null,
        ]
          .filter(Boolean)
          .join(", ") || undefined,
        vibeQuery: state.vibeQuery || undefined,
        vibePinTitles: state.picks
          .map((p) => p.title?.trim())
          .filter((t): t is string => !!t)
          .slice(0, 5),
        palette: paletteHexes.map((hex) => ({ hex })),
        furnitureSubSections: [
          { name: "Furniture", query: "furniture", pinTitles: titles("furniture") },
        ],
        lightingPinTitles: titles("lighting"),
        flooringPinTitles: titles("flooring"),
        ceilingPinTitles: titles("ceiling"),
        materialsPinTitles: titles("materials"),
      });
      setBrief(data);
      setStatus("done");
    } catch (e) {
      setGenError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }, [state]);

  function startOver() {
    setState(EMPTY_QUICK);
    setPaletteOpen(false);
    setBrief(null);
    setCategoryPins({});
    setStatus("idle");
    setGenError(null);
    window.scrollTo({ top: 0 });
  }

  // Finished brief replaces the canvas.
  if (status === "done" && brief) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12 sm:px-8 sm:py-16">
        <BriefDisplay
          brief={brief}
          facts={{
            projectName: state.spec
              ? state.spec.charAt(0).toUpperCase() + state.spec.slice(1)
              : undefined,
            industry: getIndustry(state.industryId)?.label,
            areaSqm: state.areaSqm,
            hasOutdoor: state.hasOutdoor,
            style: state.vibeQuery || undefined,
          }}
          pins={{
            // The user's own vibe picks, then the AI-selected reference images
            // per category (curated pins carry no source URL → link the image).
            vibe: state.picks.map((p) => ({
              ...p,
              url: p.imageUrl,
            })) as unknown as PinterestPin[],
            ...categoryPins,
          }}
          onRegenerate={generate}
          onStartOver={startOver}
        />
      </main>
    );
  }

  const action: PrimaryAction | null =
    paletteOpen
      ? {
          label: "Generate brief",
          onClick: generate,
          disabled: state.palette.length === 0,
          reason: state.palette.length === 0 ? "Building your palette…" : null,
        }
      : vibeOpen
        ? {
            label: "Continue to palette",
            onClick: revealPalette,
            disabled: state.picks.length < 3,
            reason:
              state.picks.length < 3
                ? `Pick ${3 - state.picks.length} more image${
                    state.picks.length === 2 ? "" : "s"
                  } to continue`
                : null,
          }
        : null;

  return (
    <>
      {status === "generating" && <GenerationOverlay />}

      <main className="mx-auto max-w-[1240px] px-6 pb-32 pt-10 sm:px-8">
        {status === "error" && genError && (
          <div className="mb-8 border border-rose-700/50 bg-rose-950/30 p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-rose-300">
              Generation failed
            </p>
            <p className="mt-2 text-[13px] text-txt-2">{genError}</p>
            <button
              onClick={generate}
              className="mt-3 text-[12px] text-rose-200 underline underline-offset-2 hover:text-rose-100"
            >
              Try again
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            <SetupStage state={state} patch={patch} />

            {vibeOpen && (
              <div ref={vibeRef} className="mt-4">
                <VibeStage state={state} patch={patch} />
              </div>
            )}

            {paletteOpen && (
              <div ref={paletteRef} className="mt-4">
                <PaletteStage state={state} patch={patch} />
              </div>
            )}
          </div>

          <LiveBrief state={state} action={action} />
        </div>
      </main>
    </>
  );
}
