"use client";

/**
 * AI-powered "Design check" banner shown at the top of the Review step.
 *
 * On mount, sends a summary of the user's wizard picks to
 * /api/ai/design-check and renders a senior-designer coherence
 * assessment in plain English. Verdict has three tones:
 *   - strong  — green accent, "this hangs together"
 *   - mixed   — amber accent, "mostly working, one tension worth a look"
 *   - off     — red accent, "these picks are pulling in different directions"
 *
 * Fail-safe: if the AI is unavailable, the banner silently falls back to
 * a neutral encouragement message. Never blocks the user from generating
 * their brief.
 */

import { useCallback, useEffect, useState } from "react";
import { getIndustry } from "@/lib/space-taxonomy";
import type { WizardState } from "@/lib/wizard-state";

type Props = {
  state: WizardState;
};

type DesignCheckResponse = {
  verdict: "strong" | "mixed" | "off";
  headline: string;
  observations: string;
};

export default function DesignCheckBanner({ state }: Props) {
  const [result, setResult] = useState<DesignCheckResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("loading");

  const runCheck = useCallback(async () => {
    setStatus("loading");

    // Build the lean payload — just titles/queries/palette, no full pin objects.
    const industry = state.industryId ? getIndustry(state.industryId) : null;
    const spaceLabel =
      industry?.spaces.find((s) => s.id === state.spaceId)?.label;

    const titleList = (pins?: { title?: string }[]) =>
      (pins ?? [])
        .map((p) => p.title?.trim())
        .filter((t): t is string => !!t && t.length > 0)
        .slice(0, 5);

    const body = {
      industry: industry?.label,
      space: spaceLabel,
      spaceDescription: state.spaceDescription,
      vibeQuery: state.vibeQuery,
      vibePinTitles: titleList(state.vibePins),
      palette: state.palette
        ?.filter((c) => c.name || c.material)
        .map((c) => ({
          hex: c.hex,
          name: c.name || undefined,
          material: c.material || undefined,
        })),
      furnitureQuery: state.furnitureQuery,
      furniturePinTitles: titleList(state.furniturePins),
      lightingPinTitles: titleList(state.lightingPins),
      flooringPinTitles: titleList(state.flooringPins),
      ceilingPinTitles: titleList(state.ceilingPins),
      materialsPinTitles: titleList(state.materialsPins),
    };

    try {
      const response = await fetch("/api/ai/design-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as DesignCheckResponse;
      setResult(data);
      setStatus("idle");
    } catch {
      // AI unavailable — keep the page useful, no error banner.
      setResult(null);
      setStatus("error");
    }
  }, [state]);

  useEffect(() => {
    runCheck();
    // Only on mount — re-checking on every state change would burn tokens.
    // The user has a manual "Re-check" button below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Loading state — small thinking pill
  if (status === "loading") {
    return (
      <div className="border border-bdr-2 bg-bg-2 p-4">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-acc" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-txt-3">
            Reading your plan…
          </span>
        </div>
      </div>
    );
  }

  // Error / unavailable — render nothing (don't block the user)
  if (status === "error" || !result) {
    return null;
  }

  const VERDICT_STYLES = {
    strong: {
      label: "Strong plan",
      ring: "border-emerald-700/50 bg-emerald-950/20",
      chip: "text-emerald-300",
      dot: "bg-emerald-400",
    },
    mixed: {
      label: "Worth a second look",
      ring: "border-amber-700/50 bg-amber-950/20",
      chip: "text-amber-300",
      dot: "bg-amber-400",
    },
    off: {
      label: "Pulling in different directions",
      ring: "border-rose-700/50 bg-rose-950/20",
      chip: "text-rose-300",
      dot: "bg-rose-400",
    },
  } as const;

  const style = VERDICT_STYLES[result.verdict];

  return (
    <div className={`border p-5 backdrop-blur-sm ${style.ring}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
          <span
            className={`font-mono text-[10px] uppercase tracking-[0.18em] ${style.chip}`}
          >
            Design check · {style.label}
          </span>
        </div>
        <button
          type="button"
          onClick={runCheck}
          className="font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3 transition hover:text-acc"
        >
          ↻ Re-check
        </button>
      </div>

      <h3 className="mt-3 font-serif text-[18px] leading-tight text-txt">
        {result.headline}
      </h3>

      <p className="mt-3 text-[13px] leading-relaxed text-txt-2">
        {result.observations}
      </p>
    </div>
  );
}
