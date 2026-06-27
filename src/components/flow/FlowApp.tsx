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
          <Link href="/" className="flex items-center gap-3">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden>
              <rect x="2" y="2" width="11" height="11" rx="1" fill="#C8512A" />
              <rect x="15" y="2" width="11" height="5" rx="1" className="fill-txt" />
              <rect x="15" y="9" width="11" height="4" rx="1" className="fill-txt-3" />
              <rect x="2" y="15" width="5" height="11" rx="1" className="fill-txt-3" />
              <rect x="9" y="15" width="4" height="11" rx="1" fill="#C8512A" opacity="0.4" />
              <rect x="15" y="15" width="11" height="11" rx="1" className="fill-txt" />
            </svg>
            <span className="text-sm font-medium tracking-tight text-txt">
              Fills<b className="font-medium text-acc">.io</b>
            </span>
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
        <main className="mx-auto grid max-w-[1100px] grid-cols-1 gap-10 px-6 py-12 lg:grid-cols-[1fr_300px]">
          <div>
            {phase === "project" && (
              <ProjectStage state={state} patch={patch} onContinue={next} />
            )}
            {phase === "vibe" && (
              <VibeStage state={state} patch={patch} onContinue={next} />
            )}
            {phase === "color" && (
              <ColorStage state={state} patch={patch} onContinue={next} />
            )}

            {/* Build progress + back */}
            <div className="mt-10 flex items-center justify-between border-t border-bdr-2 pt-5">
              <button
                onClick={back}
                disabled={buildIdx === 0}
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-txt-3 transition hover:text-acc disabled:opacity-30"
              >
                ← Back
              </button>
              <div className="flex gap-1.5">
                {BUILD_PHASES.map((p, i) => (
                  <span
                    key={p}
                    className={`h-[3px] w-8 rounded-[1px] ${
                      i <= buildIdx ? "bg-acc" : "bg-bdr-2"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <LiveBrief state={state} />
        </main>
      ) : phase === "upload" ? (
        <UploadStage state={state} patch={patch} onContinue={() => setPhase("theater")} />
      ) : phase === "theater" ? (
        <Theater onDone={() => setPhase("signup")} />
      ) : phase === "signup" ? (
        <SignupGate onContinue={() => setPhase("concept")} />
      ) : phase === "concept" ? (
        <ConceptPage state={state} onCreateBoard={() => setPhase("board")} />
      ) : (
        <MoodBoard
          state={state}
          onAddSpace={() => setPhase(state.entryPath === "upload" ? "upload" : "project")}
        />
      )}
    </div>
  );
}
