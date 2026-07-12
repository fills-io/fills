"use client";

/**
 * Wizard progress — all 9 steps shown as an icon rail so the user always sees
 * exactly where they are and what's left. The current step is highlighted,
 * completed steps are filled and clickable (jump back), upcoming steps are
 * muted. A precise "Step N of 9 · Label" line sits underneath.
 */

import {
  WIZARD_STEPS,
  type WizardStep,
  type WizardStepId,
} from "@/lib/wizard-steps";

const svg = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ICONS: Record<WizardStepId, React.ReactNode> = {
  space: (
    <svg {...svg} aria-hidden>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <path d="M3.5 14a6.5 6.5 0 0 0 6.5-6.5" />
    </svg>
  ),
  vibe: (
    <svg {...svg} aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8" cy="9" r="1.3" />
      <path d="M4 17l4.5-4.5L12 16l3-3 5 5" />
    </svg>
  ),
  colors: (
    <svg {...svg} aria-hidden>
      <path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2 0-1.3-1-1.6-1-2.6 0-.8.7-1.4 1.6-1.4H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8Z" />
      <circle cx="7.5" cy="11" r="1" />
      <circle cx="12" cy="7.5" r="1" />
      <circle cx="16.5" cy="11" r="1" />
    </svg>
  ),
  furniture: (
    <svg {...svg} aria-hidden>
      <path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" />
      <path d="M4 12a2 2 0 0 1 2 2v3h12v-3a2 2 0 0 1 2-2 2 2 0 0 1 0 4v3M4 16v3" />
      <path d="M6 11h12" />
    </svg>
  ),
  lighting: (
    <svg {...svg} aria-hidden>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.2 1 2.5h6c0-1.3.3-1.8 1-2.5A6 6 0 0 0 12 3Z" />
    </svg>
  ),
  flooring: (
    <svg {...svg} aria-hidden>
      <rect x="3.5" y="5" width="17" height="14" rx="1" />
      <path d="M3.5 9.5h17M3.5 14.5h17M9 5v4.5M15 9.5v5M9 14.5V19" />
    </svg>
  ),
  ceiling: (
    <svg {...svg} aria-hidden>
      <path d="M3 5h18" />
      <path d="M5 5l2.5 4M12 5v4M19 5l-2.5 4" />
      <path d="M4 9h16" />
    </svg>
  ),
  materials: (
    <svg {...svg} aria-hidden>
      <path d="M12 3 3 7.5 12 12l9-4.5L12 3Z" />
      <path d="M3 12.5 12 17l9-4.5M3 16.5 12 21l9-4.5" />
    </svg>
  ),
  review: (
    <svg {...svg} aria-hidden>
      <path d="M4 12.5 9 17.5 20 6.5" />
    </svg>
  ),
};

export default function WizardProgress({
  current,
  onJump,
  steps = WIZARD_STEPS,
}: {
  current: WizardStepId;
  onJump?: (id: WizardStepId) => void;
  /** The steps actually shown (Quick mode shows a shorter list). */
  steps?: readonly WizardStep[];
}) {
  const currentIdx = steps.findIndex((s) => s.id === current) + 1; // 1-based
  const total = steps.length;

  return (
    <div className="border-b border-bdr-2 bg-bg-2 px-3 py-4 backdrop-blur-sm sm:px-8">
      <div className="mx-auto flex max-w-3xl items-center">
        {steps.map((s, i) => {
          const stepNum = i + 1;
          const state =
            stepNum < currentIdx
              ? "done"
              : stepNum === currentIdx
                ? "current"
                : "upcoming";
          const clickable = state === "done" && !!onJump;
          return (
            <div key={s.id} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onJump?.(s.id)}
                aria-current={state === "current" ? "step" : undefined}
                title={`${stepNum}. ${s.label}`}
                className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border transition duration-200 sm:h-9 sm:w-9 ${
                  state === "done"
                    ? "border-acc bg-acc text-white"
                    : state === "current"
                      ? "border-acc bg-bg text-acc ring-2 ring-acc/30"
                      : "border-bdr-2 bg-bg text-txt-3"
                } ${
                  clickable
                    ? "cursor-pointer hover:scale-110 hover:bg-acc-h hover:text-white active:scale-95"
                    : "cursor-default"
                }`}
              >
                {ICONS[s.id]}
              </button>
              {/* Connector to the next node */}
              {i < total - 1 && (
                <span
                  aria-hidden
                  className={`h-[2px] flex-1 transition-colors duration-300 ${
                    stepNum < currentIdx ? "bg-acc" : "bg-bg-3"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Precise step counter */}
      <div className="mx-auto mt-3 max-w-3xl text-center font-mono text-[9px] uppercase tracking-[0.16em] text-txt-3">
        Step {currentIdx} of {total} ·{" "}
        <span className="text-acc">{steps[currentIdx - 1]?.label}</span>
      </div>
    </div>
  );
}
