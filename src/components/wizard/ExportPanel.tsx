"use client";

/**
 * ExportPanel — PDF download controls shown on the generated brief page.
 *
 * Lets the user pick orientation (portrait/landscape), optionally upload
 * a logo to brand the cover page, then download a magazine-style PDF.
 *
 * PDF generation is fully client-side via @react-pdf/renderer.pdf().
 * The blob is materialized and triggered as a browser download — no
 * server round-trip, no temporary file storage.
 */

import { useRef, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import BriefPDF, { type BriefFacts } from "./BriefPDF";
import type { GenerateBriefResponse } from "@/lib/ai/prompts/generate-brief";
import type { BriefPins } from "./BriefDisplay";

type Format = "deck" | "document";

type Props = {
  brief: GenerateBriefResponse;
  pins?: BriefPins;
  facts?: BriefFacts;
};

export default function ExportPanel({ brief, pins, facts }: Props) {
  const [format, setFormat] = useState<Format>("deck");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoName, setLogoName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Logo must be an image (PNG, JPG, SVG).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Logo must be under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoDataUrl(reader.result as string);
      setLogoName(file.name);
    };
    reader.onerror = () => setError("Couldn't read that file. Try another.");
    reader.readAsDataURL(file);
  }

  function clearLogo() {
    setLogoDataUrl(null);
    setLogoName(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const blob = await pdf(
        <BriefPDF
          brief={brief}
          pins={pins}
          facts={facts}
          format={format}
          logoDataUrl={logoDataUrl}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      // Name it after the project, not a truncated concept line, so a client
      // can tell what the file is from the filename alone.
      const slug = brief.summary.projectType
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .split("-")
        .slice(0, 5)
        .join("-");
      const date = new Date().toISOString().slice(0, 10);
      anchor.download = `fills-brief-${slug || "design"}-${date}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border border-bdr bg-bg-2 p-6">
      <h2 className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
        Export as PDF
      </h2>
      <p className="mb-5 text-[13px] leading-relaxed text-txt-2">
        A brief you can send straight to a designer or contractor: the concept,
        colour system with applications, materials and finishes, furniture,
        the lighting plan, layout notes, and every reference image.
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Format */}
        <div>
          <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
            Format
          </div>
          <div className="flex gap-2">
            {(
              [
                ["deck", "Presentation"],
                ["document", "A4 document"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFormat(id)}
                className={`flex-1 border px-3 py-2 text-[12px] uppercase tracking-[0.1em] transition ${
                  format === id
                    ? "border-acc bg-acc text-white"
                    : "border-bdr-2 text-txt-2 hover:border-acc hover:text-acc"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Logo upload */}
        <div>
          <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
            Logo (optional)
          </div>
          {logoDataUrl ? (
            <div className="flex items-center gap-3 border border-bdr-2 px-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoDataUrl}
                alt="Logo preview"
                className="h-8 w-auto max-w-[80px] object-contain"
              />
              <span className="flex-1 truncate text-[12px] text-txt-2">
                {logoName}
              </span>
              <button
                type="button"
                onClick={clearLogo}
                className="font-mono text-[10px] uppercase tracking-[0.1em] text-txt-3 transition hover:text-acc"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-center border border-dashed border-bdr-2 px-3 py-2 text-[12px] text-txt-2 transition hover:border-acc hover:text-acc">
              <span>Choose image</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onLogoChange}
              />
            </label>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-3 text-[12px] text-rose-600 dark:text-rose-400">{error}</p>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={download}
          disabled={busy}
          className="inline-flex items-center gap-2 bg-acc px-6 py-3 text-[12px] font-medium uppercase tracking-[0.1em] text-white transition hover:gap-3 hover:bg-acc-h disabled:cursor-not-allowed disabled:opacity-70"
        >
          {busy ? "Building your PDF…" : "↓ Download PDF"}
        </button>
      </div>
    </section>
  );
}
