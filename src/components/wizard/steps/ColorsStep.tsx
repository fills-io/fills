"use client";

/**
 * Step 3 — Colours.
 *
 * The palette is pulled straight from the images you picked: on arrival we read
 * the real colours out of those pins' pixels and lay them into one connected
 * bar, each block sized by how dominant that colour is. Tap a colour to change
 * it, use the eyedropper, or "Suggest a palette" for a harmonised set.
 *
 * No naming fields, no proportional preview, no room matcher — just the colours,
 * simply. (Those were removed per direct product feedback.)
 */

import { useEffect, useMemo, useRef, useState } from "react";
import PaletteBar from "@/components/wizard/PaletteBar";
import { extractPalette } from "@/lib/extract-colors";
import { pinAt } from "@/lib/pin-image";
import type { ColorEntry } from "@/db/schema";
import type { WizardState } from "@/lib/wizard-state";

type Props = {
  state: WizardState;
  setState: (patch: Partial<WizardState>) => void;
};

const PALETTE_SIZE = 6;
const DEFAULT_HEXES = [
  "#c8c3bb",
  "#b9a797",
  "#8c987d",
  "#b79d85",
  "#a48d6e",
  "#5e6b4f",
];

function toEntries(hexes: string[]): ColorEntry[] {
  const out: ColorEntry[] = [];
  for (let i = 0; i < PALETTE_SIZE; i++) {
    out.push({ hex: hexes[i] ?? DEFAULT_HEXES[i], name: "", material: "" });
  }
  return out;
}

function hexesOf(palette?: ColorEntry[]): string[] {
  const hx = (palette ?? []).map((c) => c.hex);
  for (let i = hx.length; i < PALETTE_SIZE; i++) hx.push(DEFAULT_HEXES[i]);
  return hx.slice(0, PALETTE_SIZE);
}

/** Lighten (t>0) / darken (t<0) a hex by fraction t. */
function shadeHex(hex: string, t: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const nv = t >= 0 ? v + (255 - v) * t : v * (1 + t);
    return Math.max(0, Math.min(255, Math.round(nv)));
  });
  return "#" + ch.map((v) => v.toString(16).padStart(2, "0")).join("");
}

/** Pad a short list of hexes up to a full palette with light/dark variants. */
function padTo6(hexes: string[]): string[] {
  const out = [...hexes];
  const deltas = [0.2, -0.2, 0.35, -0.35];
  let d = 0;
  while (out.length < PALETTE_SIZE && hexes.length > 0) {
    out.push(shadeHex(hexes[out.length % hexes.length], deltas[d % deltas.length]));
    d++;
  }
  for (let i = out.length; i < PALETTE_SIZE; i++) out.push(DEFAULT_HEXES[i]);
  return out.slice(0, PALETTE_SIZE);
}

export default function ColorsStep({ state, setState }: Props) {
  const vibePins = useMemo(
    () => (state.vibePins ?? []).filter((p) => p.imageUrl),
    [state.vibePins],
  );
  const dominantFallback = useMemo(
    () =>
      vibePins
        .map((p) => p.dominantColor?.trim())
        .filter((c): c is string => !!c && /^#[0-9a-f]{6}$/i.test(c)),
    [vibePins],
  );

  const colors = hexesOf(state.palette);
  const [busy, setBusy] = useState<"idle" | "extracting" | "suggesting">("idle");
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  async function runExtract() {
    setBusy("extracting");
    setError(null);
    try {
      const result = await extractPalette(
        vibePins.map((p) => p.imageUrl),
        PALETTE_SIZE,
        dominantFallback,
      );
      setState({
        palette: toEntries(result.map((c) => c.hex)),
        paletteWeights: result.map((c) => c.weight),
      });
    } catch {
      setError(
        "Couldn't read colours from the images — you can still pick them by hand below.",
      );
      if (!state.palette) {
        setState({
          palette: toEntries(
            dominantFallback.length ? padTo6(dominantFallback) : DEFAULT_HEXES,
          ),
          paletteWeights: undefined,
        });
      }
    } finally {
      setBusy("idle");
    }
  }

  // Auto-fill from the picked images the first time we land here, if untouched.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (state.palette && state.palette.length > 0) return;
    // One-time seed from the picked images (kicks off async extraction).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (vibePins.length > 0) runExtract();
    else setState({ palette: toEntries(DEFAULT_HEXES), paletteWeights: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Colormind palette, seeded from a couple of the current colours. */
  async function suggest() {
    setBusy("suggesting");
    setError(null);
    try {
      const seed = colors.slice(0, 2);
      const q = seed.length
        ? `?locked=${encodeURIComponent(seed.join(","))}`
        : "";
      const res = await fetch(`/api/colors/generate${q}`);
      const data = (await res.json()) as
        | { palette: string[] }
        | { ok: false; error: string };
      if ("ok" in data && data.ok === false) throw new Error(data.error);
      if (!("palette" in data)) throw new Error("Unexpected response.");
      // A harmonised suggestion has no per-colour dominance, so show it evenly.
      setState({
        palette: toEntries(padTo6(data.palette)),
        paletteWeights: undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("idle");
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-[14px] text-txt-2">
        Your palette, pulled from the images you picked. Tap a colour to change
        it, use the eyedropper, or generate a harmonised set.
      </p>

      {error && (
        <div className="border border-amber-800/40 bg-amber-950/20 p-3 text-[12px] text-amber-200">
          {error}
        </div>
      )}

      {/* Provenance + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {vibePins.slice(0, 6).map((p, i) => (
            <div
              key={p.id || i}
              className="h-9 w-9 shrink-0 overflow-hidden rounded-md border border-bdr-2"
            >
              {/* 36px provenance chips. 474 rather than the size-matched 236
                  because the Vibe step's grid loaded these exact URLs at 474
                  a moment ago — the chip comes out of cache. */}
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
          {vibePins.length > 0 && (
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-txt-3">
              {busy === "extracting" ? "Reading colours…" : "From your images"}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {vibePins.length > 0 && (
            <button
              onClick={runExtract}
              disabled={busy !== "idle"}
              className="border border-bdr-2 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-txt-2 transition hover:border-acc hover:text-acc disabled:opacity-50"
            >
              {busy === "extracting" ? "Reading…" : "Rebuild from images"}
            </button>
          )}
          <button
            onClick={suggest}
            disabled={busy !== "idle"}
            className="border border-acc px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-acc transition hover:bg-acc hover:text-white disabled:opacity-50"
          >
            {busy === "suggesting" ? "Generating…" : "Suggest a palette →"}
          </button>
        </div>
      </div>

      {/* The one connected bar — blocks sized by dominance, clear divisions */}
      <PaletteBar
        colors={colors}
        weights={state.paletteWeights}
        onChange={(hexes) => setState({ palette: toEntries(hexes) })}
      />
    </div>
  );
}
