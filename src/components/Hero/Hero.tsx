import ConceptBuilder from "./ConceptBuilder";
import HeroDrafting from "./HeroDrafting";
import HeroImageGrid from "./HeroImageGrid";
import HeroDots from "./HeroDots";

/**
 * Hero — cream "architectural drafting" treatment (ported from v40).
 *
 * Theme-aware: cream surface in light mode, warm-graphite in dark mode
 * (follows the global --bg token, unlike the old always-dark hero).
 * Background carries a faint dotted lattice; the margins carry drafting
 * marks (dimension band, scale, north arrow, A-A callouts) via HeroDrafting.
 */
export default function Hero() {
  return (
    <section className="relative min-h-[780px] overflow-hidden border-b border-bdr bg-bg px-6 pb-12 pt-10 sm:px-8">
      {/* Interactive sketchbook dot grid — light mode, reacts to cursor */}
      <HeroDots />

      {/* Soft halo behind the headline — fades the dots out so the text
          reads clean and sits on a calm focal area. Background-colored, so
          it adapts to light/dark. Above the dots, below the content. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background:
            "radial-gradient(ellipse 42% 32% at 50% 33%, var(--bg) 32%, transparent 68%)",
        }}
      />

      {/* Architectural margin drafting marks (light mode) */}
      <HeroDrafting />

      {/* Bracketed scene squares (dark mode) */}
      <HeroImageGrid />

      {/* Corner ticks */}
      <span className="absolute left-3.5 top-3.5 z-10 font-mono text-[9px] uppercase tracking-[0.1em] text-txt-3">
        FILLS · A-001
      </span>
      <span className="absolute right-3.5 top-3.5 z-10 font-mono text-[9px] uppercase tracking-[0.1em] text-txt-3">
        v0.1
      </span>
      <span className="absolute bottom-3.5 left-3.5 z-10 font-mono text-[9px] uppercase tracking-[0.1em] text-txt-3">
        HERO · 01
      </span>
      <span className="absolute bottom-3.5 right-3.5 z-10 font-mono text-[9px] uppercase tracking-[0.1em] text-txt-3">
        ↑ N
      </span>

      {/* Center stage */}
      <div className="relative z-10 mx-auto flex max-w-[780px] flex-col items-center pt-14 text-center">
        {/* Eyebrow pill */}
        <span className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-bdr-2 bg-bg-2 px-3.5 py-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-acc" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-txt-2">
            Interior · Architecture · Design
          </span>
        </span>

        {/* Headline */}
        <h1 className="mb-4 font-serif text-[clamp(40px,5.4vw,64px)] font-normal leading-[0.98] tracking-tight text-txt">
          Design your space.
          <br />
          <span className="italic text-txt-2">Built like</span>{" "}
          <span className="italic text-acc">architecture.</span>
        </h1>

        {/* Subhead */}
        <p className="mx-auto mb-10 max-w-[520px] text-sm font-light leading-relaxed text-txt-2">
          Where interior design and architecture meet a faster way to brief.
          A complete editorial mood board with palette, materials, lighting,
          and furniture, ready in five minutes.
        </p>

        {/* Concept builder with tabs */}
        <ConceptBuilder />
      </div>
    </section>
  );
}
