/**
 * LiveBrief — the sticky right sidebar that shows the brief as it's built.
 *
 * Reflects the user's running choices (industry, spec, vibe, picks, palette)
 * across the build stages. Theme-aware.
 */

import { getPalette } from "@/lib/concept-palettes";
import type { FlowState } from "./FlowApp";

export default function LiveBrief({ state }: { state: FlowState }) {
  const palette = getPalette(state.paletteId);
  const rows: { label: string; value: string | null }[] = [
    { label: "Industry", value: state.industry || null },
    { label: "Specifically", value: state.spec || null },
    { label: "Vibe", value: state.vibe || null },
  ];

  return (
    <aside className="sticky top-6 hidden h-fit border border-bdr-2 bg-bg-2 p-6 lg:block">
      <div className="mb-5 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-acc">
        <span className="inline-block h-px w-5 bg-acc" />
        Live brief
      </div>

      <dl className="space-y-4">
        {rows.map((r) => (
          <div key={r.label}>
            <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
              {r.label}
            </dt>
            <dd
              className={`mt-1 font-serif text-[15px] ${
                r.value ? "text-txt" : "italic text-txt-3 opacity-60"
              }`}
            >
              {r.value || "—"}
            </dd>
          </div>
        ))}
      </dl>

      {/* Picks thumbnails */}
      {state.picks.length > 0 && (
        <div className="mt-5 border-t border-bdr-2 pt-4">
          <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
            References · {state.picks.length}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {state.picks.map((p) => (
              <span
                key={p}
                className="h-8 w-8 border border-bdr-2 bg-bg-3"
                title={p}
              />
            ))}
          </div>
        </div>
      )}

      {/* Palette preview */}
      {palette && (
        <div className="mt-5 border-t border-bdr-2 pt-4">
          <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
            Palette · {palette.label}
          </div>
          <div className="flex h-7 overflow-hidden border border-bdr-2">
            {palette.colors.map((c, i) => (
              <span key={i} className="flex-1" style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
