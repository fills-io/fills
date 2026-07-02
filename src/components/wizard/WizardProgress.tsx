"use client";

/**
 * Wizard progress — the 9 steps grouped into 4 readable phases:
 *   Space · Vibe · Build · Refine
 *
 * Each phase is an icon badge + label. The current phase is highlighted,
 * completed phases are filled and clickable (jump back to them), upcoming
 * phases are muted. Connectors fill in as you progress.
 */

import { WIZARD_STEPS, type WizardStepId, stepNumber } from "@/lib/wizard-steps";

const svg = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const SpaceIcon = (
  <svg {...svg} aria-hidden>
    <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
    <path d="M3.5 14a6.5 6.5 0 0 0 6.5-6.5" />
  </svg>
);
const VibeIcon = (
  <svg {...svg} aria-hidden>
    <rect x="3" y="7" width="12.5" height="12.5" rx="2" />
    <circle cx="7" cy="11" r="1.1" />
    <path d="M3.5 16.5 6.6 13.6 9.2 16" />
    <path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h9.5A1.5 1.5 0 0 1 21 5.5V15a1.5 1.5 0 0 1-1.5 1.5H16" />
  </svg>
);
const BuildIcon = (
  <svg {...svg} aria-hidden>
    <path d="M12 3 20.5 7.5 12 12 3.5 7.5Z" />
    <path d="M3.5 12 12 16.5 20.5 12" />
    <path d="M3.5 16.5 12 21 20.5 16.5" />
  </svg>
);
const RefineIcon = (
  <svg {...svg} aria-hidden>
    <path d="M4 12.5 9 17.5 20 6.5" />
    <path d="M17.6 15.8l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6Z" />
  </svg>
);

type Phase = {
  label: string;
  first: WizardStepId;
  steps: WizardStepId[];
  icon: React.ReactNode;
};

const PHASES: Phase[] = [
  { label: "Space", first: "space", steps: ["space"], icon: SpaceIcon },
  { label: "Vibe", first: "vibe", steps: ["vibe"], icon: VibeIcon },
  {
    label: "Build",
    first: "colors",
    steps: ["colors", "furniture", "lighting", "flooring", "ceiling", "materials"],
    icon: BuildIcon,
  },
  { label: "Refine", first: "review", steps: ["review"], icon: RefineIcon },
];

export default function WizardProgress({
  current,
  onJump,
}: {
  current: WizardStepId;
  onJump?: (id: WizardStepId) => void;
}) {
  const currentIdx = stepNumber(current);
  const currentPhase = PHASES.findIndex((p) => p.steps.includes(current));

  return (
    <div className="border-b border-bdr-2 bg-bg-2 px-5 py-4 backdrop-blur-sm sm:px-8">
      <div className="mx-auto flex max-w-2xl items-start">
        {PHASES.map((p, i) => {
          const state =
            i < currentPhase ? "done" : i === currentPhase ? "current" : "upcoming";
          const reached = i <= currentPhase;
          const clickable = i < currentPhase && !!onJump;

          return (
            <div
              key={p.label}
              className="relative flex flex-1 flex-col items-center"
            >
              {i > 0 && (
                <span
                  aria-hidden
                  className={`absolute right-1/2 top-[19px] z-0 h-[2px] w-full transition-colors duration-300 ${
                    reached ? "bg-acc" : "bg-bg-3"
                  }`}
                />
              )}
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onJump?.(p.first)}
                aria-current={state === "current" ? "step" : undefined}
                title={clickable ? `Back to ${p.label}` : p.label}
                className={`relative z-10 grid h-[38px] w-[38px] place-items-center rounded-full border transition duration-200 ${
                  state === "done"
                    ? "border-acc bg-acc text-white"
                    : state === "current"
                      ? "border-acc bg-bg text-acc ring-2 ring-acc/30"
                      : "border-bdr-2 bg-bg text-txt-3"
                } ${
                  clickable
                    ? "cursor-pointer hover:scale-110 hover:border-acc-h hover:bg-acc-h hover:text-white active:scale-95"
                    : "cursor-default"
                }`}
              >
                {p.icon}
              </button>
              <span
                className={`mt-2 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors ${
                  state === "current"
                    ? "text-acc"
                    : state === "done"
                      ? "text-txt-2"
                      : "text-txt-3"
                }`}
              >
                {p.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Precise step counter under the phases */}
      <div className="mx-auto mt-3 max-w-2xl text-center font-mono text-[9px] uppercase tracking-[0.16em] text-txt-3">
        Step {currentIdx} of {WIZARD_STEPS.length} · {WIZARD_STEPS[currentIdx - 1]?.label}
      </div>
    </div>
  );
}
