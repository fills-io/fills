"use client";

/**
 * Stage 3 — Palette. Pulled from the picks' real pixels, laid into one
 * connected bar with block widths ∝ dominance and a role per block
 * (Dominant → Support). Each block can be locked, edited (OS colour picker),
 * or eyedropper-sampled. "Regenerate unlocked" refreshes the rest.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { extractPalette } from "@/lib/extract-colors";
import { paletteRole, QUICK_PALETTE_SIZE, type QuickState } from "@/lib/quick-state";
import type { ColorEntry } from "@/db/schema";

type Props = {
  state: QuickState;
  patch: (p: Partial<QuickState>) => void;
};

type EyeDropperResult = { sRGBHex: string };
interface EyeDropperInstance {
  open: () => Promise<EyeDropperResult>;
}
interface EyeDropperConstructor {
  new (): EyeDropperInstance;
}

function readableText(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "#2a2a28";
  const n = parseInt(m[1], 16);
  const lum =
    0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return lum > 150 ? "#2a2a28" : "#f4f2ec";
}

function toEntry(hex: string): ColorEntry {
  return { hex, name: "", material: "" };
}

export default function PaletteStage({ state, patch }: Props) {
  const [busy, setBusy] = useState<"idle" | "extracting" | "suggesting">("idle");
  const [error, setError] = useState<string | null>(null);
  const [supportsEyedropper, setSupportsEyedropper] = useState(false);
  const lastPickKey = useRef<string | null>(null);

  const urls = useMemo(
    () => state.picks.map((p) => p.imageUrl).filter(Boolean),
    [state.picks],
  );
  const fallback = useMemo(
    () =>
      state.picks
        .map((p) => p.dominantColor?.trim())
        .filter((c): c is string => !!c && /^#[0-9a-f]{6}$/i.test(c)),
    [state.picks],
  );

  useEffect(() => {
    // Feature-detect after mount so SSR and first client render agree.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupportsEyedropper(
      typeof window !== "undefined" && "EyeDropper" in window,
    );
  }, []);

  async function extractInto(keepLocked: boolean) {
    setBusy("extracting");
    setError(null);
    try {
      const result = await extractPalette(urls, QUICK_PALETTE_SIZE, fallback);
      const palette: ColorEntry[] = [];
      const weights: number[] = [];
      for (let i = 0; i < QUICK_PALETTE_SIZE; i++) {
        const locked = keepLocked && state.locks[i] && state.palette[i];
        palette.push(locked ? state.palette[i] : toEntry(result[i]?.hex ?? "#c8a882"));
        weights.push(
          locked ? state.paletteWeights[i] ?? 0.2 : result[i]?.weight ?? 0.2,
        );
      }
      patch({
        palette,
        paletteWeights: weights,
        // Keep locks only when refreshing in place; a fresh extract resets them.
        locks:
          keepLocked && state.locks.length
            ? state.locks
            : Array(QUICK_PALETTE_SIZE).fill(false),
      });
    } catch {
      setError("Couldn't read colours from the images — edit them by hand below.");
    } finally {
      setBusy("idle");
    }
  }

  // Re-derive the palette whenever the picked set changes (and on first
  // arrival) — so it never lags behind the images the user has selected.
  const pickKey = state.picks.map((p) => p.id).join("|");
  useEffect(() => {
    if (lastPickKey.current === pickKey) return;
    lastPickKey.current = pickKey;
    if (state.picks.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      extractInto(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickKey]);

  /** A fresh harmonised set (Colormind) for the unlocked slots; locked stay.
   *  The route returns one colour per slot, mapped 1:1 so nothing duplicates. */
  async function suggestUnlocked() {
    setBusy("suggesting");
    setError(null);
    try {
      const res = await fetch(`/api/colors/generate`);
      const data = (await res.json()) as
        | { palette: string[] }
        | { ok: false; error: string };
      if ("ok" in data && data.ok === false) throw new Error(data.error);
      const sug = "palette" in data ? data.palette : [];
      const palette = state.palette.map((c, i) =>
        state.locks[i] ? c : toEntry(sug[i] ?? c.hex),
      );
      patch({ palette });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("idle");
    }
  }

  function setHex(i: number, hex: string) {
    patch({ palette: state.palette.map((c, idx) => (idx === i ? toEntry(hex) : c)) });
  }
  function toggleLock(i: number) {
    patch({ locks: state.locks.map((l, idx) => (idx === i ? !l : l)) });
  }
  async function sample(i: number) {
    const Ctor = (window as unknown as { EyeDropper?: EyeDropperConstructor })
      .EyeDropper;
    if (!Ctor) return;
    try {
      const { sRGBHex } = await new Ctor().open();
      setHex(i, sRGBHex);
    } catch {
      /* cancelled */
    }
  }

  const grow = (i: number) => Math.max(state.paletteWeights[i] ?? 0.2, 0.09);

  return (
    <section className="border-t border-bdr pt-10">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
        03 · Colour system
      </div>
      <h2 className="font-serif text-[clamp(24px,3vw,36px)] font-normal leading-[1.1] tracking-tight text-txt">
        Your palette, from your images
      </h2>
      <p className="mt-3 max-w-xl font-serif text-[16px] italic leading-relaxed text-txt-2">
        Widths show how dominant each colour is. Lock the ones you love, then
        regenerate or fine-tune the rest.
      </p>

      {error && (
        <div className="mt-5 border border-amber-800/40 bg-amber-950/20 p-3 text-[12px] text-amber-200">
          {error}
        </div>
      )}

      {/* The bar */}
      <div className="mt-6 flex h-32 w-full overflow-hidden rounded-xl border border-bdr-2 lg:h-40">
        {state.palette.map((c, i) => {
          const text = readableText(c.hex);
          const locked = state.locks[i];
          return (
            <div
              key={i}
              className="group relative min-w-0 border-r border-bg-2 last:border-r-0"
              style={{ flexGrow: grow(i), flexBasis: 0, backgroundColor: c.hex }}
            >
              <input
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(c.hex) ? c.hex : "#000000"}
                onChange={(e) => setHex(i, e.target.value)}
                aria-label={`Edit ${paletteRole(i)} colour`}
                className="absolute inset-0 z-0 h-full w-full cursor-pointer opacity-0"
              />

              {/* Controls */}
              <div className="absolute right-1.5 top-1.5 z-20 flex gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLock(i);
                  }}
                  aria-label={locked ? "Unlock colour" : "Lock colour"}
                  className={`grid h-6 w-6 place-items-center rounded-full text-[11px] ${
                    locked ? "bg-txt text-white" : "bg-black/25 text-white"
                  }`}
                >
                  {locked ? "🔒" : "🔓"}
                </button>
                {supportsEyedropper && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      sample(i);
                    }}
                    aria-label={`Eyedropper for ${paletteRole(i)}`}
                    className="grid h-6 w-6 place-items-center rounded-full bg-black/25 text-white"
                    style={{ color: text }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M4 20l1.5-.4L15 10" />
                      <path d="M13.5 6.5l4 4" />
                      <path d="M15.5 4.5a2.1 2.1 0 0 1 3 3L16.5 9.5l-3-3 2-2Z" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Role + hex */}
              <div
                className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex flex-col items-center gap-0.5 px-1 text-center"
                style={{ color: text }}
              >
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] opacity-80">
                  {paletteRole(i)}
                </span>
                <span className="font-mono text-[10px] uppercase lg:text-[11px]">
                  {c.hex.toUpperCase()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => extractInto(true)}
          disabled={busy !== "idle" || urls.length === 0}
          className="border border-bdr-2 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-txt-2 transition hover:border-acc hover:text-acc disabled:opacity-50"
        >
          {busy === "extracting" ? "Reading…" : "Regenerate from images"}
        </button>
        <button
          type="button"
          onClick={suggestUnlocked}
          disabled={busy !== "idle" || state.palette.length === 0}
          className="border border-acc px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-acc transition hover:bg-acc hover:text-white disabled:opacity-50"
        >
          {busy === "suggesting" ? "Generating…" : "Regenerate unlocked →"}
        </button>
      </div>
    </section>
  );
}
