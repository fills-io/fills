"use client";

/**
 * Step 9 — Review.
 *
 * A read-only summary of everything the user has picked across the previous
 * eight steps. Each section has an "Edit" link that jumps the wizard back
 * to that step.
 *
 * The big primary CTA on this page lives on the parent (WizardClient)'s nav
 * bar — when the user is on the review step, "Next →" is replaced with
 * "Generate brief →" and the AI generation pipeline takes over (in a later
 * PR). For now that CTA is wired up but disabled.
 */

import { getIndustry } from "@/lib/space-taxonomy";
import type { WizardState } from "@/lib/wizard-state";
import type { WizardStepId } from "@/lib/wizard-steps";
import type { ColorEntry, PinterestPin } from "@/db/schema";
import DesignCheckBanner from "@/components/wizard/DesignCheckBanner";

type Props = {
  state: WizardState;
  /** Jump back to a specific step (rendered as "Edit" links in each section). */
  goToStep: (id: WizardStepId) => void;
};

export default function ReviewStep({ state, goToStep }: Props) {
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

  return (
    <div className="space-y-8">
      <p className="text-[14px] text-txt-2">
        One last look. If anything is off, jump back to that step and adjust.
        Nothing is locked in until you generate the plan.
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
        <PinThumbStrip pins={state.vibePins ?? []} />
      </ReviewSection>

      {/* Colors */}
      <ReviewSection
        label="Colors"
        onEdit={() => goToStep("colors")}
        isEmpty={!state.palette || state.palette.length === 0}
      >
        <ColorSwatchRow palette={state.palette ?? []} />
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
          {/* Furniture */}
          <ReviewSection
            label="Furniture"
            onEdit={() => goToStep("furniture")}
            isEmpty={
              (state.furnitureSubSections ?? []).reduce(
                (sum, s) => sum + (s.pins?.length ?? 0),
                0,
              ) === 0
            }
          >
            <PinThumbStrip
              pins={(state.furnitureSubSections ?? []).flatMap(
                (s) => s.pins ?? [],
              )}
            />
          </ReviewSection>

          {/* Lighting */}
          <ReviewSection
            label="Lighting"
            onEdit={() => goToStep("lighting")}
            isEmpty={(state.lightingPins?.length ?? 0) === 0}
          >
            <PinThumbStrip pins={state.lightingPins ?? []} />
          </ReviewSection>

          {/* Flooring */}
          <ReviewSection
            label="Flooring"
            onEdit={() => goToStep("flooring")}
            isEmpty={(state.flooringPins?.length ?? 0) === 0}
          >
            <PinThumbStrip pins={state.flooringPins ?? []} />
          </ReviewSection>

          {/* Ceiling */}
          <ReviewSection
            label="Ceiling"
            onEdit={() => goToStep("ceiling")}
            isEmpty={(state.ceilingPins?.length ?? 0) === 0}
          >
            <PinThumbStrip pins={state.ceilingPins ?? []} />
          </ReviewSection>

          {/* Materials */}
          <ReviewSection
            label="Materials"
            onEdit={() => goToStep("materials")}
            isEmpty={(state.materialsPins?.length ?? 0) === 0}
          >
            <PinThumbStrip pins={state.materialsPins ?? []} />
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
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
          {label}
        </h2>
        {onEdit && (
          <button
            onClick={onEdit}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-txt-2 transition hover:text-acc"
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

function PinThumbStrip({ pins }: { pins: PinterestPin[] }) {
  if (pins.length === 0) return null;
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {pins.map((pin) => (
        <div
          key={pin.id}
          className="aspect-square overflow-hidden border border-bdr-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pin.imageUrl}
            alt={pin.altText || pin.title || "Pin"}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}

function ColorSwatchRow({ palette }: { palette: ColorEntry[] }) {
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
  return (
    <div className="flex h-16 w-full overflow-hidden rounded-lg border border-bdr-2">
      {palette.map((c, i) => (
        <div
          key={i}
          className="relative flex-1"
          style={{ backgroundColor: c.hex }}
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
