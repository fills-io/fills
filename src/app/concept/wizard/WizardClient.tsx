"use client";

/**
 * Client-side wizard controller.
 *
 * Holds the current step + the in-progress brief in React state and renders
 * the matching step component (or a placeholder for steps that haven't been
 * ported yet). Back / Next buttons move between steps.
 *
 * Query params from the homepage (`?mode=`, `?industry=`, `?spec=`, `?vibe=`)
 * are consumed once on mount to pre-seed the Space step's industry. Once the
 * AI auto-fill lands (Quick mode), the spec and vibe inputs will seed
 * subsequent steps too.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { WIZARD_STEPS, type WizardStepId } from "@/lib/wizard-steps";
import { findIndustryByLabel, getIndustry } from "@/lib/space-taxonomy";
import {
  type WizardState,
  EMPTY_WIZARD_STATE,
} from "@/lib/wizard-state";
import { clearDraft, loadDraft, saveDraft } from "@/lib/wizard-storage";
import { saveBrief } from "@/lib/save-brief";
import ShareBar from "@/components/wizard/ShareBar";
import type { GenerateBriefResponse } from "@/lib/ai/prompts/generate-brief";
import WizardProgress from "@/components/wizard/WizardProgress";
import SpaceStep from "@/components/wizard/steps/SpaceStep";
import VibeStep from "@/components/wizard/steps/VibeStep";
import ColorsStep from "@/components/wizard/steps/ColorsStep";
import FurnitureStep from "@/components/wizard/steps/FurnitureStep";
import LightingStep from "@/components/wizard/steps/LightingStep";
import FlooringStep from "@/components/wizard/steps/FlooringStep";
import CeilingStep from "@/components/wizard/steps/CeilingStep";
import MaterialsStep from "@/components/wizard/steps/MaterialsStep";
import ReviewStep from "@/components/wizard/steps/ReviewStep";
import BriefDisplay from "@/components/wizard/BriefDisplay";
import GenerationOverlay from "@/components/wizard/GenerationOverlay";

/** The only steps Quick mode walks — everything else is auto-designed, and it
 *  generates straight from Colours (no separate Review step). */
const QUICK_STEP_IDS = ["vibe", "colors"] as const;

/** The wizard's picks, in the shape the brief view and the saved copy use. */
function briefPins(state: WizardState) {
  return {
    vibe: state.vibePins,
    // Furniture is picked per sub-section; the brief shows one reference row.
    furniture: (state.furnitureSubSections ?? []).flatMap((s) => s.pins ?? []),
    lighting: state.lightingPins,
    flooring: state.flooringPins,
    ceiling: state.ceilingPins,
    materials: state.materialsPins,
  };
}

export default function WizardClient() {
  const [current, setCurrent] = useState<WizardStepId>("space");
  const [wizardState, setWizardState] = useState<WizardState>(EMPTY_WIZARD_STATE);
  const [resumedAt, setResumedAt] = useState<Date | null>(null);
  /** Set after the initial hydration so we don't overwrite localStorage with
   *  the empty default state before we've had a chance to read from it. */
  const hydrated = useRef(false);

  // Generation flow state. While generating, we show an overlay; on
  // success we replace the wizard chrome with the BriefDisplay.
  const [generationStatus, setGenerationStatus] = useState<
    "idle" | "generating" | "done" | "error"
  >("idle");
  const [generatedBrief, setGeneratedBrief] =
    useState<GenerateBriefResponse | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);

  const params = useSearchParams();

  // ── Hydrate on mount ───────────────────────────────────────────────────
  // Priority: fresh homepage inputs (start a new brief, skip Space) > saved
  // draft (resume) > partial URL seed > empty.
  useEffect(() => {
    const industryParam = params.get("industry");
    const specParam = params.get("spec")?.trim();
    const vibeParam = params.get("vibe")?.trim();
    const pathParam = params.get("path");
    const matched = industryParam ? findIndustryByLabel(industryParam) : null;
    const quickStart = !!(matched && specParam && vibeParam);

    // Seeding state once from the URL / saved draft on mount is a legitimate
    // hydration effect (external -> React), which the set-state-in-effect rule
    // over-eagerly flags.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (quickStart) {
      // Arrived from the homepage "Build my brief" with everything answered.
      // Start THIS brief (replacing any old draft) and skip the Space step,
      // since project type + space were already picked on the homepage.
      clearDraft();
      setWizardState({
        mode: "quick",
        industryId: matched.id,
        spaceDescription: specParam,
        vibeQuery: vibeParam,
      });
      setCurrent("vibe");
    } else {
      const saved = loadDraft();
      if (saved) {
        // An explicit "Full Studio" entry (?path=full) overrides a stale
        // "quick" mode saved in the draft, so it opens the full 9-step flow.
        setWizardState(
          pathParam === "full"
            ? { ...saved.state, mode: "full" }
            : saved.state,
        );
        setResumedAt(saved.savedAt);
      } else if (matched || specParam || vibeParam) {
        setWizardState((prev) => ({
          ...prev,
          ...(pathParam === "full" ? { mode: "full" } : {}),
          ...(matched ? { industryId: matched.id } : {}),
          ...(specParam ? { spaceDescription: specParam } : {}),
          ...(vibeParam ? { vibeQuery: vibeParam } : {}),
        }));
      }
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist to localStorage whenever wizardState changes ───────────────
  // Only runs after hydration, otherwise the initial EMPTY_WIZARD_STATE
  // render would clobber any saved draft before we read it.
  useEffect(() => {
    if (!hydrated.current) return;
    saveDraft(wizardState);
  }, [wizardState]);

  // Quick mode auto-fills everything after Vibe, so it only walks
  // Vibe → Colours → Review. Full mode walks all nine steps.
  const visibleSteps =
    wizardState.mode === "quick"
      ? WIZARD_STEPS.filter((s) =>
          QUICK_STEP_IDS.includes(s.id as (typeof QUICK_STEP_IDS)[number]),
        )
      : WIZARD_STEPS;

  // Never strand `current` outside the visible flow. This happens when a quick
  // draft is resumed (its saved step was "Space", which quick mode hides) — we
  // snap forward to the first visible step so the user is never trapped.
  useEffect(() => {
    if (!hydrated.current) return;
    if (!visibleSteps.some((s) => s.id === current)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrent(visibleSteps[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizardState.mode, current]);

  const step = WIZARD_STEPS.find((s) => s.id === current)!;
  const visIdx = visibleSteps.findIndex((s) => s.id === current);
  const idx = visIdx + 1; // 1-based position within the visible flow
  const total = visibleSteps.length;
  const isFirst = visIdx <= 0;
  const isLast = visIdx === total - 1;

  /** Merge a partial update into the wizard state. */
  function patchState(patch: Partial<WizardState>) {
    setWizardState((prev) => ({ ...prev, ...patch }));
  }

  /** Can the user advance from the current step? */
  function canAdvance(): boolean {
    switch (current) {
      case "space": {
        // Space step: project type required, plus either a specific space
        // (one or more) or, for "Other", a free-text project description.
        if (!wizardState.industryId) return false;
        const ind = getIndustry(wizardState.industryId);
        if (ind?.freeform) return !!wizardState.customIndustry?.trim();
        return (wizardState.spaceIds?.length ?? 0) > 0 || !!wizardState.spaceId;
      }
      case "vibe":
        // Vibe step: at least 3 pins picked (max 5 enforced by the grid).
        return (wizardState.vibePins?.length ?? 0) >= 3;
      case "colors":
        // Colors step: any non-default-only palette is OK to advance.
        // (We don't require all 4 names filled — that's a stylistic choice.)
        return true;
      case "furniture": {
        const subSections = wizardState.furnitureSubSections ?? [];
        // Need at least one pin total across all sub-sections.
        const totalPins = subSections.reduce(
          (sum, s) => sum + (s.pins?.length ?? 0),
          0,
        );
        return totalPins > 0;
      }
      case "lighting":
        return (wizardState.lightingPins?.length ?? 0) > 0;
      case "flooring":
        return (wizardState.flooringPins?.length ?? 0) > 0;
      case "ceiling":
        return (wizardState.ceilingPins?.length ?? 0) > 0;
      case "materials":
        return (wizardState.materialsPins?.length ?? 0) > 0;
      default:
        // Placeholder steps don't gate Next yet — fill this in per step.
        return true;
    }
  }

  function goBack() {
    if (visIdx > 0) setCurrent(visibleSteps[visIdx - 1].id);
  }

  function goNext() {
    if (!canAdvance()) return;
    if (visIdx >= 0 && visIdx < visibleSteps.length - 1) {
      setCurrent(visibleSteps[visIdx + 1].id);
    }
  }

  // ── Generation flow ────────────────────────────────────────────────────
  // Called from Step 9's "Generate brief →" button. Posts a summary of
  // the wizard state to /api/ai/generate-brief, then either renders the
  // result or surfaces an error.
  const generateBrief = useCallback(async () => {
    setGenerationStatus("generating");
    setGenerationError(null);

    const industry = wizardState.industryId
      ? getIndustry(wizardState.industryId)
      : null;
    const isOther = !!industry?.freeform;
    const spaceIds =
      wizardState.spaceIds ??
      (wizardState.spaceId ? [wizardState.spaceId] : []);
    const industryLabel = isOther
      ? wizardState.customIndustry?.trim() || "Other"
      : industry?.label;
    const spaceLabel = isOther
      ? wizardState.customIndustry?.trim()
      : spaceIds
          .map((id) => industry?.spaces.find((s) => s.id === id)?.label)
          .filter(Boolean)
          .join(", ") || undefined;
    const titleList = (pins?: { title?: string }[]) =>
      (pins ?? [])
        .map((p) => p.title?.trim())
        .filter((t): t is string => !!t && t.length > 0)
        .slice(0, 5);

    const body = {
      industry: industryLabel,
      space: spaceLabel,
      spaceDescription: wizardState.spaceDescription,
      spaceSize: wizardState.spaceSize,
      vibeQuery: wizardState.vibeQuery,
      vibePinTitles: titleList(wizardState.vibePins),
      palette: wizardState.palette
        ?.filter((c) => /^#[0-9a-f]{6}$/i.test(c.hex))
        .map((c) => ({
          hex: c.hex,
          name: c.name || undefined,
          material: c.material || undefined,
        })),
      furnitureSubSections: (wizardState.furnitureSubSections ?? [])
        .filter((s) => (s.pins?.length ?? 0) > 0)
        .map((s) => ({
          name: s.name,
          query: s.query,
          pinTitles: titleList(s.pins),
        })),
      lightingPinTitles: titleList(wizardState.lightingPins),
      flooringPinTitles: titleList(wizardState.flooringPins),
      ceilingPinTitles: titleList(wizardState.ceilingPins),
      materialsPinTitles: titleList(wizardState.materialsPins),
    };

    try {
      const response = await fetch("/api/ai/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${response.status}`);
      }
      const data = (await response.json()) as GenerateBriefResponse;
      const industryLabel = wizardState.industryId
        ? getIndustry(wizardState.industryId)?.label
        : undefined;
      setGeneratedBrief(data);
      setGenerationStatus("done");

      // Give it a permanent address. Not awaited: a failed save must not hold
      // up a brief the user can already read.
      saveBrief({
        brief: data,
        pins: briefPins(wizardState),
        facts: { industry: industryLabel, style: wizardState.vibeQuery },
        spaceType: industryLabel ?? "unspecified",
        creationMode: "full",
      }).then(setShareToken);

      // The draft is spent. Leaving it behind greeted the user with "resume
      // your in-progress plan" on a brief they had already finished.
      clearDraft();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setGenerationError(message);
      setGenerationStatus("error");
    }
  }, [wizardState]);

  function startOver() {
    clearDraft();
    setWizardState(EMPTY_WIZARD_STATE);
    setGeneratedBrief(null);
    setGenerationStatus("idle");
    setGenerationError(null);
    setResumedAt(null);
    setShareToken(null);
    setCurrent("space");
  }

  // ── Final brief view (replaces the wizard chrome when done) ──────────
  if (generationStatus === "done" && generatedBrief) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12 sm:px-8 sm:py-16">
        <ShareBar token={shareToken} />
        <BriefDisplay
          brief={generatedBrief}
          pins={briefPins(wizardState)}
          onRegenerate={generateBrief}
          onStartOver={startOver}
        />
      </main>
    );
  }

  return (
    <>
      <WizardProgress
        current={current}
        onJump={setCurrent}
        steps={visibleSteps}
      />

      {/* Full-screen overlay during generation */}
      {generationStatus === "generating" && <GenerationOverlay />}

      <main className="mx-auto max-w-4xl px-6 py-12 sm:px-8 sm:py-16">
        {/* Generation error banner */}
        {generationStatus === "error" && generationError && (
          <div className="mb-8 border border-rose-700/50 bg-rose-950/30 p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-rose-300">
              Generation failed
            </p>
            <p className="mt-2 text-[13px] text-txt-2">{generationError}</p>
            <button
              onClick={generateBrief}
              className="mt-3 text-[12px] underline underline-offset-2 text-rose-200 hover:text-rose-100"
            >
              Try again
            </button>
          </div>
        )}

        {/* Resumed-draft banner */}
        {resumedAt && (
          <div className="mb-8 flex items-start gap-3 border border-acc/30 bg-[rgba(200,81,42,0.06)] p-4 text-[13px]">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-acc">
              Resumed
            </span>
            <p className="flex-1 text-txt-2">
              Picked up your in-progress plan from{" "}
              {formatRelative(resumedAt)}. Your work is saved automatically as
              you go.
            </p>
            <button
              onClick={startOver}
              className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-acc underline underline-offset-2 transition hover:text-acc-h"
            >
              Start fresh
            </button>
          </div>
        )}

        {/* Step heading */}
        <div className="mb-3 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
          <span className="inline-block h-px w-6 bg-acc" />
          Step {String(idx).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </div>

        {/* A step label, not the page title — the page's h1 lives in the
            server wrapper so crawlers see one heading, not nine. */}
        <h2 className="font-serif text-[clamp(32px,4.5vw,48px)] font-normal leading-[1.1] tracking-tight text-txt">
          {step.label}
        </h2>

        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-txt-2">
          {step.description}
        </p>

        {/* Step navigation — placed above the content so you can go Back / Next
            without scrolling past a long grid of images. */}
        <div className="mt-8 flex items-center justify-between gap-4 border-b border-bdr-2 pb-6">
          <div className="flex items-center gap-5">
            {isFirst ? (
              <Link
                href="/"
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-txt-3 transition hover:text-acc"
              >
                ← Home
              </Link>
            ) : (
              <button
                onClick={goBack}
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-txt-2 transition hover:text-acc"
              >
                ← Back
              </button>
            )}
            {(!isFirst || wizardState.industryId) && (
              <button
                onClick={() => {
                  if (
                    window.confirm("Start over? This clears your current brief.")
                  )
                    startOver();
                }}
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-txt-3 transition hover:text-acc"
              >
                Start over
              </button>
            )}
          </div>

          <button
            onClick={isLast ? generateBrief : goNext}
            disabled={!canAdvance() || generationStatus === "generating"}
            className="inline-flex items-center gap-2 bg-acc px-7 py-3.5 text-sm font-medium text-white transition hover:gap-3 hover:bg-acc-h disabled:cursor-not-allowed disabled:bg-bg-3 disabled:text-txt-3 disabled:opacity-70"
          >
            {isLast ? "Generate brief →" : "Next →"}
          </button>
        </div>

        {/* Step body */}
        <div className="mt-8">
          {current === "space" && (
            <SpaceStep state={wizardState} setState={patchState} />
          )}
          {current === "vibe" && (
            <VibeStep state={wizardState} setState={patchState} />
          )}
          {current === "colors" && (
            <ColorsStep state={wizardState} setState={patchState} />
          )}
          {current === "furniture" && (
            <FurnitureStep state={wizardState} setState={patchState} />
          )}
          {current === "lighting" && (
            <LightingStep state={wizardState} setState={patchState} />
          )}
          {current === "flooring" && (
            <FlooringStep state={wizardState} setState={patchState} />
          )}
          {current === "ceiling" && (
            <CeilingStep state={wizardState} setState={patchState} />
          )}
          {current === "materials" && (
            <MaterialsStep state={wizardState} setState={patchState} />
          )}
          {current === "review" && (
            <ReviewStep state={wizardState} goToStep={setCurrent} />
          )}
        </div>

      </main>
    </>
  );
}

/* ─── Sub-components ───────────────────────────────────────────────────── */

/** Compact "5 min ago" / "2 hours ago" / "yesterday" style. */
function formatRelative(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}
