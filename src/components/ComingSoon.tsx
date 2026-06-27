/**
 * Coming Soon — the holding page shown at fills.io while the product is
 * being redesigned. Intentionally minimal: a wordmark, a single sentence
 * of positioning, and a small "in private build" notice.
 *
 * Visual language matches the rest of the app — dark surface (the hero
 * "dark even in light mode" pattern), terracotta accent, architectural
 * sheet stamps in the corners.
 *
 * Mount-in animation: the elements arrive in sequence over ~2s, giving
 * a sense of a drawing being assembled. Each logo tile fades in with a
 * subtle scale, then the wordmark + headline + subhead + status pill +
 * contact line follow. Pure CSS — no JS, no extra deps.
 */

export default function ComingSoon() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-dark px-8 py-12">
      {/* Inline keyframes — kept local to this component so they don't pollute the
          global stylesheet for the rest of the app. */}
      <style>{`
        @keyframes cs-fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cs-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cs-tile-in {
          from { opacity: 0; transform: scale(0.6); }
          to   { opacity: 1; transform: scale(1); }
        }
        .cs-fade-up {
          opacity: 0;
          animation: cs-fade-up 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .cs-fade-in {
          opacity: 0;
          animation: cs-fade-in 0.9s ease forwards;
        }
        .cs-tile {
          opacity: 0;
          transform-origin: center;
          animation: cs-tile-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .cs-fade-up, .cs-fade-in, .cs-tile {
            opacity: 1;
            animation: none;
            transform: none;
          }
        }
      `}</style>

      {/* Subtle grid background — matches the hero on the real site */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(232,196,176,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(232,196,176,0.035) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Architectural sheet stamps */}
      <span className="cs-fade-in absolute left-4 top-4 font-mono text-[9px] uppercase tracking-[0.18em] text-hero-dim" style={{ animationDelay: "0.3s" }}>
        FILLS · A-001
      </span>
      <span className="cs-fade-in absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.18em] text-hero-dim" style={{ animationDelay: "0.3s" }}>
        IN PRIVATE BUILD
      </span>
      <span className="cs-fade-in absolute bottom-4 left-4 font-mono text-[9px] uppercase tracking-[0.18em] text-hero-dim" style={{ animationDelay: "0.3s" }}>
        © 2026 FILLS LTD
      </span>
      <span className="cs-fade-in absolute bottom-4 right-4 font-mono text-[9px] uppercase tracking-[0.18em] text-hero-dim" style={{ animationDelay: "0.3s" }}>
        FILLS.IO
      </span>

      {/* Center stage */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[680px] flex-col items-center justify-center text-center">
        {/* Eyebrow */}
        <span
          className="cs-fade-up mb-10 inline-flex items-center gap-2.5 rounded-full border border-dark-3 bg-[rgba(45,40,35,0.6)] px-3.5 py-1.5 backdrop-blur"
          style={{ animationDelay: "0.1s" }}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-acc" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-hero-cream-2">
            Interior · Architecture · Design
          </span>
        </span>

        {/* Wordmark — logo tiles arrive in sequence, then the "Fills.io" text */}
        <div className="mb-3 flex items-center gap-3">
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-label="Fills logo">
            <rect className="cs-tile" style={{ animationDelay: "0.25s" }} x="2" y="2" width="11" height="11" rx="1" fill="#C8512A" />
            <rect className="cs-tile" style={{ animationDelay: "0.33s" }} x="15" y="2" width="11" height="5" rx="1" fill="#f0eae2" />
            <rect className="cs-tile" style={{ animationDelay: "0.41s" }} x="15" y="9" width="11" height="4" rx="1" fill="#8b7e72" />
            <rect className="cs-tile" style={{ animationDelay: "0.49s" }} x="2" y="15" width="5" height="11" rx="1" fill="#8b7e72" />
            <rect className="cs-tile" style={{ animationDelay: "0.57s" }} x="9" y="15" width="4" height="11" rx="1" fill="#C8512A" opacity="0.4" />
            <rect className="cs-tile" style={{ animationDelay: "0.65s" }} x="15" y="15" width="11" height="11" rx="1" fill="#f0eae2" />
          </svg>
          <span
            className="cs-fade-up font-serif text-[28px] tracking-tight text-hero-cream"
            style={{ animationDelay: "0.7s" }}
          >
            Fills<b className="font-medium text-acc">.io</b>
          </span>
        </div>

        {/* Headline */}
        <h1
          className="cs-fade-up mb-6 font-serif text-[clamp(36px,5vw,56px)] font-normal leading-[1.05] tracking-tight text-hero-cream"
          style={{ animationDelay: "0.9s" }}
        >
          The mood board,{" "}
          <span className="italic text-acc">reimagined</span>
          <br />
          <span className="italic text-hero-cream-2">for designers.</span>
        </h1>

        {/* Subhead */}
        <p
          className="cs-fade-up mx-auto mb-10 max-w-[460px] text-[15px] leading-relaxed text-hero-cream-2"
          style={{ animationDelay: "1.15s" }}
        >
          A new tool for interior designers and architects. Palette,
          materials, lighting, furniture, all in five minutes. Currently in
          private build with a small group of designers.
        </p>

        {/* Status pill */}
        <div
          className="cs-fade-up inline-flex items-center gap-3 border border-acc/30 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-acc"
          style={{ animationDelay: "1.4s" }}
        >
          <span className="inline-block h-px w-6 bg-acc" />
          Public launch · later this year
        </div>

        {/* Contact line */}
        <p
          className="cs-fade-up mt-10 font-mono text-[10px] uppercase tracking-[0.18em] text-hero-dim"
          style={{ animationDelay: "1.6s" }}
        >
          For collaborations or early access ·{" "}
          <a
            href="mailto:aisha@fills.io"
            className="text-hero-cream-2 underline-offset-4 transition hover:text-acc hover:underline"
          >
            aisha@fills.io
          </a>
        </p>
      </div>
    </main>
  );
}
