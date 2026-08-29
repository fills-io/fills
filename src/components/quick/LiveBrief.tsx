"use client";

/**
 * LiveBrief — the sticky right-hand panel that fills in as the user moves
 * through the Quick canvas (industry, spec, vibe, picks, palette), with the
 * primary "continue / generate" action that changes per stage.
 */

import { getIndustry } from "@/lib/concept-taxonomy";
import { pinAt } from "@/lib/pin-image";
import type { QuickState } from "@/lib/quick-state";

export type PrimaryAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  reason?: string | null;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-bdr py-2.5">
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
        {label}
      </span>
      <span className="text-right text-[13px] text-txt">{value}</span>
    </div>
  );
}

export default function LiveBrief({
  state,
  action,
}: {
  state: QuickState;
  action?: PrimaryAction | null;
}) {
  const ind = getIndustry(state.industryId);
  const isEmpty = !ind && !state.spec && state.picks.length === 0;

  return (
    <aside className="h-fit border border-bdr-2 bg-bg-2 p-5 lg:sticky lg:top-24">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-acc">
          Live brief
        </span>
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-acc" />
      </div>

      {isEmpty && (
        <p className="text-[13px] leading-relaxed text-txt-3">
          Your brief builds as you choose. Start with the industry.
        </p>
      )}

      {ind && <Row label="Industry" value={ind.label} />}
      {state.spec && <Row label="Specifically" value={state.spec} />}
      {state.vibeQuery && <Row label="Vibe" value={state.vibeQuery} />}

      {state.picks.length > 0 && (
        <div className="border-t border-bdr py-3">
          <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
            Picks ({state.picks.length}/5)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {state.picks.map((p, i) => (
              <div
                key={p.id || i}
                className="h-8 w-8 overflow-hidden border border-bdr"
              >
                {/* A 32px chip only needs 236, but the vibe grid beside it
                    has already fetched the 474 — reusing that URL is a cache
                    hit, a narrower one would be a fresh request per pick. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pinAt(p.imageUrl, 474)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {state.palette.length > 0 && (
        <div className="border-t border-bdr py-3">
          <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
            Palette
          </div>
          <div className="flex h-8 overflow-hidden rounded border border-bdr">
            {state.palette.map((c, i) => (
              <div
                key={i}
                style={{
                  flexGrow: Math.max(state.paletteWeights[i] ?? 0.2, 0.08),
                  flexBasis: 0,
                  backgroundColor: c.hex,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {action && (
        <>
          <button
            onClick={action.onClick}
            disabled={!!action.disabled}
            className="mt-4 flex w-full items-center justify-between gap-2 bg-acc px-4 py-3 text-[13px] font-medium text-white transition hover:bg-acc-h disabled:cursor-not-allowed disabled:bg-bdr-2 disabled:text-txt-3"
          >
            <span>{action.label}</span>
            <span aria-hidden>→</span>
          </button>
          {action.reason && action.disabled && (
            <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
              {action.reason}
            </p>
          )}
        </>
      )}
    </aside>
  );
}
