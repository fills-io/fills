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
import {
  EMPTY_QUICK,
  QUICK_PALETTE_SIZE,
  type QuickState,
} from "@/lib/quick-state";
import { generateBrief } from "@/lib/generate-brief-client";
import { saveBrief } from "@/lib/save-brief";
import {
  clearQuickDraft,
  loadQuickDraft,
  quickDraftAge,
  saveQuickDraft,
} from "@/lib/quick-storage";
import { selectCategoryImages, AUTO_CATEGORIES } from "@/lib/select-images";
import type { GenerateBriefResponse } from "@/lib/ai/prompts/generate-brief";
import type { PinterestPin } from "@/db/schema";
import SetupStage from "./SetupStage";
import VibeStage from "./VibeStage";
import PaletteStage from "./PaletteStage";
import LiveBrief, { type PrimaryAction } from "./LiveBrief";
import GenerationOverlay from "@/components/wizard/GenerationOverlay";
import ShareBar from "@/components/wizard/ShareBar";
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

/**
 * The next step, pinned to the bottom of a phone screen.
 *
 * On mobile the Live brief panel unsticks and falls BELOW the image grid, so
 * the only way forward sat about 1.8 screens down with nothing to say it was
 * there. Above lg the sticky side panel already does this job.
 */
function MobileActionBar({ action }: { action: PrimaryAction | null }) {
  if (!action) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-bdr-2 bg-bg/95 px-5 py-3 backdrop-blur lg:hidden">
      <button
        type="button"
        onClick={action.onClick}
        disabled={action.disabled}
        className="w-full bg-acc px-5 py-3.5 text-[13px] font-medium uppercase tracking-[0.1em] text-white transition disabled:cursor-not-allowed disabled:opacity-45"
      >
        {action.label} →
      </button>
      {action.reason && (
        <p className="mt-2 text-center text-[11px] text-txt-3">{action.reason}</p>
      )}
    </div>
  );
}

/**
 * Proof that the uploaded images did something.
 *
 * Upload mode reads a palette out of the user's own photos and sends them
 * here. The palette step is gated behind project type and vibe, so without
 * this the user landed on an empty "choose industry" sentence with no sign
 * their images had been read at all — which is indistinguishable from the
 * feature being broken.
 */
function SeededPalette({ hexes }: { hexes: string[] }) {
  if (hexes.length === 0) return null;
  return (
    <div className="mb-8 flex flex-wrap items-center gap-3 border border-bdr-2 bg-bg-2 px-4 py-3">
      <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-acc">
        From your images
      </span>
      <div className="flex overflow-hidden rounded-sm border border-bdr-2">
        {hexes.map((hex) => (
          <span
            key={hex}
            title={hex.toUpperCase()}
            className="h-7 w-9"
            style={{ backgroundColor: hex }}
          />
        ))}
      </div>
      <p className="min-w-0 flex-1 text-[13px] text-txt-2">
        We read these colours from your photos. Tell us about the project and
        they carry through to your brief.
      </p>
    </div>
  );
}

export default function QuickCanvas() {
  const params = useSearchParams();

  // Arriving with ?industry=… from the homepage means the user has just told
  // us what they want, so that wins over anything saved earlier.
  //
  // ?palette= carries the colours Upload mode read out of the user's own
  // photos. Those are a real decision they have already made, so they arrive
  // locked — the palette step refines them rather than replacing them.
  const seededPalette = (params.get("palette") ?? "")
    .split(",")
    .map((h) => h.trim())
    .filter((h) => /^#[0-9a-f]{6}$/i.test(h))
    .slice(0, QUICK_PALETTE_SIZE);

  const fromUrl = {
    industryId: idFromLabel(params.get("industry")),
    spec: params.get("spec")?.trim() ?? "",
    vibeQuery: params.get("vibe")?.trim() ?? "",
    ...(seededPalette.length > 0
      ? {
          palette: seededPalette.map((hex) => ({ hex, name: "", material: "" })),
          locks: seededPalette.map(() => true),
        }
      : {}),
  };
  const [state, setState] = useState<QuickState>(() => {
    if (fromUrl.industryId || seededPalette.length > 0) {
      return { ...EMPTY_QUICK, ...fromUrl };
    }
    return loadQuickDraft() ?? { ...EMPTY_QUICK, ...fromUrl };
  });
  const [resumedAge] = useState<string | null>(() =>
    fromUrl.industryId || seededPalette.length > 0 ? null : quickDraftAge(),
  );

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
  const [shareToken, setShareToken] = useState<string | null>(null);

  // Keep the draft current. Writing on every change is cheap next to what it
  // protects, and there is nothing to save until a project type is chosen.
  useEffect(() => {
    if (status !== "idle" && status !== "error") return;
    if (!state.industryId) return;
    saveQuickDraft(state);
  }, [state, status]);

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

      // Give the brief a home. It used to live only in this tab, so a refresh
      // destroyed both the user's work and a paid model call. Deliberately not
      // awaited before showing the brief — a failed save must never hold up
      // something the user can already see.
      saveBrief({
        brief: data,
        pins,
        facts: {
          industry: ind?.label,
          areaSqm: state.areaSqm,
          hasOutdoor: state.hasOutdoor,
          style: state.vibeQuery,
        },
        spaceType: ind?.label ?? state.spec ?? "unspecified",
        creationMode: "quick",
      }).then(setShareToken);

      // The draft has served its purpose; keeping it would greet the user with
      // "resume your plan" on a brief they already finished.
      clearQuickDraft();
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
    setShareToken(null);
    clearQuickDraft();
    window.scrollTo({ top: 0 });
  }

  // Finished brief replaces the canvas.
  if (status === "done" && brief) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12 sm:px-8 sm:py-16">
        <ShareBar token={shareToken} />
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
        {status === "idle" && <SeededPalette hexes={seededPalette} />}

        {resumedAge && status === "idle" && (
          <div className="mb-8 flex flex-wrap items-center gap-3 border border-bdr-2 bg-bg-2 px-4 py-3">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-acc">
              Resumed
            </span>
            <p className="min-w-0 flex-1 text-[13px] text-txt-2">
              Picked up your plan from {resumedAge}. Your work is saved as you go.
            </p>
            <button
              type="button"
              onClick={startOver}
              className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-txt-3 underline underline-offset-2 transition hover:text-acc"
            >
              Start fresh
            </button>
          </div>
        )}

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

      <MobileActionBar action={action} />
    </>
  );
}
