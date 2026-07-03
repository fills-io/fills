"use client";

/**
 * FlowApp — the QuickFlow phase machine (ported from Fractional_QuickFlow).
 *
 * Quick path: project → vibe → color → theater → signup → concept → board.
 * Upload path enters at "upload" then converges at theater.
 *
 * Design-first build: stages render with placeholder imagery; real
 * Pinterest/AI wiring comes later. Theme-aware (day + night) via the global
 * html.theme-dark token system. Phases past "color" are stubbed pending the
 * next build increment.
 */

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import FillsLogo from "@/components/FillsLogo";
import ProjectStage from "./ProjectStage";
import VibeStage from "./VibeStage";
import ColorStage from "./ColorStage";
import LiveBrief from "./LiveBrief";
import Theater from "./Theater";
import SignupGate from "./SignupGate";
import ConceptPage from "./ConceptPage";
import MoodBoard from "./MoodBoard";
import UploadStage from "./UploadStage";

export type Phase =
  | "upload"
  | "project"
  | "vibe"
  | "color"
  | "theater"
  | "signup"
  | "concept"
  | "board";

export type FlowState = {
  entryPath: "quick" | "upload";
  industry: string;
  spec: string;
  vibe: string;
  picks: string[];
  paletteId: string;
};

const BUILD_PHASES: Phase[] = ["project", "vibe", "color"];

const PHASE_LABEL: Record<Phase, string> = {
  upload: "Step 01 · Upload",
  project: "Step 01 · Project",
  vibe: "Step 02 · Vibe",
  color: "Step 03 · Color",
  theater: "Generating",
  signup: "Step 04 · Sign in",
  concept: "Concept",
  board: "Mood board",
};

export default function FlowApp() {
  const params = useSearchParams();
  const entryPath = params.get("path") === "upload" ? "upload" : "quick";

  const [phase, setPhase] = useState<Phase>(
    entryPath === "upload" ? "upload" : "project",
  );
  const [state, setState] = useState<FlowState>({
    entryPath,
    industry: params.get("industry") ?? "",
    spec: params.get("spec") ?? "",
    vibe: params.get("vibe") ?? "",
    picks: [],
    paletteId: "",
  });

  const patch = (p: Partial<FlowState>) =>
    setState((prev) => ({ ...prev, ...p }));

  const isBuild = BUILD_PHASES.includes(phase);
  const buildIdx = BUILD_PHASES.indexOf(phase);

  // Whether the user can advance from the current build step (drives the
  // top-bar Continue button — the navigation now lives at the top).
  const canAdvance =
    phase === "project"
      ? !!state.industry && state.spec.trim().length >= 3
      : phase === "vibe"
        ? state.picks.length >= 3
        : true;

  function next() {
    setPhase((p) =>
      p === "project" ? "vibe" : p === "vibe" ? "color" : p === "color" ? "theater" : p,
    );
  }
  function back() {
    setPhase((p) =>
      p === "vibe" ? "project" : p === "color" ? "vibe" : p,
    );
  }

  return (
    <div className="min-h-screen bg-bg text-txt">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-[60px] items-center justify-between border-b border-bdr bg-[var(--nav-bg)] px-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center" aria-label="Fills.io home">
            <FillsLogo size={22} />
          </Link>
          <span className="hidden border border-acc px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-acc sm:inline-block">
            {PHASE_LABEL[phase]}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/"
            className="grid h-8 w-8 place-items-center border border-bdr-2 text-txt-2 transition hover:border-acc hover:text-acc"
            aria-label="Close"
          >
            ✕
          </Link>
        </div>
      </header>

      {/* Body */}
      {isBuild ? (
        <main className="mx-auto max-w-[1100px] px-6 pb-12">
          {/* Sticky top action bar — Back · progress · Continue (stays in
              view as you scroll the step). */}
          <div className="sticky top-[60px] z-30 -mx-6 mb-8 flex items-center justify-between gap-4 border-b border-bdr bg-[var(--nav-bg)] px-6 py-4 backdrop-blur-md">
            <button
              onClick={back}
              disabled={buildIdx === 0}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-txt-3 transition hover:text-acc disabled:opacity-30"
            >
              ← Back
            </button>

            <div className="flex items-center gap-3 sm:gap-4">
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-txt-3 sm:inline">
                Step {buildIdx + 1} of {BUILD_PHASES.length}
              </span>
              <div className="h-2 w-20 overflow-hidden rounded-full bg-bdr-2 sm:w-32">
                <div
                  className="h-full rounded-full bg-acc transition-[width] duration-500 ease-out"
                  style={{
                    width: `${((buildIdx + 1) / BUILD_PHASES.length) * 100}%`,
                  }}
                />
              </div>
              <button
                onClick={next}
                disabled={!canAdvance}
                className="inline-flex items-center gap-2 bg-acc px-6 py-2.5 text-[13px] font-medium text-white transition hover:gap-3 hover:bg-acc-h active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-bdr-2 disabled:text-txt-3 disabled:opacity-70"
              >
                Continue →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_300px]">
            <div key={phase} className="flow-stage-in">
              {phase === "project" && <ProjectStage state={state} patch={patch} />}
              {phase === "vibe" && <VibeStage state={state} patch={patch} />}
              {phase === "color" && <ColorStage state={state} patch={patch} />}
            </div>
            <LiveBrief state={state} />
          </div>
        </main>
      ) : (
        <div key={phase} className="flow-stage-in">
          {phase === "upload" ? (
            <UploadStage state={state} patch={patch} onContinue={() => setPhase("theater")} />
          ) : phase === "theater" ? (
            <Theater onDone={() => setPhase("signup")} />
          ) : phase === "signup" ? (
            <SignupGate state={state} onContinue={() => setPhase("concept")} />
          ) : phase === "concept" ? (
            <ConceptPage state={state} onCreateBoard={() => setPhase("board")} />
          ) : (
            <MoodBoard
              state={state}
              onAddSpace={() => setPhase(state.entryPath === "upload" ? "upload" : "project")}
            />
          )}
        </div>
      )}
    </div>
  );
}
