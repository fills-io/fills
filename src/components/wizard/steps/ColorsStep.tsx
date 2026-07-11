"use client";

/**
 * Step 3 — Colors & Palette.
 *
 * Three compact bands so it reads without endless scrolling:
 *   A) "From your vibe pins" — the images you picked, each with its dominant
 *      colour as a clickable swatch (drops into the focused/first-empty slot).
 *   B) A compact 4-across palette editor (Primary/Secondary/Accent/Supporting).
 *   C) A live proportional preview + a "Rooms with these colours" strip, whose
 *      images are matched to the palette by colour and refresh on every change
 *      (including after "Suggest a palette").
 */

import { useMemo, useState } from "react";
import ColorPaletteBuilder, {
  PALETTE_SLOTS,
  PalettePreview,
} from "@/components/wizard/ColorPaletteBuilder";
import { CURATED_PINS, CURATED_VIBE, type CuratedPin } from "@/data/reference-images";
import type { ColorEntry } from "@/db/schema";
import type { WizardState } from "@/lib/wizard-state";

type Props = {
  state: WizardState;
  setState: (patch: Partial<WizardState>) => void;
};

/** Default starting palette — pulled from the warm-cream/terracotta theme. */
function defaultPalette(): ColorEntry[] {
  return PALETTE_SLOTS.map((slot) => ({
    hex: slot.defaultHex,
    name: "",
    material: "",
  }));
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function dist(a: number[], b: number[]): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

export default function ColorsStep({ state, setState }: Props) {
  const palette = useMemo(
    () => state.palette ?? defaultPalette(),
    [state.palette],
  );
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [focusedSlot, setFocusedSlot] = useState<number | null>(null);

  const vibePins = (state.vibePins ?? []).filter((p) => p.imageUrl);
  const vibeColors = vibePins
    .map((p) => p.dominantColor?.trim())
    .filter((c): c is string => !!c && /^#[0-9a-f]{6}$/i.test(c));

  /** Drop a colour into the focused slot, else the first unnamed slot. */
  function assignColor(hex: string) {
    const empty = palette.findIndex((s) => !s.name.trim());
    const target = focusedSlot ?? (empty >= 0 ? empty : 0);
    setState({
      palette: palette.map((s, i) => (i === target ? { ...s, hex } : s)),
    });
  }

  /** Fill every unnamed slot from the vibe pins' dominant colours. */
  function pullFromVibe() {
    if (vibeColors.length === 0) return;
    setState({
      palette: palette.map((slot, i) =>
        slot.name.trim() ? slot : vibeColors[i] ? { ...slot, hex: vibeColors[i] } : slot,
      ),
    });
  }

  async function suggestPalette() {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const locked = palette
        .map((c) => (c.name.trim() ? c.hex : null))
        .filter((v): v is string => v !== null);
      const q = locked.length > 0 ? `?locked=${locked.join(",")}` : "";
      const response = await fetch(`/api/colors/generate${q}`);
      const data = (await response.json()) as
        | { palette: string[] }
        | { ok: false; error: string };
      if ("ok" in data && data.ok === false) throw new Error(data.error);
      if (!("palette" in data)) {
        throw new Error("Unexpected response from /api/colors/generate");
      }
      setState({
        palette: palette.map((slot, i) =>
          slot.name.trim() ? slot : { ...slot, hex: data.palette[i] ?? slot.hex },
        ),
      });
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setErrorMessage(e instanceof Error ? e.message : String(e));
    }
  }

  // Rooms whose dominant colour is nearest one of the palette colours.
  const roomSet =
    (state.industryId && CURATED_VIBE[state.industryId]) || CURATED_PINS.vibe;
  const matchedRooms = useMemo(() => {
    const paletteRgb = palette
      .map((c) => hexToRgb(c.hex))
      .filter((v): v is [number, number, number] => !!v);
    if (!paletteRgb.length) return [];
    const scored = roomSet
      .map((p) => {
        const rgb = p.dominantColor ? hexToRgb(p.dominantColor) : null;
        return rgb
          ? { p, best: Math.min(...paletteRgb.map((pr) => dist(pr, rgb))) }
          : null;
      })
      .filter((s): s is { p: CuratedPin; best: number } => s !== null)
      .sort((a, b) => a.best - b.best);
    const seen = new Set<string>();
    const out: CuratedPin[] = [];
    for (const s of scored) {
      if (!seen.has(s.p.imageUrl)) {
        seen.add(s.p.imageUrl);
        out.push(s.p);
        if (out.length >= 6) break;
      }
    }
    return out;
  }, [roomSet, palette]);

  return (
    <div className="space-y-5">
      <p className="text-[14px] text-txt-2">
        Build your colours in four roles. What you write here feeds into the
        final design plan.
      </p>

      {status === "error" && (
        <div className="border border-red-900/40 bg-red-950/30 p-3 text-[12px] text-red-200">
          Suggestion failed: {errorMessage}
        </div>
      )}

      {/* Band A — from your vibe pins */}
      <div className="border border-bdr-2 bg-bg-2 p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
            From your vibe pins
          </h3>
          <div className="flex flex-wrap gap-2">
            {vibeColors.length > 0 && (
              <button
                onClick={pullFromVibe}
                className="border border-bdr-2 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-txt-2 transition hover:border-acc hover:text-acc"
              >
                Auto-fill all
              </button>
            )}
            <button
              onClick={suggestPalette}
              disabled={status === "loading"}
              className="border border-acc px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-acc transition hover:bg-acc hover:text-white disabled:opacity-50"
            >
              {status === "loading" ? "Generating…" : "Suggest a palette →"}
            </button>
          </div>
        </div>

        {vibePins.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-6 lg:overflow-visible">
            {vibePins.map((p, i) => {
              const dc =
                p.dominantColor && hexToRgb(p.dominantColor)
                  ? p.dominantColor
                  : null;
              return (
                <div key={p.id || i} className="w-24 shrink-0 lg:w-auto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.imageUrl.replace("/736x/", "/474x/")}
                    alt=""
                    loading="lazy"
                    className="aspect-[3/4] w-full border border-bdr-2 object-cover"
                  />
                  {dc ? (
                    <button
                      onClick={() => assignColor(dc)}
                      title={`Use ${dc}. Focus a colour slot first to choose where it goes.`}
                      className="mt-1 flex h-5 w-full items-center justify-center border border-bdr-2 transition hover:ring-2 hover:ring-inset hover:ring-acc"
                      style={{ backgroundColor: dc }}
                    >
                      <span className="font-mono text-[8px] text-white mix-blend-difference">
                        {dc.toUpperCase()}
                      </span>
                    </button>
                  ) : (
                    <div className="mt-1 h-5 w-full border border-dashed border-bdr-2" />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[12px] text-txt-3">
            No vibe pins picked yet. Tap &ldquo;Suggest a palette&rdquo; to start.
          </p>
        )}
      </div>

      {/* Band B — compact editor */}
      <div>
        <ColorPaletteBuilder
          palette={palette}
          onChange={(next) => setState({ palette: next })}
          onFocusSlot={setFocusedSlot}
        />
        <p className="mt-2 text-[11px] text-txt-3">
          Click a swatch to pick a colour, or tap a vibe swatch above to drop it
          into the focused slot. Naming a slot locks it from &ldquo;Suggest.&rdquo;
        </p>
      </div>

      {/* Band C — preview + rooms with these colours */}
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <PalettePreview palette={palette} />
        <div className="border border-bdr-2 bg-bg-2 p-3">
          <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
            Rooms with these colours
          </h3>
          {matchedRooms.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {matchedRooms.map((p, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={p.id || i}
                  src={p.imageUrl.replace("/736x/", "/474x/")}
                  alt=""
                  loading="lazy"
                  className="aspect-[4/3] w-full border border-bdr-2 object-cover"
                />
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-txt-3">
              Set a palette to see rooms in these colours.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
