"use client";

/**
 * UploadStage — the Upload entry path. Drop/browse 3–5 reference images
 * (real FileReader thumbnails), then an optional industry context, then
 * continue (converges to the theater). Theme-aware.
 */

import { useRef, useState } from "react";
import { INDUSTRIES } from "@/lib/concept-taxonomy";
import type { FlowState } from "./FlowApp";

const MAX = 5;
const REC_MIN = 3;

export default function UploadStage({
  state,
  patch,
  onContinue,
}: {
  state: FlowState;
  patch: (p: Partial<FlowState>) => void;
  onContinue: () => void;
}) {
  const [images, setImages] = useState<{ name: string; url: string }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const room = MAX - images.length;
    Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, room)
      .forEach((f) => {
        const reader = new FileReader();
        reader.onload = () =>
          setImages((prev) =>
            prev.length >= MAX ? prev : [...prev, { name: f.name, url: reader.result as string }],
          );
        reader.readAsDataURL(f);
      });
  }

  const ready = images.length >= 1;

  return (
    <main className="mx-auto max-w-[720px] px-6 py-12">
      <div className="mb-2 flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-txt-3">
        <span className="inline-block h-px w-4 bg-txt-3" />
        01 · Upload
      </div>
      <h2 className="mb-2 font-serif text-[clamp(26px,3.4vw,38px)] font-normal leading-[1.1] tracking-tight text-txt">
        Upload your <em className="italic text-acc">inspiration</em>
      </h2>
      <p className="mb-7 max-w-[520px] text-[14px] leading-relaxed text-txt-2">
        Drop {REC_MIN} to {MAX} images: screenshots, moodboard exports, photos.
        We&apos;ll read palette, materials, lighting, and vibe across all of them.
      </p>

      {/* Dropzone */}
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 border-[1.5px] border-dashed p-10 text-center transition ${
          dragOver ? "border-acc bg-[rgba(200,81,42,0.05)]" : "border-bdr-2 bg-bg-2 hover:border-acc"
        }`}
      >
        <span className="grid h-11 w-11 place-items-center border border-bdr-2 text-txt-2">
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
            <path d="M11 15 L11 4 M6 9 L11 4 L16 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" />
            <path d="M3 14 L3 18 L19 18 L19 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" />
          </svg>
        </span>
        <span className="font-serif text-[17px] font-medium text-txt">
          Drop images or <em className="italic text-acc">browse</em>
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-txt-3">
          PNG · JPG · HEIC, up to {MAX}
        </span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </label>

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="mt-4">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {images.map((img, i) => (
              <div key={i} className="group relative aspect-[4/5] overflow-hidden border border-bdr-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.name} className="h-full w-full object-cover" />
                <button
                  onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute right-1 top-1 grid h-5 w-5 place-items-center bg-black/70 text-[10px] text-white opacity-0 transition group-hover:opacity-100"
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-txt-3">
            {images.length} of {MAX}
            {images.length < REC_MIN && (
              <span className="text-acc"> · {REC_MIN - images.length} more for best accuracy</span>
            )}
          </p>
        </div>
      )}

      {/* Optional context */}
      <div className="mt-8 border-t border-bdr-2 pt-6">
        <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
          02 · Context (optional)
        </div>
        <select
          value={state.industry}
          onChange={(e) => patch({ industry: e.target.value })}
          className="border border-bdr-2 bg-bg-2 px-4 py-3 text-[14px] text-txt outline-none focus:border-acc"
        >
          <option value="">What kind of space is this for?</option>
          {INDUSTRIES.map((i) => (
            <option key={i.id} value={i.label}>
              {i.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-9">
        <button
          onClick={onContinue}
          disabled={!ready}
          className="inline-flex items-center gap-2 bg-acc px-7 py-3.5 text-[13px] font-medium text-white transition hover:gap-3 hover:bg-acc-h disabled:cursor-not-allowed disabled:bg-bdr-2 disabled:text-txt-3 disabled:opacity-70"
        >
          Build from images →
        </button>
      </div>
    </main>
  );
}
