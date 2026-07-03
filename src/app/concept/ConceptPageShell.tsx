"use client";

/**
 * Concept page shell — the visible content of `/concept`.
 *
 * Renders one of three intro panels based on `?mode=`:
 *   - "quick"  — echo the user's industry/spec/vibe back as a confirmation
 *   - "studio" — invite them into the full 9-step wizard
 *   - "upload" — prompt to drop a reference image
 *
 * The actual wizard UI lives in Phase 4. For now this is a placeholder that:
 *   - Confirms the data made it across from the homepage (debuggable)
 *   - Sets the visual frame for the wizard to plug into later
 *   - Has a clear "back to start" path
 */

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Mode = "quick" | "studio" | "upload";

function isMode(v: string | null): v is Mode {
  return v === "quick" || v === "studio" || v === "upload";
}

export default function ConceptPageShell() {
  const params = useSearchParams();
  const rawMode = params.get("mode");
  const mode: Mode = isMode(rawMode) ? rawMode : "quick";

  return (
    <main className="mx-auto max-w-4xl px-6 py-20 sm:px-8 sm:py-28">
      {/* Header — mode chip + headline */}
      <div className="mb-3 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-acc">
        <span className="inline-block h-px w-6 bg-acc" />
        {mode === "quick" && "Quick brief"}
        {mode === "studio" && "Full studio"}
        {mode === "upload" && "From image"}
      </div>

      <h1 className="font-serif text-[clamp(36px,5vw,56px)] font-normal leading-[1.05] tracking-tight text-hero-cream">
        {mode === "quick" && (
          <>
            Your brief is <em className="text-acc">on its way</em>.
          </>
        )}
        {mode === "studio" && (
          <>
            The full studio, <em className="text-acc">your call</em>.
          </>
        )}
        {mode === "upload" && (
          <>
            Show us, we&apos;ll <em className="text-acc">read it</em>.
          </>
        )}
      </h1>

      {/* Mode-specific intro body */}
      <div className="mt-10 border border-dark-3 bg-[rgba(34,30,24,0.6)] p-8 backdrop-blur-sm">
        {mode === "quick" && <QuickIntro />}
        {mode === "studio" && <StudioIntro />}
        {mode === "upload" && <UploadIntro />}
      </div>

      {/* Primary CTA into the wizard */}
      <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href={`/concept/wizard?${params.toString()}`}
          className="inline-flex items-center gap-2 bg-acc px-7 py-3.5 text-sm font-medium text-white transition hover:gap-3 hover:bg-acc-h"
        >
          Start the wizard →
        </Link>
      </div>

      {/* Footnote + back link */}
      <div className="mt-10 flex flex-col items-start gap-4 border-t border-dark-3 pt-8 font-mono text-[10px] uppercase tracking-[0.14em] text-hero-dim sm:flex-row sm:items-center sm:justify-between">
        <span>Wizard shell · individual steps land over the next PRs</span>
        <Link
          href="/"
          className="text-hero-cream-2 transition hover:text-acc"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}

/* ─── Mode-specific intros ──────────────────────────────────────────────── */

function QuickIntro() {
  const params = useSearchParams();
  const industry = params.get("industry") ?? "";
  const spec = params.get("spec") ?? "";
  const vibe = params.get("vibe") ?? "";

  const anyFilled = industry || spec || vibe;

  if (!anyFilled) {
    return (
      <p className="text-[15px] leading-relaxed text-hero-cream-2">
        You came here without picking an industry, space, or vibe. Once the
        wizard is live, this page will walk you through the three quick prompts
        and then auto-fill the remaining design dimensions for you.
      </p>
    );
  }

  return (
    <>
      <p className="font-serif text-[clamp(20px,2.2vw,24px)] leading-[1.85] tracking-tight text-hero-cream-2">
        You&apos;re working on a{" "}
        <em className="not-italic text-acc-2">{industry || "—"}</em> project, a{" "}
        <em className="not-italic text-acc-2">{spec || "—"}</em> that feels like{" "}
        <em className="not-italic text-acc-2">{vibe || "—"}</em>.
      </p>

      <p className="mt-6 text-[14px] leading-relaxed text-hero-dim">
        We received your starting direction. When the wizard goes live, this is
        where you&apos;ll see Pinterest-driven boards for vibe, color, materials,
        lighting, and furniture, auto-built around the three things above, then
        analyzed into a complete Design DNA brief.
      </p>

      {/* Debug echo of the raw query params — useful while we wire things up */}
      <details className="mt-8 text-[11px] text-hero-dim">
        <summary className="cursor-pointer font-mono uppercase tracking-[0.14em] hover:text-acc">
          Show raw inputs
        </summary>
        <ul className="mt-3 space-y-1 pl-4 font-mono">
          <li>industry: {industry || "(empty)"}</li>
          <li>spec: {spec || "(empty)"}</li>
          <li>vibe: {vibe || "(empty)"}</li>
        </ul>
      </details>
    </>
  );
}

function StudioIntro() {
  return (
    <>
      <p className="text-[15px] leading-relaxed text-hero-cream-2">
        Full Studio walks you through nine design dimensions: vibe and style,
        colors and palette, furniture, lighting, flooring, ceiling, materials
        and textures, plus space details and a review.
      </p>
      <p className="mt-4 text-[15px] leading-relaxed text-hero-cream-2">
        You stay in control of every decision. The AI helps with compatibility
        checks and search suggestions, but doesn&apos;t auto-fill anything.
        Expect about 10 minutes for a client-ready brief.
      </p>
      <ul className="mt-6 grid grid-cols-1 gap-2 text-[12px] text-hero-dim sm:grid-cols-3">
        {[
          "9 design dimensions",
          "Multi-zone authoring",
          "Designer handoff",
        ].map((item) => (
          <li
            key={item}
            className="border border-dark-3 px-3 py-2 font-mono uppercase tracking-[0.1em]"
          >
            {item}
          </li>
        ))}
      </ul>
    </>
  );
}

function UploadIntro() {
  return (
    <>
      <p className="text-[15px] leading-relaxed text-hero-cream-2">
        From Image starts from a visual reference — a photo of a space you love,
        a moodboard scrap, or a render. The AI reads the image and proposes the
        style, palette, materials, and furniture direction it implies.
      </p>
      <p className="mt-4 text-[15px] leading-relaxed text-hero-cream-2">
        You&apos;ll then review and adjust before the full brief is generated.
      </p>
      <div className="mt-6 grid place-items-center border-2 border-dashed border-dark-3 px-6 py-10 text-center">
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          className="text-hero-dim"
        >
          <path
            d="M16 20V8M16 8l-5 5M16 8l5 5M6 22v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="mt-3 text-[13px] text-hero-cream-2">
          Image upload activates when Vercel Blob storage is wired up
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-hero-dim">
          Coming in Phase 4 · JPG, PNG · up to 10 MB
        </p>
      </div>
    </>
  );
}
