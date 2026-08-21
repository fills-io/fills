"use client";

/**
 * The locked deck — what someone sees before they've paid.
 *
 * Built from the brief's OWN data rather than a rasterised PDF: the cover is
 * the real cover, the spreads behind it are the real spreads, just blurred.
 * That keeps it honest (they're seeing what they'd get), keeps it crisp on
 * every screen, and needs no image pipeline.
 *
 * ON SCREENSHOTS: you cannot block them. There is no browser API for it, and
 * a phone camera defeats anything that existed. So the protection isn't
 * stopping the screenshot — it's that a screenshot of THIS is a blurred,
 * watermarked, low-resolution page, while the thing being sold is a ten-page
 * 1440x810 document. The real file is only ever built server-side, behind
 * checkEntitlement().
 */

import { useState } from "react";
import type { GenerateBriefResponse } from "@/lib/ai/prompts/generate-brief";
import type { BriefPins } from "./BriefDisplay";

type Props = {
  brief: GenerateBriefResponse;
  pins?: BriefPins;
  briefToken: string;
};

/** Pinterest serves the same asset at several widths off the same path. */
function thumb(url: string | undefined, width: "236x" | "474x") {
  return url?.replace(/\/\d+x\//, `/${width}/`);
}

function Watermark() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
    >
      <span className="rotate-[-24deg] whitespace-nowrap font-mono text-[13px] uppercase tracking-[0.4em] text-white/70 sm:text-[18px]">
        Fills preview · Fills preview
      </span>
    </div>
  );
}

export default function PaywallPreview({ brief, pins, briefToken }: Props) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"brief" | "pass" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cover =
    pins?.vibe?.[0]?.imageUrl ?? pins?.materials?.[0]?.imageUrl ?? undefined;
  const spreads = [
    ...(pins?.materials ?? []),
    ...(pins?.furniture ?? []),
    ...(pins?.lighting ?? []),
  ].slice(0, 9);

  async function buy(product: "brief" | "pass") {
    if (!email.trim()) {
      setError("Add your email so we know where to send it.");
      return;
    }
    setBusy(product);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, briefToken, email: email.trim() }),
      });
      const data = (await res.json()) as { ok: boolean; redirectUrl?: string; error?: string };
      if (!data.ok || !data.redirectUrl) {
        throw new Error(data.error || "Couldn't start that purchase.");
      }
      window.location.href = data.redirectUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(null);
    }
  }

  return (
    <section className="border border-bdr bg-bg-2">
      {/* The cover, sharp — this is the part that has to earn the money */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#1a1714]">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb(cover, "474x")}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
        )}
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
          <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/70">
            {brief.summary.projectType}
          </div>
          <h2 className="mt-3 max-w-[18ch] font-serif text-[clamp(24px,4.5vw,44px)] font-normal leading-[1.05] text-white">
            {brief.conceptLine}
          </h2>
        </div>
      </div>

      {/* Everything behind it, blurred */}
      <div className="relative border-t border-bdr-2 p-4 sm:p-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {spreads.map((pin, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${pin.id}-${i}`}
              src={thumb(pin.imageUrl || pin.imageThumbUrl, "236x")}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="aspect-[4/3] w-full scale-105 object-cover blur-[6px] sm:blur-[8px]"
            />
          ))}
        </div>
        <Watermark />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg-2 to-transparent" />
      </div>

      {/* The ask */}
      <div className="border-t border-bdr-2 p-6 sm:p-8">
        <h3 className="font-serif text-[20px] font-normal text-txt">
          Nine more pages, yours to send.
        </h3>
        <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-txt-2">
          The full deck at presentation size: every reference, the colour
          system, materials and finishes. Hand it to a designer, a contractor,
          or a landlord.
        </p>

        <label className="mt-6 block">
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-txt-3">
            Your email
          </span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            maxLength={200}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-2 block w-full max-w-sm border border-bdr-2 bg-bg p-3 text-[16px] text-txt placeholder:text-txt-3 focus:border-acc focus:outline-none"
          />
          <span className="mt-1.5 block text-[12px] text-txt-3">
            No account, no password. We use it to send your deck and let you
            back in later.
          </span>
        </label>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => buy("brief")}
            disabled={busy !== null}
            className="border border-bdr-2 px-5 py-4 text-left transition hover:border-acc disabled:opacity-60"
          >
            <span className="block font-serif text-[22px] text-txt">$9</span>
            <span className="mt-1 block text-[13px] text-txt-2">
              {busy === "brief" ? "One moment…" : "This brief. Yours forever."}
            </span>
          </button>

          <button
            type="button"
            onClick={() => buy("pass")}
            disabled={busy !== null}
            className="border-2 border-acc bg-acc px-5 py-4 text-left text-white transition hover:bg-acc-h disabled:opacity-60"
          >
            <span className="block font-serif text-[22px]">$19</span>
            <span className="mt-1 block text-[13px] text-white/85">
              {busy === "pass"
                ? "One moment…"
                : "Every room, 30 days. Downloads stay yours."}
            </span>
          </button>
        </div>

        {error && (
          <p className="mt-4 text-[13px] text-rose-600 dark:text-rose-400">{error}</p>
        )}
      </div>
    </section>
  );
}
